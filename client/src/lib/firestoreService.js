import { db } from "./firebase";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    increment,
} from "firebase/firestore";

// ─────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────

// Create user profile in Firestore if it doesn't exist
export async function syncUser(user) {
    if (!db || !user) return;
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            credits: 10,
            plan: "free",
            totalGenerations: 0,
            storageUsed: 0, // MB
            timeSaved: 0,   // Hours
            dailyCounts: {
                image: 0,
                chat: 0,
                resume: 0,
                story: 0
            },
            lastUsageDate: new Date().toISOString().split('T')[0],
            createdAt: serverTimestamp(),
        });
    }
}

// Get user profile + stats
export async function getUserProfile(uid) {
    if (!db) return null;
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
    };
}

// ─────────────────────────────────────────────
// GENERATIONS — Save & Read
// ─────────────────────────────────────────────

// Save a new generation and update user stats atomically
export async function saveGeneration({ uid, type, prompt, resultUrl = null, textContent = null, metadata = {}, creditCost, storageMB, timeSavedHrs }) {
    if (!db) return;

    const today = new Date().toISOString().split('T')[0];
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    let dailyCounts = userData?.dailyCounts || { image: 0, chat: 0, resume: 0, story: 0 };

    // Reset counts if it's a new day
    if (userData?.lastUsageDate !== today) {
        dailyCounts = { image: 0, chat: 0, resume: 0, story: 0 };
    }

    // Increment count for this type
    dailyCounts[type] = (dailyCounts[type] || 0) + 1;

    // 1. Add generation document
    await addDoc(collection(db, "generations"), {
        uid,
        type,          // 'image' | 'chat' | 'resume' | 'story'
        prompt,
        resultUrl,
        textContent,
        metadata: {
            ...metadata,
            serialized: true // Helper for future
        },
        createdAt: serverTimestamp(),
    });

    // 2. Update user stats in one atomic write
    await updateDoc(userRef, {
        credits: increment(-creditCost),
        totalGenerations: increment(1),
        storageUsed: increment(storageMB),
        timeSaved: increment(timeSavedHrs),
        dailyCounts: dailyCounts,
        lastUsageDate: today
    });
}

// Check if user has reached daily limits (Free Plan only)
export async function checkDailyLimit(uid, type) {
    if (!db) return { allowed: true };
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) return { allowed: true };
    const userData = snap.data();

    // Pro users have no daily limits based on type count (they use credits)
    if (userData.plan === 'pro') return { allowed: true };

    const today = new Date().toISOString().split('T')[0];
    let counts = userData.dailyCounts || { image: 0, chat: 0, resume: 0, story: 0 };

    // Reset if new day
    if (userData.lastUsageDate !== today) {
        return { allowed: true };
    }

    const limits = {
        image: 5,
        chat: 10,
        resume: 2,
        story: 2
    };

    const currentCount = counts[type] || 0;
    const limit = limits[type] || 1;

    if (currentCount >= limit) {
        return {
            allowed: false,
            message: `Free plan limit reached: ${limit} ${type}${limit > 1 ? 's' : ''} per day. Upgrade to Pro for more!`
        };
    }

    return { allowed: true };
}

// Get recent N generations for a user
export async function getRecentGenerations(uid, count = 5) {
    if (!db) return [];
    const q = query(
        collection(db, "generations"),
        where("uid", "==", uid),
        orderBy("createdAt", "desc"),
        limit(count)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        };
    });
}

// Check if user has enough credits
export async function hasCredits(uid, required) {
    const profile = await getUserProfile(uid);
    return profile && profile.credits >= required;
}

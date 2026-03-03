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
            credits: 999999, // Unlimited credits
            plan: "unlimited", // Premium plan for everyone
            totalGenerations: 0,
            storageUsed: 0,
            timeSaved: 0,
            dailyCounts: {
                image: 0,
                chat: 0,
                resume: 0,
                story: 0,
                emoji: 0
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

    let dailyCounts = userData?.dailyCounts || { image: 0, chat: 0, resume: 0, story: 0, emoji: 0 };

    // Reset counts if it's a new day
    if (userData?.lastUsageDate !== today) {
        dailyCounts = { image: 0, chat: 0, resume: 0, story: 0, emoji: 0 };
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

    // 2. Update user stats (Unlimited/Free - no credit decrement)
    await updateDoc(userRef, {
        totalGenerations: increment(1),
        storageUsed: increment(storageMB),
        timeSaved: increment(timeSavedHrs),
        dailyCounts: dailyCounts,
        lastUsageDate: today
    });
}

// Check if user has reached daily limits (Free Plan only)
export async function checkDailyLimit(uid, type) {
    return { allowed: true }; // Unlimited for everyone
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
    return true; // Always has credits in unlimited mode
}

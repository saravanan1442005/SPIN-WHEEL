import { useState, useEffect } from 'react';
import {
    doc,
    getDoc,
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from '../firebase';

// Hook to get couple data
export function useCouple(coupleId) {
    const [couple, setCouple] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!coupleId) {
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(
            doc(db, 'couples', coupleId),
            (doc) => {
                if (doc.exists()) {
                    setCouple({ id: doc.id, ...doc.data() });
                }
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching couple:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [coupleId]);

    return { couple, loading };
}

// Hook to manage snacks (real-time sync)
export function useSnacks(coupleId) {
    const [allSnacks, setAllSnacks] = useState([]);
    const [activeSnacks, setActiveSnacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!coupleId) {
            setLoading(false);
            return;
        }

        // Listen to snacks collection
        const snacksRef = collection(db, 'couples', coupleId, 'snacks');
        const unsubscribe = onSnapshot(
            snacksRef,
            (snapshot) => {
                const snacksData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setAllSnacks(snacksData);
                setActiveSnacks(snacksData.filter(s => s.active).map(s => s.id));
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching snacks:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [coupleId]);

    const addSnack = async (name, price, userId, userName) => {
        if (!coupleId) return;

        const snacksRef = collection(db, 'couples', coupleId, 'snacks');
        await addDoc(snacksRef, {
            name,
            price,
            active: true,
            createdBy: userId,
            createdByName: userName,
            createdAt: serverTimestamp()
        });
    };

    const toggleSnackActive = async (snackId, active) => {
        if (!coupleId) return;

        const snackRef = doc(db, 'couples', coupleId, 'snacks', snackId);
        await updateDoc(snackRef, { active });
    };

    const deleteSnack = async (snackId) => {
        if (!coupleId) return;

        const snackRef = doc(db, 'couples', coupleId, 'snacks', snackId);
        await deleteDoc(snackRef);
    };

    return {
        allSnacks,
        activeSnacks,
        loading,
        addSnack,
        toggleSnackActive,
        deleteSnack
    };
}

// Hook to manage spins with real-time updates
export function useSpins(coupleId, userId) {
    const [spins, setSpins] = useState([]);
    const [latestSpin, setLatestSpin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!coupleId) {
            setLoading(false);
            return;
        }

        // Listen to last 10 spins
        const spinsRef = collection(db, 'couples', coupleId, 'spins');
        const q = query(spinsRef, orderBy('timestamp', 'desc'), limit(10));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const spinsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setSpins(spinsData);

                // Check for new spin from partner
                if (spinsData.length > 0) {
                    const newest = spinsData[0];
                    if (newest.spinnedBy !== userId) {
                        setLatestSpin(newest);
                        // Clear after 5 seconds
                        setTimeout(() => setLatestSpin(null), 5000);
                    }
                }

                setLoading(false);
            },
            (error) => {
                console.error('Error fetching spins:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [coupleId, userId]);

    const addSpin = async (snackName, price, userId, userName) => {
        if (!coupleId) return;

        const spinsRef = collection(db, 'couples', coupleId, 'spins');
        await addDoc(spinsRef, {
            snackName,
            price,
            spinnedBy: userId,
            spinnedByName: userName,
            timestamp: serverTimestamp()
        });
    };

    return {
        spins,
        latestSpin,
        loading,
        addSpin
    };
}

// Hook to get partner info
export function usePartner(couple, currentUserId) {
    const [partner, setPartner] = useState(null);

    useEffect(() => {
        if (!couple || !currentUserId) {
            setPartner(null);
            return;
        }

        const isUser1 = couple.user1Id === currentUserId;
        setPartner({
            id: isUser1 ? couple.user2Id : couple.user1Id,
            name: isUser1 ? couple.user2Name : couple.user1Name,
            photo: isUser1 ? couple.user2Photo : couple.user1Photo
        });
    }, [couple, currentUserId]);

    return partner;
}

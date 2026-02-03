import { useState, useEffect, useRef } from 'react';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
import { Heart, PaperPlaneRight, User, ArrowLeft, EnvelopeSimple, CheckCircle, XCircle, UserPlus, X } from '@phosphor-icons/react';
import { db } from '../firebase';
import './CoupleConnection.css';

function CoupleConnection({ user, onConnected, isManageMode, onBack, currentCouple }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [invitations, setInvitations] = useState([]);
    const [sentInvites, setSentInvites] = useState([]);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // Listen for incoming friend requests
    useEffect(() => {
        if (!user?.uid) return;

        const q = query(collection(db, 'requests'), where('toUserId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = [];
            snapshot.forEach(doc => {
                reqs.push({ id: doc.id, ...doc.data() });
            });
            setInvitations(reqs);
        });

        // Also listen for sent invites to show status
        const qSent = query(collection(db, 'requests'), where('fromUserId', '==', user.uid));
        const unsubscribeSent = onSnapshot(qSent, (snapshot) => {
            const reqs = [];
            snapshot.forEach(doc => {
                reqs.push({ id: doc.id, ...doc.data() });
            });
            setSentInvites(reqs);
        });

        return () => {
            unsubscribe();
            unsubscribeSent();
        };
    }, [user]);

    // Check if I was accepted (via user profile update)
    useEffect(() => {
        if (!user?.uid) return;
        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.coupleId) {
                    if (isManageMode) {
                        // In manage mode, only redirect if we joined a NEW couple
                        if (currentCouple && data.coupleId !== currentCouple.coupleId) {
                            onConnected(data.coupleId);
                        }
                    } else {
                        // Initial load or not managing: always connect
                        onConnected(data.coupleId);
                    }
                }
            }
        });
        return () => unsubscribe();
    }, [user, onConnected, isManageMode, currentCouple]);

    const handleSendInvite = async () => {
        if (!email.trim()) {
            setError('Please enter an email address');
            return;
        }

        if (email.trim().toLowerCase() === user.email.toLowerCase()) {
            setError("You can't invite yourself!");
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            // 1. Find user by email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('User not found. Ask them to sign up first!');
                setLoading(false);
                return;
            }

            const targetUserDoc = querySnapshot.docs[0];
            const targetUser = targetUserDoc.data();

            if (targetUser.coupleId) {
                // Check if it's a real couple or solo? 
                // We'll assume if they have a coupleId they are "taken" or need to leave it first.
                // But wait, if they are "Solo", they have a coupleId too. 
                // We might need to check the couple doc.
                const coupleDoc = await getDoc(doc(db, 'couples', targetUser.coupleId));
                if (coupleDoc.exists()) {
                    const cData = coupleDoc.data();
                    if (cData.connected) {
                        setError('This user is already connected with someone.');
                        setLoading(false);
                        return;
                    }
                    // If not connected (Solo), they can receive invites!
                }
            }

            // 2. Check if request already exists
            const requestsRef = collection(db, 'requests');
            const qReq = query(requestsRef,
                where('fromUserId', '==', user.uid),
                where('toUserId', '==', targetUser.uid)
            );
            const reqSnap = await getDocs(qReq);

            if (!reqSnap.empty) {
                setError('You already sent an invite to this user.');
                setLoading(false);
                return;
            }

            // 3. Send Request
            await addDoc(collection(db, 'requests'), {
                fromUserId: user.uid,
                fromName: user.displayName,
                fromPhoto: user.photoURL,
                toUserId: targetUser.uid,
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            setSuccessMsg(`Invitation sent to ${targetUser.displayName}!`);
            setEmail('');
        } catch (err) {
            console.error('Error sending invite:', err);
            setError(`Failed to send: ${err.message}`);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    const handleAcceptInvite = async (request) => {
        setLoading(true);
        try {
            // Use batch for atomic updates
            const batch = writeBatch(db);

            // 1. Create Couple
            const coupleId = `couple_${Date.now()}`;
            const coupleRef = doc(db, 'couples', coupleId);
            batch.set(coupleRef, {
                coupleId,
                user1Id: request.fromUserId,
                user1Name: request.fromName,
                user1Photo: request.fromPhoto,
                user2Id: user.uid,
                user2Name: user.displayName,
                user2Photo: user.photoURL,
                createdAt: new Date().toISOString(),
                connected: true,
                connectedAt: new Date().toISOString()
            });

            // 2. Update Both Users
            batch.update(doc(db, 'users', user.uid), { coupleId });
            batch.update(doc(db, 'users', request.fromUserId), { coupleId });

            // 3. Delete Request
            batch.delete(doc(db, 'requests', request.id));

            // Commit all changes
            await batch.commit();

            // 4. Connect - handled by listener automatically when user doc updates
            // onConnected(coupleId);

        } catch (err) {
            console.error('Error accepting:', err);
            setError('Failed to connect.');
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    const handleDecline = async (reqId) => {
        try {
            await deleteDoc(doc(db, 'requests', reqId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleSkip = async () => {
        setLoading(true);
        try {
            const batch = writeBatch(db);

            // Create "Solo" couple
            const coupleId = `solo_${user.uid}_${Date.now()}`;
            const coupleRef = doc(db, 'couples', coupleId);

            batch.set(coupleRef, {
                coupleId,
                user1Id: user.uid,
                user1Name: user.displayName,
                user1Photo: user.photoURL,
                user2Id: null, // No partner
                createdAt: new Date().toISOString(),
                connected: false // Not connected to partner
            });

            batch.update(doc(db, 'users', user.uid), { coupleId });

            await batch.commit();
            // onConnected(coupleId); - handled by listener
        } catch (err) {
            console.error(err);
            setError('Failed to start solo.');
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    return (
        <div className="couple-connection-container">
            <div className="couple-connection-card">
                <div className="brand-header">
                    <div className="icon-badge">
                        <UserPlus size={48} weight="duotone" color="#667eea" />
                    </div>
                    <h2 className="couple-title">Add Partner</h2>
                    <p className="couple-subtitle">Connect by email or check invitations</p>
                </div>

                {/* --- SECTIONS --- */}

                {/* 1. Received Invitations */}
                {invitations.length > 0 && (
                    <div className="invitations-section">
                        <h3 className="section-header">💌 Invitations ({invitations.length})</h3>
                        <div className="invites-list">
                            {invitations.map(req => (
                                <div key={req.id} className="invite-card">
                                    <div className="invite-info">
                                        <img src={req.fromPhoto} alt={req.fromName} className="invite-avatar" />
                                        <div>
                                            <p className="invite-name">{req.fromName}</p>
                                            <p className="invite-status">wants to connect</p>
                                        </div>
                                    </div>
                                    <div className="invite-actions">
                                        <button onClick={() => handleAcceptInvite(req)} className="accept-btn" title="Accept">
                                            <CheckCircle size={32} weight="fill" color="#4caf50" />
                                        </button>
                                        <button onClick={() => handleDecline(req.id)} className="decline-btn" title="Decline">
                                            <XCircle size={32} weight="fill" color="#f5576c" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Send Invitation */}
                <div className="send-invite-section">
                    <div className="input-with-icon">
                        <EnvelopeSimple size={24} className="input-icon" />
                        <input
                            type="email"
                            placeholder="Partner's Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="email-search-input"
                        />
                    </div>

                    <button
                        onClick={handleSendInvite}
                        disabled={loading || !email}
                        className="send-invite-btn"
                    >
                        {loading ? 'Sending...' : 'Send Request'} <PaperPlaneRight weight="bold" />
                    </button>

                    {error && <div className="error-message">{error}</div>}
                    {successMsg && <div className="success-message"><CheckCircle size={20} /> {successMsg}</div>}
                </div>

                {/* 3. Sent Pending Requests */}
                {sentInvites.length > 0 && (
                    <div className="sent-list">
                        <p className="sent-label">Pending Requests:</p>
                        {sentInvites.map(req => (
                            <div key={req.id} className="sent-item">
                                <span>To: {req.toUserId} (Waiting...)</span>
                                <button onClick={() => handleDecline(req.id)} className="cancel-sent-btn">Cancel</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 4. Options (Solo / Back) */}
                <div className="footer-options">
                    {!isManageMode && (
                        <>
                            <div className="divider-line"></div>
                            <button onClick={handleSkip} className="text-link-btn">
                                Starting Solo? Click here
                            </button>
                        </>
                    )}

                    {isManageMode && (
                        <button onClick={onBack} className="back-button close-mode">
                            <X size={20} /> Close
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}

export default CoupleConnection;

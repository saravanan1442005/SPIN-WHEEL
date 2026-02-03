import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Heart, DiceFive, Link as LinkIcon, User, ArrowLeft, Copy, Lightbulb, X, Users, Alien } from '@phosphor-icons/react';
import { db } from '../firebase';
import './CoupleConnection.css';

function CoupleConnection({ user, onConnected, isManageMode, onBack, currentCouple }) {
    const [coupleCode, setCoupleCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('choose'); // 'choose', 'generate', 'enter'

    useEffect(() => {
        if (!isManageMode) {
            checkExistingConnection();
        } else if (currentCouple) {
            // Managing mode with existing couple
        }
    }, [user, isManageMode]);

    // Listen for real-time updates when waiting for partner
    useEffect(() => {
        if (!user?.uid || mode !== 'generate' || !generatedCode) {
            return;
        }

        // Get coupleId from user document
        const getUserCoupleId = async () => {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            return userDoc.exists() ? userDoc.data().coupleId : null;
        };

        getUserCoupleId().then(coupleId => {
            if (!coupleId) return;

            // Listen to couple document for connection status changes
            const unsubscribe = onSnapshot(
                doc(db, 'couples', coupleId),
                (coupleDoc) => {
                    if (coupleDoc.exists() && coupleDoc.data().connected) {
                        onConnected(coupleId);
                    }
                },
                (error) => {
                    console.error('Error listening to couple updates:', error);
                }
            );

            return () => unsubscribe();
        });
    }, [mode, generatedCode, user, onConnected]);

    const checkExistingConnection = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().coupleId) {
            const coupleDoc = await getDoc(doc(db, 'couples', userDoc.data().coupleId));
            if (coupleDoc.exists()) {
                onConnected(userDoc.data().coupleId);
            }
        }
    };

    const startSoloSession = async () => {
        setLoading(true);
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const coupleId = `couple_${code}_${Date.now()}`;

            await setDoc(doc(db, 'couples', coupleId), {
                coupleId,
                code,
                user1Id: user.uid,
                user1Name: user.displayName,
                user1Photo: user.photoURL,
                user2Id: null,
                user2Name: null,
                user2Photo: null,
                createdAt: new Date().toISOString(),
                connected: false
            });

            await updateDoc(doc(db, 'users', user.uid), { coupleId });
            onConnected(coupleId);
        } catch (err) {
            console.error('Error starting solo:', err);
            setError('Failed to start. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateCoupleCode = async () => {
        if (currentCouple) {
            setGeneratedCode(currentCouple.code);
            setMode('generate');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const coupleId = `couple_${code}_${Date.now()}`;

            await setDoc(doc(db, 'couples', coupleId), {
                coupleId,
                code,
                user1Id: user.uid,
                user1Name: user.displayName,
                user1Photo: user.photoURL,
                user2Id: null,
                user2Name: null,
                user2Photo: null,
                createdAt: new Date().toISOString(),
                connected: false
            });

            await updateDoc(doc(db, 'users', user.uid), {
                coupleId
            });

            setGeneratedCode(code);
            setMode('generate');
        } catch (err) {
            console.error('Error generating code:', err);
            setError('Failed to generate code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const joinWithCode = async () => {
        if (!coupleCode.trim()) {
            setError('Please enter a code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const couplesRef = collection(db, 'couples');
            const q = query(couplesRef, where('code', '==', coupleCode.toUpperCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('Invalid code. Please check and try again.');
                setLoading(false);
                return;
            }

            const coupleDoc = querySnapshot.docs[0];
            const coupleData = coupleDoc.data();

            if (coupleData.connected) {
                setError('This code is already in use. Ask your partner for a new code.');
                setLoading(false);
                return;
            }

            if (coupleData.user1Id === user.uid) {
                setError('You cannot connect with yourself!');
                setLoading(false);
                return;
            }

            await updateDoc(doc(db, 'couples', coupleData.coupleId), {
                user2Id: user.uid,
                user2Name: user.displayName,
                user2Photo: user.photoURL,
                connected: true,
                connectedAt: new Date().toISOString()
            });

            await updateDoc(doc(db, 'users', user.uid), {
                coupleId: coupleData.coupleId
            });

            onConnected(coupleData.coupleId);
        } catch (err) {
            console.error('Error joining couple:', err);
            setError('Failed to join. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'generate' && generatedCode) {
        return (
            <div className="couple-connection-container">
                <div className="couple-connection-card">
                    <div className="icon-badge">
                        <Users size={48} weight="duotone" color="#667eea" />
                    </div>
                    <h2 className="couple-title">Share Code</h2>
                    <p className="couple-subtitle">Share this code with your partner to connect.</p>

                    <div className="code-display">
                        <div className="code-box">{generatedCode}</div>
                        <button
                            onClick={() => navigator.clipboard.writeText(generatedCode)}
                            className="copy-button"
                        >
                            <Copy size={20} /> Copy Code
                        </button>
                    </div>

                    <div className="waiting-indicator">
                        <div className="spinner-small"></div>
                        <p>Waiting for partner to join...</p>
                    </div>

                    <button
                        onClick={() => {
                            setMode('choose');
                            setGeneratedCode('');
                        }}
                        className="back-button"
                    >
                        <ArrowLeft size={20} /> Go Back
                    </button>

                    <button
                        onClick={() => {
                            setMode('enter');
                            setGeneratedCode('');
                        }}
                        className="switch-button"
                    >
                        <Lightbulb size={20} /> Have a code instead?
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'enter') {
        return (
            <div className="couple-connection-container">
                <div className="couple-connection-card">
                    <div className="icon-badge">
                        <LinkIcon size={48} weight="duotone" color="#764ba2" />
                    </div>
                    <h2 className="couple-title">Join Couple</h2>
                    <p className="couple-subtitle">Enter the code from your partner.</p>

                    <div className="code-input-section">
                        <input
                            type="text"
                            value={coupleCode}
                            onChange={(e) => setCoupleCode(e.target.value.toUpperCase())}
                            placeholder="6-DIGIT CODE"
                            maxLength={6}
                            className="code-input"
                        />

                        <button
                            onClick={joinWithCode}
                            disabled={loading || !coupleCode.trim()}
                            className="connect-button"
                        >
                            {loading ? 'Connecting...' : 'Connect Partner'}
                        </button>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button
                        onClick={() => setMode('choose')}
                        className="back-button"
                    >
                        <ArrowLeft size={20} /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="couple-connection-container">
            <div className="couple-connection-card">
                <div className="brand-header">
                    <img src="/favicon.png" alt="PULSE" className="couple-logo" />
                    <h2 className="couple-title">Get Started</h2>
                    <p className="couple-subtitle">Connect with a partner or go solo.</p>
                </div>

                <div className="connection-options">
                    <button onClick={generateCoupleCode} disabled={loading} className="option-button generate">
                        <div className="option-icon-wrapper">
                            <DiceFive size={32} weight="duotone" />
                        </div>
                        <div className="option-content">
                            <h3>{currentCouple ? 'View My Code' : 'Generate Code'}</h3>
                            <p>{currentCouple ? 'Show code to partner' : 'Create a new couple code'}</p>
                        </div>
                    </button>

                    <button onClick={() => setMode('enter')} disabled={loading} className="option-button join">
                        <div className="option-icon-wrapper">
                            <LinkIcon size={32} weight="duotone" />
                        </div>
                        <div className="option-content">
                            <h3>Enter Code</h3>
                            <p>Join an existing couple</p>
                        </div>
                    </button>

                    {!isManageMode && (
                        <button onClick={startSoloSession} disabled={loading} className="option-button skip">
                            <div className="option-icon-wrapper">
                                <User size={32} weight="duotone" />
                            </div>
                            <div className="option-content">
                                <h3>Start Solo</h3>
                                <p>Skip and add partner later</p>
                            </div>
                        </button>
                    )}
                </div>

                {isManageMode && (
                    <button
                        onClick={onBack}
                        className="back-button close-mode"
                    >
                        <X size={20} /> Close
                    </button>
                )}

                {error && <div className="error-message">{error}</div>}
            </div>
        </div>
    );
}

export default CoupleConnection;

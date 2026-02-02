import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './CoupleConnection.css';

function CoupleConnection({ user, onConnected }) {
    const [coupleCode, setCoupleCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('choose'); // 'choose', 'generate', 'enter'

    useEffect(() => {
        checkExistingConnection();
    }, [user]);

    const checkExistingConnection = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().coupleId) {
            onConnected(userDoc.data().coupleId);
        }
    };

    const generateCoupleCode = async () => {
        setLoading(true);
        setError('');

        try {
            // Generate unique 6-digit code
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const coupleId = `couple_${code}_${Date.now()}`;

            // Create couple document
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

            // Update user's coupleId
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
            // Find couple with this code
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

            // Check if already connected
            if (coupleData.connected) {
                setError('This code is already in use. Please ask your partner to generate a new code.');
                setLoading(false);
                return;
            }

            // Check if trying to connect with yourself
            if (coupleData.user1Id === user.uid) {
                setError('You cannot connect with yourself!');
                setLoading(false);
                return;
            }

            // Update couple document with second user
            await updateDoc(doc(db, 'couples', coupleData.coupleId), {
                user2Id: user.uid,
                user2Name: user.displayName,
                user2Photo: user.photoURL,
                connected: true,
                connectedAt: new Date().toISOString()
            });

            // Update both users' coupleId
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
                    <h2 className="couple-title">💕 Share This Code</h2>
                    <p className="couple-subtitle">Ask your partner to enter this code to connect</p>

                    <div className="code-display">
                        <div className="code-box">{generatedCode}</div>
                        <button
                            onClick={() => navigator.clipboard.writeText(generatedCode)}
                            className="copy-button"
                        >
                            📋 Copy Code
                        </button>
                    </div>

                    <div className="waiting-indicator">
                        <div className="spinner"></div>
                        <p>Waiting for your partner to connect...</p>
                    </div>

                    <button
                        onClick={() => {
                            setMode('choose');
                            setGeneratedCode('');
                        }}
                        className="back-button"
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'enter') {
        return (
            <div className="couple-connection-container">
                <div className="couple-connection-card">
                    <h2 className="couple-title">💕 Enter Couple Code</h2>
                    <p className="couple-subtitle">Enter the code your partner shared with you</p>

                    <div className="code-input-section">
                        <input
                            type="text"
                            value={coupleCode}
                            onChange={(e) => setCoupleCode(e.target.value.toUpperCase())}
                            placeholder="Enter 6-character code"
                            maxLength={6}
                            className="code-input"
                        />

                        {error && <div className="error-message">{error}</div>}

                        <button
                            onClick={joinWithCode}
                            disabled={loading || !coupleCode.trim()}
                            className="connect-button"
                        >
                            {loading ? 'Connecting...' : '💑 Connect'}
                        </button>
                    </div>

                    <button
                        onClick={() => setMode('choose')}
                        className="back-button"
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="couple-connection-container">
            <div className="couple-connection-card">
                <img src="/favicon.png" alt="PULSE" className="couple-logo" />
                <h2 className="couple-title">💕 Connect With Your Partner</h2>
                <p className="couple-subtitle">Choose how you want to connect</p>

                <div className="connection-options">
                    <button onClick={generateCoupleCode} disabled={loading} className="option-button generate">
                        <div className="option-icon">🎲</div>
                        <div className="option-content">
                            <h3>Generate Code</h3>
                            <p>Create a code and share it with your partner</p>
                        </div>
                    </button>

                    <div className="divider-text">OR</div>

                    <button onClick={() => setMode('enter')} disabled={loading} className="option-button join">
                        <div className="option-icon">🔗</div>
                        <div className="option-content">
                            <h3>Enter Code</h3>
                            <p>Have a code? Enter it here to connect</p>
                        </div>
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}
            </div>
        </div>
    );
}

export default CoupleConnection;

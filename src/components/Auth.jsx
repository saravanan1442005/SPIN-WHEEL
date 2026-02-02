import { useState } from 'react';
import {
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './Auth.css';

function Auth({ onLogin }) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const createUserProfile = async (user) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL,
                createdAt: new Date().toISOString(),
                coupleId: null
            });
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            await createUserProfile(result.user);
            onLogin(result.user);
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <img src="/favicon.png" alt="PULSE" className="auth-logo" />
                    <h1 className="auth-title">💕 Snack Spinner</h1>
                    <p className="auth-subtitle">Connect with your loved one and decide together!</p>
                </div>

                <div className="auth-content">
                    <p className="auth-welcome">
                        Welcome! Sign in with your Google account to start spinning.
                    </p>

                    {error && <div className="auth-error">{error}</div>}

                    <button
                        onClick={handleGoogleLogin}
                        className="google-button-large"
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {loading ? 'Signing in...' : 'Continue with Google'}
                    </button>

                    <div className="auth-features">
                        <div className="feature-item">
                            <span className="feature-icon">🎡</span>
                            <span>Spin the wheel together</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">🔔</span>
                            <span>Get notified of spins</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">🍿</span>
                            <span>Share snack choices</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Auth;

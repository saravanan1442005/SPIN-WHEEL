import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Auth from './components/Auth';
import CoupleConnection from './components/CoupleConnection';
import Header from './components/Header';
import WheelSection from './components/WheelSection';
import ControlsSection from './components/ControlsSection';
import SpinNotification from './components/SpinNotification';
import AdminDashboard from './components/AdminDashboard';
import { useCouple, useSnacks, useSpins, usePartner } from './hooks/useFirebase';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [managingConnection, setManagingConnection] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const isAdmin = user?.email === 'kumaresans407@gmail.com';

  const { couple } = useCouple(coupleId);
  const { allSnacks, activeSnacks, addSnack, toggleSnackActive, deleteSnack } = useSnacks(coupleId);
  const { spins, latestSpin, addSpin } = useSpins(coupleId, user?.uid);
  const partner = usePartner(couple, user?.uid);

  // Get items that are currently on the wheel
  const wheelItems = allSnacks.filter(snack => activeSnacks.includes(snack.id));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (user) => {
    setUser(user);
  };

  const handleConnected = useCallback((newCoupleId) => {
    setCoupleId(newCoupleId);
    setManagingConnection(false);
  }, []);

  const handleAddPartner = () => {
    setManagingConnection(true);
  };

  const handleAddSnack = async (name, price) => {
    await addSnack(name, price, user.uid, user.displayName);
  };

  const handleRemoveFromWheel = async (id) => {
    await toggleSnackActive(id, false);
    setResult(null);
  };

  const handleAddToWheel = async (id) => {
    await toggleSnackActive(id, true);
  };

  const handleDeletePermanently = async (id) => {
    await deleteSnack(id);
    setResult(null);
  };

  const handleSpinComplete = async (winner) => {
    setResult(winner);
    setSpinning(false);

    // Save spin to database
    await addSpin(winner.name, winner.price, user.uid, user.displayName);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCoupleId(null);
    setManagingConnection(false);
  };

  const handleDisconnect = async () => {
    if (!user || !coupleId) return;

    if (window.confirm("Are you sure you want to disconnect?")) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { coupleId: null });
        setCoupleId(null);
        setManagingConnection(false);
      } catch (error) {
        console.error("Error disconnecting:", error);
        alert("Failed to disconnect.");
      }
    }
  };

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="spinner-large"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  if (!coupleId || managingConnection) {
    return (
      <CoupleConnection
        user={user}
        onConnected={handleConnected}
        isManageMode={managingConnection}
        currentCouple={couple}
        onBack={() => setManagingConnection(false)}
      />
    );
  }

  return (
    <div className="app">
      {latestSpin && (
        <SpinNotification
          spin={latestSpin}
          partner={partner}
          onClose={() => { }}
        />
      )}

      <div className="container">
        <Header
          user={user}
          partner={partner}
          onLogout={handleLogout}
          onAddPartner={handleAddPartner}
          onDisconnect={handleDisconnect}
        />

        {isAdmin && (
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <button
              onClick={() => setShowAdmin(true)}
              style={{
                background: '#334155',
                color: '#94a3b8',
                border: '1px solid #475569',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🛡️ Open Admin Dashboard
            </button>
          </div>
        )}

        <main className="main-content">
          <WheelSection
            items={wheelItems}
            spinning={spinning}
            setSpinning={setSpinning}
            result={result}
            onSpinComplete={handleSpinComplete}
          />

          <ControlsSection
            allSnacks={allSnacks}
            activeSnacks={activeSnacks}
            onAddSnack={handleAddSnack}
            onRemoveFromWheel={handleRemoveFromWheel}
            onAddToWheel={handleAddToWheel}
            onDeletePermanently={handleDeletePermanently}
            user={user}
          />
        </main>

        <footer className="footer">
          <p>Made with ❤️ {partner ? `for you & ${partner.name}` : 'for you'}</p>
        </footer>
      </div>

      {showAdmin && isAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Trash, Users, LinkBreak, ShieldCheck, X } from '@phosphor-icons/react';
import './AdminDashboard.css';

function AdminDashboard({ onClose }) {
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'couples'
    const [users, setUsers] = useState([]);
    const [couples, setCouples] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const usersSnap = await getDocs(collection(db, 'users'));
            const couplesSnap = await getDocs(collection(db, 'couples'));

            setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setCouples(couplesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error fetching admin data:", error);
            alert("Failed to load data. Ensure you are an admin.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, 'users', userId));
            // Ideally we should also remove them from any couple, but for now simple delete
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            console.error(error);
            alert("Error deleting user");
        }
    };

    const handleDeleteCouple = async (coupleId) => {
        if (!window.confirm("Are you sure you want to delete this couple connection? Users will be reset.")) return;

        try {
            const batch = writeBatch(db);
            const couple = couples.find(c => c.id === coupleId);

            if (couple) {
                // Update users to have no couple
                if (couple.user1Id) batch.update(doc(db, 'users', couple.user1Id), { coupleId: null });
                if (couple.user2Id) batch.update(doc(db, 'users', couple.user2Id), { coupleId: null });
            }

            // Delete couple doc
            batch.delete(doc(db, 'couples', coupleId));
            await batch.commit();

            setCouples(couples.filter(c => c.id !== coupleId));
            // Refresh users to show updated status
            const usersSnap = await getDocs(collection(db, 'users'));
            setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        } catch (error) {
            console.error(error);
            alert("Error deleting couple");
        }
    };

    if (loading) return <div className="admin-dashboard"><div className="loading-admin">Loading Admin Data...</div></div>;

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <div className="admin-title">
                    <ShieldCheck size={40} weight="duotone" />
                    Admin Dashboard
                </div>
                <button onClick={onClose} className="close-admin-btn"><X size={20} /> Close</button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <p className="stat-value">{users.length}</p>
                    <p className="stat-label">Total Users</p>
                </div>
                <div className="stat-card">
                    <p className="stat-value">{couples.length}</p>
                    <p className="stat-label">Active Connections</p>
                </div>
            </div>

            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Users Management
                </button>
                <button
                    className={`tab-btn ${activeTab === 'couples' ? 'active' : ''}`}
                    onClick={() => setActiveTab('couples')}
                >
                    Couples / Connections
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'users' && (
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => {
                                    const userCouple = couples.find(c => c.id === user.coupleId);
                                    let status = <span className="status-badge none">No Connection</span>;

                                    if (userCouple) {
                                        if (userCouple.connected) {
                                            status = <span className="status-badge connected">Connected</span>;
                                        } else {
                                            status = <span className="status-badge solo">Solo Mode</span>;
                                        }
                                    }

                                    return (
                                        <tr key={user.id}>
                                            <td className="user-cell">
                                                <img src={user.photoURL} alt="" className="table-avatar" />
                                                {user.displayName}
                                            </td>
                                            <td>{user.email}</td>
                                            <td>{status}</td>
                                            <td>
                                                <button onClick={() => handleDeleteUser(user.id)} className="action-btn delete-btn">
                                                    <Trash size={16} /> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'couples' && (
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Couple ID</th>
                                    <th>User 1</th>
                                    <th>User 2</th>
                                    <th>Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {couples.map(couple => (
                                    <tr key={couple.id}>
                                        <td>{couple.id.substring(0, 10)}...</td>
                                        <td className="user-cell">
                                            {couple.user1Photo && <img src={couple.user1Photo} alt="" className="table-avatar" />}
                                            {couple.user1Name}
                                        </td>
                                        <td className="user-cell">
                                            {couple.user2Photo && <img src={couple.user2Photo} alt="" className="table-avatar" />}
                                            {couple.user2Name || '-'}
                                        </td>
                                        <td>
                                            {couple.connected ?
                                                <span className="status-badge connected">Pair</span> :
                                                <span className="status-badge solo">Solo</span>
                                            }
                                        </td>
                                        <td>
                                            <button onClick={() => handleDeleteCouple(couple.id)} className="action-btn delete-btn">
                                                <LinkBreak size={16} /> Disconnect / Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;

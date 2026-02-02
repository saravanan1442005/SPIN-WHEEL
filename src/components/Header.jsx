import './Header.css';

function Header({ user, partner, onLogout }) {
    return (
        <header className="header">
            <div className="header-content">
                <div className="header-left">
                    <img src="/favicon.png" alt="PULSE" className="header-logo" />
                    <div>
                        <h1 className="title">🍿 Snack Spinner</h1>
                        {partner && (
                            <p className="connection-status">
                                Connected with {partner.name} 💕
                            </p>
                        )}
                    </div>
                </div>

                <div className="header-right">
                    {partner?.photo && (
                        <img src={partner.photo} alt={partner.name} className="partner-avatar" title={partner.name} />
                    )}
                    {user?.photoURL && (
                        <img src={user.photoURL} alt={user.displayName} className="user-avatar" title="You" />
                    )}
                    <button onClick={onLogout} className="logout-button" title="Logout">
                        🚪
                    </button>
                </div>
            </div>
            <p className="subtitle">Can't decide what to eat? Let the wheel choose for you!</p>
        </header>
    );
}

export default Header;

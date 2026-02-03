import { Heart, SignOut, UserPlus, Popcorn, UserMinus } from '@phosphor-icons/react';
import './Header.css';

function Header({ user, partner, onLogout, onAddPartner, onDisconnect }) {
    return (
        <header className="header">
            <div className="header-content">
                <div className="header-left">
                    <div className="logo-badge">
                        <Popcorn size={28} weight="duotone" color="#FFD700" />
                    </div>
                    <div>
                        <h1 className="title">Snack Spinner</h1>
                        {partner ? (
                            <p className="connection-status connected">
                                Connected with {partner.name} <Heart weight="fill" color="#f5576c" className="heart-icon" />
                                <button onClick={onDisconnect} className="disconnect-icon-btn" title="Disconnect">
                                    <UserMinus size={16} />
                                </button>
                            </p>
                        ) : (
                            <p className="connection-status solo">
                                Solo Mode 👤
                            </p>
                        )}
                    </div>
                </div>

                <div className="header-right">
                    {partner?.photo && (
                        <img src={partner.photo} alt={partner.name} className="partner-avatar" title={partner.name} />
                    )}

                    {!partner && (
                        <button onClick={onAddPartner} className="add-partner-nav-btn" title="Connect with Partner">
                            <UserPlus size={20} /> Add Partner
                        </button>
                    )}

                    {user?.photoURL && (
                        <img src={user.photoURL} alt={user.displayName} className="user-avatar" title="You" />
                    )}

                    <button onClick={onLogout} className="logout-button" title="Logout">
                        <SignOut size={24} />
                    </button>
                </div>
            </div>
            <p className="subtitle">Can't decide what to eat? Let the wheel choose for you!</p>
        </header >
    );
}

export default Header;

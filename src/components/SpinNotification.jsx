import { useEffect } from 'react';
import './SpinNotification.css';

function SpinNotification({ spin, partner, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    if (!spin || !partner) return null;

    return (
        <div className="spin-notification">
            <div className="notification-content">
                <div className="notification-header">
                    {partner.photo && (
                        <img src={partner.photo} alt={partner.name} className="partner-photo" />
                    )}
                    <div className="notification-info">
                        <h3 className="notification-title">
                            {partner.name} just spun! 🎉
                        </h3>
                        <p className="notification-time">Just now</p>
                    </div>
                    <button onClick={onClose} className="close-notification">×</button>
                </div>

                <div className="notification-result">
                    <div className="result-details">
                        <div className="result-icon">🍿</div>
                        <div>
                            <p className="result-snack">{spin.snackName}</p>
                            <p className="result-price">₹{spin.price}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SpinNotification;

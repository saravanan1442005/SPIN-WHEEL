import { useState } from 'react';
import { Plus, Minus, Trash, PlusCircle, CheckCircle, Info, Warning } from '@phosphor-icons/react';
import './ControlsSection.css';

function ControlsSection({ allSnacks, activeSnacks, onAddSnack, onRemoveFromWheel, onAddToWheel, onDeletePermanently }) {
    // ... (keep state)
    const [itemName, setItemName] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleAddSnack = () => {
        // ... (keep logic)
        const name = itemName.trim();
        const price = parseInt(itemPrice);

        if (!name) {
            showNotification('Please enter a snack name', 'error');
            return;
        }

        if (!price || price <= 0) {
            showNotification('Please enter a valid price', 'error');
            return;
        }

        onAddSnack(name, price);
        setItemName('');
        setItemPrice('');
        showNotification(`Added ${name} for ₹${price}!`, 'success');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddSnack();
        }
    };

    // ... (keep other handlers)
    const handleRemoveFromWheel = (snack) => {
        onRemoveFromWheel(snack.id);
        showNotification(`Removed ${snack.name} from wheel`, 'info');
    };

    const handleAddToWheel = (snack) => {
        onAddToWheel(snack.id);
        showNotification(`Added ${snack.name} to wheel`, 'success');
    };

    const handleDeletePermanently = (snack) => {
        if (confirm(`Permanently delete ${snack.name}? This cannot be undone.`)) {
            onDeletePermanently(snack.id);
            showNotification(`Permanently deleted ${snack.name}`, 'info');
        }
    };

    // Separate snacks into on wheel and not on wheel
    const snacksOnWheel = allSnacks.filter(snack => activeSnacks.includes(snack.id));
    const snacksNotOnWheel = allSnacks.filter(snack => !activeSnacks.includes(snack.id));

    return (
        <div className="controls-section">
            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.type === 'success' && <CheckCircle size={20} weight="fill" />}
                    {notification.type === 'error' && <Warning size={20} weight="fill" />}
                    {notification.type === 'info' && <Info size={20} weight="fill" />}
                    {notification.message}
                </div>
            )}

            <div className="add-item-card">
                <h2 className="card-title">Add New Snack</h2>
                <div className="input-group">
                    <div className="input-wrapper">
                        <label htmlFor="itemName" className="input-label">Snack Name</label>
                        <input
                            type="text"
                            id="itemName"
                            className="input-field"
                            placeholder="e.g., Samosa, Vada Pav, Chai"
                            maxLength="30"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                    </div>
                    <div className="input-wrapper">
                        <label htmlFor="itemPrice" className="input-label">Price (₹)</label>
                        <input
                            type="number"
                            id="itemPrice"
                            className="input-field"
                            placeholder="e.g., 40, 50, 100"
                            min="1"
                            max="10000"
                            value={itemPrice}
                            onChange={(e) => setItemPrice(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                    </div>
                </div>
                <button className="add-button" onClick={handleAddSnack}>
                    <PlusCircle size={20} weight="bold" />
                    <span>Add New Snack</span>
                </button>
            </div>

            <div className="items-list-card">
                <h2 className="card-title">
                    On Wheel <span className="item-count">{snacksOnWheel.length}</span>
                </h2>
                <div className="items-list">
                    {snacksOnWheel.length === 0 ? (
                        <p className="empty-state">No snacks on wheel. Add some from below!</p>
                    ) : (
                        snacksOnWheel.map((snack) => (
                            <div key={snack.id} className="item-card">
                                <div className="item-info">
                                    <div className="item-name">{snack.name}</div>
                                    <div className="item-price">₹{snack.price}</div>
                                </div>
                                <button
                                    className="remove-button"
                                    onClick={() => handleRemoveFromWheel(snack)}
                                    title="Remove from wheel"
                                >
                                    <Minus size={16} weight="bold" /> Remove
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {snacksNotOnWheel.length > 0 && (
                <div className="items-list-card">
                    <h2 className="card-title">
                        Available Snacks <span className="item-count">{snacksNotOnWheel.length}</span>
                    </h2>
                    <div className="items-list">
                        {snacksNotOnWheel.map((snack) => (
                            <div key={snack.id} className="item-card inactive">
                                <div className="item-info">
                                    <div className="item-name">{snack.name}</div>
                                    <div className="item-price">₹{snack.price}</div>
                                </div>
                                <div className="button-group">
                                    <button
                                        className="add-to-wheel-button"
                                        onClick={() => handleAddToWheel(snack)}
                                        title="Add to wheel"
                                    >
                                        <Plus size={16} weight="bold" /> Add
                                    </button>
                                    <button
                                        className="delete-button-small"
                                        onClick={() => handleDeletePermanently(snack)}
                                        title="Delete permanently"
                                    >
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ControlsSection;

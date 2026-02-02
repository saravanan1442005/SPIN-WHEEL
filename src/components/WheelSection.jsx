import { useRef, useEffect, useState, useCallback } from 'react';
import './WheelSection.css';

function WheelSection({ items, spinning, setSpinning, result, onSpinComplete }) {
    const canvasRef = useRef(null);
    const [rotation, setRotation] = useState(0);
    const [targetRotation, setTargetRotation] = useState(0);
    const animationRef = useRef(null);

    const generateColors = useCallback((count) => {
        const colors = [];
        const hueStep = 360 / count;

        for (let i = 0; i < count; i++) {
            const hue = (i * hueStep) % 360;
            const saturation = 70 + Math.random() * 20;
            const lightness = 50 + Math.random() * 10;
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }

        return colors;
    }, []);

    const drawWheel = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 10;

        ctx.clearRect(0, 0, size, size);

        if (items.length === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '20px Outfit';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Add items to start', centerX, centerY);
            return;
        }

        const anglePerItem = (Math.PI * 2) / items.length;
        const colors = generateColors(items.length);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);

        items.forEach((item, index) => {
            const startAngle = anglePerItem * index;
            const endAngle = startAngle + anglePerItem;

            ctx.fillStyle = colors[index];
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.rotate(startAngle + anglePerItem / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textRadius = radius * 0.65;

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Outfit';
            ctx.fillText(item.name, textRadius, -10);

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 14px Outfit';
            ctx.fillText(`₹${item.price}`, textRadius, 10);

            ctx.restore();
        });

        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
    }, [items, rotation, generateColors]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = canvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight, 500);
        canvas.width = size;
        canvas.height = size;

        drawWheel();
    }, [drawWheel]);

    useEffect(() => {
        if (!spinning) return;

        const startTime = Date.now();
        const minDuration = 5000; // Minimum 5 seconds
        const maxDuration = 6500; // Maximum 6.5 seconds

        // Random duration between 5-6.5 seconds
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        const duration = minDuration + (randomArray[0] / (0xFFFFFFFF + 1)) * (maxDuration - minDuration);

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Cubic ease-out curve: starts fast, ends slow
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);

            // Calculate current rotation based on easing
            const currentRotation = targetRotation * easeOutCubic;
            setRotation(currentRotation);

            // Check if animation is complete
            if (progress >= 1) {
                setRotation(targetRotation);
                setSpinning(false);

                // Calculate which item is under the top pointer
                const anglePerItem = (Math.PI * 2) / items.length;

                // Normalize rotation to 0-2π range
                const normalizedRotation = ((targetRotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);

                // The pointer is at the top (270 degrees or -90 degrees in standard position)
                // Items start at 0 degrees (3 o'clock) and go counter-clockwise
                // We need to find which segment is at the top (-π/2 or 3π/2)
                const pointerAngle = (Math.PI * 3 / 2); // Top position

                // Calculate the angle of the first item after rotation
                // Since the wheel rotates, we need to subtract the rotation
                const adjustedPointerAngle = ((pointerAngle - normalizedRotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

                // Find which segment this angle falls into
                const winningIndex = Math.floor(adjustedPointerAngle / anglePerItem) % items.length;

                setTimeout(() => {
                    onSpinComplete(items[winningIndex]);
                    confetti();
                }, 500);

                return;
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [spinning, targetRotation, items, onSpinComplete, setSpinning]);

    const handleSpin = () => {
        if (spinning || items.length === 0) return;

        setSpinning(true);

        // Use crypto API for better randomness
        const randomArray = new Uint32Array(3);
        crypto.getRandomValues(randomArray);

        // Convert to 0-1 range
        const random1 = randomArray[0] / (0xFFFFFFFF + 1);
        const random2 = randomArray[1] / (0xFFFFFFFF + 1);
        const random3 = randomArray[2] / (0xFFFFFFFF + 1);

        // Random number of full spins (10-18 full rotations for more suspense!)
        const spins = 10 + random1 * 8;

        // Completely random final position (0 to 2π)
        const finalPosition = random2 * Math.PI * 2;

        // Add extra randomness to prevent patterns
        const extraSpin = random3 * Math.PI * 2;

        // Calculate absolute target rotation (not relative to current rotation)
        // This prevents any bias based on previous spins
        const totalRotation = (spins * Math.PI * 2) + finalPosition + extraSpin;

        // Set target as absolute rotation, not relative
        setTargetRotation(totalRotation);
        setRotation(0); // Reset to 0 for consistent starting point
    };


    const confetti = () => {
        const confettiEmojis = ['🎉', '🎊', '✨', '🌟', '💫', '🎈'];

        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.textContent = confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];
                confetti.style.position = 'fixed';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '-50px';
                confetti.style.fontSize = (Math.random() * 20 + 20) + 'px';
                confetti.style.opacity = '1';
                confetti.style.zIndex = '9999';
                confetti.style.pointerEvents = 'none';
                confetti.style.transition = 'all 3s ease-out';

                document.body.appendChild(confetti);

                setTimeout(() => {
                    confetti.style.top = '100vh';
                    confetti.style.opacity = '0';
                    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                }, 50);

                setTimeout(() => {
                    confetti.remove();
                }, 3000);
            }, i * 100);
        }
    };

    return (
        <div className="wheel-section">
            <div className="wheel-container">
                <div className="wheel-pointer"></div>
                <canvas ref={canvasRef}></canvas>
                <button
                    className="spin-button"
                    onClick={handleSpin}
                    disabled={spinning || items.length === 0}
                >
                    <span className="spin-text">SPIN</span>
                </button>
            </div>

            {result && (
                <div className="result-card show">
                    <div className="result-content">
                        <h2 className="result-title">🎉 You're having...</h2>
                        <p className="result-item">{result.name}</p>
                        <p className="result-price">₹{result.price}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WheelSection;

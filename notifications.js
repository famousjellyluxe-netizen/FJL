// Beautiful Notification System
// Displays messages following FJL color scheme (Gold #E09F3E, Black)

class NotificationManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
            this.container = container;
        } else {
            this.container = document.getElementById('notificationContainer');
        }
    }

    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        const notificationId = 'notif-' + Date.now();
        notification.id = notificationId;

        // Define styles based on type
        const styles = {
            success: {
                background: '#000',
                icon: '✓',
                textColor: '#fff',
                iconColor: '#E09F3E'
            },
            error: {
                background: '#000',
                icon: '✕',
                textColor: '#fff',
                iconColor: '#d32f2f'
            },
            warning: {
                background: '#000',
                icon: '⚠',
                textColor: '#fff',
                iconColor: '#ffa726'
            },
            info: {
                background: '#000',
                icon: 'ℹ',
                textColor: '#fff',
                iconColor: '#1976d2'
            },
            confirm: {
                background: '#000',
                icon: '?',
                textColor: '#fff',
                iconColor: '#E09F3E'
            }
        };

        const style = styles[type] || styles.info;

        notification.style.cssText = `
            background: ${style.background};
            color: ${style.textColor};
            padding: 16px 20px;
            margin-bottom: 12px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            animation: slideIn 0.3s ease;
            pointer-events: auto;
        `;

        notification.innerHTML = `
            <span style="font-size: 18px; font-weight: bold; min-width: 20px; color: ${style.iconColor};">${style.icon}</span>
            <span style="flex: 1;">${message}</span>
            <button style="
                background: none;
                border: none;
                color: ${style.textColor};
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
                transition: opacity 0.2s;
            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" onclick="document.getElementById('${notificationId}').remove()">
                ×
            </button>
        `;

        // Add animation styles if not already added
        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        this.container.appendChild(notification);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }
            }, duration);
        }

        return notification;
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    confirm(message, onConfirm, onCancel) {
        return this.showConfirmModal(message, onConfirm, onCancel);
    }

    showConfirmModal(message, onConfirm, onCancel) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9998;
            animation: fadeIn 0.3s ease;
        `;

        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 32px;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            text-align: center;
            animation: scaleIn 0.3s ease;
        `;

        modal.innerHTML = `
            <h2 style="
                margin: 0 0 16px 0;
                font-family: 'Poppins', sans-serif;
                font-size: 18px;
                font-weight: 700;
                color: #000;
            ">Confirm Action</h2>
            <p style="
                margin: 0 0 24px 0;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                color: #666;
                line-height: 1.5;
            ">${message}</p>
            <div style="
                display: flex;
                gap: 12px;
                justify-content: center;
            ">
                <button class="confirm-btn-cancel" style="
                    padding: 12px 24px;
                    background: #f5f5f5;
                    color: #333;
                    border: none;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: 600;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Cancel</button>
                <button class="confirm-btn-confirm" style="
                    padding: 12px 24px;
                    background: #E09F3E;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: 600;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Confirm</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Add fade in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes scaleIn {
                from {
                    transform: scale(0.9);
                    opacity: 0;
                }
                to {
                    transform: scale(1);
                    opacity: 1;
                }
            }
        `;
        if (!document.querySelector('style[data-modal-animations]')) {
            style.setAttribute('data-modal-animations', '');
            document.head.appendChild(style);
        }

        // Button handlers
        const cancelBtn = modal.querySelector('.confirm-btn-cancel');
        const confirmBtn = modal.querySelector('.confirm-btn-confirm');

        const cleanup = () => {
            overlay.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => overlay.remove(), 300);
        };

        cancelBtn.addEventListener('click', () => {
            cleanup();
            if (onCancel) onCancel();
        });

        confirmBtn.addEventListener('click', () => {
            cleanup();
            if (onConfirm) onConfirm();
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cleanup();
                if (onCancel) onCancel();
            }
        });

        // Hover effects
        [cancelBtn, confirmBtn].forEach(btn => {
            btn.addEventListener('mouseover', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            });
            btn.addEventListener('mouseout', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
        });

        return overlay;
    }
}

// Initialize notification manager globally
let notifications;
document.addEventListener('DOMContentLoaded', () => {
    notifications = new NotificationManager();
});

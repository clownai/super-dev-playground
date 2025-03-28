class NotificationManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'notifications-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const text = document.createElement('span');
        text.textContent = message;
        notification.appendChild(text);

        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => this.dismiss(notification));
        notification.appendChild(closeButton);

        this.container.appendChild(notification);

        // Auto dismiss after duration
        if (duration > 0) {
            setTimeout(() => this.dismiss(notification), duration);
        }

        return notification;
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    dismiss(notification) {
        notification.style.animation = 'slide-out 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode === this.container) {
                this.container.removeChild(notification);
            }
        }, 300);
    }

    dismissAll() {
        Array.from(this.container.children).forEach(notification => {
            this.dismiss(notification);
        });
    }
}

// Create global instance
const notifications = new NotificationManager();
export default notifications; 
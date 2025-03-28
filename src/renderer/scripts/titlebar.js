// Window controls
class TitlebarControls {
    constructor() {
        this.minimizeButton = document.getElementById('minimizeButton');
        this.maximizeButton = document.getElementById('maximizeButton');
        this.closeButton = document.getElementById('closeButton');
        this.init();
    }

    init() {
        this.minimizeButton.addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });

        this.maximizeButton.addEventListener('click', () => {
            window.electronAPI.maximizeWindow();
        });

        this.closeButton.addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });
    }
}

// Initialize titlebar controls
const titlebarControls = new TitlebarControls(); 
// Tool navigation
class Navigation {
    constructor() {
        this.toolContainer = document.getElementById('tool-container');
        this.navButtons = document.querySelectorAll('.nav-button');
        this.currentTool = null;
        this.init();
    }

    async init() {
        // Set up navigation event listeners
        this.navButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTool(button));
        });

        // Load last active tool from storage
        const lastTool = await window.electronAPI.loadState('lastTool') || 'web-editor';
        const toolButton = Array.from(this.navButtons).find(btn => btn.dataset.tool === lastTool);
        if (toolButton) {
            this.switchTool(toolButton);
        }
    }

    async switchTool(button) {
        const toolId = button.dataset.tool;
        
        // Don't reload if it's the same tool
        if (this.currentTool === toolId) return;

        try {
            // Update active button
            this.navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Save last active tool
            await window.electronAPI.saveState('lastTool', toolId);

            // Load and initialize the tool
            const tool = await this.loadTool(toolId);
            this.currentTool = toolId;

            // Clear and update the container
            this.toolContainer.innerHTML = '';
            this.toolContainer.appendChild(tool);

        } catch (error) {
            console.error('Error switching tool:', error);
            // TODO: Show error in UI
        }
    }

    async loadTool(toolId) {
        // Import the tool module dynamically
        const { default: ToolClass } = await import(`./tools/${toolId}.js`);
        const tool = new ToolClass();
        return tool.render();
    }
}

// Initialize navigation
const navigation = new Navigation(); 
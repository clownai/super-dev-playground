// Base class for all tools
export default class BaseTool {
    constructor(name) {
        this.name = name;
        this.container = document.createElement('div');
        this.container.className = `tool-container ${name}`;
        this.state = {};
    }

    // Create the tool header with title and optional actions
    createHeader(actions = []) {
        const header = document.createElement('div');
        header.className = 'tool-header';

        const title = document.createElement('h2');
        title.textContent = this.name;
        header.appendChild(title);

        if (actions.length > 0) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'tool-actions';
            actions.forEach(action => actionsContainer.appendChild(action));
            header.appendChild(actionsContainer);
        }

        return header;
    }

    // Create a button element with standard styling
    createButton(text, onClick, className = '') {
        const button = document.createElement('button');
        button.className = `button ${className}`;
        button.textContent = text;
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        return button;
    }

    // Create a select element with options
    createSelect(options, onChange, className = '') {
        const select = document.createElement('select');
        select.className = `select ${className}`;
        options.forEach(({ value, label }) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        });
        if (onChange) {
            select.addEventListener('change', onChange);
        }
        return select;
    }

    // Create an input element
    createInput(type = 'text', placeholder = '', onChange, className = '') {
        const input = document.createElement('input');
        input.type = type;
        input.className = `input ${className}`;
        input.placeholder = placeholder;
        if (onChange) {
            input.addEventListener('input', onChange);
        }
        return input;
    }

    // Save tool state
    async saveState(key, value) {
        this.state[key] = value;
        await window.electronAPI.saveState(`${this.name}-${key}`, value);
    }

    // Load tool state
    async loadState(key) {
        const value = await window.electronAPI.loadState(`${this.name}-${key}`);
        if (value !== undefined) {
            this.state[key] = value;
        }
        return value;
    }

    // Initialize the tool
    async init() {
        // Override in subclass
    }

    // Clean up resources
    destroy() {
        // Override in subclass if needed
    }

    // Render the tool
    async render() {
        await this.init();
        return this.container;
    }
} 
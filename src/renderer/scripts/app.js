import { Base64Converter } from './tools/base64.js';
import { UrlEncoder } from './tools/url-encoder.js';
import { HashGenerator } from './tools/hash-generator.js';
import ProjectSelector from './components/project-selector.js';
import projectManager from './project-manager.js';

const tools = {
    base64: {
        name: 'Base64 Converter',
        description: 'Convert text to and from Base64 encoding',
        icon: 'code',
        template: 'base64.html',
        class: Base64Converter
    },
    'url-encoder': {
        name: 'URL Encoder',
        description: 'Encode and decode URL components',
        icon: 'link',
        template: 'url-encoder.html',
        class: UrlEncoder
    },
    'hash-generator': {
        name: 'Hash Generator',
        description: 'Generate various types of hashes from text',
        icon: 'key',
        template: 'hash-generator.html',
        class: HashGenerator
    }
};

class App {
    constructor() {
        this.currentTool = null;
        this.projectSelector = new ProjectSelector();
    }

    async init() {
        // Initialize project manager first
        await projectManager.init();

        // Add project selector to the UI
        const navbar = document.querySelector('.navbar');
        navbar.insertBefore(this.projectSelector.container, navbar.firstChild);

        // Initialize tools
        this.initializeTools();
        this.setupEventListeners();

        // Load last active tool if any
        const lastActiveTool = localStorage.getItem('lastActiveTool');
        if (lastActiveTool && tools[lastActiveTool]) {
            this.loadTool(lastActiveTool);
        } else {
            // Load first tool as default
            const firstTool = Object.keys(tools)[0];
            this.loadTool(firstTool);
        }
    }

    initializeTools() {
        const sidebar = document.querySelector('.sidebar');
        const toolList = document.createElement('div');
        toolList.className = 'tool-list';

        Object.entries(tools).forEach(([id, tool]) => {
            const toolButton = document.createElement('button');
            toolButton.className = 'tool-button';
            toolButton.dataset.toolId = id;
            toolButton.innerHTML = `
                <i class="fas fa-${tool.icon}"></i>
                <span>${tool.name}</span>
            `;
            toolButton.title = tool.description;
            toolList.appendChild(toolButton);
        });

        sidebar.appendChild(toolList);
    }

    setupEventListeners() {
        // Tool selection
        document.querySelector('.tool-list').addEventListener('click', (e) => {
            const toolButton = e.target.closest('.tool-button');
            if (toolButton) {
                const toolId = toolButton.dataset.toolId;
                this.loadTool(toolId);
            }
        });

        // Theme toggle
        const themeToggle = document.querySelector('#themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
                localStorage.setItem('theme', isDark ? 'light' : 'dark');
                window.dispatchEvent(new CustomEvent('themechange', { 
                    detail: { theme: isDark ? 'light' : 'dark' } 
                }));
            });
        }
    }

    async loadTool(toolId) {
        if (this.currentTool) {
            this.currentTool.destroy?.();
        }

        const tool = tools[toolId];
        if (!tool) return;

        try {
            // Update active tool button
            document.querySelectorAll('.tool-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.toolId === toolId);
            });

            // Load tool template
            const response = await fetch(`templates/${tool.template}`);
            const html = await response.text();

            // Update content
            const content = document.querySelector('.content');
            content.innerHTML = html;

            // Initialize tool
            this.currentTool = new tool.class();
            await this.currentTool.init();

            // Save last active tool
            localStorage.setItem('lastActiveTool', toolId);
        } catch (error) {
            console.error('Failed to load tool:', error);
            // Show error in UI
            const content = document.querySelector('.content');
            content.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Tool</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

// Initialize app
const app = new App();
app.init().catch(console.error); 
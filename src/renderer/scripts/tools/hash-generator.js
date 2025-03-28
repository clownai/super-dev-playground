import { EditorView, basicSetup } from '@codemirror/basic-setup';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import BaseTool from './base-tool.js';
import notifications from '../notifications.js';

export default class HashGenerator extends BaseTool {
    constructor() {
        super('Hash Generator');
        this.inputEditor = null;
        this.outputEditor = null;
        this.currentAlgorithm = 'SHA-256';
    }

    async init() {
        // Create algorithm selector
        const algorithmSelect = document.createElement('select');
        algorithmSelect.className = 'select';
        const algorithms = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
        algorithms.forEach(algo => {
            const option = document.createElement('option');
            option.value = algo;
            option.textContent = algo;
            if (algo === this.currentAlgorithm) {
                option.selected = true;
            }
            algorithmSelect.appendChild(option);
        });
        algorithmSelect.addEventListener('change', (e) => {
            this.currentAlgorithm = e.target.value;
            this.generateHash();
        });

        // Create header with actions
        const generateButton = this.createButton('Generate Hash', () => this.generateHash());
        const clearButton = this.createButton('Clear', () => this.clear(), 'secondary');
        
        const header = this.createHeader([algorithmSelect, generateButton, clearButton]);
        this.container.appendChild(header);

        // Create editors container
        const editorsContainer = document.createElement('div');
        editorsContainer.className = 'editors-container';
        this.container.appendChild(editorsContainer);

        // Create input editor section
        const inputSection = document.createElement('div');
        inputSection.className = 'editor-section';
        const inputLabel = document.createElement('div');
        inputLabel.className = 'editor-label';
        inputLabel.textContent = 'Input';
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'editor-wrapper';
        inputSection.appendChild(inputLabel);
        inputSection.appendChild(inputWrapper);
        editorsContainer.appendChild(inputSection);

        // Create output editor section
        const outputSection = document.createElement('div');
        outputSection.className = 'editor-section';
        const outputLabel = document.createElement('div');
        outputLabel.className = 'editor-label';
        outputLabel.textContent = 'Hash Output';
        const outputWrapper = document.createElement('div');
        outputWrapper.className = 'editor-wrapper';
        outputSection.appendChild(outputLabel);
        outputSection.appendChild(outputWrapper);
        editorsContainer.appendChild(outputSection);

        // Get current theme
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        // Initialize editors
        const commonExtensions = [
            basicSetup,
            isDark ? oneDark : [],
            EditorView.lineWrapping
        ];

        // Input editor
        const inputState = EditorState.create({
            doc: await this.loadState('input') || '',
            extensions: [
                ...commonExtensions,
                EditorView.updateListener.of(update => {
                    if (update.docChanged) {
                        this.saveState('input', update.state.doc.toString());
                    }
                })
            ]
        });

        this.inputEditor = new EditorView({
            state: inputState,
            parent: inputWrapper
        });

        // Output editor
        const outputState = EditorState.create({
            doc: await this.loadState('output') || '',
            extensions: [
                ...commonExtensions,
                EditorState.readOnly.of(true)
            ]
        });

        this.outputEditor = new EditorView({
            state: outputState,
            parent: outputWrapper
        });

        // Listen for theme changes
        window.addEventListener('themechange', ({ detail }) => {
            const extensions = [
                basicSetup,
                detail.theme === 'dark' ? oneDark : [],
                EditorView.lineWrapping
            ];

            // Update input editor
            const inputTransaction = this.inputEditor.state.update({
                effects: StateEffect.reconfigure.of(extensions)
            });
            this.inputEditor.dispatch(inputTransaction);

            // Update output editor
            const outputTransaction = this.outputEditor.state.update({
                effects: StateEffect.reconfigure.of([...extensions, EditorState.readOnly.of(true)])
            });
            this.outputEditor.dispatch(outputTransaction);
        });

        // Generate hash on input change (debounced)
        let timeout;
        this.inputEditor.dom.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.generateHash(), 500);
        });
    }

    async generateHash() {
        try {
            const input = this.inputEditor.state.doc.toString();
            if (!input) {
                notifications.info('Please enter some text to hash');
                return;
            }

            const encoder = new TextEncoder();
            const data = encoder.encode(input);
            
            let hash;
            switch (this.currentAlgorithm) {
                case 'MD5':
                    // Web Crypto API doesn't support MD5, we'll need to implement it separately
                    notifications.error('MD5 is not yet implemented');
                    return;
                default:
                    const buffer = await crypto.subtle.digest(this.currentAlgorithm, data);
                    const hashArray = Array.from(new Uint8Array(buffer));
                    hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }

            this.updateOutput(hash);
            notifications.success(`${this.currentAlgorithm} hash generated successfully`);
        } catch (error) {
            notifications.error('Failed to generate hash: ' + error.message);
        }
    }

    clear() {
        this.updateInput('');
        this.updateOutput('');
        notifications.info('Editors cleared');
    }

    updateInput(content) {
        const transaction = this.inputEditor.state.update({
            changes: {
                from: 0,
                to: this.inputEditor.state.doc.length,
                insert: content
            }
        });
        this.inputEditor.dispatch(transaction);
    }

    updateOutput(content) {
        const transaction = this.outputEditor.state.update({
            changes: {
                from: 0,
                to: this.outputEditor.state.doc.length,
                insert: content
            }
        });
        this.outputEditor.dispatch(transaction);
    }

    destroy() {
        if (this.inputEditor) {
            this.inputEditor.destroy();
        }
        if (this.outputEditor) {
            this.outputEditor.destroy();
        }
    }
} 
import { EditorView, basicSetup } from '@codemirror/basic-setup';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import BaseTool from './base-tool.js';
import notifications from '../notifications.js';

export default class UrlEncoder extends BaseTool {
    constructor() {
        super('URL Encoder');
        this.inputEditor = null;
        this.outputEditor = null;
    }

    async init() {
        // Create header with actions
        const encodeButton = this.createButton('Encode', () => this.encode());
        const decodeButton = this.createButton('Decode', () => this.decode());
        const swapButton = this.createButton('Swap', () => this.swap(), 'secondary');
        const clearButton = this.createButton('Clear', () => this.clear(), 'secondary');
        
        const header = this.createHeader([encodeButton, decodeButton, swapButton, clearButton]);
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
        outputLabel.textContent = 'Output';
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
    }

    encode() {
        try {
            const input = this.inputEditor.state.doc.toString();
            if (!input) {
                notifications.info('Please enter some text to encode');
                return;
            }

            const encoded = encodeURIComponent(input);
            this.updateOutput(encoded);
            notifications.success('Text URL encoded successfully');
        } catch (error) {
            notifications.error('Failed to encode text: ' + error.message);
        }
    }

    decode() {
        try {
            const input = this.inputEditor.state.doc.toString();
            if (!input) {
                notifications.info('Please enter some URL encoded text to decode');
                return;
            }

            const decoded = decodeURIComponent(input);
            this.updateOutput(decoded);
            notifications.success('URL decoded successfully');
        } catch (error) {
            notifications.error('Invalid URL encoded input');
        }
    }

    swap() {
        const input = this.inputEditor.state.doc.toString();
        const output = this.outputEditor.state.doc.toString();

        this.updateInput(output);
        this.updateOutput(input);
        notifications.info('Input and output swapped');
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
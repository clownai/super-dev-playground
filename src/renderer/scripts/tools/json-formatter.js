import { EditorView, basicSetup } from '@codemirror/basic-setup';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import BaseTool from './base-tool.js';
import notifications from '../notifications.js';

export default class JsonFormatter extends BaseTool {
    constructor() {
        super('JSON Formatter');
        this.editor = null;
    }

    async init() {
        // Create header with actions
        const formatButton = this.createButton('Format', () => this.formatJson());
        const copyButton = this.createButton('Copy', () => this.copyJson());
        const clearButton = this.createButton('Clear', () => this.clearJson());
        
        const header = this.createHeader([formatButton, copyButton, clearButton]);
        this.container.appendChild(header);

        // Create editor wrapper
        const editorWrapper = document.createElement('div');
        editorWrapper.className = 'editor-wrapper';
        this.container.appendChild(editorWrapper);

        // Get current theme
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        // Initialize CodeMirror
        const startState = EditorState.create({
            doc: await this.loadState('content') || '',
            extensions: [
                basicSetup,
                json(),
                isDark ? oneDark : [],
                EditorView.updateListener.of(update => {
                    if (update.docChanged) {
                        this.saveState('content', update.state.doc.toString());
                    }
                })
            ]
        });

        this.editor = new EditorView({
            state: startState,
            parent: editorWrapper
        });

        // Listen for theme changes
        window.addEventListener('themechange', ({ detail }) => {
            const transaction = this.editor.state.update({
                effects: StateEffect.reconfigure.of([
                    basicSetup,
                    json(),
                    detail.theme === 'dark' ? oneDark : []
                ])
            });
            this.editor.dispatch(transaction);
        });
    }

    formatJson() {
        try {
            const content = this.editor.state.doc.toString();
            if (!content.trim()) {
                notifications.info('Please enter some JSON to format');
                return;
            }

            const parsed = JSON.parse(content);
            const formatted = JSON.stringify(parsed, null, 2);
            
            const transaction = this.editor.state.update({
                changes: {
                    from: 0,
                    to: this.editor.state.doc.length,
                    insert: formatted
                }
            });
            
            this.editor.dispatch(transaction);
            notifications.success('JSON formatted successfully');
        } catch (error) {
            notifications.error(`Invalid JSON: ${error.message}`);
        }
    }

    async copyJson() {
        const content = this.editor.state.doc.toString();
        try {
            await navigator.clipboard.writeText(content);
            notifications.success('JSON copied to clipboard');
        } catch (error) {
            notifications.error('Failed to copy to clipboard');
        }
    }

    clearJson() {
        const transaction = this.editor.state.update({
            changes: {
                from: 0,
                to: this.editor.state.doc.length,
                insert: ''
            }
        });
        this.editor.dispatch(transaction);
        notifications.info('Editor cleared');
    }

    destroy() {
        if (this.editor) {
            this.editor.destroy();
        }
    }
} 
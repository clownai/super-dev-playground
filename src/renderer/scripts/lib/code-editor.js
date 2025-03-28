import { EditorState, EditorView, basicSetup } from '@codemirror/basic-setup';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';

const languageExtensions = {
    javascript: javascript(),
    html: html(),
    css: css(),
    json: json(),
    plaintext: []
};

export class CodeEditor {
    constructor(options = {}) {
        this.container = document.createElement('div');
        this.container.className = 'code-editor';
        this.view = null;
        this.options = {
            language: 'plaintext',
            theme: 'dark',
            readOnly: false,
            lineNumbers: true,
            ...options
        };

        this.setupEditor();
    }

    setupEditor() {
        const extensions = [
            basicSetup,
            languageExtensions[this.options.language] || [],
            this.options.theme === 'dark' ? oneDark : [],
            EditorView.lineWrapping,
            EditorView.updateListener.of(update => {
                if (update.docChanged && this.options.onChange) {
                    this.options.onChange(this.getValue());
                }
            }),
            this.options.readOnly ? EditorView.editable.of(false) : []
        ];

        const state = EditorState.create({
            doc: this.options.value || '',
            extensions
        });

        this.view = new EditorView({
            state,
            parent: this.container
        });

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .code-editor {
                height: 100%;
                overflow: hidden;
                background: var(--bg-primary);
            }

            .code-editor .cm-editor {
                height: 100%;
                width: 100%;
            }

            .code-editor .cm-scroller {
                font-family: 'Consolas', 'Courier New', monospace;
                line-height: 1.5;
            }

            .code-editor .cm-gutters {
                border-right: 1px solid var(--border-color);
                background: var(--bg-secondary);
            }

            .code-editor .cm-activeLineGutter {
                background: var(--bg-tertiary);
            }

            .code-editor .cm-content {
                white-space: pre-wrap;
            }

            .code-editor .cm-line {
                padding: 0 4px;
            }

            .code-editor .cm-selectionBackground {
                background: var(--selection-color) !important;
            }

            .code-editor .cm-focused {
                outline: none !important;
            }

            .code-editor .cm-cursor {
                border-left-color: var(--text-primary);
            }
        `;
        document.head.appendChild(style);
    }

    getValue() {
        return this.view.state.doc.toString();
    }

    setValue(value) {
        const transaction = this.view.state.update({
            changes: {
                from: 0,
                to: this.view.state.doc.length,
                insert: value
            }
        });
        this.view.dispatch(transaction);
    }

    setLanguage(language) {
        if (!languageExtensions[language]) {
            console.warn(`Language '${language}' not supported`);
            return;
        }

        const state = EditorState.create({
            doc: this.getValue(),
            extensions: [
                basicSetup,
                languageExtensions[language],
                this.options.theme === 'dark' ? oneDark : [],
                EditorView.lineWrapping,
                EditorView.updateListener.of(update => {
                    if (update.docChanged && this.options.onChange) {
                        this.options.onChange(this.getValue());
                    }
                }),
                this.options.readOnly ? EditorView.editable.of(false) : []
            ]
        });

        this.view.setState(state);
    }

    setTheme(theme) {
        this.options.theme = theme;
        const state = EditorState.create({
            doc: this.getValue(),
            extensions: [
                basicSetup,
                languageExtensions[this.options.language],
                theme === 'dark' ? oneDark : [],
                EditorView.lineWrapping,
                EditorView.updateListener.of(update => {
                    if (update.docChanged && this.options.onChange) {
                        this.options.onChange(this.getValue());
                    }
                }),
                this.options.readOnly ? EditorView.editable.of(false) : []
            ]
        });

        this.view.setState(state);
    }

    focus() {
        this.view.focus();
    }

    dispose() {
        if (this.view) {
            this.view.destroy();
        }
    }
} 
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const math = require("remark-math");
const remark2rehype = require("remark-rehype");
const katex = require("rehype-katex");
const html = require("rehype-stringify");
const doc = require("rehype-document");
const gfm = require("remark-gfm");
const visit = require("unist-util-visit");
const unified = require("unified");
const markdown = require("remark-parse");
require("katex/dist/contrib/mhchem.min.js");
const rehype2qmd = require('rehype-qmd');
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('qmdPreview.start', () => {
        QmdPanel.createOrShow(context.extensionUri);
    }));
}
exports.activate = activate;
class QmdPanel {
    constructor(panel, extensionUri) {
        var _a, _b;
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this._update((_b = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.getText()) !== null && _b !== void 0 ? _b : "");
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        vscode.workspace.onDidSaveTextDocument(e => {
            this._update(e.getText());
        });
    }
    static createOrShow(extensionUri) {
        // If we already have a panel, show it.
        if (QmdPanel.currentPanel) {
            QmdPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(QmdPanel.viewType, 'Cat Coding', vscode.ViewColumn.Two, {
            // Enable javascript in the webview
            enableScripts: true,
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
        });
        QmdPanel.currentPanel = new QmdPanel(panel, extensionUri);
    }
    dispose() {
        QmdPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update(text) {
        const webview = this._panel.webview;
        this._panel.title = 'QuestionMarkdown Preview';
        this._panel.webview.html = this._getHtmlForWebview(webview, text);
    }
    _getHtmlForWebview(webview, text) {
        return unified()
            .use(markdown)
            .use(math)
            .use(gfm)
            .use(remark2rehype)
            .use(rehype2qmd)
            .use(katex)
            .use(doc, {
            css: [
                "https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css",
                webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'qmd.css')).toString()
            ],
            style: `body {
				background: white;
			}`
        })
            .use(() => (node) => {
            visit(node, (x) => x.tagName === 'div' && x.properties.class == 'r', (a) => {
                const rightAnswer = a.children.find((x) => x.tagName == "p").children.find((x) => x.type == "text").value;
                visit(node, (x) => x.tagName === 'style', (b) => {
                    b.children.find((x) => x.type == "text").value += `
					#right-answer:checked ~ #${rightAnswer} + label {
						background: green;
					}
					`;
                });
            });
            return node;
        })
            .use(html)
            .processSync(text).contents.toString();
    }
}
QmdPanel.viewType = 'qmdPreview';
//# sourceMappingURL=extension.js.map
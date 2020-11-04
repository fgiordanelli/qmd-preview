import * as vscode from 'vscode'
import * as math from 'remark-math'
import * as remark2rehype from 'remark-rehype'
import * as katex from 'rehype-katex'
import * as html from 'rehype-stringify'
import * as doc from 'rehype-document'
import * as gfm from 'remark-gfm'
import * as visit from 'unist-util-visit'
import * as unified from 'unified'
import * as markdown from 'remark-parse'
import 'katex/dist/contrib/mhchem.min.js'
const rehype2qmd = require('rehype-qmd')

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('qmdPreview.start', () => {
			QmdPanel.createOrShow(context.extensionUri);
		})
	);
}

class QmdPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: QmdPanel | undefined;

	public static readonly viewType = 'qmdPreview';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		// If we already have a panel, show it.
		if (QmdPanel.currentPanel) {
			QmdPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			QmdPanel.viewType,
			'Cat Coding',
			vscode.ViewColumn.Two,
			{
				// Enable javascript in the webview
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
			}
		);



		QmdPanel.currentPanel = new QmdPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update(vscode.window.activeTextEditor?.document.getText() ?? "");

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		vscode.workspace.onDidSaveTextDocument(e => {
			this._update(e.getText())
		})

	}



	public dispose() {
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

	private _update(text: string) {
		const webview = this._panel.webview;

		this._panel.title = 'QuestionMarkdown Preview';
		this._panel.webview.html = this._getHtmlForWebview(webview, text);
	}



	private _getHtmlForWebview(webview: vscode.Webview, text: string) {

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
		.use(() => (node: any) => {
			visit(node, (x: any) => x.tagName === 'div' && x.properties.class == 'r', (a: any) => {
				const rightAnswer = a.children.find((x:any) => x.tagName == "p").children.find((x: any) => x.type == "text").value
				
				visit(node, (x: any) => x.tagName === 'style', (b: any) => {
					b.children.find((x: any) => x.type == "text").value += `
					#right-answer:checked ~ #${rightAnswer} + label {
						background: green;
					}
					`
				})
			})
			return node
		})
		.use(html as any)
		.processSync(text).contents.toString()

	}
}

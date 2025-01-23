// The module 'vscode' contains the VS Code extensibility API

const OllamaPanel = require("./src/SearchPanel");
const EUtils = require("./src/EditorUtils");
const GUtils = require("./src/GUtils");
const vscode = require("vscode");
const SidebarProvider = require("./src/SidebarProvider");
const OllamaUtils = require('./src/OllamaUtils');



/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider( "starlight-llama-sidebar",sidebarProvider)
	);


	const searchCmd = vscode.commands.registerCommand('starlight-llama.search', async function () {
		OllamaPanel.createOrShow(context.extensionUri);
	});

	context.subscriptions.push(searchCmd);


	const ollamaCmd = vscode.commands.registerCommand('starlight-llama.generate', async function () {
		vscode.window.showInformationMessage("Testing generate");
		const currentLine = EUtils.getCurrentLineText();
		if (currentLine != null) {
			let cl = GUtils.trim(currentLine);
			if (!cl) return;

			try {
				await OllamaUtils.callOllama(cl);
			} catch (e) {
				vscode.window.showErrorMessage("" + e);
			}
		}
	});

	context.subscriptions.push(ollamaCmd);
}

// This method is called when extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}

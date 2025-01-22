// The module 'vscode' contains the VS Code extensibility API

const OllamaPanel = require("./src/OllamaPanel");
const EUtils = require("./src/editor-utils");
const GUtils = require("./src/g-utils");
const vscode = require("vscode");
const OllamaUtils = require('./src/ollama-utils');



/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

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

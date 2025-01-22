// The module 'vscode' contains the VS Code extensibility API

const OllamaPanel = require("./src/OllamaPanel");
const EUtils = require("./src/editor-utils");
const GUtils = require("./src/g-utils");
const HelloWorldPanel = require( "./src/HelloWorldPanel");
const vscode = require("vscode");
const OllamaUtils = require('./src/ollama-utils');

// import {Utils  as EUtils} from './js/editor-utils';
// import {Utils  as GUtils} from './js/g-utils';
// import SlOllama from './js/WOllama';

// import * as vscode from 'vscode';

// Import the module and reference it with the alias vscode in your code below

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "starlight-llama" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('starlight-llama.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage("Testing something");

		HelloWorldPanel.createOrShow(context.extensionUri);
	});

	const searchCmd = vscode.commands.registerCommand('starlight-llama.search', async function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage("searching");

		OllamaPanel.createOrShow(context.extensionUri);
	});

	context.subscriptions.push(searchCmd);


	const ollamaCmd = vscode.commands.registerCommand('starlight-llama.generate', async function () {

		vscode.window.showInformationMessage("Testing generate");

		const currentLine = EUtils.getCurrentLineText();
		if(currentLine != null){
			vscode.window.showInformationMessage(EUtils.getSelectedText());
			vscode.window.showInformationMessage(currentLine);
			let cl = GUtils.trim(currentLine);
			if(!cl) return;

			try{
				const str = await OllamaUtils.callOllama(cl);
			}catch(e){
				vscode.window.showErrorMessage("" + e);
			}
		}
	});

	context.subscriptions.push(ollamaCmd);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

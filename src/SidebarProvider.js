// import * as vscode from "vscode";
// import { authenticate } from "./authenticate";
// import { accessTokenKey, apiBaseUrl, refreshTokenKey } from "./constants";
// import { FlairProvider } from "./FlairProvider";
// import { getNonce } from "./getNonce";
// import { mutation, mutationNoErr } from "./mutation";
// import { SnippetStatus } from "./SnippetStatus";
// import { SwiperPanel } from "./SwiperPanel";
// import { Util } from "./Util";
// import { ViewCodeCardPanel } from "./ViewCodeCardPanel";


const SearchPanel = require("./SearchPanel");
// const EUtils = require("./src/editor-utils");
const GUtils = require("./GUtils");
const path = require('path');

const OllamaUtils = require('./OllamaUtils');
const vscode = require('vscode');

const getNonce = require('./GetNonce');
// const OllamaUtils = require('./src/ollama-utils');


class SidebarProvider{
    static currentPanel; // current panel from type HelloWorldPanel
    _panel; // vscode.WebviewPanel
    _extensionUri; // vscode.Uri

  constructor(extensionUri) { 
    this._extensionUri = extensionUri;
    console.log("constructor");
  }

  async resolveWebviewView(webviewView, context, token) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, "media"),
                vscode.Uri.joinPath(this._extensionUri, "out/compiled"),
            ],
    };
    try{
        webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview);
    }catch(e){
        console.log(e);
        throw e
    }

    webviewView.webview.onDidReceiveMessage(async (data) => {
        switch (data.type) {
            case "onInfo": {
                if (!data.value) {
                    return;
                }
                vscode.window.showInformationMessage(data.value);
                break;
            }
            case "onErr": {
                if (!data.value) {
                    return;
                }
                vscode.window.showErrorMessage(data.value);
                break;
            }
            case "onDownload":{
              try{
                const result = await vscode.window.showInformationMessage(
                  "This will download Ollama and run the downlaoded exe. Do you want to continue?",
                  { modal: true },
                  "Yes", "No");
                if (result === 'Yes') {
                  OllamaUtils.downloadProgressAndRun();
                }                 
              }catch(e){
                vscode.window.showErrorMessage(e);
              }
              break;
            }
            case "onTest":{
              await OllamaUtils.testOllama();
              break;
            }
            case "onSearch": {
              vscode.window.showInformationMessage("on search");
              SearchPanel.createOrShow(this._extensionUri);
              
              break;
            }
            case "onAutoComplete":{
              vscode.window.showInformationMessage("on autocomplete");
              OllamaUtils.toggleAutoComplete();
              break;
            }
        }
    });
  }

  revive(panel) {
    this._view = panel;
  }

  async _getHtmlForWebview(webview) {
    const stylesResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "ollama-sidebar.js")
    );

    // // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();
    const itemsOllama = []; //await OllamaUtils.listOllama();
    const jsonArray = JSON.stringify(itemsOllama);
    const autoComplete = OllamaUtils.sett.autocomplete;

    let html = await GUtils.readHtmlFile(
        path.join(this._extensionUri.fsPath, "media", "sidebar-view.html")
    );
    
    html = html.replaceAll("${webview.cspSource}", webview.cspSource);
    html = html.replaceAll("${stylesResetUri}", stylesResetUri);
    html = html.replaceAll("${stylesMainUri}", stylesMainUri);
    html = html.replaceAll("${scriptUri}", scriptUri);
    html = html.replaceAll("${nonce}", nonce);
    html = html.replaceAll("${itemsOllama}", itemsOllama);
    html = html.replaceAll("${jsonArray}", jsonArray);
    html = html.replaceAll("${autoComplete}", autoComplete);
    return html;
  }
}

module.exports = SidebarProvider;
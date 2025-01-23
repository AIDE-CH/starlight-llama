

const GUtils = require("./GUtils");
const OllamaUtils = require('./OllamaUtils');
const vscode = require('vscode');
const path = require('path');

const getNonce = require('./GetNonce');


class OllamaPanel {
    static currentPanel; // current panel from type HelloWorldPanel
    _panel; // vscode.WebviewPanel
    _extensionUri; // vscode.Uri

    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
          ? vscode.window.activeTextEditor.viewColumn
          : undefined;

        // If we already have a panel, show it.
        if (OllamaPanel.currentPanel) {
          OllamaPanel.currentPanel._panel.reveal(column);
          OllamaPanel.currentPanel._update();
            return;
        }


    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      OllamaPanel.viewType,
      "Ollama Search",
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,
        enableCommandUris: true,
        enableForms: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out/compiled"),
        ],
      }
    );

    OllamaPanel.currentPanel = new OllamaPanel(panel, extensionUri);
    }


    static kill() {
      OllamaPanel.currentPanel?.dispose();
      OllamaPanel.currentPanel = undefined;
    }

    static revive(panel, extensionUri) {
      OllamaPanel.currentPanel = new OllamaPanel(panel, extensionUri);
    }

    constructor(panel, extensionUri, html) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update(html);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    dispose() {
      OllamaPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    async _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = await this._getHtmlForWebview(webview);
        //this._getOllamaSearch(webview);

        webview.onDidReceiveMessage(async (data) => {
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
                    OllamaUtils.downloadProgressAndRun();
                  }catch(e){
                    vscode.window.showErrorMessage(e);
                  }
                  break;
                }
                case "onTest":{
                  await OllamaUtils.testOllama();
                  break;
                }
                case "onModel": {                  
                    if (!data.value) {
                        return;
                    }
                    OllamaUtils.setModel(data.value);
                    break;
                }
            }
        });
    }
    
  async _getHtmlForWebview(webview) {
    const stylesResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "search-panel.js")
    );

    // // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();
    const itemsOllama = await OllamaUtils.listOllama();
    const jsonArray = JSON.stringify(itemsOllama);

    
    let html = await GUtils.readHtmlFile(
      path.join(this._extensionUri.fsPath, "media", "search-panel.html")
    );

    html = html.replaceAll("${webview.cspSource}", webview.cspSource);
    html = html.replaceAll("${stylesResetUri}", stylesResetUri);
    html = html.replaceAll("${stylesMainUri}", stylesMainUri);
    html = html.replaceAll("${scriptUri}", scriptUri);
    html = html.replaceAll("${nonce}", nonce);
    html = html.replaceAll("${itemsOllama}", itemsOllama);
    html = html.replaceAll("${jsonArray}", jsonArray);
    return html;
  }

  _getViewOptions(eUri){
    return {
      enableScripts: true,
      enableCommandUris: true,
      enableForms: true,
      loadResourceRoot: [vscode.Uri.joinPath(eUri, 'media')]
    };
  }

}

module.exports = OllamaPanel;
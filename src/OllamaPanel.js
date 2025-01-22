

const OllamaUtils = require('./ollama-utils');
const vscode = require('vscode');

const getNonce = require('./getNonce');


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
    // // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "ollama-panel.js")
    );

    // // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();
    const itemsOllama = await OllamaUtils.listOllama();
    const jsonArray = JSON.stringify(itemsOllama);

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${stylesResetUri}" rel="stylesheet">
        <link href="${stylesMainUri}" rel="stylesheet">
		</head>
    <body>
      <input placeholder="search for a model" id="searchInput" style="width: 60%; display:inline-block;" />
      <button id="ollama-test" style="width: fit-content;">Test Ollama</button>
      <button id="ollama-download" style="width: fit-content;">Download Ollama</button>
      <div id="ollama-results-number-div"> </div>
      <div id="ollama-results-div"> </div>
      <script nonce="${nonce}">
        //console.log("######################## 1");
        const allModels = JSON.parse('${jsonArray}');
        //console.log("######################## 2");
      </script>
      <script src="${scriptUri}" nonce="${nonce}">
      </script>
      <script nonce="${nonce}">  
        OllamaJsUtil.nonce = "${nonce}";
        function setModelFromMainPage(modelName){
          OllamaJsUtil.setModel(modelName);
        }
        //console.log("######################## 10");
        const resultsDiv = document.getElementById("ollama-results-div");
        const resultsNumberDiv = document.getElementById("ollama-results-number-div");
        const searchInput = document.getElementById("searchInput");
        searchInput.value = "llama phi";
        //console.log("######################## 11");
        OllamaJsUtil.buildList(allModels, resultsDiv, resultsNumberDiv);
        //console.log("######################## 12");
        searchInput.focus();
        searchInput.addEventListener('keydown', (event) => {const filterdModels = OllamaJsUtil.search(allModels, event); 
                                                            OllamaJsUtil.buildList(filterdModels, resultsDiv, resultsNumberDiv);
                                    });
        const ollamaTest = document.getElementById("ollama-test");
        const ollamaDownload = document.getElementById("ollama-download");
        ollamaTest.addEventListener('click', (event) => OllamaJsUtil.test() );
        ollamaDownload.addEventListener('click', (event) => OllamaJsUtil.download());
      </script>
    </body>
		</html>`;
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
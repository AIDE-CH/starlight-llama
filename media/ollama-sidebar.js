
const vscodeOllama = acquireVsCodeApi();

class OllamaJsUtil{
    static nonce = "";

    static search(){
        vscodeOllama.postMessage({ type: "onSearch", value: null });
    }

    static autoComplete(){
        vscodeOllama.postMessage({ type: "onAutoComplete", value: null });
    }

    static download(){
        vscodeOllama.postMessage({ type: "onDownload", value: null });
    }

    static test(){
        //console.log("on test");
        vscodeOllama.postMessage({ type: "onTest", value: null });
    }

    static info(txt){
        vscodeOllama.postMessage({ type: "onInfo", value: txt });
    }

    static err(txt){
        vscodeOllama.postMessage({ type: "onErr", value: txt });
    }


}
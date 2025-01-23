
const vscode = require("vscode");
const EUtils = require('./EditorUtils');
const PromptUtils = require('./PromptUtils');
const Langs = require("./langs/Langs");

const { default: ollama } = require("ollama");
const cheerio = require('cheerio');

const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');
const path = require('path');
//const https = require('https');
const request = require('request');
var progress = require('request-progress');

class Utils{
    static sett = {model: "llama3.1:8b", url: "http://localhost:11434", 
        autocomplete: true, cacheSize: 100};

    static cache = PromptUtils.createCache(Utils.sett.cacheSize);

    static getSettings(){
        const configuration = vscode.workspace.getConfiguration("starlight-llama"); 
        const model = configuration.get("model");
        const url = configuration.get("url");
        const autocomplete = configuration.get("autocomplete");
        if(model){
            Utils.sett.model = model;
        }
        if(url){
            Utils.sett.url = url;
        }
        Utils.sett.autocomplete = autocomplete;
    }

    static saveSettings(){
        const configuration = vscode.workspace.getConfiguration("starlight-llama");
        configuration.update("model", Utils.sett.model, true);
        configuration.update("url", Utils.sett.url, true);
        configuration.update("autocomplete", Utils.sett.autocomplete, true);
    }

    static trackPromise(promise) {
        let state = 'pending';
        let result;
    
        // Add methods to the promise to check its state
        promise
            .then(
                value => {
                    state = 'fulfilled';
                    result = value;
                    return value;
                },
                reason => {
                    state = 'rejected';
                    result = reason;
                    //throw reason;
                }
            );
    
        // Return an enhanced promise with state-checking methods
        return Object.assign(promise, {
            getState: () => state,
            getResult: () => result,
        });
    }
    
    static async setModel(model){
        try{
            Utils.sett.model = model;
            Utils.saveSettings();
            let asyncIterator = ollama.pull({ model: model, insecure: false, stream: false} );
            asyncIterator = Utils.trackPromise(asyncIterator);


            // let currentProgress  = 0;
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title:  `pulling ${model} this may take few minutes...`,
                cancellable: false
            }, (progress, token) => {
                token.onCancellationRequested(() => {
                    canceled = true;
                    console.log('User canceled the operation');
                });
    
                // let last = 0;
                return new Promise((resolve) => {
                    const interval = setInterval(() => {
                        let done = false;
                        try{
                            if(asyncIterator.getState() == "pending"){
                            }else{
                                done = true;
                                if(asyncIterator.getState() == "rejected"){
                                    let message = `done pulling ${model} with error.`;
                                    progress.report({ increment: 100, message:  message});
                                    vscode.window.showErrorMessage(message);
                                }else{
                                    let message = `done pulling ${model}.`;
                                    progress.report({ increment: 100, message: message });
                                    vscode.window.showInformationMessage(message);
                                }
                            }
                    
                        }catch(e){
                            console.log(e);
                        }
        
                        if (done) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 1000); // Update progress every second
                });
            });
        }catch(e){
            vscode.window.showErrorMessage(e);
        }
    }
    
    static setUrl(url){
        Utils.sett.url = url;
        Utils.saveSettings();
    }

    static toggleAutoComplete(){
        Utils.sett.autocomplete = !Utils.sett.autocomplete;
        Utils.saveSettings();
    }

    static async listOllama(){
        let ret = new Array();
        const response = await fetch('https://ollama.com/search');
        const html = await response.text();
        const page = cheerio.load(html);
        const allLinks = page("a");
        for( const a of allLinks){
            const href = a.attribs["href"];
            if(href && href.startsWith("/library/")){
                let name = null;
                let description = null;
                let params = new Array();
                try{name = cheerio.load(a)("div h2 span").text();}catch(ee){}
                try{ description = cheerio.load(a)("div p").text().replaceAll("\n", " ").replaceAll("'", "");}catch(ee){}

                try{
                    for(const elem of cheerio.load(a)("div div span")){
                        params.push( cheerio.load(elem).text() );
                    }
                }catch(ee){}

                ret.push({
                    name: name,
                    href: href,
                    description: description,
                    params: params,
                });
            }
        }
        return ret;
    }
    
    static async autoCompleteWithOllama(beforeText, afterText) {
        try{
            const language = EUtils.getLanguage();
            const langHandler = Langs.l(language);
            if(!langHandler) throw new Error(`No language handler for the language(${language})`);
            //let ud = langHandler.removeComments(description); // updated description
            if(!beforeText) return null;
            
            const cache = Utils.cache.has(beforeText);
            let gen = null; //generated
            if(cache){
                gen = cache.result;
            }else{
                //let gf =  await Utils._ollamaCompleteUsingGenerateApi(beforeText, afterText, language, langHandler); // generated function
                gen = await Utils._ollamaCompleteUsingChatApi(beforeText, afterText, language, langHandler); // gen
                if(!gen) return null;
                gen = PromptUtils.handleSimilarToBefore(beforeText, gen);
                if(!gen) return null;
                Utils.cache.add(beforeText, gen);
            }

            if(!gen) return null;
            return gen;
        }catch(e){
            vscode.window.showErrorMessage("Error: " + e);
        }
        return null;
    }

    static _removeFromStart(str, before){
        if(str.startsWith(before)) return str.sub
    }

    static async _ollamaCompleteUsingChatApi(beforeText, afterText, lang, langHandler) {
        Utils.getSettings();

        const content = `you are a ${lang} coding completion assistant. 
        I will provide a ${lang} code surrounded by ##########".
        This is the ${lang} code:
        ##########
        ${beforeText}
        ##########
        Please Complete the given ${lang} code.
        Do not provide any explaination. 
        Use standard ${lang} naming conventions if needed.
        Provide only the code.
        Donot provide analysis or usage examples.`;
        ollama.config.host = Utils.sett.url;
        const response = await ollama.chat({
            model: Utils.sett.model, 
            messages: [
                {   role: 'user', 
                    content: content }
            ]
        });

        let str = response.message.content;
        //console.log(str);
        return langHandler.extractGeneratedFunction(str);
    }


    static async _ollamaCompleteUsingGenerateApi(beforeText, afterText, lang, langHandler) {
        Utils.getSettings();

        // const content = ` you are a ${lang} coding assistant. Please complete the following ${lang} function which does the following:
        //             ${description}.
        //             Provide standard function documentation. 
        //             Use standard ${lang} naming conventions.
        //             Provide only the function.
        //             Donot provide analysis or usage examples.`;
        ollama.config.host = Utils.sett.url;
        const response = await ollama.generate({
            model: Utils.sett.model, 
            prompt: beforeText,
            // suffix: afterText, // not supported as it seams for now
        });

        let str = response.response;
        //console.log(str);
        return langHandler.extractGeneratedFunction(str);
    }

    static async generateFunctionWithOllama(description) {
        try{
            const language = EUtils.getLanguage();
            const langHandler = Langs.l(language);
            if(!langHandler) throw new Error(`No language handler for the language(${language})`);
            let ud = langHandler.removeComments(description); // updated description
            
            if(!ud) return null;
            
            let gf = await Utils._ollamaChatToGenerateFunction(ud, language, langHandler); // generated function
            if(!gf) return;
            EUtils.addLineAfterCurrentLine(gf);
        }catch(e){
            vscode.window.showErrorMessage("Error: " + e);
        }
    }

    static async _ollamaChatToGenerateFunction(description, lang, langHandler) {
        Utils.getSettings();
        const content = ` you are a ${lang} coding assistant. Please write a ${lang} function which does the following:
                    ${description}.
                    Provide standard function documentation. 
                    Use standard ${lang} naming conventions.
                    Provide only the function.
                    Donot provide analysis or usage examples.`;
        ollama.config.host = Utils.sett.url;
        
        const response = await ollama.chat({
            model: Utils.sett.model, 
            messages: [
                {   role: 'user', 
                    content: content }
            ]
        });
        let str = response.message.content;
        
        //console.log(str);
        return langHandler.extractGeneratedFunction(str);
    }


    static async testOllama(){
        try{
            Utils.getSettings();
            const response = await fetch(Utils.sett.url);
            let ok = true;
            let html = "no response from Ollama";
            if(!response) ok = false;
            if(ok){
                html = await response.text();
                if(!html){
                    ok = false;
                }
            }
            if(ok){
                vscode.window.showInformationMessage(html);
            }else{
                vscode.window.showErrorMessage(html);
            }
        }catch(e){
            vscode.window.showErrorMessage("Calling ollama returned an error: " + e);
        }
    }

    static downloadProgressAndRun(){
        //Utils.showProgress();
        const downloadUrl = "https://ollama.com/download/OllamaSetup.exe";
        const downloadPath = path.join(os.homedir(), 'Downloads', 'OllamaSetup.exe');

        
        let currentProgress = 0;
        let canceled = false;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Processing...",
            cancellable: false
        }, (progress, token) => {
            token.onCancellationRequested(() => {
                canceled = true;
                console.log('User canceled the operation');
            });

            let last = 0;
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    if(currentProgress < 100){
                        progress.report({ increment: currentProgress-last, message: `${currentProgress}% complete` });
                    }else{
                        progress.report({ increment: 100, message: `done downloading, running the installer` });
                    }
                    last = currentProgress;
    
                    if (currentProgress >= 100) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 1000); // Update progress every second
            });
        });
        
        progress(request(downloadUrl), {
            // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms 
            // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms 
            // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length 
        }).on("progress", function (state) {
            try{
                //console.log(state);
                currentProgress = Math.floor(state.percent*1000)/10;
            }catch(e){console.log(e);}
        }).on("error", function (err) {
            vscode.window.showErrorMessage(err); 
        }).on("end", function () {
            currentProgress = 100;
            exec(downloadPath, 
                (error, stdout, stderr) => { 
                    if (error) { 
                        vscode.window.showErrorMessage(`Error executing file: ${error}`); 
                        return; 
                    } 
                    console.log(`stdout: ${stdout}`); 
                    console.error(`stderr: ${stderr}`);
                });
            //vscode.window.showInformationMessage("done downloading ollama."); 
        }).pipe(fs.createWriteStream(downloadPath));
    }
    
}

module.exports = Utils;
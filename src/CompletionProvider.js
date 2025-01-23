
const OllamaUtils = require('./OllamaUtils');
const vscode = require("vscode");


class CompletionProvider{
    inRequest = false;
    statusbar; // vscode.StatusBarItem;
    context; // vscode.ExtensionContext;
    // private _paused: boolean = false;
    // private _status: Status = { icon: "chip", text: "Llama Coder" };

    constructor(statusbar, context) {
        this.statusbar = statusbar;
        this.context = context;
        this.inRequest = false;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    
    async provideInlineCompletionItems(document, position, context, token) {
        let ret = undefined;
        if(!OllamaUtils.sett.autocomplete) return ret;
        if(this.inRequest) return ret;
        this.inRequest = true;
        try{
            ret = this._do(document, position, context, token);
            this.inRequest = false;
        }catch(e){
            this.inRequest = false;
            vscode.window.showErrorMessage("" + e);
        }
        return ret;
    }

    async _do(document, position, context, token) {
        try {
            console.log(document.getText());
            if (this.paused) {
                return;
            };
            await this.delay(500);
            if (token.isCancellationRequested) {
                console.log(`Canceled before calling ollama.`);
                return;
            }
            
            
            let text = document.getText();
            let offset = document.offsetAt(position);
            let beforeText = text.slice(0, offset);
            let afterText = text.slice(offset);

            // // Ignore unsupported documents
            // if (!isSupported(document)) {
            //     info(`Unsupported document: ${document.uri.toString()} ignored.`);
            //     return;
            // }

            // // Ignore if not needed
            // if (isNotNeeded(document, position, context)) {
            //     info('No inline completion required');
            //     return;
            // }

            // Ignore if already canceled
            if (token.isCancellationRequested) {
                console.log(`Canceled before calling ollama.`);
                return;
            }

            // Execute in lock

                // // Prepare context
                // let prepared = await preparePrompt(document, position, context);
                // if (token.isCancellationRequested) {
                //     info(`Canceled before AI completion.`);
                //     return;
                // }

                // // Result
                // let res: string | null = null;

                // // Check if in cache
                // let cached = getFromPromptCache({
                //     prefix: prepared.prefix,
                //     suffix: prepared.suffix
                // });

                // // If not cached
                // if (cached === undefined) {

                //     // Config
                //     let inferenceConfig = config.inference;

                //     // Update status
                //     this.update('sync~spin', 'Llama Coder');
                //     try {

                //         // Check model exists
                //         let modelExists = await ollamaCheckModel(inferenceConfig.endpoint, inferenceConfig.modelName, inferenceConfig.bearerToken);
                //         if (token.isCancellationRequested) {
                //             info(`Canceled after AI completion.`);
                //             return;
                //         }

                //         // Download model if not exists
                //         if (!modelExists) {

                //             // Check if user asked to ignore download
                //             if (this.context.globalState.get('llama-coder-download-ignored') === inferenceConfig.modelName) {
                //                 info(`Ingoring since user asked to ignore download.`);
                //                 return;
                //             }

                //             // Ask for download
                //             let download = await vscode.window.showInformationMessage(`Model ${inferenceConfig.modelName} is not downloaded. Do you want to download it? Answering "No" would require you to manually download model.`, 'Yes', 'No');
                //             if (download === 'No') {
                //                 info(`Ingoring since user asked to ignore download.`);
                //                 this.context.globalState.update('llama-coder-download-ignored', inferenceConfig.modelName);
                //                 return;
                //             }

                //             // Perform download
                //             this.update('sync~spin', 'Downloading');
                //             await ollamaDownloadModel(inferenceConfig.endpoint, inferenceConfig.modelName, inferenceConfig.bearerToken);
                //             this.update('sync~spin', 'Llama Coder')
                //         }
                //         if (token.isCancellationRequested) {
                //             info(`Canceled after AI completion.`);
                //             return;
                //         }

                //         // Run AI completion
                //         info(`Running AI completion...`);
                //         res = await autocomplete({
                //             prefix: prepared.prefix,
                //             suffix: prepared.suffix,
                //             endpoint: inferenceConfig.endpoint,
                //             bearerToken: inferenceConfig.bearerToken,
                //             model: inferenceConfig.modelName,
                //             format: inferenceConfig.modelFormat,
                //             maxLines: inferenceConfig.maxLines,
                //             maxTokens: inferenceConfig.maxTokens,
                //             temperature: inferenceConfig.temperature,
                //             canceled: () => token.isCancellationRequested,
                //         });
                //         info(`AI completion completed: ${res}`);

                //         // Put to cache
                //         setPromptToCache({
                //             prefix: prepared.prefix,
                //             suffix: prepared.suffix,
                //             value: res
                //         });
                //     } finally {
                //         this.update('chip', 'Llama Coder');
                //     }
                // } else {
                //     if (cached !== null) {
                //         res = cached;
                //     }
                // }
                if (token.isCancellationRequested) {
                    console.log(`Canceled before calling ollama.`);
                    return;
                }

                // Return result
                // if (res && res.trim() !== '') {
                //     return [{
                //         insertText: res,
                //         range: new vscode.Range(position, position),
                //     }];
                // }

                let compText = await OllamaUtils.autoCompleteWithOllama(beforeText, afterText);

                
                return [{
                    insertText: compText,
                    range: new vscode.Range(position, position),
                }];

                // Nothing to complete
        } catch (e) {
            vscode.window.showErrorMessage('Error during inference:' + e);
        }
    }
}

module.exports = CompletionProvider;
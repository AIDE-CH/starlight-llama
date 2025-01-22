
const vscodeOllama = acquireVsCodeApi();

class OllamaJsUtil{
    static nonce = "";

    static search(items, inputEvent){
        console.log(inputEvent.key );
        if(inputEvent.key == "Enter"){
            console.log("############## Enter");
            let str = inputEvent.target.value;
            if(str){
                str = str.toLowerCase().trim();
            }
            if(str){
                const words = str.split(/\s+/).filter(word => word.trim().length > 0);
                if(words.length > 0){
                    let ret = new Array();
                    for(const i of items){
                        for(const w of words){
                            try{
                                if(i.name.toLowerCase().includes(w)){
                                    ret.push(i);
                                    break;
                                }
                            }catch(e){}
                        }
                    }
                    return ret;
                }
            }
        }
        return items;
    }

    static buildList( items, listDiv, numberDiv ){
        console.log("######################## build list");
        listDiv.replaceChildren();
        const titleStyle = "font-size:large; display: inline-block; width: fit-content; font-weight: bold;"
               + "border: solid 2px rgb(0, 143, 252);"
               //+ "color: var(--vscode-button-background);"
               + "padding: 4px 8px;"
               + "margin-right: 8px;";
               //+ "background: black;";
    
        for(const i of items){
          const div = document.createElement("div");
          const spanTitle = document.createElement("button");
          spanTitle.innerHTML = i.name;
          spanTitle.style = titleStyle;
          spanTitle.addEventListener("click", () => { OllamaJsUtil.setModel(`"${i.name}"`); });
          div.appendChild(spanTitle);
          for(const m of i.params){
            let mPp = `${i.name}:${m}`; // model Plus parameter
            const button = document.createElement("button");
            button.innerHTML = m;
            button.style = "width: fit-content; margin-right: 5px; padding: 4px;";
            button.addEventListener("click", () => { OllamaJsUtil.setModel(`${mPp}`); });
            div.appendChild(button);
          }
          div.appendChild( document.createElement("br") );
        
          
          const describeSpan = document.createElement("span");
          describeSpan.style = "font-size:normal;";
          describeSpan.innerHTML = i.description;

          div.appendChild( describeSpan );
          div.appendChild( document.createElement("hr") );
          listDiv.appendChild(div);
        }
        numberDiv.innerHTML = items.length + "  models are found";
        numberDiv.style.color = "rgb(250, 204, 21)";
        numberDiv.style.fontWeight = "800";
    }

    static setModel(mod){
        vscodeOllama.postMessage({ type: "onModel", value: mod });
    }

    static download(){
        //console.log("on donwload");
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
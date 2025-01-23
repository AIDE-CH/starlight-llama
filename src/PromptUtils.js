
const vscode = require("vscode");
const GUtils = require('./GUtils');

class Cache{
    buff;
    
    constructor(size){
        this.buff = GUtils.circularBuffer(size);
    }

    add(prompt, result){
        let found = this.has(prompt);
        if(!found){
            this.buff.add({prompt: prompt, result: result});
        }
    }

    has(prompt){
        return this.buff.find((i)  => {return i.prompt == prompt});
    }

}


class Utils {
    static lastLine(txt){
        if(!txt) return null;
        const lines = txt.split('\n');
        if(lines.length == 0) return null;
        return lines[lines.length - 1].trim();
    }

    static handleSimilarToBefore(beforeText, result){
        if(!result) return null;
        result = result.trim();
        if(result.startsWith(beforeText)) return result.substring(beforeText.length);
        const lastLine = Utils.lastLine(beforeText);
        if(result.startsWith(lastLine)) return result.substring(lastLine.length);

        return result;
    }

    static createCache(size){
        return new Cache(size);
    }
}

module.exports = Utils;

const vscode = require("vscode");

class Utils{
    static trim(str) {
        if(!str){
            return null;
        }
        return str.trim();
    }

    static removeComment(str){
        if(str.startsWith('#')) return str.substring(1).trim();
        return str;
    }
}

module.exports = Utils;
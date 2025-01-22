
class LangHandler{

    generatedFunctionStart = "";
    generatedFunctionEnd = "";

    lineComments = [];
    multiLineComments = [];

    extractGeneratedFunction(str){
        if(!str) return str;
        str = str.trim();
        if(!str) return str;

        str = LangHandler.removeFromStart(str, this.generatedFunctionStart);
        str = LangHandler.removeFromEnd(str, this.generatedFunctionEnd);
        
        if(str) str = str.trim();
        return str;
    }

    removeComments(str){
        if(!str) return str;
        str = str.trim();
        if(!str) return str;

        for(let mlc of this.multiLineComments){
            str = LangHandler.removeFromStart(str, mlc.start);
            if(!str) return str;
            str = str.trim();
            if(!str) return str;
            str = LangHandler.removeFromEnd(str, mlc.end);
            if(!str) return str;
            str = str.trim();
            if(!str) return str;
        }
        
        for(let slc of this.singleLineComments){
            str = LangHandler.removeFromStart(str, slc);
            if(!str) return str;
            str = str.trim();
            if(!str) return str;
        }
        
        if(str) str = str.trim();
        return str;
    }

    static removeTillFirstOf(str, startStr){
        if(startStr){
            let startIndex = str.indexOf(startStr); 
            if (startIndex !== -1) {
                str = str.substring(startIndex + startStr.length);
            }
        }
        return str;
    }
    
    static removeTillEndOf(str, endStr){
        if(endStr){
            let startIndex = str.indexOf(endStr);
            if (startIndex !== -1) {
                str = str.substring(0, startIndex);
            }
        }
        return str;
    }
    

    static removeFromStart(str, startStr){
        if(startStr && str){
            if (str.startsWith(startStr)) {
                str = str.substring(startStr.length);
            }
        }
        return str;
    }
    
    static removeFromEnd(str, endStr){
        if(endStr && str){
            if (str.endsWith(endStr)) {
                str = str.substring(0, str.length - endStr.length);
            }
        }
        return str;
    }
}

class LangPy extends LangHandler{
    generatedFunctionStart = "```python";
    generatedFunctionEnd = "```";

    singleLineComments = ["#"];
    multiLineComments = [
        {start: "'''", end: "'''"},
        {start: '"""', end: '"""'},
    ];

}

class LangCLike extends LangHandler{
    generatedFunctionStart = "```javascript";
    generatedFunctionEnd = "```";

    lineComments = ["//"];
    multiLineComments = [
        {start: "/*", end: "*/"}
    ];
}

class LangJs extends LangCLike{}

class LangJava extends LangCLike{}

class LangC extends LangCLike{}

class LangCpp extends LangCLike{}

class LangCs extends LangCLike{}

//make annonymous function and call it here to add the required things per language we need dictionary or so
class Langs{

    static data = {
        c: new LangC(),
        cpp: new LangCpp(),
        csharp: new LangCs(),
        java: new LangJava(),
        javascript: new LangJs(),
        python: new LangPy()
    }

    static l(langStr){
        try{
            if( Langs.data.hasOwnProperty(langStr) ){
                return Langs.data[langStr];
            }
        }catch(e){
            console.log(e);
        }
        return null;
    }
    
}

module.exports = Langs;
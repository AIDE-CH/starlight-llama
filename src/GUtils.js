
const vscode = require("vscode");
const fs = require('fs').promises;


class CircularBuffer {
    size;
    buffer;
    head;

    constructor(size) {
        this.size = size;
        this.buffer = Array(size);
        this.head = 0;
        this.isFull = false;
    }

    add(item) {
        this.buffer[this.head] = item;
        this.head++;
        if(!this.isFull){
            this.isFull = this.head == this.size;
        }
        this.head %= this.size;
    }

    loop(fun){
        const n = this.isFull? this.size: this.head;
        if(n == 0) return;
        let currIdx = (this.head - 1 + this.size)%this.size;
        for(let i = 0; i < n; i++){
            fun(this.buffer[currIdx], i, currIdx);
            currIdx = (currIdx - 1 + this.size)%this.size; 
        }
    }

    find(fun){
        const n = this.isFull? this.size: this.head;
        if(n == 0) return null;
        let currIdx = (this.head - 1 + this.size)%this.size;
        for(let i = 0; i < n; i++){
            if(fun(this.buffer[currIdx], i, currIdx)) return this.buffer[currIdx];
            currIdx = (currIdx - 1 + this.size)%this.size; 
        }
        return null;
    }
}


class Utils {
    static circularBuffer(size){
        return new CircularBuffer(size);
    }

    static trim(str) {
        if (!str) {
            return null;
        }
        return str.trim();
    }

    static async readHtmlFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return data;
        } catch (err) {
            throw new Error('Error reading the HTML file: ' + err.message);
        }
    }
}

module.exports = Utils;
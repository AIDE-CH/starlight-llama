
const vscode = require("vscode");
const fs = require('fs').promises;


class Utils {
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
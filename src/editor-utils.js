const vscode = require("vscode");

class Utils {
    
    static getLanguage(){
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            return editor.document.languageId;
        } else {
            return null;
        }
    }

    static getCurrentLineText() {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null; // No active text editor
        }

        // Get the current line
        const currentLine = editor.selection.active.line;

        // Get the text of the current line
        return editor.document.lineAt(currentLine).text;
    }


    static getSelectedText() {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null; // No active text editor
        }

        // Get the selected text
        const selection = editor.selection;
        return editor.document.getText(selection);
    }

    static addLineToEditor(lineText) {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No active text editor
        }

        // Get the current cursor position
        const currentPosition = editor.selection.active;

        // Insert the new line at the cursor position
        editor.edit((editBuilder) => {
            editBuilder.insert(currentPosition, lineText + '\n');
        });
    }

    static addLineAfterCurrentLine(lineText) {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No active text editor
        }

        // Get the current line
        const currentLine = editor.selection.active.line;

        // Get the position after the end of the current line
        const lineEndPosition = editor.document.lineAt(currentLine).range.end;

        // Insert the new line after the current line
        editor.edit((editBuilder) => {
            editBuilder.insert(lineEndPosition, '\n' + lineText);
        });
    }

}

module.exports = Utils;
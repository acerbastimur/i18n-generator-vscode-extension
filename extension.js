// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const translate = require("./translate");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "i18ngenerator" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.Translate",
    async function() {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      let filePath = vscode.window.activeTextEditor.document.uri.fsPath;
      let folderPath = vscode.workspace.rootPath;

      console.log("file path = " + filePath);
      console.log("folder path = " + folderPath);
      if (filePath.includes("en.json")) {
        vscode.window.showInformationMessage("Valid json");
        promt(filePath,folderPath);
      } else {
        vscode.window.showInformationMessage("That's not a valid json");
      }
    }
  );

  context.subscriptions.push(disposable);
}

let promt = async (filePath,folderPath) => {
  const result = await vscode.window.showInputBox({
    value: "fr,es",
     placeHolder: "Enter languages with comma. For example: fr,es,tr",
    validateInput: text => {
      return text === "123" ? "Not 123!" : null;
    }
  });
  let langs = result.replace(" ", "").split(",");
  console.log(langs);

  if (langs) {
    vscode.window.showInformationMessage(`Translating: ${langs}`);
    translate.run(folderPath + "\\", "en", langs);
  }
};
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate
};

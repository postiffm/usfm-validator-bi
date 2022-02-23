'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const vscode_1 = require("vscode");

const path = require("path");
const vscode_languageclient_1 = require("vscode-languageclient");


//experimenting with diagnostics here - delete this if breaking


//const vsserver = require("vscode-languageserver")


//// Create a connection for the server, using Node's IPC as a transport.
//// Also include all preview / proposed LSP features.
//let connection = vsserver.createConnection(vsserver.ProposedFeatures.all);

////experimenting with diagnostics here - delete this if breaking

//const { DiagnosticSeverity, Diagnostic } = require("vscode-languageclient");
let client;
const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: '#FFEB3B',
	//fontWeight: "bold",
    border: '1px solid white',
});


function activate(context) {
    let serverModule = context.asAbsolutePath(path.join('out', 'server.js'));
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: vscode_languageclient_1.TransportKind.ipc,
            options: debugOptions
        }
    };
    // Options to control the language client
    let clientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'usfmforbi' }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
    // Create the language client and start the client.
    client = new vscode_languageclient_1.LanguageClient('USFMLanguageServer', 'USFM for BI Language Server', serverOptions, clientOptions);
    // Start the client. This will also launch the server
    client.start();
    context.subscriptions.push(vscode.commands.registerCommand("usfm-validator-for-bi.test", (param) => {
        client.sendRequest("custom/request", "Hello world");
    }));
}
exports.activate = activate;
let editor = vscode.window.activeTextEditor;
if (!editor) {
    return;
}
let doc = vscode_1.window.activeTextEditor.document;
let ed = vscode_1.window.activeTextEditor;

//const openEditor = vscode.window.visibleTextEditors.filter(
//    editor => editor.document.uri === e.document.uri
//)[0];

vscode.workspace.onWillSaveTextDocument(e => {
    let openEditor = vscode.window.visibleTextEditors.filter(
        editor => editor.document.uri === e.document.uri
    )[0]
    decorate(openEditor)
});


//decorate(ed);

//decorator function to highlight things we want highlighted
function decorate() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    let doc = editor.document;
    let sourceCode = doc.getText();
    //    let regexbegin = /\\xt\s/;
    //  let regexend = /\\xt\*/;
    let decorationsArray = [];

    let sourceCodeArr = sourceCode.split("\n");

    //codes to check: \xt*, \tl*, \nd*, \x*, \k*, \rq*, \f*, \w*
    let regxtb = /\\xt\s/;
    let regtlb = /\\tl/;
    let regndb = /\\nd/;
    let regxb = /\\x\s/;
    let regkb = /\\k\s/;
    let regrqb = /\\rq\s/;
    let regfb = /\\f\s/;
    let regwb = /\\w\s/;
    let tagblist = [];
    tagblist.push(regxtb);
    tagblist.push(regtlb);
    tagblist.push(regndb);
    tagblist.push(regxb);
    tagblist.push(regkb);
    tagblist.push(regrqb);
    tagblist.push(regfb);
    tagblist.push(regwb);

    let regxte = /\\xt\*|\\x\*/;
    let regtle = /\\tl\*/;
    let regnde = /\\nd\*/;
    let regxe = /\\x\*/;
    let regke = /\\k\*:/;
    let regrqe = /\\rq\*/;
    let regfe = /\\f\*/;
    let regwe = /\\w\*/;
    let tagelist = [];
    tagelist.push(regxte);
    tagelist.push(regtle);
    tagelist.push(regnde);
    tagelist.push(regxe);
    tagelist.push(regke);
    tagelist.push(regrqe);
    tagelist.push(regfe);
    tagelist.push(regwe);
    for (let tagcount = 0; tagcount < tagblist.length; tagcount++) {
        for (let line = 0; line < sourceCodeArr.length; line++) {
            let regexbegin = tagblist[tagcount];
            let regexend = tagelist[tagcount];
            let match = sourceCodeArr[line].match(regexbegin);
            let endmatch = sourceCodeArr[line].match(regexend);
            if (match !== null && match.index !== undefined && endmatch === null) {
                let temptagend = String(regexend);
				temptagend = temptagend.replace("/g", "");
                temptagend = temptagend.replace("/", "");
                temptagend = temptagend.replace("\\", "");
                temptagend = temptagend.replace("\\\*", "\*");
                temptagend = temptagend.replace("/", "");
                console.log("Found a missing closing tag at " + match.index + " on line " + line + 1);
                vscode.window.showInformationMessage('location (' + (line + 1) + ',' + match.index + ')' + 'Missing closing tag: ' + temptagend);
                //vscode.window.activeTerminal.sendText("Found missing tag")
                let range = new vscode.Range(
                    new vscode.Position(line, match.index),
                    new vscode.Position(line, sourceCodeArr[line].length - 1)
                );
                let decoration = { range };
                decorationsArray.push(decoration);
            }
			// checking for multiple tags and brokens - must have exception for \x \xt \x*
			let strLine = String(sourceCodeArr[line]);
			let strTemp = String(regexbegin);
			strTemp = strTemp.replaceAll("/", "");
			let gBegin = new RegExp(strTemp,'g');
			strTemp = String(regexend);
			strTemp = strTemp.replaceAll("/", "");
			let gEnd = new RegExp(strTemp,'g');
			let arrFinds = [...strLine.matchAll(gBegin)];
			let arrEnds = [...strLine.matchAll(gEnd)];
			if (arrFinds !== null && arrFinds !== undefined && arrFinds.length !== 0 && arrFinds.length !== arrEnds.length) {
				let temptagend = String(regexend);
                temptagend = temptagend.replaceAll("/g", "");
                temptagend = temptagend.replace("\\", "");
                temptagend = temptagend.replace("\\\*", "\*");
                temptagend = temptagend.replaceAll("/", "");
				let errorline = line + 1;
				console.log("Line " + errorline + " is missing a tag - " + temptagend);
                vscode.window.showInformationMessage('Missing tag on line (' + errorline + ',' + arrFinds[0].index + ')' + 'for tag: ' + temptagend);
				let lineend = strLine.length - 1;
				//let linelength = lineend - arrFinds[0].index;
				//if (arrEnds !== null && arrEnds !== undefined && arrEnds.length !== 0) {
				//	lineend = arrEnds[arrEnds.length -1].index;
				//}
				let range = new vscode.Range(
                    new vscode.Position(line, arrFinds[0].index),
                    new vscode.Position(line, lineend)
                );
                let decoration = { range };
                decorationsArray.push(decoration);
			}
        }
    }

    /*     for (let line = 0; line < sourceCodeArr.length; line++) {
            let match = sourceCodeArr[line].match(regexbegin);
            let endmatch = sourceCodeArr[line].match(regexend);
            if (match !== null && match.index !== undefined && endmatch === null) {
                console.log("Found a broken reference at " + match.index + " on line " + line);
                vscode.window.showInformationMessage('location (' + line + ',' + match.index + ')' + 'Broken verse reference - missing closing tag!');
                //vscode.window.activeTerminal.sendText("Found missing tag")
                let range = new vscode.Range(
                    new vscode.Position(line, match.index),
                    new vscode.Position(line, match.index + match[0].length)
                );
                let decoration = { range };
                decorationsArray.push(decoration);
            }
        } */
    editor.setDecorations(decorationType, decorationsArray);
    //  connection.sendDiagnostics({ uri: TextDocument.uri, diagnostics });
}



// this method is called when your extension is deactivated
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map

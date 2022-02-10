"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });


const vscode_languageserver_1 = require("vscode-languageserver");
const BI_markers = require("./markers");
const OtherUSFMmarkers = require("./othermarkers");
let connection = vscode_languageserver_1.createConnection(vscode_languageserver_1.ProposedFeatures.all);
let documents = new vscode_languageserver_1.TextDocuments();
connection.console.log("hit");
let hasConfigurationCapability = false;
connection.onInitialize((params) => {
    connection.console.log("Starting initialization");
    let capabilities = params.capabilities;
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
        }
    };
});
connection.onInitialized(() => {
    connection.console.log("Langauge server initialized");
    if (hasConfigurationCapability) {
        connection.client.register(vscode_languageserver_1.DidChangeConfigurationNotification.type, undefined);
    }
});

// Function to clear diagnostics info in the Problems console when closing the document
documents.onDidClose(close => { clearDiags(close.document); });
function clearDiags(textDocument) {
    let diagnostics = []; //pushing an empty array so that the effect is clearing out the diag info on close
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

documents.onDidChangeContent(change => { validateUSFM(change.document); });

function validateUSFM(textDocument) {
    return __awaiter(this, void 0, void 0, function* () {
        let text = textDocument.getText();
        let pattern = /\\[a-z0-9\-]*\**/g;
        let regexbegin = /\\xt\s/;
        let regexend = /\\xt\*/;
        let endtag = "\\xt\*";
        let kbegin = "\\k";
        let kend = "\\k*";
        let diagnostics = [];
        let m;
        while ((m = pattern.exec(text))) {
            if (BI_markers.default.indexOf(m[0]) === -1) {
                if (OtherUSFMmarkers.default.indexOf(m[0]) === -1) {
                    diagnostics.push({
                        severity: vscode_languageserver_1.DiagnosticSeverity.Error,
                        range: {
                            start: textDocument.positionAt(m.index),
                            end: textDocument.positionAt(m.index + m[0].length),
                        },
                        message: `${m[0]} is not a valid USFM marker`,
                        source: "ex"
                    });
                } else {
                    diagnostics.push({
                        severity: vscode_languageserver_1.DiagnosticSeverity.Error,
                        range: {
                            start: textDocument.positionAt(m.index),
                            end: textDocument.positionAt(m.index + m[0].length),
                        },
                        message: `${m[0]} is a valid USFM marker but not used by Bibles International`,
                        source: "ex"
                    });
                }
            }
        }
        connection.console.log("Processing text lines for missing tags");
        let sourceCodeArr = text.split("\n");

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

        let regxte = /\\xt\*/;
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
                regexbegin = tagblist[tagcount];
                regexend = tagelist[tagcount];
                let match = sourceCodeArr[line].match(regexbegin);
                let endmatch = sourceCodeArr[line].match(regexend);
                if (match !== null && match.index !== undefined && endmatch === null) {
                    let temptagend = String(regexend);
                    temptagend = temptagend.replace("/", "");
                    temptagend = temptagend.replace("\\", "");
                    temptagend = temptagend.replace("\\\*", "\*");
                    temptagend = temptagend.replace("/", "");
                    diagnostics.push({
                        severity: vscode_languageserver_1.DiagnosticSeverity.Error,
                        range: {
                            start: { line: line, character: match.index },
                            end: { line: line, character: match.index + match.length },
                        },
                        message: "Missing closing " + temptagend + " tag",
                        source: "ex"
                    });
                    //  diagnostics.push({
                    //      severity: 1,
                    //      range: {
                    //          start: match.index,
                    //          end: match.index + match.length,
                    //      },
                    //      message: `missing a closing tag`,
                    //      source: "ex"
                    //  });
                    //  //Diagnostic({ severity: DiagnosticSeverity.Error, message: "line " + line + " is missing a closing tag" });
                    //  //sendDiagnostics({ uri: textDocument.uri, diagnostics });
                    connection.console.log("Found a broken reference at " + match.index + " on line " + line);
                    //vscode.window.showInformationMessage('location (' + line + ',' + match.index + ')' + 'Broken verse reference - missing closing tag!');
                    //vscode.window.activeTerminal.sendText("Found missing tag")
                    //let range = new vscode.Range(
                    //    new vscode.Position(line, match.index),
                    //    new vscode.Position(line, match.index + match[0].length)
                    //);

                    //let decoration = { range };

                    //decorationsArray.push(decoration);

                }
            }
        }

        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    });
}

documents.listen(connection);
connection.listen();
//# sourceMappingURL=server.js.map

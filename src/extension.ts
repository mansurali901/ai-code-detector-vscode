// /* eslint-disable no-console */
// import * as vscode from "vscode";

// // -------------- Counters --------------
// let humanLines = 0;
// let aiLines = 0;
// let copilotLines = 0;
// let chatgptLines = 0;
// let claudeLines = 0;
// let geminiLines = 0;
// let codeiumLines = 0;
// let qodogenLines = 0;
// let windsurfLines = 0;

// let currentPanel: vscode.WebviewPanel | null = null;
// let debounceTimer: NodeJS.Timeout | null = null;
// let pendingChange: vscode.TextDocumentChangeEvent | null = null;
// let statusBar: vscode.StatusBarItem;
// let lastAIProvider: string | null = null;

// // Output channel
// const outputChannel = vscode.window.createOutputChannel("AI Tracker Logs");

// // Decorations
// const humanDecoration = vscode.window.createTextEditorDecorationType({
//   backgroundColor: "rgba(76,175,80,0.15)",
// });
// const aiDecoration = vscode.window.createTextEditorDecorationType({
//   backgroundColor: "rgba(244,67,54,0.15)",
// });

// // -------------- Helpers --------------
// function log(message: string, data?: any) {
//   const msg = data ? `${message} ${JSON.stringify(data)}` : message;
//   console.log(msg);
//   outputChannel.appendLine(msg);
// }

// function updateStatusBar() {
//   statusBar.text = `👨‍💻 ${humanLines} | 🤖 ${aiLines}`;
//   statusBar.show();
// }

// function sendUpdateToDashboard() {
//   if (!currentPanel?.webview) return;
//   currentPanel.webview.postMessage({
//     human: humanLines,
//     ai: aiLines,
//     copilot: copilotLines,
//     chatgpt: chatgptLines,
//     claude: claudeLines,
//     gemini: geminiLines,
//     codeium: codeiumLines,
//     qodogen: qodogenLines,
//     windsurf: windsurfLines,
//   });
//   log("📤 Dashboard updated", {
//     humanLines,
//     aiLines,
//     copilotLines,
//     chatgptLines,
//     claudeLines,
//     geminiLines,
//     codeiumLines,
//     qodogenLines,
//     windsurfLines,
//   });
// }

// // -------------- AI Provider Detection --------------
// function detectAIProvider(text: string): string | null {
//   const lower = text.toLowerCase();
//   if (lower.includes("copilot") || lower.includes("githubcopilot")) return "copilot";
//   if (lower.includes("chatgpt") || lower.includes("openai") || lower.includes("gpt")) return "chatgpt";
//   if (lower.includes("claude") || lower.includes("anthropic")) return "claude";
//   if (lower.includes("gemini") || lower.includes("bard") || lower.includes("google-ai")) return "gemini";
//   if (lower.includes("codeium")) return "codeium";
//   if (lower.includes("qodogen") || lower.includes("qodo gen")) return "qodogen";
//   if (lower.includes("windsurf")) return "windsurf";
//   return null;
// }

// // -------------- Inline AI command hook --------------
// // function registerAIDetectors(context: vscode.ExtensionContext) {
// //   const aiCommands = [
// //     "github.copilot.acceptSuggestion",
// //     "github.copilot.generate",
// //     "codeium.acceptCompletion",
// //     "windsurf.acceptInlineCompletion",
// //     "qodogen.acceptCompletion",
// //     "chatgpt.insertCode",
// //     "claude.insertCompletion",
// //   ];

// //   context.subscriptions.push(
// //     vscode.commands.onDidExecuteCommand((event) => {
// //       if (aiCommands.includes(event.command)) {
// //         lastAIProvider = event.command;
// //         log(`⚡ Inline AI provider triggered: ${event.command}`);
// //       }
// //     })
// //   );
// // }

// function registerAIDetectors(context: vscode.ExtensionContext) {
//     const aiCommands = [
//       "github.copilot.acceptSuggestion",
//       "github.copilot.generate",
//       "codeium.acceptCompletion",
//       "windsurf.acceptInlineCompletion",
//       "qodogen.acceptCompletion",
//       "chatgpt.insertCode",
//       "claude.insertCompletion",
//     ];
  
//     // Bypass type limitation using dynamic access
//     const commandsAny = vscode.commands as any;
//     if (typeof commandsAny.onDidExecuteCommand === "function") {
//       context.subscriptions.push(
//         commandsAny.onDidExecuteCommand((event: any) => {
//           if (aiCommands.includes(event.command)) {
//             lastAIProvider = event.command;
//             log(`⚡ Inline AI provider triggered: ${event.command}`);
//           }
//         })
//       );
//     } else {
//       log("⚠️ onDidExecuteCommand not available — inline AI tracking limited");
//     }
//   }
  
// // -------------- Change Processing --------------
// function scheduleProcess(change: vscode.TextDocumentChangeEvent) {
//   pendingChange = change;
//   if (debounceTimer) clearTimeout(debounceTimer);
//   debounceTimer = setTimeout(() => {
//     if (pendingChange) processChange(pendingChange);
//     pendingChange = null;
//   }, 250);
// }

// function processChange(event: vscode.TextDocumentChangeEvent) {
//   if (!event.contentChanges.length) return;

//   let insertedLines = 0;
//   for (const c of event.contentChanges) {
//     const added = c.text.split("\n").length - 1;
//     if (added > 0) insertedLines += added;
//   }
//   if (insertedLines === 0) return;

//   const insertedText = event.contentChanges.map((c) => c.text).join("");
//   const detectedProvider = detectAIProvider(insertedText) || lastAIProvider;
//   const looksLikeAI =
//     insertedLines > 3 ||
//     insertedText.length > 200 ||
//     detectedProvider !== null;

//   if (looksLikeAI) {
//     aiLines += insertedLines;
//     switch (true) {
//       case detectedProvider?.includes("copilot"):
//         copilotLines += insertedLines;
//         break;
//       case detectedProvider?.includes("chatgpt"):
//       case detectedProvider?.includes("openai"):
//       case detectedProvider?.includes("gpt"):
//         chatgptLines += insertedLines;
//         break;
//       case detectedProvider?.includes("claude"):
//         claudeLines += insertedLines;
//         break;
//       case detectedProvider?.includes("gemini"):
//         geminiLines += insertedLines;
//         break;
//       case detectedProvider?.includes("codeium"):
//         codeiumLines += insertedLines;
//         break;
//       case detectedProvider?.includes("qodo"):
//       case detectedProvider?.includes("qodogen"):
//         qodogenLines += insertedLines;
//         break;
//       case detectedProvider?.includes("windsurf"):
//         windsurfLines += insertedLines;
//         break;
//       default:
//         break;
//     }
//   } else {
//     humanLines += insertedLines;
//   }

//   const editor = vscode.window.activeTextEditor;
//   if (editor) {
//     const aiRanges: vscode.DecorationOptions[] = [];
//     const humanRanges: vscode.DecorationOptions[] = [];

//     for (const change of event.contentChanges) {
//       if (!change.text.includes("\n")) continue;
//       const start = change.range.start;
//       const end = editor.document.positionAt(
//         editor.document.offsetAt(start) + change.text.length
//       );
//       const range = new vscode.Range(start, end);

//       if (looksLikeAI)
//         aiRanges.push({
//           range,
//           hoverMessage: `🤖 ${detectedProvider || "AI"} generated code`,
//         });
//       else
//         humanRanges.push({
//           range,
//           hoverMessage: "👨‍💻 Human-written code",
//         });
//     }

//     editor.setDecorations(aiDecoration, aiRanges);
//     editor.setDecorations(humanDecoration, humanRanges);
//   }

//   log("🧮 Updated (multi-provider)", {
//     humanLines,
//     aiLines,
//     detectedProvider,
//   });

//   updateStatusBar();
//   sendUpdateToDashboard();
//   lastAIProvider = null;
// }

// // -------------- Activate --------------
// export function activate(context: vscode.ExtensionContext) {
//   outputChannel.show(true);
//   log("🚀 AI Tracker (multi-provider) activated");

//   statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
//   updateStatusBar();
//   context.subscriptions.push(statusBar);

//   registerAIDetectors(context);

//   vscode.workspace.onDidChangeTextDocument((event) => {
//     if (event.document.uri.scheme !== "file") return;
//     if (!event.contentChanges.some((c) => c.text.length > 0)) return;
//     scheduleProcess(event);
//   });

//   const showDashboard = vscode.commands.registerCommand("aianalytics.showStats", () => {
//     if (currentPanel) {
//       currentPanel.reveal(vscode.ViewColumn.One);
//       return;
//     }

//     currentPanel = vscode.window.createWebviewPanel(
//       "aiStats",
//       "AI vs Human Live Stats",
//       vscode.ViewColumn.One,
//       { enableScripts: true }
//     );
//     context.subscriptions.push(currentPanel);

//     const htmlPath = vscode.Uri.joinPath(context.extensionUri, "src", "dashboard.html");
//     vscode.workspace.fs.readFile(htmlPath).then((data) => {
//       let html = data.toString();
//       html = html.replace(
//         "</body>",
//         `
//         <script>
//           const HUMAN_VALUE = ${humanLines};
//           const AI_VALUE = ${aiLines};
//           const COPILOT_VALUE = ${copilotLines};
//           const CHATGPT_VALUE = ${chatgptLines};
//           const CLAUDE_VALUE = ${claudeLines};
//           const GEMINI_VALUE = ${geminiLines};
//           const CODEIUM_VALUE = ${codeiumLines};
//           const QODOGEN_VALUE = ${qodogenLines};
//           const WINDSURF_VALUE = ${windsurfLines};
//         </script>
//       </body>`
//       );
//       currentPanel!.webview.html = html;
//       log("📊 Dashboard opened");

//       currentPanel!.webview.onDidReceiveMessage((msg) => {
//         if (msg === "ready") sendUpdateToDashboard();
//         if (msg.command === "reset") {
//           humanLines =
//             aiLines =
//             copilotLines =
//             chatgptLines =
//             claudeLines =
//             geminiLines =
//             codeiumLines =
//             qodogenLines =
//             windsurfLines =
//               0;
//           vscode.window.showInformationMessage("AI Tracker stats reset.");
//           updateStatusBar();
//           sendUpdateToDashboard();
//         }
//       });
//     });

//     currentPanel.onDidDispose(() => {
//       log("🪣 Dashboard closed");
//       currentPanel = null;
//     });
//   });

//   context.subscriptions.push(showDashboard);
// }

// // -------------- Deactivate --------------
// export function deactivate() {
//   humanDecoration.dispose();
//   aiDecoration.dispose();
//   log("🧹 Extension deactivated");
// }



/* eslint-disable no-console */
import * as vscode from "vscode";

// -------------- Counters --------------
let humanLines = 0;
let aiLines = 0;
let copilotLines = 0;
let chatgptLines = 0;
let claudeLines = 0;
let geminiLines = 0;
let codeiumLines = 0;
let qodogenLines = 0;
let windsurfLines = 0;

let currentPanel: vscode.WebviewPanel | null = null;
let debounceTimer: NodeJS.Timeout | null = null;
let pendingChange: vscode.TextDocumentChangeEvent | null = null;
let statusBar: vscode.StatusBarItem;
let lastAIProvider: string | null = null;

// Output channel
const outputChannel = vscode.window.createOutputChannel("AI Tracker Logs");

// Decorations
const humanDecoration = vscode.window.createTextEditorDecorationType({
  backgroundColor: "rgba(76,175,80,0.15)",
});
const aiDecoration = vscode.window.createTextEditorDecorationType({
  backgroundColor: "rgba(244,67,54,0.15)",
});

// -------------- Helpers --------------
function log(message: string, data?: any) {
  const msg = data ? `${message} ${JSON.stringify(data)}` : message;
  console.log(msg);
  outputChannel.appendLine(msg);
}

function updateStatusBar() {
  statusBar.text = `👨‍💻 ${humanLines} | 🤖 ${aiLines}`;
  statusBar.show();
}

function sendUpdateToDashboard() {
  if (!currentPanel?.webview) return;
  currentPanel.webview.postMessage({
    human: humanLines,
    ai: aiLines,
    copilot: copilotLines,
    chatgpt: chatgptLines,
    claude: claudeLines,
    gemini: geminiLines,
    codeium: codeiumLines,
    qodogen: qodogenLines,
    windsurf: windsurfLines,
  });
  log("📤 Dashboard updated", {
    humanLines,
    aiLines,
    copilotLines,
    chatgptLines,
    claudeLines,
    geminiLines,
    codeiumLines,
    qodogenLines,
    windsurfLines,
  });
}

// -------------- AI Provider Detection --------------
function detectAIProvider(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("copilot") || lower.includes("githubcopilot")) return "copilot";
  if (lower.includes("chatgpt") || lower.includes("openai") || lower.includes("gpt")) return "chatgpt";
  if (lower.includes("claude") || lower.includes("anthropic")) return "claude";
  if (lower.includes("gemini") || lower.includes("bard") || lower.includes("google-ai")) return "gemini";
  if (lower.includes("codeium")) return "codeium";
  if (lower.includes("qodogen") || lower.includes("qodo gen")) return "qodogen";
  if (lower.includes("windsurf")) return "windsurf";
  return null;
}

// -------------- Command Listener Binding (Resilient) --------------
function registerAIDetectors(context: vscode.ExtensionContext) {
  try {
    const aiCommands = [
      "github.copilot.acceptSuggestion",
      "github.copilot.generate",
      "codeium.acceptCompletion",
      "windsurf.acceptInlineCompletion",
      "qodogen.acceptCompletion",
      "chatgpt.insertCode",
      "claude.insertCompletion",
      "gemini.provideCompletion"
    ];

    const commandsAny = vscode.commands as any;

    if (typeof commandsAny.onDidExecuteCommand === "function") {
      const disposable = commandsAny.onDidExecuteCommand((event: any) => {
        if (!event) return;
        const cmd = event.command?.toLowerCase() || "";

        // Inline AI-related triggers
        if (
          aiCommands.includes(event.command) ||
          cmd.includes("copilot") ||
          cmd.includes("inlinecompletion") ||
          cmd.includes("suggest") ||
          cmd.includes("chatgpt") ||
          cmd.includes("claude") ||
          cmd.includes("gemini") ||
          cmd.includes("codeium") ||
          cmd.includes("windsurf") ||
          cmd.includes("qodo")
        ) {
          log(`⚡ Inline AI provider triggered via command: ${cmd}`);
          aiLines++;
          lastAIProvider = cmd;
          sendUpdateToDashboard();
        }
      });

      context.subscriptions.push(disposable);
      log("✅ onDidExecuteCommand listener attached successfully");
    } else {
      log("⚠️ onDidExecuteCommand not available — inline AI tracking limited");
    }
  } catch (err) {
    log("❌ Failed to attach onDidExecuteCommand", err);
  }
}

// -------------- Change Processing --------------
function scheduleProcess(change: vscode.TextDocumentChangeEvent) {
  pendingChange = change;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (pendingChange) processChange(pendingChange);
    pendingChange = null;
  }, 250);
}

function processChange(event: vscode.TextDocumentChangeEvent) {
  if (!event.contentChanges.length) return;

  let insertedLines = 0;
  for (const c of event.contentChanges) {
    const added = c.text.split("\n").length - 1;
    if (added > 0) insertedLines += added;
  }
  if (insertedLines === 0) return;

  const insertedText = event.contentChanges.map((c) => c.text).join("");
  const detectedProvider = detectAIProvider(insertedText) || lastAIProvider;
  const looksLikeAI =
    insertedLines > 3 ||
    insertedText.length > 200 ||
    detectedProvider !== null;

  if (looksLikeAI) {
    aiLines += insertedLines;
    switch (true) {
      case detectedProvider?.includes("copilot"):
        copilotLines += insertedLines;
        break;
      case detectedProvider?.includes("chatgpt"):
      case detectedProvider?.includes("openai"):
      case detectedProvider?.includes("gpt"):
        chatgptLines += insertedLines;
        break;
      case detectedProvider?.includes("claude"):
        claudeLines += insertedLines;
        break;
      case detectedProvider?.includes("gemini"):
        geminiLines += insertedLines;
        break;
      case detectedProvider?.includes("codeium"):
        codeiumLines += insertedLines;
        break;
      case detectedProvider?.includes("qodo"):
      case detectedProvider?.includes("qodogen"):
        qodogenLines += insertedLines;
        break;
      case detectedProvider?.includes("windsurf"):
        windsurfLines += insertedLines;
        break;
      default:
        break;
    }
  } else {
    humanLines += insertedLines;
  }

  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const aiRanges: vscode.DecorationOptions[] = [];
    const humanRanges: vscode.DecorationOptions[] = [];

    for (const change of event.contentChanges) {
      if (!change.text.includes("\n")) continue;
      const start = change.range.start;
      const end = editor.document.positionAt(
        editor.document.offsetAt(start) + change.text.length
      );
      const range = new vscode.Range(start, end);

      if (looksLikeAI)
        aiRanges.push({
          range,
          hoverMessage: `🤖 ${detectedProvider || "AI"} generated code`,
        });
      else
        humanRanges.push({
          range,
          hoverMessage: "👨‍💻 Human-written code",
        });
    }

    editor.setDecorations(aiDecoration, aiRanges);
    editor.setDecorations(humanDecoration, humanRanges);
  }

  log("🧮 Updated (multi-provider)", {
    humanLines,
    aiLines,
    detectedProvider,
  });

  updateStatusBar();
  sendUpdateToDashboard();
  lastAIProvider = null;
}

// -------------- Activate --------------
export function activate(context: vscode.ExtensionContext) {
  outputChannel.show(true);
  log("🚀 AI Tracker (multi-provider) activated");

  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  updateStatusBar();
  context.subscriptions.push(statusBar);

  registerAIDetectors(context);

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.uri.scheme !== "file") return;
    if (!event.contentChanges.some((c) => c.text.length > 0)) return;
    scheduleProcess(event);
  });

  const showDashboard = vscode.commands.registerCommand("aianalytics.showStats", () => {
    if (currentPanel) {
      currentPanel.reveal(vscode.ViewColumn.One);
      return;
    }

    currentPanel = vscode.window.createWebviewPanel(
      "aiStats",
      "AI vs Human Live Stats",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
    context.subscriptions.push(currentPanel);

    const htmlPath = vscode.Uri.joinPath(context.extensionUri, "src", "dashboard.html");
    vscode.workspace.fs.readFile(htmlPath).then((data) => {
      let html = data.toString();
      html = html.replace(
        "</body>",
        `
        <script>
          const HUMAN_VALUE = ${humanLines};
          const AI_VALUE = ${aiLines};
          const COPILOT_VALUE = ${copilotLines};
          const CHATGPT_VALUE = ${chatgptLines};
          const CLAUDE_VALUE = ${claudeLines};
          const GEMINI_VALUE = ${geminiLines};
          const CODEIUM_VALUE = ${codeiumLines};
          const QODOGEN_VALUE = ${qodogenLines};
          const WINDSURF_VALUE = ${windsurfLines};
        </script>
      </body>`
      );
      currentPanel!.webview.html = html;
      log("📊 Dashboard opened");

      currentPanel!.webview.onDidReceiveMessage((msg) => {
        if (msg === "ready") sendUpdateToDashboard();
        if (msg.command === "reset") {
          humanLines =
            aiLines =
            copilotLines =
            chatgptLines =
            claudeLines =
            geminiLines =
            codeiumLines =
            qodogenLines =
            windsurfLines =
              0;
          vscode.window.showInformationMessage("AI Tracker stats reset.");
          updateStatusBar();
          sendUpdateToDashboard();
        }
      });
    });

    currentPanel.onDidDispose(() => {
      log("🪣 Dashboard closed");
      currentPanel = null;
    });
  });

  context.subscriptions.push(showDashboard);
}

// -------------- Deactivate --------------
export function deactivate() {
  humanDecoration.dispose();
  aiDecoration.dispose();
  log("🧹 Extension deactivated");
}

/* eslint-disable no-console */
import * as vscode from 'vscode';



// -------------- Counters & Time Tracking --------------
let humanLines = 0;
let aiLines = 0;
let inlineLines = 0;
let copilotLines = 0;
let chatgptLines = 0;
let claudeLines = 0;
let geminiLines = 0;
let codeiumLines = 0;
let qodogenLines = 0;
let windsurfLines = 0;

interface AISession {
  startTime: number;
  provider: string;
  type: 'inline' | 'chat';
  duration?: number;
  date: string;
  hour: number;
}

let aiSessions: AISession[] = [];
let currentSession: AISession | null = null;

let currentPanel: vscode.WebviewPanel | null = null;
let debounceTimer: NodeJS.Timeout | null = null;
let pendingChange: vscode.TextDocumentChangeEvent | null = null;
let statusBar: vscode.StatusBarItem;
let lastAIProvider: string | null = null;
let lastCompletionRequest: number = 0;
let lastChangeTime: number = 0;

// Output channel
const outputChannel = vscode.window.createOutputChannel("AI Tracker Logs");

// Decorations
const humanDecoration = vscode.window.createTextEditorDecorationType({
  backgroundColor: "rgba(76,175,80,0.15)",
});
const aiDecoration = vscode.window.createTextEditorDecorationType({
  backgroundColor: "rgba(244,67,54,0.15)",
});

// -------------- State Interface --------------
interface SavedLines {
  humanLines?: number;
  aiLines?: number;
  inlineLines?: number;
  copilotLines?: number;
  chatgptLines?: number;
  claudeLines?: number;
  geminiLines?: number;
  codeiumLines?: number;
  qodogenLines?: number;
  windsurfLines?: number;
}

// -------------- Helpers --------------
function log(message: string, data?: any) {
  const msg = data ? `${message} ${JSON.stringify(data)}` : message;
  console.log(msg);
  outputChannel.appendLine(`${new Date().toISOString()}: ${msg}`);
}

function updateStatusBar() {
  const totalTime = aiSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  statusBar.text = `Human: ${humanLines} | AI: ${aiLines} | Time: ${Math.round(totalTime / 1000)}s`;
  statusBar.show();
}

function saveState(context: vscode.ExtensionContext) {
  context.globalState.update('aiTracker.sessions', aiSessions);
  context.globalState.update('aiTracker.lines', {
    humanLines,
    aiLines,
    inlineLines,
    copilotLines,
    chatgptLines,
    claudeLines,
    geminiLines,
    codeiumLines,
    qodogenLines,
    windsurfLines,
  });
}

function loadState(context: vscode.ExtensionContext) {
  aiSessions = context.globalState.get<AISession[]>('aiTracker.sessions', []);
  const savedLines = context.globalState.get<SavedLines>('aiTracker.lines', {});
  humanLines = savedLines.humanLines || 0;
  aiLines = savedLines.aiLines || 0;
  inlineLines = savedLines.inlineLines || 0;
  copilotLines = savedLines.copilotLines || 0;
  chatgptLines = savedLines.chatgptLines || 0;
  claudeLines = savedLines.claudeLines || 0;
  geminiLines = savedLines.geminiLines || 0;
  codeiumLines = savedLines.codeiumLines || 0;
  qodogenLines = savedLines.qodogenLines || 0;
  windsurfLines = savedLines.windsurfLines || 0;
}

function sendUpdateToDashboard() {
  if (!currentPanel?.webview) return;
  currentPanel.webview.postMessage({
    human: humanLines,
    ai: aiLines,
    inline: inlineLines,
    copilot: copilotLines,
    chatgpt: chatgptLines,
    claude: claudeLines,
    gemini: geminiLines,
    codeium: codeiumLines,
    qodogen: qodogenLines,
    windsurf: windsurfLines,
    sessions: aiSessions,
  });
  log("Dashboard updated");
}

function getTimePatterns(): { daily: Record<string, number>, hourly: Record<string, { total: number, providers: Record<string, number> }> } {
  const daily: Record<string, number> = {};
  const hourly: Record<string, { total: number, providers: Record<string, number> }> = {};
  aiSessions.forEach(s => {
    if (s.duration) {
      daily[s.date] = (daily[s.date] || 0) + s.duration;
      const hourKey = `${s.date}_H${s.hour}`;
      if (!hourly[hourKey]) {
        hourly[hourKey] = { total: 0, providers: {} };
      }
      hourly[hourKey].total += s.duration;
      hourly[hourKey].providers[s.provider] = (hourly[hourKey].providers[s.provider] || 0) + s.duration;
    }
  });
  return { daily, hourly };
}

// -------------- AI Provider Detection --------------
function detectAIProvider(text: string): string | null {
  const lower = text.toLowerCase();
  const patterns = [
    { regex: /copilot|githubcopilot/i, provider: "copilot" },
    { regex: /chatgpt|openai|gpt-\d+/i, provider: "chatgpt" },
    { regex: /claude|anthropic/i, provider: "claude" },
    { regex: /gemini|bard|google-ai/i, provider: "gemini" },
    { regex: /codeium/i, provider: "codeium" },
    { regex: /qodogen|qodo gen|qodium/i, provider: "qodogen" },
    { regex: /windsurf/i, provider: "windsurf" },
  ];
  for (const { regex, provider } of patterns) {
    if (regex.test(lower)) return provider;
  }
  return null;
}

// -------------- Command Listener (Enhanced for Copilot & QodoGen) --------------
function registerAIDetectors(context: vscode.ExtensionContext) {
  try {
    const aiCommands = [
      "editor.action.inlineSuggest.commit", // Copilot Tab accept
      "github.copilot.acceptSuggestion",
      "github.copilot.generate",
      "github.copilot.interactiveSession.generate",
      "codeium.acceptCompletion",
      "windsurf.acceptInlineCompletion",
      "qodogen.acceptCompletion",
      "qodogen.generate",
      "chatgpt.insertCode",
      "claude.insertCompletion",
      "gemini.provideCompletion",
    ];

    const commandsAny = vscode.commands as any;
    if (typeof commandsAny.onDidExecuteCommand === "function") {
      const disposable = commandsAny.onDidExecuteCommand((event: any) => {
        if (!event || !event.command) return;
        const cmd = event.command.toLowerCase();
        if (
          aiCommands.some((c: string) => cmd.includes(c.toLowerCase())) ||
          cmd.includes("copilot") ||
          cmd.includes("inlinesuggest") ||
          cmd.includes("inlinecompletion") ||
          cmd.includes("suggest") ||
          cmd.includes("chatgpt") ||
          cmd.includes("claude") ||
          cmd.includes("gemini") ||
          cmd.includes("codeium") ||
          cmd.includes("windsurf") ||
          cmd.includes("qodo") ||
          cmd.includes("qodogen")
        ) {
          const provider = detectProviderFromCmd(cmd) || "unknown";
          const type: 'inline' | 'chat' = cmd.includes("inline") || cmd.includes("suggest") || cmd.includes("accept") ? 'inline' : 'chat';
          startSession(provider, type);
          log(`AI command triggered: ${cmd} (${type})`, { provider });
        }
      });
      context.subscriptions.push(disposable);
    }
    log("AI command detectors attached");
  } catch (err) {
    log("Failed to attach command detectors", err);
  }
}

function detectProviderFromCmd(cmd: string): string | null {
  if (cmd.includes("copilot")) return "copilot";
  if (cmd.includes("qodo") || cmd.includes("qodogen")) return "qodogen";
  if (cmd.includes("windsurf")) return "windsurf";
  if (cmd.includes("codeium")) return "codeium";
  if (cmd.includes("chatgpt")) return "chatgpt";
  if (cmd.includes("claude")) return "claude";
  if (cmd.includes("gemini")) return "gemini";
  return null;
}

function startSession(provider: string, type: 'inline' | 'chat') {
  currentSession = {
    startTime: Date.now(),
    provider,
    type,
    date: new Date().toISOString().split('T')[0],
    hour: new Date().getHours(),
  };
  lastAIProvider = provider;
  lastCompletionRequest = Date.now();
}

// -------------- Completion Observer --------------
function registerCompletionObserver(context: vscode.ExtensionContext) {
  const aiExtensionIds = [
    "github.copilot",
    "github.copilot-chat",
    "codeium.codeium",
  ];

  const hasAIExtension = aiExtensionIds.some((id) => !!vscode.extensions.getExtension(id));

  if (hasAIExtension) {
    const disposable = vscode.languages.registerInlineCompletionItemProvider(
      { scheme: "file" },
      {
        provideInlineCompletionItems: () => {
          log("Inline completion requested");
          lastCompletionRequest = Date.now();
          return { items: [] };
        },
      }
    );
    context.subscriptions.push(disposable);
    log("Dummy inline provider registered");
  }
}

// -------------- Change Processing --------------
async function processChange(event: vscode.TextDocumentChangeEvent, extContext: vscode.ExtensionContext) {
  if (!event.contentChanges.length) return;

  let insertedLines = 0;
  for (const c of event.contentChanges) {
    const added = c.text.split("\n").length - 1;
    if (added > 0) insertedLines += added;
  }
  if (insertedLines === 0) return;

  const insertedText = event.contentChanges.map((c) => c.text).join("");
  const timeSinceLastChange = lastChangeTime ? Date.now() - lastChangeTime : Infinity;
  lastChangeTime = Date.now();

  let isPaste = false;
  try {
    const clipboardText = await vscode.env.clipboard.readText();
    isPaste = clipboardText === insertedText && insertedText.length > 50;
  } catch (err) {
    log("Clipboard read failed", err);
  }

  const detectedProvider = detectAIProvider(insertedText) || lastAIProvider;
  const timeSinceCompletion = Date.now() - lastCompletionRequest;
  const isTyping = insertedText.length < 10 && timeSinceLastChange > 300;

  const isLikelyInline = lastCompletionRequest > 0 && timeSinceCompletion < 1000 && insertedText.length > 10;
  const isLikelyChat = lastCompletionRequest > 0 && timeSinceCompletion < 30000 && lastAIProvider && !isLikelyInline;

  const potentialAI = insertedLines > 3 || insertedText.length > 200 || detectedProvider !== null || isLikelyInline || isLikelyChat;
  const looksLikeAI = potentialAI && !isTyping && (!isPaste || isLikelyChat || detectedProvider !== null);

  let sessionProvider = detectedProvider;
  let sessionType: 'inline' | 'chat' = isLikelyInline ? 'inline' : 'chat';

  if (looksLikeAI && currentSession) {
    const duration = Date.now() - currentSession.startTime;
    const completedSession: AISession = {
      ...currentSession,
      duration,
    };
    aiSessions.push(completedSession);
    sessionProvider = detectedProvider || currentSession.provider;
    sessionType = currentSession.type;
    log(`AI session completed: ${duration}ms (${sessionProvider}, ${sessionType})`);
    currentSession = null;
  }

  if (looksLikeAI) {
    aiLines += insertedLines;
    if (isLikelyInline) inlineLines += insertedLines;

    switch (true) {
      case sessionProvider?.includes("copilot"):
        copilotLines += insertedLines;
        break;
      case sessionProvider?.includes("chatgpt"):
      case sessionProvider?.includes("openai"):
      case sessionProvider?.includes("gpt"):
        chatgptLines += insertedLines;
        break;
      case sessionProvider?.includes("claude"):
        claudeLines += insertedLines;
        break;
      case sessionProvider?.includes("gemini"):
        geminiLines += insertedLines;
        break;
      case sessionProvider?.includes("codeium"):
        codeiumLines += insertedLines;
        break;
      case sessionProvider?.includes("qodo"):
      case sessionProvider?.includes("qodogen"):
        qodogenLines += insertedLines;
        break;
      case sessionProvider?.includes("windsurf"):
        windsurfLines += insertedLines;
        break;
    }
  } else {
    humanLines += insertedLines;
  }

  // Decorations
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const aiRanges: vscode.DecorationOptions[] = [];
    const humanRanges: vscode.DecorationOptions[] = [];
    for (const change of event.contentChanges) {
      if (!change.text.includes("\n")) continue;
      const start = change.range.start;
      const end = editor.document.positionAt(editor.document.offsetAt(start) + change.text.length);
      const range = new vscode.Range(start, end);
      if (looksLikeAI) {
        aiRanges.push({ range, hoverMessage: `AI: ${sessionProvider || "AI"}` });
      } else {
        humanRanges.push({ range, hoverMessage: "Human-written" });
      }
    }
    editor.setDecorations(aiDecoration, aiRanges);
    editor.setDecorations(humanDecoration, humanRanges);
  }

  updateStatusBar();
  sendUpdateToDashboard();
  saveState(extContext);
  if (!looksLikeAI) lastAIProvider = null;
  if (timeSinceCompletion > 30000) lastCompletionRequest = 0;
}

function scheduleProcess(change: vscode.TextDocumentChangeEvent, extContext: vscode.ExtensionContext) {
  pendingChange = change;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    if (pendingChange) await processChange(pendingChange, extContext);
    pendingChange = null;
  }, 250);
}

// -------------- Activate --------------
export function activate(context: vscode.ExtensionContext) {
  loadState(context);
  outputChannel.show(true);
  log("AI Tracker activated");

  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  updateStatusBar();
  context.subscriptions.push(statusBar);

  registerAIDetectors(context);
  registerCompletionObserver(context);

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.uri.scheme !== "file") return;
    if (!event.contentChanges.some((c) => c.text.length > 0)) return;
    scheduleProcess(event, context);
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
      let htmlContent = data.toString(); // Fixed variable name
      htmlContent = htmlContent.replace(
        "</body>",
        `
        <script>
          const HUMAN_VALUE = ${humanLines};
          const AI_VALUE = ${aiLines};
          const INLINE_VALUE = ${inlineLines};
          const COPILOT_VALUE = ${copilotLines};
          const CHATGPT_VALUE = ${chatgptLines};
          const CLAUDE_VALUE = ${claudeLines};
          const GEMINI_VALUE = ${geminiLines};
          const CODEIUM_VALUE = ${codeiumLines};
          const QODOGEN_VALUE = ${qodogenLines};
          const WINDSURF_VALUE = ${windsurfLines};
          const SESSIONS = ${JSON.stringify(aiSessions)};
        </script>
        </body>`
      );
      currentPanel!.webview.html = htmlContent;
      log("Dashboard opened");

      currentPanel!.webview.onDidReceiveMessage((msg) => {
        if (msg === "ready") sendUpdateToDashboard();
        if (msg.command === "reset") {
          humanLines = aiLines = inlineLines = copilotLines = chatgptLines = claudeLines = geminiLines = codeiumLines = qodogenLines = windsurfLines = 0;
          aiSessions = [];
          currentSession = null;
          lastAIProvider = null;
          lastCompletionRequest = 0;
          vscode.window.showInformationMessage("Stats reset.");
          updateStatusBar();
          sendUpdateToDashboard();
          saveState(context);
        }
      });
    });

    currentPanel.onDidDispose(() => {
      currentPanel = null;
    });
  });

  const showTimePatterns = vscode.commands.registerCommand("aianalytics.showTimePatterns", () => {
    const patterns = getTimePatterns();
    const patternsPanel = vscode.window.createWebviewPanel(
      "timePatterns",
      "AI Time Patterns",
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );
    const html = `
      <!DOCTYPE html>
      <html><body style="background:#1e1e1e;color:#f5f5f5;padding:20px;font-family:monospace;">
        <h2>Daily AI Usage (seconds)</h2>
        <ul>${Object.entries(patterns.daily).map(([d, t]) => `<li>${d}: ${Math.round(t / 1000)}s</li>`).join('')}</ul>
        <h2>Hourly Breakdown</h2>
        <ul>${Object.entries(patterns.hourly).map(([h, data]) => `<li>${h.replace(/_H/g, ' Hour ')}: ${Math.round(data.total / 1000)}s (Providers: ${JSON.stringify(data.providers)})</li>`).join('')}</ul>
        <button style="padding:8px;background:#007acc;color:white;border:none;cursor:pointer;" onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(patterns)}, null, 2))">Copy JSON</button>
      </body></html>`;
    patternsPanel.webview.html = html;
  });

  context.subscriptions.push(showDashboard, showTimePatterns);
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => saveState(context)));
}

// -------------- Deactivate --------------
export function deactivate() {
  humanDecoration.dispose();
  aiDecoration.dispose();
}
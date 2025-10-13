# 🧠 AI vs Human Code Tracker — VS Code Extension

> A smart VS Code extension that tracks how much of your code is written by **humans** vs **AI assistants** (Copilot, ChatGPT, Codeium, Tabnine, etc.) — in **real time**.

It highlights human-written and AI-generated code in the editor, tracks live line-based stats, and provides a beautiful dashboard visualization 📊.

---

## ✨ Features

✅ **Line-based tracking**
- Counts only *new lines* (not every keystroke) for realistic measurement.

✅ **Smart AI detection**
- Detects Copilot, ChatGPT, Codeium, and Tabnine completions.  
- Flags large multi-line pastes as AI-generated.

✅ **Inline code highlighting**
- 🟩 Green → human-written lines  
- 🟥 Red → AI-generated lines  
- Hover to see tooltips like _“👨‍💻 Human-written code”_ or _“🤖 AI-generated code”_.

✅ **Bottom status bar counters**
- Real-time stats like `👨‍💻 3 | 🤖 200`.

✅ **Compact real-time dashboard**
- Interactive doughnut chart + progress bar  
- Live auto-refresh  
- 🔄 Reset button  
- Optimized for small screens (no scrolling)

✅ **Completely local**
- 100% offline. No telemetry, no data collection.

---

## 📸 Screenshots

### 🧭 Dashboard


## ⚙️ Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:mansurali901/ai-code-detector-vscode.git
   cd ai-code-detector-vscode
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run compile
   ```

4. Launch inside VS Code:
   - Press **F5** to open a new *Extension Development Host* window.

---

## 🚀 Usage

1. Open any file and start typing.  
   - Bottom bar updates live.
2. Type manually → counts as **Human** lines.  
3. Accept Copilot/ChatGPT suggestions or paste AI snippets → counts as **AI** lines.  
4. Hover colored lines to view their source.
5. Open the dashboard:
   - `Ctrl + Shift + P` → **Show AI vs Human Stats**
6. Click **🔄 Reset Stats** to clear counters.

---

## 📊 Dashboard Overview

| Element | Description |
|----------|--------------|
| 🥧 Doughnut Chart | Visual breakdown of Human vs AI code |
| 📈 Progress Bar | Displays contribution ratio |
| 💬 Summary | Shows total lines and percentages |
| 🔄 Reset Button | Clears stats immediately |

---

## 🧠 Detection Logic

| Behavior | Counted As | Trigger |
|-----------|-------------|----------|
| Manual typing / single-line edits | 👨‍💻 Human | Small inline changes |
| Copilot / ChatGPT / Codeium completions | 🤖 AI | Detected via known API commands |
| Large pastes (>200 chars or >3 lines) | 🤖 AI | Heuristic |
| Enter (new line) | 👨‍💻 Human | +1 line |
| Inline edits without new line | — | Ignored |

---

## 🎨 Code Highlighting

```js
// 👨‍💻 Human-written code
function add(a, b) {
  return a + b;
}

// 🤖 AI-generated code
function fibonacci(n){return n<=1?n:fibonacci(n-1)+fibonacci(n-2);}
```

| Source | Color | Tooltip |
|---------|--------|----------|
| Human | 🟩 `rgba(76,175,80,0.15)` | "👨‍💻 Human-written code" |
| AI | 🟥 `rgba(244,67,54,0.15)` | "🤖 AI-generated code" |

---

## 🧩 Commands

| Command | Description |
|----------|--------------|
| `aianalytics.showStats` | Opens the AI vs Human Dashboard |
| **Reset Stats** | Clears current line counts |

---

## 🛠️ Development Setup

If you’d like to customize or extend this extension:

1. Make changes in:
   - `src/extension.ts` (backend logic)
   - `src/dashboard.html` (frontend dashboard)
2. Build:
   ```bash
   npm run compile
   ```
3. Launch:
   ```bash
   code .
   # Press F5 to start Extension Host
   ```
4. Check logs:
   - **View → Output → AI Tracker Logs**

---

## 🧱 Project Structure

```
vscode-ai-vs-human-tracker/
├── src/
│   ├── extension.ts        # Main extension logic
│   ├── dashboard.html      # Dashboard UI
│   └── assets/
│       └── icon.png
├── package.json            # Extension metadata
├── README.md               # This file
├── tsconfig.json           # TypeScript config
└── out/                    # Compiled JS output
```

---

## 🧭 Marketplace Metadata Example

If you plan to publish this to the **VS Code Marketplace**, include the following fields in `package.json`:

```json
{
  "name": "ai-vs-human-tracker",
  "displayName": "AI vs Human Code Tracker",
  "description": "Tracks how much of your code is written by humans vs AI assistants (Copilot, ChatGPT, Codeium, etc.).",
  "version": "1.0.0",
  "publisher": "<your-name>",
  "engines": {
    "vscode": "^1.90.0"
  },
  "categories": ["Other", "Programming Languages"],
  "activationEvents": ["onCommand:aianalytics.showStats"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "aianalytics.showStats",
        "title": "Show AI vs Human Stats"
      }
    ]
  },
  "galleryBanner": {
    "color": "#1e1e1e",
    "theme": "dark"
  },
  "icon": "images/icon.png"
}
```

---

## 💡 Planned Features

- [ ] Session persistence between VS Code restarts  
- [ ] Per-language & per-file breakdowns  
- [ ] Exportable stats (CSV / JSON)  
- [ ] Trend analytics (AI usage over time)  
- [ ] Team dashboard mode (aggregated data)  

---

## 📜 License

**MIT License © 2025**  
Created with ❤️ to help developers understand their **AI-assisted productivity**.

---

## 🧠 Credits

- Built using the [VS Code API](https://code.visualstudio.com/api)  
- Visualized with [Chart.js](https://www.chartjs.org)  
- Inspired by GitHub Copilot analytics dashboards  
- Designed and engineered by [You]

---

### Example Insight

> _“You wrote 203 total lines this session — 3 by human (1.5%) and 200 by AI (98.5%).”_  
> Track your real AI-coding adoption in every session!

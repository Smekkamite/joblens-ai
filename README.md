# JobLens AI

JobLens AI is a Chrome extension that analyzes job postings in real-time and tells you whether you should apply, skip, or consider them.

It uses a local LLM (via Ollama) combined with a deterministic filtering system based on your personal preferences.

---

## 🚀 Features

- 🔍 Automatic job extraction from LinkedIn
- 🧠 LLM-powered job analysis (Ollama - llama3.1:8b)
- ⚖️ Smart recommendation system:
  - APPLY
  - BORDERLINE
  - SKIP
- 🎯 Personalized filtering system (your preferences)
- ⚡ Real-time UI injected directly into job pages
- 🔧 Fully local (no API costs)

---

## 🧠 How It Works

1. The extension extracts the job description from LinkedIn
2. Sends it to a local LLM (Ollama)
3. Receives structured JSON
4. Applies deterministic logic:
   - experience filtering
   - remote/hybrid/onsite rules
   - personal preferences
5. Outputs:
   - recommendation
   - red flags
   - fit analysis

---

## ⚙️ Personalization (Core Feature)

You can configure your job preferences directly in the UI:

### Preferences:
- Preferred roles (e.g. cloud support, helpdesk)
- Preferred technologies (Azure, AD, etc.)
- Required languages
- Max years of experience
- Minimum salary (WIP)

### Filters:
- Remote only
- Allow hybrid
- Allow onsite
- Avoid travel
- Avoid on-call

### Result:
Each job is evaluated **based on YOUR profile**, not generic rules.

---

## 🧩 Architecture


LinkedIn Page
↓
Content Script (job extraction)
↓
Background Script
↓
Ollama (LLM - local)
↓
Normalization + Enrichment
↓
UI Injection


---

## 🛠️ Tech Stack

- TypeScript
- Vite
- Chrome Extension API
- Ollama (local LLM)
- llama3.1:8b


## 📦 Installation

### 1. Clone repo
```bash
git clone https://github.com/Smekkamite/joblens-ai.git
cd joblens-ai
2. Install dependencies
npm install
3. Build
npm run build
4. Load extension
Go to chrome://extensions/
Enable Developer mode
Click Load unpacked
Select the dist/ folder
🤖 Ollama Setup

Install Ollama and run:

ollama run llama3.1:8b

Ensure API is available at:

http://localhost:11434
⚠️ Current Limitations
LLM extraction can sometimes misinterpret roles
Salary parsing is basic
No CV integration yet (planned)
LinkedIn DOM changes can break extraction
🔥 Roadmap
CV upload → automatic profile generation
Better salary detection
Improved role classification
Smart job clustering
Auto-apply assistant (future)

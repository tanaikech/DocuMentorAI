# 👤 Individual Installation & Usage Guide (Personal Setup)

**[⬅️ Back to Main README](README.md)** | **[🏫 Looking for School, University & Organization Deployment? See `INSTALL_ORGANIZATION.md`](INSTALL_ORGANIZATION.md)**

---

## Overview: Personal Container-Bound Setup (`UserProperties`)

This guide walks **individual users** (independent writers, researchers, engineers, bloggers, and learners) through installing **DocuMentor AI (`v1.0.3`)** directly inside a Google Document using a container-bound Google Apps Script project.

In this mode:
- **Zero Cloud Console Setup Required:** You do not need to create or configure a standard Google Cloud Platform (GCP) project or publish an add-on.
- **Simple Sidebar API Key Input:** You simply paste your personal **Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/)) into the **DocuMentor AI** sidebar once, and it is stored privately in your account's `PropertiesService.getUserProperties()`.
- **Full Feature Access:** You get immediate access to the 4-stage multimodal proofreading pipeline (`WriteMode.SUGGEST`, `addCommentReply`, `insertComment`), **🎯 Proofread Selection Only**, **💡 Hint-Only Mode**, **📜 Include Resolved Review History**, and the **🎓 Writing Coach & Learning Summary** modal dialog.

---

## Prerequisites for Individual Users

1. **A Google Account:** Any standard Google account (`@gmail.com`) or Google Workspace account with access to [Google Docs](https://docs.google.com/).
2. **A Gemini API Key:** Obtainable in seconds from [Google AI Studio](https://aistudio.google.com/apikey).

---

## Step-by-Step Installation Instructions

### Step 1: Create or Open a Google Document
1. Open [Google Docs](https://docs.google.com/) in your web browser.
2. Create a new blank document or open an existing manuscript you want to proofread.
3. In the top menu bar, click **Extensions** > **Apps Script** to open the Google Apps Script editor in a new browser tab.

---

### Step 2: Copy and Paste the 3 Script Files (`src/`)
In the Apps Script editor, configure the following three files from the [`src/`](src/) directory of this repository:

#### 1. Enable and Update `appsscript.json` (Manifest File)
1. In the left sidebar of the Apps Script editor, click **Project Settings** (the gear icon ⚙️).
2. Check the box labeled **✅ "Show 'appsscript.json' manifest file in editor"**.
3. Click **Editor** (the `< >` code icon on the left sidebar) to return to the file list.
4. Click on **`appsscript.json`** in the left file list, delete its default contents, and paste the entire contents of **[`src/appsscript.json`](src/appsscript.json)**:
   ```json
   {
     "timeZone": "Asia/Tokyo",
     "dependencies": {
       "enabledAdvancedServices": [
         {
           "userSymbol": "Docs",
           "serviceId": "docs",
           "version": "v1"
         }
       ]
     },
     "exceptionLogging": "STACKDRIVER",
     "runtimeVersion": "V8",
     "oauthScopes": [
       "https://www.googleapis.com/auth/documents",
       "https://www.googleapis.com/auth/script.container.ui",
       "https://www.googleapis.com/auth/script.external_request"
     ]
   }
   ```
   *(Note: Including `Docs` `v1` in `enabledAdvancedServices` automatically enables the Google Docs REST API on your Apps Script project's default cloud project without requiring any manual GCP setup.)*

#### 2. Copy `src/code.js` into `Code.gs`
1. In the left file list, select the default **`Code.gs`** file.
2. Delete the default `function myFunction() {}` placeholder and paste the entire contents of **[`src/code.js`](src/code.js)**.

#### 3. Create `index.html`
1. Click the **`+`** button next to **Files** in the left panel and select **HTML**.
2. Type **`index`** as the file name and press `Enter` *(it will automatically appear as `index.html`—do not type `.html` in the name prompt)*.
3. Delete the default HTML boilerplate and paste the entire contents of **[`src/index.html`](src/index.html)**.

#### 4. Save the Project
- Press **`Ctrl + S`** (Windows/Linux) or **`Cmd + S`** (macOS), or click the **Save project** icon (💾) in the top toolbar.

---

### Step 3: Reload Google Docs & Authorize Permissions
1. Close or switch back from the Apps Script tab to your **Google Docs browser tab**, and **reload (refresh) the page**.
2. After a few seconds, a custom menu **`✦ DocuMentor AI`** will appear in the Google Docs top menu bar (and also under **Extensions** > **DocuMentor AI**).
3. Click **`✦ DocuMentor AI`** > **`Open Dashboard`**.
4. **First-Time Authorization:**
   - A dialog titled *"Authorization Required"* will appear. Click **Continue**.
   - Select your Google account.
   - If a *"Google hasn't verified this app"* screen appears (standard for personal Apps Script projects you just created in your own account), click **Advanced** at the bottom-left and click **Go to Untitled project (unsafe)** (or your project name), then click **Allow**.
5. Once authorization completes, click **`✦ DocuMentor AI`** > **`Open Dashboard`** again to open the sidebar on the right side of Google Docs.

---

## How to Configure & Use the Sidebar Dashboard

### 1. Register Your Personal Gemini API Key (`⚙️ AI Engine & API Settings`)
1. When the sidebar opens for the first time, locate the **⚙️ AI Engine & API Settings** card at the top.
2. Paste your **Gemini API Key** into the password input box (`AIzaSy...`) and click **Save**.
3. Your key is stored securely in `PropertiesService.getUserProperties()` (accessible only to your Google account). The box will change to **`🔒 API Key Configured (Saved)`** with a **Reset** link in case you ever want to replace your key.
4. Select your preferred **Gemini Model**:
   - **`gemini-3.8-flash (Default / Fast)`:** Ideal for fast daily proofreading and quick iterative checks.
   - **`gemini-4-argon (High Precision)`:** Ideal for deep structural, academic, and cross-modal analysis across text, tables, and charts.
5. Toggle the UI and AI output language between **`EN`** (100% English) and **`JA`** (100% Japanese) at the top-right corner of the sidebar header.

### 2. Choose Your Proofreading Scope & Coaching Modes (`✍️ Proofreading Scope & Controls`)
- **🎯 Proofread Selection Only:**
  - **OFF (Default):** Proofreads the **entire active tab** (body text, tables, and figures/charts).
  - **ON:** Extracts and uploads **strictly your highlighted selection** (`doc.getSelection()`—specific sentences, paragraphs, table cells, tables, or figures) for fast, targeted polishing.
- **💡 Hint-Only Mode (Comment Without Rewrite):**
  - **OFF (Default):** Proposes inline text replacements (`WriteMode.SUGGEST`) + educational comment replies (`addCommentReply`).
  - **ON:** Anchors only the diagnostic issue (`Reason`) and a self-revision hint (`Coaching Hint`) as a Google Docs comment (`insertComment`) without modifying the text on the canvas—letting you practice rewriting the sentence yourself first, and then optionally expand `👁️ Show Reference Rewrite` in Step 2 of the sidebar to compare.
- **📜 Include Resolved Review History:**
  - **OFF (Default):** Analyzes only currently active inline suggestions and open comments.
  - **ON:** Extracts resolved comments (`RESOLVED`) and already accepted/rejected suggestions (`ACCEPTED` / `REJECTED`) via the Google Docs API (`commentsViewMode=COMMENTS_VIEW_MODE_INCLUDED`) to maintain continuity across drafts and synthesize cumulative learning summaries.

### 3. Add Custom Prompt Instructions & Run Proofreading
1. *(Optional)* Enter specific instructions in the **Additional Proofreading Instructions** box or click the preset chips (`#Concise & Logical`, `#Business Tone`, `#Tables & Charts`, `#Grammar & Flow`).
2. Click **🚀 Run Proofreading (Suggest & Coach)** (or **💡 Run Proofreading (Hint-Only Comments)** when Hint-Only Mode is ON).
3. Watch the **📊 Process Dashboard** progress through **Step 1** ➔ **Step 2** ➔ **Step 3** ➔ **Step 4** in real time.
4. Upon completion, the **🎓 Writing Coach & Learning Summary** modal dialog automatically opens with a one-click **📋 Copy to Clipboard** button.

### 4. Learn from Existing Peer Reviews & Manage Suggestions in Bulk
- **🎓 Generate Learning Summary from Suggestions & Comments:** Click this button anytime to synthesize a **Writing Coach & Learning Summary** from existing suggestions and comments (including feedback left by colleagues, supervisors, or co-authors, as well as resolved history when enabled) without modifying the document.
- **One-Click Bulk Actions:**
  - **✅ Accept All Suggestions:** Accepts all pending inline suggestions in the active tab at once (`acceptSuggestion`).
  - **🧹 Clear All Suggestions:** Rejects and clears all pending inline suggestions in the active tab at once (`rejectSuggestion`).
  - **🗑️ Clear All Comments:** Deletes all open comments in the active tab at once (`deleteComment`).

---

**[⬅️ Back to Main README](README.md)** | **[🏫 View School, University & Organization Deployment Guide](INSTALL_ORGANIZATION.md)**

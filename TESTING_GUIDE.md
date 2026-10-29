# 🧪 End-to-End Verification & Feature Testing Guide

**[⬅️ Back to Main README](README.md)** | **[👤 Individual Setup Guide (`INSTALL_INDIVIDUAL.md`)](INSTALL_INDIVIDUAL.md)** | **[🏫 Organization Deployment Guide (`INSTALL_ORGANIZATION.md`)](INSTALL_ORGANIZATION.md)**

---

## Overview

This step-by-step testing guide provides **8 self-contained, hands-on test scenarios** designed so that any user, educator, researcher, or IT administrator can systematically verify **all features of DocuMentor AI**—including **Google Drive RAG Rulebook Grounding**, the **Strict Fail-Closed Selection Scope Boundary for Review History**, and the **Progressive Command Center Sidebar UI**.

Every test scenario below includes its own ready-to-copy sample text or script right at the beginning of the procedure, so you can run any test independently from start to finish.

### Quick Summary of the 8 Test Scenarios

| Test # | Feature Under Test | Key Capabilities Verified | Estimated Time |
| :--- | :--- | :--- | :--- |
| **[Test 1](#test-1--progressive-command-center-ui-status-bar-sync--reset-view--bilingual-switch)** | Progressive Command Center UI, Status Bar, `🔄 Sync Doc & Reset View` & `EN`/`JA` Switch | 2-row Status Bar, auto-collapsing `⚙️` drawer, `🔄 Sync Doc & Reset View`, `Expand All` / `Collapse All`, Dual-Mode detection, About dialog & `EN`/`JA` switch | 1 min |
| **[Test 2](#test-2--blank-document-auto-detection--initial-draft-generation)** | Empty Tab Detection & `📝 Generate Initial Text from Prompt` | Automatic blank-tab banner, auto-expanding prompt accordion & initial plain-text draft insertion (`WriteMode.EDIT`) | 1 min |
| **[Test 3](#test-3--full-tab-multimodal-proofreading-prose--table--figure)** | Full-Tab Multimodal Proofreading (`✍️ Suggest & Coach`) | Inline suggestions (`WriteMode.SUGGEST`), `addCommentReply`, `TABLE_1` & `VISUAL_1` multimodal comments & `🎓 Writing Coach & Learning Summary` dialog | 2 min |
| **[Test 4](#test-4--active-self-revision-coaching-hint-only-mode)** | `💡 Hint-Only Mode` (Active Self-Revision Coaching) | Anchored coaching hint comments (`insertComment`) without spoiling the rewrite + collapsible `👁️ Show Reference Rewrite` | 2 min |
| **[Test 5](#test-5--resolved-review-history-ledger--standalone-learning-summary)** | `📜 Resolved History` Ledger & Standalone Learning Summary | Extracting `RESOLVED` / `ACCEPTED` / `REJECTED` review threads & generating `🎓 Learning Summary from Suggestions & Comments` | 2 min |
| **[Test 6](#test-6--strict-fail-closed-selection-scope-boundary-synthetic-marker-regression-test)** | **`🎯 Selection Only` + `📜 Resolved History` Strict Scope Boundary** | Confirming that out-of-selection resolved comments (`SYNTHETIC_OUT_OF_SELECTION_MARKER_999`) are 100% excluded from Step 1, Step 2 & uploaded files | 2 min |
| **[Test 7](#test-7--context-aware--enterprise-grounded-rag-via-google-drive-folder-or-single-file-prose--script-review)** | **Google Drive RAG Folder or Single File (`📚 RAG_FOLDER_ID`)** | Automatic Folder vs. File ID/URL detection (`.md`, `.txt`, Google Docs), parallel Gemini File API upload & rulebook-grounded **prose proofreading (Part A)** and **script/code review (Part B)** | 4 min |
| **[Test 8](#test-8--multi-language-interactive-code-review--quick-canvas-cleanup-toolbar)** | Line-by-Line Multi-Language Code Review & Quick Canvas Cleanup | Line-by-line code suggestions (`WriteMode.SUGGEST`) & 3-column cleanup toolbar (`✅ Accept` \| `🧹 Reject` \| `🗑️ Comments`) | 2 min |

---

## Test 1 — Progressive Command Center UI, Status Bar, Sync & Reset View & Bilingual Switch

### Objective
Verify the **Progressive Command Center** layout, the 2-row **Status Bar**, the auto-collapsing **⚙️ Settings & Drive RAG Drawer**, the **`🔄 Sync Doc & Reset View`** button, the **`Expand All` / `Collapse All`** toggle, the **About Dialog**, and instant **English (`EN`) / Japanese (`JA`)** switching.

### Step-by-Step Procedure
1. **Prepare the Sample Text in Google Docs:**
   - Open your Google Document, clear the active tab, and paste the following short sample text:
     ```text
     DocuMentor AI helps writers and engineers improve their drafts through interactive suggestions and educational coaching comments.
     ```
2. **Launch the Sidebar & Verify First-Run Drawer Behavior:**
   - Launch **DocuMentor AI** via **`✦ DocuMentor AI` > `Open Dashboard`** (or **`Extensions` > `DocuMentor AI` > `Open Dashboard`**).
   - **If no API key is configured yet:** Confirm that the **⚙️ Settings Drawer** opens automatically directly below the Status Bar and the badge shows **`🔑 API: Setup`** (in rose/red).
   - Paste your Gemini API key (`AIzaSy...`) and click **Save**.
   - **Expected Result:** The **⚙️ Settings Drawer** automatically collapses, and the Status Bar badge updates to **`🔑 API: Ready`** (or **`🔑 API: Admin`** if configured via `ScriptProperties` in School/Organization Mode).
3. **Verify the Status Bar & Settings Drawer Toggle:**
   - Click the **`⚙️`** button (or click the `🔑 API` / `📚 RAG` badges) on the Status Bar.
   - **Expected Result:** The **`⚙️ Engine, API Key & Drive RAG`** drawer opens and closes directly underneath the Status Bar without overlapping the model selector.
   - Switch the model selector at the top of the Status Bar between **`⚡ 3.8 Flash (Fast)`** and **`🧠 4 Argon (Deep)`**.
4. **Verify Bilingual (`EN` / `JA`) Switching:**
   - Click **`JA`** at the top-right corner of the header, then click **`EN`**.
   - **Expected Result:** All sidebar labels, segmented mode tabs, full-width scope rows, live scope summary bar (`📑 Full Active Tab • 💬 Active Reviews • 📚 RAG OFF`), and step descriptions switch immediately between English and Japanese without overflowing the sidebar.
5. **Verify the `🔄 Sync Doc & Reset View` Button & `Expand All` / `Collapse All` Toggle:**
   - Click **`🔄 Sync Doc & Reset View`**.
   - **Expected Result:** Your selected Gemini Model, API Key, and RAG settings remain untouched, while the UI controls and Process Dashboard reset and reload the sample text from Step 1 into **Step 1 (`Fetch Text, Tables, Figures & RAG`)**.
   - In the **📊 Process Dashboard** header, click **`Expand All`** (all 4 step cards open and the button label changes to **`Collapse All`**), then click **`Collapse All`** again to confirm all 4 step cards close cleanly.
6. **Verify the About Modal Dialog:**
   - Click the **`DocuMentor AI ⓘ`** brand title in the top header (or the footer link).
   - **Expected Result:** A modal dialog opens displaying **DocuMentor AI**, Developer (**Kanshi Tanaike**), and the clickable GitHub repository link.

---

## Test 2 — Blank Document Auto-Detection & Initial Draft Generation

### Objective
Verify that DocuMentor AI automatically detects an empty document tab, expands the **💬 Custom Instructions & Initial Draft** accordion, and generates a clean plain-text draft into the active tab.

### Step-by-Step Procedure
1. **Prepare an Empty Tab in Google Docs:**
   - Delete all text, tables, figures, and comments in your active Google Docs tab so it is completely blank.
2. **Sync the Blank Tab State:**
   - Click **`🔄 Sync Doc & Reset View`** in the sidebar (or reload the sidebar).
   - **Expected Result:** The **`💬 Custom Instructions & Initial Draft`** accordion automatically opens and displays the amber banner: *"📄 The active tab is currently empty..."*
3. **Enter the Sample Generation Prompt:**
   - Copy and paste the following prompt into the custom prompt textarea:
     ```text
     Write a short, two-paragraph executive summary about the benefits of combining automated testing with peer code reviews in software engineering teams.
     ```
   - **Expected Result:** An **`Active`** badge (`入力あり` in `JA`) lights up on the right side of the accordion header.
4. Click **`📝 Generate Initial Text from Prompt`**.
5. **Expected Result:**
   - **Step 1** completes and displays a preview of the generated text.
   - Two clean paragraphs of plain text (without raw Markdown `#` or `**` symbols) are inserted directly into the active Google Docs tab at index `1` (`WriteMode.EDIT`).

---

## Test 3 — Full-Tab Multimodal Proofreading (Prose + Table + Figure)

### Objective
Verify the 4-stage multimodal proofreading pipeline (`WriteMode.SUGGEST`, `addCommentReply`, and `insertComment`) across body prose, a structured table (`TABLE_1`), and an embedded figure/chart (`VISUAL_1`), along with the **🎓 Writing Coach & Learning Summary** modal dialog.

### Step-by-Step Procedure
1. **Prepare the Multimodal Sample Manuscript in Google Docs:**
   - Clear the active Google Docs tab, copy the following sample manuscript (which matches **[`sample/sample_article.md`](sample/sample_article.md)** and intentionally includes redundant modifiers, uncountable noun errors, and a comparison table), and paste it into your Google Doc (using **Right-click > Paste from Markdown**, or pasting the text and creating the 3-row table):
     ```markdown
     # Introduction to Google Apps Script (GAS)

     Google Apps Script (GAS) is basically a coding platform that is provided by Google, and it is made based on the JavaScript language. The most biggest advantage of using GAS is because you can very easily connect and integrate with many various Google apps like Sheets, Docs, and Gmail that we are using every single day to automate boring daily routine works.

     First of all, the way to start using GAS is super simple and you totally do not need to install any special softwares on your computer at all. There is a merit that you can immediately start writing code just by opening your web browser.

     | Target App | GAS Service | Main Automation Use Case | Task Time |
     | :--- | :--- | :--- | :--- |
     | Sheets / Docs | `SpreadsheetApp` / `DocumentApp` | Automating daily data aggregation and document creation | 30 min |
     | Gemini AI API | `UrlFetchApp` | Calling generative AI for custom business workflow tools | 5 min |

     Also, recently it has become possible to call generative AI APIs like Gemini by using UrlFetchApp, so you are able to create your own custom AI tools for your business tasks. Even for beginners of programming, since the learning hurdle is low, trying to use it as a first step of workflow improvement is very recommended.
     ```
   - Place your cursor right below the table, click **Insert > Image > Upload from computer**, and select **[`sample/sample_figure.png`](sample/sample_figure.png)**.
2. **Configure the Sidebar Controls:**
   - Coaching Mode Tab: **`✍️ Suggest & Coach`**
   - **`🎯 Selection Only`**: **OFF** (`Full Tab`)
   - **`📜 Resolved History`**: **OFF** (`Active Only`)
3. Click **`🚀 Run Proofreading (Suggest & Coach)`**.
4. **Expected Result:**
   - The **4-Segment Live Pipeline Progress Bar** animates across **Step 1 ➔ Step 2 ➔ Step 3 ➔ Step 4**.
   - **Step 1 (`Fetch Text, Tables, Figures & RAG`)** reports the character count, `Tables: 1`, and `Figures: 1`.
   - **Step 2 (`Generate AI Proofreading & Coaching`)** displays inline diff cards (`Original ➔ Suggested` with `Reason` and `Learning Point`) and **💬 Figure/Chart & Table Review Comments** for `TABLE_1` and `VISUAL_1`.
   - **On the Google Docs Canvas:**
     - Awkward phrases in the body text and table cells (e.g., *"most biggest"*, *"boring daily routine works"*, *"special softwares"*) are turned into native **Google Docs Inline Suggestions** with attached **🤖 DocuMentor AI Coaching** replies (`addCommentReply`).
     - `TABLE_1` and `VISUAL_1` receive anchored **Google Docs Comments** (`insertComment`) pointing out data/label consistency (such as the 120-minute manual baseline shown in Figure 1 vs. Table 1).
   - **Modal Dialog:** The **`🎓 Writing Coach & Learning Summary`** modal dialog automatically pops up. Click **`📋 Copy to Clipboard`** to verify one-click copy, close the dialog, and click **`📖 Re-open Latest Learning Summary Dialog`** in the sidebar to confirm it re-opens instantly.

---

## Test 4 — Active Self-Revision Coaching (`💡 Hint-Only Mode`)

### Objective
Verify that **💡 Hint-Only Mode** withholds direct text replacements on the Google Docs canvas and instead anchors diagnostic coaching hints as comments so learners can practice revising sentences on their own first.

### Step-by-Step Procedure
1. **Prepare the Sample Draft in Google Docs:**
   - Clear the active Google Docs tab (if suggestions or comments remain from a previous test, click **`🧹 Reject`** and **`🗑️ Comments`** in the **🧹 Quick Canvas Cleanup** toolbar first), and paste the following self-contained sample paragraph:
     ```text
     In our research laboratory, we are basically conducting many various experiments every single day in order to evaluate the most best parameters for our machine learning model. However, collecting experimental data informations manually by hand takes a very long time and causes many careless human mistakes.
     ```
2. **Switch to `💡 Hint-Only Mode`:**
   - In the **✍️ Coaching Mode & Scope Controls** card, click the right segmented tab: **`💡 Hint-Only Mode`**.
   - Confirm **`🎯 Selection Only`** is **OFF** (`Full Tab`).
   - **Expected Result:** The mode tab glows amber, the caption updates to *"Anchors coaching hints as comments without spoiling the rewrite"*, and the primary button changes to **`💡 Run Proofreading (Hint-Only Comments)`**.
3. Click **`💡 Run Proofreading (Hint-Only Comments)`**.
4. **Expected Result:**
   - **On the Google Docs Canvas:** **Zero inline text replacements (`WriteMode.SUGGEST`) are created.** Instead, flagged phrases (such as *"many various"*, *"most best"*, *"data informations"*, *"manually by hand"*) receive anchored **Google Docs Comments (`insertComment`)** headed `💡 DocuMentor AI Hint (Self-Revision Coaching)` containing only the **🎯 Flagged Phrase**, **🔍 What to Check (Issue)**, and **🎓 Coaching Hint (How to Revise)**—without spoiling the rewritten sentence.
   - **In the Sidebar (Step 2):** Each card displays a collapsible **`👁️ Show Reference Rewrite (After Trying Yourself)`** accordion. Click it to reveal the model's reference rewrite after attempting your own edit.

---

## Test 5 — Resolved Review History Ledger & Standalone Learning Summary

### Objective
Verify that DocuMentor AI extracts resolved comments (`RESOLVED`) and accepted/rejected inline suggestions (`ACCEPTED` / `REJECTED`) from the Google Docs API (`commentsViewMode=COMMENTS_VIEW_MODE_INCLUDED`) and synthesizes a **🎓 Writing Coach & Learning Summary** without modifying the document.

### Step-by-Step Procedure
1. **Prepare the Sample Text & Review History in Google Docs:**
   - Clear the active Google Docs tab and paste the following sample paragraph:
     ```text
     The new cloud system provides a very unique solution that completely eliminates all potential server downtimes and makes daily maintenance works super easy for every engineers.
     ```
   - Create both an active comment and a resolved comment (or run **`✍️ Suggest & Coach`** once and accept/resolve some items):
     1. Highlight `very unique` in the document, add a Google Docs comment: `Avoid grading an absolute adjective like "unique"; use "distinctive" or simply "unique".`, and click the **✓ (Resolve)** checkmark on that comment so it moves into resolved history.
     2. Highlight `maintenance works` in the document and add an open Google Docs comment: `"Work" is uncountable here; change to "maintenance tasks" or "maintenance work".` (leave this comment open/unresolved).
2. **Enable Resolved History & Run Standalone Learning Summary:**
   - In the sidebar, toggle **`📜 Resolved History`** **ON** (`+Resolved Threads`).
   - Confirm **`🎯 Selection Only`** is **OFF** (`Full Tab`).
   - Click **`🎓 Learning Summary from Suggestions & Comments`**.
3. **Expected Result:**
   - **Step 1:** Displays the metric `Active / Resolved` (e.g., `1/1`), renders **`💬 View Scoped Active Suggestions & Open Comments`**, and renders the green collapsible ledger **`📜 View Scoped Resolved Review History`**. Expanding the resolved ledger shows the resolved thread (`COMMENT • RESOLVED`), reviewer name, anchor quote (`"very unique"`), and content.
   - **Step 2:** Synthesizes lessons from both the active comment and the resolved comment history.
   - **Step 3 & Step 4:** Marked as `Skipped` / `Completed` without modifying the Google Doc.
   - **Modal Dialog:** Opens the **`🎓 Writing Coach & Learning Summary`** dialog summarizing your writing habits across both active and resolved review threads.

---

## Test 6 — Strict Fail-Closed Selection Scope Boundary (Synthetic Marker Regression Test)

### Objective
Verify the **Strict Selection Scope Boundary**: when **`🎯 Selection Only`** is combined with **`📜 Resolved History`**, resolved (or open) comments anchored outside the user's highlighted selection must **never** leak into Step 1's review lists, Step 2's uploaded Markdown files (`selected_excerpt.md` / `selected_reviews_context.md`), or the Gemini text payload.

### Step-by-Step Procedure
1. **Prepare the Two-Paragraph Sample Document in Google Docs:**
   - Clear the active Google Docs tab (click **`🗑️ Comments`** if any comments remain) and paste the following two paragraphs:
     ```text
     Paragraph 1: This introductory section discusses legacy manual spreadsheet workflows used by the accounting department.

     Paragraph 2: The most biggest advantage of GAS is that you totally do not need special softwares at all to automate daily routine works.
     ```
2. **Create an Out-of-Selection Resolved Comment with a Synthetic Marker in Paragraph 1:**
   - Highlight the word `spreadsheet` in **Paragraph 1**, add a Google Docs comment containing the exact synthetic marker below, and click **✓ (Resolve)** on that comment thread so it becomes a resolved comment:
     ```text
     SYNTHETIC_OUT_OF_SELECTION_MARKER_999: Legacy manual workflow note outside selection.
     ```
3. **Create an In-Selection Resolved Comment in Paragraph 2:**
   - Highlight the word `advantage` in **Paragraph 2**, add a second Google Docs comment containing the marker below, and click **✓ (Resolve)** on it:
     ```text
     IN_SELECTION_RESOLVED_MARKER_111: Note anchored inside the selected paragraph.
     ```
4. **Enable Both Toggles & Highlight Only Paragraph 2:**
   - In the sidebar, switch the coaching mode tab to **`✍️ Suggest & Coach`**.
   - Turn **ON** **`🎯 Selection Only`** (`Strict Excerpt`).
   - Turn **ON** **`📜 Resolved History`** (`+Resolved Threads`).
   - Confirm the live scope summary bar reads: **`🎯 Selection Only (Strict Scope) • 📜 Active + Resolved`**.
   - On the Google Docs canvas, **highlight ONLY Paragraph 2** with your cursor.
5. Click **`🚀 Run Proofreading (Suggest & Coach)`** (or **`🎓 Learning Summary from Suggestions & Comments`**).
6. **Expected Result (Pass Criteria):**
   - Expand **Step 1 (`Fetch Text, Tables, Figures & RAG`)** in the sidebar:
     - The scope banner reads: **`🎯 Scope: Selected Content Only in "..." (Strict History Boundary)`**.
     - `SYNTHETIC_OUT_OF_SELECTION_MARKER_999` (anchored in Paragraph 1) is **100% absent** from Step 1's **`📜 View Scoped Resolved Review History`** ledger and `Scoped Context` box.
     - Only `IN_SELECTION_RESOLVED_MARKER_111` (anchored inside the selected Paragraph 2) appears in the resolved history ledger.
   - Expand **Step 2 (`Generate AI Proofreading & Coaching`)**:
     - Confirm that Gemini's evaluation and suggestions address strictly Paragraph 2 and make zero reference to `SYNTHETIC_OUT_OF_SELECTION_MARKER_999` or Paragraph 1.

---

## Test 7 — Context-Aware / Enterprise-Grounded RAG via Google Drive (Folder or Single File: Prose & Script Review)

### Objective
Verify that linking **either a Google Drive Folder (ID or URL) or a Single Rulebook File (ID or URL)** in DocuMentor AI automatically distinguishes between folders and individual files, extracts `.md` / `.txt` / script files and Google Docs, uploads them to the **Gemini File API** as authoritative **RAG rulebooks**, and enforces those custom organizational rules during both **document prose proofreading (Part A)** and **script/code review (Part B)**.

> 💡 **Folder & Single-File Auto-Detection:**
> You can enter a **Folder URL** (`https://drive.google.com/drive/folders/...`), a **Folder ID**, a **Single File URL** (`https://docs.google.com/document/d/.../edit` or `https://drive.google.com/file/d/.../view`), or a **Single File ID**. Even when only a raw ID is entered, DocuMentor AI automatically inspects the Drive item metadata to determine whether the ID refers to a **Folder** or a **Single File**.

---

### Part A — Prose Proofreading Grounded in a Google Drive RAG Rulebook (Folder or File ID/URL)

#### 1. Prepare a Test RAG Rulebook in Google Drive
1. Open [Google Drive](https://drive.google.com/) and create a new folder named **`DocuMentor_RAG_Rules_Test`** (or simply create a standalone file).
2. Inside that folder, create a Google Doc (or upload a `.md` / `.txt` file) named **`corporate_style_guide.md`** containing the following custom organizational rules:
   ```markdown
   # Corporate Editorial & Terminology Rules (Mandatory)
   1. [Brand Name Rule]: Never abbreviate "Google Apps Script" as "GAS". Always write out the full name "Google Apps Script".
   2. [Forbidden Filler Words]: Never use the casual words "super", "basically", or "totally". Replace them with formal, objective phrasing.
   3. [Task Metric Format]: Always express durations by writing out "minutes" in full (never abbreviate as "min").
   ```
3. Copy either:
   - The **Folder URL** (`https://drive.google.com/drive/folders/1AbC...`) or **Folder ID** (`1AbC...`), **OR**
   - The **Single File URL** (`https://docs.google.com/document/d/1XyZ.../edit` or `https://drive.google.com/file/d/1XyZ.../view`) or **Single File ID** (`1XyZ...`) of `corporate_style_guide.md`.

#### 2. Prepare the Sample Prose Draft in Google Docs
1. Clear your active Google Docs tab and paste the following sample draft that intentionally violates all three rules in `corporate_style_guide.md`:
   ```text
   GAS is basically a super convenient platform for automating daily spreadsheets. With GAS, a task that previously took 30 min now takes only 5 min, and you totally do not need any complex server setup.
   ```

#### 3. Link the RAG Folder or Single File in the Sidebar (`UserProperties`) or `ScriptProperties`
1. In the DocuMentor AI sidebar, click the **`⚙️`** button (or the **`📚 RAG: OFF`** badge) on the Status Bar to open the Settings Drawer directly below the Status Bar.
2. Under **`📚 Google Drive RAG Rulebook Folder or File (ID / URL)`**, paste your Folder/File URL or ID and click **`Link`**.
3. **Expected Result:**
   - The box updates to **`📚 RAG Rule Source Linked (...)`** and immediately lists the detected rulebook file(s):
     `📄 1 RAG rulebook file(s) ready in Drive: • corporate_style_guide.md`
   - The Status Bar badge changes to purple: **`📚 RAG: 1 file(s)`** (`📚 RAG: 1件` in `JA`).
   - The live scope summary bar also updates to show **`📚 RAG: 1 file(s)`** (`📚 RAG: 1件` in `JA`).

#### 4. Run Prose Proofreading Grounded in Your Google Drive RAG Rules
1. Turn **`🎯 Selection Only`** **OFF** (`Full Tab`) and click **`🚀 Run Proofreading (Suggest & Coach)`**.
2. **Expected Result:**
   - **Step 1:** Displays a purple collapsible ledger: **`📚 Google Drive RAG Rulebook Files Loaded (1 file(s))`** listing `corporate_style_guide.md`. *(If the active Google Doc itself is located inside the same Drive folder, DocuMentor AI automatically excludes the active document from the RAG list.)*
   - **Step 2:** Displays the purple banner **`📚 Grounded in 1 Google Drive RAG Rulebook File(s): corporate_style_guide.md`**.
   - **Inline Suggestions & Coaching Comments:** Verify that Gemini flags `"GAS"` ➔ `"Google Apps Script"`, removes `"basically"` / `"super"` / `"totally"`, changes `"30 min"` / `"5 min"` ➔ `"30 minutes"` / `"5 minutes"`, and explicitly cites **`corporate_style_guide.md`** in the `Reason` and `Learning Point` fields!

---

### Part B — Script / Code Review Grounded in a Google Drive RAG Coding Standards File (Single File ID/URL or Folder ID/URL)

#### 1. Prepare a Custom Team Coding Standards Rulebook in Google Drive
1. In [Google Drive](https://drive.google.com/), create a Google Doc (or upload a `.md` / `.txt` file) named **`gas_coding_standards.md`** containing the following team-specific coding conventions:
   ```markdown
   # Team Google Apps Script Coding Standards (Mandatory)
   1. [Function Naming Prefix]: Every entry-point function MUST begin with the prefix `teamRun_` (for example, `teamRun_syncTasks`).
   2. [API Key Property Key Name]: Never hardcode API keys. Always retrieve the Gemini API key specifically via `PropertiesService.getScriptProperties().getProperty("TEAM_SHARED_GEMINI_KEY")`.
   3. [UrlFetchApp Options Rule]: Every `UrlFetchApp.fetch` options object MUST explicitly include both `contentType: "application/json"` and `muteHttpExceptions: true`.
   4. [Execution Audit Log]: Never use `Logger.log(...)`. Always use `console.info("[TEAM-AUDIT] ...")` for execution logging.
   ```
2. Copy the **Single File URL** (e.g., `https://docs.google.com/document/d/1XyZ.../edit` or `https://drive.google.com/file/d/1XyZ.../view`) or the raw **Single File ID** (`1XyZ...`) of `gas_coding_standards.md` (or the Folder ID/URL if stored in your RAG folder).

#### 2. Link the Single Coding Standards File (or Folder) in the Sidebar
1. Open the **`⚙️`** Settings Drawer in the sidebar, click **`Clear`** next to the previous RAG link, paste the **File ID** or **File URL** of **`gas_coding_standards.md`**, and click **`Link`**.
2. **Expected Result:**
   - DocuMentor AI automatically detects that the ID/URL is a single file and displays:
     `📄 1 RAG rulebook file(s) ready in Drive: • gas_coding_standards.md`
   - Both the Status Bar badge and the live scope summary bar display **`📚 RAG: 1 file(s)`** (`📚 RAG: 1件` in `JA`).

#### 3. Prepare the Sample Script in Google Docs
1. Clear your active Google Docs tab (click **`🧹 Reject`** and **`🗑️ Comments`** if needed) and paste the following Google Apps Script snippet, which intentionally violates all four rules in `gas_coding_standards.md`:
   ```javascript
   function syncTasks() {
     var apiKey = "AIzaSyD-TEMP_HARDCODED_KEY";
     var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" + apiKey;
     var payload = {
       contents: [{ parts: [{ text: "Generate a short daily standup checklist." }] }]
     };
     var res = UrlFetchApp.fetch(url, {
       method: "post",
       payload: JSON.stringify(payload)
     });
     Logger.log("Sync finished: " + res.getContentText());
   }
   ```

#### 4. Run RAG-Grounded Code Review
1. Open the **`💬 Custom Instructions & Initial Draft`** accordion and click the **`#RAG Rules Check`** chip (or enter: `Review this Google Apps Script code strictly against our Google Drive RAG coding standards and propose line-by-line code fixes.`).
2. Confirm Coaching Mode is **`✍️ Suggest & Coach`** and **`🎯 Selection Only`** is **OFF**, then click **`🚀 Run Proofreading (Suggest & Coach)`**.
3. **Expected Result:**
   - **Step 1 & Step 2:** Confirm **`📚 Grounded in 1 Google Drive RAG Rulebook File(s): gas_coding_standards.md`** is displayed.
   - **On the Google Docs Canvas:** Verify that Gemini proposes line-by-line `WriteMode.SUGGEST` code replacements that strictly enforce the team's custom RAG rules:
     - Renames `function syncTasks()` ➔ `function teamRun_syncTasks()`
     - Replaces the hardcoded key with `PropertiesService.getScriptProperties().getProperty("TEAM_SHARED_GEMINI_KEY")`
     - Adds `contentType: "application/json"` and `muteHttpExceptions: true` to the `UrlFetchApp.fetch` options
     - Replaces `Logger.log(...)` ➔ `console.info("[TEAM-AUDIT] ...")`
     - Explicitly cites **`gas_coding_standards.md`** in the attached coaching comment replies!

---

## Test 8 — Multi-Language Interactive Code Review & Quick Canvas Cleanup Toolbar

### Objective
Verify line-by-line interactive code review on source code pasted into Google Docs, and verify the **3-Column Quick Canvas Cleanup Toolbar** (`✅ Accept` | `🧹 Reject` | `🗑️ Comments`).

### Step-by-Step Procedure
1. **Prepare the Sample Code in Google Docs:**
   - Clear the active Google Docs tab and paste the following beginner Google Apps Script snippet (which intentionally contains a hardcoded API key, `.getValue()` on a multi-cell range `"A2:C50"`, unserialized `UrlFetchApp.fetch` JSON payload, `JSON.parse(response)` without `.getContentText()`, and legacy `var` declarations):
     ```javascript
     // Sample Beginner Google Apps Script: Summarize spreadsheet tasks with Gemini and send an email
     function sendDailyReport() {
       // 1. Set the Gemini API key and get the target spreadsheet tab
       var apiKey = "AIzaSyD-1234567890abcdef_HARDCODED_KEY";
       var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

       // 2. Read all task rows from the sheet (Rows 2 to 50, Columns A to C)
       var data = sheet.getRange("A2:C50").getValue();

       // 3. Stop execution if the retrieved task data is empty
       if (data == "") {
         Logger.log("No task data found.");
         return;
       }

       // 4. Call the Gemini API using UrlFetchApp to summarize today's tasks
       var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" + apiKey;
       var payload = { contents: [{ parts: [{ text: "Summarize these tasks: " + JSON.stringify(data) }] }] };
       var response = UrlFetchApp.fetch(url, { method: "post", payload: payload });
       var result = JSON.parse(response);

       // 5. Send the generated summary to the manager via email
       MailApp.sendEmail("manager@example.com", "Daily Task Summary", result.candidates[0].content.parts[0].text);
       Logger.log("Successfully sent the daily report!");
     }
     ```
2. **Enter the Code Review Instruction & Run:**
   - Open the **`💬 Custom Instructions & Initial Draft`** accordion and enter:
     ```text
     Review this Google Apps Script code for bugs, GAS API misuse, security risks, and modern V8 JavaScript best practices, proposing line-by-line code fixes.
     ```
   - Confirm Coaching Mode is **`✍️ Suggest & Coach`** and **`🎯 Selection Only`** is **OFF**, then click **`🚀 Run Proofreading (Suggest & Coach)`**.
3. **Expected Result:**
   - DocuMentor AI proposes line-by-line `WriteMode.SUGGEST` code replacements (fixing `.getValue()` ➔ `.getValues()`, `JSON.parse(response)` ➔ `JSON.parse(response.getContentText())`, hardcoded API key ➔ `PropertiesService`, and `var` ➔ `const`) without corrupting character offsets or indentation.
4. **Verify the 3-Column Quick Canvas Cleanup Toolbar:**
   - Click **`🗑️ Comments`** ➔ Confirm all standalone comments are deleted in one batch (`deleteComment`).
   - Click **`✅ Accept`** (or **`🧹 Reject`**) ➔ Confirm all pending inline code suggestions are accepted (or rejected) in one batch (`acceptSuggestion` / `rejectSuggestion`), leaving clean, runnable V8 code on the canvas.

---

**[⬅️ Back to Main README](README.md)** | **[👤 Individual Setup Guide](INSTALL_INDIVIDUAL.md)** | **[🏫 Organization Deployment Guide](INSTALL_ORGANIZATION.md)**

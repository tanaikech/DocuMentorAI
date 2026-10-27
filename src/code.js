/**
 * Application Name: DocuMentor AI
 * Description: AI-Powered Proofreading & Multimodal Suggestion Coach for Google Docs
 * Version: v1.0.3
 * Author: Kanshi Tanaike
 */

const APP_NAME = 'DocuMentor AI';
const APP_VERSION = 'v1.0.3';
const APP_AUTHOR = 'Kanshi Tanaike';
const APP_REPO_URL = 'https://github.com/tanaikech/DocuMentorAI';

const PROP_KEY_API = 'GEMINI_API_KEY';
const PROP_KEY_MODEL = 'GEMINI_SELECTED_MODEL';
const PROP_KEY_LANG = 'UI_LANGUAGE';
const PROP_KEY_SELECTION_ONLY = 'PROOFREAD_SELECTION_ONLY';
const PROP_KEY_HINT_ONLY = 'PROOFREAD_HINT_ONLY';
const PROP_KEY_INCLUDE_RESOLVED = 'INCLUDE_RESOLVED_HISTORY';

const DEFAULT_MODEL = 'gemini-3.8-flash';
const ALLOWED_MODELS = ['gemini-3.8-flash', 'gemini-4-argon'];
const DEFAULT_LANG = 'en';

/**
 * Populates the menu immediately when the add-on is installed from the Google Workspace Marketplace.
 *
 * @param {Object=} e Install event object.
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Adds the DocuMentor AI menu when the document is opened.
 * Supports both standalone / domain-internal Marketplace Editor Add-on deployments
 * (via createAddonMenu under Extensions > DocuMentor AI) and personal container-bound
 * scripts (via top-level createMenu('✦ DocuMentor AI')).
 *
 * @param {Object=} e Open event object.
 */
function onOpen(e) {
  const ui = DocumentApp.getUi();
  try {
    ui.createAddonMenu()
      .addItem('Open Dashboard', 'showSidebar')
      .addToUi();
  } catch (err) {}

  if (!e || e.authMode !== ScriptApp.AuthMode.NONE) {
    try {
      ui.createMenu('✦ DocuMentor AI')
        .addItem('Open Dashboard', 'showSidebar')
        .addToUi();
    } catch (err) {}
  }
}

/**
 * Displays the sidebar dashboard in Google Docs.
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('index')
    .setTitle(`${APP_NAME} (${APP_VERSION})`)
    .setWidth(380);
  DocumentApp.getUi().showSidebar(html);
}

/**
 * Resolves the effective Gemini API key and its storage source.
 * Priority:
 * 1. ScriptProperties (`GEMINI_API_KEY`) — used when an IT administrator or teacher
 *    pre-configures a shared organization/school key in Project Settings > Script Properties.
 *    When present, the key is locked as 'script' (admin-managed) so end users/students
 *    do not need to enter or manage an API key.
 * 2. UserProperties (`GEMINI_API_KEY`) — used for individual setup via the sidebar UI.
 *
 * @return {Object} { apiKey: string, hasApiKey: boolean, apiKeySource: 'script'|'user'|'none' }
 */
function getEffectiveApiKeyInfo_() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const scriptKey = scriptProps ? scriptProps.getProperty(PROP_KEY_API) : null;
    if (scriptKey && scriptKey.trim().length > 0) {
      return {
        apiKey: scriptKey.trim(),
        hasApiKey: true,
        apiKeySource: 'script'
      };
    }
  } catch (e) {}

  try {
    const userProps = PropertiesService.getUserProperties();
    const userKey = userProps ? userProps.getProperty(PROP_KEY_API) : null;
    if (userKey && userKey.trim().length > 0) {
      return {
        apiKey: userKey.trim(),
        hasApiKey: true,
        apiKeySource: 'user'
      };
    }
  } catch (e) {}

  return {
    apiKey: '',
    hasApiKey: false,
    apiKeySource: 'none'
  };
}

/**
 * Retrieves the initial configuration from ScriptProperties and UserProperties.
 * The raw API key is never returned to the client.
 *
 * @return {Object} Configuration state.
 */
function getInitialConfig() {
  const props = PropertiesService.getUserProperties();
  const keyInfo = getEffectiveApiKeyInfo_();
  const savedModel = props.getProperty(PROP_KEY_MODEL) || DEFAULT_MODEL;
  const savedLang = props.getProperty(PROP_KEY_LANG) || DEFAULT_LANG;
  const savedSelectionOnly = props.getProperty(PROP_KEY_SELECTION_ONLY) === 'true';
  const savedHintOnly = props.getProperty(PROP_KEY_HINT_ONLY) === 'true';
  const rawIncludeResolved = props.getProperty(PROP_KEY_INCLUDE_RESOLVED);
  const savedIncludeResolved = rawIncludeResolved === null ? true : rawIncludeResolved === 'true';

  return {
    appName: APP_NAME,
    appVersion: APP_VERSION,
    appAuthor: APP_AUTHOR,
    appRepoUrl: APP_REPO_URL,
    hasApiKey: keyInfo.hasApiKey,
    apiKeySource: keyInfo.apiKeySource,
    selectedModel: ALLOWED_MODELS.includes(savedModel) ? savedModel : DEFAULT_MODEL,
    lang: (savedLang === 'ja' || savedLang === 'en') ? savedLang : DEFAULT_LANG,
    selectionOnly: savedSelectionOnly,
    hintOnly: savedHintOnly,
    includeResolved: savedIncludeResolved
  };
}

/**
 * Saves the Gemini API key in UserProperties (when not locked by an admin ScriptProperty).
 *
 * @param {string} apiKey The Gemini API key string.
 * @return {Object} Status object.
 */
function saveApiKey(apiKey) {
  const keyInfo = getEffectiveApiKeyInfo_();
  if (keyInfo.apiKeySource === 'script') {
    return { success: true, hasApiKey: true, apiKeySource: 'script' };
  }
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error('Please enter a valid API key.');
  }
  PropertiesService.getUserProperties().setProperty(PROP_KEY_API, apiKey.trim());
  return { success: true, hasApiKey: true, apiKeySource: 'user' };
}

/**
 * Deletes the stored Gemini API key from UserProperties.
 * If an admin key is configured in ScriptProperties, that admin key remains active.
 *
 * @return {Object} Status object.
 */
function deleteApiKey() {
  PropertiesService.getUserProperties().deleteProperty(PROP_KEY_API);
  const keyInfo = getEffectiveApiKeyInfo_();
  return {
    success: true,
    hasApiKey: keyInfo.hasApiKey,
    apiKeySource: keyInfo.apiKeySource
  };
}

/**
 * Saves the selected Gemini model name in UserProperties.
 *
 * @param {string} modelName The model identifier.
 * @return {Object} Status object.
 */
function saveModelPreference(modelName) {
  const model = ALLOWED_MODELS.includes(modelName) ? modelName : DEFAULT_MODEL;
  PropertiesService.getUserProperties().setProperty(PROP_KEY_MODEL, model);
  return { success: true, selectedModel: model };
}

/**
 * Saves the selected language preference ('en' or 'ja') in UserProperties.
 *
 * @param {string} lang The language code.
 * @return {Object} Status object.
 */
function saveLanguagePreference(lang) {
  const validLang = (lang === 'ja' || lang === 'en') ? lang : DEFAULT_LANG;
  PropertiesService.getUserProperties().setProperty(PROP_KEY_LANG, validLang);
  return { success: true, lang: validLang };
}

/**
 * Saves the selection-only scope toggle preference in UserProperties.
 *
 * @param {boolean} selectionOnly Whether to proofread only the current selection.
 * @return {Object} Status object.
 */
function saveScopePreference(selectionOnly) {
  const isSel = Boolean(selectionOnly);
  PropertiesService.getUserProperties().setProperty(PROP_KEY_SELECTION_ONLY, String(isSel));
  return { success: true, selectionOnly: isSel };
}

/**
 * Saves the Hint-Only mode toggle preference in UserProperties.
 *
 * @param {boolean} hintOnly Whether to post coaching hints as comments without inline rewrites.
 * @return {Object} Status object.
 */
function saveHintOnlyPreference(hintOnly) {
  const isHint = Boolean(hintOnly);
  PropertiesService.getUserProperties().setProperty(PROP_KEY_HINT_ONLY, String(isHint));
  return { success: true, hintOnly: isHint };
}

/**
 * Saves the Include Resolved History toggle preference in UserProperties.
 *
 * @param {boolean} includeResolved Whether to include resolved suggestions and comments.
 * @return {Object} Status object.
 */
function saveIncludeResolvedPreference(includeResolved) {
  const isInc = Boolean(includeResolved);
  PropertiesService.getUserProperties().setProperty(PROP_KEY_INCLUDE_RESOLVED, String(isInc));
  return { success: true, includeResolved: isInc };
}

/**
 * Safely resolves the active tab metadata from a DocumentApp Document instance.
 *
 * @param {GoogleAppsScript.Document.Document} doc Active Document instance.
 * @return {Object} { tabId, tabTitle, activeTab }
 */
function getActiveTabInfo_(doc) {
  let tabId = null;
  let tabTitle = '';
  let activeTab = null;
  try {
    if (doc && typeof doc.getActiveTab === 'function') {
      activeTab = doc.getActiveTab();
      if (activeTab) {
        tabId = activeTab.getId() || null;
        tabTitle = activeTab.getTitle() || '';
      }
    }
  } catch (e) {
    // Fallback if getActiveTab is unavailable in older environments
  }
  return { tabId, tabTitle, activeTab };
}

/**
 * ============================================================================
 * STEP 1: Fetch Document Content, Active Tab / Selection, Tables, Figures, and Review History
 * ============================================================================
 */

/**
 * Fetches and parses the active tab of the Google Doc, optionally scoping editable
 * targets to the user's current selection while preserving full-manuscript context.
 *
 * @param {boolean=} selectionOnly Whether to restrict proofreading targets to the selected range.
 * @param {string=} lang Current UI language ('en' or 'ja').
 * @param {boolean=} allowFallbackToFullTab If true, falls back to full active tab when no selection exists.
 * @return {Object} Structured document data.
 */
function step1_fetchDocument(selectionOnly, lang, allowFallbackToFullTab) {
  const isJa = lang === 'ja';
  let isSelectionOnly = Boolean(selectionOnly);
  const doc = DocumentApp.getActiveDocument();
  const docId = doc.getId();
  const tabInfo = getActiveTabInfo_(doc);

  // Extract user selection descriptors when selectionOnly mode is enabled
  let selectionDescriptors = null;
  if (isSelectionOnly) {
    selectionDescriptors = extractSelectionDescriptors_(doc, tabInfo.activeTab);
    if (!selectionDescriptors || selectionDescriptors.length === 0) {
      if (allowFallbackToFullTab) {
        isSelectionOnly = false;
        selectionDescriptors = null;
      } else {
        throw new Error(isJa
          ? '選択範囲が見つかりません。ドキュメント内の文章、表、または図を選択してから実行するか、「選択範囲のみを推敲」スイッチをオフにしてください。'
          : 'No selection found in the document. Please select text, a table, or a figure in the document, or turn off the "Proofread Selection Only" toggle.'
        );
      }
    }
  }

  const docJson = fetchRawDocumentJson_(docId);
  return parseDocumentStructure_(docJson, {
    activeTabId: tabInfo.tabId,
    activeTabTitle: tabInfo.tabTitle,
    selectionOnly: isSelectionOnly,
    selectionDescriptors,
    isJa
  });
}

/**
 * Extracts structural descriptors of the user's current selection in DocumentApp
 * so that they can be accurately mapped to Docs API character indices and elements.
 *
 * @param {GoogleAppsScript.Document.Document} doc Active Document instance.
 * @param {Object=} activeTab Optional active tab object from getActiveTabInfo_.
 * @return {Array<Object>} List of selection descriptors.
 */
function extractSelectionDescriptors_(doc, activeTab) {
  const selection = doc.getSelection();
  if (!selection) return [];

  const rangeElements = selection.getRangeElements();
  if (!rangeElements || rangeElements.length === 0) return [];

  // Resolve active tab body for top-level index calculation
  let body = null;
  try {
    const tabObj = activeTab || (typeof doc.getActiveTab === 'function' ? doc.getActiveTab() : null);
    if (tabObj && typeof tabObj.asDocumentTab === 'function') {
      body = tabObj.asDocumentTab().getBody();
    }
  } catch (e) {}
  if (!body) {
    body = doc.getBody();
  }

  // Pre-build ordered list of tables in the active tab body to match TABLE_1, TABLE_2...
  const allTablesInBody = [];
  const numChildren = body.getNumChildren();
  for (let i = 0; i < numChildren; i++) {
    const child = body.getChild(i);
    if (child.getType() === DocumentApp.ElementType.TABLE) {
      allTablesInBody.push(child.asTable());
    }
  }

  function findTableSequenceNumber(tblElement) {
    for (let i = 0; i < allTablesInBody.length; i++) {
      // Compare by top-level child index in body
      try {
        if (body.getChildIndex(allTablesInBody[i]) === body.getChildIndex(tblElement)) {
          return i + 1;
        }
      } catch (e) {}
    }
    return -1;
  }

  const descriptors = [];

  rangeElements.forEach(re => {
    const el = re.getElement();
    const elType = el.getType();
    const isPartial = re.isPartial();

    // Check if element is an inline image or drawing/chart
    if (
      elType === DocumentApp.ElementType.INLINE_IMAGE ||
      elType === DocumentApp.ElementType.INLINE_DRAWING
    ) {
      let p = el.getParent();
      while (p && p.getType() !== DocumentApp.ElementType.PARAGRAPH && p.getType() !== DocumentApp.ElementType.LIST_ITEM) {
        p = p.getParent();
      }
      let bodyChildIdx = -1;
      try {
        if (p && p.getParent() && p.getParent().getType() === DocumentApp.ElementType.BODY_SECTION) {
          bodyChildIdx = body.getChildIndex(p);
        }
      } catch (e) {}

      descriptors.push({
        kind: 'VISUAL',
        bodyChildIndex: bodyChildIdx
      });
      return;
    }

    // Check if element is a Table directly
    if (elType === DocumentApp.ElementType.TABLE) {
      const tblNum = findTableSequenceNumber(el.asTable());
      descriptors.push({
        kind: 'TABLE',
        tableNumber: tblNum
      });
      return;
    }

    // Walk up ancestors to check if inside a Table Cell or top-level Paragraph
    let curr = el;
    let cellEl = null;
    let rowEl = null;
    let tableEl = null;
    let paraEl = null;

    while (curr) {
      const t = curr.getType();
      if (!paraEl && (t === DocumentApp.ElementType.PARAGRAPH || t === DocumentApp.ElementType.LIST_ITEM)) {
        paraEl = curr;
      }
      if (!cellEl && t === DocumentApp.ElementType.TABLE_CELL) {
        cellEl = curr.asTableCell();
      }
      if (!rowEl && t === DocumentApp.ElementType.TABLE_ROW) {
        rowEl = curr.asTableRow();
      }
      if (!tableEl && t === DocumentApp.ElementType.TABLE) {
        tableEl = curr.asTable();
      }
      if (t === DocumentApp.ElementType.BODY_SECTION) break;
      curr = curr.getParent();
    }

    if (tableEl && rowEl && cellEl) {
      const tblNum = findTableSequenceNumber(tableEl);
      let rowIndex = -1;
      let colIndex = -1;
      try {
        rowIndex = tableEl.getChildIndex(rowEl);
        colIndex = rowEl.getChildIndex(cellEl);
      } catch (e) {}

      let selectedSubText = '';
      if (isPartial && typeof el.editAsText === 'function') {
        const fullTxt = el.editAsText().getText();
        selectedSubText = fullTxt.substring(re.getStartOffset(), re.getEndOffsetInclusive() + 1);
      } else if (typeof el.getText === 'function') {
        selectedSubText = el.getText();
      }

      descriptors.push({
        kind: 'TABLE_CELL',
        tableNumber: tblNum,
        rowIndex: rowIndex,
        colIndex: colIndex,
        isPartial: isPartial,
        selectedText: selectedSubText
      });
      return;
    }

    // Top-level paragraph or list item in body
    if (paraEl) {
      let bodyChildIdx = -1;
      try {
        bodyChildIdx = body.getChildIndex(paraEl);
      } catch (e) {}

      let paraTextOffsetStart = 0;
      let paraTextOffsetEnd = null;
      let selectedSubText = '';

      if (isPartial && typeof el.editAsText === 'function') {
        const elText = el.editAsText().getText();
        const sOff = re.getStartOffset();
        const eOff = re.getEndOffsetInclusive() + 1;
        selectedSubText = elText.substring(sOff, eOff);

        // Calculate offset within paragraph if el is a child TEXT element of paraEl
        let prefixLen = 0;
        if (paraEl !== el && typeof paraEl.getNumChildren === 'function') {
          const n = paraEl.getNumChildren();
          for (let c = 0; c < n; c++) {
            const ch = paraEl.getChild(c);
            if (ch.getType() === DocumentApp.ElementType.TEXT && ch.getText() === elText) {
              // Matched text child
              break;
            }
            if (typeof ch.getText === 'function') {
              prefixLen += ch.getText().length;
            }
          }
        }
        paraTextOffsetStart = prefixLen + sOff;
        paraTextOffsetEnd = prefixLen + eOff;
      } else if (typeof paraEl.getText === 'function') {
        selectedSubText = paraEl.getText();
      }

      descriptors.push({
        kind: 'BODY_PARAGRAPH',
        bodyChildIndex: bodyChildIdx,
        isPartial: isPartial,
        offsetStart: paraTextOffsetStart,
        offsetEnd: paraTextOffsetEnd,
        selectedText: selectedSubText
      });
    }
  });

  return descriptors;
}

/**
 * Fetches the raw document JSON with SUGGESTIONS_INLINE and COMMENTS_VIEW_MODE_INCLUDED.
 *
 * @param {string} docId The Google Document ID.
 * @return {Object} Parsed JSON response from documents.get.
 */
function fetchRawDocumentJson_(docId) {
  const token = ScriptApp.getOAuthToken();
  const baseUrl = `https://docs.googleapis.com/v1/documents/${docId}?includeTabsContent=true&suggestionsViewMode=SUGGESTIONS_INLINE`;
  const urlWithComments = `${baseUrl}&commentsViewMode=COMMENTS_VIEW_MODE_INCLUDED`;

  const fetchOptions = {
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  };

  let response = UrlFetchApp.fetch(urlWithComments, fetchOptions);
  if (response.getResponseCode() !== 200) {
    response = UrlFetchApp.fetch(baseUrl, fetchOptions);
  }

  if (response.getResponseCode() !== 200) {
    throw new Error(`Google Docs API Error (${response.getResponseCode()}): ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

/**
 * Recursively flattens all tabs (including childTabs) from a document resource.
 *
 * @param {Array<Object>} tabs Top-level tabs array from documents.get.
 * @return {Array<Object>} Flattened list of tab objects.
 */
function flattenDocumentTabs_(tabs) {
  const result = [];
  function walk(tabList) {
    if (!Array.isArray(tabList)) return;
    tabList.forEach(t => {
      result.push(t);
      if (Array.isArray(t.childTabs) && t.childTabs.length > 0) {
        walk(t.childTabs);
      }
    });
  }
  walk(tabs);
  return result;
}

/**
 * Resolves the target tab object from the document JSON matching activeTabId (or defaults to first tab).
 *
 * @param {Object} docJson Raw document resource from documents.get.
 * @param {string=} preferredTabId Active tab ID from DocumentApp.getActiveTab().
 * @return {Object} Object containing { tabId, tabTitle, docTab }.
 */
function resolveTargetDocumentTab_(docJson, preferredTabId) {
  const allTabs = flattenDocumentTabs_(docJson.tabs || []);
  if (allTabs.length === 0) {
    return {
      tabId: '',
      tabTitle: docJson.title || '',
      docTab: docJson
    };
  }

  let matchedTab = null;
  if (preferredTabId) {
    matchedTab = allTabs.find(t => t.tabProperties && t.tabProperties.tabId === preferredTabId);
  }
  if (!matchedTab) {
    matchedTab = allTabs[0];
  }

  const props = matchedTab.tabProperties || {};
  return {
    tabId: props.tabId || '',
    tabTitle: props.title || docJson.title || '',
    docTab: matchedTab.documentTab || docJson
  };
}

/**
 * Resolves the effective tab list and comment anchor mapping for a target tab ID.
 *
 * @param {Object} docJson Raw document resource from documents.get.
 * @param {string=} targetTabId Optional tabId to scope extraction.
 * @return {Object} { allTabs, effectiveTabs, tabAnchorMap, hasTabAnchorMapping }
 */
function getEffectiveTabsAndAnchors_(docJson, targetTabId) {
  const allTabs = flattenDocumentTabs_(docJson.tabs || []);
  const tabAnchorMap = new Map();
  let hasTabAnchorMapping = false;
  let effectiveTabs = [];

  if (allTabs.length > 0) {
    const matchedTabs = targetTabId
      ? allTabs.filter(t => t.tabProperties && t.tabProperties.tabId === targetTabId)
      : allTabs;
    effectiveTabs = matchedTabs.length > 0 ? matchedTabs : [allTabs[0]];

    effectiveTabs.forEach(t => {
      if (t.documentTab && t.documentTab.commentAnchors) {
        hasTabAnchorMapping = true;
        const anchors = Array.isArray(t.documentTab.commentAnchors)
          ? t.documentTab.commentAnchors
          : Object.values(t.documentTab.commentAnchors);
        anchors.forEach(a => {
          if (a && a.anchorId) {
            tabAnchorMap.set(a.anchorId, a.ranges || []);
          }
        });
      }
    });
  }

  return { allTabs, effectiveTabs, tabAnchorMap, hasTabAnchorMapping };
}

/**
 * Collects active inline suggestion IDs from the target tab (or whole document)
 * and active (non-deleted, non-resolved) comment thread IDs.
 *
 * @param {Object} docJson Raw document resource from documents.get.
 * @param {string=} targetTabId Optional tabId to scope collection to the active tab.
 * @return {Object} Lists of active suggestionIds, aiCommentIds, and allCommentIds.
 */
function collectAllSuggestionAndCommentIds_(docJson, targetTabId) {
  const suggestionIdSet = new Set();
  const aiCommentIdSet = new Set();
  const allCommentIdSet = new Set();

  const { allTabs, effectiveTabs, tabAnchorMap, hasTabAnchorMapping } = getEffectiveTabsAndAnchors_(docJson, targetTabId);

  const collectFromCommentsArray = (container, ignoreTabAnchorFilter) => {
    if (!container || typeof container !== 'object') return;
    const entries = Array.isArray(container)
      ? container.map((item, idx) => [String(idx), item])
      : Object.entries(container);
    entries.forEach(([entryKey, c]) => {
      if (!c || typeof c !== 'object') return;
      const commentId = c.commentId || (!Array.isArray(container) ? entryKey : '');
      if (!commentId || c.deleted || c.status === 'RESOLVED' || c.resolved === true) return;
      if (c.headPost && c.headPost.deleted) return;
      if (!ignoreTabAnchorFilter && hasTabAnchorMapping && c.anchorId && tabAnchorMap.size > 0) {
        if (!tabAnchorMap.has(c.anchorId)) return;
      }
      allCommentIdSet.add(commentId);
      const headText = (c.headPost && c.headPost.content)
        ? (typeof c.headPost.content === 'string' ? c.headPost.content : (c.headPost.content.text || ''))
        : '';
      if (headText.includes('DocuMentor AI') || headText.includes('AI推敲コーチ')) {
        aiCommentIdSet.add(commentId);
      }
    });
  };

  collectFromCommentsArray(docJson.comments, false);

  function scanElements(contentArray) {
    if (!Array.isArray(contentArray)) return;
    contentArray.forEach(structuralEl => {
      if (structuralEl.paragraph) {
        const p = structuralEl.paragraph;
        if (p.suggestedParagraphStyleChanges) {
          Object.keys(p.suggestedParagraphStyleChanges).forEach(id => suggestionIdSet.add(id));
        }
        if (p.suggestedBulletChanges) {
          Object.keys(p.suggestedBulletChanges).forEach(id => suggestionIdSet.add(id));
        }
        (p.elements || []).forEach(el => {
          if (el.textRun) {
            (el.textRun.suggestedInsertionIds || []).forEach(id => suggestionIdSet.add(id));
            (el.textRun.suggestedDeletionIds || []).forEach(id => suggestionIdSet.add(id));
            if (el.textRun.suggestedTextStyleChanges) {
              Object.keys(el.textRun.suggestedTextStyleChanges).forEach(id => suggestionIdSet.add(id));
            }
          }
          if (el.inlineObjectElement) {
            (el.inlineObjectElement.suggestedInsertionIds || []).forEach(id => suggestionIdSet.add(id));
            (el.inlineObjectElement.suggestedDeletionIds || []).forEach(id => suggestionIdSet.add(id));
            if (el.inlineObjectElement.suggestedInlineObjectPropertiesChanges) {
              Object.keys(el.inlineObjectElement.suggestedInlineObjectPropertiesChanges).forEach(id => suggestionIdSet.add(id));
            }
          }
        });
      } else if (structuralEl.table) {
        (structuralEl.table.suggestedInsertionIds || []).forEach(id => suggestionIdSet.add(id));
        (structuralEl.table.suggestedDeletionIds || []).forEach(id => suggestionIdSet.add(id));
        (structuralEl.table.tableRows || []).forEach(row => {
          (row.suggestedInsertionIds || []).forEach(id => suggestionIdSet.add(id));
          (row.suggestedDeletionIds || []).forEach(id => suggestionIdSet.add(id));
          (row.tableCells || []).forEach(cell => {
            (cell.suggestedInsertionIds || []).forEach(id => suggestionIdSet.add(id));
            (cell.suggestedDeletionIds || []).forEach(id => suggestionIdSet.add(id));
            scanElements(cell.content);
          });
        });
      }
    });
  }

  if (allTabs.length > 0) {
    effectiveTabs.forEach(t => {
      if (t.documentTab) {
        collectFromCommentsArray(t.documentTab.comments, true);
        if (t.documentTab.body && t.documentTab.body.content) {
          scanElements(t.documentTab.body.content);
        }
      }
    });
  } else if (docJson.body && docJson.body.content) {
    scanElements(docJson.body.content);
  }

  return {
    suggestionIds: Array.from(suggestionIdSet),
    aiCommentIds: Array.from(aiCommentIdSet),
    allCommentIds: Array.from(allCommentIdSet)
  };
}

/**
 * Extracts both active (unresolved) comment/suggestion threads and resolved
 * (RESOLVED / ACCEPTED / REJECTED) review history from the document or target tab.
 *
 * @param {Object} docJson Raw document resource from documents.get.
 * @param {string=} targetTabId Optional tabId to scope extraction.
 * @param {Array<string>=} activeSuggestionIds Active inline suggestion IDs currently in body.content.
 * @return {Object} { activeComments: Array<Object>, resolvedReviews: Array<Object> }
 */
function extractCommentAndSuggestionThreads_(docJson, targetTabId, activeSuggestionIds) {
  const activeCommentsMap = new Map();
  const resolvedReviewsMap = new Map();
  const activeSugIdSet = new Set(Array.isArray(activeSuggestionIds) ? activeSuggestionIds : []);

  const { allTabs, effectiveTabs, tabAnchorMap, hasTabAnchorMapping } = getEffectiveTabsAndAnchors_(docJson, targetTabId);

  const extractPostText = post => {
    if (!post) return '';
    if (typeof post.content === 'string') return post.content.trim();
    if (post.content && typeof post.content.text === 'string') return post.content.text.trim();
    if (typeof post.text === 'string') return post.text.trim();
    return '';
  };

  const processCommentsContainer = (container, isSuggestionThreadContainer, ignoreTabAnchorFilter) => {
    if (!container || typeof container !== 'object') return;
    const entries = Array.isArray(container)
      ? container.map((item, idx) => [String(idx), item])
      : Object.entries(container);

    entries.forEach(([entryKey, c]) => {
      if (!c || typeof c !== 'object') return;
      const commentId = c.commentId || c.suggestionId || c.id || (!Array.isArray(container) ? entryKey : '');
      if (!commentId || c.deleted) return;
      if (c.headPost && c.headPost.deleted) return;

      if (
        !isSuggestionThreadContainer &&
        !ignoreTabAnchorFilter &&
        hasTabAnchorMapping &&
        c.anchorId &&
        tabAnchorMap.size > 0 &&
        !tabAnchorMap.has(c.anchorId)
      ) {
        return;
      }

      const linkedSuggestionId = isSuggestionThreadContainer
        ? (c.suggestionId || commentId)
        : (c.suggestionId || '');

      let headContent = '';
      let headAuthor = '';
      if (c.headPost && !c.headPost.deleted) {
        headContent = extractPostText(c.headPost);
        if (c.headPost.author && c.headPost.author.displayName) {
          headAuthor = c.headPost.author.displayName;
        }
      } else {
        headContent = extractPostText(c);
        if (c.author && c.author.displayName) {
          headAuthor = c.author.displayName;
        }
      }

      const rawReplies = Array.isArray(c.replies)
        ? c.replies
        : (Array.isArray(c.posts)
            ? c.posts
            : (Array.isArray(c.commentHistory)
                ? c.commentHistory
                : (Array.isArray(c.suggestionHistory) ? c.suggestionHistory : [])));
      const replies = [];
      let detectedResolutionAction = '';

      rawReplies.forEach(r => {
        if (!r || r.deleted) return;
        const rAction = r.suggestionAction || r.commentAction || r.action || '';
        if (rAction === 'ACCEPT' || rAction === 'ACCEPTED') {
          detectedResolutionAction = 'ACCEPTED';
        } else if (rAction === 'REJECT' || rAction === 'REJECTED') {
          detectedResolutionAction = 'REJECTED';
        } else if (rAction === 'RESOLVE' || rAction === 'RESOLVED') {
          if (!detectedResolutionAction) detectedResolutionAction = 'RESOLVED';
        } else if (rAction === 'REOPEN' || rAction === 'REOPENED') {
          detectedResolutionAction = '';
        }

        const rContent = extractPostText(r);
        if (!rContent) return;
        const rAuthor = (r.author && r.author.displayName) ? r.author.displayName : '';
        if (!headAuthor && rAuthor) {
          headAuthor = rAuthor;
        }
        replies.push({
          author: rAuthor,
          content: rContent,
          action: rAction
        });
      });

      const quotedText = c.plainTextQuote
        ? String(c.plainTextQuote).trim()
        : (c.anchorText
            ? String(c.anchorText).trim()
            : ((c.quotedFileContent && c.quotedFileContent.value)
                ? String(c.quotedFileContent.value).trim()
                : (c.summaryText ? String(c.summaryText).trim() : '')));

      const summaryText = c.summaryText ? String(c.summaryText).trim() : '';

      // Determine whether this thread is resolved (hidden from active canvas) or active
      let isResolved = false;
      let resolutionState = 'OPEN';
      const rawStatus = String(c.status || '').toUpperCase();

      if (rawStatus === 'RESOLVED' || rawStatus === 'ACCEPTED' || rawStatus === 'REJECTED' || c.resolved === true) {
        isResolved = true;
        resolutionState = detectedResolutionAction ||
          (rawStatus === 'ACCEPTED' || rawStatus === 'REJECTED'
            ? rawStatus
            : (isSuggestionThreadContainer ? 'RESOLVED_SUGGESTION' : 'RESOLVED'));
      } else if (isSuggestionThreadContainer && linkedSuggestionId && !activeSugIdSet.has(linkedSuggestionId)) {
        // Suggestion thread is no longer present in active inline suggestions in body.content (already accepted or rejected)
        isResolved = true;
        resolutionState = detectedResolutionAction || 'RESOLVED_SUGGESTION';
      } else if (detectedResolutionAction === 'ACCEPTED' || detectedResolutionAction === 'REJECTED' || detectedResolutionAction === 'RESOLVED') {
        isResolved = true;
        resolutionState = detectedResolutionAction;
      }

      const threadType = isSuggestionThreadContainer || Boolean(linkedSuggestionId) ? 'SUGGESTION' : 'COMMENT';
      const combinedText = [headContent || summaryText]
        .concat(replies.map(r => (r.author ? `${r.author}: ${r.content}` : r.content)))
        .filter(Boolean)
        .join(' | ');

      if (isResolved) {
        // Include resolved entry if it contains any comment text, reply, or suggestion summary
        if (!headContent && !quotedText && !summaryText && replies.length === 0) return;
        resolvedReviewsMap.set(commentId, {
          commentId: commentId,
          anchorId: c.anchorId || '',
          suggestionId: linkedSuggestionId,
          threadType: threadType,
          type: threadType,
          resolutionState: resolutionState,
          status: resolutionState,
          author: headAuthor,
          content: headContent || summaryText,
          text: combinedText || summaryText || quotedText,
          quotedText: quotedText,
          anchorText: quotedText,
          summaryText: summaryText,
          replies: replies
        });
      } else {
        // Active thread
        if (isSuggestionThreadContainer && replies.length === 0 && !headContent) return;
        if (!headContent && replies.length === 0) return;
        activeCommentsMap.set(commentId, {
          commentId: commentId,
          anchorId: c.anchorId || '',
          suggestionId: linkedSuggestionId,
          author: headAuthor,
          content: headContent,
          quotedText: quotedText,
          replies: replies
        });
      }
    });
  };

  processCommentsContainer(docJson.comments, false, false);
  processCommentsContainer(docJson.suggestions, true, true);

  if (allTabs.length > 0) {
    effectiveTabs.forEach(t => {
      if (t.documentTab) {
        if (t.documentTab.comments) {
          processCommentsContainer(t.documentTab.comments, false, true);
        }
        if (t.documentTab.suggestions) {
          processCommentsContainer(t.documentTab.suggestions, true, true);
        }
      }
    });
  }

  return {
    activeComments: Array.from(activeCommentsMap.values()),
    resolvedReviews: Array.from(resolvedReviewsMap.values())
  };
}

/**
 * Extracts all active (unresolved and non-deleted) comments and their replies
 * from the document or target tab.
 *
 * @param {Object} docJson Raw document resource from documents.get.
 * @param {string=} targetTabId Optional tabId to scope comment extraction.
 * @param {Array<string>=} activeSuggestionIds Optional active inline suggestion IDs.
 * @return {Array<Object>} List of structured active comment threads.
 */
function extractActiveComments_(docJson, targetTabId, activeSuggestionIds) {
  return extractCommentAndSuggestionThreads_(docJson, targetTabId, activeSuggestionIds).activeComments;
}

/**
 * Parses the active tab of the document resource to extract full-tab context,
 * structured tables, inline figures/charts, editable text blocks, and existing inline suggestions.
 * When `options.selectionOnly` is true, filters editable targets to the user's selected elements
 * while keeping the full tab's `annotatedText` for holistic understanding.
 *
 * @param {Object} docJson The document resource returned by documents.get.
 * @param {Object=} options Parsing options (activeTabId, selectionOnly, selectionDescriptors, isJa).
 * @return {Object} Structured document data.
 */
function parseDocumentStructure_(docJson, options) {
  const opts = options || {};
  const resolvedTab = resolveTargetDocumentTab_(docJson, opts.activeTabId);
  const activeTabId = resolvedTab.tabId;
  const activeTabTitle = opts.activeTabTitle || resolvedTab.tabTitle;
  const docTab = resolvedTab.docTab;

  const bodyContent = (docTab.body && docTab.body.content) ? docTab.body.content : [];
  const inlineObjectsMap = docTab.inlineObjects || docJson.inlineObjects || {};
  const positionedObjectsMap = docTab.positionedObjects || docJson.positionedObjects || {};

  let plainText = '';
  let previewAcceptedText = '';
  let annotatedText = '';

  const existingSuggestionsMap = {};
  const allEditableBlocks = [];
  const allTablesList = [];
  const allVisualElements = [];

  function processParagraph(paragraph, meta) {
    let paraPlain = '';
    let paraPreview = '';
    let paraAnnotated = '';
    let currentBlock = null;
    const paraBlocks = [];
    const paraVisuals = [];

    const pElements = paragraph.elements || [];
    const paraStartIndex = (pElements.length > 0 && pElements[0].startIndex) ? pElements[0].startIndex : 1;
    const rawParaEndIndex = (pElements.length > 0 && pElements[pElements.length - 1].endIndex)
      ? pElements[pElements.length - 1].endIndex
      : paraStartIndex + 1;
    const paraEndIndex = Math.max(paraStartIndex + 1, rawParaEndIndex - 1);

    if (Array.isArray(paragraph.positionedObjectIds)) {
      paragraph.positionedObjectIds.forEach(posId => {
        const posObj = positionedObjectsMap[posId];
        const emb = posObj && posObj.positionedObjectProperties && posObj.positionedObjectProperties.embeddedObject;
        if (emb) {
          const figIndex = allVisualElements.length + 1;
          const isChart = Boolean(emb.linkedContentReference && emb.linkedContentReference.sheetsChartReference);
          const contentUri = (emb.imageProperties && emb.imageProperties.contentUri) ? emb.imageProperties.contentUri : '';
          const pStart = paraStartIndex;
          const vId = `VISUAL_${figIndex}`;
          const vItem = {
            targetId: vId,
            objectId: posId,
            type: isChart ? 'Chart' : 'Figure/Image',
            title: emb.title || `${isChart ? 'Chart' : 'Figure'} #${figIndex}`,
            description: emb.description || '',
            contentUri: contentUri,
            startIndex: pStart,
            endIndex: pStart + 1,
            paraStartIndex: paraStartIndex,
            paraEndIndex: paraEndIndex,
            bodyChildIndex: meta.bodyChildIndex,
            tableNumber: meta.tableNumber || null
          };
          allVisualElements.push(vItem);
          paraVisuals.push(vItem);
          paraAnnotated += `\n[${vId} (${vItem.type}): Title="${emb.title || ''}", Description="${emb.description || ''}"]\n`;
        }
      });
    }

    pElements.forEach(el => {
      if (el.inlineObjectElement && el.inlineObjectElement.inlineObjectId) {
        if (currentBlock) {
          allEditableBlocks.push(currentBlock);
          paraBlocks.push(currentBlock);
          currentBlock = null;
        }
        const objId = el.inlineObjectElement.inlineObjectId;
        const inlineObj = inlineObjectsMap[objId];
        const emb = inlineObj && inlineObj.inlineObjectProperties && inlineObj.inlineObjectProperties.embeddedObject;
        if (emb) {
          const figIndex = allVisualElements.length + 1;
          const isChart = Boolean(emb.linkedContentReference && emb.linkedContentReference.sheetsChartReference);
          const contentUri = (emb.imageProperties && emb.imageProperties.contentUri) ? emb.imageProperties.contentUri : '';
          const vId = `VISUAL_${figIndex}`;
          const vItem = {
            targetId: vId,
            objectId: objId,
            type: isChart ? 'Chart' : 'Figure/Image',
            title: emb.title || `${isChart ? 'Chart' : 'Figure'} #${figIndex}`,
            description: emb.description || '',
            contentUri: contentUri,
            startIndex: el.startIndex,
            endIndex: el.endIndex,
            paraStartIndex: paraStartIndex,
            paraEndIndex: paraEndIndex,
            bodyChildIndex: meta.bodyChildIndex,
            tableNumber: meta.tableNumber || null
          };
          allVisualElements.push(vItem);
          paraVisuals.push(vItem);
          const marker = `[${vId} (${vItem.type}): Title="${emb.title || ''}", Description="${emb.description || ''}"]`;
          paraAnnotated += marker;
          paraPlain += marker;
          paraPreview += marker;
        }
        return;
      }

      if (!el.textRun || typeof el.textRun.content !== 'string') return;

      const text = el.textRun.content;
      const startIndex = el.startIndex;
      const endIndex = el.endIndex;
      const insIds = el.textRun.suggestedInsertionIds || [];
      const delIds = el.textRun.suggestedDeletionIds || [];

      if (insIds.length > 0) {
        if (currentBlock) {
          allEditableBlocks.push(currentBlock);
          paraBlocks.push(currentBlock);
          currentBlock = null;
        }
        const sugId = insIds[0];
        if (!existingSuggestionsMap[sugId]) {
          existingSuggestionsMap[sugId] = { id: sugId, deletedText: '', insertedText: '', startIndex: startIndex, endIndex: endIndex };
        }
        existingSuggestionsMap[sugId].insertedText += text;
        existingSuggestionsMap[sugId].endIndex = endIndex;

        paraPreview += text;
        paraAnnotated += `[Existing Suggestion (Insert ID:${sugId}): "${text.replace(/\n/g, '')}"]`;

      } else if (delIds.length > 0) {
        if (currentBlock) {
          allEditableBlocks.push(currentBlock);
          paraBlocks.push(currentBlock);
          currentBlock = null;
        }
        const sugId = delIds[0];
        if (!existingSuggestionsMap[sugId]) {
          existingSuggestionsMap[sugId] = { id: sugId, deletedText: '', insertedText: '', startIndex: startIndex, endIndex: endIndex };
        }
        existingSuggestionsMap[sugId].deletedText += text;
        existingSuggestionsMap[sugId].endIndex = endIndex;

        paraPlain += text;
        paraAnnotated += `[Existing Suggestion (Delete ID:${sugId}): "${text.replace(/\n/g, '')}"]`;

      } else {
        paraPlain += text;
        paraPreview += text;
        paraAnnotated += text;

        const hasTrailingNewline = text.endsWith('\n');
        const cleanRunText = hasTrailingNewline ? text.slice(0, -1) : text;
        const cleanEndIndex = hasTrailingNewline ? endIndex - 1 : endIndex;

        if (cleanRunText.length > 0) {
          if (currentBlock && currentBlock.endIndex === startIndex) {
            currentBlock.text += cleanRunText;
            currentBlock.endIndex = cleanEndIndex;
          } else {
            if (currentBlock) {
              allEditableBlocks.push(currentBlock);
              paraBlocks.push(currentBlock);
            }
            currentBlock = {
              text: cleanRunText,
              startIndex: startIndex,
              endIndex: cleanEndIndex,
              source: meta.isInsideTable ? 'table' : 'body',
              bodyChildIndex: meta.bodyChildIndex,
              tableNumber: meta.tableNumber || null,
              rowIndex: meta.rowIndex !== undefined ? meta.rowIndex : null,
              colIndex: meta.colIndex !== undefined ? meta.colIndex : null
            };
          }
        }
        if (hasTrailingNewline && currentBlock) {
          allEditableBlocks.push(currentBlock);
          paraBlocks.push(currentBlock);
          currentBlock = null;
        }
      }
    });

    if (currentBlock) {
      allEditableBlocks.push(currentBlock);
      paraBlocks.push(currentBlock);
    }

    return {
      plain: paraPlain,
      preview: paraPreview,
      annotated: paraAnnotated,
      blocks: paraBlocks,
      visuals: paraVisuals
    };
  }

  // Note: In Google Docs API body.content, index 0 is typically a sectionBreak,
  // whereas in DocumentApp body.getChildIndex(child), index 0 is the first paragraph/table.
  let docAppChildCounter = 0;

  bodyContent.forEach(structuralEl => {
    if (structuralEl.paragraph) {
      const currentBodyIdx = docAppChildCounter++;
      const pRes = processParagraph(structuralEl.paragraph, {
        isInsideTable: false,
        bodyChildIndex: currentBodyIdx
      });
      plainText += pRes.plain;
      previewAcceptedText += pRes.preview;
      annotatedText += pRes.annotated;

    } else if (structuralEl.table) {
      const currentBodyIdx = docAppChildCounter++;
      const tblIndex = allTablesList.length + 1;
      const tblId = `TABLE_${tblIndex}`;
      const rows = structuralEl.table.tableRows || [];
      const markdownRows = [];
      let firstCellStartIndex = structuralEl.startIndex + 1;
      let firstCellEndIndex = structuralEl.startIndex + 2;
      let foundFirstCellRange = false;

      rows.forEach((row, rIdx) => {
        const cells = row.tableCells || [];
        const rowCellsAnnotated = [];

        cells.forEach((cell, cIdx) => {
          const cellAnnotatedParts = [];
          (cell.content || []).forEach(cellStructuralEl => {
            if (cellStructuralEl.paragraph) {
              if (!foundFirstCellRange && cellStructuralEl.paragraph.elements && cellStructuralEl.paragraph.elements.length > 0) {
                const firstEl = cellStructuralEl.paragraph.elements[0];
                firstCellStartIndex = firstEl.startIndex;
                firstCellEndIndex = Math.max(firstEl.startIndex + 1, firstEl.endIndex - 1);
                foundFirstCellRange = true;
              }
              const cRes = processParagraph(cellStructuralEl.paragraph, {
                isInsideTable: true,
                bodyChildIndex: currentBodyIdx,
                tableNumber: tblIndex,
                rowIndex: rIdx,
                colIndex: cIdx
              });
              plainText += cRes.plain;
              previewAcceptedText += cRes.preview;
              cellAnnotatedParts.push(cRes.annotated.replace(/\n+/g, ' ').trim());
            }
          });
          rowCellsAnnotated.push(cellAnnotatedParts.join(' '));
        });

        markdownRows.push('| ' + rowCellsAnnotated.join(' | ') + ' |');
        if (rIdx === 0 && rowCellsAnnotated.length > 0) {
          markdownRows.push('| ' + rowCellsAnnotated.map(() => '---').join(' | ') + ' |');
        }
      });

      const tableMarkdown = `\n[${tblId} (${rows.length} rows)]\n` + markdownRows.join('\n') + '\n\n';
      annotatedText += tableMarkdown;
      previewAcceptedText += tableMarkdown;

      allTablesList.push({
        targetId: tblId,
        tableNumber: tblIndex,
        bodyChildIndex: currentBodyIdx,
        rowsCount: rows.length,
        colsCount: structuralEl.table.columns || (rows[0] && rows[0].tableCells ? rows[0].tableCells.length : 0),
        markdown: tableMarkdown.trim(),
        startIndex: firstCellStartIndex,
        endIndex: firstCellEndIndex
      });
    }
  });

  const allVisualsCount = allVisualElements.length;
  const allTablesCount = allTablesList.length;

  // Scope filtering when selectionOnly is enabled
  let targetEditableBlocks = allEditableBlocks;
  let targetTablesList = allTablesList;
  let targetVisualElements = allVisualElements;
  let selectedTextPreview = '';
  let effectiveAnnotatedText = annotatedText;
  let selectionMinIndex = null;
  let selectionMaxIndex = null;

  if (opts.selectionOnly && Array.isArray(opts.selectionDescriptors) && opts.selectionDescriptors.length > 0) {
    const filteredBlocks = [];
    const selectedTableNums = new Set();
    const selectedVisualIds = new Set();

    opts.selectionDescriptors.forEach(desc => {
      if (desc.kind === 'VISUAL') {
        allVisualElements.forEach(v => {
          if (v.bodyChildIndex === desc.bodyChildIndex) {
            selectedVisualIds.add(v.targetId);
          }
        });
      } else if (desc.kind === 'TABLE') {
        if (desc.tableNumber > 0) {
          selectedTableNums.add(desc.tableNumber);
          allEditableBlocks.forEach(b => {
            if (b.tableNumber === desc.tableNumber) {
              filteredBlocks.push(b);
            }
          });
          allVisualElements.forEach(v => {
            if (v.tableNumber === desc.tableNumber) {
              selectedVisualIds.add(v.targetId);
            }
          });
        }
      } else if (desc.kind === 'TABLE_CELL') {
        if (desc.tableNumber > 0) {
          selectedTableNums.add(desc.tableNumber);
        }
        const cellBlocks = allEditableBlocks.filter(
          b => b.tableNumber === desc.tableNumber && b.rowIndex === desc.rowIndex && b.colIndex === desc.colIndex
        );
        cellBlocks.forEach(b => {
          if (desc.isPartial && desc.selectedText) {
            const subPos = b.text.indexOf(desc.selectedText.trim());
            if (subPos !== -1) {
              const trimmedSel = desc.selectedText.trim();
              filteredBlocks.push({
                text: trimmedSel,
                startIndex: b.startIndex + subPos,
                endIndex: b.startIndex + subPos + trimmedSel.length,
                source: b.source
              });
            } else {
              filteredBlocks.push(b);
            }
          } else {
            filteredBlocks.push(b);
          }
        });
      } else if (desc.kind === 'BODY_PARAGRAPH') {
        const paraBlocks = allEditableBlocks.filter(
          b => !b.tableNumber && b.bodyChildIndex === desc.bodyChildIndex
        );
        const paraVisuals = allVisualElements.filter(
          v => !v.tableNumber && v.bodyChildIndex === desc.bodyChildIndex
        );
        paraVisuals.forEach(v => selectedVisualIds.add(v.targetId));

        if (paraBlocks.length > 0) {
          const paraBaseStart = paraBlocks[0].startIndex;
          paraBlocks.forEach(b => {
            if (desc.isPartial && desc.offsetEnd !== null && desc.offsetEnd > desc.offsetStart) {
              const selAbsStart = paraBaseStart + desc.offsetStart;
              const selAbsEnd = paraBaseStart + desc.offsetEnd;
              const overlapStart = Math.max(b.startIndex, selAbsStart);
              const overlapEnd = Math.min(b.endIndex, selAbsEnd);
              if (overlapEnd > overlapStart) {
                const subText = b.text.substring(overlapStart - b.startIndex, overlapEnd - b.startIndex);
                if (subText.trim().length > 0) {
                  filteredBlocks.push({
                    text: subText,
                    startIndex: overlapStart,
                    endIndex: overlapEnd,
                    source: b.source
                  });
                }
              } else if (desc.selectedText) {
                const trimmed = desc.selectedText.replace(/\n/g, '').trim();
                const pos = b.text.indexOf(trimmed);
                if (trimmed && pos !== -1) {
                  filteredBlocks.push({
                    text: trimmed,
                    startIndex: b.startIndex + pos,
                    endIndex: b.startIndex + pos + trimmed.length,
                    source: b.source
                  });
                }
              }
            } else {
              filteredBlocks.push(b);
            }
          });
        }
      }
    });

    // Deduplicate blocks by startIndex + endIndex
    const seenBlockKeys = new Set();
    targetEditableBlocks = [];
    filteredBlocks.forEach(b => {
      const key = `${b.startIndex}:${b.endIndex}`;
      if (!seenBlockKeys.has(key)) {
        seenBlockKeys.add(key);
        targetEditableBlocks.push({
          text: b.text,
          startIndex: b.startIndex,
          endIndex: b.endIndex,
          source: b.source
        });
      }
    });

    targetTablesList = allTablesList.filter(t => selectedTableNums.has(t.tableNumber));
    targetVisualElements = allVisualElements.filter(v => selectedVisualIds.has(v.targetId));

    if (
      targetEditableBlocks.length === 0 &&
      targetTablesList.length === 0 &&
      targetVisualElements.length === 0
    ) {
      throw new Error(opts.isJa
        ? '選択された範囲内に推敲可能な確定済みテキストや表・図が見つかりませんでした。'
        : 'No editable settled text, tables, or figures were found within your selection.'
      );
    }

    selectedTextPreview = targetEditableBlocks.map(b => b.text).join('\n');

    // Build scoped annotated text containing strictly the selected content
    const scopedParts = [];
    if (selectedTextPreview) {
      scopedParts.push(selectedTextPreview);
    }
    targetTablesList.forEach(t => {
      scopedParts.push(t.markdown);
    });
    targetVisualElements.forEach(v => {
      scopedParts.push(`[${v.targetId} (${v.type}): Title="${v.title || ''}", Description="${v.description || ''}"]`);
    });
    effectiveAnnotatedText = scopedParts.join('\n\n');

    // Compute min/max character index of the selected items to filter existing suggestions
    const rangeStarts = [];
    const rangeEnds = [];
    targetEditableBlocks.forEach(b => { rangeStarts.push(b.startIndex); rangeEnds.push(b.endIndex); });
    targetTablesList.forEach(t => { rangeStarts.push(t.startIndex); rangeEnds.push(t.endIndex); });
    targetVisualElements.forEach(v => { rangeStarts.push(v.startIndex); rangeEnds.push(v.endIndex); });
    if (rangeStarts.length > 0) {
      selectionMinIndex = Math.min.apply(null, rangeStarts);
      selectionMaxIndex = Math.max.apply(null, rangeEnds);
    }
  } else {
    // Clean internal indexing metadata from blocks
    targetEditableBlocks = allEditableBlocks.map(b => ({
      text: b.text,
      startIndex: b.startIndex,
      endIndex: b.endIndex,
      source: b.source
    }));
  }

  const collectedIds = collectAllSuggestionAndCommentIds_(docJson, activeTabId);
  const extractedThreads = extractCommentAndSuggestionThreads_(docJson, activeTabId, collectedIds.suggestionIds);
  const activeCommentsList = extractedThreads.activeComments;
  const resolvedReviewsList = extractedThreads.resolvedReviews;

  // Attach any suggestion-linked comment replies directly to their corresponding suggestion entry
  activeCommentsList.forEach(c => {
    if (c.suggestionId && existingSuggestionsMap[c.suggestionId]) {
      if (!Array.isArray(existingSuggestionsMap[c.suggestionId].comments)) {
        existingSuggestionsMap[c.suggestionId].comments = [];
      }
      existingSuggestionsMap[c.suggestionId].comments.push(c);
    }
  });

  // Also ensure any non-text suggestion IDs (e.g., style/table/image suggestions) are represented
  (collectedIds.suggestionIds || []).forEach(sugId => {
    if (!existingSuggestionsMap[sugId]) {
      const linkedComments = activeCommentsList.filter(c => c.suggestionId === sugId);
      existingSuggestionsMap[sugId] = {
        id: sugId,
        deletedText: '',
        insertedText: '[Formatting / Structural Suggestion]',
        startIndex: 1,
        endIndex: 1,
        comments: linkedComments
      };
    }
  });

  let existingSuggestionsList = Object.values(existingSuggestionsMap);
  if (opts.selectionOnly && selectionMinIndex !== null && selectionMaxIndex !== null) {
    existingSuggestionsList = existingSuggestionsList.filter(
      s => !(s.endIndex < selectionMinIndex || s.startIndex > selectionMaxIndex)
    );
  }

  const trimmedFullText = plainText.trim();
  const effectiveCharCount = opts.selectionOnly
    ? selectedTextPreview.trim().length
    : trimmedFullText.length;

  const isEmpty =
    trimmedFullText.length === 0 &&
    previewAcceptedText.trim().length === 0 &&
    allTablesCount === 0 &&
    allVisualsCount === 0 &&
    existingSuggestionsList.length === 0 &&
    activeCommentsList.length === 0 &&
    resolvedReviewsList.length === 0;

  return {
    documentId: docJson.documentId,
    title: docJson.title,
    activeTabId: activeTabId,
    activeTabTitle: activeTabTitle,
    selectionOnly: Boolean(opts.selectionOnly),
    selectedTextPreview: selectedTextPreview,
    isEmpty: isEmpty,
    charCount: effectiveCharCount,
    annotatedText: effectiveAnnotatedText,
    editableBlocks: targetEditableBlocks,
    existingSuggestions: existingSuggestionsList,
    existingComments: activeCommentsList,
    resolvedReviews: resolvedReviewsList,
    allSuggestionIds: collectedIds.suggestionIds,
    allAiCommentIds: collectedIds.aiCommentIds,
    allCommentIds: collectedIds.allCommentIds,
    tables: targetTablesList,
    visualElements: targetVisualElements
  };
}

/**
 * ============================================================================
 * Suggestion & Comment Management: Accept / Clear Suggestions & Clear Comments
 * ============================================================================
 */

/**
 * Accepts all suggestions using the freshly reloaded suggestion IDs (or re-fetches if needed).
 *
 * @param {Array<string>} reloadedSuggestionIds Suggestion IDs reloaded in Step 1.
 * @param {string} lang Current UI language ('en' or 'ja').
 * @return {Object} Execution result.
 */
function executeAcceptAllFromReloaded(reloadedSuggestionIds, lang) {
  const doc = DocumentApp.getActiveDocument();
  const docId = doc.getId();
  let suggestionIds = Array.isArray(reloadedSuggestionIds) ? reloadedSuggestionIds : [];

  if (suggestionIds.length === 0) {
    const tabInfo = getActiveTabInfo_(doc);
    const docJson = fetchRawDocumentJson_(docId);
    suggestionIds = collectAllSuggestionAndCommentIds_(docJson, tabInfo.tabId).suggestionIds;
  }

  if (suggestionIds.length === 0) {
    return {
      success: true,
      count: 0,
      message: lang === 'ja'
        ? '承認待ちの提案はありませんでした。'
        : 'No pending suggestions found to accept.'
    };
  }

  const requests = suggestionIds.map(id => ({
    acceptSuggestion: { suggestionId: id }
  }));

  executeSuggestionActionRequestsSafely_(docId, requests);

  return {
    success: true,
    count: suggestionIds.length,
    message: lang === 'ja'
      ? `✅ 現在の提案を再読み込みし、${suggestionIds.length} 件の提案をすべて承認しました！`
      : `✅ Reloaded current suggestions and accepted all ${suggestionIds.length} suggestion(s)!`
  };
}

/**
 * Rejects (clears) all pending inline suggestions using the freshly reloaded suggestion IDs.
 *
 * @param {Array<string>} reloadedSuggestionIds Suggestion IDs reloaded in Step 1.
 * @param {string} lang Current UI language ('en' or 'ja').
 * @return {Object} Execution result.
 */
function executeClearAllFromReloaded(reloadedSuggestionIds, lang) {
  const doc = DocumentApp.getActiveDocument();
  const docId = doc.getId();
  let suggestionIds = Array.isArray(reloadedSuggestionIds) ? reloadedSuggestionIds : [];

  if (suggestionIds.length === 0) {
    const tabInfo = getActiveTabInfo_(doc);
    const docJson = fetchRawDocumentJson_(docId);
    suggestionIds = collectAllSuggestionAndCommentIds_(docJson, tabInfo.tabId).suggestionIds;
  }

  if (suggestionIds.length === 0) {
    return {
      success: true,
      count: 0,
      message: lang === 'ja'
        ? 'クリア対象の提案はありませんでした。'
        : 'No pending suggestions found to clear.'
    };
  }

  const requests = suggestionIds.map(id => ({ rejectSuggestion: { suggestionId: id } }));

  executeSuggestionActionRequestsSafely_(docId, requests);

  return {
    success: true,
    count: suggestionIds.length,
    message: lang === 'ja'
      ? `🧹 現在の提案を再読み込みし、${suggestionIds.length} 件の提案をすべてクリアしました！`
      : `🧹 Reloaded current suggestions and cleared all ${suggestionIds.length} suggestion(s)!`
  };
}

/**
 * Deletes all active comments (including Figure/Table review comments and Hint-Only comments
 * created via insertComment) using the freshly reloaded comment IDs.
 *
 * @param {Array<string>} reloadedCommentIds Comment IDs reloaded in Step 1.
 * @param {string} lang Current UI language ('en' or 'ja').
 * @return {Object} Execution result.
 */
function executeClearAllCommentsFromReloaded(reloadedCommentIds, lang) {
  const doc = DocumentApp.getActiveDocument();
  const docId = doc.getId();
  let commentIds = Array.isArray(reloadedCommentIds) ? reloadedCommentIds : [];

  if (commentIds.length === 0) {
    const tabInfo = getActiveTabInfo_(doc);
    const docJson = fetchRawDocumentJson_(docId);
    commentIds = collectAllSuggestionAndCommentIds_(docJson, tabInfo.tabId).allCommentIds;
  }

  if (commentIds.length === 0) {
    return {
      success: true,
      count: 0,
      message: lang === 'ja'
        ? '削除対象のコメントはありませんでした。'
        : 'No active comments found to delete.'
    };
  }

  const requests = commentIds.map(cId => ({ deleteComment: { commentId: cId } }));

  executeSuggestionActionRequestsSafely_(docId, requests);

  return {
    success: true,
    count: commentIds.length,
    message: lang === 'ja'
      ? `🗑️ 現在のコメントを再読み込みし、${commentIds.length} 件のコメントをすべて削除しました！`
      : `🗑️ Reloaded current comments and deleted all ${commentIds.length} comment(s)!`
  };
}

/**
 * Executes batchUpdate for accept/reject/deleteComment/insertComment requests.
 * Falls back to individual execution if a single item in the batch fails.
 *
 * @param {string} docId Document ID.
 * @param {Array<Object>} requests List of batchUpdate requests.
 */
function executeSuggestionActionRequestsSafely_(docId, requests) {
  if (!requests || requests.length === 0) return;

  const token = ScriptApp.getOAuthToken();
  const endpoint = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;
  const headers = { Authorization: 'Bearer ' + token };

  const batchRes = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify({ requests: requests }),
    muteHttpExceptions: true
  });

  if (batchRes.getResponseCode() !== 200 && requests.length > 1) {
    requests.forEach(req => {
      UrlFetchApp.fetch(endpoint, {
        method: 'post',
        contentType: 'application/json',
        headers: headers,
        payload: JSON.stringify({ requests: [req] }),
        muteHttpExceptions: true
      });
    });
  }
}

/**
 * ============================================================================
 * Generate Initial Text When the Document is Empty
 * ============================================================================
 */
function generateInitialArticle(customPrompt, modelName, lang) {
  const isJa = lang === 'ja';

  if (!customPrompt || !customPrompt.trim()) {
    throw new Error(isJa
      ? 'ドキュメントに文章がありません。カスタムプロンプト欄に作成したい文章の内容を入力してください。'
      : 'The document is empty. Please enter a topic or instruction in the Custom Prompt field to generate initial text.'
    );
  }

  const apiKey = getRequiredApiKey_(isJa);
  const model = ALLOWED_MODELS.includes(modelName) ? modelName : DEFAULT_MODEL;

  const systemInstruction = isJa
    ? [
        'あなたは優秀なライターです。ユーザーの指示（カスタムプロンプト）に基づき、Google Docsに挿入するための自然で読みやすい日本語の原稿を作成してください。',
        'マークダウン記法（# や ** など）は使わず、プレーンテキストの段落構成（段落間は改行）で出力してください。',
        '前置きや挨拶は一切含めず、原稿の本文のみを出力してください。'
      ].join('\n')
    : [
        'You are an expert writer. Based on the user instruction (custom prompt), write a well-structured, natural draft suitable for insertion into Google Docs.',
        'Do not use Markdown formatting (such as # or **). Output plain text separated by paragraphs.',
        'Output only the body text of the draft without any conversational filler or intro.'
      ].join('\n');

  const userPromptText = isJa
    ? `以下の内容・指示に従って原稿を作成してください：\n\n${customPrompt.trim()}`
    : `Please write a draft according to the following instructions:\n\n${customPrompt.trim()}`;

  const payload = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: userPromptText }] }],
    generationConfig: { temperature: 0.7 }
  };

  const generatedText = callGeminiApiRaw_(model, apiKey, payload).trim();
  if (!generatedText) {
    throw new Error(isJa ? 'AIから文章が生成されませんでした。' : 'Failed to generate text from AI.');
  }

  const doc = DocumentApp.getActiveDocument();
  const docId = doc.getId();
  const tabInfo = getActiveTabInfo_(doc);

  const locationObj = { index: 1 };
  if (tabInfo.tabId) {
    locationObj.tabId = tabInfo.tabId;
  }

  const batchRequest = {
    writeControl: { writeMode: 'EDIT' },
    requests: [
      {
        insertText: {
          location: locationObj,
          text: generatedText + '\n'
        }
      }
    ]
  };

  executeBatchUpdate_(docId, batchRequest);

  return {
    success: true,
    generatedText: generatedText,
    modelUsed: model,
    charCount: generatedText.length
  };
}

/**
 * ============================================================================
 * STEP 2: Generate Proofreading, Coaching & Learning Advice Summary via Gemini
 * ============================================================================
 */

/**
 * Shared helper that uploads the manuscript Markdown file and any embedded visual images
 * in parallel to the Gemini File API, executes structured JSON generation, and guarantees
 * immediate File API cleanup in the `finally` block.
 *
 * @param {string} model Selected Gemini model identifier.
 * @param {string} apiKey Gemini API key.
 * @param {Object} promptData { systemPrompt, manuscriptFileName, manuscriptFileContent, userMessage, responseSchema }
 * @param {Array<Object>} visualElements Visual elements to upload alongside the manuscript.
 * @param {string} manuscriptLabelPrefix Label prefix for the attached manuscript file part.
 * @return {Object} Parsed JSON response from Gemini.
 */
function executeMultimodalJsonGeneration_(model, apiKey, promptData, visualElements, manuscriptLabelPrefix) {
  const userParts = [];
  let uploadedFiles = [];

  try {
    uploadedFiles = uploadManuscriptAndVisualsToGeminiFiles_(
      promptData.manuscriptFileContent,
      promptData.manuscriptFileName,
      visualElements,
      apiKey
    );

    const manuscriptFile = uploadedFiles.find(uf => uf.kind === 'MANUSCRIPT');
    if (manuscriptFile) {
      userParts.push({
        text: `[${manuscriptLabelPrefix} (${manuscriptFile.title})]`
      });
      userParts.push({
        fileData: {
          mimeType: manuscriptFile.mimeType,
          fileUri: manuscriptFile.fileUri
        }
      });
    } else if (promptData.manuscriptFileContent) {
      // Fallback to inline content if File API upload for manuscript fails
      userParts.push({ text: promptData.manuscriptFileContent });
    }

    uploadedFiles
      .filter(uf => uf.kind === 'VISUAL')
      .forEach(uf => {
        userParts.push({ text: `\n[Attached Image File for ${uf.targetId} (${uf.type}: "${uf.title}")] ` });
        userParts.push({
          fileData: {
            mimeType: uf.mimeType,
            fileUri: uf.fileUri
          }
        });
      });

    userParts.push({ text: '\n' + promptData.userMessage });

    const payload = {
      systemInstruction: { parts: [{ text: promptData.systemPrompt }] },
      contents: [{ role: 'user', parts: userParts }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: promptData.responseSchema
      }
    };

    const rawJsonText = callGeminiApiRaw_(model, apiKey, payload);
    try {
      return JSON.parse(rawJsonText);
    } catch (e) {
      throw new Error('Failed to parse JSON response from Gemini: ' + rawJsonText);
    }
  } finally {
    if (uploadedFiles.length > 0) {
      deleteGeminiFiles_(uploadedFiles, apiKey);
    }
  }
}

/**
 * Generates proofreading suggestions (or Hint-Only comments), multimodal figure/table
 * review comments, and the Writing Coach & Learning Summary via Gemini.
 *
 * @param {Object} docData Parsed document structure from Step 1.
 * @param {string} customPrompt Optional user instruction.
 * @param {string} modelName Selected Gemini model name.
 * @param {string} lang Current UI language ('en' or 'ja').
 * @param {boolean=} hintOnly Whether Hint-Only Mode is enabled.
 * @param {boolean=} includeResolved Whether to include resolved review history in context.
 * @return {Object} Structured proofreading and coaching output.
 */
function step2_generateProofreading(docData, customPrompt, modelName, lang, hintOnly, includeResolved) {
  const isJa = lang === 'ja';
  const isHintOnly = Boolean(hintOnly);
  const isIncludeResolved = includeResolved !== undefined ? Boolean(includeResolved) : true;

  if (!docData || docData.isEmpty) {
    throw new Error(isJa
      ? 'ドキュメントに推敲対象の文章や要素が存在しません。'
      : 'There is no content in the document to proofread.'
    );
  }

  const apiKey = getRequiredApiKey_(isJa);
  const model = ALLOWED_MODELS.includes(modelName) ? modelName : DEFAULT_MODEL;
  const promptData = buildProofreadingPromptAndSchema_(docData, customPrompt, isJa, isHintOnly, isIncludeResolved);

  const parsedResult = executeMultimodalJsonGeneration_(
    model,
    apiKey,
    promptData,
    docData.visualElements,
    isJa ? '添付原稿ファイル' : 'Attached Manuscript File'
  );

  return {
    modelUsed: model,
    hintOnly: isHintOnly,
    overallFeedback: parsedResult.overallFeedback || '',
    learningSummary: parsedResult.learningSummary || {
      revisionsDigest: '',
      weakPointsAndHabits: '',
      actionableTips: ''
    },
    existingSuggestionsNote: parsedResult.existingSuggestionsNote || '',
    suggestions: parsedResult.suggestions || [],
    elementSuggestions: parsedResult.elementSuggestions || []
  };
}

/**
 * Generates a "🎓 Writing Coach & Learning Summary" directly from the existing
 * inline suggestions, active comments, and optionally resolved review history
 * (accepted/rejected suggestions and resolved comments) in the Google Document,
 * without modifying the document.
 *
 * @param {Object} docData Parsed document structure from Step 1.
 * @param {string} customPrompt Optional user instruction.
 * @param {string} modelName Selected Gemini model name.
 * @param {string} lang Current UI language ('en' or 'ja').
 * @param {boolean=} includeResolved Whether to include resolved review history.
 * @return {Object} Structured learning summary and analyzed review items.
 */
function step2_generateLearningSummaryFromExisting(docData, customPrompt, modelName, lang, includeResolved) {
  const isJa = lang === 'ja';
  const isIncludeResolved = includeResolved !== undefined ? Boolean(includeResolved) : true;

  if (!docData) {
    throw new Error(isJa
      ? 'ドキュメントデータの取得に失敗しました。'
      : 'Failed to retrieve document data.'
    );
  }

  const existingSuggestions = Array.isArray(docData.existingSuggestions) ? docData.existingSuggestions : [];
  const existingComments = Array.isArray(docData.existingComments) ? docData.existingComments : [];
  const allResolvedReviews = Array.isArray(docData.resolvedReviews) ? docData.resolvedReviews : [];
  const resolvedReviews = isIncludeResolved ? allResolvedReviews : [];

  if (existingSuggestions.length === 0 && existingComments.length === 0 && resolvedReviews.length === 0) {
    if (!isIncludeResolved && allResolvedReviews.length > 0) {
      throw new Error(isJa
        ? `未解決の提案・コメントはありませんが、解決済みのレビュー履歴が ${allResolvedReviews.length} 件存在します。「📜 解決済みの提案・コメント履歴も含める」スイッチをオンにして実行してください。`
        : `No active (unresolved) suggestions or comments were found, but ${allResolvedReviews.length} resolved review item(s) exist in the document history. Please turn ON "📜 Include Resolved Review History" to generate a Learning Summary from resolved items.`
      );
    }
    throw new Error(isJa
      ? 'アクティブなタブ内に提案（サジェスト）やコメント（解決済み履歴を含む）が見つかりませんでした。他のユーザーからの提案・コメントが含まれるドキュメントで実行するか、先に「🚀 推敲を実行」を押してください。'
      : 'No suggestions or comments (active or resolved) were found in the active tab. Please run this on a document containing suggestions or comments from reviewers, or click "🚀 Run Proofreading" first.'
    );
  }

  const apiKey = getRequiredApiKey_(isJa);
  const model = ALLOWED_MODELS.includes(modelName) ? modelName : DEFAULT_MODEL;
  const promptData = buildExistingLearningSummaryPromptAndSchema_(docData, customPrompt, isJa, isIncludeResolved);

  const parsedResult = executeMultimodalJsonGeneration_(
    model,
    apiKey,
    promptData,
    docData.visualElements,
    isJa ? '添付原稿・既存レビュー履歴一覧ファイル' : 'Attached Manuscript & Review History File'
  );

  return {
    sourceMode: 'existing',
    modelUsed: model,
    analyzedSuggestionsCount: existingSuggestions.length,
    analyzedCommentsCount: existingComments.length,
    analyzedResolvedCount: resolvedReviews.length,
    overallFeedback: parsedResult.overallFeedback || '',
    learningSummary: parsedResult.learningSummary || {
      revisionsDigest: '',
      weakPointsAndHabits: '',
      actionableTips: ''
    },
    analyzedItems: parsedResult.analyzedItems || []
  };
}

/**
 * Formats a resolved review thread (accepted/rejected suggestion or resolved comment)
 * into a single human-readable line for Markdown context files.
 *
 * @param {Object} r Resolved review thread object.
 * @param {number} idx Zero-based index.
 * @return {string} Formatted Markdown line.
 */
function formatResolvedReviewLine_(r, idx) {
  const statusTag = r.resolutionState || 'RESOLVED';
  const typeTag = r.threadType === 'SUGGESTION' ? 'Suggestion' : 'Comment';
  const authorPrefix = r.author ? `Author="${r.author}", ` : '';
  const quotePrefix = r.quotedText ? `Target/Quoted="${r.quotedText.replace(/\n+/g, ' ')}", ` : '';
  const summaryPrefix = (r.summaryText && r.summaryText !== r.quotedText)
    ? `Summary="${r.summaryText.replace(/\n+/g, ' ')}", `
    : '';
  const headStr = r.content ? `Content="${r.content.replace(/\n+/g, ' ')}"` : '';
  const repliesStr = (r.replies && r.replies.length > 0)
    ? ` | Replies: [${r.replies.map(rep => `${rep.author ? rep.author + ': ' : ''}${rep.content.replace(/\n+/g, ' ')}`).join(' / ')}]`
    : '';
  return `${idx + 1}. [Resolved ${typeTag} (${statusTag}) | ${authorPrefix}${quotePrefix}${summaryPrefix}${headStr}]${repliesStr}`;
}

/**
 * Builds the system instruction, manuscript Markdown file content, compact user message,
 * and structured JSON schema for generating a "Writing Coach & Learning Summary" from
 * existing active suggestions, active comments, and resolved review history in the Google Document.
 *
 * @param {Object} docData Parsed document structure from Step 1.
 * @param {string} customPrompt Optional user instruction.
 * @param {boolean} isJa True if Japanese UI mode.
 * @param {boolean=} includeResolved Whether to include resolved review history.
 * @return {Object} { systemPrompt, manuscriptFileName, manuscriptFileContent, userMessage, responseSchema }
 */
function buildExistingLearningSummaryPromptAndSchema_(docData, customPrompt, isJa, includeResolved) {
  const existingSuggestions = Array.isArray(docData.existingSuggestions) ? docData.existingSuggestions : [];
  const existingComments = Array.isArray(docData.existingComments) ? docData.existingComments : [];
  const resolvedReviews = includeResolved && Array.isArray(docData.resolvedReviews) ? docData.resolvedReviews : [];
  const hasTables = docData.tables && docData.tables.length > 0;
  const hasVisuals = docData.visualElements && docData.visualElements.length > 0;
  const isSelectionOnly = Boolean(docData.selectionOnly);
  const manuscriptFileName = isSelectionOnly ? 'selected_reviews_context.md' : 'manuscript_reviews_context.md';

  const formatSuggestionLine = (s, idx) => {
    const delTxt = (s.deletedText || '').replace(/\n/g, ' ').trim();
    const insTxt = (s.insertedText || '').replace(/\n/g, ' ').trim();
    const attachedComments = Array.isArray(s.comments) ? s.comments : [];
    const replyTexts = [];
    attachedComments.forEach(c => {
      if (c.content) {
        replyTexts.push(`${c.author ? c.author + ': ' : ''}${c.content.replace(/\n+/g, ' ')}`);
      }
      (c.replies || []).forEach(r => {
        if (r.content) {
          replyTexts.push(`${r.author ? r.author + ': ' : ''}${r.content.replace(/\n+/g, ' ')}`);
        }
      });
    });
    const replyStr = replyTexts.length > 0 ? ` | Attached Comments/Replies: [${replyTexts.join(' / ')}]` : '';
    return `${idx + 1}. [Suggestion ID: ${s.id}] Deleted: "${delTxt || '(None)'}" ➔ Inserted: "${insTxt || '(None)'}"${replyStr}`;
  };

  const formatCommentLine = (c, idx) => {
    const authorPrefix = c.author ? `Author="${c.author}", ` : '';
    const linkedPrefix = c.suggestionId ? `LinkedSuggestionID="${c.suggestionId}", ` : 'Standalone Comment, ';
    const quotePrefix = c.quotedText ? `Anchored/Quoted Text="${c.quotedText.replace(/\n+/g, ' ')}", ` : '';
    const headStr = c.content ? `Comment="${c.content.replace(/\n+/g, ' ')}"` : 'Comment="(Suggestion Thread)"';
    const repliesStr = (c.replies && c.replies.length > 0)
      ? ` | Replies: [${c.replies.map(r => `${r.author ? r.author + ': ' : ''}${r.content.replace(/\n+/g, ' ')}`).join(' / ')}]`
      : '';
    return `${idx + 1}. [${linkedPrefix}${authorPrefix}${quotePrefix}${headStr}]${repliesStr}`;
  };

  const suggestionsContext = existingSuggestions.length > 0
    ? existingSuggestions.map(formatSuggestionLine).join('\n')
    : (isJa ? 'なし' : 'None');

  const commentsContext = existingComments.length > 0
    ? existingComments.map(formatCommentLine).join('\n')
    : (isJa ? 'なし' : 'None');

  const resolvedContext = resolvedReviews.length > 0
    ? resolvedReviews.map(formatResolvedReviewLine_).join('\n')
    : (isJa ? 'なし' : 'None');

  const tablesContext = hasTables
    ? docData.tables.map(t => `${t.targetId} (${t.rowsCount}x${t.colsCount}):\n${t.markdown}`).join('\n\n')
    : (isJa ? 'なし' : 'None');

  const visualsContext = hasVisuals
    ? docData.visualElements.map(v => `- ${v.targetId}: Type=${v.type}, Title="${v.title}", Description="${v.description}"`).join('\n')
    : (isJa ? 'なし' : 'None');

  if (isJa) {
    let systemPrompt = `あなたはプロの文章校正者・データビジュアライゼーションの専門家・ライティングコーチです。
添付された原稿Markdownファイル（および添付された図表画像ファイル）に記載されている「未解決の提案（サジェスト）」「未解決のコメント・返信スレッド」、および「解決済みのレビュー履歴（すでに承認・却下された提案や解決済みコメント・ヒントコメント）」を原稿文脈（本文・表・図）と照らし合わせて深く分析し、原稿を書いた執筆者がこれらの指摘・提案・履歴から効果的に自己学習できるための「🎓 執筆者への学習アドバイスまとめ（Writing Coach & Learning Summary）」を生成してください。
【言語ルール】出力するすべての項目は**すべて日本語のみ**で記述してください。

【分析とコーチングの重点指針】
1. 添付ファイル内に存在する他のユーザー（同僚・上司・編集者・レビュアー）やAIからのインライン修正提案、コメント、および解決済みレビュー履歴（承認・却下・解決済みのスレッド）の意図・背景理由を正確に読み取ってください。
2. なぜそれらの箇所が修正提案・コメント指摘されたのか（また解決済みの項目でどのように改善されたか）を体系的に整理し、執筆者が今後のライティングで同じミスや弱点を繰り返さないための具体的・実践的な学びへと昇華させてください。
3. 以下の3点を learningSummary として分かりやすくまとめてください：
   - revisionsDigest（どのような修正・指摘が行われているか）: 未解決および解決済みの提案・コメントで行われている主な修正・指摘内容の要点まとめ
   - weakPointsAndHabits（苦手なところ・修正すべき傾向）: 提案やコメント履歴から浮き彫りになった執筆者の文章・構成・図表連携上のクセや弱点
   - actionableTips（今後の執筆に向けた学習アドバイス）: 指摘事項を踏まえ、次回からの執筆で意識すべき実践的な改善アクション
4. さらに、サイドバーのダッシュボード上で個別の提案・コメント（解決済み履歴を含む）の学びを確認できるよう、主要な項目の解説リスト（analyzedItems）も出力してください。`;

    if (customPrompt && customPrompt.trim()) {
      systemPrompt += `\n\n【ユーザーからの追加指示（カスタムプロンプト）】
以下の指示を分析および学習アドバイス作成時の最優先事項として反映してください：
「${customPrompt.trim()}」`;
    }

    const manuscriptFileContent = `# 対象原稿コンテキスト（インライン提案マーカー・表・図注釈付き）
${docData.annotatedText}

# 未解決（アクティブ）のインライン修正提案一覧（計 ${existingSuggestions.length} 件）
${suggestionsContext}

# 未解決（アクティブ）のコメント＆返信スレッド一覧（計 ${existingComments.length} 件）
${commentsContext}

# 解決済みの提案・コメント履歴一覧（承認・却下済み提案＆解決済みコメント：計 ${resolvedReviews.length} 件）
${resolvedContext}

# 対象の表一覧
${tablesContext}

# 対象の図・チャート一覧
${visualsContext}`;

    const userMessage = `添付された原稿・レビュー履歴一覧ファイル（${manuscriptFileName}）および添付画像（存在する場合）を詳細に分析し、指定されたJSONスキーマに従って「執筆者への学習アドバイスまとめ（learningSummary）」および個別解説リスト（analyzedItems）を出力してください。`;

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        overallFeedback: {
          type: 'STRING',
          description: '原稿全体および未解決・解決済みの提案・コメント履歴全体に対する総合評価と要約（日本語）'
        },
        learningSummary: {
          type: 'OBJECT',
          description: '提案・コメント（未解決および解決済み履歴）から抽出した執筆者向けの学習アドバイスまとめ（すべて日本語）',
          properties: {
            revisionsDigest: {
              type: 'STRING',
              description: '提案やコメント（解決済み履歴を含む）でどのような修正・指摘が行われたかのシンプルなまとめ（日本語）'
            },
            weakPointsAndHabits: {
              type: 'STRING',
              description: '提案やコメント履歴から見受けられる執筆者の苦手なところや修正すべき傾向・クセ（日本語）'
            },
            actionableTips: {
              type: 'STRING',
              description: 'これらの提案・コメント履歴を糧にして今後の執筆で意識すべき具体的な学習アドバイス（日本語）'
            }
          },
          required: ['revisionsDigest', 'weakPointsAndHabits', 'actionableTips']
        },
        analyzedItems: {
          type: 'ARRAY',
          description: '主要な提案やコメント（解決済み履歴を含む）ごとの意図・理由・学習ポイントの解説リスト（日本語）',
          items: {
            type: 'OBJECT',
            properties: {
              category: {
                type: 'STRING',
                description: '指摘・提案のカテゴリ（日本語。例: 解決済みレビュー, レビュアーコメント, 論理・明確化, 語彙・表現, 表・図の整合性, 文法）'
              },
              targetSummary: {
                type: 'STRING',
                description: '対象の修正提案（変更前➔変更後）またはコメント・解決済み指摘内容の簡潔な要約'
              },
              reason: {
                type: 'STRING',
                description: 'なぜその修正提案やコメント指摘が重要なのかの背景理由（日本語）'
              },
              learningPoint: {
                type: 'STRING',
                description: 'この指摘から得られる今後の執筆に向けた学習ポイント（日本語）'
              }
            },
            required: ['category', 'targetSummary', 'reason', 'learningPoint']
          }
        }
      },
      required: ['overallFeedback', 'learningSummary', 'analyzedItems']
    };

    return { systemPrompt, manuscriptFileName, manuscriptFileContent, userMessage, responseSchema };
  }

  // English UI Mode ('en')
  let systemPrompt = `You are a professional editor, data visualization specialist, and pedagogical writing coach.
Your task is to deeply analyze the active inline suggestions, active comment threads, and resolved review history (accepted/rejected suggestions and resolved comments/hints) contained in the attached manuscript Markdown file (alongside any attached figure images), and generate a structured "🎓 Writing Coach & Learning Summary" so the author can effectively learn from both active and resolved reviews.
[LANGUAGE RULE] All output fields MUST be written **100% in English**.

[COACHING & ANALYSIS GUIDELINES]
1. Accurately interpret the intent and editorial rationale behind the active inline suggestions (Deleted ➔ Inserted), active reviewer comments/replies, and resolved review history threads (accepted/rejected edits and resolved comments) present in the attached file.
2. Synthesize why those edits and comments were made so the author can understand their own recurring writing habits and avoid repeating the same weaknesses in future drafts.
3. Provide a clear, high-impact "learningSummary" covering:
   - revisionsDigest (What Was Revised / Pointed Out): A concise summary of the key revisions, corrections, and reviewer/coaching comments (both active and resolved) in the document.
   - weakPointsAndHabits (Areas for Improvement & Writing Habits): Recurring tendencies, grammatical/stylistic habits, logical gaps, or text-table-figure alignment issues revealed by those suggestions and comments.
   - actionableTips (Actionable Advice for Future Writing): Practical, concrete takeaways the author can apply in future writing based on this feedback.
4. Also provide "analyzedItems" summarizing the key individual suggestions and comments (including resolved history items) with their rationale and learning points for the sidebar dashboard.`;

  if (customPrompt && customPrompt.trim()) {
    systemPrompt += `\n\n[Additional Instructions from User (Custom Prompt)]
Incorporate the following instructions as high-priority criteria when analyzing the suggestions/comments and crafting the learning summary:
"${customPrompt.trim()}"`;
  }

  const manuscriptFileContent = `# Target Manuscript Context (with inline suggestion markers, table markdown, and visual markers)
${docData.annotatedText}

# Active (Unresolved) Inline Suggestions in Scope (Total: ${existingSuggestions.length})
${suggestionsContext}

# Active (Unresolved) Comment Threads & Replies in Scope (Total: ${existingComments.length})
${commentsContext}

# Resolved Review History — Accepted/Rejected Suggestions & Resolved Comments (Total: ${resolvedReviews.length})
${resolvedContext}

# Tables in Scope
${tablesContext}

# Figures & Charts in Scope
${visualsContext}`;

  const userMessage = `Please analyze the attached manuscript and review history Markdown file (${manuscriptFileName}) along with any attached figure images, and generate the "Writing Coach & Learning Summary" and "analyzedItems" adhering strictly to the response JSON schema.`;

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      overallFeedback: {
        type: 'STRING',
        description: 'Comprehensive evaluation of the manuscript and synthesis of the active and resolved suggestions and comments (in English).'
      },
      learningSummary: {
        type: 'OBJECT',
        description: 'Structured learning advice for the author synthesized from the active and resolved suggestions and comments in the document (100% in English).',
        properties: {
          revisionsDigest: {
            type: 'STRING',
            description: 'Clear summary of what kinds of revisions and reviewer/coaching comments were made in the document (in English).'
          },
          weakPointsAndHabits: {
            type: 'STRING',
            description: 'Summary of weak areas, recurring writing habits, or blind spots revealed by the suggestions and comments (in English).'
          },
          actionableTips: {
            type: 'STRING',
            description: 'Concrete, actionable advice for the author to apply in future writing based on these suggestions and comments (in English).'
          }
        },
        required: ['revisionsDigest', 'weakPointsAndHabits', 'actionableTips']
      },
      analyzedItems: {
        type: 'ARRAY',
        description: 'Digest of key lessons extracted from individual active and resolved suggestions and comments (in English).',
        items: {
          type: 'OBJECT',
          properties: {
            category: {
              type: 'STRING',
              description: 'Category in English (e.g., Resolved Review, Reviewer Comment, Clarity & Logic, Word Choice, Table/Figure Alignment, Grammar).'
            },
            targetSummary: {
              type: 'STRING',
              description: 'Concise summary of the suggested edit (Original ➔ Suggested) or active/resolved comment.'
            },
            reason: {
              type: 'STRING',
              description: 'Why this suggested change or comment is important (in English).'
            },
            learningPoint: {
              type: 'STRING',
              description: 'Actionable takeaway for the author from this specific suggestion or comment (in English).'
            }
          },
          required: ['category', 'targetSummary', 'reason', 'learningPoint']
        }
      }
    },
    required: ['overallFeedback', 'learningSummary', 'analyzedItems']
  };

  return { systemPrompt, manuscriptFileName, manuscriptFileContent, userMessage, responseSchema };
}

/**
 * Builds the localized system instruction, manuscript Markdown file content, compact user message,
 * and structured JSON schema for Step 2, enforcing strict 100% single-language output ('ja' or 'en')
 * and generating the comprehensive author learning summary.
 * Supports both Standard Suggestion Mode (`WriteMode.SUGGEST`) and Hint-Only Mode (`insertComment`),
 * as well as optional inclusion of resolved review history for continuity across iterative drafts.
 *
 * @param {Object} docData Parsed document structure from Step 1.
 * @param {string} customPrompt Optional user instruction.
 * @param {boolean} isJa True if Japanese UI mode, false if English UI mode.
 * @param {boolean=} hintOnly Whether Hint-Only Mode is enabled.
 * @param {boolean=} includeResolved Whether to include resolved review history in context.
 * @return {Object} { systemPrompt, manuscriptFileName, manuscriptFileContent, userMessage, responseSchema }
 */
function buildProofreadingPromptAndSchema_(docData, customPrompt, isJa, hintOnly, includeResolved) {
  const hasExisting = docData.existingSuggestions && docData.existingSuggestions.length > 0;
  const resolvedList = includeResolved && Array.isArray(docData.resolvedReviews) ? docData.resolvedReviews : [];
  const hasResolved = resolvedList.length > 0;
  const hasTables = docData.tables && docData.tables.length > 0;
  const hasVisuals = docData.visualElements && docData.visualElements.length > 0;
  const isSelectionOnly = Boolean(docData.selectionOnly);
  const isHintOnly = Boolean(hintOnly);
  const manuscriptFileName = isSelectionOnly ? 'selected_excerpt.md' : 'manuscript_context.md';

  if (isJa) {
    let systemPrompt = `あなたはプロの文章校正者・データビジュアライゼーションの専門家・ライティングコーチです。
添付された原稿Markdownファイル（${manuscriptFileName}）および図表画像ファイルの内容を理解し、推敲後の改善内容も踏まえた上で、具体的な修正提案（または自力推敲用ヒント）と、原稿を書いたユーザーの今後の学習のためのシンプルなアドバイスまとめを出力してください。
【言語ルール】出力するすべての項目（カテゴリ名、理由、講評、学習アドバイス等）は**すべて日本語のみ**で記述してください。

【厳守ルール】
1. テキストの推敲提案（suggestions）における元のフレーズ（originalText）は、添付された原稿Markdownファイル内の「推敲対象の確定済みテキストブロック一覧」の中に**一字一句完全に一致して存在する部分文字列**（改行を含まない）を指定してください。
2. 推敲対象の表（TABLE_1 等）が含まれる場合、表のセル内の文言に関する指摘は「suggestions」に含め、表全体の構成・項目設計・データ表現に関するコメントがある場合は「elementSuggestions」に targetId（例: "TABLE_1"）を指定して出力してください。
3. 【重要：図・チャートへの推敲コメント作成（必須）】Google Docsでは図やチャート（VISUAL_1 等）自体に対して直接インラインの置換提案（WriteMode.SUGGEST）を行うことができないため、図に対する推敲フィードバックは**Google Docsのコメント（insertComment）として図に付与**されます。推敲対象の図やチャート（VISUAL_1 等）が1つ以上含まれる場合は、添付された画像データを視覚的に解析し、**すべての対象図（VISUAL_1 等）それぞれについて最低1件以上**、図自体の視認性・ラベル・データ表現・または本文との整合性に関する推敲コメントを「elementSuggestions」に targetId（例: "VISUAL_1"）を指定して**必ず出力**してください（空配列にしないでください）。
4. 原稿の内容と今回の推敲内容を深く比較・理解した上で、執筆したユーザーの今後の学習用アドバイス（learningSummary）として以下の3点をシンプルかつ具体的にまとめてください：
   - revisionsDigest（どのような修正・指摘を行ったか）: 今回の推敲でどのような種類の修正・ヒント提示および図表コメントを行ったかの要点まとめ
   - weakPointsAndHabits（苦手なところ・修正すべき傾向）: 原稿から見受けられるユーザーの文章・構成・図表表現上のクセや弱点、注意すべきポイント
   - actionableTips（今後の執筆に向けた学習アドバイス）: 次回からの執筆で意識すべき実践的でシンプルな改善アクション`;

    if (isHintOnly) {
      systemPrompt += `\n\n【重要：💡 ヒントのみ表示モード（Hint-Only Mode / 自力推敲コーチング）】
現在「ヒントのみ表示モード」が有効です。ドキュメント上には直接の書き換え提案（WriteMode.SUGGEST）を行わず、該当フレーズ（originalText）に対して**理由（reason）と自力修正のヒント（learningPoint）のみをコメント（insertComment）として付与**し、執筆者自身が自分の頭で考えて文章を書き直す学習体験を提供します。
そのため、各 suggestions 項目では以下を徹底してください：
- reason: そのフレーズ（originalText）のどこにどのような問題・違和感・論理の飛躍・文法ミスがあるのかを明確に指摘してください（ここに完成した書き換え文そのものを書かないでください）。
- learningPoint: 執筆者が**自分の力で書き直すための具体的な着眼点・思考のヒント・改善の方向性**を提示してください（答えの文を丸写しさせるのではなく、「どの語を削るべきか」「主語と述語をどう対応させるか」といった自力推敲のヒントにしてください）。
- suggestedText: サイドバーの「参考解答を見る」折りたたみ表示用に、模範となる修正後のテキストを設定してください。`;
    }

    if (isSelectionOnly) {
      systemPrompt += `\n\n【重要：選択範囲のみの推敲モード】
現在「選択範囲のみを推敲」モードが有効であり、添付された原稿Markdownファイル（${manuscriptFileName}）には**ユーザーが選択した範囲の要素のみ**が含まれています。修正提案（suggestions および elementSuggestions）は、添付ファイル内の「推敲対象の確定済みテキストブロック一覧」「推敲対象の表一覧」「推敲対象の図・チャート一覧」に含まれる要素のみに対して行ってください（選択範囲外の要素が存在しないことを理由に指摘を行わないでください）。`;
    }

    if (hasExisting) {
      systemPrompt += `\n\n【重要：既存の未解決提案への配慮】
対象範囲には既に以下の修正案が提案されています：
${docData.existingSuggestions.map((s, idx) => `- 提案${idx + 1} (ID: ${s.id}): 削除="${s.deletedText.replace(/\n/g, '')}" ➔ 挿入="${s.insertedText.replace(/\n/g, '')}"`).join('\n')}
これらの提案済みの修正案を考慮したうえで、まだ提案が掛かっていない確定済みテキストや表・図・チャートに対して追加の提案を行ってください。`;
    }

    if (hasResolved) {
      systemPrompt += `\n\n【参考：ドキュメント内の解決済みレビュー履歴】
添付ファイルには、過去に承認・却下または解決されたレビュー履歴（計 ${resolvedList.length} 件）も記載されています。既に解決された箇所を元の誤った表現に戻すような矛盾した提案は避け、執筆者のこれまでの改善履歴も踏まえてコーチングを行ってください。`;
    }

    if (customPrompt && customPrompt.trim()) {
      systemPrompt += `\n\n【ユーザーからの追加の推敲指示（カスタムプロンプト）】
以下の指示をベースの推敲基準への追加項目として最優先で反映してください：
「${customPrompt.trim()}」`;
    }

    const blocksContext = docData.editableBlocks.length > 0
      ? docData.editableBlocks.map((b, i) => `[ブロック${i + 1} (${b.source === 'table' ? '表セル内' : '本文'})] "${b.text}"`).join('\n')
      : 'なし';

    const tablesContext = hasTables
      ? docData.tables.map(t => `${t.targetId} (${t.rowsCount}行 x ${t.colsCount}列):\n${t.markdown}`).join('\n\n')
      : 'なし';

    const visualsContext = hasVisuals
      ? docData.visualElements.map(v => `- ${v.targetId}: 種別=${v.type}, タイトル="${v.title}", 説明="${v.description}"`).join('\n')
      : 'なし';

    const manuscriptSections = [];
    if (!isSelectionOnly && (hasTables || hasVisuals || hasExisting)) {
      manuscriptSections.push(`# 原稿全体の構造・配置コンテキスト（注釈付き）\n${docData.annotatedText}`);
    }
    manuscriptSections.push(`# 推敲対象の確定済みテキストブロック一覧\n（suggestions の originalText は必ずこの中の文字列から完全一致で抜き出してください）\n${blocksContext}`);
    if (hasTables) {
      manuscriptSections.push(`# 推敲対象の表（テーブル）一覧\n${tablesContext}`);
    }
    if (hasVisuals) {
      manuscriptSections.push(`# 推敲対象の図・チャート一覧\n${visualsContext}`);
    }
    if (hasResolved) {
      manuscriptSections.push(`# 解決済みの提案・コメント履歴（参考コンテキスト）\n${resolvedList.map(formatResolvedReviewLine_).join('\n')}`);
    }

    const manuscriptFileContent = manuscriptSections.join('\n\n');
    const userMessage = `添付された原稿Markdownファイル（${manuscriptFileName}）および添付された図表画像ファイル（存在する場合）を読み取り、推敲提案（suggestions）、図表への推敲コメント（elementSuggestions）、および執筆者への学習アドバイスまとめ（learningSummary）を指定されたJSONスキーマに従って出力してください。`;

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        overallFeedback: {
          type: 'STRING',
          description: '原稿および推敲結果に対する総合講評（日本語）'
        },
        learningSummary: {
          type: 'OBJECT',
          description: '原稿と推敲後の内容を踏まえた、ユーザーへの学習用アドバイスまとめ（すべて日本語）',
          properties: {
            revisionsDigest: {
              type: 'STRING',
              description: 'どのような修正・指摘を行ったか（今回の推敲で行った主な修正・ヒント内容のシンプルなまとめ・日本語）'
            },
            weakPointsAndHabits: {
              type: 'STRING',
              description: 'どのような部分に苦手なところや修正すべき傾向があったか（原稿から見受けられる弱点やクセ・日本語）'
            },
            actionableTips: {
              type: 'STRING',
              description: '今後の学習・執筆のために意識すべき具体的なアドバイス（日本語）'
            }
          },
          required: ['revisionsDigest', 'weakPointsAndHabits', 'actionableTips']
        },
        existingSuggestionsNote: {
          type: 'STRING',
          description: '既存の提案や解決済み履歴がある場合、それをどう考慮したかの説明（無い場合は空文字列・日本語）'
        },
        suggestions: {
          type: 'ARRAY',
          description: '推敲対象の本文および表セル内のテキストに対する推敲提案（またはヒント指摘）リスト',
          items: {
            type: 'OBJECT',
            properties: {
              originalText: {
                type: 'STRING',
                description: '推敲対象の確定済みテキストブロック内に完全一致で存在する修正前のテキスト（改行を含まない）'
              },
              suggestedText: {
                type: 'STRING',
                description: '推敲・修正後の模範テキスト'
              },
              category: {
                type: 'STRING',
                description: '修正カテゴリ（日本語。例: 論理・明確化, 表データ表現, 語彙・表現, 簡潔化, 文法・語法）'
              },
              reason: {
                type: 'STRING',
                description: isHintOnly
                  ? 'この箇所にどのような問題・改善点があるのかの理由（直接の書き換え文は含めず問題点を説明・日本語）'
                  : 'なぜこのように修正したのかの具体的な理由（日本語）'
              },
              learningPoint: {
                type: 'STRING',
                description: isHintOnly
                  ? '執筆者が自分で考えて書き直すための具体的な推敲ヒント・着眼点（日本語）'
                  : 'ユーザーが今後の執筆で活かせる学習ワンポイント解説（日本語）'
              }
            },
            required: ['originalText', 'suggestedText', 'category', 'reason', 'learningPoint']
          }
        },
        elementSuggestions: {
          type: 'ARRAY',
          description: '推敲対象の図・チャート（VISUAL_1等）または表全体（TABLE_1等）に対する推敲コメントリスト（Google Docsの insertComment として付与されます。対象図がある場合は各 VISUAL_N につき必ず1件以上出力してください）',
          items: {
            type: 'OBJECT',
            properties: {
              targetId: {
                type: 'STRING',
                description: '対象要素のID（例: "VISUAL_1", "TABLE_1"）'
              },
              category: {
                type: 'STRING',
                description: 'カテゴリ（日本語。例: 図・チャート推敲コメント, 表の構成コメント, 本文と図表の整合性）'
              },
              suggestion: {
                type: 'STRING',
                description: 'その図・チャートまたは表に対する具体的な推敲コメント・改善アドバイス内容（日本語）'
              },
              reason: {
                type: 'STRING',
                description: 'コメント・指摘の理由（日本語）'
              },
              learningPoint: {
                type: 'STRING',
                description: '図表作成やデータ表現における学習ポイント（日本語）'
              }
            },
            required: ['targetId', 'category', 'suggestion', 'reason', 'learningPoint']
          }
        }
      },
      required: ['overallFeedback', 'learningSummary', 'existingSuggestionsNote', 'suggestions', 'elementSuggestions']
    };

    return { systemPrompt, manuscriptFileName, manuscriptFileContent, userMessage, responseSchema };
  }

  // English UI Mode ('en')
  let systemPrompt = `You are a professional editor, data visualization specialist, and writing coach.
Your task is to comprehensively understand the manuscript content in the attached Markdown file (${manuscriptFileName}) along with any attached figure images, propose specific improvements (or self-revision coaching hints), and provide a concise, structured learning advice summary for the author.
[LANGUAGE RULE] All output fields (categories, reasons, feedback, and learning advice—excluding quoted source text from the document if the document itself is in another language) MUST be written **100% in English**.

[STRICT RULES]
1. In text "suggestions", each "originalText" MUST be an exact, character-for-character substring found within the "Target Editable Settled Text Blocks" section of the attached Markdown file (do not include newlines).
2. When target tables (e.g., TABLE_1) are present, propose cell text edits in "suggestions", and provide structural or data-presentation review comments for the table as a whole in "elementSuggestions" using its targetId (e.g., "TABLE_1").
3. [MANDATORY: Figure & Chart Review Comments] Because inline edit suggestions (WriteMode.SUGGEST) cannot be applied directly to figures or charts in Google Docs, figure proofreading feedback is created as a **Google Docs Comment (insertComment)** anchored to the figure. Whenever one or more target figures or charts (e.g., VISUAL_1) are present, you MUST visually analyze the attached image data and output **at least one figure review comment in "elementSuggestions" for EVERY target figure (e.g., targetId: "VISUAL_1")** covering visual clarity, labels, data presentation, or alignment with the body text (do not leave elementSuggestions empty when figures exist).
4. Based on a deep understanding of the attached manuscript and your proofread revisions, synthesize a simple, high-impact "learningSummary" for the author covering:
   - revisionsDigest (What Was Revised / Flagged): A clear summary of the key types of edits, hints, and figure/table review comments made during this proofreading session.
   - weakPointsAndHabits (Areas for Improvement & Writing Habits): Patterns, recurring weaknesses, or tendencies observed in the author's draft and visual presentation that needed revision.
   - actionableTips (Future Learning Advice): Simple, practical takeaways the author can apply to improve their future writing.`;

  if (isHintOnly) {
    systemPrompt += `\n\n[IMPORTANT: 💡 Hint-Only Mode (Self-Revision Coaching Without Spoiling the Rewrite)]
"Hint-Only Mode" is currently enabled. In the Google Document, instead of applying inline text replacements (WriteMode.SUGGEST), your feedback on each flagged phrase ("originalText") will be anchored as a **Google Docs Comment (insertComment) showing ONLY the issue ("reason") and a coaching hint ("learningPoint")** so the author can practice revising the sentence themselves first.
Therefore, for every item in "suggestions":
- "reason": Clearly explain what the issue is in "originalText" (e.g., double superlative, uncountable noun error, redundant modifier, or unclear logic) WITHOUT giving away the exact rewritten sentence.
- "learningPoint": Provide a constructive coaching hint or guiding tip that helps the author figure out how to fix the phrase on their own (do NOT paste the full rewritten sentence inside "reason" or "learningPoint").
- "suggestedText": Still provide the ideal revised phrase here so the author can optionally check the reference rewrite in the sidebar after attempting their own revision.`;
  }

  if (isSelectionOnly) {
    systemPrompt += `\n\n[IMPORTANT: Proofread Selection Only Mode]
"Proofread Selection Only" mode is currently enabled, and the attached Markdown file (${manuscriptFileName}) contains **strictly the user's selected portion**. You MUST restrict your "suggestions" and "elementSuggestions" strictly to the selected items listed in "Target Editable Settled Text Blocks", "Target Tables", and "Target Figures & Charts" (do not critique the absence of unselected paragraphs, tables, or figures outside this excerpt).`;
  }

  if (hasExisting) {
    systemPrompt += `\n\n[IMPORTANT: Consideration of Existing Suggestions]
The target scope already contains the following pending suggestions:
${docData.existingSuggestions.map((s, idx) => `- Suggestion ${idx + 1} (ID: ${s.id}): Delete="${s.deletedText.replace(/\n/g, '')}" -> Insert="${s.insertedText.replace(/\n/g, '')}"`).join('\n')}
Please take these existing suggestions into account and propose additional improvements on the remaining settled text blocks, tables, and figures/charts.`;
  }

  if (hasResolved) {
    systemPrompt += `\n\n[Reference: Resolved Review History in Document]
The attached file also includes ${resolvedList.length} previously resolved review thread(s) (accepted/rejected suggestions or resolved comments). Avoid proposing edits that contradict or revert improvements the author has already accepted or resolved, and incorporate continuity into your coaching.`;
  }

  if (customPrompt && customPrompt.trim()) {
    systemPrompt += `\n\n[Additional Proofreading Instructions from User (Custom Prompt)]
Incorporate the following instructions as high-priority criteria in addition to the base proofreading rules:
"${customPrompt.trim()}"`;
  }

  const blocksContext = docData.editableBlocks.length > 0
    ? docData.editableBlocks.map((b, i) => `[Block ${i + 1} (${b.source === 'table' ? 'Table Cell' : 'Body'})] "${b.text}"`).join('\n')
    : 'None';

  const tablesContext = hasTables
    ? docData.tables.map(t => `${t.targetId} (${t.rowsCount} rows x ${t.colsCount} cols):\n${t.markdown}`).join('\n\n')
    : 'None';

  const visualsContext = hasVisuals
    ? docData.visualElements.map(v => `- ${v.targetId}: Type=${v.type}, Title="${v.title}", Description="${v.description}"`).join('\n')
    : 'None';

  const manuscriptSections = [];
  if (!isSelectionOnly && (hasTables || hasVisuals || hasExisting)) {
    manuscriptSections.push(`# Manuscript Structural Layout & Annotations\n${docData.annotatedText}`);
  }
  manuscriptSections.push(`# Target Editable Settled Text Blocks\n("originalText" in "suggestions" MUST be extracted as an exact match from these blocks)\n${blocksContext}`);
  if (hasTables) {
    manuscriptSections.push(`# Target Tables\n${tablesContext}`);
  }
  if (hasVisuals) {
    manuscriptSections.push(`# Target Figures & Charts\n${visualsContext}`);
  }
  if (hasResolved) {
    manuscriptSections.push(`# Resolved Review History (Reference Context)\n${resolvedList.map(formatResolvedReviewLine_).join('\n')}`);
  }

  const manuscriptFileContent = manuscriptSections.join('\n\n');
  const userMessage = `Please read the attached manuscript Markdown file (${manuscriptFileName}) along with any attached figure image files, and generate the proofreading suggestions, element review comments, and Writing Coach & Learning Summary adhering strictly to the JSON response schema.`;

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      overallFeedback: {
        type: 'STRING',
        description: 'Overall evaluation covering the manuscript and revisions (in English).'
      },
      learningSummary: {
        type: 'OBJECT',
        description: 'Simple, structured learning advice for the author based on the manuscript and the proofread revisions (100% in English).',
        properties: {
          revisionsDigest: {
            type: 'STRING',
            description: 'Simple summary of what kinds of revisions, hints, and improvements were made (in English).'
          },
          weakPointsAndHabits: {
            type: 'STRING',
            description: 'Summary of weak areas, recurring habits, or aspects that needed improvement in the draft (in English).'
          },
          actionableTips: {
            type: 'STRING',
            description: 'Simple, actionable advice for the author to keep in mind for future writing (in English).'
          }
        },
        required: ['revisionsDigest', 'weakPointsAndHabits', 'actionableTips']
      },
      existingSuggestionsNote: {
        type: 'STRING',
        description: 'Explanation of how existing suggestions or resolved reviews were considered (empty string if none, in English).'
      },
      suggestions: {
        type: 'ARRAY',
        description: 'Inline text revision suggestions (or flagged phrases for Hint-Only Mode) for target body text and table cells.',
        items: {
          type: 'OBJECT',
          properties: {
            originalText: {
              type: 'STRING',
              description: 'Exact substring from the Target Editable Settled Text Blocks to be replaced or flagged (no newlines).'
            },
            suggestedText: {
              type: 'STRING',
              description: 'The reference revised text after proofreading.'
            },
            category: {
              type: 'STRING',
              description: 'Revision category in English (e.g., Clarity & Logic, Table Phrasing, Word Choice, Conciseness, Grammar).'
            },
            reason: {
              type: 'STRING',
              description: isHintOnly
                ? 'Specific explanation of the issue in originalText without spoiling the exact rewrite (in English).'
                : 'Specific reason why this revision improves the text (in English).'
            },
            learningPoint: {
              type: 'STRING',
              description: isHintOnly
                ? 'Constructive coaching hint guiding the author on how to revise the phrase themselves (in English).'
                : 'Actionable writing takeaway for the user (in English).'
            }
          },
          required: ['originalText', 'suggestedText', 'category', 'reason', 'learningPoint']
        }
      },
      elementSuggestions: {
        type: 'ARRAY',
        description: 'Review comments for target figures/charts (e.g., VISUAL_1) or overall table structure (e.g., TABLE_1). These are inserted as Google Docs Comments (insertComment). When target figures exist, you MUST include at least one comment for every VISUAL_N.',
        items: {
          type: 'OBJECT',
          properties: {
            targetId: {
              type: 'STRING',
              description: 'Target element ID (e.g., "VISUAL_1", "TABLE_1").'
            },
            category: {
              type: 'STRING',
              description: 'Category in English (e.g., Figure Review Comment, Chart Clarity, Table Structure, Text-Visual Alignment).'
            },
            suggestion: {
              type: 'STRING',
              description: 'Specific review comment and improvement advice for this figure, chart, or table (in English).'
            },
            reason: {
              type: 'STRING',
              description: 'Reason why this improvement is recommended (in English).'
            },
            learningPoint: {
              type: 'STRING',
              description: 'Learning takeaway regarding visual or tabular communication (in English).'
            }
          },
          required: ['targetId', 'category', 'suggestion', 'reason', 'learningPoint']
        }
      }
    },
    required: ['overallFeedback', 'learningSummary', 'existingSuggestionsNote', 'suggestions', 'elementSuggestions']
  };

  return { systemPrompt, manuscriptFileName, manuscriptFileContent, userMessage, responseSchema };
}

/**
 * Uploads the target manuscript Markdown file (`text/markdown`) and any binary image data
 * for visual elements in parallel to the Gemini File API using the resumable upload protocol,
 * returning their temporary file URIs (`fileData.fileUri`) and resource names (`file.name`) for cleanup.
 *
 * @param {string} manuscriptMarkdown UTF-8 Markdown content representing the manuscript or selected excerpt.
 * @param {string} manuscriptFileName Display file name for the manuscript Markdown file.
 * @param {Array<Object>} visualElements Visual elements extracted from the document.
 * @param {string} apiKey Gemini API key.
 * @return {Array<Object>} Uploaded file metadata objects ({ kind, targetId, type, title, mimeType, fileName, fileUri }).
 */
function uploadManuscriptAndVisualsToGeminiFiles_(manuscriptMarkdown, manuscriptFileName, visualElements, apiKey) {
  const itemsToUpload = [];

  if (manuscriptMarkdown && typeof manuscriptMarkdown === 'string' && manuscriptMarkdown.trim().length > 0) {
    const fname = manuscriptFileName || 'manuscript_context.md';
    const textBlob = Utilities.newBlob(manuscriptMarkdown, 'text/markdown', fname);
    const textBytes = textBlob.getBytes();
    if (textBytes && textBytes.length > 0) {
      itemsToUpload.push({
        kind: 'MANUSCRIPT',
        targetId: 'MANUSCRIPT_FILE',
        type: 'Markdown',
        title: fname,
        mimeType: 'text/markdown',
        bytes: textBytes
      });
    }
  }

  const validTargets = (visualElements || [])
    .filter(v => v.contentUri && v.contentUri.startsWith('http'));

  // 1. Fetch binary image blobs from Google Docs contentUri in parallel (if any figures exist)
  if (validTargets.length > 0) {
    const fetchRequests = validTargets.map(v => ({
      url: v.contentUri,
      method: 'get',
      muteHttpExceptions: true
    }));

    const fetchResponses = UrlFetchApp.fetchAll(fetchRequests);

    fetchResponses.forEach((res, idx) => {
      if (res.getResponseCode() === 200) {
        const blob = res.getBlob();
        const bytes = blob.getBytes();
        if (bytes && bytes.length > 0) {
          let mimeType = blob.getContentType() || 'image/png';
          if (!mimeType.startsWith('image/')) {
            mimeType = 'image/png';
          }
          itemsToUpload.push({
            kind: 'VISUAL',
            targetId: validTargets[idx].targetId,
            type: validTargets[idx].type,
            title: validTargets[idx].title,
            mimeType: mimeType,
            bytes: bytes
          });
        }
      }
    });
  }

  if (itemsToUpload.length === 0) return [];

  // 2. Initiate Resumable Upload sessions on the Gemini File API in parallel for both manuscript & figures
  const uploadInitEndpoint = 'https://generativelanguage.googleapis.com/upload/v1beta/files';
  const startRequests = itemsToUpload.map(item => ({
    url: uploadInitEndpoint,
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey,
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(item.bytes.length),
      'X-Goog-Upload-Header-Content-Type': item.mimeType
    },
    payload: JSON.stringify({
      file: {
        display_name: (item.kind === 'MANUSCRIPT' ? item.title : `${item.targetId}_${item.title || 'figure'}`).slice(0, 100)
      }
    }),
    muteHttpExceptions: true
  }));

  const startResponses = UrlFetchApp.fetchAll(startRequests);
  const sessionItems = [];

  startResponses.forEach((res, idx) => {
    if (res.getResponseCode() === 200) {
      const headers = res.getAllHeaders() || {};
      let uploadUrl = '';
      Object.keys(headers).forEach(k => {
        if (k.toLowerCase() === 'x-goog-upload-url') {
          const val = headers[k];
          uploadUrl = Array.isArray(val) ? val[0] : String(val);
        }
      });
      if (uploadUrl && uploadUrl.trim()) {
        sessionItems.push({
          uploadUrl: uploadUrl.trim(),
          item: itemsToUpload[idx]
        });
      }
    }
  });

  if (sessionItems.length === 0) return [];

  // 3. Upload bytes and finalize each file in parallel
  const uploadByteRequests = sessionItems.map(session => ({
    url: session.uploadUrl,
    method: 'post',
    headers: {
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize'
    },
    payload: session.item.bytes,
    muteHttpExceptions: true
  }));

  const uploadByteResponses = UrlFetchApp.fetchAll(uploadByteRequests);
  const uploadedFiles = [];

  uploadByteResponses.forEach((res, idx) => {
    if (res.getResponseCode() === 200) {
      try {
        const json = JSON.parse(res.getContentText());
        const fileObj = json.file || json;
        if (fileObj && fileObj.uri && fileObj.name) {
          const srcItem = sessionItems[idx].item;
          uploadedFiles.push({
            kind: srcItem.kind,
            targetId: srcItem.targetId,
            type: srcItem.type,
            title: srcItem.title,
            mimeType: fileObj.mimeType || srcItem.mimeType,
            fileName: fileObj.name,
            fileUri: fileObj.uri
          });
        }
      } catch (e) {}
    }
  });

  return uploadedFiles;
}

/**
 * Deletes temporary uploaded files from the Gemini File API in parallel after content generation
 * so that no residual files remain on the server.
 *
 * @param {Array<Object>} uploadedFiles List of uploaded file metadata objects containing `fileName`.
 * @param {string} apiKey Gemini API key.
 */
function deleteGeminiFiles_(uploadedFiles, apiKey) {
  const validFiles = (uploadedFiles || []).filter(uf => uf && uf.fileName);
  if (validFiles.length === 0) return;

  try {
    const deleteRequests = validFiles.map(uf => {
      const normalizedName = uf.fileName.startsWith('files/') ? uf.fileName : `files/${uf.fileName}`;
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/${normalizedName}`,
        method: 'delete',
        headers: {
          'x-goog-api-key': apiKey
        },
        muteHttpExceptions: true
      };
    });

    UrlFetchApp.fetchAll(deleteRequests);
  } catch (e) {
    // Suppress cleanup errors so they never mask primary execution results
  }
}

/**
 * ============================================================================
 * STEP 3: Build Request Body for Inline Suggestions / Hint Comments & Visual/Table Comments
 * ============================================================================
 */
function step3_buildRequestBody(docData, aiResult, lang, hintOnly) {
  const activeTabId = (docData && docData.activeTabId) ? docData.activeTabId : '';
  const editableBlocks = (docData && docData.editableBlocks) ? docData.editableBlocks : [];
  const rawSuggestions = (aiResult && aiResult.suggestions) ? aiResult.suggestions : [];
  const rawElementSuggestions = (aiResult && aiResult.elementSuggestions) ? aiResult.elementSuggestions : [];
  const isHintOnly = Boolean(hintOnly || (aiResult && aiResult.hintOnly));

  const matchedItems = [];
  const usedRanges = [];

  rawSuggestions.forEach((sug, idx) => {
    const orig = (sug.originalText || '').trim();
    const repl = (sug.suggestedText !== undefined && sug.suggestedText !== null) ? String(sug.suggestedText) : '';

    if (!orig || (!isHintOnly && orig === repl)) return;

    let foundRange = null;

    for (let b = 0; b < editableBlocks.length; b++) {
      const block = editableBlocks[b];
      let searchFrom = 0;

      while (searchFrom < block.text.length) {
        const pos = block.text.indexOf(orig, searchFrom);
        if (pos === -1) break;

        const absStart = block.startIndex + pos;
        const absEnd = absStart + orig.length;

        const isOverlapping = usedRanges.some(r => !(absEnd <= r.startIndex || absStart >= r.endIndex));
        if (!isOverlapping) {
          foundRange = { startIndex: absStart, endIndex: absEnd };
          usedRanges.push(foundRange);
          break;
        }
        searchFrom = pos + 1;
      }
      if (foundRange) break;
    }

    if (foundRange) {
      matchedItems.push({
        id: `sug_item_${idx + 1}`,
        originalText: orig,
        suggestedText: repl,
        category: sug.category || (lang === 'ja' ? '推敲' : 'Revision'),
        reason: sug.reason || '',
        learningPoint: sug.learningPoint || '',
        startIndex: foundRange.startIndex,
        endIndex: foundRange.endIndex,
        tabId: activeTabId,
        hintOnly: isHintOnly
      });
    }
  });

  matchedItems.sort((a, b) => b.startIndex - a.startIndex);

  const isJa = lang === 'ja';
  const suggestRequests = [];
  const hintCommentRequests = [];

  if (isHintOnly) {
    matchedItems.forEach(item => {
      const hintCommentText = formatHintComment_(item, isJa);
      const anchorRange = {
        startIndex: item.startIndex,
        endIndex: Math.max(item.startIndex + 1, item.endIndex)
      };
      if (activeTabId) {
        anchorRange.tabId = activeTabId;
      }
      hintCommentRequests.push({
        insertComment: {
          content: hintCommentText,
          range: anchorRange
        }
      });
    });
  } else {
    matchedItems.forEach(item => {
      const deleteRange = {
        startIndex: item.startIndex,
        endIndex: item.endIndex
      };
      if (activeTabId) {
        deleteRange.tabId = activeTabId;
      }
      suggestRequests.push({
        deleteContentRange: {
          range: deleteRange
        }
      });

      if (item.suggestedText.length > 0) {
        const insertLoc = {
          index: item.startIndex
        };
        if (activeTabId) {
          insertLoc.tabId = activeTabId;
        }
        suggestRequests.push({
          insertText: {
            location: insertLoc,
            text: item.suggestedText
          }
        });
      }
    });
  }

  const matchedElementItems = [];
  const elementMap = {};
  (docData.visualElements || []).forEach(v => { elementMap[v.targetId] = v; });
  (docData.tables || []).forEach(t => { elementMap[t.targetId] = t; });

  rawElementSuggestions.forEach((elSug, idx) => {
    const target = elementMap[elSug.targetId];
    if (target) {
      const isVisual = String(elSug.targetId || '').startsWith('VISUAL_');
      matchedElementItems.push({
        id: `el_sug_${idx + 1}`,
        targetId: elSug.targetId,
        elementKind: isVisual ? 'VISUAL' : 'TABLE',
        category: elSug.category || (isVisual
          ? (isJa ? '図への推敲コメント' : 'Figure Review Comment')
          : (isJa ? '表への推敲コメント' : 'Table Review Comment')),
        suggestion: elSug.suggestion || '',
        reason: elSug.reason || '',
        learningPoint: elSug.learningPoint || '',
        startIndex: target.startIndex,
        endIndex: Math.max(target.startIndex + 1, target.endIndex),
        paraStartIndex: target.paraStartIndex || target.startIndex,
        paraEndIndex: target.paraEndIndex || Math.max(target.startIndex + 1, target.endIndex),
        tabId: activeTabId
      });
    }
  });

  const suggestBatchUpdateBody = isHintOnly
    ? { requests: hintCommentRequests }
    : {
        writeControl: {
          writeMode: 'SUGGEST'
        },
        requests: suggestRequests
      };

  return {
    activeTabId: activeTabId,
    hintOnly: isHintOnly,
    matchedCount: matchedItems.length + matchedElementItems.length,
    matchedTextCount: matchedItems.length,
    matchedElementCount: matchedElementItems.length,
    matchedItems: matchedItems,
    matchedElementItems: matchedElementItems,
    hintCommentRequests: hintCommentRequests,
    suggestBatchUpdateBody: suggestBatchUpdateBody
  };
}

/**
 * ============================================================================
 * STEP 4: Apply Suggestions / Hint Comments and Element Comments via documents.batchUpdate
 * ============================================================================
 */
function step4_applySuggestions(builtData, lang) {
  const isJa = lang === 'ja';
  const activeTabId = (builtData && builtData.activeTabId) ? builtData.activeTabId : '';
  const isHintOnly = Boolean(builtData && builtData.hintOnly);
  const textItems = (builtData && builtData.matchedItems) ? builtData.matchedItems : [];
  const elementItems = (builtData && builtData.matchedElementItems) ? builtData.matchedElementItems : [];

  if (textItems.length === 0 && elementItems.length === 0) {
    throw new Error(isJa ? '適用可能な提案またはコメントリクエストがありません。' : 'No applicable suggestion or comment requests found.');
  }

  const docId = DocumentApp.getActiveDocument().getId();
  const suggestionReplyRequests = [];

  // Phase 1: Apply either Hint-Only anchored comments (insertComment) OR inline text suggestions (WriteMode.SUGGEST + addCommentReply)
  if (textItems.length > 0) {
    if (isHintOnly) {
      const prebuiltHintReqs = Array.isArray(builtData.hintCommentRequests) && builtData.hintCommentRequests.length > 0
        ? builtData.hintCommentRequests
        : textItems.map(item => {
            const anchorRange = {
              startIndex: item.startIndex,
              endIndex: Math.max(item.startIndex + 1, item.endIndex)
            };
            if (item.tabId || activeTabId) {
              anchorRange.tabId = item.tabId || activeTabId;
            }
            return {
              insertComment: {
                content: formatHintComment_(item, isJa),
                range: anchorRange
              }
            };
          });

      if (prebuiltHintReqs.length > 0) {
        executeSuggestionActionRequestsSafely_(docId, prebuiltHintReqs);
      }
    } else {
      const suggestResJson = executeBatchUpdate_(docId, builtData.suggestBatchUpdateBody);
      const suggestionResponses = suggestResJson.suggestionResponses || [];
      let reqCursor = 0;

      textItems.forEach(item => {
        const numReqsForItem = item.suggestedText.length > 0 ? 2 : 1;
        let foundSuggestionId = null;

        for (let k = 0; k < numReqsForItem; k++) {
          const sr = suggestionResponses[reqCursor + k];
          if (sr && sr.createdSuggestionIds && sr.createdSuggestionIds.length > 0) {
            foundSuggestionId = sr.createdSuggestionIds[0];
          }
        }
        reqCursor += numReqsForItem;

        const commentText = formatLearningComment_(item, isJa);

        if (foundSuggestionId) {
          suggestionReplyRequests.push({
            addCommentReply: {
              suggestionId: foundSuggestionId,
              post: {
                content: commentText
              }
            }
          });
        } else {
          const anchorRange = {
            startIndex: item.startIndex,
            endIndex: item.startIndex + Math.max(1, item.suggestedText.length)
          };
          if (item.tabId || activeTabId) {
            anchorRange.tabId = item.tabId || activeTabId;
          }
          suggestionReplyRequests.push({
            insertComment: {
              content: commentText,
              range: anchorRange
            }
          });
        }
      });

      if (suggestionReplyRequests.length > 0) {
        executeSuggestionActionRequestsSafely_(docId, suggestionReplyRequests);
      }
    }
  }

  // Phase 2: Create Google Docs Comments (insertComment) for Figures/Charts (VISUAL_1) and Tables (TABLE_1).
  // Re-fetch and re-parse the document after Phase 1 when inline text suggestions were applied
  // so that startIndex/endIndex reflect any index shifts caused by WriteMode.SUGGEST.
  let appliedElementCommentsCount = 0;
  if (elementItems.length > 0) {
    let freshElementMap = {};
    let freshBlocks = [];
    if (!isHintOnly && textItems.length > 0) {
      try {
        const freshDocJson = fetchRawDocumentJson_(docId);
        const freshParsed = parseDocumentStructure_(freshDocJson, {
          activeTabId: activeTabId,
          selectionOnly: false,
          isJa: isJa
        });
        (freshParsed.visualElements || []).forEach(v => { freshElementMap[v.targetId] = v; });
        (freshParsed.tables || []).forEach(t => { freshElementMap[t.targetId] = t; });
        freshBlocks = freshParsed.editableBlocks || [];
      } catch (e) {
        // Fallback to pre-Phase-1 coordinates if re-fetch fails
      }
    }

    elementItems.forEach(elItem => {
      const elCommentText = formatElementComment_(elItem, isJa);
      const freshTarget = freshElementMap[elItem.targetId] || elItem;
      const effTabId = elItem.tabId || activeTabId;

      const candidateRanges = [];
      const addCandidate = (sIdx, eIdx) => {
        const s = Math.max(1, Number(sIdx || 1));
        const e = Math.max(s + 1, Number(eIdx || (s + 1)));
        const r = { startIndex: s, endIndex: e };
        if (effTabId) r.tabId = effTabId;
        const key = `${r.startIndex}:${r.endIndex}`;
        if (!candidateRanges.some(existing => `${existing.startIndex}:${existing.endIndex}` === key)) {
          candidateRanges.push(r);
        }
      };

      // 1. Exact element range (inlineObjectElement range for figures, first cell range for tables)
      addCandidate(freshTarget.startIndex, freshTarget.endIndex);

      // 2. Containing paragraph range if different from the single inlineObjectElement range
      if (freshTarget.paraStartIndex && freshTarget.paraEndIndex) {
        addCandidate(freshTarget.paraStartIndex, freshTarget.paraEndIndex);
      }

      // 3. Nearest settled text block (e.g., figure caption or adjacent paragraph) as a guaranteed fallback
      if (freshBlocks.length > 0) {
        const targetPos = Number(freshTarget.startIndex || 1);
        const sortedByDist = freshBlocks.slice().sort((a, b) => {
          const distA = Math.min(Math.abs(a.startIndex - targetPos), Math.abs(a.endIndex - targetPos));
          const distB = Math.min(Math.abs(b.startIndex - targetPos), Math.abs(b.endIndex - targetPos));
          return distA - distB;
        });
        const nearestBlock = sortedByDist[0];
        if (nearestBlock) {
          addCandidate(nearestBlock.startIndex, nearestBlock.endIndex);
        }
      }

      for (let i = 0; i < candidateRanges.length; i++) {
        const ok = tryInsertCommentRequest_(docId, elCommentText, candidateRanges[i]);
        if (ok) {
          appliedElementCommentsCount++;
          break;
        }
      }
    });
  }

  return {
    success: true,
    hintOnly: isHintOnly,
    appliedSuggestionsCount: textItems.length + elementItems.length,
    appliedTextSuggestionsCount: textItems.length,
    appliedElementCommentsCount: appliedElementCommentsCount
  };
}

/**
 * Attempts to execute a single insertComment request via documents.batchUpdate
 * and returns true if the Google Docs API accepted the anchor range (HTTP 200).
 *
 * @param {string} docId Document ID.
 * @param {string} content Comment text content.
 * @param {Object} range Anchor range ({ startIndex, endIndex, tabId? }).
 * @return {boolean} True if HTTP 200.
 */
function tryInsertCommentRequest_(docId, content, range) {
  const token = ScriptApp.getOAuthToken();
  const endpoint = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;
  const res = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({
      requests: [
        {
          insertComment: {
            content: content,
            range: range
          }
        }
      ]
    }),
    muteHttpExceptions: true
  });
  return res.getResponseCode() === 200;
}

/**
 * Helper to execute documents.batchUpdate.
 */
function executeBatchUpdate_(docId, payload, ignoreErrors) {
  const token = ScriptApp.getOAuthToken();
  const endpoint = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;
  const res = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (!ignoreErrors && res.getResponseCode() !== 200) {
    throw new Error(`Google Docs batchUpdate Error (${res.getResponseCode()}): ${res.getContentText()}`);
  }

  try {
    return JSON.parse(res.getContentText());
  } catch (e) {
    return {};
  }
}

/**
 * Formats the educational comment attached to each text suggestion card.
 */
function formatLearningComment_(item, isJa) {
  if (isJa) {
    return [
      `【DocuMentor AI｜${item.category}】`,
      `💡 推敲の理由:`,
      `${item.reason}`,
      ``,
      `🎓 学習ポイント:`,
      `${item.learningPoint}`
    ].join('\n');
  }
  return [
    `[DocuMentor AI | ${item.category}]`,
    `💡 Reason for Revision:`,
    `${item.reason}`,
    ``,
    `🎓 Learning Point:`,
    `${item.learningPoint}`
  ].join('\n');
}

/**
 * Formats the coaching hint comment anchored in Hint-Only Mode (without revealing suggestedText).
 */
function formatHintComment_(item, isJa) {
  if (isJa) {
    return [
      `【DocuMentor AI｜💡 ヒントモード：${item.category}】`,
      `🎯 対象箇所: 「${item.originalText}」`,
      ``,
      `💡 見直しの理由（問題点）:`,
      `${item.reason}`,
      ``,
      `🎓 推敲のヒント（自分で書き直してみましょう！）:`,
      `${item.learningPoint}`
    ].join('\n');
  }
  return [
    `[DocuMentor AI | 💡 Hint Mode: ${item.category}]`,
    `🎯 Flagged Phrase: "${item.originalText}"`,
    ``,
    `💡 Issue to Check:`,
    `${item.reason}`,
    ``,
    `🎓 Coaching Hint (Try Rewriting Yourself!):`,
    `${item.learningPoint}`
  ].join('\n');
}

/**
 * Formats the anchored review comment for a Figure, Chart, or Table.
 */
function formatElementComment_(elItem, isJa) {
  const isVisual = String(elItem.targetId || '').startsWith('VISUAL_');
  if (isJa) {
    return [
      `【DocuMentor AI｜${elItem.targetId}: ${elItem.category}】`,
      `${isVisual ? '🖼️ 図への推敲コメント:' : '📊 表への推敲コメント:'}`,
      `${elItem.suggestion}`,
      ``,
      `💡 理由:`,
      `${elItem.reason}`,
      ``,
      `🎓 学習ポイント:`,
      `${elItem.learningPoint}`
    ].join('\n');
  }
  return [
    `[DocuMentor AI | ${elItem.targetId}: ${elItem.category}]`,
    `${isVisual ? '🖼️ Figure Review Comment:' : '📊 Table Review Comment:'}`,
    `${elItem.suggestion}`,
    ``,
    `💡 Reason:`,
    `${elItem.reason}`,
    ``,
    `🎓 Learning Point:`,
    `${elItem.learningPoint}`
  ].join('\n');
}

/**
 * Retrieves the stored Gemini API key (from ScriptProperties or UserProperties)
 * or throws a localized error if missing.
 */
function getRequiredApiKey_(isJa) {
  const keyInfo = getEffectiveApiKeyInfo_();
  if (!keyInfo.hasApiKey || !keyInfo.apiKey) {
    throw new Error(isJa
      ? 'Gemini APIキーが設定されていません。サイドバー上部の設定からAPIキーを保存してください（学校・組織利用の場合は管理者がスクリプトプロパティに GEMINI_API_KEY を設定してください）。'
      : 'Gemini API key is not configured. Please save your API key in the settings section above (or ask your administrator to configure GEMINI_API_KEY in Script Properties).'
    );
  }
  return keyInfo.apiKey;
}

/**
 * Calls the Gemini generateContent REST endpoint.
 */
function callGeminiApiRaw_(model, apiKey, payload) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = res.getResponseCode();
  const body = res.getContentText();

  if (code !== 200) {
    throw new Error(`Gemini API Error (${code} / Model: ${model}): ${body}`);
  }

  const json = JSON.parse(body);
  const candidate = json.candidates && json.candidates[0];
  const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];

  if (!part || typeof part.text !== 'string') {
    throw new Error('No valid text response received from Gemini API.');
  }

  return part.text;
}

/**
 * ============================================================================
 * Custom Modal Dialogs: About Application & Learning Summary
 * ============================================================================
 */

/**
 * Displays a styled custom modal dialog in Google Docs showing the developer name,
 * GitHub repository URL, and application version when "DocuMentor AI" is clicked.
 *
 * @param {string=} lang Current UI language ('en' or 'ja').
 * @return {Object} Status object.
 */
function showAboutDialog(lang) {
  const isJa = lang === 'ja';
  const dialogTitle = isJa ? `${APP_NAME} について` : `About ${APP_NAME}`;
  const htmlContent = buildAboutDialogHtml_(isJa);
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(440)
    .setHeight(330);
  DocumentApp.getUi().showModalDialog(htmlOutput, dialogTitle);
  return { success: true };
}

/**
 * Displays a styled custom modal dialog in Google Docs showing the
 * "🎓 Writing Coach & Learning Summary" after proofreading completes,
 * equipped with a one-click Copy to Clipboard button.
 *
 * @param {Object} summaryPayload Object containing { learningSummary, overallFeedback, modelUsed, appliedCount }.
 * @param {string=} lang Current UI language ('en' or 'ja').
 * @return {Object} Status object.
 */
function showLearningSummaryDialog(summaryPayload, lang) {
  const isJa = lang === 'ja';
  const dialogTitle = isJa
    ? '🎓 執筆者への学習アドバイスまとめ'
    : '🎓 Writing Coach & Learning Summary';
  const htmlContent = buildLearningSummaryDialogHtml_(summaryPayload || {}, isJa);
  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(560)
    .setHeight(520);
  DocumentApp.getUi().showModalDialog(htmlOutput, dialogTitle);
  return { success: true };
}

/**
 * Escapes HTML special characters for safe server-side dialog rendering.
 *
 * @param {string} str Input string.
 * @return {string} Escaped HTML string.
 */
function escapeHtmlServer_(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Builds the HTML string for the About Application custom modal dialog.
 *
 * @param {boolean} isJa True if Japanese UI mode.
 * @return {string} Complete HTML document for the dialog.
 */
function buildAboutDialogHtml_(isJa) {
  const subtitle = isJa
    ? 'Google Docs AI推敲＆マルチモーダル提案コーチ'
    : 'AI-Powered Proofreading & Multimodal Suggestion Coach';
  const lblVersion = isJa ? 'バージョン' : 'Version';
  const lblAuthor = isJa ? '開発者氏名' : 'Developer';
  const lblRepo = isJa ? 'GitHub リポジトリ' : 'GitHub Repository';
  const btnClose = isJa ? '閉じる' : 'Close';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    :root {
      --bg-primary: #0b0f19;
      --bg-card: rgba(22, 30, 49, 0.9);
      --border-color: rgba(99, 102, 241, 0.35);
      --accent-indigo: #6366f1;
      --accent-cyan: #06b6d4;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans JP", sans-serif;
      background-color: var(--bg-primary);
      background-image:
        radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.15) 0%, transparent 50%);
      color: var(--text-main);
      padding: 18px;
      font-size: 13px;
      line-height: 1.5;
    }
    .hero {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.22), rgba(6, 182, 212, 0.12));
      border: 1px solid var(--border-color);
      border-radius: 12px;
      margin-bottom: 14px;
    }
    .hero-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      color: #fff;
      box-shadow: 0 0 16px rgba(99, 102, 241, 0.55);
      flex-shrink: 0;
    }
    .hero-title {
      font-size: 17px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.3px;
    }
    .hero-sub {
      font-size: 11px;
      color: #67e8f9;
      margin-top: 2px;
    }
    .info-list {
      background: var(--bg-card);
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 16px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      gap: 12px;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-size: 11.5px;
      color: var(--text-muted);
      font-weight: 600;
      flex-shrink: 0;
    }
    .info-val {
      font-size: 12.5px;
      font-weight: 600;
      color: #f8fafc;
      text-align: right;
      word-break: break-all;
    }
    .badge-ver {
      display: inline-block;
      padding: 2px 9px;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.18);
      border: 1px solid rgba(16, 185, 129, 0.45);
      color: #6ee7b7;
      font-size: 11.5px;
      font-weight: 700;
    }
    a.repo-link {
      color: #38bdf8;
      text-decoration: none;
      transition: color 0.15s;
    }
    a.repo-link:hover {
      color: #67e8f9;
      text-decoration: underline;
    }
    .footer-actions {
      display: flex;
      justify-content: flex-end;
    }
    .btn-close {
      background: linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan));
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 8px 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }
    .btn-close:hover {
      opacity: 0.92;
    }
  </style>
</head>
<body>
  <div class="hero">
    <div class="hero-icon">✦</div>
    <div>
      <div class="hero-title">${escapeHtmlServer_(APP_NAME)}</div>
      <div class="hero-sub">${escapeHtmlServer_(subtitle)}</div>
    </div>
  </div>

  <div class="info-list">
    <div class="info-row">
      <span class="info-label">${escapeHtmlServer_(lblAuthor)}</span>
      <span class="info-val">${escapeHtmlServer_(APP_AUTHOR)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">${escapeHtmlServer_(lblVersion)}</span>
      <span class="info-val"><span class="badge-ver">${escapeHtmlServer_(APP_VERSION)}</span></span>
    </div>
    <div class="info-row">
      <span class="info-label">${escapeHtmlServer_(lblRepo)}</span>
      <span class="info-val">
        <a class="repo-link" href="${escapeHtmlServer_(APP_REPO_URL)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtmlServer_(APP_REPO_URL)}
        </a>
      </span>
    </div>
  </div>

  <div class="footer-actions">
    <button class="btn-close" onclick="google.script.host.close()">${escapeHtmlServer_(btnClose)}</button>
  </div>
</body>
</html>`;
}

/**
 * Builds the HTML string for the "🎓 Writing Coach & Learning Summary" custom modal dialog,
 * including a one-click Copy to Clipboard button.
 *
 * @param {Object} summaryPayload Object containing { learningSummary, overallFeedback, modelUsed, appliedCount, hintOnly, analyzedResolvedCount }.
 * @param {boolean} isJa True if Japanese UI mode.
 * @return {string} Complete HTML document for the dialog.
 */
function buildLearningSummaryDialogHtml_(summaryPayload, isJa) {
  const ls = summaryPayload.learningSummary || {};
  const revisionsDigest = ls.revisionsDigest || '';
  const weakPointsAndHabits = ls.weakPointsAndHabits || '';
  const actionableTips = ls.actionableTips || '';
  const overallFeedback = summaryPayload.overallFeedback || '';
  const modelUsed = summaryPayload.modelUsed || DEFAULT_MODEL;
  const appliedCount = Number(summaryPayload.appliedCount || 0);
  const isHintOnly = Boolean(summaryPayload.hintOnly);

  const lblHeaderTitle = isJa
    ? '🎓 執筆者への学習アドバイスまとめ'
    : '🎓 Writing Coach & Learning Summary';

  const isExistingMode = summaryPayload.sourceMode === 'existing';
  const sugCount = Number(summaryPayload.analyzedSuggestionsCount || 0);
  const comCount = Number(summaryPayload.analyzedCommentsCount || 0);
  const resCount = Number(summaryPayload.analyzedResolvedCount || 0);

  let lblSubBadge;
  if (isExistingMode) {
    lblSubBadge = isJa
      ? `未解決の提案: ${sugCount}件 • コメント: ${comCount}件 • 解決済み履歴: ${resCount}件 • モデル: ${modelUsed}`
      : `Active Suggestions: ${sugCount} • Comments: ${comCount} • Resolved History: ${resCount} • Model: ${modelUsed}`;
  } else if (isHintOnly) {
    lblSubBadge = isJa
      ? `💡 ヒントモード（適用ヒント: ${appliedCount}件）• モデル: ${modelUsed}`
      : `💡 Hint-Only Mode (Applied Hints: ${appliedCount}) • Model: ${modelUsed}`;
  } else {
    lblSubBadge = isJa
      ? `適用済み提案: ${appliedCount}件 • モデル: ${modelUsed}`
      : `Applied Suggestions: ${appliedCount} • Model: ${modelUsed}`;
  }

  const lblOverall = isJa ? '📋 原稿全体・推敲結果の総合講評' : '📋 Overall Manuscript Evaluation';
  const lblRevisions = isExistingMode
    ? (isJa ? '🛠️ どのような修正・指摘が行われているか' : '🛠️ What Was Revised & Pointed Out')
    : (isHintOnly
        ? (isJa ? '💡 指摘箇所と自力推敲ヒントの要点' : '💡 What Was Flagged & Hinted')
        : (isJa ? '🛠️ どのような修正を行ったか' : '🛠️ What Was Revised'));
  const lblWeakness = isJa ? '🔍 苦手なところ・修正すべき傾向' : '🔍 Areas for Improvement & Writing Habits';
  const lblTips = isJa ? '🌱 今後の執筆に向けた学習アドバイス' : '🌱 Actionable Advice for Future Writing';

  const btnCopyLabel = isJa ? '📋 クリップボードにコピー' : '📋 Copy to Clipboard';
  const btnCopiedLabel = isJa ? '✅ コピーしました！' : '✅ Copied to Clipboard!';
  const btnCloseLabel = isJa ? '閉じる' : 'Close';

  const plainTextForCopy = isJa
    ? [
        `【${lblHeaderTitle} (${APP_NAME} ${APP_VERSION})】`,
        ``,
        `■ ${lblOverall}`,
        overallFeedback,
        ``,
        `■ ${lblRevisions}`,
        revisionsDigest,
        ``,
        `■ ${lblWeakness}`,
        weakPointsAndHabits,
        ``,
        `■ ${lblTips}`,
        actionableTips
      ].join('\n')
    : [
        `[${lblHeaderTitle} (${APP_NAME} ${APP_VERSION})]`,
        ``,
        `■ ${lblOverall}`,
        overallFeedback,
        ``,
        `■ ${lblRevisions}`,
        revisionsDigest,
        ``,
        `■ ${lblWeakness}`,
        weakPointsAndHabits,
        ``,
        `■ ${lblTips}`,
        actionableTips
      ].join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    :root {
      --bg-primary: #0b0f19;
      --bg-card: rgba(22, 30, 49, 0.92);
      --border-color: rgba(16, 185, 129, 0.4);
      --accent-indigo: #6366f1;
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans JP", sans-serif;
      background-color: var(--bg-primary);
      background-image:
        radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.15) 0%, transparent 45%),
        radial-gradient(circle at 90% 90%, rgba(6, 182, 212, 0.14) 0%, transparent 45%);
      color: var(--text-main);
      padding: 16px 18px;
      font-size: 13px;
      line-height: 1.55;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .dialog-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 11px 14px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.12));
      border: 1px solid var(--border-color);
      border-radius: 10px;
      margin-bottom: 12px;
      flex-shrink: 0;
    }
    .banner-title {
      font-size: 14.5px;
      font-weight: 700;
      color: #6ee7b7;
    }
    .banner-sub {
      font-size: 11px;
      color: #cbd5e1;
      margin-top: 2px;
    }
    .content-scroll {
      flex: 1;
      overflow-y: auto;
      padding-right: 4px;
      margin-bottom: 12px;
    }
    .advice-block {
      background: var(--bg-card);
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 10px;
      padding: 11px 13px;
      margin-bottom: 10px;
    }
    .advice-block:last-child {
      margin-bottom: 0;
    }
    .block-title {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 5px;
      display: block;
    }
    .block-title.overall { color: #a5b4fc; }
    .block-title.revisions { color: #38bdf8; }
    .block-title.weakness { color: #fbbf24; }
    .block-title.tips { color: #34d399; }
    .block-text {
      font-size: 12.5px;
      color: #e2e8f0;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
    }
    .btn {
      padding: 9px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-copy {
      background: linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan));
      color: #042f2e;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
    }
    .btn-copy:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 15px rgba(6, 182, 212, 0.45);
    }
    .btn-close {
      background: rgba(30, 41, 59, 0.9);
      color: #e2e8f0;
      border: 1px solid rgba(148, 163, 184, 0.35);
    }
    .btn-close:hover {
      background: rgba(51, 65, 85, 0.95);
    }
    textarea.hidden-copy {
      position: fixed;
      left: -9999px;
      top: -9999px;
      opacity: 0;
    }
  </style>
</head>
<body>
  <div class="dialog-banner">
    <div>
      <div class="banner-title">${escapeHtmlServer_(lblHeaderTitle)}</div>
      <div class="banner-sub">${escapeHtmlServer_(lblSubBadge)}</div>
    </div>
  </div>

  <div class="content-scroll">
    ${overallFeedback ? `
    <div class="advice-block">
      <span class="block-title overall">${escapeHtmlServer_(lblOverall)}</span>
      <div class="block-text">${escapeHtmlServer_(overallFeedback)}</div>
    </div>` : ''}

    <div class="advice-block">
      <span class="block-title revisions">${escapeHtmlServer_(lblRevisions)}</span>
      <div class="block-text">${escapeHtmlServer_(revisionsDigest)}</div>
    </div>

    <div class="advice-block">
      <span class="block-title weakness">${escapeHtmlServer_(lblWeakness)}</span>
      <div class="block-text">${escapeHtmlServer_(weakPointsAndHabits)}</div>
    </div>

    <div class="advice-block">
      <span class="block-title tips">${escapeHtmlServer_(lblTips)}</span>
      <div class="block-text">${escapeHtmlServer_(actionableTips)}</div>
    </div>
  </div>

  <textarea id="copySourceText" class="hidden-copy" readonly>${escapeHtmlServer_(plainTextForCopy)}</textarea>

  <div class="dialog-footer">
    <button id="btnCopySummary" class="btn btn-copy" onclick="copySummaryToClipboard()">
      <span id="lblCopyBtn">${escapeHtmlServer_(btnCopyLabel)}</span>
    </button>
    <button class="btn btn-close" onclick="google.script.host.close()">
      ${escapeHtmlServer_(btnCloseLabel)}
    </button>
  </div>

  <script>
    const LABEL_COPY = ${JSON.stringify(btnCopyLabel)};
    const LABEL_COPIED = ${JSON.stringify(btnCopiedLabel)};

    function copySummaryToClipboard() {
      const textEl = document.getElementById('copySourceText');
      const text = textEl.value;
      const lbl = document.getElementById('lblCopyBtn');

      function markCopied() {
        lbl.textContent = LABEL_COPIED;
        setTimeout(() => {
          lbl.textContent = LABEL_COPY;
        }, 2200);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(markCopied).catch(() => {
          fallbackCopy(textEl, markCopied);
        });
      } else {
        fallbackCopy(textEl, markCopied);
      }
    }

    function fallbackCopy(textareaEl, callback) {
      textareaEl.select();
      textareaEl.setSelectionRange(0, 999999);
      try {
        document.execCommand('copy');
        callback();
      } catch (e) {}
    }
  </script>
</body>
</html>`;
}

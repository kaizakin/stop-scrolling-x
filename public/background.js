const STORAGE_KEY = 'blockState';
const ALARM_NAME = 'x-block-timer';
const X_HOSTS = new Set(['x.com', 'www.x.com']);

function isXUrl(urlString) {
  if (!urlString) {
    return false;
  }

  try {
    const url = new URL(urlString);
    return X_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function getBlockState() {
  return chrome.storage.local.get(STORAGE_KEY).then((result) => {
    return result[STORAGE_KEY] ?? {
      active: false,
      durationMs: 0,
      endTime: null,
      startedAt: null,
    };
  });
}

async function clearBlockState() {
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      active: false,
      durationMs: 0,
      endTime: null,
      startedAt: null,
    },
  });
}

async function closeIfBlocked(tabId, url) {
  const state = await getBlockState();
  if (!state.active || !state.endTime || Date.now() >= state.endTime) {
    if (state.active) {
      await clearBlockState();
    }
    return;
  }

  if (isXUrl(url)) {
    await chrome.tabs.remove(tabId);
  }
}

async function closeExistingXTabs() {
  const tabs = await chrome.tabs.query({});
  const state = await getBlockState();

  if (!state.active || !state.endTime || Date.now() >= state.endTime) {
    if (state.active) {
      await clearBlockState();
    }
    return;
  }

  await Promise.all(
    tabs
      .filter((tab) => tab.id && isXUrl(tab.url))
      .map((tab) => chrome.tabs.remove(tab.id)),
  );
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(STORAGE_KEY, async (result) => {
    if (!result[STORAGE_KEY]) {
      await chrome.storage.local.set({
        [STORAGE_KEY]: {
          active: false,
          durationMs: 0,
          endTime: null,
          startedAt: null,
        },
      });
    }
  });
});

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id) {
    void closeIfBlocked(tab.id, tab.pendingUrl || tab.url);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const nextUrl = changeInfo.url || tab.pendingUrl || tab.url;
  if (nextUrl) {
    void closeIfBlocked(tabId, nextUrl);
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes[STORAGE_KEY]?.newValue) {
    return;
  }

  const nextState = changes[STORAGE_KEY].newValue;

  if (!nextState.active || !nextState.endTime) {
    void chrome.alarms.clear(ALARM_NAME);
    return;
  }

  if (Date.now() >= nextState.endTime) {
    void clearBlockState();
    return;
  }

  void chrome.alarms.create(ALARM_NAME, { when: nextState.endTime });
  void closeExistingXTabs();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    void clearBlockState();
  }
});

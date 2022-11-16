// Constants.
const NAME = 'cookie-value-copier';
const ROOT = `${NAME}-config`;

// Variables.
let configMap = new Map;
let tableItems = document.createElement('tbody');
let cookieValue = null;
let currentTab = null;

// Functions to wrap chrome API.

/**
 * Set a config to storage.
 * @param {string} key Key to set to storage.
 * @param {*} value Value to set to storage.
 * 
 */
const setConfig = async (key, value) => {
  configMap[key] = value;

  let storage_map = new Map;
  storage_map[ROOT] = configMap;
  await chrome.storage.sync.set(storage_map);
};

/**
 * Remove a config specified by the key.
 * @param {string} key Key to remove from storage.
 * 
 */
const removeConfig = async (key) => {
  configMap.delete(key);

  let storage_map = new Map;
  storage_map[ROOT] = configMap;
  await chrome.storage.sync.set(storage_map);
};

/**
 * Clear the config table.
 * 
 */
const clearConfig = async () => {
  await chrome.storage.sync.clear();
};

/**
 * Get cookie value.
 * @param {*} key 
 * @param {*} url 
 * @returns Cookie value.
 */
const getCookieValue = async (key, url) => {
  const response = await chrome.runtime.sendMessage({
    operation: 'getCookieValue',
    cookieKey: key,
    cookieUrl: url
  });

  return response ? response.cookieValue : '';
};

/**
 * Update the config table.
 * 
 */
const updateConfigMap = async () => {
  const ret = await chrome.storage.sync.get([ROOT]);
  if (ROOT in ret) {
    for (const key in ret[ROOT]) {
      // Update value.
      const cookieValue = await getCookieValue(key, ret[ROOT][key].url);
      const item = {
        key: key, value: cookieValue,
        url: ret[ROOT][key].url, favIconUrl: ret[ROOT][key].favIconUrl
      };
      await setConfig(key, item);
    }
  }
};

// Functions to create view.

/**
 * Create a table raw item.
 * @param {*} item Element of config map.
 * @returns Table raw element.
 */
const createTableItem = (item) => {
  const tr = document.createElement('tr');
  const tdFavicon = document.createElement('td');
  {
    const img = document.createElement('img');
    img.src = item.favIconUrl;
    const anchr = document.createElement('a');
    anchr.href = item.url;
    anchr.appendChild(img);
    tdFavicon.appendChild(anchr);
  }
  tr.appendChild(tdFavicon);
  const tdTitle = document.createElement('td');
  tdTitle.innerText = item.key;
  tr.appendChild(tdTitle);
  const tdButton = document.createElement('td');
  const copyButton = document.createElement('button');
  copyButton.innerText = 'Copy value';
  copyButton.classList.add('myCopyButton');
  tdButton.appendChild(copyButton);
  copyButton.addEventListener('click', async () => {
    const key = item.key;
    const url = item.url;
    const favIconUrl = item.favIconUrl;

    try {
      // Open target tab in background to update cookie.
      const tab = await chrome.tabs.create({ url: url, active: false });
      // Update value.
      const cookieValue = await getCookieValue(key, url);
      const item = { key: key, value: cookieValue, url: url, favIconUrl: favIconUrl };
      await setConfig(key, item);
      // Set clipboatd.
      await navigator.clipboard.writeText(cookieValue);
      // Close tab.
      await chrome.tabs.remove(tab.id);
      copyButton.innerText = 'Copied'
      setTimeout(() => { copyButton.innerText = 'Copy value' }, 3000 /* ms */);
    } catch (e) {
      console.error('Failed to copy: ', e.message);
    }
  });
  tr.appendChild(tdButton);

  return tr;
};

/**
 * Create a table.
 * @returns Table element.
 */
const createTable = () => {
  const table = document.createElement('table');
  table.id = 'table';
  table.setAttribute('role', 'grid');

  // Append header.
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  thead.appendChild(tr);
  const tdFavicon = document.createElement('td');
  tr.appendChild(tdFavicon);
  const tdTitle = document.createElement('td');
  tdTitle.innerText = 'Cookie key';
  tr.appendChild(tdTitle);
  const tdButton = document.createElement('td');
  tdButton.innerText = 'Actions';
  tr.appendChild(tdButton);
  table.appendChild(thead);

  // Append items.
  table.appendChild(tableItems);
  for (const key in configMap) {
    tableItems.appendChild(createTableItem(configMap[key]));
  }

  return table;
};

// Functions for event listener.

/**
 * DOMContentLoaded
 * 
 */
window.addEventListener('DOMContentLoaded', () => {

  // For init table.
  updateConfigMap().then(() => {
    const tableArea = document.getElementById('tableArea');
    if (tableArea) tableArea.appendChild(createTable());
  });

  // For init addButton.
  const addButton = document.getElementById('addButton');
  if (addButton) addButton.addEventListener('click', () => {
    const dialogForAdd = document.getElementById('dialogForAdd');
    dialogForAdd.setAttribute('open', '');
  });

  // For init cancelButton.
  const cancelButton = document.getElementById('cancelButton');
  if (cancelButton) cancelButton.addEventListener('click', () => {
    const dialogForAdd = document.getElementById('dialogForAdd');
    dialogForAdd.removeAttribute('open');
  });

  // For init confirmButton.
  const confirmButton = document.getElementById('confirmButton');
  if (confirmButton) confirmButton.addEventListener('click', async () => {
    const cookieKey = document.getElementById('cookieKey');
    const cookieUrl = document.getElementById('cookieUrl');

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.runtime.sendMessage({
      operation: 'getCookieValue',
      cookieKey: cookieKey.value,
      cookieUrl: cookieUrl.value
    });

    if (response && response.cookieValue) {
      const item = {
        key: cookieKey.value, value: response.cookieValue,
        url: cookieUrl.value, favIconUrl: tabs[0].favIconUrl
      };
      await setConfig(cookieKey.value, item);
      tableItems.appendChild(createTableItem(item));
      const dialogForAdd = document.getElementById('dialogForAdd');
      dialogForAdd.removeAttribute('open');
    }
  });

  // For init dialog.
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    currentTab = tabs[0];
    const cookieUrl = document.getElementById('cookieUrl');
    cookieUrl.value = currentTab.url;
    cookieUrl.setAttribute('disabled', '');
  });

});

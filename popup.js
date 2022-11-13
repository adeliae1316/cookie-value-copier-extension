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
 * Updatw the config table.
 * 
 */
const updateConfigMap = async () => {
  await chrome.storage.sync.get([ROOT])
    .then(ret => {
      if (ROOT in ret) {
        for (const key in ret[ROOT]) {
          // console.trace(`${key}: ${ret[ROOT][key]}`);
          configMap[key] = ret[ROOT][key];
        }
      }
    });
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
    chrome.tabs.query({ url: item.url }, tabs => {
      const img = document.createElement('img');
      img.src = tabs[0].favIconUrl;
      const anchr = document.createElement('a');
      anchr.href = tabs[0].url;
      // anchr.dataset.tooltip = tabs[0].url;
      // anchr.classList.add('myAnchrToolTip');
      anchr.appendChild(img);
      tdFavicon.appendChild(anchr);
    });
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
  copyButton.addEventListener('click', () => {
    const key = item.key;
    const value = item.value;
    try {
      navigator.clipboard.writeText(value)
        .then(() => {
          // console.trace(`Copy value of ${key} to clipboard: ${value}`);
          alert(`Copy value of ${key} to clipboard: ${value}`);
        });
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
  if (confirmButton) confirmButton.addEventListener('click', () => {
    const cookieKey = document.getElementById('cookieKey');
    const cookieUrl = document.getElementById('cookieUrl');

    chrome.runtime.sendMessage({
      operation: 'getCookieValue',
      cookieKey: cookieKey.value,
      cookieUrl: cookieUrl.value
    }, (response) => {
      cookieValue = response.cookieValue;
      if (cookieValue) {
        setConfig(cookieKey.value, { key: cookieKey.value, value: cookieValue, url: cookieUrl.value });
        tableItems.appendChild(createTableItem(cookieKey.value));
        const dialogForAdd = document.getElementById('dialogForAdd');
        dialogForAdd.removeAttribute('open');
      }
    });
  });

  // For init dialog.
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    currentTab = tabs[0];
    const cookieUrl = document.getElementById('cookieUrl');
    cookieUrl.value = currentTab.url;
    cookieUrl.setAttribute('disabled', '');
  });

});

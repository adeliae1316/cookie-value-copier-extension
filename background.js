/**
 * Get cookie value.
 * @param {string} key Cookie key.
 * @param {string} url Url.
 * @returns Cookie value.
 * 
 */
const getCookieValue = async (key, url) => {
  let value = null;

  await chrome.cookies.get({
    name: key,
    url: url
  }).then(result => {
    // Set value text to clipboard.
    if (result && result.value) {
      value = result.value;
    } else {
      console.error(`Failed to get ${key}'s value.`);
    }
    // Check lastError.
    const lastError = chrome.runtime.lastError;
    if (lastError) {
      console.error(`Runtime error occured: ${lastError.message}`);
      chrome.runtime.lastError = null;
    }
  }, error => {
    // Error occured.
    console.error(error.message);
  });

  return value;
};

/**
 * Message.
 * 
 */
chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    const operation = message.operation;
    if (operation === 'getCookieValue') {
      getCookieValue(message.cookieKey, message.cookieUrl)
        .then(result => {
          sendResponse({ cookieValue: result });
        });
    }

    return true;
  }
);

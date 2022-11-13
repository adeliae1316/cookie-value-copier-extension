/**
 * Get cookie value.
 * @param {string} key Cookie key.
 * @param {string} url Url.
 * 
 * @return Cookie value.
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

const key = 'tz';

/**
 * Action on icon click.
 * 
 */
chrome.action.onClicked.addListener(async (tab) => {
  const value = await getCookieValue(key, tab.url);
  console.trace(value);
});

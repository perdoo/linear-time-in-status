console.info('chrome-ext template-react-ts background script')

chrome.action.onClicked.addListener(function (tab) {
  onClick()
})

export {}

const onClick = async () => {
  let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (tab?.id) {
    // TODO: Send a better message here
    chrome.tabs.sendMessage(tab.id, 'hello!')
  }
}

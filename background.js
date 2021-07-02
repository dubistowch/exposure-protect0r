function maskIp(realIp) {
  return realIp.split('').map((n, i) => (i && n != '.') ? '*' : n).join('')
}

function getText() {
  return document.body.innerText
}

function updateRealIp() {
  (async () => {
    const resp = await fetch('https://ipinfo.io/ip')
    const realIp = await resp.text()
    chrome.storage.local.set({
      'realIp': realIp
    })
    const maskedIp = maskIp(realIp)
    console.log('realIp', maskedIp)
  })()
}

function hideMyIp() {
  chrome.storage.local.get(['realIp'], ({ realIp }) => {    
    const getHTML = () => document.body.innerHTML
      const regexRealIp = new RegExp(realIp, "g")
      document.body.innerHTML = getHTML().replace(regexRealIp, "[Exposure Protect0r]")
  })
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete' || changeInfo.status == 'loading') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: hideMyIp,
    })
  }
})

chrome.alarms.create('updateRealIp', {
  when: 1000,
  periodInMinutes: 1
})

chrome.alarms.onAlarm.addListener(({ name }) => {
  switch (name) {
    case "updateRealIp":
      updateRealIp()
      break
  }
})

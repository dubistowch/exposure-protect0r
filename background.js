
const Protect0r = {

  mask: '[Exposure Protect0r]',
  realIpVendor: 'https://ipinfo.io/ip',
  interestTags: [
    'p',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span', 'div',
    'ul', 'ol', 'li',
    'font',
  ],

  listenerRegisted: false,

  async init() {

    chrome.alarms.create('updateRealIp', {
      when: 1000,
      periodInMinutes: 1
    })

    chrome.alarms.onAlarm.addListener(({ name }) => {
      Protect0r[name].call(Protect0r[name])
    })

    chrome.webNavigation.onBeforeNavigate.addListener(() => {
      if (!Protect0r.listenerRegisted) {
        Protect0r.registerListener()
        console.log('listenerRegisted')
      }
    },
      {
        url: [
          { urlMatches: 'http://*/*' },
          { urlMatches: 'https://*/*' }
        ],
      }
    )

    chrome.storage.local.set({
      interestTags: Protect0r.interestTags,
      mask: Protect0r.mask
    })
  },

  registerListener() {
    chrome.tabs.onUpdated.addListener(Protect0r.onUpdateListener)
    chrome.runtime.onMessage.addListener(Protect0r.onMessage)
    chrome.tabs.onRemoved.addListener(Protect0r.unregisterListener)
    Protect0r.listenerRegisted = true
  },

  unregisterListener() {
    chrome.tabs.onUpdated.removeListener(Protect0r.onUpdateListener)
    chrome.runtime.onMessage.removeListener(Protect0r.onMessage)
  },

  onUpdateListener(tabId, changeInfo) {
    if (changeInfo.status == 'complete' || changeInfo.status == 'loading') {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: Protect0r.executeHideMyIp,
      })
    }
  },

  maskIp(realIp) {
    return realIp.split('').map((n, i) => (i && n != '.') ? '*' : n).join('')
  },

  updateRealIp() {
    (async () => {
      const resp = await fetch(Protect0r.realIpVendor)
      const realIp = await resp.text()
      chrome.storage.local.set({
        'realIp': realIp
      })
      const maskedIp = Protect0r.maskIp(realIp)
      console.log('realIp', maskedIp)
    })()
  },

  executeHideMyIp: () => {
    const replaceInDom = (dom, needle, mask) => {
      dom.childNodes.forEach((...[, i]) => {
        if (dom.childNodes[i].nodeValue) {
          dom.childNodes[i].nodeValue = dom.childNodes[i].nodeValue.replace(needle, mask)
        }
      })
    }
    chrome.storage.local.get([
      'realIp', 'interestTags', 'mask'
    ], ({ interestTags, mask, realIp }) => {
      const regexRealIp = new RegExp(realIp, 'g');
      (async () => {
        await Promise.all(interestTags.map((tag) => {
          document.querySelectorAll(tag).forEach((dom) => {
            replaceInDom(dom, regexRealIp, mask)
          })
        }))
      })()
    })
  }
}

Protect0r.init()

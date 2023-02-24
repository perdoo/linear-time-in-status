import { each, find } from 'lodash'

let issues = [] as IssueType[]

type IssueType = {
  id: string
  url: string
  identifier: string
  updatedAt: string
  startedAt: string
  title: string
  state: { name: string }
}

let token: string | undefined

chrome.storage.local.get(['linearApiToken'], (items) => {
  token = items.linearApiToken

  if (token) {
    fetchIssues()
  } else {
    clearInterval(timer)
  }
})

const query = `
    query activeIssues {
        issues(filter: {startedAt: {null:false}, completedAt: {null:true}, canceledAt: {null:true} }) {
            edges {
                node {
                    id
                    url
                    identifier
                    updatedAt # The last time at which the entity was meaningfully updated, i.e. for all changes of syncable properties except those for which updates should not produce an update to updatedAt (see skipUpdatedAtKeys). This is the same as the creation time if the entity hasn't been updated after creation.
                    startedAt
                    title
                    state {name}
                }
            }
        }
    }
`
const fetchIssues = async () => {
  if (!token) return
  const result = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({ query }),
  })

  const json = await result.json()
  issues = json.data.issues.edges.map((edge: any) => edge.node) as IssueType[]
}

const daysSince = (date: Date | string) => {
  const parsedDate = date instanceof Date ? date : new Date(date)
  const today = new Date()
  const timeDelta = today.getTime() - parsedDate.getTime()
  return Math.round(timeDelta / (1000 * 3600 * 24))
}

const getIssueForElement = (element: Element) => {
  if (!(element instanceof HTMLAnchorElement)) return undefined
  return find(issues, { url: element.href })
}

const updateIssues = () => {
  let count = 0
  const elements = document.querySelectorAll("a[href^='/perdoo/issue']")
  each(elements, (element) => {
    const issue = getIssueForElement(element)
    if (issue) {
      addBadge(element as HTMLAnchorElement, issue)
      count++
    }
  })
}

const checkForPageLoaded = () => {
  const issue = document.querySelector("a[href^='/perdoo/issue']")
  if (issue && issues.length) {
    clearInterval(timer)
    console.log('ready')
    updateIssues()
  } else {
    console.log('not ready')
  }
}

const timer = setInterval(checkForPageLoaded, 10)

const getColor = (delta: number) => {
  if (delta > 5) {
    return '#EB5757'
  } else if (delta > 3) {
    return '#FFBF81'
  } else if (delta > 2) {
    return '#FFDC5E'
  } else if (delta > 1) {
    return '#44CFCB'
  } else {
    return '#6B6F76'
  }
}

const addBadge = (element: HTMLAnchorElement, issue: IssueType) => {
  const badge = document.createElement('div')
  badge.style.marginLeft = '9px'
  badge.style.columnWidth = '41px'
  badge.style.display = 'flex'
  badge.style.alignItems = 'center'
  badge.style.flexShrink = '0'
  badge.style.flex = 'initial'
  badge.style.flexDirection = 'row'

  const text = document.createElement('span')
  text.style.minWidth = 'var(--column-width)'
  text.style.flexShrink = '0'
  text.style.fontStyle = 'normal'
  text.style.lineHeight = 'normal'
  text.style.fontWeight = 'normal'
  text.style.textAlign = 'right'
  text.style.fontSize = 'var(--font-size-mini)'
  const delta = daysSince(issue.startedAt)
  text.style.color = getColor(delta)
  text.textContent = delta ? `${delta}d` : '-'
  badge.appendChild(text)
  element.firstChild?.firstChild?.appendChild(badge)
}

// Create an observer instance.
var observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.type === 'childList' && mutation.addedNodes.length) {
      each(mutation.addedNodes, (node) => {
        const issue = getIssueForElement(node as Element)
        if (issue) {
          addBadge(node as HTMLAnchorElement, issue)
          // console.log('repainted', issue?.title, issue.state.name)
        }
      })
    }
  })
})

// Config info for the observer.
var config = {
  childList: true,
  subtree: true,
}

// Observe the body (and its descendants) for `childList` changes.
observer.observe(document.body, config)

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // TODO: Filter by a proper message here
  updateIssues()
})

export {}

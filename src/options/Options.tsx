import { useEffect, useState } from 'react'
import './Options.css'

function App() {
  const [val, setVal] = useState('')

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    setVal(e.currentTarget.value)
  }

  const onSave = () => {
    alert('Saved!')
    // TODO: Save this somewhere more secure
    chrome.storage.local.set({ linearApiToken: val })
  }

  useEffect(() => {
    chrome.storage.local.get(['linearApiToken'], (items) => {
      setVal(items.linearApiToken)
    })
  }, [])

  return (
    <main>
      <h3>Options</h3>

      <h6>v 0.0.1</h6>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Linear API Token
        </label>
        <div className="mt-1">
          <input
            type="email"
            name="email"
            id="email"
            value={val}
            onChange={onChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="you@example.com"
          />
        </div>
      </div>
      <button onClick={onSave}>Save</button>
    </main>
  )
}

export default App

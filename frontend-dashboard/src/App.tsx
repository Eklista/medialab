import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          📊 Dashboard
        </h1>
        <p className="text-gray-600 mb-4">Admin panel - /dashboard/</p>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-xl font-bold">{count}</div>
            <button
              onClick={() => setCount(count + 1)}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Click me
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
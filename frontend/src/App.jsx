import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import HeadingTree from './components/HeadingTree'
import Settings from './components/Settings'
import { Settings as SettingsIcon } from 'lucide-react'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
        <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <img 
              src="https://www.vargroup.com/-/media/Project/Var-Group-Tenant/Var-Group-Corporate-Website/Logos/LogoVarGroupWeb3x-4.png" 
              alt="Var Group Logo" 
              className="h-8 object-contain bg-white px-2 py-1 rounded"
            />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              DocFilter
            </span>
          </div>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-blue-400 transition-colors">Home</Link>
            <Link to="/settings" className="hover:text-blue-400 transition-colors flex items-center gap-2">
              <SettingsIcon size={18} />
              Impostazioni
            </Link>
          </div>
        </nav>
        
        <main className="flex-1 max-w-5xl mx-auto w-full p-6">
          <Routes>
            <Route path="/" element={<HeadingTree />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

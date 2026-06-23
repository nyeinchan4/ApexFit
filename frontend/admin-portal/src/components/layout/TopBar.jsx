import { useState } from 'react'
import { useLocation } from 'react-router-dom'

const titles = {
  '/dashboard':         'Command Center',
  '/members':           'Member Directory',
  '/cash-verification': 'Cash Verification',
  '/plan-configurator': 'Plan Configurator',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const [query, setQuery] = useState('')

  return (
    <header className="fixed top-0 right-0 left-60 h-16 border-b border-slate-200 bg-white z-30 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-800">{titles[pathname] || 'ApexFit Admin'}</h2>
        <span className="text-slate-300">|</span>
        <div className="flex items-center bg-slate-100 rounded-lg px-3 py-1.5 gap-2 w-64">
          <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
          <input
            className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
            placeholder="Search operations..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}

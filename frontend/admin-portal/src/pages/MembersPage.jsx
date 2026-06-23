import { useEffect, useState } from 'react'
import { userService } from '../services/services'

const ROLE_BADGE = {
  member: 'bg-blue-50 text-blue-700 border border-blue-200',
  staff:  'bg-purple-50 text-purple-700 border border-purple-200',
  admin:  'bg-indigo-900 text-white border border-indigo-800',
}

const STATUS_BADGE = {
  true:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  false: 'bg-red-50 text-red-500 border border-red-200',
}

const TABS = [
  { key: '',       label: 'All'     },
  { key: 'member', label: 'Members' },
  { key: 'staff',  label: 'Staff'   },
  { key: 'admin',  label: 'Admins'  },
]

function Avatar({ name }) {
  const initials = name
    ? name.slice(0, 2).toUpperCase()
    : '?'
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-indigo-700">{initials}</span>
    </div>
  )
}

export default function MembersPage() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [role,    setRole]    = useState('')
  const [page,    setPage]    = useState(1)
  const [search,  setSearch]  = useState('')

  const load = () => {
    setLoading(true)
    userService.listUsers({ role: role || undefined, page, limit: 20 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [role, page])

  const { members = [], pagination = {} } = data || {}

  // Client-side search filter
  const filtered = search.trim()
    ? members.filter(m => {
        const q = search.toLowerCase()
        return (
          m.email?.toLowerCase().includes(q) ||
          m.username?.toLowerCase().includes(q)
        )
      })
    : members

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {pagination.total ?? '—'} registered users total
          </p>
        </div>
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setRole(t.key); setPage(1) }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              role === t.key
                ? 'bg-indigo-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <span className="material-symbols-outlined animate-spin text-3xl text-indigo-300">autorenew</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Member', 'Email', 'Role', 'Status', 'Plan', 'Joined', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length ? filtered.map(m => (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    {/* Name + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.username} />
                        <div>
                          <p className="font-semibold text-slate-800 whitespace-nowrap">
                            {m.username}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">{m.id?.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-slate-600">{m.email}</td>

                    {/* Role badge */}
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${ROLE_BADGE[m.role] ?? ROLE_BADGE.member}`}>
                        {m.role}
                      </span>
                    </td>

                    {/* Active status */}
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[String(m.is_active)]}`}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      {m.subscription ? (
                        <div className="flex flex-col">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block w-fit">
                            {m.subscription.plan_name}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">
                            {m.subscription.days_remaining} days left
                          </span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          No Plan
                        </span>
                      )}
                    </td>

                    {/* Joined date */}
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        title="Copy user ID"
                        onClick={() => navigator.clipboard.writeText(m.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-slate-400">
                      <span className="material-symbols-outlined text-4xl block mb-2">group</span>
                      {search ? `No users match "${search}"` : 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Page {pagination.page} of {pagination.pages} · {pagination.total} users
            </span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">
                ← Prev
              </button>
              <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

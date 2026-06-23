import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardService } from '../services/services'

const STATUS_DOT = { ok: 'bg-emerald-500', degraded: 'bg-amber-500', unreachable: 'bg-red-500', unknown: 'bg-slate-300' }

function KPICard({ icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700',
    amber:  'bg-amber-50  text-amber-700',
    emerald:'bg-emerald-50 text-emerald-700',
  }
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <span className="material-symbols-outlined text-[24px] icon-fill">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-800 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function ServiceBadge({ name, status }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status] || STATUS_DOT.unknown} animate-pulse`} />
      <span className="text-sm font-medium text-slate-700 capitalize">{name.replace('-', ' ')}</span>
      <span className={`text-xs font-semibold ${status === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>{status}</span>
    </div>
  )
}

const STATUS_BADGE = {
  pending:  'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-600',
}

export default function DashboardPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    dashboardService.getSummary()
      .then(setData)
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-symbols-outlined animate-spin text-4xl text-indigo-300">autorenew</span>
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 flex items-center gap-3">
      <span className="material-symbols-outlined">error</span> {error}
    </div>
  )

  const fmt = (n) => n?.toLocaleString() ?? '0'
  const fmtMMK = (n) => n ? `${Number(n).toLocaleString()} MMK` : '0 MMK'

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard icon="payments"     label="Pending Payments"     value={fmt(data?.kpis?.pending_cash_payments)} color="amber" />
        <KPICard icon="account_balance_wallet" label="Pending Amount" value={fmtMMK(data?.kpis?.pending_total_mmk)} color="indigo" />
        <KPICard icon="receipt_long" label="Total Transactions"   value={fmt(data?.kpis?.total_payments)}        color="emerald" />
      </div>

      {/* Service Health */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-indigo-600">hub</span>
          Service Health
        </h3>
        <div className="flex flex-wrap gap-3">
          {data?.services && Object.entries(data.services).map(([name, status]) => (
            <ServiceBadge key={name} name={name} status={status} />
          ))}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-500 icon-fill">pending_actions</span>
            Pending Cash Payments
          </h3>
          <Link to="/cash-verification" className="text-xs font-semibold text-indigo-600 hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              {['Member','Plan','Amount (MMK)','Method','Status','Submitted'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data?.recent_activity?.length ? data.recent_activity.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{p.user_id?.slice(0,8)}…</td>
                  <td className="px-5 py-3 text-slate-600">{p.plan_name}</td>
                  <td className="px-5 py-3 font-semibold text-indigo-900">{Number(p.amount_mmk).toLocaleString()}</td>
                  <td className="px-5 py-3 text-slate-600 capitalize">{p.method}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{new Date(p.submitted_at).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">No pending payments</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

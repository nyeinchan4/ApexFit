import { useEffect, useState } from 'react'
import { paymentService } from '../services/services'

export default function CashVerificationPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    paymentService.list({ status: 'pending', limit: 50 })
      .then(setData).catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const act = async (id, action) => {
    setBusyId(id)
    try {
      if (action === 'verify') await paymentService.verify(id)
      else await paymentService.reject(id)
      load()
    } catch { alert(`Failed to ${action} payment.`) }
    finally { setBusyId(null) }
  }

  const { payments = [], kpi = {} } = data || {}

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
          <span className="material-symbols-outlined text-amber-600 text-[32px] icon-fill">pending_actions</span>
          <div>
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Awaiting Verification</p>
            <p className="text-3xl font-black text-amber-800">{kpi.pending_count ?? payments.length}</p>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex items-center gap-4">
          <span className="material-symbols-outlined text-indigo-600 text-[32px] icon-fill">account_balance_wallet</span>
          <div>
            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Pending Amount</p>
            <p className="text-3xl font-black text-indigo-900">{Number(kpi.pending_total_mmk || 0).toLocaleString()}<span className="text-base font-normal text-indigo-400 ml-1">MMK</span></p>
          </div>
        </div>
      </div>

      {/* Verification Queue */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-amber-500 icon-fill">payments</span>
          <h3 className="text-sm font-semibold text-slate-700">Verification Queue</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <span className="material-symbols-outlined animate-spin text-3xl text-indigo-300">autorenew</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-5xl block mb-3 text-emerald-300">task_alt</span>
            <p className="font-semibold text-slate-500">All clear!</p>
            <p className="text-sm mt-1">No pending cash payments to verify.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-amber-600 text-[20px] icon-fill">payments</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{p.plan_name} Membership</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ref: {p.reference_id || '—'}
                    <span className="mx-2">·</span>
                    {new Date(p.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-black text-indigo-900">{Number(p.amount_mmk).toLocaleString()}</p>
                  <p className="text-xs text-slate-400 capitalize">{p.method?.replace('_', ' ')}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    id={`verify-${p.id}`}
                    onClick={() => act(p.id, 'verify')}
                    disabled={busyId === p.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Verify
                  </button>
                  <button
                    id={`reject-${p.id}`}
                    onClick={() => act(p.id, 'reject')}
                    disabled={busyId === p.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-100 border border-red-200 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

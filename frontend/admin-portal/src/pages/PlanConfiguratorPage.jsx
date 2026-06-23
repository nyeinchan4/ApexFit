import { useEffect, useState } from 'react'
import { planService } from '../services/services'

const BLANK = { name: '', description: '', price_mmk: '', duration_days: 30, features: [''] }

function PlanModal({ plan, onClose, onSaved }) {
  const isEdit = !!plan?.id
  const [form, setForm] = useState(plan ? {
    ...plan, features: plan.features || [''], price_mmk: String(plan.price_mmk)
  } : BLANK)
  const [busy, setBusy] = useState(false)
  const [err, setErr]   = useState('')

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setFeature = (i, v) => setForm(f => {
    const features = [...f.features]; features[i] = v; return { ...f, features }
  })
  const addFeature    = () => setForm(f => ({ ...f, features: [...f.features, ''] }))
  const removeFeature = (i) => setForm(f => ({ ...f, features: f.features.filter((_, j) => j !== i) }))

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const body = { ...form, price_mmk: Number(form.price_mmk), features: form.features.filter(Boolean) }
      if (isEdit) await planService.update(plan.id, body)
      else await planService.create(body)
      onSaved()
    } catch (e) { setErr(e.response?.data?.error || 'Save failed.') }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-800 mb-5">{isEdit ? 'Edit Plan' : 'New Plan'}</h3>
        {err && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          {[['Plan name', 'name', 'text'], ['Description', 'description', 'text'], ['Price (MMK)', 'price_mmk', 'number'], ['Duration (days)', 'duration_days', 'number']].map(([label, key, type]) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
              <input type={type} required value={form[key]} onChange={e => setField(key, e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          ))}

          {/* Features */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Features</label>
            <div className="space-y-2">
              {form.features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input value={f} onChange={e => setFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="button" onClick={() => removeFeature(i)} className="p-2 text-slate-400 hover:text-red-500">
                    <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addFeature} className="mt-2 text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:underline">
              <span className="material-symbols-outlined text-[16px]">add_circle</span> Add feature
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} className="flex-1 bg-indigo-900 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-800 disabled:opacity-50">
              {busy ? 'Saving…' : isEdit ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const PLAN_COLORS = ['border-l-indigo-400', 'border-l-violet-500', 'border-l-emerald-500']

export default function PlanConfiguratorPage() {
  const [plans, setPlans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null) // null | 'new' | planObj

  const load = () => { setLoading(true); planService.list().then(setPlans).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this plan? This cannot be undone.')) return
    try { await planService.remove(id); load() }
    catch { alert('Delete failed.') }
  }

  return (
    <div className="space-y-5">
      {modal !== null && (
        <PlanModal
          plan={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Manage membership tiers, pricing, and benefits</p>
        <button id="new-plan-btn" onClick={() => setModal('new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-900 text-white text-sm font-semibold rounded-xl hover:bg-indigo-800 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Plan
        </button>
      </div>

      {/* Plan Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <span className="material-symbols-outlined animate-spin text-3xl text-indigo-300">autorenew</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <div key={plan.id} className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${PLAN_COLORS[i % 3]} overflow-hidden`}>
              {/* Header */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">{plan.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{plan.description}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${plan.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-black text-slate-800">{Number(plan.price_mmk).toLocaleString()}</span>
                  <span className="text-slate-400 text-sm ml-1.5">MMK / {plan.duration_days}d</span>
                </div>
              </div>

              {/* Features */}
              <div className="p-5">
                <ul className="space-y-2">
                  {(plan.features || []).map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="material-symbols-outlined text-emerald-500 text-[16px] icon-fill">check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 flex gap-2">
                <button onClick={() => setModal(plan)}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                  <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                </button>
                <button onClick={() => handleDelete(plan.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 rounded-xl py-2 text-sm font-semibold hover:bg-red-50 transition-all">
                  <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

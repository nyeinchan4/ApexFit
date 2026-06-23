import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Icon from '../components/Icon'

function PaymentModal({ plan, isOpen, onClose, onSubmit, isSubmitting }) {
  const [method, setMethod] = useState('cash')
  const [referenceId, setReferenceId] = useState('')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ method, referenceId, notes })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-member-surface rounded-2xl border border-outline-variant/60 p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-lexend font-bold text-xl text-on-surface">Payment Method</h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-electric-orange transition-colors"
          >
            <Icon name="close" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan Info */}
          <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant/40">
            <p className="font-inter text-xs text-on-surface-variant mb-1">Selected Plan</p>
            <p className="font-lexend font-bold text-lg text-on-surface">{plan.name}</p>
            <p className="font-lexend font-bold text-2xl text-electric-orange mt-2">
              {Math.floor(plan.price_mmk).toLocaleString('en-US')} <span className="text-sm">MMK</span>
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="font-inter text-sm font-bold text-on-surface block mb-2">
              Payment Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-surface-container rounded-lg border border-outline-variant cursor-pointer hover:border-electric-orange transition-colors">
                <input
                  type="radio"
                  name="method"
                  value="cash"
                  checked={method === 'cash'}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-4 h-4 text-electric-orange"
                />
                <Icon name="payments" size={20} className="text-electric-orange" />
                <span className="font-inter text-sm text-on-surface">Cash Payment</span>
              </label>
            </div>
          </div>

          {/* Reference ID (optional) */}
          <div>
            <label className="font-inter text-sm font-bold text-on-surface block mb-2">
              Reference ID <span className="text-on-surface-variant font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g., Receipt number"
              className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-electric-orange transition-colors"
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="font-inter text-sm font-bold text-on-surface block mb-2">
              Notes <span className="text-on-surface-variant font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional information..."
              rows={3}
              className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-electric-orange transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-surface-container text-on-surface-variant rounded-lg font-inter font-bold text-sm hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-electric-orange text-white rounded-lg font-inter font-bold text-sm hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PlanCard({ plan, onSubscribe, isSubscribing }) {
  return (
    <div className="bg-member-surface rounded-xl border border-outline-variant/60 p-6 hover:border-electric-orange/60 transition-all">
      <div className="flex flex-col h-full">
        {/* Plan Name */}
        <h3 className="font-lexend font-bold text-xl text-on-surface mb-2">{plan.name}</h3>
        
        {/* Description */}
        {plan.description && (
          <p className="font-inter text-sm text-on-surface-variant mb-4">{plan.description}</p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="font-lexend font-bold text-3xl text-electric-orange">
            {Math.floor(plan.price_mmk).toLocaleString('en-US')}
          </span>
          <span className="font-inter text-sm text-on-surface-variant">MMK</span>
          <span className="font-inter text-xs text-on-surface-variant">
            / {plan.duration_days} days
          </span>
        </div>

        {/* Features */}
        {plan.features && plan.features.length > 0 && (
          <ul className="space-y-2 mb-6 flex-grow">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-on-surface-variant">
                <Icon name="check_circle" size={18} className="text-electric-orange flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Subscribe Button */}
        <button
          onClick={() => onSubscribe(plan)}
          disabled={isSubscribing}
          className="w-full bg-electric-orange text-white py-3 rounded-lg font-inter font-bold text-sm uppercase tracking-wider hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubscribing ? 'Processing...' : 'Subscribe'}
        </button>
      </div>
    </div>
  )
}

export default function PlansPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [subscribing, setSubscribing] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const token = window.__apexAccessToken__
      const { data } = await axios.get('/api/v1/plans', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      })
      if (data.success) {
        setPlans(data.data.plans || [])
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan)
    setModalOpen(true)
  }

  const handlePaymentSubmit = async (paymentData) => {
    try {
      setSubscribing(true)
      const token = window.__apexAccessToken__
      const { data } = await axios.post(
        '/api/v1/payments',
        {
          plan_id: selectedPlan.id,
          amount_mmk: selectedPlan.price_mmk,
          method: paymentData.method,
          reference_id: paymentData.referenceId || null,
          notes: paymentData.notes || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      )
      if (data.success) {
        setModalOpen(false)
        alert(`✅ Payment submitted for ${selectedPlan.name}! Your payment is pending verification by admin.`)
        navigate('/')
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Payment submission failed'
      alert(`❌ ${msg}`)
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-member-bg flex items-center justify-center pb-24 pt-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-electric-orange/20 border-t-electric-orange animate-spin" />
          <p className="font-inter text-sm text-on-surface-variant">Loading plans...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-member-bg flex items-center justify-center pb-24 pt-20 px-4">
        <div className="text-center">
          <Icon name="error" size={48} className="text-error mb-3 mx-auto" />
          <p className="font-inter text-sm text-error mb-4">{error}</p>
          <button
            onClick={fetchPlans}
            className="bg-electric-orange text-white px-6 py-2 rounded-lg font-inter font-bold text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter min-h-dvh bg-member-bg text-on-surface pb-24 pt-20">
      <main className="px-4 py-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-on-surface-variant hover:text-electric-orange transition-colors mb-4"
          >
            <Icon name="arrow_back" size={20} />
            <span className="font-inter text-sm font-bold uppercase tracking-wider">Back</span>
          </button>
          <h1 className="font-lexend font-bold text-3xl text-on-surface mb-2">Choose Your Plan</h1>
          <p className="font-inter text-sm text-on-surface-variant">
            Select a membership plan that fits your fitness goals
          </p>
        </div>

        {/* Plans Grid */}
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="fitness_center" size={48} className="text-on-surface-variant opacity-40 mx-auto mb-3" />
            <p className="font-inter text-on-surface-variant">No plans available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSubscribe={handleSubscribe}
                isSubscribing={subscribing}
              />
            ))}
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handlePaymentSubmit}
          isSubmitting={subscribing}
        />
      )}
    </div>
  )
}

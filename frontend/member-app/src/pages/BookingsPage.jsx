import { useState } from 'react'
import Icon from '../components/Icon'

const TODAY = new Date()
const fmt = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}

const CLASSES = [
  { id: 1, title: 'Strength & Conditioning', trainer: 'Coach Marcus', time: '06:30 AM', duration: 60, day: 0, spots: 3, icon: 'fitness_center'   },
  { id: 2, title: 'Morning Yoga Flow',        trainer: 'Coach Lily',   time: '07:00 AM', duration: 45, day: 0, spots: 8, icon: 'self_improvement'  },
  { id: 3, title: 'HIIT Blast',               trainer: 'Coach Dre',   time: '12:00 PM', duration: 30, day: 0, spots: 0, icon: 'local_fire_department' },
  { id: 4, title: 'Cycling Intervals',        trainer: 'Coach Ana',   time: '05:30 PM', duration: 45, day: 1, spots: 5, icon: 'pedal_bike'        },
  { id: 5, title: 'Core & Mobility',          trainer: 'Coach Sam',   time: '07:00 AM', duration: 30, day: 1, spots: 12, icon: 'accessibility_new' },
  { id: 6, title: 'Power Yoga',               trainer: 'Coach Lily',  time: '09:00 AM', duration: 60, day: 2, spots: 6, icon: 'self_improvement'   },
  { id: 7, title: 'Upper Body Sculpt',        trainer: 'Coach Marcus', time: '06:00 PM', duration: 50, day: 2, spots: 2, icon: 'fitness_center'    },
]

const DAY_LABELS = [0, 1, 2, 3, 4, 5, 6].map(n => ({
  n,
  date: addDays(TODAY, n),
  label: n === 0 ? 'Today' : addDays(TODAY, n).toLocaleDateString('en-US', { weekday: 'short' }),
  num:   addDays(TODAY, n).getDate(),
}))

export default function BookingsPage() {
  const [selectedDay, setSelectedDay] = useState(0)
  const [booked, setBooked] = useState(new Set())

  const dayClasses = CLASSES.filter(c => c.day === selectedDay)

  function toggle(id) {
    setBooked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="page-enter min-h-dvh bg-member-bg text-on-surface pb-24 pt-20">
      <main className="px-4 py-6 max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h2 className="font-lexend font-semibold text-2xl text-on-surface">Bookings</h2>
          <p className="font-inter text-sm text-on-surface-variant mt-0.5">Reserve your spot in a class</p>
        </div>

        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {DAY_LABELS.map(({ n, label, num }) => (
            <button
              key={n}
              id={`day-tab-${n}`}
              onClick={() => setSelectedDay(n)}
              className={`flex-shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-xl border transition-all active:scale-95 min-w-[52px] ${
                selectedDay === n
                  ? 'bg-electric-orange border-electric-orange text-white shadow-[0_0_14px_rgba(255,87,34,0.4)]'
                  : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-electric-orange/40'
              }`}
            >
              <span className="font-inter font-bold text-[10px] uppercase tracking-wider">{label}</span>
              <span className="font-lexend font-bold text-lg leading-tight">{num}</span>
            </button>
          ))}
        </div>

        {/* Selected date label */}
        <p className="font-inter text-xs text-on-surface-variant uppercase tracking-widest mb-4">
          {fmt(addDays(TODAY, selectedDay))}
        </p>

        {/* Classes */}
        <div className="space-y-3">
          {dayClasses.length === 0 && (
            <div className="text-center py-16">
              <Icon name="event_busy" size={40} className="text-on-surface-variant/40 mx-auto mb-3" />
              <p className="font-inter text-sm text-on-surface-variant">No classes scheduled.</p>
            </div>
          )}

          {dayClasses.map(cls => {
            const isBooked  = booked.has(cls.id)
            const isFull    = cls.spots === 0 && !isBooked

            return (
              <div
                key={cls.id}
                className={`bg-member-surface rounded-xl border p-4 transition-colors ${
                  isBooked ? 'border-status-active/50 bg-status-active/5' : 'border-outline-variant/60 hover:border-orange-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isBooked ? 'bg-status-active/20' : 'bg-electric-orange/10'
                  }`}>
                    <Icon name={cls.icon} size={20} className={isBooked ? 'text-status-active' : 'text-electric-orange'} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-lexend font-semibold text-sm text-on-surface">{cls.title}</h3>
                    <p className="font-inter text-xs text-on-surface-variant mt-0.5">{cls.trainer}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="font-inter text-xs text-on-surface-variant flex items-center gap-1">
                        <Icon name="schedule" size={12} className="opacity-60" />{cls.time}
                      </span>
                      <span className="font-inter text-xs text-on-surface-variant flex items-center gap-1">
                        <Icon name="timer" size={12} className="opacity-60" />{cls.duration} min
                      </span>
                      <span className={`font-inter font-bold text-[10px] uppercase tracking-wider ${
                        isFull ? 'text-status-expired' : 'text-status-active'
                      }`}>
                        {isFull ? 'Full' : `${cls.spots} spots`}
                      </span>
                    </div>
                  </div>

                  {/* Book button */}
                  <button
                    id={`btn-book-${cls.id}`}
                    onClick={() => !isFull && toggle(cls.id)}
                    disabled={isFull}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg font-inter font-bold text-xs uppercase tracking-wider border transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isBooked
                        ? 'bg-status-active/20 border-status-active/40 text-status-active'
                        : 'bg-electric-orange/10 border-electric-orange/30 text-electric-orange hover:bg-electric-orange hover:text-white'
                    }`}
                  >
                    {isBooked ? 'Booked ✓' : isFull ? 'Full' : 'Book'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

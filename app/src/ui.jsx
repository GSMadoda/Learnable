// Small styled primitives shared across the app screens, all built on the
// Learnable design tokens defined in index.css (@theme).
import { Loader2, X } from 'lucide-react'

export function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  const sizes = {
    sm: 'px-4 py-2 text-[14px]',
    md: 'px-[22px] py-3 text-[15px]',
    lg: 'px-[26px] py-3.5 text-base',
  }
  const variants = {
    primary:
      'bg-blue text-white hover:bg-blue-hover active:bg-blue-press disabled:opacity-60',
    ghost:
      'border border-line bg-white text-ink-navy hover:bg-blue-50 disabled:opacity-60',
    navy: 'bg-ink-navy text-white hover:opacity-90 disabled:opacity-60',
    danger: 'border border-line bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60',
  }
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 rounded-btn font-semibold transition-colors ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </Tag>
  )
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[13.5px] font-medium text-slate-700">{label}</span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-[12.5px] text-slate-400">{hint}</span>}
      {error && <span className="mt-1 block text-[12.5px] text-ink-navy">{error}</span>}
    </label>
  )
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-control border border-line bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-blue focus:shadow-focus ${props.className || ''}`}
    />
  )
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-control border border-line bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-blue focus:shadow-focus ${props.className || ''}`}
    />
  )
}

export function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <Loader2 size={26} className="animate-spin text-blue" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}

export function Modal({ onClose, children, labelledBy }) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-ink-navy/40 px-4 py-8 backdrop-blur-sm"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        className="relative w-full max-w-[440px] rounded-panel border border-line bg-white p-6 shadow-mock sm:p-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-control text-slate-400 transition-colors hover:bg-slate-50 hover:text-ink-navy"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}

export function Pill({ children, className = '' }) {
  return (
    <span
      className={`inline-block rounded-full bg-blue-50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-blue-700 ${className}`}
    >
      {children}
    </span>
  )
}

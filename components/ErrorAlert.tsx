'use client'

import { AlertTriangle } from 'lucide-react'
interface ErrorState {
  message: string
  field?: string
  type: 'validation' | 'network' | 'server'
}

interface ErrorAlertProps {
  error: ErrorState | null
  onDismiss?: () => void
}

export default function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  if (!error) return null

  // Determine styling based on error type
  const bgColor = {
    validation: 'bg-red-50 border-red-200',
    network: 'bg-yellow-50 border-yellow-200',
    server: 'bg-red-50 border-red-200'
  }[error.type]

  const textColor = {
    validation: 'text-red-600',
    network: 'text-yellow-600',
    server: 'text-red-600'
  }[error.type]

  const iconColor = {
    validation: 'text-red-500',
    network: 'text-yellow-500',
    server: 'text-red-500'
  }[error.type]

  return (
    <div className={`rounded-xl border p-4 ${bgColor} animate-shake mb-4 scroll-mt-24`} role="alert">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle size={20} className={iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${textColor} leading-relaxed`}>
              {error.message}
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 rounded p-1`}
            aria-label="Tutup pesan"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

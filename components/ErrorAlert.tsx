'use client'

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
    <div className={`rounded-xl border p-4 ${bgColor} animate-shake mb-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className={`text-xl ${iconColor}`}>⚠️</span>
          <div>
            <p className={`text-sm font-medium ${textColor}`}>
              {error.message}
            </p>
            {error.field && (
              <p className={`text-xs mt-1 ${textColor} opacity-75`}>
                Field: {error.field}
              </p>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`ml-4 ${textColor} hover:opacity-70 transition-opacity`}
            aria-label="Dismiss error"
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

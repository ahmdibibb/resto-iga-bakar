import { ShieldAlert, Mail } from 'lucide-react'

interface PermissionErrorProps {
  message?: string
  action?: string
  contactAdmin?: boolean
}

export default function PermissionError({ 
  message = "You do not have permission to perform this action.",
  action = "access this resource",
  contactAdmin = true
}: PermissionErrorProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border-2 border-red-200 p-8 text-center shadow-lg">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} className="text-red-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {/* Details */}
          <div className="bg-red-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-red-800">
              <strong>Reason:</strong> Your current role does not have permission to {action}.
            </p>
            {action.includes("modify") || action.includes("write") ? (
              <p className="text-sm text-red-800 mt-2">
                <strong>Note:</strong> OWNER role has view-only access to operational data. Only ADMIN users can make modifications.
              </p>
            ) : null}
          </div>

          {/* Contact Admin */}
          {contactAdmin && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Mail size={16} />
              <span>
                Need access? <a href="mailto:admin@example.com" className="text-blue-600 hover:text-blue-700 font-medium">Contact Admin</a>
              </span>
            </div>
          )}

          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

// Specific error components for common scenarios
export function OwnerWriteError() {
  return (
    <PermissionError
      message="OWNER users have view-only access to this resource."
      action="modify operational data"
    />
  )
}

export function AdminOwnerModificationError() {
  return (
    <PermissionError
      message="ADMIN users cannot create or modify OWNER accounts."
      action="manage OWNER accounts"
    />
  )
}

export function UnauthorizedRoleError({ requiredRole }: { requiredRole: string }) {
  return (
    <PermissionError
      message={`This page requires ${requiredRole} role access.`}
      action={`access ${requiredRole}-only features`}
    />
  )
}

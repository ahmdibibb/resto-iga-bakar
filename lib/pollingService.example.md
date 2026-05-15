# Polling Service Usage Examples

This document demonstrates how to use the `createPollingService` utility in various scenarios.

## Basic Usage in Payment Page

```typescript
'use client'

import { useEffect, useState, useRef } from 'react'
import { createPollingService, PollingService } from '@/lib/pollingService'

export default function PaymentPage() {
  const [order, setOrder] = useState<Order | null>(null)
  const pollingServiceRef = useRef<PollingService | null>(null)
  const sessionId = useRef<string | null>(null)

  useEffect(() => {
    // Get session_id from localStorage
    sessionId.current = localStorage.getItem('session_id')

    // Create polling service
    pollingServiceRef.current = createPollingService({
      fetchFn: async () => {
        if (!sessionId.current) return

        const res = await fetch(`/api/orders/status?session_id=${sessionId.current}`)
        const data = await res.json()

        if (res.ok) {
          setOrder(data)

          // Stop polling if order is completed or cancelled
          if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
            pollingServiceRef.current?.stop()
          }
        }
      },
      interval: 5000, // Poll every 5 seconds
      maxRetries: 3,
      onMaxRetriesReached: () => {
        console.error('Failed to fetch order status after 3 retries')
        // Optionally show error message to user
      }
    })

    // Start polling
    pollingServiceRef.current.start()

    // Cleanup on unmount
    return () => {
      pollingServiceRef.current?.stop()
    }
  }, [])

  return (
    <div>
      {/* Payment page UI */}
    </div>
  )
}
```

## Usage in Kasir Dashboard

```typescript
'use client'

import { useEffect, useState, useRef } from 'react'
import { createPollingService, PollingService } from '@/lib/pollingService'

export default function KasirPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const pollingServiceRef = useRef<PollingService | null>(null)

  useEffect(() => {
    // Create polling service for kasir orders
    pollingServiceRef.current = createPollingService({
      fetchFn: async () => {
        const res = await fetch('/api/kasir/orders')
        
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setOrders(data)
          }
        } else if (res.status === 401 || res.status === 403) {
          // Stop polling and redirect to login
          pollingServiceRef.current?.stop()
          window.location.href = '/login'
        }
      },
      interval: 5000,
      maxRetries: 3,
      onMaxRetriesReached: () => {
        console.error('Failed to fetch kasir orders')
      }
    })

    // Start polling
    pollingServiceRef.current.start()

    // Cleanup on unmount
    return () => {
      pollingServiceRef.current?.stop()
    }
  }, [])

  return (
    <div>
      {/* Kasir dashboard UI */}
    </div>
  )
}
```

## Advanced Usage with Conditional Polling

```typescript
'use client'

import { useEffect, useState, useRef } from 'react'
import { createPollingService, PollingService } from '@/lib/pollingService'

export default function OrderStatusPage() {
  const [order, setOrder] = useState<Order | null>(null)
  const [shouldPoll, setShouldPoll] = useState(true)
  const pollingServiceRef = useRef<PollingService | null>(null)

  useEffect(() => {
    if (!shouldPoll) return

    pollingServiceRef.current = createPollingService({
      fetchFn: async () => {
        const res = await fetch('/api/orders/123')
        const data = await res.json()

        if (res.ok) {
          setOrder(data)

          // Stop polling based on order status
          if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
            setShouldPoll(false)
            pollingServiceRef.current?.stop()
          }
        }
      },
      interval: 5000,
      maxRetries: 3,
      onMaxRetriesReached: () => {
        setShouldPoll(false)
        // Show error to user
      }
    })

    pollingServiceRef.current.start()

    return () => {
      pollingServiceRef.current?.stop()
    }
  }, [shouldPoll])

  return (
    <div>
      {/* Order status UI */}
      {!shouldPoll && (
        <button onClick={() => setShouldPoll(true)}>
          Retry Polling
        </button>
      )}
    </div>
  )
}
```

## Custom Interval and Retry Configuration

```typescript
// Fast polling with fewer retries
const fastPollingService = createPollingService({
  fetchFn: async () => {
    // Fetch logic
  },
  interval: 2000, // Poll every 2 seconds
  maxRetries: 2
})

// Slow polling with more retries
const slowPollingService = createPollingService({
  fetchFn: async () => {
    // Fetch logic
  },
  interval: 10000, // Poll every 10 seconds
  maxRetries: 5
})
```

## Manual Start/Stop Control

```typescript
const pollingService = createPollingService({
  fetchFn: async () => {
    // Fetch logic
  },
  interval: 5000
})

// Start polling when needed
function handleStartPolling() {
  pollingService.start()
}

// Stop polling when needed
function handleStopPolling() {
  pollingService.stop()
}

// Check if polling is active
function handleCheckStatus() {
  if (pollingService.isRunning()) {
    console.log('Polling is active')
  } else {
    console.log('Polling is stopped')
  }
}
```

## Error Handling Example

```typescript
const pollingService = createPollingService({
  fetchFn: async () => {
    const res = await fetch('/api/orders/status')
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
    
    const data = await res.json()
    setOrder(data)
  },
  interval: 5000,
  maxRetries: 3,
  onMaxRetriesReached: () => {
    // Show user-friendly error message
    setError('Unable to fetch order status. Please refresh the page.')
    
    // Optionally, provide a retry button
    setShowRetryButton(true)
  }
})
```

## Exponential Backoff Behavior

The polling service implements exponential backoff on errors:

- **Normal polling**: Every 5 seconds (default interval)
- **1st error**: Retry after 10 seconds (5000 * 2^1)
- **2nd error**: Retry after 20 seconds (5000 * 2^2)
- **3rd error**: Stop polling and call `onMaxRetriesReached`

After a successful poll, the retry count resets to 0, and normal polling resumes.

## Best Practices

1. **Always cleanup**: Use `useEffect` cleanup function to stop polling on unmount
2. **Store in ref**: Use `useRef` to store the polling service instance
3. **Conditional polling**: Stop polling when data is no longer needed (e.g., order completed)
4. **Error handling**: Provide `onMaxRetriesReached` callback for user feedback
5. **Authentication**: Stop polling and redirect on 401/403 errors
6. **Memory leaks**: Always call `stop()` before component unmounts

## Requirements Satisfied

- **14.1**: Poll every 5 seconds (configurable interval)
- **14.2**: Display current order status (via fetchFn updating state)
- **14.3**: Update UI within 5 seconds (automatic via polling)
- **14.6**: Stop polling when order is COMPLETED or CANCELLED
- **Exponential backoff**: Retry with increasing delays on errors
- **Cleanup**: Proper cleanup via stop() method

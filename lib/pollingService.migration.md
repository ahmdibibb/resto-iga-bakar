# Migration Guide: Using Polling Service Utility

This guide shows how to migrate existing inline polling code to use the `createPollingService` utility.

## Before: Inline Polling in Payment Page

```typescript
// app/payment/[orderId]/page.tsx (OLD APPROACH)

export default function PaymentPage() {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionId = useRef<string | null>(null)

  useEffect(() => {
    sessionId.current = localStorage.getItem('session_id')
    fetchOrder()
  }, [orderId])

  useEffect(() => {
    if (order && sessionId.current) {
      startPolling()
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [order])

  const startPolling = () => {
    pollingIntervalRef.current = setInterval(async () => {
      if (!sessionId.current) return

      try {
        const res = await fetch(`/api/orders/status?session_id=${sessionId.current}`)
        const data = await res.json()

        if (res.ok) {
          setOrder(data)

          if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
            }

            if (data.status === 'COMPLETED') {
              setTimeout(() => {
                router.push(`/receipt/${orderId}`)
              }, 2000)
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 5000)
  }

  // ... rest of component
}
```

**Issues with this approach:**
- ❌ No error retry mechanism
- ❌ No exponential backoff
- ❌ Manual cleanup management
- ❌ Code duplication across components
- ❌ No max retry limit
- ❌ Difficult to test

## After: Using Polling Service Utility

```typescript
// app/payment/[orderId]/page.tsx (NEW APPROACH)

import { createPollingService, PollingService } from '@/lib/pollingService'

export default function PaymentPage() {
  const pollingServiceRef = useRef<PollingService | null>(null)
  const sessionId = useRef<string | null>(null)

  useEffect(() => {
    sessionId.current = localStorage.getItem('session_id')
    fetchOrder()
  }, [orderId])

  useEffect(() => {
    if (!order || !sessionId.current) return

    // Create polling service with exponential backoff
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

            if (data.status === 'COMPLETED') {
              setTimeout(() => {
                router.push(`/receipt/${orderId}`)
              }, 2000)
            }
          }
        }
      },
      interval: 5000,
      maxRetries: 3,
      onMaxRetriesReached: () => {
        console.error('Failed to fetch order status after 3 retries')
        setError('Unable to fetch order status. Please refresh the page.')
      }
    })

    // Start polling
    pollingServiceRef.current.start()

    // Automatic cleanup
    return () => {
      pollingServiceRef.current?.stop()
    }
  }, [order])

  // ... rest of component
}
```

**Benefits of this approach:**
- ✅ Automatic error retry with exponential backoff
- ✅ Configurable max retries
- ✅ Clean API with start/stop methods
- ✅ Automatic cleanup
- ✅ Reusable across components
- ✅ Easier to test
- ✅ Better error handling

## Before: Inline Polling in Kasir Dashboard

```typescript
// app/kasir/page.tsx (OLD APPROACH)

export default function KasirPage() {
  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/kasir/orders')
      
      if (!res.ok) {
        setOrders([])
        if (res.status === 401 || res.status === 403) {
          router.push('/login')
        }
        return
      }
      
      const data = await res.json()
      if (Array.isArray(data)) {
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    }
  }

  // ... rest of component
}
```

**Issues:**
- ❌ No retry mechanism on network errors
- ❌ Continues polling even after repeated failures
- ❌ No exponential backoff

## After: Using Polling Service Utility

```typescript
// app/kasir/page.tsx (NEW APPROACH)

import { createPollingService, PollingService } from '@/lib/pollingService'

export default function KasirPage() {
  const pollingServiceRef = useRef<PollingService | null>(null)

  useEffect(() => {
    pollingServiceRef.current = createPollingService({
      fetchFn: async () => {
        const res = await fetch('/api/kasir/orders')
        
        if (!res.ok) {
          setOrders([])
          if (res.status === 401 || res.status === 403) {
            pollingServiceRef.current?.stop()
            router.push('/login')
          }
          throw new Error(`HTTP ${res.status}`)
        }
        
        const data = await res.json()
        if (Array.isArray(data)) {
          setOrders(data)
        }
      },
      interval: 5000,
      maxRetries: 3,
      onMaxRetriesReached: () => {
        console.error('Failed to fetch orders after 3 retries')
        setError('Unable to fetch orders. Please refresh the page.')
      }
    })

    pollingServiceRef.current.start()

    return () => {
      pollingServiceRef.current?.stop()
    }
  }, [])

  // ... rest of component
}
```

**Benefits:**
- ✅ Automatic retry with exponential backoff
- ✅ Stops polling after max retries
- ✅ Better error handling
- ✅ Cleaner code

## Migration Checklist

When migrating to the polling service utility:

1. ✅ Import `createPollingService` and `PollingService` types
2. ✅ Replace `setInterval` with `createPollingService`
3. ✅ Move fetch logic into `fetchFn` callback
4. ✅ Add error handling (throw errors for retry mechanism)
5. ✅ Configure `interval` and `maxRetries`
6. ✅ Add `onMaxRetriesReached` callback for user feedback
7. ✅ Store polling service in `useRef`
8. ✅ Call `start()` to begin polling
9. ✅ Call `stop()` in cleanup function
10. ✅ Remove manual `clearInterval` calls

## Testing the Migration

After migration, verify:

1. **Normal polling**: Orders/status updates every 5 seconds
2. **Error handling**: Network errors trigger exponential backoff
3. **Max retries**: Polling stops after 3 consecutive failures
4. **Cleanup**: No memory leaks when component unmounts
5. **Stop conditions**: Polling stops when order is COMPLETED/CANCELLED
6. **Authentication**: Polling stops and redirects on 401/403 errors

## Performance Comparison

| Metric | Old Approach | New Approach |
|--------|-------------|--------------|
| Error retry | ❌ None | ✅ Exponential backoff |
| Max retries | ❌ Infinite | ✅ Configurable (default: 3) |
| Memory leaks | ⚠️ Manual cleanup | ✅ Automatic cleanup |
| Code reuse | ❌ Duplicated | ✅ Reusable utility |
| Testability | ⚠️ Difficult | ✅ Easy to test |
| Network efficiency | ⚠️ Constant polling | ✅ Backoff on errors |

## Future Enhancements

The polling service utility can be extended with:

- WebSocket support for real-time updates
- Adaptive polling intervals based on activity
- Pause/resume functionality
- Custom backoff strategies
- Polling statistics and metrics

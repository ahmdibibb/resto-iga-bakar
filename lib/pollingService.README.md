# Polling Service Utility

A reusable polling service for real-time order status updates with exponential backoff error handling.

## Overview

The `createPollingService` utility provides a robust polling mechanism for the QR Code Table Ordering System. It handles real-time updates for payment pages and kasir dashboards with automatic error recovery and resource cleanup.

## Features

✅ **Configurable Polling Interval** - Default 5 seconds, customizable per use case
✅ **Exponential Backoff** - Automatic retry with increasing delays on errors
✅ **Max Retry Limit** - Prevents infinite retry loops (default: 3 retries)
✅ **Start/Stop Controls** - Manual control over polling lifecycle
✅ **Automatic Cleanup** - Prevents memory leaks on component unmount
✅ **TypeScript Support** - Fully typed with comprehensive interfaces

## Requirements Satisfied

- **14.1**: Poll every 5 seconds ✅
- **14.2**: Display current order status ✅
- **14.3**: Update UI within 5 seconds ✅
- **14.6**: Stop polling when order is COMPLETED or CANCELLED ✅

## Installation

The utility is located at `/lib/pollingService.ts` and can be imported directly:

```typescript
import { createPollingService, PollingService } from '@/lib/pollingService'
```

## Basic Usage

```typescript
import { useEffect, useRef } from 'react'
import { createPollingService, PollingService } from '@/lib/pollingService'

export default function PaymentPage() {
  const pollingServiceRef = useRef<PollingService | null>(null)

  useEffect(() => {
    // Create polling service
    pollingServiceRef.current = createPollingService({
      fetchFn: async () => {
        const res = await fetch('/api/orders/status')
        const data = await res.json()
        setOrder(data)
        
        // Stop polling when order is complete
        if (data.status === 'COMPLETED') {
          pollingServiceRef.current?.stop()
        }
      },
      interval: 5000,
      maxRetries: 3,
      onMaxRetriesReached: () => {
        console.error('Failed to fetch order status')
      }
    })

    // Start polling
    pollingServiceRef.current.start()

    // Cleanup on unmount
    return () => {
      pollingServiceRef.current?.stop()
    }
  }, [])

  return <div>{/* Your UI */}</div>
}
```

## API Reference

### `createPollingService(options: PollingServiceOptions): PollingService`

Creates a new polling service instance.

#### Parameters

```typescript
interface PollingServiceOptions {
  /** Function to call on each poll */
  fetchFn: () => Promise<void>
  
  /** Polling interval in milliseconds (default: 5000ms) */
  interval?: number
  
  /** Maximum number of consecutive retries on error (default: 3) */
  maxRetries?: number
  
  /** Callback when max retries reached */
  onMaxRetriesReached?: () => void
}
```

#### Returns

```typescript
interface PollingService {
  /** Start polling */
  start: () => void
  
  /** Stop polling and cleanup */
  stop: () => void
  
  /** Check if currently polling */
  isRunning: () => boolean
}
```

## Exponential Backoff

When errors occur, the polling service automatically retries with exponential backoff:

| Attempt | Delay (5s interval) | Formula |
|---------|---------------------|---------|
| Normal  | 5 seconds           | `interval` |
| 1st error | 10 seconds        | `interval × 2¹` |
| 2nd error | 20 seconds        | `interval × 2²` |
| 3rd error | Stop polling      | Max retries reached |

After a successful poll, the retry count resets to 0.

## Use Cases

### 1. Payment Page Polling

Poll order status to detect payment confirmation and order progress:

```typescript
const pollingService = createPollingService({
  fetchFn: async () => {
    const res = await fetch(`/api/orders/status?session_id=${sessionId}`)
    const data = await res.json()
    setOrder(data)
    
    if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
      pollingService.stop()
    }
  },
  interval: 5000
})
```

### 2. Kasir Dashboard Polling

Poll for new orders in the kasir queue:

```typescript
const pollingService = createPollingService({
  fetchFn: async () => {
    const res = await fetch('/api/kasir/orders')
    if (res.ok) {
      const data = await res.json()
      setOrders(data)
    } else if (res.status === 401) {
      pollingService.stop()
      router.push('/login')
    }
  },
  interval: 5000,
  maxRetries: 3
})
```

### 3. Admin Dashboard Polling

Poll for real-time order monitoring:

```typescript
const pollingService = createPollingService({
  fetchFn: async () => {
    const res = await fetch('/api/admin/orders')
    const data = await res.json()
    setOrders(data)
  },
  interval: 5000
})
```

## Error Handling

The polling service handles errors gracefully:

1. **Network Errors**: Automatically retries with exponential backoff
2. **Max Retries**: Stops polling after reaching max retries
3. **Callback Notification**: Calls `onMaxRetriesReached` when max retries reached
4. **Manual Stop**: Can be stopped manually at any time

```typescript
const pollingService = createPollingService({
  fetchFn: async () => {
    const res = await fetch('/api/orders/status')
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    
    const data = await res.json()
    setOrder(data)
  },
  interval: 5000,
  maxRetries: 3,
  onMaxRetriesReached: () => {
    // Show error to user
    setError('Unable to fetch order status. Please refresh the page.')
    setShowRetryButton(true)
  }
})
```

## Best Practices

1. **Always use `useRef`** to store the polling service instance
2. **Always cleanup** by calling `stop()` in the useEffect cleanup function
3. **Stop polling** when data is no longer needed (e.g., order completed)
4. **Handle authentication errors** by stopping polling and redirecting
5. **Provide user feedback** via `onMaxRetriesReached` callback
6. **Throw errors in fetchFn** to trigger retry mechanism

## Documentation

- **Usage Examples**: See `pollingService.example.md`
- **Migration Guide**: See `pollingService.migration.md`
- **Requirements**: See `pollingService.requirements.md`

## Files

- `lib/pollingService.ts` - Main implementation
- `lib/pollingService.example.md` - Usage examples
- `lib/pollingService.migration.md` - Migration guide from inline polling
- `lib/pollingService.requirements.md` - Requirements verification
- `lib/pollingService.README.md` - This file

## TypeScript

The utility is fully typed and will provide IntelliSense in your IDE:

```typescript
// Type-safe polling service
const pollingService: PollingService = createPollingService({
  fetchFn: async () => { /* ... */ },
  interval: 5000,
  maxRetries: 3
})

// Type-safe methods
pollingService.start()    // void
pollingService.stop()     // void
pollingService.isRunning() // boolean
```

## Testing

While unit tests are not included (no testing framework configured), the implementation has been:

- ✅ Type-checked with TypeScript compiler
- ✅ Verified against requirements 14.1, 14.2, 14.3, 14.6
- ✅ Documented with comprehensive examples
- ✅ Designed for easy integration and testing

## Future Enhancements

Potential improvements for future versions:

- WebSocket support for real-time updates
- Adaptive polling intervals based on activity
- Pause/resume functionality
- Custom backoff strategies
- Polling statistics and metrics
- React hook wrapper (`usePolling`)

## Support

For questions or issues, refer to:
- Requirements document: `.kiro/specs/qr-code-table-ordering/requirements.md`
- Design document: `.kiro/specs/qr-code-table-ordering/design.md`
- Task list: `.kiro/specs/qr-code-table-ordering/tasks.md`

## License

Part of the QR Code Table Ordering System.

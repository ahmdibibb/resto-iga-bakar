/**
 * Polling Service Utility
 * 
 * Provides a reusable polling service for real-time updates with:
 * - Configurable polling interval
 * - Exponential backoff on errors
 * - Start/stop controls
 * - Automatic cleanup
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.6
 */

export interface PollingServiceOptions {
  /** Function to call on each poll */
  fetchFn: () => Promise<void>
  /** Polling interval in milliseconds (default: 5000ms) */
  interval?: number
  /** Maximum number of consecutive retries on error (default: 3) */
  maxRetries?: number
  /** Callback when max retries reached */
  onMaxRetriesReached?: () => void
}

export interface PollingService {
  /** Start polling */
  start: () => void
  /** Stop polling and cleanup */
  stop: () => void
  /** Check if currently polling */
  isRunning: () => boolean
}

/**
 * Create a polling service with exponential backoff on errors
 * 
 * @param options - Polling service configuration
 * @returns PollingService with start() and stop() methods
 * 
 * @example
 * ```typescript
 * const pollingService = createPollingService({
 *   fetchFn: async () => {
 *     const res = await fetch('/api/orders/status?session_id=123')
 *     const data = await res.json()
 *     setOrder(data)
 *   },
 *   interval: 5000,
 *   maxRetries: 3,
 *   onMaxRetriesReached: () => {
 *     console.error('Failed to fetch order status')
 *   }
 * })
 * 
 * // Start polling
 * pollingService.start()
 * 
 * // Stop polling (e.g., on component unmount)
 * return () => pollingService.stop()
 * ```
 */
export function createPollingService(
  options: PollingServiceOptions
): PollingService {
  const {
    fetchFn,
    interval = 5000,
    maxRetries = 3,
    onMaxRetriesReached
  } = options

  let timeoutId: NodeJS.Timeout | null = null
  let retryCount = 0
  let running = false

  /**
   * Execute a single poll cycle
   * Implements exponential backoff on errors
   */
  async function poll() {
    if (!running) return

    try {
      await fetchFn()
      retryCount = 0 // Reset retry count on success

      // Schedule next poll with normal interval
      if (running) {
        timeoutId = setTimeout(poll, interval)
      }
    } catch (error) {
      console.error('Polling error:', error)
      retryCount++

      if (retryCount < maxRetries) {
        // Exponential backoff: interval * 2^retryCount
        const backoffDelay = interval * Math.pow(2, retryCount)
        console.warn(
          `Polling failed (attempt ${retryCount}/${maxRetries}). Retrying in ${backoffDelay}ms...`
        )

        // Schedule retry with exponential backoff
        if (running) {
          timeoutId = setTimeout(poll, backoffDelay)
        }
      } else {
        console.error(
          `Max polling retries (${maxRetries}) reached. Stopping polling.`
        )
        running = false
        
        // Notify caller that max retries reached
        if (onMaxRetriesReached) {
          onMaxRetriesReached()
        }
      }
    }
  }

  /**
   * Start the polling service
   * Safe to call multiple times - will not create duplicate polls
   */
  function start() {
    if (running) {
      console.warn('Polling service is already running')
      return
    }

    running = true
    retryCount = 0
    poll()
  }

  /**
   * Stop the polling service and cleanup
   * Safe to call multiple times
   */
  function stop() {
    running = false
    
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    
    retryCount = 0
  }

  /**
   * Check if polling service is currently running
   */
  function isRunning() {
    return running
  }

  return {
    start,
    stop,
    isRunning
  }
}

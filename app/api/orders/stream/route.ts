import { NextRequest } from 'next/server'
import { orderEventEmitter } from '@/lib/orderEvents'
import { withApiPermission } from '@/lib/apiPermissions'

// Force dynamic rendering since we are streaming real-time events
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Check authorization - KASIR or ADMIN only
  const { response, user } = await withApiPermission(request, {
    allowedRoles: ['KASIR', 'ADMIN'],
    resource: 'ORDER'
  })

  if (response) {
    return response
  }

  const encoder = new TextEncoder()

  const customReadable = new ReadableStream({
    start(controller) {
      // Helper function to format and send SSE events
      const sendEvent = (event: string, data: any) => {
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(payload))
        } catch (err) {
          console.error('Failed to enqueue data to stream:', err)
        }
      }

      // Event handler callbacks
      const handleOrderUpdate = (order: any) => {
        sendEvent('orderUpdate', order)
      }

      const handleOrderCreate = (order: any) => {
        sendEvent('orderCreate', order)
      }

      // Subscribe to order events
      orderEventEmitter.on('orderUpdate', handleOrderUpdate)
      orderEventEmitter.on('orderCreate', handleOrderCreate)

      // Send initial connect ping
      sendEvent('ping', { connected: true })

      // Keep-alive mechanism to prevent stream timeouts
      const keepAliveInterval = setInterval(() => {
        sendEvent('ping', { time: Date.now() })
      }, 30000)

      // Cleanup when connection closes or aborts
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval)
        orderEventEmitter.off('orderUpdate', handleOrderUpdate)
        orderEventEmitter.off('orderCreate', handleOrderCreate)
        try {
          controller.close()
        } catch (e) {
          // Stream might already be closed
        }
      })
    }
  })

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}

import { EventEmitter } from 'events'

const globalForEmitter = globalThis as unknown as {
  orderEventEmitter: EventEmitter | undefined
}

export const orderEventEmitter =
  globalForEmitter.orderEventEmitter ?? new EventEmitter()

if (process.env.NODE_ENV !== 'production') {
  globalForEmitter.orderEventEmitter = orderEventEmitter
}

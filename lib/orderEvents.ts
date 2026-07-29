import { EventEmitter } from 'events'

const globalForEmitter = globalThis as unknown as {
  orderEventEmitter: EventEmitter | undefined
}

export const orderEventEmitter =
  globalForEmitter.orderEventEmitter ?? new EventEmitter()

globalForEmitter.orderEventEmitter = orderEventEmitter

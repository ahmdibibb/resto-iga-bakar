/**
 * Timezone utility functions for WIB (Asia/Jakarta, UTC+7)
 */

export const WIB_TIMEZONE = 'Asia/Jakarta'

/** Calendar date in WIB as YYYY-MM-DD */
export function getWibDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: WIB_TIMEZONE }).format(date)
}

/** Hour in WIB as 00–23 */
export function getWibHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: WIB_TIMEZONE,
      hour: '2-digit',
      hour12: false,
    }).format(date)
  )
}

/** Start of calendar day in WIB (inclusive) */
export function getStartOfDayWIB(date: Date = new Date()): Date {
  const dateStr = getWibDateString(date)
  return new Date(`${dateStr}T00:00:00+07:00`)
}

/** End of calendar day in WIB (inclusive) */
export function getEndOfDayWIB(date: Date = new Date()): Date {
  const dateStr = getWibDateString(date)
  return new Date(`${dateStr}T23:59:59.999+07:00`)
}

/** Parse YYYY-MM-DD as a WIB calendar day */
export function parseWibDateStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+07:00`)
}

export function parseWibDateEnd(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999+07:00`)
}

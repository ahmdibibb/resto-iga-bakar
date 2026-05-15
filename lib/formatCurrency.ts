/**
 * Format number to Indonesian Rupiah currency format
 * @param amount - The amount to format
 * @param includeDecimals - Whether to include decimal places (default: false)
 * @returns Formatted string like "Rp 100.000" or "Rp 100.000,00"
 */
export function formatRupiah(amount: number, includeDecimals: boolean = false): string {
    if (includeDecimals) {
        return `Rp ${amount.toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`
    }

    return `Rp ${amount.toLocaleString('id-ID')}`
}

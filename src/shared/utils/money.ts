const formatters = new Map<string, Intl.NumberFormat>()

function getFormatter(currency: string, locale = 'en-IN') {
  const key = `${locale}:${currency}`
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    })
    formatters.set(key, formatter)
  }
  return formatter
}

/** Convert minor units (paise) to major units for display only. */
export function minorToMajor(amountMinor: number): number {
  return amountMinor / 100
}

export function formatMoney(amountMinor: number, currency = 'INR', locale = 'en-IN'): string {
  return getFormatter(currency, locale).format(minorToMajor(amountMinor))
}

import { formatMoney } from '@/shared/utils/money'

type PriceProps = {
  amountMinor: number
  currency?: string
  className?: string
}

export function Price({ amountMinor, currency = 'INR', className }: PriceProps) {
  return <span className={className}>{formatMoney(amountMinor, currency)}</span>
}

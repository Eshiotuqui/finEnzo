import type { CurrencyCode } from "@/types"

interface CurrencyInfo {
  code: CurrencyCode
  label: string
  symbol: string
  locale: string
  flag: string
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  BRL: { code: "BRL", label: "Real", symbol: "R$", locale: "pt-BR", flag: "🇧🇷" },
  USD: { code: "USD", label: "Dólar", symbol: "US$", locale: "en-US", flag: "🇺🇸" },
  EUR: { code: "EUR", label: "Euro", symbol: "€", locale: "de-DE", flag: "🇪🇺" },
}

export const CURRENCY_LIST = Object.values(CURRENCIES)

export function formatMoney(amount: number, currency: CurrencyCode): string {
  const info = CURRENCIES[currency]
  return new Intl.NumberFormat(info.locale, {
    style: "currency",
    currency: info.code,
  }).format(amount)
}

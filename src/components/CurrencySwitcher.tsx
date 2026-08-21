import { CURRENCY_LIST } from "@/lib/currency"
import { cn } from "@/lib/utils"
import type { CurrencyCode } from "@/types"
import type { RatesStore } from "@/hooks/useRates"

/**
 * Escolhe em que moeda os totais consolidados são mostrados
 * (saldo geral, orçamento, equivalências).
 */
export function CurrencySwitcher({
  rates,
  className,
}: {
  rates: RatesStore
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5",
        className
      )}
      role="group"
      aria-label="Moeda de exibição"
    >
      {CURRENCY_LIST.map((c) => {
        const active = rates.display === c.code
        return (
          <button
            key={c.code}
            type="button"
            onClick={() => rates.setDisplay(c.code as CurrencyCode)}
            aria-pressed={active}
            title={`Mostrar totais em ${c.label}`}
            className={cn(
              "flex h-8 min-w-9 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {c.symbol}
          </button>
        )
      })}
    </div>
  )
}

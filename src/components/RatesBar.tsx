import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react"

import { EditRatesDialog } from "@/components/EditRatesDialog"
import { CurrencySwitcher } from "@/components/CurrencySwitcher"
import { Button } from "@/components/ui/button"
import { CURRENCIES, CURRENCY_LIST, formatMoney } from "@/lib/currency"
import { cn } from "@/lib/utils"
import type { CurrencyCode } from "@/types"
import type { RatesStore } from "@/hooks/useRates"

function timeAgo(ts: number | null): string {
  if (!ts) return "—"
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return "agora mesmo"
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  return `há ${d} d`
}

export function RatesBar({ rates }: { rates: RatesStore }) {
  const { change, source, updatedAt, refresh, display } = rates
  const loading = source === "loading"
  // Mostra quanto vale 1 unidade das outras moedas na moeda de exibição.
  const others = CURRENCY_LIST.map((c) => c.code as CurrencyCode).filter(
    (c) => c !== display
  )

  const sourceLabel =
    source === "live"
      ? `cotação do dia · ${timeAgo(updatedAt)}`
      : source === "manual"
      ? "cotação manual"
      : source === "error"
      ? "sem conexão — usando última cotação"
      : source === "loading"
      ? "atualizando…"
      : "cotação estimada"

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {others.map((c) => {
          // A variação do dia é medida contra o real; só faz sentido ali.
          const pct = display === "BRL" ? change[c] : undefined
          const up = (pct ?? 0) >= 0
          const Arrow = up ? TrendingUp : TrendingDown
          return (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium"
            >
              <span>
                {CURRENCIES[c].flag} 1 {CURRENCIES[c].symbol} ={" "}
                {formatMoney(rates.convert(1, c, display), display)}
              </span>
              {pct !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 tabular-nums",
                    up
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  )}
                  title="Variação no dia"
                >
                  <Arrow className="h-3 w-3" />
                  {up ? "+" : ""}
                  {pct.toFixed(2).replace(".", ",")}%
                </span>
              )}
            </span>
          )
        })}
      </div>

      <span
        className={cn(
          "text-xs",
          source === "error" ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {sourceLabel}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <CurrencySwitcher rates={rates} />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => void refresh()}
          disabled={loading}
          title="Atualizar cotações"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
        <EditRatesDialog rates={rates} />
      </div>
    </div>
  )
}

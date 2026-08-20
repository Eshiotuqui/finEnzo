import { Pencil, RefreshCw, TrendingDown, TrendingUp } from "lucide-react"

import { EditRatesDialog } from "@/components/EditRatesDialog"
import { Button } from "@/components/ui/button"
import { CURRENCIES, formatMoney } from "@/lib/currency"
import { cn } from "@/lib/utils"
import type { CurrencyCode } from "@/types"
import type { RatesStore } from "@/hooks/useRates"

const FOREIGN: CurrencyCode[] = ["USD", "EUR"]

/** Cotações do dia em formato compacto, pensado para tela de celular. */
export function MobileRates({ rates }: { rates: RatesStore }) {
  const { ratesToBRL, change, source, refresh } = rates
  const loading = source === "loading"

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Cotação de hoje</h2>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => void refresh()}
            disabled={loading}
            aria-label="Atualizar cotações"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <EditRatesDialog
            rates={rates}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label="Ajustar cotações manualmente"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {FOREIGN.map((code) => {
          const info = CURRENCIES[code]
          const pct = change[code]
          const up = (pct ?? 0) >= 0
          const Arrow = up ? TrendingUp : TrendingDown
          return (
            <div key={code} className="rounded-xl border bg-card p-4">
              <span className="text-xs text-muted-foreground">
                {info.flag} 1 {info.symbol}
              </span>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatMoney(ratesToBRL[code], "BRL")}
              </p>
              {pct !== undefined && (
                <span
                  className={cn(
                    "mt-1 inline-flex items-center gap-1 text-xs font-medium",
                    up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                  )}
                >
                  <Arrow className="h-3.5 w-3.5" />
                  {up ? "+" : ""}
                  {pct.toFixed(2).replace(".", ",")}% hoje
                </span>
              )}
            </div>
          )
        })}
      </div>

      <p
        className={cn(
          "mt-2 text-xs",
          source === "error" ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {source === "live"
          ? "Cotação comercial ao vivo (AwesomeAPI)"
          : source === "manual"
          ? "Você definiu estas cotações manualmente"
          : source === "error"
          ? "Sem conexão — usando a última cotação salva"
          : source === "loading"
          ? "Atualizando…"
          : "Cotação estimada"}
      </p>
    </section>
  )
}

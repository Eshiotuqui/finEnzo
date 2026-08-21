import { TrendingDown, TrendingUp, Coins } from "lucide-react"

import { WhaleMark } from "@/components/WhaleMark"
import { Card, CardContent } from "@/components/ui/card"
import { CURRENCIES, formatMoney } from "@/lib/currency"
import { totalsByCurrency } from "@/lib/stats"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/types"
import type { RatesStore } from "@/hooks/useRates"

export function SummaryCards({
  transactions,
  rates,
}: {
  transactions: Transaction[]
  rates: RatesStore
}) {
  const totals = totalsByCurrency(transactions)
  const display = rates.display
  const displayInfo = CURRENCIES[display]

  if (totals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <WhaleMark className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Mar calmo por aqui</p>
          <p className="text-sm text-muted-foreground">
            Clique em “Novo lançamento” para começar a registrar suas finanças.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Consolidado: converte tudo para a moeda de exibição escolhida.
  const consolidated = totals.reduce(
    (acc, t) => {
      acc.income += rates.toDisplay(t.income, t.currency)
      acc.expense += rates.toDisplay(t.expense, t.currency)
      return acc
    },
    { income: 0, expense: 0 }
  )
  const consolidatedBalance = consolidated.income - consolidated.expense
  // Só vale consolidar quando há mais de uma moeda ou a única difere da exibição.
  const showConsolidated =
    totals.length > 1 || totals[0]?.currency !== display

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {showConsolidated && (
        <Card className="border-primary/40 bg-primary/5 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Coins className="h-4 w-4 text-primary" /> Total geral em{" "}
                {displayInfo.symbol}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  consolidatedBalance >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                )}
              >
                Saldo {formatMoney(consolidatedBalance, display)}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-emerald-500" /> Entradas
                </span>
                <span className="font-medium">
                  {formatMoney(consolidated.income, display)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingDown className="h-4 w-4 text-destructive" /> Gastos
                </span>
                <span className="font-medium">
                  {formatMoney(consolidated.expense, display)}
                </span>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Somando todas as moedas na cotação atual.
            </p>
          </CardContent>
        </Card>
      )}

      {totals.map((t) => {
        const info = CURRENCIES[t.currency]
        const needsConversion = t.currency !== display
        return (
          <Card key={t.currency}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {info.flag} {info.label}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    t.balance >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  )}
                >
                  Saldo {formatMoney(t.balance, t.currency)}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-emerald-500" /> Entradas
                  </span>
                  <span className="font-medium">
                    {formatMoney(t.income, t.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <TrendingDown className="h-4 w-4 text-destructive" /> Gastos
                  </span>
                  <span className="font-medium">
                    {formatMoney(t.expense, t.currency)}
                  </span>
                </div>
              </div>

              {needsConversion && (
                <p className="mt-3 text-xs text-muted-foreground tabular-nums">
                  Gastos ≈ {formatMoney(rates.toDisplay(t.expense, t.currency), display)}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

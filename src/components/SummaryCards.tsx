import { TrendingDown, TrendingUp, Wallet } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { CURRENCIES, formatMoney } from "@/lib/currency"
import { totalsByCurrency } from "@/lib/stats"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/types"

export function SummaryCards({ transactions }: { transactions: Transaction[] }) {
  const totals = totalsByCurrency(transactions)

  if (totals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <Wallet className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Nenhum lançamento ainda</p>
          <p className="text-sm text-muted-foreground">
            Clique em “Novo lançamento” para começar a registrar suas finanças.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {totals.map((t) => {
        const info = CURRENCIES[t.currency]
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
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

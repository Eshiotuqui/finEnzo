import { Pencil, PiggyBank, TriangleAlert } from "lucide-react"

import { BudgetDialog } from "@/components/BudgetDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CURRENCIES, formatMoney } from "@/lib/currency"
import { budgetProgress, hasBudget, type BudgetLine } from "@/lib/stats"
import { cn } from "@/lib/utils"
import { ALL_COLLECTIONS } from "@/hooks/useCollectionFilter"
import type { CurrencyAmounts, CurrencyCode } from "@/types"
import type { FinanceStore } from "@/hooks/useFinance"
import type { RatesStore } from "@/hooks/useRates"

function barColor(ratio: number): string {
  if (ratio >= 1) return "bg-destructive"
  if (ratio >= 0.8) return "bg-amber-500"
  return "bg-primary"
}

function Bar({ ratio, className }: { ratio: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, ratio * 100))
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", barColor(ratio))}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/**
 * Mostra quanto ainda pode ser gasto na coleção em foco.
 *
 * Em "Todas as coleções" soma os orçamentos existentes, considerando apenas os
 * lançamentos das coleções que têm orçamento — senão um gasto de coleção sem
 * orçamento comeria o saldo de outra.
 */
export function BudgetCard({
  store,
  rates,
  selectedCollection,
}: {
  store: FinanceStore
  rates: RatesStore
  selectedCollection: string
}) {
  const single =
    selectedCollection === ALL_COLLECTIONS
      ? null
      : store.collectionsById.get(selectedCollection) ?? null

  let budget: CurrencyAmounts = {}
  let transactions = store.transactions

  if (single) {
    budget = single.budget ?? {}
  } else {
    const budgeted = store.collections.filter((c) => hasBudget(c.budget))
    const ids = new Set(budgeted.map((c) => c.id))
    transactions = store.transactions.filter((t) => ids.has(t.collectionId))
    for (const c of budgeted) {
      for (const [code, value] of Object.entries(c.budget ?? {})) {
        const key = code as CurrencyCode
        budget[key] = (budget[key] ?? 0) + (value ?? 0)
      }
    }
  }

  if (!hasBudget(budget)) {
    // Convite para definir, só quando há uma coleção específica em foco.
    if (!single) return null
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <PiggyBank className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Sem orçamento em {single.icon} {single.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Diga quanto você separou e o app acompanha o quanto ainda pode gastar.
              </p>
            </div>
          </div>
          <BudgetDialog
            store={store}
            collection={single}
            trigger={
              <Button variant="outline" className="shrink-0">
                <PiggyBank /> Definir orçamento
              </Button>
            }
          />
        </CardContent>
      </Card>
    )
  }

  const lines = budgetProgress(transactions, budget)

  // Consolidado na moeda de exibição, pela cotação atual.
  const display = rates.display
  const total = lines.reduce(
    (acc, l) => {
      acc.budget += rates.toDisplay(l.budget, l.currency)
      acc.spent += rates.toDisplay(l.spent, l.currency)
      return acc
    },
    { budget: 0, spent: 0 }
  )
  const remaining = total.budget - total.spent
  const ratio = total.budget > 0 ? total.spent / total.budget : 1
  const over = remaining < 0
  const multiCurrency = lines.length > 1

  return (
    <Card className={cn(over && "border-destructive/50")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <PiggyBank className="h-4 w-4 text-primary" />
              {over ? "Passou do orçamento" : "Disponível para gastar"}
              {single ? ` · ${single.icon} ${single.name}` : " · todas as coleções"}
            </span>
            <p
              className={cn(
                "mt-1.5 text-3xl font-bold leading-none tabular-nums",
                over && "text-destructive"
              )}
            >
              {formatMoney(Math.abs(remaining), display)}
            </p>
          </div>
          {single && (
            <BudgetDialog
              store={store}
              collection={single}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label="Editar orçamento"
                >
                  <Pencil />
                </Button>
              }
            />
          )}
        </div>

        <Bar ratio={ratio} className="mt-4" />
        <p className="mt-2 text-xs text-muted-foreground tabular-nums">
          {formatMoney(total.spent, display)} gastos de{" "}
          {formatMoney(total.budget, display)} · {Math.round(ratio * 100)}% usado
          {multiCurrency && " (moedas somadas na cotação atual)"}
        </p>

        {(multiCurrency || lines.some((l) => l.budget === 0)) && (
          <ul className="mt-4 space-y-3 border-t pt-4">
            {lines.map((line) => (
              <li key={line.currency}>
                <BudgetLineRow line={line} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function BudgetLineRow({ line }: { line: BudgetLine }) {
  const info = CURRENCIES[line.currency]
  const noBudget = line.budget === 0

  return (
    <>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">
          {info.flag} {info.label}
        </span>
        {noBudget ? (
          <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <TriangleAlert className="h-3.5 w-3.5" />
            {formatMoney(line.spent, line.currency)} sem orçamento
          </span>
        ) : (
          <span
            className={cn(
              "tabular-nums",
              line.remaining < 0 ? "text-destructive" : "text-muted-foreground"
            )}
          >
            <span className="font-medium text-foreground">
              {formatMoney(line.remaining, line.currency)}
            </span>{" "}
            de {formatMoney(line.budget, line.currency)}
          </span>
        )}
      </div>
      {!noBudget && <Bar ratio={line.ratio} className="mt-1.5 h-1.5" />}
    </>
  )
}

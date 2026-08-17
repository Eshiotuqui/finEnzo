import { useMemo, useState } from "react"
import { Trash2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { chartColor } from "@/lib/colors"
import { formatMoney } from "@/lib/currency"
import { cn } from "@/lib/utils"
import type { FinanceStore } from "@/hooks/useFinance"

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

export function TransactionList({ store }: { store: FinanceStore }) {
  const { transactions, categoriesById, categories, deleteTransaction } = store
  const [filter, setFilter] = useState("all")

  const filtered = useMemo(() => {
    if (filter === "all") return transactions
    return transactions.filter((t) => t.categoryId === filter)
  }, [transactions, filter])

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Lançamentos</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.icon} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum lançamento encontrado.
          </p>
        ) : (
          <ul className="divide-y">
            {filtered.map((t) => {
              const cat = categoriesById.get(t.categoryId)
              const isExpense = t.type === "expense"
              return (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                    style={{
                      backgroundColor: chartColor(cat?.color ?? 1),
                      opacity: 0.9,
                    }}
                  >
                    {cat?.icon ?? "❓"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {t.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cat?.name ?? "Sem categoria"} · {formatDate(t.date)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      isExpense
                        ? "text-destructive"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {isExpense ? "-" : "+"}
                    {formatMoney(t.amount, t.currency)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteTransaction(t.id)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

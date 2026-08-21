import { useMemo, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TransactionForm } from "@/components/TransactionForm"
import { chartColor } from "@/lib/colors"
import { formatMoney } from "@/lib/currency"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/types"
import type { FinanceStore } from "@/hooks/useFinance"
import type { RatesStore } from "@/hooks/useRates"

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

export function TransactionList({
  store,
  rates,
}: {
  store: FinanceStore
  rates: RatesStore
}) {
  const { transactions, categoriesById, collectionsById, categories, deleteTransaction } =
    store
  const [filter, setFilter] = useState("all")
  const [editing, setEditing] = useState<Transaction | null>(null)

  // Só vale mostrar a coleção em cada linha quando a lista mistura mais de uma.
  const showCollection = useMemo(
    () => new Set(transactions.map((t) => t.collectionId)).size > 1,
    [transactions]
  )

  const filtered = useMemo(() => {
    if (filter === "all") return transactions
    return transactions.filter((t) => t.categoryId === filter)
  }, [transactions, filter])

  return (
    <Card>
      <CardHeader className="flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Lançamentos</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
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
                    <p className="truncate text-xs text-muted-foreground">
                      {cat?.name ?? "Sem categoria"} · {formatDate(t.date)}
                      {showCollection && (
                        <>
                          {" · "}
                          {collectionsById.get(t.collectionId)?.icon}{" "}
                          {collectionsById.get(t.collectionId)?.name ?? "Sem coleção"}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        isExpense
                          ? "text-destructive"
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {isExpense ? "-" : "+"}
                      {formatMoney(t.amount, t.currency)}
                    </span>
                    {t.currency !== "BRL" && (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        ≈ {formatMoney(rates.convertToBRL(t.amount, t.currency), "BRL")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setEditing(t)}
                      aria-label={`Editar ${t.description}`}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteTransaction(t.id)}
                      aria-label={`Excluir ${t.description}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      {/* Remontado a cada lançamento para que os campos venham preenchidos. */}
      {editing && (
        <TransactionForm
          key={editing.id}
          store={store}
          rates={rates}
          transaction={editing}
          open
          onOpenChange={(v) => {
            if (!v) setEditing(null)
          }}
          trigger={null}
        />
      )}
    </Card>
  )
}

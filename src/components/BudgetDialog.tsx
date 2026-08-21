import { useState } from "react"
import { Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CURRENCY_LIST } from "@/lib/currency"
import { hasBudget } from "@/lib/stats"
import type { Collection, CurrencyAmounts, CurrencyCode } from "@/types"
import type { FinanceStore } from "@/hooks/useFinance"

function toField(value?: number): string {
  return value ? String(value).replace(".", ",") : ""
}

/** Define quanto foi separado para uma coleção, moeda por moeda. */
export function BudgetDialog({
  store,
  collection,
  trigger,
}: {
  store: FinanceStore
  collection: Collection
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [error, setError] = useState("")

  function fill() {
    const next: Record<string, string> = {}
    for (const c of CURRENCY_LIST) next[c.code] = toField(collection.budget?.[c.code])
    setFields(next)
    setError("")
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    const budget: CurrencyAmounts = {}
    for (const c of CURRENCY_LIST) {
      const raw = (fields[c.code] ?? "").trim()
      if (!raw) continue
      const value = Number(raw.replace(",", "."))
      if (!Number.isFinite(value) || value < 0) {
        return setError(`Valor inválido em ${c.label}.`)
      }
      if (value > 0) budget[c.code] = value
    }
    store.setBudget(collection.id, Object.keys(budget).length ? budget : undefined)
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) fill()
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Wallet /> <span className="hidden sm:inline">Orçamento</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Orçamento de {collection.icon} {collection.name}
          </DialogTitle>
          <DialogDescription>
            Quanto você separou para gastar aqui. Preencha só as moedas que usar —
            deixar em branco significa sem orçamento naquela moeda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={save} className="space-y-4">
          {CURRENCY_LIST.map((c) => (
            <div key={c.code} className="space-y-1.5">
              <Label htmlFor={`budget-${c.code}`}>
                {c.flag} {c.label} ({c.symbol})
              </Label>
              <Input
                id={`budget-${c.code}`}
                inputMode="decimal"
                placeholder="0,00"
                value={fields[c.code] ?? ""}
                onChange={(e) =>
                  setFields((prev) => ({
                    ...prev,
                    [c.code as CurrencyCode]: e.target.value,
                  }))
                }
              />
            </div>
          ))}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            {hasBudget(collection.budget) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  store.setBudget(collection.id, undefined)
                  setOpen(false)
                }}
              >
                Remover
              </Button>
            )}
            <Button type="submit">Salvar orçamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

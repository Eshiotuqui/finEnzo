import { useState } from "react"
import { Plus } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CURRENCY_LIST } from "@/lib/currency"
import type { CurrencyCode, TransactionType } from "@/types"
import type { FinanceStore } from "@/hooks/useFinance"

function todayISO(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10)
}

export function TransactionForm({ store }: { store: FinanceStore }) {
  const { categories, addTransaction } = store
  const [open, setOpen] = useState(false)

  const [type, setType] = useState<TransactionType>("expense")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState<CurrencyCode>("BRL")
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState("")

  function reset() {
    setType("expense")
    setDescription("")
    setAmount("")
    setCurrency("BRL")
    setCategoryId(categories[0]?.id ?? "")
    setDate(todayISO())
    setError("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount.replace(",", "."))
    if (!description.trim()) return setError("Informe uma descrição.")
    if (!Number.isFinite(value) || value <= 0)
      return setError("Informe um valor maior que zero.")
    if (!categoryId) return setError("Selecione uma categoria.")

    addTransaction({
      description: description.trim(),
      amount: value,
      currency,
      type,
      categoryId,
      date,
    })
    reset()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus /> Novo lançamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
          <DialogDescription>
            Cadastre um gasto ou uma entrada de dinheiro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-lg border py-2 text-sm font-medium transition-colors cursor-pointer",
                  type === t
                    ? t === "expense"
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-input text-muted-foreground hover:bg-accent"
                )}
              >
                {t === "expense" ? "🔴 Gasto" : "🟢 Entrada"}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-desc">Descrição</Label>
            <Input
              id="tx-desc"
              placeholder="Ex: Passagem aérea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tx-amount">Valor</Label>
              <Input
                id="tx-amount"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Moeda</Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as CurrencyCode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_LIST.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tx-date">Data</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" className="w-full sm:w-auto">
              Salvar lançamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

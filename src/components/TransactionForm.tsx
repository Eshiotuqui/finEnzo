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
import { CURRENCY_LIST, formatMoney } from "@/lib/currency"
import type { CurrencyCode, Transaction, TransactionType } from "@/types"
import type { FinanceStore } from "@/hooks/useFinance"
import type { RatesStore } from "@/hooks/useRates"

function todayISO(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10)
}

export function TransactionForm({
  store,
  rates,
  open: openProp,
  onOpenChange,
  trigger,
  transaction,
  defaultCollectionId,
}: {
  store: FinanceStore
  rates: RatesStore
  /** Controlado de fora (ilha do mobile abre o formulário pelo botão “+”). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** `null` esconde o gatilho — use junto com `open`. */
  trigger?: React.ReactNode | null
  /**
   * Lançamento a editar. Como os campos são inicializados a partir dele, quem
   * usa este modo deve remontar o componente (`key={transaction.id}`).
   */
  transaction?: Transaction | null
  /** Coleção pré-selecionada em novos lançamentos (a que está em foco na tela). */
  defaultCollectionId?: string
}) {
  const { categories, collections, addTransaction, updateTransaction } = store
  const initialCollectionId =
    transaction?.collectionId ?? defaultCollectionId ?? collections[0]?.id ?? ""
  const editing = Boolean(transaction)
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = openProp ?? uncontrolledOpen
  const setOpen = (value: boolean) => {
    if (openProp === undefined) setUncontrolledOpen(value)
    onOpenChange?.(value)
  }

  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? "expense"
  )
  const [description, setDescription] = useState(transaction?.description ?? "")
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount).replace(".", ",") : ""
  )
  const [currency, setCurrency] = useState<CurrencyCode>(
    transaction?.currency ?? "BRL"
  )
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId ?? categories[0]?.id ?? ""
  )
  const [collectionId, setCollectionId] = useState(initialCollectionId)
  const [date, setDate] = useState(transaction?.date ?? todayISO())
  const [error, setError] = useState("")

  function reset() {
    if (transaction) return // em edição os campos vêm do lançamento
    setType("expense")
    setDescription("")
    setAmount("")
    setCurrency("BRL")
    setCategoryId(categories[0]?.id ?? "")
    setCollectionId(initialCollectionId)
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
    if (!collectionId) return setError("Selecione uma coleção.")

    const payload = {
      description: description.trim(),
      amount: value,
      currency,
      type,
      categoryId,
      collectionId,
      date,
    }

    if (transaction) updateTransaction(transaction.id, payload)
    else addTransaction(payload)

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
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus /> <span className="hidden sm:inline">Novo lançamento</span>
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar lançamento" : "Novo lançamento"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Ajuste os dados e salve as alterações."
              : "Cadastre um gasto ou uma entrada de dinheiro."}
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
            <Label>Coleção</Label>
            <Select value={collectionId} onValueChange={setCollectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-3">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="tx-amount">Valor</Label>
              <Input
                id="tx-amount"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="min-w-0 space-y-1.5">
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

          {currency !== "BRL" &&
            (() => {
              const value = Number(amount.replace(",", "."))
              if (!Number.isFinite(value) || value <= 0) return null
              return (
                <p className="-mt-1 text-sm text-muted-foreground">
                  ≈{" "}
                  <span className="font-medium text-foreground">
                    {formatMoney(rates.convertToBRL(value, currency), "BRL")}
                  </span>{" "}
                  na cotação atual
                </p>
              )
            })()}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
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
            <div className="min-w-0 space-y-1.5">
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
              {editing ? "Salvar alterações" : "Salvar lançamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

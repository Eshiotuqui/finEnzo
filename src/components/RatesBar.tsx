import { useState } from "react"
import { RefreshCw, Pencil } from "lucide-react"

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
import { CURRENCIES, formatMoney } from "@/lib/currency"
import { cn } from "@/lib/utils"
import type { CurrencyCode } from "@/types"
import type { RatesStore } from "@/hooks/useRates"

const FOREIGN: CurrencyCode[] = ["USD", "EUR"]

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
  const { ratesToBRL, source, updatedAt, refresh } = rates
  const loading = source === "loading"

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
        {FOREIGN.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium"
          >
            {CURRENCIES[c].flag} 1 {CURRENCIES[c].symbol} ={" "}
            {formatMoney(ratesToBRL[c], "BRL")}
          </span>
        ))}
      </div>

      <span
        className={cn(
          "text-xs",
          source === "error" ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {sourceLabel}
      </span>

      <div className="ml-auto flex items-center gap-1">
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

function EditRatesDialog({ rates }: { rates: RatesStore }) {
  const [open, setOpen] = useState(false)
  const [usd, setUsd] = useState(String(rates.ratesToBRL.USD))
  const [eur, setEur] = useState(String(rates.ratesToBRL.EUR))

  function save(e: React.FormEvent) {
    e.preventDefault()
    const u = Number(usd.replace(",", "."))
    const ev = Number(eur.replace(",", "."))
    if (Number.isFinite(u) && u > 0) rates.setManualRate("USD", u)
    if (Number.isFinite(ev) && ev > 0) rates.setManualRate("EUR", ev)
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) {
          setUsd(String(rates.ratesToBRL.USD))
          setEur(String(rates.ratesToBRL.EUR))
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Ajustar cotações manualmente"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar cotações</DialogTitle>
          <DialogDescription>
            Defina quanto vale 1 unidade em reais. Ao salvar, o app passa a usar
            sua cotação manual.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rate-usd">🇺🇸 1 Dólar em R$</Label>
            <Input
              id="rate-usd"
              inputMode="decimal"
              value={usd}
              onChange={(e) => setUsd(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rate-eur">🇪🇺 1 Euro em R$</Label>
            <Input
              id="rate-eur"
              inputMode="decimal"
              value={eur}
              onChange={(e) => setEur(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void rates.refresh()
                setOpen(false)
              }}
            >
              Usar cotação do dia
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

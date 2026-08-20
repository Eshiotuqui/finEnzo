import { useState } from "react"
import { Pencil } from "lucide-react"

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
import type { RatesStore } from "@/hooks/useRates"

/** Permite sobrescrever a cotação automática por uma cotação manual. */
export function EditRatesDialog({
  rates,
  trigger,
}: {
  rates: RatesStore
  trigger?: React.ReactNode
}) {
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
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Ajustar cotações manualmente"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
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

import { useState } from "react"
import { Check, FolderOpen, Pencil, PiggyBank, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BudgetDialog } from "@/components/BudgetDialog"
import { formatMoney } from "@/lib/currency"
import { hasBudget } from "@/lib/stats"
import { cn } from "@/lib/utils"
import type { CurrencyCode } from "@/types"
import type { FinanceStore } from "@/hooks/useFinance"

const EMOJI_OPTIONS = [
  "🙋", "👨‍👩‍👧", "👴", "👵", "🤝", "🏠", "💼", "✈️", "🎓", "🐶",
  "💳", "🧾", "🎁", "🚗", "🏥", "🎉",
]

/** Cria, renomeia e exclui coleções (ex.: "Meus gastos", "Gastos do sogro"). */
export function CollectionManager({
  store,
  trigger,
}: {
  store: FinanceStore
  trigger?: React.ReactNode
}) {
  const { collections, transactions, addCollection, updateCollection, deleteCollection } =
    store
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [icon, setIcon] = useState(EMOJI_OPTIONS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    addCollection({ name: name.trim(), icon })
    setName("")
    setIcon(EMOJI_OPTIONS[0])
  }

  function countFor(collectionId: string) {
    return transactions.filter((t) => t.collectionId === collectionId).length
  }

  function saveRename(id: string) {
    if (editingName.trim()) updateCollection(id, { name: editingName.trim() })
    setEditingId(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <FolderOpen /> <span className="hidden sm:inline">Coleções</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Coleções</DialogTitle>
          <DialogDescription>
            Separe os lançamentos por grupo — “Meus gastos”, “Gastos do sogro” — e
            veja os totais de cada um sem misturar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="col-name">Nova coleção</Label>
            <div className="flex gap-2">
              <Input
                id="col-name"
                placeholder="Ex: Gastos do sogro"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button type="submit">
                <Plus /> Criar
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                aria-pressed={icon === emoji}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md border text-lg transition-colors cursor-pointer",
                  icon === emoji
                    ? "border-primary bg-primary/10"
                    : "border-input hover:bg-accent"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </form>

        <div className="space-y-1.5">
          {collections.map((c) => {
            const count = countFor(c.id)
            const isEditing = editingId === c.id
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border p-2.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-lg">
                  {c.icon}
                </span>

                {isEditing ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(c.id)
                        if (e.key === "Escape") setEditingId(null)
                      }}
                      autoFocus
                      className="h-9 flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => saveRename(c.id)}
                      aria-label="Salvar nome"
                    >
                      <Check />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancelar"
                    >
                      <X />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {count} lançamento{count === 1 ? "" : "s"}
                        {hasBudget(c.budget) &&
                          ` · orçamento ${Object.entries(c.budget ?? {})
                            .map(([code, value]) =>
                              formatMoney(value ?? 0, code as CurrencyCode)
                            )
                            .join(" + ")}`}
                      </p>
                    </div>
                    <BudgetDialog
                      store={store}
                      collection={c}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "text-muted-foreground hover:text-foreground",
                            hasBudget(c.budget) && "text-primary"
                          )}
                          aria-label={`Orçamento de ${c.name}`}
                        >
                          <PiggyBank />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingId(c.id)
                        setEditingName(c.name)
                      }}
                      aria-label={`Renomear ${c.name}`}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={collections.length === 1}
                      title={
                        collections.length === 1
                          ? "Você precisa de pelo menos uma coleção"
                          : undefined
                      }
                      onClick={() => {
                        const aviso = count
                          ? `Excluir "${c.name}"? Os ${count} lançamento${
                              count === 1 ? "" : "s"
                            } dessa coleção também serão removidos.`
                          : `Excluir "${c.name}"?`
                        if (confirm(aviso)) deleteCollection(c.id)
                      }}
                      aria-label={`Excluir ${c.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

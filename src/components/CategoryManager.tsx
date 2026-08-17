import { useState } from "react"
import { Settings2, Trash2, Plus } from "lucide-react"

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
import { chartColor } from "@/lib/colors"
import type { FinanceStore } from "@/hooks/useFinance"

const EMOJI_OPTIONS = [
  "✈️", "🍔", "🏠", "🚗", "🎮", "💰", "🛒", "💊", "📚", "🎁",
  "👕", "☕", "🐶", "💡", "📱", "🏋️", "✂️", "🎬", "🍷", "🧾",
]

export function CategoryManager({ store }: { store: FinanceStore }) {
  const { categories, addCategory, deleteCategory, transactions } = store
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [icon, setIcon] = useState(EMOJI_OPTIONS[0])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    addCategory({
      name: name.trim(),
      icon,
      color: (categories.length % 6) + 1,
    })
    setName("")
    setIcon(EMOJI_OPTIONS[0])
  }

  function countFor(categoryId: string) {
    return transactions.filter((t) => t.categoryId === categoryId).length
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings2 /> Categorias
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Categorias</DialogTitle>
          <DialogDescription>
            Crie e organize suas categorias de gastos e entradas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nova categoria</Label>
            <div className="flex gap-2">
              <Input
                id="cat-name"
                placeholder="Nome da categoria"
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
                className={
                  "flex h-9 w-9 items-center justify-center rounded-md border text-lg transition-colors cursor-pointer " +
                  (icon === emoji
                    ? "border-primary bg-primary/10"
                    : "border-input hover:bg-accent")
                }
              >
                {emoji}
              </button>
            ))}
          </div>
        </form>

        <div className="space-y-1.5">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-lg border p-2.5"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-md text-lg"
                style={{ backgroundColor: chartColor(c.color), opacity: 0.9 }}
              >
                {c.icon}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {countFor(c.id)} lançamento(s)
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (
                    confirm(
                      `Excluir "${c.name}"? Os lançamentos dessa categoria também serão removidos.`
                    )
                  )
                    deleteCategory(c.id)
                }}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { Layers, Plus } from "lucide-react"

import { CollectionManager } from "@/components/CollectionManager"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ALL_COLLECTIONS } from "@/hooks/useCollectionFilter"
import { cn } from "@/lib/utils"
import type { FinanceStore } from "@/hooks/useFinance"

/** Seletor de coleção do desktop, ao lado do botão de gerenciar. */
export function CollectionSwitcher({
  store,
  selected,
  onSelect,
}: {
  store: FinanceStore
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
      <Layers className="h-4 w-4 shrink-0 text-primary" />
      <span className="shrink-0 text-sm font-medium">Coleção</span>
      <Select value={selected} onValueChange={onSelect}>
        <SelectTrigger className="w-[240px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_COLLECTIONS}>Todas as coleções</SelectItem>
          {store.collections.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.icon} {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="ml-auto">
        <CollectionManager store={store} />
      </div>
    </div>
  )
}

/** Versão do celular: chips roláveis na horizontal. */
export function CollectionChips({
  store,
  selected,
  onSelect,
}: {
  store: FinanceStore
  selected: string
  onSelect: (id: string) => void
}) {
  const chip =
    "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <div className="flex w-max items-center gap-2 pb-1">
        <button
          type="button"
          onClick={() => onSelect(ALL_COLLECTIONS)}
          aria-pressed={selected === ALL_COLLECTIONS}
          className={cn(
            chip,
            selected === ALL_COLLECTIONS
              ? "border-primary bg-primary/10 text-primary"
              : "border-input text-muted-foreground"
          )}
        >
          Todas
        </button>

        {store.collections.map((c) => {
          const active = selected === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              aria-pressed={active}
              className={cn(
                chip,
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground"
              )}
            >
              <span aria-hidden>{c.icon}</span>
              {c.name}
            </button>
          )
        })}

        <CollectionManager
          store={store}
          trigger={
            <button
              type="button"
              className={cn(chip, "border-dashed border-input text-muted-foreground")}
              aria-label="Gerenciar coleções"
            >
              <Plus className="h-4 w-4" />
              Coleção
            </button>
          }
        />
      </div>
    </div>
  )
}

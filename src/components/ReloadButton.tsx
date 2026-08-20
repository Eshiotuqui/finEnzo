import { useState } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { FinanceStore } from "@/hooks/useFinance"
import type { RatesStore } from "@/hooks/useRates"

/**
 * Refaz as requisições do app de uma vez: cotações do dia e, se houver conta,
 * os lançamentos sincronizados.
 */
export function ReloadButton({
  store,
  rates,
  className,
}: {
  store: FinanceStore
  rates: RatesStore
  className?: string
}) {
  const [reloading, setReloading] = useState(false)
  const busy =
    reloading || rates.source === "loading" || store.syncStatus === "syncing"

  async function reload() {
    setReloading(true)
    await Promise.allSettled([rates.refresh(), store.refresh()])
    setReloading(false)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => void reload()}
      disabled={busy}
      title="Recarregar cotações e lançamentos"
      aria-label="Recarregar cotações e lançamentos"
    >
      <RefreshCw className={cn(busy && "animate-spin")} />
    </Button>
  )
}

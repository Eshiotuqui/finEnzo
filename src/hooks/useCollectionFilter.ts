import { useCallback, useEffect, useState } from "react"
import type { Collection } from "@/types"

const STORAGE_KEY = "finenzo:collection-filter"

/** Valor especial: mostra os lançamentos de todas as coleções juntos. */
export const ALL_COLLECTIONS = "all"

/**
 * Coleção em foco na tela. Fica no localStorage para o app abrir no mesmo
 * contexto da última vez.
 */
export function useCollectionFilter(collections: Collection[]) {
  const [stored, setStored] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ALL_COLLECTIONS
  )

  const select = useCallback((id: string) => {
    setStored(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* ignora */
    }
  }, [])

  // Se a coleção selecionada foi excluída (aqui ou em outro aparelho), volta
  // para "todas" em vez de deixar a tela vazia sem explicação.
  const exists = collections.some((c) => c.id === stored)
  const selected = stored === ALL_COLLECTIONS || exists ? stored : ALL_COLLECTIONS

  useEffect(() => {
    if (selected !== stored) select(ALL_COLLECTIONS)
  }, [selected, stored, select])

  return { selected, select }
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { supabase } from "@/lib/supabase"
import type { Category, CurrencyCode, Transaction, TransactionType } from "@/types"

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-viagem", name: "Viagem", icon: "✈️", color: 1 },
  { id: "cat-alimentacao", name: "Alimentação", icon: "🍔", color: 2 },
  { id: "cat-moradia", name: "Moradia", icon: "🏠", color: 3 },
  { id: "cat-transporte", name: "Transporte", icon: "🚗", color: 4 },
  { id: "cat-lazer", name: "Lazer", icon: "🎮", color: 5 },
  { id: "cat-salario", name: "Salário", icon: "💰", color: 6 },
]

/** Estado da sincronização com a nuvem (só relevante com conta ativa). */
export type SyncStatus = "off" | "syncing" | "synced" | "error"

/** Sem conta, os dados ficam no escopo "local" do navegador. */
const LOCAL_SCOPE = "local"

function categoriesKey(scope: string) {
  return scope === LOCAL_SCOPE
    ? "finenzo:categories"
    : `finenzo:categories:${scope}`
}
function transactionsKey(scope: string) {
  return scope === LOCAL_SCOPE
    ? "finenzo:transactions"
    : `finenzo:transactions:${scope}`
}
function migratedKey(userId: string) {
  return `finenzo:migrated:${userId}`
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(
    performance.now() * 1000
  ).toString(36)}`
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

interface ScopedData {
  scope: string
  categories: Category[]
  transactions: Transaction[]
}

function loadScope(scope: string): ScopedData {
  return {
    scope,
    categories: load(categoriesKey(scope), DEFAULT_CATEGORIES),
    transactions: load(transactionsKey(scope), [] as Transaction[]),
  }
}

/* ---------- conversão entre linhas do Supabase e o modelo do app ---------- */

interface CategoryRow {
  id: string
  user_id: string
  name: string
  icon: string
  color: number
}

interface TransactionRow {
  id: string
  user_id: string
  description: string
  amount: number | string
  currency: string
  type: string
  category_id: string
  date: string
  created_at: number | string
}

function toCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, icon: row.icon, color: Number(row.color) }
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    currency: row.currency as CurrencyCode,
    type: row.type as TransactionType,
    categoryId: row.category_id,
    date: row.date,
    createdAt: Number(row.created_at),
  }
}

function categoryRow(c: Category, userId: string) {
  return { id: c.id, user_id: userId, name: c.name, icon: c.icon, color: c.color }
}

function transactionRow(t: Transaction, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    description: t.description,
    amount: t.amount,
    currency: t.currency,
    type: t.type,
    category_id: t.categoryId,
    date: t.date,
    created_at: t.createdAt,
  }
}

function byDateDesc(a: Transaction, b: Transaction) {
  return b.date.localeCompare(a.date) || b.createdAt - a.createdAt
}

/**
 * Estado central do app.
 *
 * Sempre local-first: tudo é gravado no localStorage e a UI nunca espera a rede.
 * Com `userId` (usuário logado), o mesmo estado é espelhado no Supabase e
 * recebe atualizações em tempo real — é o que mantém PC e celular iguais.
 */
export function useFinance(userId: string | null) {
  const scope = userId ?? LOCAL_SCOPE
  const [data, setData] = useState<ScopedData>(() => loadScope(scope))
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    userId ? "syncing" : "off"
  )
  const userIdRef = useRef(userId)
  userIdRef.current = userId
  const dataRef = useRef(data)
  dataRef.current = data

  const hydrated = data.scope === scope
  const { categories, transactions } = data

  // Troca de escopo (login/logout): recarrega o cache daquele escopo.
  useEffect(() => {
    if (data.scope !== scope) setData(loadScope(scope))
  }, [scope, data.scope])

  // Cache local — também é o que permite abrir o app offline.
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(categoriesKey(scope), JSON.stringify(categories))
      localStorage.setItem(transactionsKey(scope), JSON.stringify(transactions))
    } catch {
      /* quota cheia: seguimos só com o estado em memória */
    }
  }, [hydrated, scope, categories, transactions])

  /* ----------------------------- nuvem ----------------------------- */

  const pull = useCallback(async (uid: string) => {
    if (!supabase) return
    setSyncStatus("syncing")
    try {
      const [cats, txs] = await Promise.all([
        supabase.from("categories").select("*").eq("user_id", uid),
        supabase.from("transactions").select("*").eq("user_id", uid),
      ])
      if (cats.error) throw cats.error
      if (txs.error) throw txs.error

      let remoteCategories = (cats.data as CategoryRow[]).map(toCategory)
      let remoteTransactions = (txs.data as TransactionRow[]).map(toTransaction)

      // Primeiro login neste dispositivo: sobe o que foi cadastrado offline.
      const alreadyMigrated = localStorage.getItem(migratedKey(uid)) === "1"
      if (!alreadyMigrated) {
        const local = loadScope(LOCAL_SCOPE)
        const remoteCatIds = new Set(remoteCategories.map((c) => c.id))
        const remoteTxIds = new Set(remoteTransactions.map((t) => t.id))
        const newCats = remoteCategories.length
          ? local.categories.filter((c) => !remoteCatIds.has(c.id))
          : local.categories
        const newTxs = local.transactions.filter((t) => !remoteTxIds.has(t.id))

        if (newCats.length) {
          const { error } = await supabase
            .from("categories")
            .upsert(newCats.map((c) => categoryRow(c, uid)))
          if (error) throw error
          remoteCategories = [...remoteCategories, ...newCats]
        }
        if (newTxs.length) {
          const { error } = await supabase
            .from("transactions")
            .upsert(newTxs.map((t) => transactionRow(t, uid)))
          if (error) throw error
          remoteTransactions = [...remoteTransactions, ...newTxs]
        }
        localStorage.setItem(migratedKey(uid), "1")
      }

      // Conta nova e vazia: começa com as categorias padrão.
      if (remoteCategories.length === 0) {
        const { error } = await supabase
          .from("categories")
          .upsert(DEFAULT_CATEGORIES.map((c) => categoryRow(c, uid)))
        if (error) throw error
        remoteCategories = DEFAULT_CATEGORIES
      }

      setData({
        scope: uid,
        categories: remoteCategories,
        transactions: remoteTransactions.sort(byDateDesc),
      })
      setSyncStatus("synced")
    } catch {
      // Offline ou erro de rede: continua funcionando com o cache local.
      setSyncStatus("error")
    }
  }, [])

  useEffect(() => {
    if (!userId || !supabase) {
      setSyncStatus("off")
      return
    }
    void pull(userId)

    const channel = supabase
      .channel(`finenzo:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setData((prev) => {
            if (prev.scope !== userId) return prev
            if (payload.eventType === "DELETE") {
              const id = (payload.old as { id?: string }).id
              return {
                ...prev,
                categories: prev.categories.filter((c) => c.id !== id),
              }
            }
            const cat = toCategory(payload.new as CategoryRow)
            const exists = prev.categories.some((c) => c.id === cat.id)
            return {
              ...prev,
              categories: exists
                ? prev.categories.map((c) => (c.id === cat.id ? cat : c))
                : [...prev.categories, cat],
            }
          })
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setData((prev) => {
            if (prev.scope !== userId) return prev
            if (payload.eventType === "DELETE") {
              const id = (payload.old as { id?: string }).id
              return {
                ...prev,
                transactions: prev.transactions.filter((t) => t.id !== id),
              }
            }
            const tx = toTransaction(payload.new as TransactionRow)
            const exists = prev.transactions.some((t) => t.id === tx.id)
            return {
              ...prev,
              transactions: (exists
                ? prev.transactions.map((t) => (t.id === tx.id ? tx : t))
                : [tx, ...prev.transactions]
              ).sort(byDateDesc),
            }
          })
        }
      )
      .subscribe()

    // Volta do background / reconecta: garante que nada ficou para trás.
    const onFocus = () => {
      if (document.visibilityState === "visible") void pull(userId)
    }
    document.addEventListener("visibilitychange", onFocus)
    window.addEventListener("online", onFocus)

    return () => {
      document.removeEventListener("visibilitychange", onFocus)
      window.removeEventListener("online", onFocus)
      void supabase?.removeChannel(channel)
    }
  }, [userId, pull])

  /** Executa a escrita remota quando há conta; local-only apenas ignora. */
  const push = useCallback(
    async (
      run: (
        client: NonNullable<typeof supabase>,
        uid: string
      ) => PromiseLike<{ error: unknown }>
    ) => {
      const uid = userIdRef.current
      if (!uid || !supabase) return
      try {
        const { error } = await run(supabase, uid)
        setSyncStatus(error ? "error" : "synced")
      } catch {
        setSyncStatus("error")
      }
    },
    []
  )

  const refresh = useCallback(async () => {
    const uid = userIdRef.current
    if (uid) await pull(uid)
  }, [pull])

  /* ---------------------------- mutações ---------------------------- */

  const addCategory = useCallback(
    (input: Omit<Category, "id">) => {
      const category: Category = { ...input, id: makeId("cat") }
      setData((prev) => ({ ...prev, categories: [...prev.categories, category] }))
      void push((client, uid) =>
        client.from("categories").upsert(categoryRow(category, uid))
      )
      return category
    },
    [push]
  )

  const updateCategory = useCallback(
    (id: string, patch: Partial<Category>) => {
      const current = dataRef.current.categories.find((c) => c.id === id)
      if (!current) return
      const updated: Category = { ...current, ...patch }
      setData((prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c.id === id ? updated : c)),
      }))
      void push((client, uid) =>
        client.from("categories").upsert(categoryRow(updated, uid))
      )
    },
    [push]
  )

  const deleteCategory = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
        transactions: prev.transactions.filter((t) => t.categoryId !== id),
      }))
      void push(async (client, uid) => {
        const txs = await client
          .from("transactions")
          .delete()
          .eq("user_id", uid)
          .eq("category_id", id)
        if (txs.error) return txs
        return client.from("categories").delete().eq("user_id", uid).eq("id", id)
      })
    },
    [push]
  )

  const addTransaction = useCallback(
    (input: Omit<Transaction, "id" | "createdAt">) => {
      const tx: Transaction = { ...input, id: makeId("tx"), createdAt: Date.now() }
      setData((prev) => ({
        ...prev,
        transactions: [tx, ...prev.transactions].sort(byDateDesc),
      }))
      void push((client, uid) =>
        client.from("transactions").upsert(transactionRow(tx, uid))
      )
      return tx
    },
    [push]
  )

  const deleteTransaction = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
      }))
      void push((client, uid) =>
        client.from("transactions").delete().eq("user_id", uid).eq("id", id)
      )
    },
    [push]
  )

  const categoriesById = useMemo(() => {
    const map = new Map<string, Category>()
    categories.forEach((c) => map.set(c.id, c))
    return map
  }, [categories])

  return {
    categories,
    transactions,
    categoriesById,
    syncStatus,
    refresh,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    deleteTransaction,
  }
}

export type FinanceStore = ReturnType<typeof useFinance>

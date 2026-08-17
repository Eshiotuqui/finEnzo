import { useCallback, useEffect, useMemo, useState } from "react"
import type { Category, Transaction } from "@/types"

const CATEGORIES_KEY = "finenzo:categories"
const TRANSACTIONS_KEY = "finenzo:transactions"

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-viagem", name: "Viagem", icon: "✈️", color: 1 },
  { id: "cat-alimentacao", name: "Alimentação", icon: "🍔", color: 2 },
  { id: "cat-moradia", name: "Moradia", icon: "🏠", color: 3 },
  { id: "cat-transporte", name: "Transporte", icon: "🚗", color: 4 },
  { id: "cat-lazer", name: "Lazer", icon: "🎮", color: 5 },
  { id: "cat-salario", name: "Salário", icon: "💰", color: 6 },
]

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

export function useFinance() {
  const [categories, setCategories] = useState<Category[]>(() =>
    load(CATEGORIES_KEY, DEFAULT_CATEGORIES)
  )
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    load(TRANSACTIONS_KEY, [])
  )

  useEffect(() => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
  }, [transactions])

  const addCategory = useCallback(
    (data: Omit<Category, "id">) => {
      const category: Category = { ...data, id: makeId("cat") }
      setCategories((prev) => [...prev, category])
      return category
    },
    []
  )

  const updateCategory = useCallback((id: string, data: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    )
  }, [])

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
    setTransactions((prev) => prev.filter((t) => t.categoryId !== id))
  }, [])

  const addTransaction = useCallback(
    (data: Omit<Transaction, "id" | "createdAt">) => {
      const tx: Transaction = {
        ...data,
        id: makeId("tx"),
        createdAt: Date.now(),
      }
      setTransactions((prev) => [tx, ...prev])
      return tx
    },
    []
  )

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const categoriesById = useMemo(() => {
    const map = new Map<string, Category>()
    categories.forEach((c) => map.set(c.id, c))
    return map
  }, [categories])

  return {
    categories,
    transactions,
    categoriesById,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    deleteTransaction,
  }
}

export type FinanceStore = ReturnType<typeof useFinance>

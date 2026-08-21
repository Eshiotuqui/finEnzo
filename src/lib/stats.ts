import type { CurrencyAmounts, CurrencyCode, Transaction } from "@/types"

export interface CurrencyTotals {
  currency: CurrencyCode
  income: number
  expense: number
  balance: number
}

/** Agrupa entradas/gastos por moeda (totais independentes por moeda). */
export function totalsByCurrency(transactions: Transaction[]): CurrencyTotals[] {
  const map = new Map<CurrencyCode, CurrencyTotals>()
  for (const t of transactions) {
    const cur =
      map.get(t.currency) ??
      { currency: t.currency, income: 0, expense: 0, balance: 0 }
    if (t.type === "income") cur.income += t.amount
    else cur.expense += t.amount
    cur.balance = cur.income - cur.expense
    map.set(t.currency, cur)
  }
  return [...map.values()].sort((a, b) => b.expense - a.expense)
}

export interface CategorySlice {
  categoryId: string
  total: number
}

/** Soma de gastos por categoria, para uma moeda específica. */
export function expensesByCategory(
  transactions: Transaction[],
  currency: CurrencyCode
): CategorySlice[] {
  const map = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== "expense" || t.currency !== currency) continue
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
  }
  return [...map.entries()]
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total)
}

export interface MonthPoint {
  month: string
  label: string
  income: number
  expense: number
}

/** Série mensal de entradas x gastos para uma moeda. */
export function monthlySeries(
  transactions: Transaction[],
  currency: CurrencyCode
): MonthPoint[] {
  const map = new Map<string, MonthPoint>()
  for (const t of transactions) {
    if (t.currency !== currency) continue
    const month = t.date.slice(0, 7)
    const point =
      map.get(month) ?? { month, label: monthLabel(month), income: 0, expense: 0 }
    if (t.type === "income") point.income += t.amount
    else point.expense += t.amount
    map.set(month, point)
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month))
}

function monthLabel(month: string): string {
  const [year, m] = month.split("-")
  const names = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ]
  return `${names[Number(m) - 1]}/${year.slice(2)}`
}

export interface BudgetLine {
  currency: CurrencyCode
  budget: number
  spent: number
  remaining: number
  /** Fração do orçamento já gasta (pode passar de 1). */
  ratio: number
}

/**
 * Compara o que foi separado com o que já foi gasto, moeda por moeda.
 *
 * Inclui também moedas em que houve gasto sem orçamento definido — esconder
 * esse caso daria a impressão falsa de que ainda sobra dinheiro.
 */
export function budgetProgress(
  transactions: Transaction[],
  budget: CurrencyAmounts
): BudgetLine[] {
  const spentByCurrency = new Map<CurrencyCode, number>()
  for (const t of transactions) {
    if (t.type !== "expense") continue
    spentByCurrency.set(t.currency, (spentByCurrency.get(t.currency) ?? 0) + t.amount)
  }

  const currencies = new Set<CurrencyCode>([
    ...(Object.keys(budget) as CurrencyCode[]).filter((c) => (budget[c] ?? 0) > 0),
    ...spentByCurrency.keys(),
  ])

  return [...currencies]
    .map((currency) => {
      const total = budget[currency] ?? 0
      const spent = spentByCurrency.get(currency) ?? 0
      return {
        currency,
        budget: total,
        spent,
        remaining: total - spent,
        ratio: total > 0 ? spent / total : spent > 0 ? 1 : 0,
      }
    })
    .sort((a, b) => b.budget - a.budget)
}

/** Um orçamento só "existe" se alguma moeda tiver valor positivo. */
export function hasBudget(budget?: CurrencyAmounts): boolean {
  if (!budget) return false
  return Object.values(budget).some((v) => (v ?? 0) > 0)
}

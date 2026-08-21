export type CurrencyCode = "BRL" | "USD" | "EUR"

export type TransactionType = "expense" | "income"

/**
 * Agrupador de mais alto nível: separa lançamentos por "de quem é o gasto"
 * (ex.: "Meus gastos", "Gastos do sogro"), sem misturar os totais.
 */
export interface Collection {
  id: string
  name: string
  /** Emoji usado como ícone da coleção */
  icon: string
}

export interface Category {
  id: string
  name: string
  /** Emoji usado como ícone da categoria */
  icon: string
  /** Índice de cor do gráfico (1-6), referencia --chart-N */
  color: number
}

export interface Transaction {
  id: string
  description: string
  /** Valor sempre positivo; o sinal é dado pelo `type` */
  amount: number
  currency: CurrencyCode
  type: TransactionType
  categoryId: string
  collectionId: string
  /** Data no formato ISO (YYYY-MM-DD) */
  date: string
  createdAt: number
}

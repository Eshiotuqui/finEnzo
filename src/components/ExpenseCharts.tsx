import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CURRENCIES, formatMoney } from "@/lib/currency"
import { chartColor } from "@/lib/colors"
import { expensesByCategory, monthlySeries, totalsByCurrency } from "@/lib/stats"
import type { CurrencyCode } from "@/types"
import type { FinanceStore } from "@/hooks/useFinance"

export function ExpenseCharts({ store }: { store: FinanceStore }) {
  const { transactions, categoriesById } = store

  const availableCurrencies = useMemo(
    () => totalsByCurrency(transactions).map((t) => t.currency),
    [transactions]
  )
  const [currency, setCurrency] = useState<CurrencyCode>("BRL")
  const active =
    availableCurrencies.includes(currency) ? currency : availableCurrencies[0]

  const pieData = useMemo(() => {
    if (!active) return []
    return expensesByCategory(transactions, active).map((slice) => {
      const cat = categoriesById.get(slice.categoryId)
      return {
        name: cat ? `${cat.icon} ${cat.name}` : "Sem categoria",
        value: slice.total,
        color: chartColor(cat?.color ?? 1),
      }
    })
  }, [transactions, active, categoriesById])

  const barData = useMemo(
    () => (active ? monthlySeries(transactions, active) : []),
    [transactions, active]
  )

  if (!active) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Cadastre lançamentos para ver os gráficos.
        </CardContent>
      </Card>
    )
  }

  const fmt = (v: number) => formatMoney(v, active)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gráficos</h2>
        <Select
          value={active}
          onValueChange={(v) => setCurrency(v as CurrencyCode)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableCurrencies.map((c) => (
              <SelectItem key={c} value={c}>
                {CURRENCIES[c].flag} {CURRENCIES[c].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Nenhum gasto nesta moeda.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="var(--card)" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => fmt(Number(v))}
                    contentStyle={tooltipStyle}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entradas x Gastos por mês</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Sem dados nesta moeda.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} barGap={4}>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={48}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat(CURRENCIES[active].locale, {
                        notation: "compact",
                      }).format(v)
                    }
                  />
                  <Tooltip
                    formatter={(v) => fmt(Number(v))}
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                    contentStyle={tooltipStyle}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="income"
                    name="Entradas"
                    fill="var(--color-chart-2)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="Gastos"
                    fill="var(--color-chart-4)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const tooltipStyle: React.CSSProperties = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
}

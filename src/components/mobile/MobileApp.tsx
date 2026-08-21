import { useState } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  ChartPie,
  Moon,
  Plus,
  ReceiptText,
  Sun,
  User,
  Wallet,
} from "lucide-react"

import { AccountDialog, SyncBadge } from "@/components/AccountDialog"
import { WhaleMark } from "@/components/WhaleMark"
import { CategoryManager } from "@/components/CategoryManager"
import { CollectionChips } from "@/components/CollectionSwitcher"
import { ReloadButton } from "@/components/ReloadButton"
import { ExpenseCharts } from "@/components/ExpenseCharts"
import { TransactionForm } from "@/components/TransactionForm"
import { TransactionList } from "@/components/TransactionList"
import { MobileRates } from "@/components/mobile/MobileRates"
import { Button } from "@/components/ui/button"
import { chartColor } from "@/lib/colors"
import { formatMoney } from "@/lib/currency"
import { totalsByCurrency } from "@/lib/stats"
import { cn } from "@/lib/utils"
import type { AuthStore } from "@/hooks/useAuth"
import type { FinanceStore } from "@/hooks/useFinance"
import type { RatesStore } from "@/hooks/useRates"

type View = "home" | "charts" | "list"

export function MobileApp({
  store,
  scoped,
  rates,
  auth,
  theme,
  onToggleTheme,
  selectedCollection,
  onSelectCollection,
  defaultCollectionId,
}: {
  /** Store completo — usado pelos formulários e pelos chips de coleção. */
  store: FinanceStore
  /** Store já filtrado pela coleção em foco — usado pelas telas de leitura. */
  scoped: FinanceStore
  rates: RatesStore
  auth: AuthStore
  theme: "light" | "dark"
  onToggleTheme: () => void
  selectedCollection: string
  onSelectCollection: (id: string) => void
  defaultCollectionId?: string
}) {
  const [view, setView] = useState<View>("home")
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="min-h-[100dvh]">
      {/* Sem header fixo: o conteúdo começa direto, com folga para a ilha. */}
      <main className="px-5 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        {view === "home" && (
          <HomeView
            store={store}
            scoped={scoped}
            rates={rates}
            auth={auth}
            theme={theme}
            onToggleTheme={onToggleTheme}
            selectedCollection={selectedCollection}
            onSelectCollection={onSelectCollection}
            onSeeAll={() => setView("list")}
          />
        )}

        {view === "charts" && (
          <section className="space-y-4">
            <ViewTitle title="Gráficos" subtitle="Para onde seu dinheiro está indo" />
            <CollectionChips
              store={store}
              selected={selectedCollection}
              onSelect={onSelectCollection}
            />
            <ExpenseCharts store={scoped} />
          </section>
        )}

        {view === "list" && (
          <section className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <ViewTitle
                title="Lançamentos"
                subtitle={`${scoped.transactions.length} registro${
                  scoped.transactions.length === 1 ? "" : "s"
                }`}
              />
              <CategoryManager store={store} />
            </div>
            <CollectionChips
              store={store}
              selected={selectedCollection}
              onSelect={onSelectCollection}
            />
            <TransactionList store={scoped} rates={rates} />
          </section>
        )}
      </main>

      {/* O formulário é controlado pela ilha (botão “+”). */}
      <TransactionForm
        store={store}
        rates={rates}
        open={formOpen}
        onOpenChange={setFormOpen}
        trigger={null}
        defaultCollectionId={defaultCollectionId}
      />

      <Island
        view={view}
        onChange={setView}
        onAdd={() => setFormOpen(true)}
        auth={auth}
        store={store}
      />
    </div>
  )
}

function ViewTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold leading-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function HomeView({
  store,
  scoped,
  rates,
  auth,
  theme,
  onToggleTheme,
  selectedCollection,
  onSelectCollection,
  onSeeAll,
}: {
  store: FinanceStore
  scoped: FinanceStore
  rates: RatesStore
  auth: AuthStore
  theme: "light" | "dark"
  onToggleTheme: () => void
  selectedCollection: string
  onSelectCollection: (id: string) => void
  onSeeAll: () => void
}) {
  const totals = totalsByCurrency(scoped.transactions)
  const consolidated = totals.reduce(
    (acc, t) => {
      acc.income += rates.convertToBRL(t.income, t.currency)
      acc.expense += rates.convertToBRL(t.expense, t.currency)
      return acc
    },
    { income: 0, expense: 0 }
  )
  const balance = consolidated.income - consolidated.expense
  const recent = scoped.transactions.slice(0, 5)

  return (
    <div className="space-y-7">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <WhaleMark className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-none tracking-tight">Whalio</p>
            <SyncBadge auth={auth} status={store.syncStatus} className="mt-1" />
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <ReloadButton store={store} rates={rates} />
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Tema claro" : "Tema escuro"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <CollectionChips
        store={store}
        selected={selectedCollection}
        onSelect={onSelectCollection}
      />

      <section>
        <p className="text-sm text-muted-foreground">Saldo total</p>
        <p
          className={cn(
            "mt-1 text-4xl font-bold leading-none tabular-nums",
            balance < 0 && "text-destructive"
          )}
        >
          {formatMoney(balance, "BRL")}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Todas as moedas convertidas pela cotação atual
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <TotalPill
            label="Entradas"
            value={formatMoney(consolidated.income, "BRL")}
            tone="income"
          />
          <TotalPill
            label="Gastos"
            value={formatMoney(consolidated.expense, "BRL")}
            tone="expense"
          />
        </div>
      </section>

      <MobileRates rates={rates} />

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Últimos lançamentos</h2>
          {scoped.transactions.length > recent.length && (
            <button
              type="button"
              onClick={onSeeAll}
              className="rounded-md px-1 py-0.5 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ver todos
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed p-8 text-center">
            <WhaleMark className="mx-auto h-9 w-9 text-muted-foreground" />
            <p className="mt-3 font-medium">Mar calmo por aqui</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Toque no <span className="font-semibold text-primary">+</span> da ilha
              para lançar seu primeiro gasto.
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((t) => {
              const cat = scoped.categoriesById.get(t.categoryId)
              const isExpense = t.type === "expense"
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                    style={{ backgroundColor: chartColor(cat?.color ?? 1), opacity: 0.9 }}
                  >
                    {cat?.icon ?? "❓"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {cat?.name ?? "Sem categoria"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      isExpense
                        ? "text-destructive"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {isExpense ? "-" : "+"}
                    {formatMoney(t.amount, t.currency)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function TotalPill({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "income" | "expense"
}) {
  const income = tone === "income"
  const Icon = income ? ArrowUpRight : ArrowDownRight
  return (
    <div className="rounded-xl border bg-card p-4">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon
          className={cn(
            "h-4 w-4",
            income ? "text-emerald-500" : "text-destructive"
          )}
        />
        {label}
      </span>
      <p className="mt-1.5 truncate text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function Island({
  view,
  onChange,
  onAdd,
  auth,
  store,
}: {
  view: View
  onChange: (view: View) => void
  onAdd: () => void
  auth: AuthStore
  store: FinanceStore
}) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-5 pb-[calc(env(safe-area-inset-bottom)+0.875rem)]"
    >
      <div className="flex items-center gap-1 rounded-full border bg-card/85 p-1.5 shadow-lg backdrop-blur-md">
        <IslandTab
          icon={Wallet}
          label="Início"
          active={view === "home"}
          onClick={() => onChange("home")}
        />
        <IslandTab
          icon={ChartPie}
          label="Gráficos"
          active={view === "charts"}
          onClick={() => onChange("charts")}
        />

        <button
          type="button"
          onClick={onAdd}
          aria-label="Novo lançamento"
          className="mx-1 flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>

        <IslandTab
          icon={ReceiptText}
          label="Lista"
          active={view === "list"}
          onClick={() => onChange("list")}
        />

        <AccountDialog
          auth={auth}
          store={store}
          trigger={
            <button
              type="button"
              className="flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-full text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">Conta</span>
            </button>
          }
        />
      </div>
    </nav>
  )
}

function IslandTab({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Wallet
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground active:bg-accent"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  )
}

import { useMemo } from "react"
import { Moon, Sun } from "lucide-react"

import { AccountDialog, SyncBadge } from "@/components/AccountDialog"
import { WhaleMark } from "@/components/WhaleMark"
import { ReloadButton } from "@/components/ReloadButton"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SummaryCards } from "@/components/SummaryCards"
import { ExpenseCharts } from "@/components/ExpenseCharts"
import { TransactionList } from "@/components/TransactionList"
import { TransactionForm } from "@/components/TransactionForm"
import { CategoryManager } from "@/components/CategoryManager"
import { RatesBar } from "@/components/RatesBar"
import { CollectionSwitcher } from "@/components/CollectionSwitcher"
import { MobileApp } from "@/components/mobile/MobileApp"
import { useAuth } from "@/hooks/useAuth"
import { ALL_COLLECTIONS, useCollectionFilter } from "@/hooks/useCollectionFilter"
import { useFinance } from "@/hooks/useFinance"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useRates } from "@/hooks/useRates"
import { useTheme } from "@/hooks/useTheme"

function App() {
  const auth = useAuth()
  const store = useFinance(auth.userId)
  const rates = useRates()
  const { theme, toggle } = useTheme()
  const isMobile = useIsMobile()

  const { selected, select } = useCollectionFilter(store.collections)

  // As telas de leitura (saldo, gráficos, lista) veem só a coleção em foco;
  // os formulários continuam usando o store completo.
  const scoped = useMemo(() => {
    if (selected === ALL_COLLECTIONS) return store
    return {
      ...store,
      transactions: store.transactions.filter((t) => t.collectionId === selected),
    }
  }, [store, selected])

  const defaultCollectionId =
    selected === ALL_COLLECTIONS ? undefined : selected

  if (isMobile) {
    return (
      <MobileApp
        store={store}
        scoped={scoped}
        rates={rates}
        auth={auth}
        theme={theme}
        onToggleTheme={toggle}
        selectedCollection={selected}
        onSelectCollection={select}
        defaultCollectionId={defaultCollectionId}
      />
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <WhaleMark className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-none tracking-tight">Whalio</h1>
              <SyncBadge auth={auth} status={store.syncStatus} className="mt-1" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <CategoryManager store={store} />
            <TransactionForm
              store={store}
              rates={rates}
              defaultCollectionId={defaultCollectionId}
            />
            <ReloadButton store={store} rates={rates} />
            <AccountDialog auth={auth} store={store} />
            <Button variant="ghost" size="icon" onClick={toggle}>
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <RatesBar rates={rates} />

        <CollectionSwitcher store={store} selected={selected} onSelect={select} />

        <SummaryCards transactions={scoped.transactions} rates={rates} />

        <Tabs defaultValue="charts">
          <TabsList>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="transactions">Lançamentos</TabsTrigger>
          </TabsList>
          <TabsContent value="charts">
            <ExpenseCharts store={scoped} />
          </TabsContent>
          <TabsContent value="transactions">
            <TransactionList store={scoped} rates={rates} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 text-center text-xs text-muted-foreground">
        {auth.userId
          ? "🐋 Whalio · seus lançamentos nadam entre os seus aparelhos"
          : "🐋 Whalio · dados salvos localmente no seu navegador"}
      </footer>
    </div>
  )
}

export default App

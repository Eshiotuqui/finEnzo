import { Moon, Sun, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SummaryCards } from "@/components/SummaryCards"
import { ExpenseCharts } from "@/components/ExpenseCharts"
import { TransactionList } from "@/components/TransactionList"
import { TransactionForm } from "@/components/TransactionForm"
import { CategoryManager } from "@/components/CategoryManager"
import { useFinance } from "@/hooks/useFinance"
import { useTheme } from "@/hooks/useTheme"

function App() {
  const store = useFinance()
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold leading-none">finEnzo</h1>
              <p className="text-xs text-muted-foreground">
                Seu gerenciador financeiro
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CategoryManager store={store} />
            <TransactionForm store={store} />
            <Button variant="ghost" size="icon" onClick={toggle}>
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <SummaryCards transactions={store.transactions} />

        <Tabs defaultValue="charts">
          <TabsList>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="transactions">Lançamentos</TabsTrigger>
          </TabsList>
          <TabsContent value="charts">
            <ExpenseCharts store={store} />
          </TabsContent>
          <TabsContent value="transactions">
            <TransactionList store={store} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 text-center text-xs text-muted-foreground">
        Dados salvos localmente no seu navegador · finEnzo
      </footer>
    </div>
  )
}

export default App

import { useState } from "react"
import { Check, CloudOff, LogOut, RefreshCw, TriangleAlert, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { AuthStore } from "@/hooks/useAuth"
import type { FinanceStore, SyncStatus } from "@/hooks/useFinance"

export function SyncBadge({
  auth,
  status,
  className,
}: {
  auth: AuthStore
  status: SyncStatus
  className?: string
}) {
  if (!auth.enabled) return null

  const { icon, label, tone } = !auth.userId
    ? { icon: CloudOff, label: "Só neste aparelho", tone: "text-muted-foreground" }
    : status === "error"
    ? { icon: TriangleAlert, label: "Sem conexão", tone: "text-destructive" }
    : status === "syncing"
    ? { icon: RefreshCw, label: "Sincronizando…", tone: "text-muted-foreground" }
    : { icon: Check, label: "Sincronizado", tone: "text-emerald-600 dark:text-emerald-400" }
  const Icon = icon

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", tone, className)}>
      <Icon className={cn("h-3.5 w-3.5", status === "syncing" && "animate-spin")} />
      {label}
    </span>
  )
}

export function AccountDialog({
  auth,
  store,
  trigger,
}: {
  auth: AuthStore
  store: FinanceStore
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="icon" title="Sua conta">
            <User />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        {auth.userId ? (
          <SignedInPanel auth={auth} store={store} onDone={() => setOpen(false)} />
        ) : auth.enabled ? (
          <AuthForms auth={auth} />
        ) : (
          <NotConfigured />
        )}
      </DialogContent>
    </Dialog>
  )
}

function SignedInPanel({
  auth,
  store,
  onDone,
}: {
  auth: AuthStore
  store: FinanceStore
  onDone: () => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Sua conta</DialogTitle>
        <DialogDescription>
          Seus lançamentos ficam iguais no computador e no celular.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{auth.email}</p>
            <SyncBadge auth={auth} status={store.syncStatus} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => void store.refresh()}
            disabled={store.syncStatus === "syncing"}
          >
            <RefreshCw
              className={cn(store.syncStatus === "syncing" && "animate-spin")}
            />
            Atualizar
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              void auth.signOut()
              onDone()
            }}
          >
            <LogOut /> Sair
          </Button>
        </div>
      </div>
    </>
  )
}

function AuthForms({ auth }: { auth: AuthStore }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Entrar na sua conta</DialogTitle>
        <DialogDescription>
          Com uma conta, os mesmos lançamentos aparecem no PC e no celular.
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="signin">
        <TabsList className="w-full">
          <TabsTrigger value="signin" className="flex-1">
            Entrar
          </TabsTrigger>
          <TabsTrigger value="signup" className="flex-1">
            Criar conta
          </TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <CredentialsForm auth={auth} mode="signin" />
        </TabsContent>
        <TabsContent value="signup">
          <CredentialsForm auth={auth} mode="signup" />
        </TabsContent>
      </Tabs>
    </>
  )
}

function CredentialsForm({
  auth,
  mode,
}: {
  auth: AuthStore
  mode: "signin" | "signup"
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setInfo("")

    if (!email.trim()) return setError("Informe seu e-mail.")
    if (password.length < 6)
      return setError("A senha precisa ter pelo menos 6 caracteres.")

    setLoading(true)
    const result =
      mode === "signin"
        ? await auth.signIn(email.trim(), password)
        : await auth.signUp(email.trim(), password)
    setLoading(false)

    if (result.error) return setError(result.error)
    if (mode === "signup" && "needsConfirmation" in result && result.needsConfirmation) {
      setInfo("Conta criada! Confirme o e-mail que enviamos e depois faça login.")
    }
    // Com sessão ativa, o diálogo passa sozinho para o painel da conta.
  }

  const idPrefix = `auth-${mode}`

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-email`}>E-mail</Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-password`}>Senha</Label>
        <Input
          id={`${idPrefix}-password`}
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      {info && (
        <p className="flex items-start gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          {info}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <RefreshCw className="animate-spin" />}
        {mode === "signin" ? "Entrar" : "Criar conta"}
      </Button>

      {mode === "signup" && (
        <p className="text-xs text-muted-foreground">
          Os lançamentos que você já cadastrou neste aparelho são enviados para a
          conta no primeiro login.
        </p>
      )}
    </form>
  )
}

function NotConfigured() {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Sincronização não configurada</DialogTitle>
        <DialogDescription>
          Agora seus dados ficam salvos só neste navegador.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Para sincronizar PC e celular, crie um projeto no Supabase e:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            rode o SQL de <code className="text-foreground">supabase/schema.sql</code>;
          </li>
          <li>
            copie <code className="text-foreground">.env.example</code> para{" "}
            <code className="text-foreground">.env.local</code> com a URL e a anon key;
          </li>
          <li>reinicie o servidor de desenvolvimento.</li>
        </ol>
      </div>
    </>
  )
}

import { useCallback, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

import { isSupabaseConfigured, supabase } from "@/lib/supabase"

type AuthStatus = "disabled" | "loading" | "signedIn" | "signedOut"

/** Traduz as mensagens de erro do Supabase Auth. */
function translateError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos."
  if (m.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar (veja sua caixa de entrada)."
  if (m.includes("user already registered"))
    return "Esse e-mail já tem conta. Faça login."
  if (m.includes("password should be at least"))
    return "A senha precisa ter pelo menos 6 caracteres."
  if (m.includes("unable to validate email")) return "E-mail inválido."
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas. Aguarde um instante e tente de novo."
  return message
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "disabled"
  )

  useEffect(() => {
    if (!supabase) return

    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(data.session?.user ?? null)
      setStatus(data.session?.user ? "signedIn" : "signedOut")
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setStatus(session?.user ? "signedIn" : "signedOut")
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: "Sincronização não configurada." }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? translateError(error.message) : null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: "Sincronização não configurada." }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: translateError(error.message) }
    // Sem sessão => o projeto exige confirmação de e-mail.
    return { error: null, needsConfirmation: !data.session }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  return {
    user,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    status,
    enabled: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
  }
}

export type AuthStore = ReturnType<typeof useAuth>

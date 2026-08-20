import { useCallback, useEffect, useState } from "react"
import type { CurrencyCode } from "@/types"

/** Quantos reais vale 1 unidade de cada moeda. BRL é sempre 1. */
export type RatesToBRL = Record<CurrencyCode, number>
export type RateChange = Partial<Record<CurrencyCode, number>>

type Source = "live" | "manual" | "default" | "loading" | "error"

interface RatesState {
  ratesToBRL: RatesToBRL
  change: RateChange
  updatedAt: number | null
  source: Source
}

const STORAGE_KEY = "finenzo:rates"

/** Cotações de fallback (usadas offline até a primeira atualização). */
const DEFAULT_RATES: RatesToBRL = { BRL: 1, USD: 5.4, EUR: 5.9 }

function loadCached(): RatesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as RatesState
      return {
        ...parsed,
        change: parsed.change ?? {},
        source: parsed.source === "loading" ? "default" : parsed.source,
      }
    }
  } catch {
    /* ignora */
  }
  return { ratesToBRL: DEFAULT_RATES, change: {}, updatedAt: null, source: "default" }
}

interface AwesomeQuote {
  bid: string
  pctChange: string
}

/** Busca dólar e euro comercial (AwesomeAPI, sem chave, atualiza intradiária). */
async function fetchRates(): Promise<{ rates: RatesToBRL; change: RateChange }> {
  const res = await fetch(
    "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL"
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as Record<string, AwesomeQuote | undefined>
  const usd = data.USDBRL
  const eur = data.EURBRL
  if (!usd || !eur) throw new Error("Resposta inválida")
  return {
    rates: { BRL: 1, USD: Number(usd.bid), EUR: Number(eur.bid) },
    change: { USD: Number(usd.pctChange), EUR: Number(eur.pctChange) },
  }
}

export function useRates() {
  const [state, setState] = useState<RatesState>(loadCached)

  const persist = useCallback((next: RatesState) => {
    setState(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignora */
    }
  }, [])

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, source: "loading" }))
    try {
      const { rates, change } = await fetchRates()
      persist({ ratesToBRL: rates, change, updatedAt: Date.now(), source: "live" })
    } catch {
      setState((s) => ({ ...s, source: "error" }))
    }
  }, [persist])

  const setManualRate = useCallback((currency: CurrencyCode, value: number) => {
    setState((s) => {
      const next: RatesState = {
        ratesToBRL: { ...s.ratesToBRL, [currency]: value, BRL: 1 },
        change: {},
        updatedAt: Date.now(),
        source: "manual",
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignora */
      }
      return next
    })
  }, [])

  // Busca cotações ao vivo no primeiro carregamento, exceto se o usuário
  // definiu cotações manuais (respeita a escolha dele).
  useEffect(() => {
    if (state.source !== "manual") void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const convertToBRL = useCallback(
    (amount: number, currency: CurrencyCode) =>
      amount * (state.ratesToBRL[currency] ?? 1),
    [state.ratesToBRL]
  )

  return { ...state, refresh, setManualRate, convertToBRL }
}

export type RatesStore = ReturnType<typeof useRates>

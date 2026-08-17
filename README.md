# finEnzo 💸

Gerenciador financeiro pessoal — cadastre seus gastos e entradas, escolha a moeda
(Real, Dólar ou Euro), organize por categorias e acompanhe tudo em gráficos.

## Funcionalidades

- **Lançamentos** de gastos e entradas, cada um com sua **moeda** (🇧🇷 BRL, 🇺🇸 USD, 🇪🇺 EUR)
- **Categorias** personalizáveis com emoji (ex: ✈️ Viagem, 🍔 Alimentação)
- **Totais por moeda** (cada moeda é somada de forma independente, sem conversão)
- **Gráficos**: gastos por categoria (pizza) e entradas × gastos por mês (barras)
- **Dark mode** e dados salvos localmente no navegador (localStorage)

## Stack

React + TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · Recharts

## Como rodar

```bash
npm install
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
npm run build    # build de produção em dist/
npm run preview  # pré-visualiza o build
```

## Estrutura

```
src/
├── components/
│   ├── ui/                  # primitivos shadcn (button, card, dialog, select…)
│   ├── TransactionForm.tsx  # formulário de novo lançamento
│   ├── CategoryManager.tsx  # criar/excluir categorias
│   ├── SummaryCards.tsx     # cards de saldo/entradas/gastos por moeda
│   ├── ExpenseCharts.tsx    # gráficos (pizza + barras)
│   └── TransactionList.tsx  # lista de lançamentos com filtro
├── hooks/
│   ├── useFinance.ts        # estado central + persistência em localStorage
│   └── useTheme.ts          # dark/light mode
├── lib/                     # moedas, cores, estatísticas, utils
└── types.ts                 # tipos de domínio
```

> Os dados ficam apenas no seu navegador. Limpar os dados do site apaga os lançamentos.

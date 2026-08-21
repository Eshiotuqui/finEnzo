# Whalio 🐋

Gerenciador financeiro pessoal — cadastre seus gastos e entradas, escolha a moeda
(Real, Dólar ou Euro), organize por categorias e acompanhe tudo em gráficos.

## Funcionalidades

- **Coleções**: separe os lançamentos por grupo (“Meus gastos”, “Gastos do sogro”)
  e filtre saldo, gráficos e lista pela coleção em foco
- **Lançamentos** de gastos e entradas, cada um com sua **moeda** (🇧🇷 BRL, 🇺🇸 USD, 🇪🇺 EUR)
- **Categorias** personalizáveis com emoji (ex: ✈️ Viagem, 🍔 Alimentação)
- **Totais por moeda** (cada moeda é somada de forma independente, sem conversão)
- **Gráficos**: gastos por categoria (pizza) e entradas × gastos por mês (barras)
- **Cotação real** de dólar e euro (AwesomeAPI), com variação do dia, atualização
  manual e opção de definir a cotação na mão
- **Conta com e-mail e senha**: os mesmos lançamentos no PC e no celular, com
  atualização em tempo real entre os aparelhos
- **Layout dedicado para celular**: sem header, ilha flutuante de navegação com
  botão “+” central e formulários em bottom sheet
- **Dark mode** e funcionamento offline (localStorage como cache)

## Stack

React + TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · Recharts · Supabase

## Como rodar

```bash
npm install
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
npm run build    # build de produção em dist/
npm run preview  # pré-visualiza o build
```

## Sincronizar PC e celular (opcional)

Sem configurar nada, o app funciona offline e guarda tudo só no navegador atual.
Para ter conta e sincronização:

1. Crie um projeto no [Supabase](https://supabase.com).
2. No **SQL Editor**, rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql)
   — ele cria as tabelas `categories`, `collections` e `transactions`, ativa RLS
   (cada usuário só acessa as próprias linhas) e habilita o realtime. O arquivo é
   idempotente: rodar de novo depois de atualizar o app aplica as migrações.
3. Copie `.env.example` para `.env.local` e preencha com os dados de
   **Project Settings → API**:

   ```bash
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key
   ```

4. Reinicie o `npm run dev`, toque em **Conta** e crie seu login.

O que você já tinha cadastrado offline é enviado para a conta no primeiro login.
Depois disso, lançar no PC atualiza o celular na hora (e vice-versa); sem internet
o app segue usando o cache local e ressincroniza ao voltar.

## Estrutura

```
src/
├── components/
│   ├── ui/                  # primitivos shadcn (button, card, dialog, select…)
│   ├── TransactionForm.tsx  # formulário de novo lançamento
│   ├── CategoryManager.tsx  # criar/excluir categorias
│   ├── CollectionManager.tsx # criar/renomear/excluir coleções
│   ├── CollectionSwitcher.tsx # seletor (desktop) e chips (mobile) de coleção
│   ├── SummaryCards.tsx     # cards de saldo/entradas/gastos por moeda
│   ├── ExpenseCharts.tsx    # gráficos (pizza + barras)
│   └── TransactionList.tsx  # lista de lançamentos com filtro
│   ├── AccountDialog.tsx    # login/cadastro e status de sincronização
│   ├── EditRatesDialog.tsx  # cotação manual
│   └── mobile/              # camada exclusiva de celular (ilha + home)
├── hooks/
│   ├── useFinance.ts        # estado central: localStorage + Supabase (realtime)
│   ├── useAuth.ts           # conta (Supabase Auth)
│   ├── useRates.ts          # cotação USD/EUR ao vivo + fallback offline
│   ├── useCollectionFilter.ts # coleção em foco (persistida)
│   ├── useIsMobile.ts       # escolhe o layout desktop x mobile
│   └── useTheme.ts          # dark/light mode
├── lib/                     # moedas, cores, estatísticas, utils
└── types.ts                 # tipos de domínio
```

> Sem conta, os dados ficam apenas no navegador — limpar os dados do site apaga os
> lançamentos. Com conta, ficam no seu projeto Supabase.

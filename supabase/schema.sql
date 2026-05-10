-- ============================================================
-- Controle Financeiro — Supabase Schema
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- Tabela de transações
create table if not exists transactions (
  id                text        primary key,
  user_id           uuid        not null references auth.users(id) on delete cascade,
  date              text        not null default '',
  description       text        not null default '',
  type              text        not null,
  source            text        not null,
  category          text        not null default '',
  planned_value     numeric     not null default 0,
  realized_value    numeric     not null default 0,
  payment_method    text        not null,
  account           text        not null default '',
  status            text        not null default 'pendente',
  month             text        not null,
  is_recurring      boolean     not null default false,
  recurring_id      text,
  observations      text,
  created_at        timestamptz not null default now()
);

-- Tabela de despesas recorrentes
create table if not exists recurring_expenses (
  id            text        primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  name          text        not null,
  type          text        not null,
  source        text        not null,
  category      text        not null default '',
  planned_value numeric     not null default 0,
  due_day       integer     not null default 1,
  months        text[]      not null default '{}',
  active        boolean     not null default true,
  observations  text,
  created_at    timestamptz not null default now()
);

-- Tabela de configurações do usuário
create table if not exists user_settings (
  user_id           uuid        primary key references auth.users(id) on delete cascade,
  salario_fab       numeric     not null default 0,
  pensao            numeric     not null default 0,
  regra_porcentagem jsonb       not null default '{"essenciais": 70, "lazer": 10, "investimento": 20}',
  accounts          text[]      not null default array['Conta Principal'],
  categories        jsonb       not null default '[]',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── Row Level Security ────────────────────────────────────────────────────────

alter table transactions       enable row level security;
alter table recurring_expenses enable row level security;
alter table user_settings      enable row level security;

-- Cada usuário só acessa seus próprios dados
create policy "transactions: acesso próprio"
  on transactions for all
  using (auth.uid() = user_id);

create policy "recurring_expenses: acesso próprio"
  on recurring_expenses for all
  using (auth.uid() = user_id);

create policy "user_settings: acesso próprio"
  on user_settings for all
  using (auth.uid() = user_id);

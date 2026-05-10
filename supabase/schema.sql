-- ==============================================================
-- Controle Financeiro -- Schema Supabase
-- Execute no SQL Editor do seu projeto Supabase
-- ==============================================================


-- --------------------------------------------------------------
-- Tabelas
-- --------------------------------------------------------------

create table if not exists transactions (
  id             text        primary key,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  date           text        not null default '',
  description    text        not null default '',
  type           text        not null,
  source         text        not null,
  category       text        not null default '',
  planned_value  numeric     not null default 0,
  realized_value numeric     not null default 0,
  payment_method text        not null,
  account        text        not null default '',
  status         text        not null default 'pendente',
  month          text        not null,
  is_recurring   boolean     not null default false,
  recurring_id   text,
  observations   text,
  created_at     timestamptz not null default now()
);

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

create table if not exists user_settings (
  user_id           uuid        primary key references auth.users(id) on delete cascade,
  salario_fab       numeric     not null default 0,
  pensao            numeric     not null default 0,
  regra_porcentagem jsonb       not null default '{"essenciais":70,"lazer":10,"investimento":20}',
  accounts          text[]      not null default array['Conta Principal'],
  categories        jsonb       not null default '[]',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);


-- --------------------------------------------------------------
-- Indices
-- --------------------------------------------------------------

create index if not exists transactions_user_id_idx
  on transactions (user_id);

create index if not exists transactions_user_month_idx
  on transactions (user_id, month);

create index if not exists recurring_expenses_user_id_idx
  on recurring_expenses (user_id);


-- --------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------

alter table transactions       enable row level security;
alter table recurring_expenses enable row level security;
alter table user_settings      enable row level security;


-- transactions
create policy "tx_select" on transactions
  for select using (auth.uid() = user_id);

create policy "tx_insert" on transactions
  for insert with check (auth.uid() = user_id);

create policy "tx_update" on transactions
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tx_delete" on transactions
  for delete using (auth.uid() = user_id);


-- recurring_expenses
create policy "rec_select" on recurring_expenses
  for select using (auth.uid() = user_id);

create policy "rec_insert" on recurring_expenses
  for insert with check (auth.uid() = user_id);

create policy "rec_update" on recurring_expenses
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "rec_delete" on recurring_expenses
  for delete using (auth.uid() = user_id);


-- user_settings
create policy "cfg_select" on user_settings
  for select using (auth.uid() = user_id);

create policy "cfg_insert" on user_settings
  for insert with check (auth.uid() = user_id);

create policy "cfg_update" on user_settings
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cfg_delete" on user_settings
  for delete using (auth.uid() = user_id);

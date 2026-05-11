-- ==============================================================
-- Correção das policies RLS — Controle Financeiro
-- Execute no SQL Editor do Supabase para resetar e recriar
-- todas as policies das tabelas de dados do usuário.
-- ==============================================================

-- Garante grants básicos (Supabase faz isso por padrão, mas é segurança extra)
grant select, insert, update, delete on transactions       to authenticated;
grant select, insert, update, delete on recurring_expenses to authenticated;
grant select, insert, update, delete on user_settings      to authenticated;

-- Garante RLS ativado
alter table transactions       enable row level security;
alter table recurring_expenses enable row level security;
alter table user_settings      enable row level security;

-- Dropa todas as policies antigas (incluindo as separadas e qualquer "_all")
drop policy if exists "tx_select" on transactions;
drop policy if exists "tx_insert" on transactions;
drop policy if exists "tx_update" on transactions;
drop policy if exists "tx_delete" on transactions;
drop policy if exists "tx_all"    on transactions;

drop policy if exists "rec_select" on recurring_expenses;
drop policy if exists "rec_insert" on recurring_expenses;
drop policy if exists "rec_update" on recurring_expenses;
drop policy if exists "rec_delete" on recurring_expenses;
drop policy if exists "rec_all"    on recurring_expenses;

drop policy if exists "cfg_select" on user_settings;
drop policy if exists "cfg_insert" on user_settings;
drop policy if exists "cfg_update" on user_settings;
drop policy if exists "cfg_delete" on user_settings;
drop policy if exists "cfg_all"    on user_settings;

-- Cria UMA policy FOR ALL em cada tabela (cobre SELECT, INSERT, UPDATE, DELETE)
create policy "tx_all" on transactions
  for all
  to authenticated
  using       (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

create policy "rec_all" on recurring_expenses
  for all
  to authenticated
  using       (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

create policy "cfg_all" on user_settings
  for all
  to authenticated
  using       (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

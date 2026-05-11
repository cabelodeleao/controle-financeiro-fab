-- ==============================================================
-- Migração estrutural: PK composta (user_id, id)
-- ==============================================================
--
-- POR QUÊ:
--   A PK atual é `id` (text) global. Quando o seed insere IDs
--   determinísticos (ex: "sal-maio", "rec-001"), eles colidem
--   entre usuários. O upsert vira ON CONFLICT DO UPDATE e bate
--   numa linha pertencente a OUTRO user_id, fazendo o RLS
--   retornar erro 42501 ("new row violates row-level security
--   policy") mesmo com as policies corretas.
--
-- O QUE ESTA MIGRAÇÃO FAZ:
--   Troca a PK simples `id` por uma PK composta `(user_id, id)`.
--   Assim cada usuário pode ter seu próprio `id="sal-maio"` sem
--   colidir com os IDs de outros usuários.
--
-- COMPATIBILIDADE COM O CÓDIGO JS:
--   O `supabase.from(...).upsert(...)` do Supabase JS detecta
--   automaticamente as colunas da PK para resolver conflitos,
--   então não é preciso passar `onConflict` no código — funciona
--   transparentemente após esta migração.
--
-- SEGURANÇA:
--   IDs únicos globalmente são automaticamente únicos por
--   (user_id, id), então a migração nunca falha por duplicata.
--
-- COMO USAR:
--   Cole no SQL Editor do Supabase e clique em Run. Idempotente —
--   pode rodar mais de uma vez sem efeito colateral.
-- ==============================================================

-- transactions
alter table transactions       drop constraint if exists transactions_pkey;
alter table transactions       add  primary key (user_id, id);

-- recurring_expenses
alter table recurring_expenses drop constraint if exists recurring_expenses_pkey;
alter table recurring_expenses add  primary key (user_id, id);

-- user_settings já tem PK = user_id (uma linha por usuário), nada a mudar.


-- ── Verificação ───────────────────────────────────────────────
-- Rode esta query depois para confirmar:
--
-- select tc.table_name, kcu.column_name, kcu.ordinal_position
-- from information_schema.table_constraints tc
-- join information_schema.key_column_usage kcu
--   on tc.constraint_name = kcu.constraint_name
-- where tc.constraint_type = 'PRIMARY KEY'
--   and tc.table_schema   = 'public'
--   and tc.table_name in ('transactions', 'recurring_expenses', 'user_settings')
-- order by tc.table_name, kcu.ordinal_position;
--
-- Esperado:
--   recurring_expenses | user_id | 1
--   recurring_expenses | id      | 2
--   transactions       | user_id | 1
--   transactions       | id      | 2
--   user_settings      | user_id | 1

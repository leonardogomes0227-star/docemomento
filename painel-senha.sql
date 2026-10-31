-- Painel com senha única, conferida no banco (sem criar usuário).
-- Cole no Supabase: SQL Editor > New query > Run. Troque a senha na linha marcada.

-- 1) Remove a regra antiga que dependia de login.
drop policy if exists "so logado altera" on public.produtos;

-- 2) Guarda a senha (só o "hash", nunca o texto) e a contagem de erros.
create table if not exists public.config_painel (
  id             int primary key default 1 check (id = 1),
  senha_hash     text not null,
  falhas         int  not null default 0,
  bloqueado_ate  timestamptz
);
alter table public.config_painel enable row level security;   -- sem regras: ninguém lê pelo site

insert into public.config_painel (senha_hash)
values (extensions.crypt('TROQUE-ESTA-SENHA', extensions.gen_salt('bf')))   -- ← troque a senha aqui
on conflict (id) do update set senha_hash = excluded.senha_hash, falhas = 0, bloqueado_ate = null;

-- 3) Confere a senha. 5 erros seguidos bloqueiam o painel por 15 minutos (no servidor).
create or replace function public.checar_senha(p_senha text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare c public.config_painel%rowtype;
begin
  select * into c from public.config_painel where id = 1 for update;
  if c.bloqueado_ate is not null and c.bloqueado_ate > now() then
    raise exception 'bloqueado';
  end if;
  if c.senha_hash = crypt(coalesce(p_senha, ''), c.senha_hash) then
    update public.config_painel set falhas = 0, bloqueado_ate = null where id = 1;
    return true;
  end if;
  update public.config_painel set
    falhas = case when falhas + 1 >= 5 then 0 else falhas + 1 end,
    bloqueado_ate = case when falhas + 1 >= 5 then now() + interval '15 minutes' else bloqueado_ate end
  where id = 1;
  return false;
end $$;

-- 4) O que o painel pode fazer (sempre exigindo a senha).
create or replace function public.admin_login(p_senha text) returns boolean
language sql security definer set search_path = public, extensions as $$
  select public.checar_senha(p_senha);
$$;

create or replace function public.admin_gravar(p_senha text, p jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.checar_senha(p_senha) then raise exception 'senha_incorreta'; end if;
  insert into public.produtos (id, nome, categoria, descricao, img, variantes, destaque, novo, esgotado, ativo, ordem)
  select r.id, r.nome, coalesce(r.categoria, ''), coalesce(r.descricao, ''), coalesce(r.img, ''),
         coalesce(r.variantes, '[]'::jsonb), coalesce(r.destaque, false), coalesce(r.novo, false),
         coalesce(r.esgotado, false), coalesce(r.ativo, true), coalesce(r.ordem, 0)
  from jsonb_populate_recordset(null::public.produtos,
         case when jsonb_typeof(p) = 'array' then p else jsonb_build_array(p) end) r
  on conflict (id) do update set
    nome = excluded.nome, categoria = excluded.categoria, descricao = excluded.descricao, img = excluded.img,
    variantes = excluded.variantes, destaque = excluded.destaque, novo = excluded.novo,
    esgotado = excluded.esgotado, ativo = excluded.ativo, ordem = excluded.ordem;
end $$;

create or replace function public.admin_remover(p_senha text, p_id text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.checar_senha(p_senha) then raise exception 'senha_incorreta'; end if;
  delete from public.produtos where id = p_id;
end $$;

-- A função que confere a senha só roda por dentro das outras.
revoke execute on function public.checar_senha(text) from public, anon, authenticated;

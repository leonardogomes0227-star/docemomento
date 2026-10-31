-- Abrir/fechar a loja pelo painel. Rode UMA vez no Supabase: SQL Editor > New query > Run.
-- (Depende do painel-senha.sql, que já foi rodado.)

alter table public.config_painel add column if not exists loja_aberta boolean not null default true;
alter table public.config_painel add column if not exists aviso text not null default '';

-- O site consulta isto para saber se a loja está aberta (qualquer pessoa pode ver).
create or replace function public.loja_status() returns json
language sql security definer set search_path = public as $$
  select json_build_object('aberta', loja_aberta, 'aviso', aviso) from public.config_painel where id = 1;
$$;

-- O painel usa isto para abrir ou fechar (exige a senha).
create or replace function public.admin_loja(p_senha text, p_aberta boolean, p_aviso text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.checar_senha(p_senha) then raise exception 'senha_incorreta'; end if;
  update public.config_painel set loja_aberta = p_aberta, aviso = left(coalesce(p_aviso, ''), 120) where id = 1;
end $$;

-- Cole tudo isto no Supabase: SQL Editor > New query > Run.
create table if not exists public.produtos (
  id         text primary key,
  nome       text not null,
  categoria  text not null default '',
  descricao  text not null default '',
  img        text not null default '',
  variantes  jsonb not null default '[]',
  destaque   boolean not null default false,
  novo       boolean not null default false,
  esgotado   boolean not null default false,
  ativo      boolean not null default true,
  ordem      integer not null default 0
);

alter table public.produtos enable row level security;

-- Qualquer pessoa vê o cardápio.
create policy "todos veem o cardapio" on public.produtos
  for select using (true);

-- Só quem entrou com login (a Ana) cria, altera e apaga.
create policy "so logado altera" on public.produtos
  for all to authenticated using (true) with check (true);

# Ligar o painel da Ana (Supabase)

São 4 passos, uns 10 minutos, sem programar. O Supabase é gratuito para esse tamanho.

1. **Criar o projeto.** Entre em https://supabase.com, crie a conta e clique em **New project**.
   Nome `doce-momento`, região **South America (São Paulo)**, e anote a senha do banco.
2. **Criar a tabela.** No menu, abra **SQL Editor**, clique em **New query**, cole todo o conteúdo do arquivo `schema.sql` e clique em **Run**.
3. **Criar a senha do painel.** No **SQL Editor**, cole todo o conteúdo do arquivo `painel-senha.sql` (troque a senha na linha marcada) e clique em **Run**. Não precisa criar usuário.
4. **Copiar a chave.** Em **Project Settings → API** (ou **Data API**), copie o **Project URL** e a chave **anon / publishable**.
   Cole no arquivo `supabase-config.js`:

```js
window.SUPABASE_CONFIG = { url: "https://SEU-PROJETO.supabase.co", anonKey: "SUA-CHAVE" };
```

A chave `anon` pode ficar no site: quem protege os dados são as regras do `schema.sql`.

## Primeiro uso
Abra `.../admin.html` (não há link no site; salve nos favoritos), digite a senha da loja (5 erros seguidos bloqueiam o painel por 15 minutos) e, na primeira vez, clique em **Importar cardápio atual**. Depois é só cadastrar produto novo e tocar em ⭐ Destaque.

Para só ver o painel sem ligar nada, abra `admin.html?demo` (nada é publicado).

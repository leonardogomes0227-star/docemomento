# Ligar o painel da Ana (Supabase)

São 5 passos, uns 10 minutos, sem programar. O Supabase é gratuito para esse tamanho.

1. **Criar o projeto.** Entre em https://supabase.com, crie a conta e clique em **New project**.
   Nome `doce-momento`, região **South America (São Paulo)**, e anote a senha do banco.
2. **Criar a tabela.** No menu, abra **SQL Editor**, clique em **New query**, cole todo o conteúdo do arquivo `schema.sql` e clique em **Run**.
3. **Criar o login da Ana.** Em **Authentication → Users → Add user → Create new user**, coloque o e-mail e a senha dela e marque **Auto Confirm User**.
4. **Travar novos cadastros.** Em **Authentication → Sign In / Providers → Email**, desligue **Allow new users to sign up** e salve. Assim só a conta da Ana consegue entrar.
5. **Copiar a chave.** Em **Project Settings → API** (ou **Data API**), copie o **Project URL** e a chave **anon / publishable**.
   Cole no arquivo `supabase-config.js`:

```js
window.SUPABASE_CONFIG = { url: "https://SEU-PROJETO.supabase.co", anonKey: "SUA-CHAVE" };
```

A chave `anon` pode ficar no site: quem protege os dados são as regras do `schema.sql`.

## Primeiro uso
Abra `.../admin.html` (tem o link "Área da loja" no rodapé do site), entre com o e-mail e a senha da Ana e, na primeira vez, clique em **Importar cardápio atual**. Depois é só cadastrar produto novo e tocar em ⭐ Destaque.

Para só ver o painel sem ligar nada, abra `admin.html?demo` (nada é publicado).

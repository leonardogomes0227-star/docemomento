# Ligar o painel da Ana (Firebase)

O Firebase é gratuito para o tamanho desta loja. Ele guarda os produtos, os destaques e as fotos, e o site lê tudo de lá.
Quem faz isso precisa ser dono do projeto Firebase (uma conta Google).

## 1. Criar o projeto
1. Entre em https://console.firebase.google.com e clique em **Criar um projeto** (nome sugerido: `doce-momento`). Pode desligar o Google Analytics.

## 2. Registrar o site e copiar a configuração
1. Na tela inicial do projeto, clique no ícone **Web** (`</>`) e registre o app (qualquer apelido). **Não** precisa ativar o Hosting.
2. O Firebase mostra um bloco `firebaseConfig = { apiKey: ..., authDomain: ..., projectId: ..., appId: ... }`.
3. Abra o arquivo `firebase-config.js` deste repositório e troque `null` por esse bloco:

```js
window.FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  appId: "..."
};
```

Essa configuração não é uma senha. Quem protege os dados são as regras do passo 4.

## 3. Ativar o banco e o login
1. **Build → Firestore Database → Criar banco de dados**, em modo de **produção**, região `southamerica-east1` (São Paulo).
2. **Build → Authentication → Vamos começar → E-mail/senha → Ativar**.
3. Na aba **Users**, clique em **Adicionar usuário** e crie o e-mail e a senha da Ana.
4. Em **Authentication → Settings → Domínios autorizados**, adicione `leonardogomes0227-star.github.io`.
5. Em **Authentication → Settings → Ações do usuário**, desmarque **Ativar criação (cadastro)**, para ninguém criar conta nova.

## 4. Regras de segurança
1. **Firestore Database → Regras**.
2. Cole o conteúdo do arquivo `firestore.rules`, trocando `EMAIL_DA_ANA@exemplo.com` (e `EMAIL_DO_DONO@exemplo.com`) pelos e-mails reais. Clique em **Publicar**.

Com essas regras, qualquer pessoa vê o cardápio, mas só esses e-mails alteram.

## 5. Primeiro uso
1. Faça o push da configuração para o repositório (o site se atualiza sozinho pelo GitHub Pages).
2. Abra `https://leonardogomes0227-star.github.io/docemomento/admin.html` e entre com o e-mail e a senha da Ana.
3. Na primeira vez, clique em **Importar cardápio atual**. Depois é só editar, destacar, marcar como novo ou esgotado e cadastrar produtos novos com foto.

Enquanto o `firebase-config.js` estiver com `null`, o site usa o cardápio padrão (`catalogo.js`). Para testar o painel sem Firebase, abra `admin.html?demo` (nada é publicado).

## Observações
- As fotos novas são reduzidas no celular (800 px) e guardadas no próprio banco, então não é preciso o Firebase Storage.
- Se um dia todos os produtos forem apagados do banco, o site volta a mostrar o cardápio padrão.
- O endereço do painel não aparece no site, mas não é secreto: a segurança vem do login.

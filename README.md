# Doce Momento

Site de vendas (HTML, CSS e JavaScript puros, sem build) com carrinho que envia o pedido pelo WhatsApp e um painel para a loja.

## Arquivos
| Arquivo | Para que serve |
|---|---|
| `index.html`, `style.css`, `script.js` | O site para os clientes |
| `catalogo.js` | Cardápio padrão (usado se o banco estiver fora do ar e para importar no painel) |
| `dados.js`, `supabase-config.js` | Leitura e gravação dos produtos no Supabase |
| `admin.html`, `admin.js`, `admin.css` | Painel da loja (senha única) |
| `schema.sql`, `painel-senha.sql` | Tabela e senha do painel (rodar uma vez no Supabase) |
| `SETUP-SUPABASE.md` | Passo a passo para ligar o painel |
| `assets/` | Fotos (WebP) e ícones |

## Como mudar as coisas
- **Produto novo, destaque, preço:** pelo painel (`/admin.html`).
- **Taxa de entrega ou número do WhatsApp:** no topo de `script.js` (`TAXA_ENTREGA`, `WHATSAPP`).
- **Textos do site:** `index.html`.
- **Cores:** variáveis no começo de `style.css`.

Teste o painel sem ligar nada em `admin.html?demo`. O site é publicado pelo GitHub Pages a cada push.

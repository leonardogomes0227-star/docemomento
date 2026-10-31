// Configuração do Supabase (veja SETUP-SUPABASE.md).
// A chave "publishable" é pública por natureza: quem protege os dados são as regras do schema.sql.
window.SUPABASE_CONFIG = window.SUPABASE_CONFIG || {
  url: "https://rrqyoqkgfgshaofgdvfd.supabase.co",
  anonKey: "sb_publishable_tEK5BZG8SWurIY_78WxXUg_ncmGTgRm",
  // E-mail fixo do login da loja: o painel pede só a senha.
  adminEmail: "loja@docemomento.com",
};

// Camada de dados compartilhada pelo site e pelo painel.
// Modos: Supabase (produção), demonstração (?demo, guarda só neste navegador) ou nenhum (site usa o catálogo padrão).
(function () {
  const DM = (window.DM = {});
  const CATALOGO = window.CATALOGO || [];

  DM.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  DM.slug = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "produto";
  DM.demo = new URLSearchParams(location.search).has("demo");

  const limpar = (p) => JSON.parse(JSON.stringify(p));

  function demo() {
    const KEY = "dm-demo-produtos";
    const ouvintes = new Set();
    const ler = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
    const lista = () => ler() || CATALOGO.map(limpar);
    const gravar = (l) => { localStorage.setItem(KEY, JSON.stringify(l)); emitir(); };
    const emitir = () => ouvintes.forEach((f) => f(lista()));
    window.addEventListener("storage", (e) => { if (e.key === KEY) emitir(); });
    return {
      demo: true,
      ouvirProdutos(cb) { ouvintes.add(cb); cb(lista()); },
      async salvar(p) { gravar(lista().filter((x) => x.id !== p.id).concat(limpar(p))); },
      async remover(id) { gravar(lista().filter((x) => x.id !== id)); },
      async importar(l) { gravar(l.map(limpar)); },
      onAuth(cb) { cb({ email: "demonstração" }); },
      async login() {}, async sair() {},
    };
  }

  const carregarScript = (src) => new Promise((ok, no) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = () => no(new Error("Não carregou " + src));
    document.head.append(s);
  });

  async function supabase() {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg) return null;
    await carregarScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js");
    const sb = window.supabase.createClient(cfg.url, cfg.anonKey);
    const daLinha = (r) => ({ id: r.id, nome: r.nome, categoria: r.categoria, desc: r.descricao, img: r.img, variantes: r.variantes,
      destaque: r.destaque, novo: r.novo, esgotado: r.esgotado, ativo: r.ativo, ordem: r.ordem });
    const paraLinha = (p) => ({ id: p.id, nome: p.nome, categoria: p.categoria || "", descricao: p.desc || "", img: p.img || "",
      variantes: p.variantes || [], destaque: !!p.destaque, novo: !!p.novo, esgotado: !!p.esgotado, ativo: p.ativo !== false, ordem: p.ordem ?? 0 });
    const ouvintes = new Set();
    async function recarregar() {
      try {
        const { data, error } = await sb.from("produtos").select("*");
        if (error) throw error;
        const l = data.map(daLinha);
        ouvintes.forEach((o) => o.cb(l));
      } catch (e) { ouvintes.forEach((o) => o.erro && o.erro(e)); }
    }
    const ok = async (req) => { const { error } = await req; if (error) throw error; };
    return {
      demo: false,
      ouvirProdutos(cb, erro) { ouvintes.add({ cb, erro }); recarregar(); },
      async salvar(p) { await ok(sb.from("produtos").upsert(paraLinha(p))); await recarregar(); },
      async remover(id) { await ok(sb.from("produtos").delete().eq("id", id)); await recarregar(); },
      async importar(l) { await ok(sb.from("produtos").upsert(l.map(paraLinha))); await recarregar(); },
      onAuth(cb) {
        sb.auth.getSession().then(({ data }) => cb(data.session?.user || null));
        sb.auth.onAuthStateChange((_e, s) => cb(s?.user || null));
      },
      async login(email, senha) { await ok(sb.auth.signInWithPassword({ email, password: senha })); },
      async sair() { await sb.auth.signOut(); },
    };
  }

  let pronto;
  DM.conectar = () => (pronto ||= (DM.demo ? Promise.resolve(demo()) : supabase().catch((e) => { console.warn("Supabase indisponível", e); return null; })));
})();

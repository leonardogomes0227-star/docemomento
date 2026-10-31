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
    // Chaves novas (sb_publishable_...) não são JWT: o gateway não aceita a chave no cabeçalho Authorization.
    // Tiramos esse cabeçalho só quando ele é a própria chave; depois do login ele leva o token da Ana.
    const semBearerPublico = (url, opts = {}) => {
      const h = new Headers(opts.headers || {});
      if (h.get("Authorization") === "Bearer " + cfg.anonKey) h.delete("Authorization");
      return fetch(url, { ...opts, headers: h });
    };
    const sb = window.supabase.createClient(cfg.url, cfg.anonKey, { global: { fetch: semBearerPublico } });
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
    // Senha única conferida no banco (painel-senha.sql). Fica só na memória da aba (sessionStorage).
    const SK = "dm-admin-senha";
    let senhaAtual = null;
    try { senhaAtual = sessionStorage.getItem(SK); } catch {}
    const authOuv = new Set();
    const avisar = (u) => authOuv.forEach((f) => f(u));
    function esquecer() { senhaAtual = null; try { sessionStorage.removeItem(SK); } catch {} avisar(null); }
    async function rpc(nome, args) {
      const { data, error } = await sb.rpc(nome, args);
      if (error) {
        const e = new Error(error.message); e.code = error.code;
        e.bloqueado = /bloqueado/.test(error.message || "");
        if (/senha_incorreta/.test(error.message || "")) { e.senhaIncorreta = true; esquecer(); }
        throw e;
      }
      return data;
    }
    return {
      demo: false,
      ouvirProdutos(cb, erro) { ouvintes.add({ cb, erro }); recarregar(); },
      async salvar(p) { await rpc("admin_gravar", { p_senha: senhaAtual, p: paraLinha(p) }); await recarregar(); },
      async remover(id) { await rpc("admin_remover", { p_senha: senhaAtual, p_id: id }); await recarregar(); },
      async importar(l) { await rpc("admin_gravar", { p_senha: senhaAtual, p: l.map(paraLinha) }); await recarregar(); },
      onAuth(cb) {
        authOuv.add(cb);
        if (!senhaAtual) return cb(null);
        rpc("admin_login", { p_senha: senhaAtual }).then((ok) => { if (ok) cb({ email: "loja" }); else esquecer(); }).catch(() => cb(null));
      },
      async login(_email, senha) {
        const ok = await rpc("admin_login", { p_senha: senha });
        if (ok !== true) { const e = new Error("Senha incorreta"); e.status = 401; throw e; }
        senhaAtual = senha; try { sessionStorage.setItem(SK, senha); } catch {}
        avisar({ email: "loja" });
      },
      async sair() { esquecer(); },
    };
  }

  let pronto;
  DM.conectar = () => (pronto ||= (DM.demo ? Promise.resolve(demo()) : supabase().catch((e) => { console.warn("Supabase indisponível", e); return null; })));
})();

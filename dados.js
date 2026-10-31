// Camada de dados compartilhada pelo site e pelo painel.
// Modos: Supabase (produção, só chamadas HTTP simples), demonstração (?demo, guarda só neste navegador)
// ou nenhum (o site usa o catálogo padrão de catalogo.js).
(function () {
  const DM = (window.DM = {});
  const CATALOGO = window.CATALOGO || [];

  DM.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  DM.slug = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "produto";
  DM.demo = new URLSearchParams(location.search).has("demo");

  const limpar = (p) => JSON.parse(JSON.stringify(p));

  // ---------- modo demonstração ----------
  function demo() {
    const KEY = "dm-demo-produtos";
    const ouvintes = new Set();
    const ler = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
    const lista = () => ler() || CATALOGO.map(limpar);
    const emitir = () => ouvintes.forEach((f) => f(lista()));
    const gravar = (l) => { localStorage.setItem(KEY, JSON.stringify(l)); emitir(); };
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

  // ---------- Supabase (REST puro, sem biblioteca) ----------
  function supabase() {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg) return null;
    const base = cfg.url.replace(/\/+$/, "") + "/rest/v1/";
    const CACHE = "dm-produtos-cache";

    async function pedir(caminho, opcoes = {}) {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 12000);
      try {
        const r = await fetch(base + caminho, { ...opcoes, headers: { apikey: cfg.anonKey, "Content-Type": "application/json" }, signal: ctl.signal });
        const txt = await r.text();
        let corpo = null;
        try { corpo = txt ? JSON.parse(txt) : null; } catch {}
        if (!r.ok) { const e = new Error((corpo && corpo.message) || "Erro " + r.status); e.code = corpo && corpo.code; e.status = r.status; throw e; }
        return corpo;
      } finally { clearTimeout(t); }
    }
    const rpc = async (nome, args) => {
      try { return await pedir("rpc/" + nome, { method: "POST", body: JSON.stringify(args) }); }
      catch (e) {
        e.bloqueado = /bloqueado/.test(e.message || "");
        if (/senha_incorreta/.test(e.message || "")) { e.senhaIncorreta = true; esquecer(); }
        throw e;
      }
    };
    const daLinha = (r) => ({ id: r.id, nome: r.nome, categoria: r.categoria, desc: r.descricao, img: r.img, variantes: r.variantes,
      destaque: r.destaque, novo: r.novo, esgotado: r.esgotado, ativo: r.ativo, ordem: r.ordem });
    const paraLinha = (p) => ({ id: p.id, nome: p.nome, categoria: p.categoria || "", descricao: p.desc || "", img: p.img || "",
      variantes: p.variantes || [], destaque: !!p.destaque, novo: !!p.novo, esgotado: !!p.esgotado, ativo: p.ativo !== false, ordem: p.ordem ?? 0 });

    const ouvintes = new Set();
    async function recarregar() {
      try {
        const l = (await pedir("produtos?select=*")).map(daLinha);
        try { l.length ? localStorage.setItem(CACHE, JSON.stringify(l)) : localStorage.removeItem(CACHE); } catch {}
        ouvintes.forEach((o) => o.cb(l));
      } catch (e) { ouvintes.forEach((o) => o.erro && o.erro(e)); }
    }

    // Senha única conferida no banco (painel-senha.sql). Fica só na aba (sessionStorage).
    const SK = "dm-admin-senha";
    let senhaAtual = null;
    try { senhaAtual = sessionStorage.getItem(SK); } catch {}
    const authOuv = new Set();
    const avisar = (u) => authOuv.forEach((f) => f(u));
    function esquecer() { senhaAtual = null; try { sessionStorage.removeItem(SK); } catch {} avisar(null); }
    const gravarNoBanco = (nome, args) => rpc(nome, { p_senha: senhaAtual, ...args }).then(recarregar);

    return {
      demo: false,
      ouvirProdutos(cb, erro) {
        ouvintes.add({ cb, erro });
        try { const c = JSON.parse(localStorage.getItem(CACHE)); if (Array.isArray(c) && c.length) cb(c); } catch {}  // abre na hora com o que já sabe
        recarregar();
      },
      salvar: (p) => gravarNoBanco("admin_gravar", { p: paraLinha(p) }),
      remover: (id) => gravarNoBanco("admin_remover", { p_id: id }),
      importar: (l) => gravarNoBanco("admin_gravar", { p: l.map(paraLinha) }),
      onAuth(cb) {
        authOuv.add(cb);
        if (!senhaAtual) return cb(null);
        rpc("admin_login", { p_senha: senhaAtual }).then((ok) => { if (ok) cb({ email: "loja" }); else esquecer(); }).catch(() => cb(null));
      },
      async login(_email, senha) {
        if ((await rpc("admin_login", { p_senha: senha })) !== true) { const e = new Error("Senha incorreta"); e.status = 401; throw e; }
        senhaAtual = senha; try { sessionStorage.setItem(SK, senha); } catch {}
        avisar({ email: "loja" });
      },
      async sair() { esquecer(); },
    };
  }

  let pronto;
  DM.conectar = () => (pronto ||= Promise.resolve(DM.demo ? demo() : supabase()));
})();

// Camada de dados compartilhada pelo site e pelo painel.
// Modos: Firebase (produção), demonstração (?demo, guarda só neste navegador) ou nenhum (site usa o catálogo padrão).
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

  async function firebase() {
    const cfg = window.FIREBASE_CONFIG;
    if (!cfg) return null;
    const base = "https://www.gstatic.com/firebasejs/10.14.1/";
    const [{ initializeApp }, fs, au] = await Promise.all([
      import(base + "firebase-app.js"), import(base + "firebase-firestore.js"), import(base + "firebase-auth.js"),
    ]);
    const app = initializeApp(cfg);
    const db = fs.getFirestore(app);
    const auth = au.getAuth(app);
    const col = fs.collection(db, "produtos");
    return {
      demo: false,
      ouvirProdutos(cb, erro) { return fs.onSnapshot(col, (snap) => cb(snap.docs.map((d) => ({ ...d.data(), id: d.id }))), erro); },
      salvar: (p) => fs.setDoc(fs.doc(db, "produtos", p.id), limpar(p)),
      remover: (id) => fs.deleteDoc(fs.doc(db, "produtos", id)),
      async importar(l) { const b = fs.writeBatch(db); l.forEach((p) => b.set(fs.doc(db, "produtos", p.id), limpar(p))); await b.commit(); },
      onAuth: (cb) => au.onAuthStateChanged(auth, cb),
      login: (email, senha) => au.signInWithEmailAndPassword(auth, email, senha),
      sair: () => au.signOut(auth),
    };
  }

  let pronto;
  DM.conectar = () => (pronto ||= (DM.demo ? Promise.resolve(demo()) : firebase().catch((e) => { console.warn("Firebase indisponível", e); return null; })));
})();

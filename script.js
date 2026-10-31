document.documentElement.classList.add("js");

// Número do WhatsApp (DDI + DDD + número, só dígitos)
const WHATSAPP = "5566999610260";
const TAXA_ENTREGA = 3;

const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const wa = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
const $ = (id) => document.getElementById(id);

document.querySelectorAll("[data-wa]").forEach((a) => {
  a.href = wa(a.dataset.wa);
  a.target = "_blank";
  a.rel = "noopener";
});
$("ano").textContent = new Date().getFullYear();

// Cardápio: vem do Supabase (painel da Ana) e, sem ele, de catalogo.js
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let produtos = CATALOGO.map((p) => ({ ...p }));
const qtd = {}; // chave "produto|variante" -> { nome, label, price, n }
let contagemSalva = {};
const key = (p, v) => `${p.nome}|${v.label || ""}`;
const variantesDe = (p) => (p.variantes && p.variantes.length ? p.variantes : [{ price: null }]);
const imgSrc = (p) => (!p.img ? "" : /^(data:|https?:)/.test(p.img) ? p.img : `assets/${p.img}.webp`);

function cardHtml(p) {
  const src = imgSrc(p);
  const foto = src
    ? `<img class="photo" src="${esc(src)}" alt="${esc(p.nome)}" width="400" height="400" loading="lazy">`
    : `<div class="photo art"><span>🍪</span></div>`;
  const selos = [p.destaque && "⭐ Destaque", p.novo && "🆕 Novo"].filter(Boolean).map((t) => `<span class="badge">${t}</span>`).join("");
  const vars = variantesDe(p);
  const linhas = p.esgotado ? `<p class="soldout">Esgotado por enquanto</p>` : vars.map((v) => `
      <div class="variant" data-key="${esc(key(p, v))}">
        <span class="vlabel">${v.label ? `<span>${esc(v.label)}</span>` : ""}<b>${v.price == null ? "consulte" : brl(v.price)}</b></span>
        <div class="qty" role="group" aria-label="Quantidade de ${esc(p.nome)} ${esc(v.label || "")}">
          <button type="button" data-d="-1" aria-label="Diminuir">−</button>
          <output>0</output>
          <button type="button" data-d="1" aria-label="Aumentar">+</button>
        </div>
      </div>`).join("");
  return `<article class="card${p.esgotado ? " esgotado" : ""}" data-p="${esc(p.nome)}">
    ${selos ? `<div class="badges">${selos}</div>` : ""}${foto}<h3>${esc(p.nome)}</h3><p>${esc(p.desc)}</p>
    <div class="variants${vars.length === 1 ? " single" : ""}">${linhas}</div></article>`;
}

function construirMenu() {
  const ativos = produtos.filter((p) => p.ativo !== false).sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999));
  const blocos = [];
  const destaques = ativos.filter((p) => p.destaque && !p.esgotado);
  if (destaques.length) blocos.push(["⭐ Destaques", destaques]);
  const grupos = new Map();
  ativos.forEach((p) => { const t = p.categoria || "Outros"; if (!grupos.has(t)) grupos.set(t, []); grupos.get(t).push(p); });
  grupos.forEach((l, t) => blocos.push([t, l]));
  const chips = `<nav class="chips" aria-label="Categorias do cardápio">${blocos.map(([t], i) => `<a href="#g${i}">${esc(t)}</a>`).join("")}</nav>`;
  $("menu").innerHTML = chips + blocos.map(([t, l], i) => `<h3 class="group" id="g${i}">${esc(t)}</h3><div class="cards">${l.map(cardHtml).join("")}</div>`).join("");
  destacarChip();
}

// Marca na barra de categorias a seção que está na tela
let obsChips;
function destacarChip() {
  if (!("IntersectionObserver" in window)) return;
  obsChips && obsChips.disconnect();
  obsChips = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    document.querySelectorAll(".chips a").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-35% 0px -60% 0px" });
  document.querySelectorAll(".group").forEach((g) => obsChips.observe(g));
}

function sincronizar() {
  const novo = {};
  produtos.filter((p) => p.ativo !== false && !p.esgotado).forEach((p) =>
    variantesDe(p).forEach((v) => {
      const k = key(p, v);
      novo[k] = { nome: p.nome, label: v.label || "", price: v.price ?? null, n: qtd[k]?.n ?? contagemSalva[k] ?? 0 };
    }));
  Object.keys(qtd).forEach((k) => delete qtd[k]);
  Object.assign(qtd, novo);
}

function atualizarProdutos(lista) {
  produtos = lista;
  sincronizar();
  construirMenu();
  render();
}

// Estado do pedido (lembrado no navegador)
const STORE = "docemomento-carrinho-v1";
const estado = { tipo: "entrega", nome: "", end: "", obs: "" };
function carregar() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE) || "null");
    if (!d) return;
    contagemSalva = d.qtd || {};
    estado.tipo = d.tipo === "retirada" ? "retirada" : "entrega";
    estado.nome = String(d.nome || ""); estado.end = String(d.end || ""); estado.obs = String(d.obs || "");
  } catch {}
}
function salvar() {
  try {
    const q = Object.fromEntries(Object.entries(qtd).filter(([, l]) => l.n > 0).map(([k, l]) => [k, l.n]));
    localStorage.setItem(STORE, JSON.stringify({ qtd: q, ...estado }));
  } catch {}
}

function render() {
  const linhas = Object.entries(qtd).filter(([, l]) => l.n > 0);
  const itens = linhas.reduce((s, [, l]) => s + l.n, 0);
  const sub = linhas.reduce((s, [, l]) => s + (l.price || 0) * l.n, 0);
  const entrega = estado.tipo === "entrega";
  const taxa = entrega && itens ? TAXA_ENTREGA : 0;
  const total = sub + taxa;
  const consultar = [...new Set(linhas.filter(([, l]) => l.price == null).map(([, l]) => l.nome))];
  const vazio = itens === 0;

  // cartões do cardápio
  document.querySelectorAll(".variant").forEach((r) => { r.querySelector("output").textContent = qtd[r.dataset.key].n; });
  document.querySelectorAll(".card[data-p]").forEach((c) =>
    c.classList.toggle("selected", linhas.some(([, l]) => l.nome === c.dataset.p)));

  // contadores
  document.body.classList.toggle("has-cart", !vazio);
  $("cart").hidden = vazio;
  $("badge").hidden = vazio;
  $("badge").textContent = itens;
  $("cartCount").textContent = itens;
  $("cartTotal").textContent = brl(total);
  $("cartSub").textContent = entrega ? "com taxa de entrega" : "retirada, sem taxa";

  // gaveta
  $("empty").hidden = !vazio;
  $("clear").hidden = vazio;
  $("lines").innerHTML = linhas.map(([k, l]) => `
    <li data-key="${k}">
      <div class="ln"><span>${esc(l.nome)}${l.label ? ` <small>${esc(l.label)}</small>` : ""}</span>
        <b>${l.price == null ? "consultar" : brl(l.price * l.n)}</b></div>
      <div class="qty sm"><button type="button" data-d="-1" aria-label="Diminuir">−</button><output>${l.n}</output><button type="button" data-d="1" aria-label="Aumentar">+</button></div>
    </li>`).join("");
  $("sub").textContent = brl(sub);
  $("taxaLabel").textContent = entrega ? "Taxa de entrega" : "Retirada";
  $("taxa").textContent = entrega ? brl(taxa) : "sem taxa";
  $("tot").textContent = brl(total);
  $("consulta").hidden = consultar.length === 0;
  $("endWrap").hidden = !entrega;
  $("retNote").hidden = entrega;
  $("send").classList.toggle("off", vazio);

  const msg = [
    "Olá! Quero fazer um pedido pelo site 🍪", "",
    `*Nome:* ${estado.nome.trim() || "-"}`,
    entrega ? `*Recebimento:* Entrega (taxa ${brl(TAXA_ENTREGA)})` : "*Recebimento:* Retirada",
    ...(entrega ? [`*Endereço:* ${estado.end.trim() || "-"}`] : []), "",
    "*Pedido:*",
    ...linhas.map(([, l]) => `• ${l.n}x ${l.nome}${l.label ? ` (${l.label})` : ""} — ${l.price == null ? "valor a confirmar" : brl(l.price * l.n)}`), "",
    `Subtotal: ${brl(sub)}`,
    entrega ? `Taxa de entrega: ${brl(taxa)}` : "Retirada: sem taxa",
    `*Total: ${brl(total)}*`,
    ...(consultar.length ? [`(sem contar: ${consultar.join(", ")}, valor a confirmar)`] : []),
    ...(estado.obs.trim() ? ["", `*Observações:* ${estado.obs.trim()}`] : []),
  ].join("\n");
  $("send").href = wa(msg);
  salvar();
}

function mudar(k, d) { qtd[k].n = Math.max(0, qtd[k].n + d); render(); }
$("menu").addEventListener("click", (e) => {
  const b = e.target.closest(".qty button");
  if (b) mudar(b.closest(".variant").dataset.key, Number(b.dataset.d));
});
$("lines").addEventListener("click", (e) => {
  const b = e.target.closest(".qty button");
  if (b) mudar(b.closest("li").dataset.key, Number(b.dataset.d));
});
$("clear").addEventListener("click", () => { Object.values(qtd).forEach((l) => (l.n = 0)); render(); });

// Formulário
carregar();
$("nome").value = estado.nome; $("end").value = estado.end; $("obs").value = estado.obs;
document.querySelector(`input[name="tipo"][value="${estado.tipo}"]`).checked = true;
["nome", "end", "obs"].forEach((id) => $(id).addEventListener("input", () => {
  estado[id] = $(id).value; $("hint").hidden = true; render();
}));
$("tipo").addEventListener("change", (e) => { estado.tipo = e.target.value; $("hint").hidden = true; render(); });
$("send").addEventListener("click", (e) => {
  const itens = Object.values(qtd).some((l) => l.n > 0);
  const falta = !itens ? null : !estado.nome.trim() ? "nome" : estado.tipo === "entrega" && !estado.end.trim() ? "end" : "";
  if (falta === "" ) return;
  e.preventDefault();
  $("hint").hidden = false;
  $("hint").textContent = !itens ? "Adicione pelo menos um item ao carrinho."
    : falta === "nome" ? "Informe seu nome para enviar o pedido." : "Informe o endereço de entrega para enviar o pedido.";
  if (falta) $(falta).focus();
});

// Gaveta do carrinho
// Enquanto o carrinho está aberto, o resto da página fica "inerte": o teclado e os leitores de tela ficam só nele.
const fundo = () => document.querySelectorAll(".topbar, .nav, main, body > footer, #cart, .wa-float");
let abriuDe = null;
const abrir = () => {
  abriuDe = document.activeElement;
  $("overlay").hidden = false; $("drawer").hidden = false; document.body.classList.add("lock");
  fundo().forEach((e) => (e.inert = true));
  $("closeCart").focus();
};
const fechar = () => {
  $("overlay").hidden = true; $("drawer").hidden = true; document.body.classList.remove("lock");
  fundo().forEach((e) => (e.inert = false));
  if (abriuDe && abriuDe.isConnected && !abriuDe.hidden) abriuDe.focus();
};
["openCart", "barOpen"].forEach((id) => $(id).addEventListener("click", abrir));
$("closeCart").addEventListener("click", fechar);
$("overlay").addEventListener("click", fechar);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("drawer").hidden) fechar(); });

atualizarProdutos(produtos);

DM.conectar().then((a) => a && a.ouvirProdutos((l) => { if (l.length) atualizarProdutos(l); }, () => {}));

// Animação ao rolar
const io = "IntersectionObserver" in window
  ? new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.08 })
  : null;
document.querySelectorAll(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));

document.documentElement.classList.add("js");

// Número do WhatsApp (DDI + DDD + número, só dígitos)
const WHATSAPP = "5566999610260";
const TAXA_ENTREGA = 3;

// Cardápio: para mudar preço ou descrição, edite aqui.
// price: null = "consulte o valor" (não entra no total).
const MASSAS = (price) => [
  { label: "Massa tradicional", price },
  { label: "Massa black", price },
];
const PRODUTOS = [
  { titulo: "🍪 Cookies", itens: [
    { nome: "Cookie tradicional", img: "cookie-massa-black", desc: "Cookie clássico com gotas de chocolate. Escolha a massa: tradicional ou black.", variantes: MASSAS(8) },
    { nome: "Cookie simples de Nutella", img: "cookie-nutella-simples", desc: "Massa de cookie com Nutella por cima para dar aquele toque especial.", variantes: MASSAS(13) },
    { nome: "Cookie simples de Kinder", img: "cookie-kinder", desc: "Nossa massa de cookie com recheio de Kinder por cima.", variantes: MASSAS(13) },
    { nome: "Kinder Lovers", img: "cookie-kinder-lovers", desc: "Cookie douradinho por fora, macio por dentro e recheado com muito creme de Kinder!", variantes: MASSAS(20) },
    { nome: "Nutella Lovers", img: "cookie-nutella-lovers", desc: "Um cookie especial, com sabor marcante e muito recheio de Nutella para deixar tudo ainda mais gostoso.", variantes: MASSAS(22) },
    { nome: "Cookie Nutkinder", img: "cookie-nutkinder", desc: "A combinação perfeita, Kinder com Nutella em um só!", variantes: MASSAS(null) },
  ]},
  { titulo: "🥧 Tortas", itens: [
    { nome: "Torta de Nutella", img: "torta-nutella", desc: "Massa deliciosa com muito recheio de Nutella, perfeita para os apaixonados por chocolate.", variantes: [{ price: 30 }] },
    { nome: "Torta de Kinder", img: "torta-kinder", desc: "Massa delicada com recheio cremoso de Kinder, trazendo todo o sabor e a cremosidade que você ama.", variantes: [{ price: 28 }] },
    { nome: "Torta suprema", img: "torta-suprema", desc: "Nossa torta suprema, uma massa deliciosa de brownie com brigadeiro de Ninho, Nutella e Kinder Bueno!", variantes: [{ price: 35 }] },
  ]},
  { titulo: "🍫 Brownies", itens: [
    { nome: "Brownie tradicional", img: "brownie-tradicional", desc: "Brownie fofinho por dentro, com sabor intenso de chocolate e uma casquinha deliciosa.", variantes: [{ price: 12 }] },
    { nome: "Brownie com Nutella", img: "brownie-nutella", desc: "Brownie macio e chocolatudo, com uma generosa camada de Nutella para deixar cada mordida irresistível.", variantes: [{ price: 15 }] },
    { nome: "Fondue de brownie", img: "fondue-de-brownie", desc: "Brownie na quantidade certa, acompanhado de brigadeiro de Ninho e Nutella para uma combinação perfeita!", variantes: [{ price: 20 }] },
  ]},
  { titulo: "😍 Brookies", itens: [
    { nome: "Brookie", img: "brookie", desc: "A união perfeita entre brownie e cookie, trazendo duas texturas deliciosas em uma só sobremesa.", variantes: [{ label: "Tradicional", price: 15 }, { label: "Com Nutella", price: 18 }] },
  ]},
  { titulo: "🥟 Salgados", itens: [
    { nome: "Empada de frango", img: "empada-de-frango", desc: "Massa leve e delicada, com recheio cremoso de frango bem temperadinho.", variantes: [{ price: 28 }] },
  ]},
];

const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const wa = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
const $ = (id) => document.getElementById(id);

document.querySelectorAll("[data-wa]").forEach((a) => {
  a.href = wa(a.dataset.wa);
  a.target = "_blank";
  a.rel = "noopener";
});
$("ano").textContent = new Date().getFullYear();

// Monta o cardápio
const qtd = {}; // chave "produto|variante" -> { nome, label, price, n }
const key = (p, v) => `${p.nome}|${v.label || ""}`;
PRODUTOS.flatMap((g) => g.itens).forEach((p) =>
  p.variantes.forEach((v) => (qtd[key(p, v)] = { nome: p.nome, label: v.label || "", price: v.price ?? null, n: 0 })));

$("menu").innerHTML = PRODUTOS.map((g) => `
  <h3 class="group reveal">${g.titulo}</h3>
  <div class="cards">${g.itens.map((p) => {
    const foto = p.img
      ? `<img class="photo" src="assets/${p.img}.jpg" alt="${p.nome}" width="400" height="400" loading="lazy">`
      : `<div class="photo art"></div>`;
    const linhas = p.variantes.map((v) => `
      <div class="variant" data-key="${key(p, v)}">
        <span class="vlabel">${v.label ? `<span>${v.label}</span>` : ""}<b>${v.price == null ? "consulte" : brl(v.price)}</b></span>
        <div class="qty" role="group" aria-label="Quantidade de ${p.nome} ${v.label || ""}">
          <button type="button" data-d="-1" aria-label="Diminuir">−</button>
          <output>0</output>
          <button type="button" data-d="1" aria-label="Aumentar">+</button>
        </div>
      </div>`).join("");
    return `<article class="card reveal" data-p="${p.nome}">${foto}<h3>${p.nome}</h3><p>${p.desc}</p>
      <div class="variants${p.variantes.length === 1 ? " single" : ""}">${linhas}</div></article>`;
  }).join("")}</div>`).join("");

// Estado do pedido (lembrado no navegador)
const STORE = "docemomento-carrinho-v1";
const estado = { tipo: "entrega", nome: "", end: "", obs: "" };
function carregar() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE) || "null");
    if (!d) return;
    Object.entries(d.qtd || {}).forEach(([k, n]) => { if (qtd[k]) qtd[k].n = Math.max(0, Number(n) || 0); });
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
      <div class="ln"><span>${l.nome}${l.label ? ` <small>${l.label}</small>` : ""}</span>
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
const abrir = () => { $("overlay").hidden = false; $("drawer").hidden = false; document.body.classList.add("lock"); $("closeCart").focus(); };
const fechar = () => { $("overlay").hidden = true; $("drawer").hidden = true; document.body.classList.remove("lock"); };
["openCart", "barOpen"].forEach((id) => $(id).addEventListener("click", abrir));
$("closeCart").addEventListener("click", fechar);
$("overlay").addEventListener("click", fechar);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("drawer").hidden) fechar(); });

render();

// Animação ao rolar
const io = "IntersectionObserver" in window
  ? new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.08 })
  : null;
document.querySelectorAll(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));

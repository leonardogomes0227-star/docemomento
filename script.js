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
    { nome: "Empada de frango", emoji: "🥟", desc: "Massa leve e delicada, com recheio cremoso de frango bem temperadinho.", variantes: [{ price: 28 }] },
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
const html = PRODUTOS.map((g) => `
  <h3 class="group reveal">${g.titulo}</h3>
  <div class="cards">${g.itens.map((p, pi) => {
    const foto = p.img
      ? `<img class="photo" src="assets/${p.img}.jpg" alt="${p.nome}" width="400" height="400" loading="lazy">`
      : `<div class="photo art" aria-hidden="true"><span>${p.emoji}</span></div>`;
    const unico = p.variantes.length === 1;
    const linhas = p.variantes.map((v, vi) => `
      <div class="variant" data-key="${p.nome}|${v.label || ""}">
        <span class="vlabel">${v.label ? `<span>${v.label}</span>` : ""}<b>${v.price == null ? "consulte" : brl(v.price)}</b></span>
        <div class="qty" role="group" aria-label="Quantidade de ${p.nome} ${v.label || ""}">
          <button type="button" data-d="-1" aria-label="Diminuir">−</button>
          <output>0</output>
          <button type="button" data-d="1" aria-label="Aumentar">+</button>
        </div>
      </div>`).join("");
    return `<article class="card reveal" data-p="${p.nome}">
      ${foto}<h3>${p.nome}</h3><p>${p.desc}</p><div class="variants${unico ? " single" : ""}">${linhas}</div></article>`;
  }).join("")}</div>`).join("");
$("menu").innerHTML = html;

// Pedido
function render() {
  const linhas = Object.values(qtd).filter((l) => l.n > 0);
  const total = linhas.reduce((s, l) => s + (l.price || 0) * l.n, 0);
  const itens = linhas.reduce((s, l) => s + l.n, 0);
  const consultar = linhas.filter((l) => l.price == null);
  const vazio = itens === 0;

  document.body.classList.toggle("has-cart", !vazio);
  $("cart").hidden = vazio;
  $("cartCount").textContent = itens;
  $("cartTotal").textContent = brl(total + TAXA_ENTREGA);
  $("empty").hidden = !vazio;
  $("sum").hidden = vazio;
  $("send").hidden = vazio;
  $("lines").innerHTML = linhas.map((l) =>
    `<li><span>${l.n}x ${l.nome}${l.label ? ` <small>(${l.label})</small>` : ""}</span><b>${l.price == null ? "consultar" : brl(l.price * l.n)}</b></li>`).join("");
  $("sub").textContent = brl(total);
  $("tot").textContent = brl(total + TAXA_ENTREGA);
  $("consulta").hidden = consultar.length === 0;

  document.querySelectorAll(".card[data-p]").forEach((c) =>
    c.classList.toggle("selected", linhas.some((l) => l.nome === c.dataset.p)));

  const obs = $("obs").value.trim();
  const msg = [
    "Oi! Vim pelo site e quero fazer este pedido 🍪", "",
    ...linhas.map((l) => `• ${l.n}x ${l.nome}${l.label ? ` (${l.label})` : ""} — ${l.price == null ? "valor a consultar" : brl(l.price * l.n)}`), "",
    `Subtotal: ${brl(total)}`, `Entrega: ${brl(TAXA_ENTREGA)}`, `Total: ${brl(total + TAXA_ENTREGA)}`,
    ...(consultar.length ? [`(+ itens a consultar: ${[...new Set(consultar.map((l) => l.nome))].join(", ")})`] : []),
    ...(obs ? ["", `Observações: ${obs}`] : []),
  ].join("\n");
  $("send").href = wa(msg);
}

PRODUTOS.flatMap((g) => g.itens).forEach((p) =>
  p.variantes.forEach((v) => (qtd[`${p.nome}|${v.label || ""}`] = { nome: p.nome, label: v.label || "", price: v.price ?? null, n: 0 })));

$("menu").addEventListener("click", (e) => {
  const b = e.target.closest(".qty button");
  if (!b) return;
  const row = b.closest(".variant");
  const l = qtd[row.dataset.key];
  l.n = Math.max(0, l.n + Number(b.dataset.d));
  row.querySelector("output").textContent = l.n;
  render();
});
$("obs").addEventListener("input", render);
render();

// Animação ao rolar
const io = "IntersectionObserver" in window
  ? new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.08 })
  : null;
document.querySelectorAll(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));

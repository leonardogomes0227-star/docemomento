document.documentElement.classList.add("js");
// Número do WhatsApp (DDI + DDD + número, só dígitos)
const WHATSAPP = "5566999610260";
const wa = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

document.querySelectorAll("[data-wa]").forEach((a) => {
  a.href = wa(a.dataset.wa);
  a.target = "_blank";
  a.rel = "noopener";
});

document.getElementById("ano").textContent = new Date().getFullYear();

// Montador de pedido
const cart = document.getElementById("cart");
const qtys = {};

function renderCart() {
  const entries = Object.entries(qtys).filter(([, n]) => n > 0);
  const total = entries.reduce((s, [, n]) => s + n, 0);
  cart.hidden = total === 0;
  document.body.classList.toggle("has-cart", total > 0);
  document.getElementById("cartCount").textContent = total;
  document.getElementById("cartList").textContent = entries.map(([k, n]) => `${n}x ${k}`).join(" · ");
  const lista = entries.map(([k, n]) => `• ${n}x ${k}`).join("\n");
  document.getElementById("cartBtn").href = wa(`Oi! Vim pelo site e quero fazer este pedido 🍪\n\n${lista}\n\nPode me passar os sabores disponíveis e o valor?`);
}

document.querySelectorAll(".card[data-item]").forEach((card) => {
  const name = card.dataset.item;
  const out = card.querySelector("output");
  card.querySelectorAll(".qty button").forEach((b) =>
    b.addEventListener("click", () => {
      qtys[name] = Math.max(0, (qtys[name] || 0) + Number(b.dataset.d));
      out.textContent = qtys[name];
      card.classList.toggle("selected", qtys[name] > 0);
      renderCart();
    })
  );
});

// Animação ao rolar
const io = "IntersectionObserver" in window
  ? new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.12 })
  : null;
document.querySelectorAll(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));

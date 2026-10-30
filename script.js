// Número do WhatsApp (DDI + DDD + número, só dígitos)
const WHATSAPP = "5566999610260";

document.querySelectorAll("[data-wa]").forEach((a) => {
  a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(a.dataset.wa)}`;
  a.target = "_blank";
  a.rel = "noopener";
});

document.getElementById("ano").textContent = new Date().getFullYear();

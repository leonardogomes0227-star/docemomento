(async () => {
  const $ = (id) => document.getElementById(id);
  const { esc, slug } = DM;
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  let A, lista = [], editando = null, imgAtual = "", pedirExcluir = null;

  let tt;
  function toast(msg, erro) {
    const t = $("toast");
    t.textContent = msg; t.classList.toggle("erro", !!erro); t.hidden = false;
    clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), erro ? 6000 : 3000);
  }
  const imgSrc = (p) => (!p.img ? "" : /^(data:|https?:)/.test(p.img) ? p.img : `assets/${p.img}.jpg`);
  const resumo = (p) => {
    const v = (p.variantes || []).filter((x) => x.price != null).map((x) => x.price);
    return v.length ? (Math.min(...v) === Math.max(...v) ? brl(v[0]) : `${brl(Math.min(...v))} a ${brl(Math.max(...v))}`) : "preço a consultar";
  };

  A = await DM.conectar();
  if (!A) { $("semConfig").hidden = false; return; }
  $("demo").hidden = !A.demo;

  A.onAuth((user) => {
    $("login").hidden = !!user; $("painel").hidden = !user; $("sair").hidden = !user || A.demo;
  });
  A.ouvirProdutos((l) => { lista = l; desenhar(); }, (e) => toast("Não foi possível ler os produtos: " + e.message, true));

  // ---- Login
  $("formLogin").addEventListener("submit", async (e) => {
    e.preventDefault(); $("erroLogin").hidden = true;
    try { await A.login($("email").value.trim(), $("senha").value); }
    catch { $("erroLogin").textContent = "E-mail ou senha incorretos."; $("erroLogin").hidden = false; }
  });
  $("sair").addEventListener("click", () => A.sair());

  // ---- Lista
  function desenhar() {
    $("vazio").hidden = lista.length > 0;
    const ord = [...lista].sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999) || a.nome.localeCompare(b.nome));
    $("lista").innerHTML = ord.map((p) => {
      const src = imgSrc(p);
      return `<li data-id="${esc(p.id)}" class="${p.esgotado ? "off" : ""}">
        ${src ? `<img class="thumb" src="${esc(src)}" alt="">` : `<span class="thumb" aria-hidden="true">🍪</span>`}
        <div class="info"><b>${esc(p.nome)}</b><small>${esc(p.categoria || "")} · ${resumo(p)}</small></div>
        <div class="acoes">
          <button type="button" class="ghost ${p.destaque ? "on" : ""}" data-a="destaque" aria-pressed="${!!p.destaque}">⭐ Destaque</button>
          <span class="fim">
            <button type="button" class="ghost" data-a="editar">Editar</button>
            <button type="button" class="ghost perigo ${pedirExcluir === p.id ? "pedir" : ""}" data-a="excluir">${pedirExcluir === p.id ? "Confirmar exclusão" : "Excluir"}</button>
          </span>
        </div></li>`;
    }).join("");
    $("cats").innerHTML = [...new Set([...(window.CATALOGO || []).map((p) => p.categoria), ...lista.map((p) => p.categoria)])]
      .filter(Boolean).map((c) => `<option value="${esc(c)}">`).join("");
  }

  async function gravar(p, ok) {
    try { await A.salvar(p); if (ok) toast(ok); }
    catch (e) { toast("Não foi possível salvar: " + (e.code === "permission-denied" ? "este e-mail não tem permissão." : e.message), true); throw e; }
  }

  $("lista").addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-a]"); if (!b) return;
    const p = lista.find((x) => x.id === b.closest("li").dataset.id); if (!p) return;
    const a = b.dataset.a;
    if (a === "editar") return abrir(p);
    if (a === "excluir") {
      if (pedirExcluir !== p.id) { pedirExcluir = p.id; desenhar(); setTimeout(() => { if (pedirExcluir === p.id) { pedirExcluir = null; desenhar(); } }, 4000); return; }
      pedirExcluir = null;
      try { await A.remover(p.id); toast("Produto excluído."); } catch (err) { toast("Não foi possível excluir: " + err.message, true); }
      return;
    }
    gravar({ ...p, destaque: !p.destaque }, p.destaque ? "Tirado dos destaques." : "Produto em destaque no site!").catch(() => {});
  });

  $("importar").addEventListener("click", async () => {
    try { await A.importar(window.CATALOGO); toast("Cardápio importado! Agora é só editar."); } catch (e) { toast("Não foi possível importar: " + e.message, true); }
  });

  // ---- Formulário
  function linhaOp(label = "", price = "") {
    const d = document.createElement("div"); d.className = "op";
    d.innerHTML = `<input type="text" class="opL" placeholder="Opção (ex.: Massa black)" maxlength="40" aria-label="Nome da opção">
      <input type="text" class="opP" inputmode="decimal" placeholder="Preço" aria-label="Preço">
      <button type="button" aria-label="Remover opção">✕</button>`;
    d.querySelector(".opL").value = label; d.querySelector(".opP").value = price === null || price === "" ? "" : String(price).replace(".", ",");
    d.querySelector("button").addEventListener("click", () => { if ($("ops").children.length > 1) d.remove(); else { d.querySelector(".opL").value = ""; d.querySelector(".opP").value = ""; } });
    $("ops").append(d);
  }
  const modoOpcoes = (m) => { $("opsBox").hidden = !m; $("precoSimples").hidden = m; };
  const numero = (t) => { const r = t.trim().replace(/[^\d,.]/g, "").replace(",", "."); return r === "" || isNaN(Number(r)) ? null : Number(r); };
  function mostrarFoto() {
    const src = imgAtual ? imgSrc({ img: imgAtual }) : "";
    $("fPreview").hidden = !src; if (src) $("fPreview").src = src; $("fSemFoto").hidden = !src;
  }
  function abrir(p) {
    editando = p || null; imgAtual = p?.img || ""; $("erroForm").hidden = true;
    $("dlgTitulo").textContent = p ? "Editar produto" : "Novo produto";
    $("fNome").value = p?.nome || ""; $("fCat").value = p?.categoria || ""; $("fDesc").value = p?.desc || "";
    $("fDestaque").checked = p ? !!p.destaque : true;
    $("fFoto").value = ""; $("ops").innerHTML = "";
    const vs = p?.variantes?.length ? p.variantes : [{ label: "", price: null }];
    const multi = vs.length > 1 || vs.some((v) => v.label);
    vs.forEach((v) => linhaOp(v.label || "", v.price));
    $("fPreco").value = !multi && vs[0].price != null ? String(vs[0].price).replace(".", ",") : "";
    modoOpcoes(multi);
    mostrarFoto(); $("dlg").showModal(); $("fNome").focus();
  }
  $("novo").addEventListener("click", () => abrir(null));
  $("cancelar").addEventListener("click", () => $("dlg").close());
  $("maisOp").addEventListener("click", () => { const pr = $("fPreco").value; $("ops").innerHTML = ""; linhaOp("", pr); modoOpcoes(true); });
  $("addOp").addEventListener("click", () => linhaOp());
  $("addMassa").addEventListener("click", () => {
    const sem = [...$("ops").children].filter((d) => !d.querySelector(".opL").value.trim());
    const preco = sem.map((d) => d.querySelector(".opP").value).find(Boolean) || "";
    sem.forEach((d) => d.remove());
    linhaOp("Massa tradicional", preco); linhaOp("Massa black", preco);
  });
  $("fSemFoto").addEventListener("click", () => { imgAtual = ""; $("fFoto").value = ""; mostrarFoto(); });
  $("fFoto").addEventListener("change", async () => {
    const f = $("fFoto").files[0]; if (!f) return;
    try { imgAtual = await reduzir(f); mostrarFoto(); } catch { $("erroForm").textContent = "Não consegui ler essa foto. Tente outra."; $("erroForm").hidden = false; }
  });

  async function reduzir(file) {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const k = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  }

  $("formProd").addEventListener("submit", async (e) => {
    e.preventDefault(); $("erroForm").hidden = true;
    const variantes = !$("opsBox").hidden
      ? [...$("ops").children].map((d) => ({ label: d.querySelector(".opL").value.trim(), price: numero(d.querySelector(".opP").value) }))
          .filter((v, i, a) => v.label || v.price !== null || a.length === 1)
      : [{ label: "", price: numero($("fPreco").value) }];
    const nomes = variantes.map((v) => v.label);
    if (new Set(nomes).size !== nomes.length) { $("erroForm").textContent = "Duas opções estão com o mesmo nome."; $("erroForm").hidden = false; return; }
    const cat = $("fCat").value.trim();
    let id = editando?.id;
    if (!id) {
      const base = slug($("fNome").value); id = base;
      for (let i = 2; lista.some((x) => x.id === id); i++) id = `${base}-${i}`;
    }
    const mesmaCat = lista.filter((x) => x.categoria === cat);
    const ordem = editando && editando.categoria === cat ? editando.ordem
      : mesmaCat.length ? Math.max(...mesmaCat.map((x) => x.ordem ?? 0)) + 1 : (Math.floor(Math.max(0, ...lista.map((x) => x.ordem ?? 0)) / 100) + 1) * 100;
    const p = { id, nome: $("fNome").value.trim(), categoria: cat, desc: $("fDesc").value.trim(), img: imgAtual,
      variantes, destaque: $("fDestaque").checked, novo: editando?.novo || false, esgotado: editando?.esgotado || false, ativo: true, ordem };
    $("salvar").disabled = true;
    try { await gravar(p, editando ? "Produto atualizado!" : "Produto criado! Já aparece no site."); $("dlg").close(); } catch {} finally { $("salvar").disabled = false; }
  });
})();

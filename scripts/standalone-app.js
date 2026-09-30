/* Model Arena — standalone single-file app (vanilla JS, sem dependências). */
(function () {
  "use strict";
  var D = window.__ARENA__ || { models: [], providers: [], dates: {} };
  var MODELS = D.models || [];
  var BY_ID = {};
  MODELS.forEach(function (m) { BY_ID[m.id] = m; });

  var CATS = [
    { key: "codigo", nome: "Código", sub: "AA coding / Design Arena / LMArena" },
    { key: "texto", nome: "Texto", sub: "AA inteligência / LMArena" },
    { key: "imagem", nome: "Imagem", sub: "AA T2I / Design Arena / LMArena visão" },
    { key: "mat", nome: "Raciocínio matemático", sub: "AA math / LMArena" },
    { key: "vel", nome: "Velocidade", sub: "AA tok/s mediana" }
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function fmtPrice(p) {
    if (p == null || !isFinite(p)) return "—";
    if (p === 0) return "$0";
    if (p < 0.01) return "$" + p.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
    if (p < 1) return "$" + p.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
    return "$" + (Math.round(p * 100) / 100);
  }
  function fmtCtx(c) {
    if (c == null || !isFinite(c)) return "—";
    if (c >= 1000000) return (Math.round(c / 100000) / 10) + "M";
    if (c >= 1000) return Math.round(c / 1000) + "K";
    return String(c);
  }
  function logo(m, size) {
    size = size || 36;
    var st = "width:" + size + "px;height:" + size + "px;font-size:" + Math.round(size * 0.42) + "px";
    if (m.lg) {
      return '<span class="logo logo-tilt" style="' + st + '" title="' + esc(m.em) + '"><img src="' + esc(m.lg) + '" alt="" loading="lazy" onerror="this.remove()"><span class="sheen-i"></span></span>';
    }
    var ini = (m.em || "?").trim().charAt(0).toUpperCase() || "?";
    return '<span class="logo" style="' + st + ';background:' + esc(m.co || "#71717A") + '22;color:' + esc(m.co || "#71717A") + '" title="' + esc(m.em) + '">' + esc(ini) + '</span>';
  }
  function catOf(m, k) { return (m.cats && m.cats[k]) || { n: null, t: "—", o: null, v: null }; }
  function headline(m) {
    if (m.intel != null && isFinite(m.intel)) return { rotulo: "AA Inteligência", valor: String(m.intel) };
    if (m.eloT != null && isFinite(m.eloT)) return { rotulo: "Elo LMArena", valor: String(Math.round(m.eloT)) };
    return { rotulo: "Sem métricas públicas", valor: "—" };
  }
  function winner(a, b, k) {
    var ea = catOf(a, k), eb = catOf(b, k);
    if (ea.n == null || eb.n == null || !isFinite(ea.n) || !isFinite(eb.n)) return null;
    if (!ea.o || ea.o !== eb.o) return null;
    if (k === "imagem" && (ea.v || null) !== (eb.v || null)) return null;
    if (ea.n > eb.n) return "A";
    if (eb.n > ea.n) return "B";
    return "empate";
  }
  function placar(a, b) {
    var va = 0, vb = 0, e = 0, s = 0, i;
    for (i = 0; i < CATS.length; i++) {
      var w = winner(a, b, CATS[i].key);
      if (w === "A") va++; else if (w === "B") vb++; else if (w === "empate") e++; else s++;
    }
    var av = va + vb + e;
    return { va: va, vb: vb, e: e, s: s, av: av, vencedor: va > vb ? a : vb > va ? b : null, semDados: av === 0 };
  }

  /* ---------- estado ---------- */
  var LS = "model-arena-duelo-v1";
  function defaults() {
    var a = BY_ID["anthropic/claude-opus-5"] ? "anthropic/claude-opus-5" : null;
    var b = BY_ID["openai/gpt-5.5"] ? "openai/gpt-5.5" : null;
    if (!a || !b) {
      var ranked = MODELS.slice().sort(function (x, y) { return x.rank - y.rank; });
      a = a || (ranked[0] && ranked[0].id);
      b = b || (ranked[1] && ranked[1].id);
    }
    return { a: a, b: b };
  }
  var state = { a: null, b: null, tab: "benchmark", q: "", prov: "", shown: 24 };
  try {
    var saved = JSON.parse(localStorage.getItem(LS) || "null");
    if (saved && BY_ID[saved.a] && BY_ID[saved.b]) state.a = saved.a, state.b = saved.b;
  } catch (e) {}
  if (!state.a || !state.b) { var d = defaults(); state.a = d.a; state.b = d.b; }
  function persist() { try { localStorage.setItem(LS, JSON.stringify({ a: state.a, b: state.b })); } catch (e) {} }
  function A() { return BY_ID[state.a]; }
  function B() { return BY_ID[state.b]; }

  /* ---------- hero ---------- */
  function letters(el, txt, base, cls) {
    var h = "";
    for (var i = 0; i < txt.length; i++) {
      h += '<span class="' + cls + '" style="animation-delay:' + (base + i * 0.07).toFixed(2) + 's">' + esc(txt[i]) + "</span>";
    }
    el.innerHTML = h;
  }
  function renderHero() {
    letters($("wModel"), "MODEL", 0.05, "letter");
    letters($("wArena"), "ARENA", 0.4, "letter-brand");
    var provs = {};
    MODELS.forEach(function (m) { provs[m.pv] = 1; });
    var comAA = MODELS.filter(function (m) { return m.intel != null; }).length;
    $("badgeCount").textContent = MODELS.length + " modelos · " + Object.keys(provs).length + " fornecedores";
    $("pillDate").textContent = "AA " + (D.dates.aa || "—") + " · LMArena " + (D.dates.arena || "—");
    $("heroMeta").textContent = "Snapshot OpenRouter " + (D.dates.snapshot || "—") + " · " + comAA + " modelos com índice AA";
    var hs = [
      { b: String(MODELS.length), s: "modelos no catálogo" },
      { b: String(comAA), s: "com índice AA" },
      { b: String(Object.keys(provs).length), s: "fornecedores" },
      { b: D.dates.arena || "—", s: "edição LMArena" }
    ];
    $("heroStats").innerHTML = hs.map(function (h) {
      return '<div class="stat count-in"><b>' + esc(h.b) + "</b><span>" + esc(h.s) + "</span></div>";
    }).join("");
    $("dataLine").textContent = "OpenRouter " + (D.dates.snapshot || "—") + " · LMArena edição " + (D.dates.arena || "—") + " · AA " + (D.dates.aa || "—") + " · " + MODELS.length + " modelos base (sem lotes/aliases).";
    $("footMeta").textContent = "Model Arena — arquivo único · OpenRouter " + (D.dates.snapshot || "") + " · LMArena " + (D.dates.arena || "") + " · AA " + (D.dates.aa || "");
    // ticker top 10
    var top = MODELS.slice().sort(function (x, y) { return x.rank - y.rank; }).slice(0, 10);
    var tick = top.map(function (m, i) {
      return '<span class="tick"><b class="rank' + (i < 3 ? " top" : "") + '">' + (i + 1) + "</b><span class=\"nm\">" + esc(m.nc) + "</span><span>" + esc(m.intel != null ? m.intel : "—") + "</span><span class=\"sep\">◆</span></span>";
    }).join("");
    $("ticker").innerHTML = tick + tick;
    // duelo destaque #1 x #2
    if (top[0] && top[1]) {
      var p = placar(top[0], top[1]);
      $("dueloDestaque").innerHTML =
        '<div class="sec-head"><h2>Duelo em destaque</h2><span class="sec-note">#1 × #2 do ranking</span></div>' +
        '<div style="display:flex;align-items:center;gap:.75rem;margin-top:.75rem">' + logo(top[0], 40) +
        '<div style="min-width:0;flex:1"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(top[0].nc) + '</b><span style="font-size:12px;color:#78716c">' + esc(top[0].intel) + " · AA</span></div>" +
        '<span class="vs-col" style="padding:0"><span class="duel-medal"><button class="vs-btn" id="ddGo" type="button">VS</button></span></span>' +
        '<div style="min-width:0;flex:1;text-align:right"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(top[1].nc) + '</b><span style="font-size:12px;color:#78716c">' + esc(top[1].intel) + " · AA</span></div>" + logo(top[1], 40) + "</div>" +
        '<p style="font-size:12px;color:#78716c;margin:.75rem 0 0">' + (p.semDados ? "Sem confronto direto possível entre os dois." : "Placar " + p.va + "×" + p.vb + (p.e ? " (" + p.e + " empates)" : "") + " em " + p.av + " quesitos avaliados.") + '</p>';
      $("ddGo").onclick = function () { state.a = top[0].id; state.b = top[1].id; persist(); renderAll(); document.getElementById("duelo").scrollIntoView({ behavior: "smooth" }); };
    }
  }

  /* ---------- duelo ---------- */
  function selCard(slot) {
    var m = slot === "A" ? A() : B();
    var accent = slot === "A" ? "#0284c7" : "#7c3aed";
    if (!m) {
      return '<button class="sel-card empty" data-slot="' + slot + '" type="button"><span class="sel-plus">+</span><span>Escolher modelo ' + slot + "</span></button>";
    }
    var h = headline(m);
    return '<button class="sel-card card-enter" data-slot="' + slot + '" type="button">' +
      '<span class="topline" style="background:linear-gradient(90deg,' + accent + ",transparent)\"></span>" +
      logo(m, 44) +
      '<span style="min-width:0;flex:1"><span class="sel-side" style="color:' + accent + '">Modelo ' + slot + "</span>" +
      '<span class="sel-name">' + esc(m.nc) + "</span>" +
      '<span class="sel-sub">' + esc(m.em) + " · " + esc(h.rotulo) + " " + esc(h.valor) + "</span></span>" +
      '<span class="ghost-letter" aria-hidden="true">' + slot + "</span></button>";
  }
  function renderDuel() {
    $("duelGrid").innerHTML = selCard("A") +
      '<div class="vs-col"><span class="duel-medal"><button class="vs-btn vs-pulse" id="btnVs" type="button" title="Sortear duelo">VS</button></span><div class="mini-row"><button class="mini-btn" id="btnR1" type="button">🎲 A</button><button class="mini-btn" id="btnR2" type="button">🎲 B</button></div></div>' +
      selCard("B");
    var btns = document.querySelectorAll("#duelGrid .sel-card");
    btns.forEach(function (el) { el.onclick = function () { openPicker(el.getAttribute("data-slot")); }; });
    $("btnVs").onclick = randomDuel;
    $("btnRandom").onclick = randomDuel;
    $("btnSwap").onclick = function () { var t = state.a; state.a = state.b; state.b = t; persist(); renderAll(); };
    $("btnR1").onclick = function () { state.a = pickRandom(state.b); persist(); renderAll(); };
    $("btnR2").onclick = function () { state.b = pickRandom(state.a); persist(); renderAll(); };
    // atalhos por categoria
    var cats = [
      { t: "Código", d: "Melhor AA coding do catálogo", k: "coding" },
      { t: "Texto", d: "Maior AA inteligência", k: "intel" },
      { t: "Custo", d: "Menor preço de entrada", k: "preco" },
      { t: "Contexto", d: "Maior janela de contexto", k: "ctx" }
    ];
    $("shortcuts").innerHTML = cats.map(function (c, i) {
      var pair = shortcutPair(c.k);
      return '<button class="card card-hover shortcut" data-k="' + c.k + '" type="button"><span class="logos">' + logo(pair[0], 26) + logo(pair[1], 26) + "</span><h3>" + esc(c.t) + ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></h3><p>' + esc(c.d) + ": " + esc(pair[0].nc) + " × " + esc(pair[1].nc) + '</p><span class="foot"><span>' + esc(pair[0].nc) + " × " + esc(pair[1].nc) + "</span><span>→</span></span></button>";
    }).join("");
    document.querySelectorAll("#shortcuts .shortcut").forEach(function (el) {
      el.onclick = function () { var p = shortcutPair(el.getAttribute("data-k")); state.a = p[0].id; state.b = p[1].id; persist(); renderAll(); document.getElementById("veredito").scrollIntoView({ behavior: "smooth" }); };
    });
  }
  function shortcutPair(k) {
    var l = MODELS.slice();
    if (k === "coding") l.sort(function (a, b) { return (b.cats.codigo.n == null ? -1 : b.cats.codigo.n) - (a.cats.codigo.n == null ? -1 : a.cats.codigo.n); });
    else if (k === "intel") l.sort(function (a, b) { return (b.intel == null ? -1 : b.intel) - (a.intel == null ? -1 : a.intel); });
    else if (k === "preco") l.sort(function (a, b) { return a.pe - b.pe; });
    else l.sort(function (a, b) { return b.ct - a.ct; });
    return [l[0], l[1]];
  }
  function pickRandom(exceptId) {
    var pool = MODELS.filter(function (m) { return m.id !== exceptId; });
    return pool[Math.floor(Math.random() * pool.length)].id;
  }
  function randomDuel() {
    for (var t = 0; t < 40; t++) {
      var i = Math.floor(Math.random() * MODELS.length), j = Math.floor(Math.random() * MODELS.length);
      if (i === j) continue;
      if (placar(MODELS[i], MODELS[j]).av > 0) {
        state.a = MODELS[i].id; state.b = MODELS[j].id; persist(); renderAll(); return;
      }
    }
    state.a = pickRandom(state.b); persist(); renderAll();
  }

  /* ---------- veredito ---------- */
  function renderVerdict() {
    var a = A(), b = B(), w = $("verdictWrap");
    if (!a || !b) {
      w.innerHTML = '<div class="card"><div class="empty-duel"><div class="ring">⚔️</div><h3>Escolha dois modelos</h3><p>Selecione A e B acima para ver o veredito.</p></div></div>';
      return;
    }
    var p = placar(a, b);
    var ha = headline(a), hb = headline(b);
    function team(m, h, side, col) {
      var frac = m.intel != null ? Math.min(1, m.intel / 100) : 0;
      return '<div class="team' + (side === "B" ? " rev" : "") + '">' + logo(m, 52) +
        '<div class="info"><span class="side" style="color:' + col + '">Modelo ' + side + " · #" + m.rank + "</span><h3>" + esc(m.nc) + "</h3>" +
        '<div class="bar"><i style="width:' + Math.round(frac * 100) + "%;background:linear-gradient(90deg," + col + "," + col + '99)"></i></div>' +
        '<div style="font-size:11px;color:#a1a1aa;margin-top:.25rem">' + esc(h.rotulo) + " " + esc(h.valor) + "</div></div></div>";
    }
    var pctA = p.av === 0 ? 50 : Math.round((p.va + p.e / 2) / p.av * 100);
    var line = p.semDados
      ? '<span class="dim">0×0 — nenhum quesito pôde ser comparado (origens diferentes ou sem dados).</span>'
      : p.vencedor
        ? "<strong>" + esc(p.vencedor.nc) + "</strong> vence por <strong>" + Math.max(p.va, p.vb) + "×" + Math.min(p.va, p.vb) + "</strong>" + (p.e ? ' <span class="dim">(' + p.e + " empate" + (p.e > 1 ? "s" : "") + ")</span>" : "") + ' <span class="dim">em ' + p.av + " quesitos avaliados</span>"
        : "<strong>Empate " + p.va + "×" + p.vb + "</strong>" + (p.e ? ' <span class="dim">(' + p.e + " empates)</span>" : "") + ' <span class="dim">em ' + p.av + " quesitos</span>";
    w.innerHTML = '<div class="verdict-band veredito-glow"><div class="verdict-grid">' + team(a, ha, "A", "#38bdf8") +
      '<div class="vs-center"><span class="score-digit">' + p.va + '<span style="color:#71717a">×</span>' + p.vb + '</span><span class="lbl">Placar</span><span class="score-ring" style="--p:' + pctA + '"><span>' + pctA + '%</span></span></div>' +
      team(b, hb, "B", "#a78bfa") + '</div><div class="verdict-line">' + line + '</div>' +
      '<div class="verdict-foot"><div class="score-track" style="--pct-a:' + pctA + '%"></div><div class="chips">' +
      CATS.map(function (c) {
        var x = winner(a, b, c.key);
        var lbl = x === "A" ? "A" : x === "B" ? "B" : x === "empate" ? "=" : "·";
        return '<span class="chip" title="' + esc(c.nome) + '">' + esc(c.nome) + " " + lbl + "</span>";
      }).join("") +
      (p.s ? '<span class="note">' + p.s + " sem confronto</span>" : "") + "</div></div></div>";
  }

  /* ---------- fichas ---------- */
  function tags(m) {
    var t = [];
    var ins = m.md && m.md.entrada ? m.md.entrada : [];
    if (ins.indexOf("image") >= 0) t.push(["Visão", "teal"]);
    if (m.md && m.md.saida && m.md.saida.indexOf("image") >= 0) t.push(["Gera imagem", "sky"]);
    if (m.ft) t.push(["Ferramentas", "rose"]);
    if (m.es) t.push(["Saída estruturada", "amber"]);
    if (m.ra) t.push(["Raciocínio", "lime"]);
    return t.map(function (x) { return '<span class="tag ' + x[1] + '">' + esc(x[0]) + "</span>"; }).join("");
  }
  function renderDossiers() {
    var a = A(), b = B();
    if (!a || !b) { $("dossiers").innerHTML = ""; return; }
    function card(m, slot, col) {
      var h = headline(m);
      var aa = m.intel != null ? '<p class="aa-line">AA Inteligência <b>' + esc(m.intel) + "</b>" + (m.cats.codigo.n != null ? " · Coding <b>" + esc(m.cats.codigo.n) + "</b>" : "") + (m.cats.vel.n != null ? " · <b>" + esc(m.cats.vel.t) + "</b>" : "") + "</p>" : "";
      return '<article class="card card-hover dossier' + (slot === "A" ? " winner-ring" : "") + '"><span class="topline" style="background:linear-gradient(90deg,' + col + ',transparent)"></span>' +
        '<div class="head">' + logo(m, 44) + '<div style="min-width:0;flex:1"><span class="side" style="color:' + col + '">Modelo ' + slot + " · #" + m.rank + '</span><h3>' + esc(m.nc) + '</h3><div class="id">' + esc(m.id) + '</div></div>' +
        '<div class="headline-chip"><b>' + esc(h.valor) + "</b><span>" + esc(h.rotulo) + "</span></div></div>" +
        '<div class="tagrow">' + tags(m) + "</div>" + aa +
        '<p class="desc">' + esc(m.ds || "Sem descrição pública.") + "</p>" +
        '<dl class="info-grid"><div class="info-box"><dt>Preço entrada</dt><dd>' + esc(fmtPrice(m.pe)) + ' <span class="sub">/1M</span></dd></div>' +
        '<div class="info-box"><dt>Preço saída</dt><dd>' + esc(fmtPrice(m.ps)) + ' <span class="sub">/1M</span></dd></div>' +
        '<div class="info-box"><dt>Contexto</dt><dd>' + esc(fmtCtx(m.ct)) + ' <span class="sub">tokens</span></dd></div></dl>' +
        '<div class="feat-row"><span class="modchip">' + esc(m.em) + "</span>" +
        (m.cats.vel.n != null ? '<span class="feat">⚡ ' + esc(m.cats.vel.t) + "</span>" : "") +
        (m.cats.imagem.n != null ? '<span class="feat">🖼 ' + esc(m.cats.imagem.t) + " " + esc(m.cats.imagem.o || "") + "</span>" : "") + "</div></article>";
    }
    $("dossiers").innerHTML = card(a, "A", "#0284c7") + card(b, "B", "#7c3aed");
  }

  /* ---------- tabela ---------- */
  function renderTable() {
    var a = A(), b = B();
    var t = $("cmpTable");
    if (!a || !b) { t.innerHTML = ""; $("tableFoot").textContent = ""; $("perfPanel").innerHTML = ""; return; }
    var rows = CATS.map(function (c, i) {
      var ea = catOf(a, c.key), eb = catOf(b, c.key);
      var x = winner(a, b, c.key);
      function cell(e, win) {
        if (e.n == null) return '<span class="nodata" title="Sem dado público">—</span>';
        return '<span class="cell' + (win ? " win" : "") + '">' + esc(e.t) + (win ? ' <span class="ck">✓</span>' : "") + "</span>";
      }
      return '<tr class="row-enter" style="animation-delay:' + (i * 60) + 'ms"><td><span class="metric-cell"><span class="metric-ic' + (x ? " win" : "") + '">◈</span><span><span class="metric-name">' + esc(c.nome) + '</span><span class="metric-sub">' + esc(c.sub) + "</span></span></span></td>" +
        "<td>" + cell(ea, x === "A") + "</td><td>" + cell(eb, x === "B") + "</td>" +
        '<td>' + (x === "A" ? '<span class="adv">A vence</span>' : x === "B" ? '<span class="adv">B vence</span>' : x === "empate" ? '<span class="adv muted">Empate</span>' : '<span class="adv muted">—</span>') + "</td></tr>";
    }).join("");
    function moneyRow(nome, sub, fa, fb, cheaperWins) {
      var x = null;
      if (isFinite(fa) && isFinite(fb)) x = fa < fb ? "A" : fb < fa ? "B" : "empate";
      function c(v, win) { return '<span class="cell' + (win ? " win" : "") + '">' + esc(fmtPrice(v)) + "/M</span>"; }
      return '<tr><td><span class="metric-cell"><span class="metric-ic">$</span><span><span class="metric-name">' + nome + '</span><span class="metric-sub">' + sub + "</span></span></span></td><td>" + c(fa, x === "A") + "</td><td>" + c(fb, x === "B") + "</td><td>" + (x === "A" ? '<span class="adv">A vence</span>' : x === "B" ? '<span class="adv">B vence</span>' : '<span class="adv muted">—</span>') + "</td></tr>";
    }
    var advA = 0, advB = 0;
    if (a.pe < b.pe) advA++; else if (b.pe < a.pe) advB++;
    if (a.ct > b.ct) advA++; else if (b.ct > a.ct) advB++;
    t.innerHTML = '<thead><tr><th scope="col">Quesito</th><th scope="col">' + esc(a.nc) + "</th><th scope=\"col\">" + esc(b.nc) + '</th><th scope="col">Vantagem</th></tr></thead><tbody>' +
      '<tr class="sector"><td colspan="4">Benchmarks (valem placar)</td></tr>' + rows +
      '<tr class="sector"><td colspan="4">Vantagens (fora do placar)</td></tr>' +
      moneyRow("Preço de entrada", "Menor vence · /1M tokens", a.pe, b.pe) +
      moneyRow("Preço de saída", "Menor vence · /1M tokens", a.ps, b.ps) +
      '<tr><td><span class="metric-cell"><span class="metric-ic">▦</span><span><span class="metric-name">Janela de contexto</span><span class="metric-sub">Maior vence</span></span></span></td><td><span class="cell' + (a.ct > b.ct ? " win" : "") + '">' + esc(fmtCtx(a.ct)) + '</span></td><td><span class="cell' + (b.ct > a.ct ? " win" : "") + '">' + esc(fmtCtx(b.ct)) + '</span></td><td>' + (a.ct > b.ct ? '<span class="adv">A vence</span>' : b.ct > a.ct ? '<span class="adv">B vence</span>' : '<span class="adv muted">—</span>') + "</td></tr>" +
      "</tbody>";
    $("tableFoot").textContent = "Vantagens " + advA + "×" + advB + " (preço entrada/saída, contexto). Elo vs índice nunca se comparam.";
    // desempenho: barras AA inteligência + coding + velocidade
    function bar(v, max, col) {
      var f = max > 0 && v != null ? Math.max(4, v / max * 100) : 4;
      return '<div style="height:8px;border-radius:9999px;background:#f5f5f4;overflow:hidden"><i class="bar-fill" style="display:block;height:100%;width:' + f + "%;background:linear-gradient(90deg," + col + "," + col + '99)"></i></div>';
    }
    var mi = Math.max(a.intel || 0, b.intel || 0, 1), mc = Math.max(a.cats.codigo.n || 0, b.cats.codigo.n || 0, 1), mv = Math.max(a.cats.vel.n || 0, b.cats.vel.n || 0, 1);
    $("perfPanel").innerHTML = '<div class="sec-head"><h2>Indicadores de desempenho</h2><span class="sec-note">Barras nativas AA (sem normalização)</span></div>' +
      '<div style="display:grid;gap:1rem;margin-top:1rem;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">' +
      [["AA Inteligência", a.intel, b.intel, mi, "#4f46e5"], ["AA Coding", a.cats.codigo.n, b.cats.codigo.n, mc, "#0284c7"], ["Velocidade tok/s", a.cats.vel.n, b.cats.vel.n, mv, "#059669"]].map(function (r) {
        return '<div><h3 style="margin:0 0 .5rem;font-size:.875rem">' + r[0] + '</h3><div style="font-size:12px;font-weight:700">A · ' + (r[1] == null ? "—" : r[1]) + "</div>" + bar(r[1], r[3], r[4]) + '<div style="font-size:12px;font-weight:700;margin-top:.5rem">B · ' + (r[2] == null ? "—" : r[2]) + "</div>" + bar(r[2], r[3], "#7c3aed") + "</div>";
      }).join("") + "</div>";
  }

  /* ---------- rankings ---------- */
  var TABS = [{ id: "benchmark", rotulo: "Melhor benchmark" }, { id: "preco", rotulo: "Menor preço" }, { id: "contexto", rotulo: "Maior contexto" }];
  function renderRanks() {
    $("rankTabs").innerHTML = TABS.map(function (t) {
      return '<button role="tab" type="button" data-t="' + t.id + '" aria-selected="' + (state.tab === t.id) + '"' + (state.tab === t.id ? ' class="tab-active"' : "") + ">" + t.rotulo + "</button>";
    }).join("");
    document.querySelectorAll("#rankTabs button").forEach(function (el) {
      el.onclick = function () { state.tab = el.getAttribute("data-t"); renderRanks(); };
    });
    var l = MODELS.slice();
    if (state.tab === "benchmark") l.sort(function (a, b) { return a.rank - b.rank; });
    else if (state.tab === "preco") l.sort(function (a, b) { return a.pe - b.pe || a.rank - b.rank; });
    else l.sort(function (a, b) { return b.ct - a.ct || a.rank - b.rank; });
    var top = l.slice(0, 10);
    $("rankCap").textContent = state.tab === "benchmark"
      ? "Top 10 por índice AA de Inteligência (0–100) — igual ao board oficial da Artificial Analysis."
      : state.tab === "preco" ? "Do mais barato para o mais caro (preço de entrada /1M). Menor preço, maior barra." : "Da maior para a menor janela de contexto.";
    var fracs;
    if (state.tab === "preco") {
      var ps = top.map(function (m) { return m.pe; });
      var mx = Math.max.apply(null, ps), mn = Math.min.apply(null, ps);
      fracs = ps.map(function (p) { return mx === mn ? 1 : (mx - p) / (mx - mn); });
    } else if (state.tab === "contexto") {
      fracs = top.map(function (m) { return m.ct / Math.max(1, top[0].ct); });
    } else {
      fracs = top.map(function (m) { return m.intel != null ? Math.min(1, Math.max(0, m.intel / 100)) : 0; });
    }
    $("rankList").innerHTML = top.map(function (m, i) {
      var txt = state.tab === "preco" ? fmtPrice(m.pe) + "/M" : state.tab === "contexto" ? fmtCtx(m.ct) + " tokens" : (m.intel != null ? m.intel + " · AA Inteligência" : "sem dados");
      return '<li class="rank-row' + (i < 3 ? " podium" : "") + '" style="animation-delay:' + (i * 55) + 'ms"><span class="rank-pos">' + (i + 1) + "</span>" + logo(m, 28) +
        '<span style="min-width:0;flex:1"><span class="rank-name">' + esc(m.nc) + '</span><span class="rank-bar"><i style="width:' + Math.max(4, fracs[i] * 100) + "%;background:linear-gradient(90deg," + esc(m.co) + 'cc,' + esc(m.co) + '88)"></i></span></span>' +
        '<span class="rank-val">' + esc(txt) + "</span>" +
        '<span style="display:flex;gap:.25rem;flex-shrink:0"><button class="btn-mini a" data-s="A" data-id="' + esc(m.id) + '" type="button">A</button><button class="btn-mini b" data-s="B" data-id="' + esc(m.id) + '" type="button">B</button></span></li>';
    }).join("");
    document.querySelectorAll("#rankList button").forEach(function (el) {
      el.onclick = function () {
        if (el.getAttribute("data-s") === "A") state.a = el.getAttribute("data-id");
        else state.b = el.getAttribute("data-id");
        persist(); renderAll();
        document.getElementById("duelo").scrollIntoView({ behavior: "smooth" });
      };
    });
  }

  /* ---------- catálogo ---------- */
  function renderCatalog() {
    var provs = D.providers || [];
    var sel = $("prov");
    if (!sel.options.length || sel.options.length <= 1) {
      provs.forEach(function (p) {
        var o = document.createElement("option");
        o.value = p.slug; o.textContent = p.nome + " (" + p.count + ")";
        sel.appendChild(o);
      });
    }
    var q = state.q.trim().toLowerCase();
    var list = MODELS.filter(function (m) {
      if (state.prov && m.pv !== state.prov) return false;
      if (q && (m.nc + " " + m.em + " " + m.id).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    $("catStatus").textContent = list.length + " de " + MODELS.length + " modelos";
    $("catGrid").innerHTML = list.slice(0, state.shown).map(function (m, i) {
      var h = headline(m);
      return '<li class="card card-hover model-card" style="animation-delay:' + Math.min(i, 12) * 40 + 'ms"><div class="top">' + logo(m, 34) +
        '<div style="min-width:0;flex:1"><h3>' + esc(m.nc) + ' <span class="hl" style="background:rgba(79,70,229,.08);color:#4338ca">' + esc(h.valor) + '</span></h3><p class="by">' + esc(m.em) + " · #" + m.rank + "</p></div></div>" +
        '<dl><div><dt>Entrada</dt><dd>' + esc(fmtPrice(m.pe)) + '</dd></div><div><dt>Contexto</dt><dd>' + esc(fmtCtx(m.ct)) + '</dd></div><div><dt>' + esc(h.rotulo) + "</dt><dd>" + esc(h.valor) + '</dd></div></dl>' +
        '<div class="acts"><button class="btn-mini a" data-s="A" data-id="' + esc(m.id) + '" type="button">Usar em A</button><button class="btn-mini b" data-s="B" data-id="' + esc(m.id) + '" type="button">Usar em B</button></div></li>';
    }).join("") || '<li style="grid-column:1/-1;text-align:center;color:#a8a29e;font-size:.875rem">Nenhum modelo encontrado.</li>';
    $("btnMore").style.display = list.length > state.shown ? "" : "none";
    document.querySelectorAll("#catGrid button").forEach(function (el) {
      el.onclick = function () {
        if (el.getAttribute("data-s") === "A") state.a = el.getAttribute("data-id");
        else state.b = el.getAttribute("data-id");
        persist(); renderAll();
        document.getElementById("duelo").scrollIntoView({ behavior: "smooth" });
      };
    });
  }

  /* ---------- modal ---------- */
  var pickSlot = "A", pickQ = "";
  function openPicker(slot) {
    pickSlot = slot; pickQ = "";
    renderModal();
    setTimeout(function () { var i = $("pickQ"); if (i) i.focus(); }, 30);
  }
  function closePicker() { $("modalRoot").innerHTML = ""; document.removeEventListener("keydown", escClose); }
  function escClose(e) { if (e.key === "Escape") closePicker(); }
  function renderModal() {
    var q = pickQ.trim().toLowerCase();
    var list = MODELS.filter(function (m) {
      if (q && (m.nc + " " + m.em + " " + m.id).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).slice(0, 60);
    $("modalRoot").innerHTML = '<div class="modal-back" id="mb"><div class="modal modal-pop" role="dialog" aria-modal="true" aria-label="Escolher modelo ' + pickSlot + '">' +
      '<div class="modal-head"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
      '<input id="pickQ" type="search" placeholder="Pesquisar modelo…" value="' + esc(pickQ) + '" autocomplete="off"><button class="modal-x" id="mx" type="button" aria-label="Fechar">✕</button></div>' +
      '<ul class="modal-list picker-list">' + list.map(function (m) {
        var h = headline(m);
        var dis = (pickSlot === "A" ? state.b : state.a) === m.id ? " disabled" : "";
        return '<li><button class="modal-opt" data-id="' + esc(m.id) + '" type="button"' + dis + ">" + logo(m, 32) +
          '<span class="grow"><span class="t">' + esc(m.nc) + '</span><span class="id">' + esc(m.id) + '</span></span>' +
          '<span class="meta">#' + m.rank + "<br>" + esc(h.valor) + "</span></button></li>";
      }).join("") + "</ul>" +
      '<div class="modal-foot">' + MODELS.length + " modelos · mesma origem/unidade decide o quesito</div></div></div>";
    $("mx").onclick = closePicker;
    $("mb").addEventListener("mousedown", function (e) { if (e.target.id === "mb") closePicker(); });
    document.addEventListener("keydown", escClose);
    $("pickQ").addEventListener("input", function (e) { pickQ = e.target.value; var v = e.target.selectionStart; renderModal(); var n = $("pickQ"); n.focus(); n.setSelectionRange(v, v); });
    document.querySelectorAll(".modal-opt").forEach(function (el) {
      el.onclick = function () {
        if (pickSlot === "A") state.a = el.getAttribute("data-id");
        else state.b = el.getAttribute("data-id");
        persist(); closePicker(); renderAll();
      };
    });
  }

  /* ---------- efeitos ---------- */
  function effects() {
    var sb = $("scrollBar");
    function onS() {
      var h = document.documentElement, mx = h.scrollHeight - h.clientHeight;
      sb.style.transform = "scaleX(" + (mx > 0 ? h.scrollTop / mx : 0) + ")";
    }
    window.addEventListener("scroll", onS, { passive: true }); onS();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("reveal-vis"); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  }

  function renderAll() { renderDuel(); renderVerdict(); renderDossiers(); renderTable(); renderRanks(); renderCatalog(); }

  // wiring toolbar
  $("q").addEventListener("input", function (e) { state.q = e.target.value; state.shown = 24; renderCatalog(); });
  $("prov").addEventListener("change", function (e) { state.prov = e.target.value; state.shown = 24; renderCatalog(); });
  $("btnMore").onclick = function () { state.shown += 24; renderCatalog(); };

  renderHero();
  renderAll();
  effects();
})();

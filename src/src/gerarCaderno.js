// ═══════════════════════════════════════════════════════════════
// GERADOR DE CADERNO OPERACIONAL — padrão 440
// Monta HTML completo a partir dos pratos e fichas já cadastrados
// ═══════════════════════════════════════════════════════════════
export function gerarCadernoHTML({ titulo, clienteNome, pratos, fichas }) {
  const esc = s => (s || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const g = n => `${Math.round((Number(n) || 0))} g`;
  const brl = n => "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = n => ((Number(n) || 0) * 100).toFixed(1).replace(".", ",") + "%";
  const linhas = t => (t || "").split("\n").map(x => x.trim()).filter(Boolean);

  // ── PARTE 1: FICHAS DE EMPRATAMENTO ──
  let parte1 = "";
  pratos.forEach((p, idx) => {
    const num = String(idx + 1).padStart(2, "0");
    const comps = (p.comps || []).map(c => {
      const liq = g(c.qtdGramas);
      const bruta = c.tipo === "ing" && c.fc > 1 ? `${g((c.qtdGramas || 0) * (c.fc || 1))} cru` : liq;
      return `<div class="comp"><div class="comp-nome">${esc(c.nomeRef)}</div>
        <div class="comp-g"><span class="lbl">LÍQUIDA</span><span class="v-liq">${liq}</span></div>
        <div class="comp-g"><span class="lbl">BRUTA</span><span class="v-bruta">${bruta}</span></div></div>`;
    }).join("");
    const mop = linhas(p.modoPreparo).map((passo, i) => `<div class="passo"><div class="passo-n">${i + 1}</div><div class="passo-txt">${esc(passo)}</div></div>`).join("");
    parte1 += `<div class="card-prato">
      <div class="prato-head"><div class="prato-num">${num}</div><div><div class="prato-cat">PRATO PRINCIPAL · ${(p.comps||[]).length} componentes</div><div class="prato-nome">${esc(p.nome)}</div><div class="prato-porcao">1 porção · Venda ${brl(p.precoVenda)}</div></div></div>
      <div class="secao-lbl">— COMPOSIÇÃO & GRAMATURAS</div>
      <div class="comps">${comps}</div>
      ${mop ? `<div class="secao-lbl">— MOP · MODO OPERACIONAL PADRÃO</div><div class="mop">${mop}</div>` : ""}
    </div>`;
  });

  // ── PARTE 2: RECEITAS BASE (fichas usadas nos pratos) ──
  const fichasUsadas = new Set();
  pratos.forEach(p => (p.comps || []).forEach(c => { if (c.tipo === "ficha") fichasUsadas.add(c.nomeRef); }));
  const fichasBase = fichas.filter(f => fichasUsadas.has(f.nome));
  let parte2 = "";
  fichasBase.forEach(f => {
    const itens = (f.itens || []).map(it => `<tr><td>${esc(it.nomeRef)}</td><td class="liq">${it.qtdLiquida ? g((it.qtdLiquida||0)*1000) : "QB"}</td><td class="bruta">${it.qtdBruta ? g((it.qtdBruta||0)*1000) : "QB"}</td></tr>`).join("");
    const preparo = linhas(f.modoPreparo).map((passo, i) => `<div class="passo"><div class="passo-n">${i + 1}</div><div class="passo-txt">${esc(passo)}</div></div>`).join("");
    parte2 += `<div class="receita">
      <div class="receita-head"><div class="receita-nome">${esc(f.nome)}</div><div class="receita-kg">${brl(f._custoPorKg)}/kg</div></div>
      <div class="receita-body">
        <div class="receita-ing"><div class="secao-lbl">— INGREDIENTES</div><table class="tbl-ing"><thead><tr><th>INGREDIENTE</th><th>LÍQUIDA</th><th>BRUTA</th></tr></thead><tbody>${itens}</tbody></table></div>
        ${preparo ? `<div class="receita-mop"><div class="secao-lbl">— MODO DE PREPARO</div>${preparo}</div>` : ""}
      </div>
    </div>`;
  });

  // ── PARTE 3: FICHA TÉCNICA GERENCIAL (CMV) ──
  let parte3 = "";
  pratos.forEach((p, idx) => {
    const num = String(idx + 1).padStart(2, "0");
    const linhasCusto = (p.comps || []).map(c => `<tr><td>${esc(c.nomeRef)}</td><td>${g(c.qtdGramas)}</td><td>${(c.fc||1).toFixed(2)}</td><td>${g((c.qtdGramas||0)*(c.fc||1))}</td><td>${brl(c.custoPorKg)}/kg</td><td class="custo">${brl(c.custo)}</td></tr>`).join("");
    const margemRS = (p.precoVenda || 0) - (p.custoTotal || 0);
    parte3 += `<div class="card-ger">
      <div class="ger-head"><div class="prato-num lima">${num}</div><div><div class="prato-cat">FICHA TÉCNICA GERENCIAL</div><div class="prato-nome">${esc(p.nome)}</div></div></div>
      <div class="ger-kpis">
        <div class="kpi kpi-lima"><div class="kpi-l">CUSTO POR PORÇÃO</div><div class="kpi-v">${brl(p.custoTotal)}</div><div class="kpi-s">incl. margem segurança</div></div>
        <div class="kpi kpi-verde"><div class="kpi-l">PREÇO DE VENDA</div><div class="kpi-v">${brl(p.precoVenda)}</div><div class="kpi-s">cardápio</div></div>
        <div class="kpi kpi-azul"><div class="kpi-l">CMV</div><div class="kpi-v">${pct(p.cmv)}</div><div class="kpi-s">Margem: ${brl(margemRS)} (${pct(p.margem)})</div></div>
      </div>
      <div class="secao-lbl">— COMPOSIÇÃO DE CUSTO</div>
      <table class="tbl-custo"><thead><tr><th>RECEITA / INSUMO</th><th>QTD. LÍQ.</th><th>FC</th><th>QTD. BRUTA</th><th>PREÇO/KG</th><th>CUSTO</th></tr></thead><tbody>${linhasCusto}</tbody>
      <tfoot><tr><td colspan="5">CUSTO TOTAL</td><td class="custo">${brl(p.custoTotal)}</td></tr></tfoot></table>
    </div>`;
  });

  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titulo)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Barlow',sans-serif;color:#1C1D1B;background:#F0EEE8;line-height:1.5}
.wrap{max-width:900px;margin:0 auto;background:#F0EEE8}
.capa{background:#111;color:#fff;padding:64px 48px;text-align:left}
.capa .marca{font-family:'Barlow Condensed',sans-serif;font-size:40px;font-weight:800;color:#8FA715;letter-spacing:.04em}
.capa .sub{font-size:13px;color:#888;letter-spacing:.2em;text-transform:uppercase;margin-top:4px}
.capa .titulo{font-family:'Anton',sans-serif;font-size:44px;margin-top:32px;line-height:1.05;text-transform:uppercase}
.capa .cliente{font-size:16px;color:#8FA715;margin-top:12px;font-weight:600}
.capa .data{font-size:12px;color:#666;margin-top:24px}
.parte{padding:40px 48px}
.parte-head{display:flex;align-items:flex-start;gap:16px;margin-bottom:28px;position:relative}
.parte-bar{width:5px;align-self:stretch;background:#8FA715;border-radius:3px}
.parte-lbl{font-size:12px;letter-spacing:.15em;color:#999;font-weight:700}
.parte-tit{font-family:'Anton',sans-serif;font-size:32px;text-transform:uppercase;line-height:1}
.parte-num{position:absolute;right:0;top:-10px;font-family:'Anton',sans-serif;font-size:80px;color:#E3E1D9;z-index:0}
.card-prato,.card-ger{background:#fff;border-radius:12px;margin-bottom:24px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.05);page-break-inside:avoid}
.prato-head,.ger-head{background:#111;color:#fff;padding:20px 24px;display:flex;align-items:center;gap:18px}
.prato-num{font-family:'Anton',sans-serif;font-size:38px;color:#1A4F71}
.prato-num.lima{color:#8FA715}
.prato-cat{font-size:11px;color:#888;letter-spacing:.12em;text-transform:uppercase}
.prato-nome{font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:800;text-transform:uppercase;line-height:1.1}
.prato-porcao{font-size:12px;color:#999;margin-top:2px}
.secao-lbl{font-size:11px;font-weight:700;letter-spacing:.1em;color:#8FA715;text-transform:uppercase;padding:16px 24px 8px}
.comps{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:0 24px 20px}
.comp{background:#FAF9F5;border-radius:8px;padding:12px 14px;border-left:3px solid #8FA715}
.comp-nome{font-weight:700;font-size:14px;margin-bottom:8px}
.comp-g{display:inline-block;margin-right:16px}
.comp-g .lbl{font-size:9px;color:#999;display:block;letter-spacing:.08em}
.v-liq{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:16px;color:#1A4F71}
.v-bruta{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:16px;color:#1C1D1B}
.mop{padding:0 24px 20px}
.passo{display:flex;gap:14px;padding:10px 0;border-bottom:1px solid #F0EEE8}
.passo-n{font-family:'Anton',sans-serif;font-size:22px;color:#8FA715;min-width:26px}
.passo-txt{font-size:14px;padding-top:2px}
.receita{background:#fff;border-radius:12px;margin-bottom:20px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.05);page-break-inside:avoid}
.receita-head{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;border-bottom:2px solid #8FA715}
.receita-nome{font-family:'Barlow Condensed',sans-serif;font-size:19px;font-weight:800;text-transform:uppercase}
.receita-kg{background:#8FA715;color:#111;font-weight:700;font-size:13px;padding:5px 12px;border-radius:20px}
.receita-body{display:grid;grid-template-columns:1fr 1fr;gap:0}
.receita-ing{border-right:1px solid #F0EEE8}
.receita-mop{padding-bottom:16px}
.tbl-ing{width:100%;border-collapse:collapse;padding:0 24px}
.tbl-ing th{font-size:10px;color:#999;text-align:left;padding:6px 24px;letter-spacing:.06em}
.tbl-ing td{font-size:13px;padding:8px 24px;border-top:1px solid #F5F3EE}
.tbl-ing .liq{color:#1A4F71;font-weight:700}.tbl-ing .bruta{color:#666}
.ger-kpis{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;padding:20px 24px}
.kpi{background:#111;border-radius:10px;padding:14px 16px;border-left:4px solid}
.kpi-lima{border-color:#8FA715}.kpi-verde{border-color:#497A5D}.kpi-azul{border-color:#1A4F71}
.kpi-l{font-size:10px;letter-spacing:.08em}.kpi-lima .kpi-l{color:#8FA715}.kpi-verde .kpi-l{color:#7BA88C}.kpi-azul .kpi-l{color:#6B9BC4}
.kpi-v{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:800;color:#fff;margin-top:2px}
.kpi-lima .kpi-v{color:#8FA715}
.kpi-s{font-size:10px;color:#888;margin-top:2px}
.tbl-custo{width:100%;border-collapse:collapse;margin:0 24px 24px;width:calc(100% - 48px)}
.tbl-custo th{font-size:10px;color:#999;text-align:left;padding:8px 10px;letter-spacing:.05em;border-bottom:2px solid #E3E1D9}
.tbl-custo td{font-size:13px;padding:9px 10px;border-bottom:1px solid #F5F3EE}
.tbl-custo .custo{color:#497A5D;font-weight:700;text-align:right}
.tbl-custo tfoot td{font-weight:700;border-top:2px solid #111;border-bottom:none}
.rodape{text-align:center;padding:32px;font-size:11px;color:#999;border-top:1px solid #E3E1D9}
@media print{body{background:#fff}.parte{page-break-before:always}.capa{page-break-after:always}
  .card-prato,.receita,.card-ger,.prato-head,.ger-head,.kpi,.capa{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
@media(max-width:640px){.comps,.ger-kpis{grid-template-columns:1fr}.receita-body{grid-template-columns:1fr}.receita-ing{border-right:none;border-bottom:1px solid #F0EEE8}}
</style></head><body><div class="wrap">
  <div class="capa"><div class="marca">ZESTE</div><div class="sub">Caderno Operacional</div><div class="titulo">${esc(titulo)}</div>${clienteNome ? `<div class="cliente">${esc(clienteNome)}</div>` : ""}<div class="data">Gerado em ${hoje}</div></div>
  ${parte1 ? `<div class="parte"><div class="parte-head"><div class="parte-bar"></div><div><div class="parte-lbl">PARTE 01</div><div class="parte-tit">Fichas de Empratamento</div></div><div class="parte-num">01</div></div>${parte1}</div>` : ""}
  ${parte2 ? `<div class="parte"><div class="parte-head"><div class="parte-bar"></div><div><div class="parte-lbl">PARTE 02</div><div class="parte-tit">Receitas Base</div></div><div class="parte-num">02</div></div>${parte2}</div>` : ""}
  ${parte3 ? `<div class="parte"><div class="parte-head"><div class="parte-bar"></div><div><div class="parte-lbl">PARTE 03</div><div class="parte-tit">Ficha Técnica Gerencial</div></div><div class="parte-num">03</div></div>${parte3}</div>` : ""}
  <div class="rodape">Documento gerado por Zeste · Inteligência para Negócios Gastronômicos · Gerado em ${hoje}</div>
</div></body></html>`;
}

// ═══════════════════════════════════════════════════════════════
// GERADOR DE FICHAS DE PRAÇA — 1 prato por A4, foto grande
// Para plastificar e colar na parede da cozinha
// ═══════════════════════════════════════════════════════════════
export function gerarFichasPracaHTML({ clienteNome, pratos }) {
  const esc = s => (s || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const g = n => `${Math.round((Number(n) || 0))} g`;
  const linhas = t => (t || "").split("\n").map(x => x.trim()).filter(Boolean);

  const fichas = pratos.map(p => {
    const comps = (p.comps || []).map(c =>
      `<div class="comp"><span class="comp-q">${g(c.qtdGramas)}</span><span class="comp-n">${esc(c.nomeRef)}</span></div>`
    ).join("");
    const mop = linhas(p.modoPreparo).map((passo, i) =>
      `<div class="passo"><span class="passo-n">${i + 1}</span><span class="passo-t">${esc(passo)}</span></div>`
    ).join("");
    const foto = p.foto
      ? `<div class="foto" style="background-image:url('${esc(p.foto)}')"></div>`
      : `<div class="foto sem-foto"><span>SEM FOTO</span><small>adicione o link da foto no cadastro do prato</small></div>`;
    return `<div class="a4">
      <div class="cab"><div class="marca">ZESTE</div><div class="tit">${esc(p.nome)}</div></div>
      ${foto}
      <div class="info">
        <div class="bloco">
          <div class="bloco-lbl">MONTAGEM · GRAMATURAS</div>
          <div class="comps">${comps}</div>
        </div>
        ${mop ? `<div class="bloco"><div class="bloco-lbl">MODO DE EMPRATAR</div><div class="passos">${mop}</div></div>` : ""}
      </div>
      <div class="rodape">${esc(clienteNome || "")} · Zeste · Gerado em ${new Date().toLocaleDateString("pt-BR")}</div>
    </div>`;
  }).join("");

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Fichas de Praça</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@700;800&family=Barlow:wght@600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Barlow',sans-serif;background:#888}
.a4{width:210mm;min-height:297mm;background:#fff;margin:12px auto;padding:14mm;display:flex;flex-direction:column;page-break-after:always}
.cab{display:flex;align-items:baseline;gap:16px;border-bottom:4px solid #8FA715;padding-bottom:10px;margin-bottom:14px}
.marca{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:800;color:#8FA715}
.tit{font-family:'Anton',sans-serif;font-size:40px;text-transform:uppercase;line-height:1;flex:1}
.foto{width:100%;height:120mm;background-size:cover;background-position:center;border-radius:12px;margin-bottom:14px;background-color:#eee}
.sem-foto{display:flex;flex-direction:column;align-items:center;justify-content:center;color:#bbb;border:3px dashed #ddd}
.sem-foto span{font-family:'Anton',sans-serif;font-size:28px}.sem-foto small{font-size:13px;margin-top:6px}
.info{flex:1;display:flex;flex-direction:column;gap:16px}
.bloco-lbl{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;letter-spacing:.1em;color:#fff;background:#111;padding:6px 14px;border-radius:6px;display:inline-block;margin-bottom:10px}
.comps{display:flex;flex-wrap:wrap;gap:10px}
.comp{background:#F0EEE8;border-left:5px solid #8FA715;border-radius:8px;padding:10px 16px;display:flex;align-items:baseline;gap:10px;min-width:calc(50% - 5px)}
.comp-q{font-family:'Anton',sans-serif;font-size:26px;color:#1A4F71}
.comp-n{font-size:19px;font-weight:700}
.passos{display:flex;flex-direction:column;gap:10px}
.passo{display:flex;gap:14px;align-items:flex-start}
.passo-n{font-family:'Anton',sans-serif;font-size:30px;color:#8FA715;min-width:36px}
.passo-t{font-size:21px;font-weight:600;padding-top:4px;line-height:1.3}
.rodape{margin-top:auto;padding-top:12px;border-top:1px solid #ddd;font-size:12px;color:#999;text-align:center}
@media print{body{background:#fff}.a4{margin:0;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .cab,.comp,.bloco-lbl,.foto{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>${fichas}</body></html>`;
}

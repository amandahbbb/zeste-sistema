// ═══════════════════════════════════════════════════════════════
// GERADORES DE CADERNO — padrão 440
// Caderno OPERACIONAL (uso da cozinha) + Caderno GERENCIAL (confidencial)
// Monta HTML completo a partir dos pratos e fichas já cadastrados
// ═══════════════════════════════════════════════════════════════
const _esc = s => (s || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const _g = n => `${Math.round((Number(n) || 0))} g`;
const _brl = n => "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const _pct = n => ((Number(n) || 0) * 100).toFixed(1).replace(".", ",") + "%";
const _linhas = t => (t || "").split("\n").map(x => x.trim()).filter(Boolean);
const _hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

// Passos numerados; linhas iniciadas com "⚠" ou "!" viram alerta (dica) ligado ao passo anterior
function _renderPassos(texto) {
  const ls = _linhas(texto);
  let html = "", n = 0;
  ls.forEach(l => {
    const alerta = l.startsWith("⚠") || l.startsWith("!");
    if (alerta) {
      const txt = l.replace(/^[⚠!]+\s*/, "");
      html += `<div class="passo-alerta">⚠ ${_esc(txt)}</div>`;
    } else {
      n += 1;
      html += `<div class="passo"><div class="passo-n">${n}</div><div class="passo-txt">${_esc(l)}</div></div>`;
    }
  });
  return html;
}

const BASE_CSS = `@import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap');
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
.faixa-rend{display:inline-block;background:#8FA715;color:#14210a;font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:13px;letter-spacing:.03em;padding:6px 14px;border-radius:20px;margin:18px 24px 0}
.conta{display:flex;align-items:stretch;gap:10px;padding:12px 24px 8px}
.conta-box{flex:1;background:#1b1b1b;border-radius:12px;padding:14px 16px}
.conta-box.rende{flex:0 0 96px;text-align:center}
.conta-box.destaque{background:#8FA715}
.conta-l{font-size:9.5px;letter-spacing:.08em;color:#9a9a9a;font-weight:700}
.conta-box.destaque .conta-l{color:#1b3d0e}
.conta-v{font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:800;color:#fff;line-height:1.05;margin-top:3px}
.conta-box.destaque .conta-v{color:#14210a}
.conta-box.rende .conta-v{font-size:34px;color:#8FA715}
.conta-s{font-size:9.5px;color:#7a7a7a;margin-top:3px}
.conta-box.destaque .conta-s{color:#25460f}
.conta-op{display:flex;align-items:center;font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:800;color:#8FA715}
.ger-sec{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:6px 24px 18px}
@media(max-width:640px){.conta{flex-wrap:wrap}.conta-op{width:100%;justify-content:center;font-size:22px}.conta-box.rende{flex:1}.ger-sec{grid-template-columns:1fr}}
.tbl-custo{width:100%;border-collapse:collapse;margin:0 24px 24px;width:calc(100% - 48px)}
.tbl-custo th{font-size:10px;color:#999;text-align:left;padding:8px 10px;letter-spacing:.05em;border-bottom:2px solid #E3E1D9}
.tbl-custo td{font-size:13px;padding:9px 10px;border-bottom:1px solid #F5F3EE}
.tbl-custo .custo{color:#497A5D;font-weight:700;text-align:right}
.tbl-custo tfoot td{font-weight:700;border-top:2px solid #111;border-bottom:none}
.rodape{text-align:center;padding:32px;font-size:11px;color:#999;border-top:1px solid #E3E1D9}
@media print{body{background:#fff}.parte{page-break-before:always}.capa{page-break-after:always}
  .card-prato,.receita,.card-ger,.prato-head,.ger-head,.kpi,.capa{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
@media(max-width:640px){.comps,.ger-kpis{grid-template-columns:1fr}.receita-body{grid-template-columns:1fr}.receita-ing{border-right:none;border-bottom:1px solid #F0EEE8}}
`;

function _shell({ titulo, clienteNome, sub, extraCapa = "", corpo, variante = "" }) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${_esc(titulo)}</title>
<style>${BASE_CSS}
.passo-alerta{background:#FBEDEA;border-left:3px solid #C0392B;color:#8E2F21;font-size:13px;font-weight:600;padding:8px 12px;border-radius:6px;margin:6px 0 6px 40px}
.confid{border:1px solid #C0392B;border-radius:10px;padding:14px 18px;margin-top:32px;background:rgba(192,57,43,.08)}
.confid-t{color:#E74C3C;font-size:12px;font-weight:800;letter-spacing:.15em}
.confid-s{color:#C9C6BD;font-size:12px;margin-top:4px}
.tbl-resumo{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.05)}
.tbl-resumo th{font-size:10px;color:#999;text-align:left;padding:12px 14px;letter-spacing:.06em;border-bottom:2px solid #111}
.tbl-resumo td{font-size:14px;padding:11px 14px;border-bottom:1px solid #F5F3EE}
.tbl-resumo .num{font-family:'Barlow Condensed',sans-serif;font-weight:700}
.nota-ref{font-size:12px;color:#666;margin-top:14px}
/* ── Camada 3: caderno da CONFEITARIA — estilo maior, mastigado ── */
.comp-cru{font-size:11px;color:#B5651D;font-weight:700;margin-top:6px;letter-spacing:.01em}
.wrap.conf .prato-cat{font-size:12.5px}
.wrap.conf .prato-nome{font-size:30px}
.wrap.conf .prato-porcao{font-size:14px}
.wrap.conf .secao-lbl{font-size:13.5px;padding:20px 24px 10px}
.wrap.conf .comps{grid-template-columns:1fr 1fr;gap:16px;padding:0 24px 24px}
.wrap.conf .comp{padding:16px 20px;border-left-width:5px}
.wrap.conf .comp-nome{font-size:18px;margin-bottom:6px}
.wrap.conf .v-liq,.wrap.conf .v-bruta{font-size:26px}
.wrap.conf .comp-g .lbl{font-size:10px}
.wrap.conf .passo{padding:13px 0}
.wrap.conf .passo-n{font-size:28px;min-width:34px}
.wrap.conf .passo-txt{font-size:17px;line-height:1.45}
.wrap.conf .passo-alerta{font-size:15px;padding:11px 15px}
.wrap.conf .receita-nome{font-size:23px}
.wrap.conf .tbl-ing th{font-size:11.5px}
.wrap.conf .tbl-ing td{font-size:16px;padding:11px 24px}
.wrap.conf .parte-tit{font-size:36px}
@media(max-width:640px){
.parte{padding:24px 12px}
.capa{padding:40px 22px}
.capa .titulo{font-size:30px}
.parte-tit{font-size:24px}
.parte-num{font-size:52px}
.prato-head,.ger-head{padding:14px 16px;gap:12px}
.prato-num{font-size:28px}
.prato-nome{font-size:18px}
.secao-lbl{padding:12px 16px 6px}
.comps{padding:0 16px 16px}
.mop{padding:0 16px 16px}
.passo-txt{font-size:13px}
.passo-alerta{margin-left:0}
.ger-kpis{grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 16px}
.kpi{padding:10px;border-left-width:3px}
.kpi-l{font-size:8px}
.kpi-v{font-size:16px}
.kpi-s{font-size:8px}
.tbl-custo{display:block;overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch;margin:0 16px 16px;width:calc(100% - 32px)}
.tbl-custo th,.tbl-custo td{font-size:12px;padding:7px 8px}
.tbl-resumo{display:block;overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch}
.tbl-resumo th,.tbl-resumo td{font-size:12px;padding:8px 10px}
.tbl-ing th,.tbl-ing td{padding:6px 12px}
}
</style></head><body><div class="wrap ${variante}">
  <div class="capa"><div class="marca">ZESTE</div><div class="sub">${_esc(sub)}</div><div class="titulo">${_esc(titulo)}</div>${clienteNome ? `<div class="cliente">${_esc(clienteNome)}</div>` : ""}<div class="data">Gerado em ${_hoje()}</div>${extraCapa}</div>
  ${corpo}
  <div class="rodape">Documento gerado por Zeste · Inteligência para Negócios Gastronômicos · Gerado em ${_hoje()}</div>
</div></body></html>`;
}

// ── CADERNO OPERACIONAL — uso da cozinha (empratamento + receitas base) ──
export function gerarCadernoOperacionalHTML({ titulo, clienteNome, pratos, fichas, praca }) {
  const ehConf = (praca || "").toLowerCase().includes("conf"); // confeitaria: bruta≈líquida → só quantidade (exceto FC real, ex. suco de limão)
  let parte1 = "";
  pratos.forEach((p, idx) => {
    const num = String(idx + 1).padStart(2, "0");
    const comps = (p.comps || []).map(c => {
      const liq = _g(c.qtdGramas);
      const temFC = c.tipo === "ing" && c.fc > 1;
      if (ehConf) {
        const cru = temFC ? `<div class="comp-cru">⚖ comprar ~${_g((c.qtdGramas || 0) * (c.fc || 1))} cru (rende ${liq})</div>` : "";
        return `<div class="comp"><div class="comp-nome">${_esc(c.nomeRef)}</div>
        <div class="comp-g"><span class="lbl">QUANTIDADE</span><span class="v-liq">${liq}</span></div>${cru}</div>`;
      }
      const bruta = temFC ? `${_g((c.qtdGramas || 0) * (c.fc || 1))} cru` : liq;
      return `<div class="comp"><div class="comp-nome">${_esc(c.nomeRef)}</div>
        <div class="comp-g"><span class="lbl">LÍQUIDA</span><span class="v-liq">${liq}</span></div>
        <div class="comp-g"><span class="lbl">BRUTA</span><span class="v-bruta">${bruta}</span></div></div>`;
    }).join("");
    const mop = _renderPassos(p.modoPreparo);
    const catLbl = ehConf ? "PRODUTO" : "PRATO PRINCIPAL";
    const porcaoLbl = (p.modoRend === "inteiro" && Number(p.rendFatias) > 0) ? `Receita inteira · rende ${Number(p.rendFatias)} fatias` : "1 porção";
    parte1 += `<div class="card-prato">
      <div class="prato-head"><div class="prato-num">${num}</div><div><div class="prato-cat">${catLbl} · ${(p.comps||[]).length} componentes</div><div class="prato-nome">${_esc(p.nome)}</div><div class="prato-porcao">${porcaoLbl}</div></div></div>
      <div class="secao-lbl">— COMPOSIÇÃO & GRAMATURAS</div>
      <div class="comps">${comps}</div>
      ${mop ? `<div class="secao-lbl">— MOP · MODO OPERACIONAL PADRÃO</div><div class="mop">${mop}</div>` : ""}
    </div>`;
  });

  const fichasUsadas = new Set();
  pratos.forEach(p => (p.comps || []).forEach(c => { if (c.tipo === "ficha") fichasUsadas.add(c.nomeRef); }));
  const fichasBase = fichas.filter(f => fichasUsadas.has(f.nome));
  let parte2 = "";
  fichasBase.forEach(f => {
    const itens = (f.itens || []).map(it => {
      const liq = it.qtdLiquida ? _g((it.qtdLiquida || 0) * 1000) : "QB";
      const bru = it.qtdBruta ? _g((it.qtdBruta || 0) * 1000) : "QB";
      if (ehConf) {
        const difere = it.qtdBruta && it.qtdLiquida && it.qtdBruta > it.qtdLiquida * 1.02;
        const nota = difere ? ` <span class="comp-cru" style="display:inline">· ⚖ comprar ~${bru} cru</span>` : "";
        return `<tr><td>${_esc(it.nomeRef)}</td><td class="liq">${liq}${nota}</td></tr>`;
      }
      return `<tr><td>${_esc(it.nomeRef)}</td><td class="liq">${liq}</td><td class="bruta">${bru}</td></tr>`;
    }).join("");
    const preparo = _renderPassos(f.modoPreparo);
    parte2 += `<div class="receita">
      <div class="receita-head"><div class="receita-nome">${_esc(f.nome)}</div></div>
      <div class="receita-body">
        <div class="receita-ing"><div class="secao-lbl">— INGREDIENTES</div><table class="tbl-ing"><thead><tr><th>INGREDIENTE</th>${ehConf ? "<th>QUANTIDADE</th>" : "<th>LÍQUIDA</th><th>BRUTA</th>"}</tr></thead><tbody>${itens}</tbody></table></div>
        ${preparo ? `<div class="receita-mop"><div class="secao-lbl">— MODO DE PREPARO</div>${preparo}</div>` : ""}
      </div>
    </div>`;
  });

  const corpo = `
  ${parte1 ? `<div class="parte"><div class="parte-head"><div class="parte-bar"></div><div><div class="parte-lbl">PARTE 01</div><div class="parte-tit">Fichas de Empratamento</div></div><div class="parte-num">01</div></div>${parte1}</div>` : ""}
  ${parte2 ? `<div class="parte"><div class="parte-head"><div class="parte-bar"></div><div><div class="parte-lbl">PARTE 02</div><div class="parte-tit">Receitas Base & Pré-Preparos</div></div><div class="parte-num">02</div></div>${parte2}</div>` : ""}`;

  return _shell({ titulo, clienteNome, sub: "Caderno Operacional · Uso da Cozinha", corpo, variante: ehConf ? "conf" : "" });
}

// ── CADERNO GERENCIAL — confidencial (custos, CMV, comparativo) ──
export function gerarCadernoGerencialHTML({ titulo, clienteNome, pratos }) {
  let parte1 = "";
  pratos.forEach((p, idx) => {
    const num = String(idx + 1).padStart(2, "0");
    const linhasCusto = (p.comps || []).map(c => `<tr><td>${_esc(c.nomeRef)}</td><td>${_g(c.qtdGramas)}</td><td>${(c.fc||1).toFixed(2)}</td><td>${_g((c.qtdGramas||0)*(c.fc||1))}</td><td>${_brl(c.custoPorKg)}/kg</td><td class="custo">${_brl(c.custo)}</td></tr>`).join("");
    const margemRS = (p.precoVenda || 0) - (p.custoTotal || 0);
    // Bloco de rendimento: bolo/torta que rende N fatias → conta à mostra; senão KPIs por porção
    const rende = Number(p.rendFatias) || 0;
    const ehInteiro = (p.modoRend || "porcao") === "inteiro";
    let blocoRend;
    if (ehInteiro && rende > 0) {
      const custoFatia = p.custoTotal / rende;
      const precoFatia = Number(p.precoFatia) || 0;
      const cmvFatia = precoFatia > 0 ? custoFatia / precoFatia : 0;
      blocoRend = `<div class="faixa-rend">1 forma · rende ${rende} fatias · vende por fatia</div>
      <div class="conta">
        <div class="conta-box"><div class="conta-l">CUSTA A FORMA INTEIRA</div><div class="conta-v">${_brl(p.custoTotal)}</div><div class="conta-s">todos os ingredientes juntos</div></div>
        <div class="conta-op">÷</div>
        <div class="conta-box rende"><div class="conta-l">RENDE</div><div class="conta-v">${rende}</div><div class="conta-s">fatias</div></div>
        <div class="conta-op">=</div>
        <div class="conta-box destaque"><div class="conta-l">CADA FATIA CUSTA</div><div class="conta-v">${_brl(custoFatia)}</div><div class="conta-s">é esse o custo que importa</div></div>
      </div>
      <div class="ger-sec">
        <div class="kpi kpi-verde"><div class="kpi-l">PREÇO DA FATIA</div><div class="kpi-v">${precoFatia ? _brl(precoFatia) : "A definir"}</div><div class="kpi-s">${p.precoVenda ? `bolo inteiro: ${_brl(p.precoVenda)}` : "balcão"}</div></div>
        <div class="kpi kpi-azul"><div class="kpi-l">CMV DA FATIA</div><div class="kpi-v">${precoFatia ? _pct(cmvFatia) : "—"}</div><div class="kpi-s">${precoFatia ? `sobra ${_brl(precoFatia - custoFatia)} por fatia` : "aguarda preço da fatia"}</div></div>
      </div>`;
    } else {
      blocoRend = `<div class="ger-kpis">
        <div class="kpi kpi-lima"><div class="kpi-l">CUSTO POR PORÇÃO</div><div class="kpi-v">${_brl(p.custoTotal)}</div><div class="kpi-s">incl. margem segurança</div></div>
        <div class="kpi kpi-verde"><div class="kpi-l">PREÇO DE VENDA</div><div class="kpi-v">${p.precoVenda ? _brl(p.precoVenda) : "A definir"}</div><div class="kpi-s">cardápio</div></div>
        <div class="kpi kpi-azul"><div class="kpi-l">CMV</div><div class="kpi-v">${p.precoVenda ? _pct(p.cmv) : "—"}</div><div class="kpi-s">${p.precoVenda ? `Margem: ${_brl(margemRS)} (${_pct(p.margem)})` : "Aguarda preço de venda"}</div></div>
      </div>`;
    }
    parte1 += `<div class="card-ger">
      <div class="ger-head"><div class="prato-num lima">${num}</div><div><div class="prato-cat">COMPOSIÇÃO DE CUSTOS</div><div class="prato-nome">${_esc(p.nome)}</div></div></div>
      ${blocoRend}
      <div class="secao-lbl">— COMPOSIÇÃO DE CUSTO · PREÇO/KG DA RECEITA PRONTA</div>
      <table class="tbl-custo"><thead><tr><th>RECEITA / INSUMO</th><th>QTD. LÍQ.</th><th>FC</th><th>QTD. BRUTA</th><th>PREÇO/KG</th><th>CUSTO</th></tr></thead><tbody>${linhasCusto}</tbody>
      <tfoot><tr><td colspan="5">CUSTO TOTAL</td><td class="custo">${_brl(p.custoTotal)}</td></tr></tfoot></table>
    </div>`;
  });

  const linhasResumo = pratos.map((p, idx) => {
    const num = String(idx + 1).padStart(2, "0");
    const margemRS = (p.precoVenda || 0) - (p.custoTotal || 0);
    return `<tr><td>${num} — ${_esc(p.nome)}</td><td class="num">${_brl(p.custoTotal)}</td><td class="num">${p.precoVenda ? _brl(p.precoVenda) : "A definir"}</td><td class="num">${p.precoVenda ? _pct(p.cmv) : "—"}</td><td class="num">${p.precoVenda ? _brl(margemRS) : "—"}</td><td class="num">${p.precoVenda ? _pct(p.margem) : "—"}</td></tr>`;
  }).join("");
  const parte2 = `<table class="tbl-resumo"><thead><tr><th>PRATO</th><th>CUSTO</th><th>VENDA</th><th>CMV</th><th>MARGEM R$</th><th>MARGEM %</th></tr></thead><tbody>${linhasResumo}</tbody></table>
  <div class="nota-ref">Referência de CMV: abaixo de 30% = excelente · 30–35% = adequado · acima de 35% = requer atenção.</div>`;

  const extraCapa = `<div class="confid"><div class="confid-t">⚠ DOCUMENTO CONFIDENCIAL</div><div class="confid-s">Este caderno contém informações financeiras e estratégicas do negócio. Destinado exclusivamente ao proprietário.</div></div>`;

  const corpo = `
  <div class="parte"><div class="parte-head"><div class="parte-bar"></div><div><div class="parte-lbl">PARTE 01</div><div class="parte-tit">Fichas de Custo</div></div><div class="parte-num">01</div></div>${parte1}</div>
  <div class="parte"><div class="parte-head"><div class="parte-bar"></div><div><div class="parte-lbl">PARTE 02</div><div class="parte-tit">Resumo Comparativo de CMV</div></div><div class="parte-num">02</div></div>${parte2}</div>`;

  return _shell({ titulo, clienteNome, sub: "Caderno Gerencial · Uso Exclusivo do Proprietário", extraCapa, corpo });
}

// Compatibilidade: nome antigo aponta para o caderno operacional
export const gerarCadernoHTML = gerarCadernoOperacionalHTML;

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

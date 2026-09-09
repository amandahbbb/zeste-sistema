// ============================================================
// ZESTE LAB — RELATÓRIO MENSAL DE ACOMPANHAMENTO
// Entregável de fechamento do ciclo (POP-08). Gera HTML A4 para
// imprimir / salvar em PDF, no mesmo padrão visual dos cadernos.
// Só leitura: monta o documento a partir da participação do Lab.
// ============================================================

const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const dataBR = d => (d || "").split("-").reverse().join("/");
const nl2br = s => esc(s).replace(/\n/g, "<br>");
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
function periodoTexto(visitas, inicio) {
  const ds = (visitas || []).map(v => v.data).filter(Boolean).sort();
  if (!ds.length) return inicio ? dataBR(inicio) : "";
  if (ds.length === 1) return dataBR(ds[0]);
  return `${dataBR(ds[0])} a ${dataBR(ds[ds.length - 1])}`;
}
function mesExtenso(d) { if (!d) return ""; const [y, m] = d.split("-"); return `${MESES[+m - 1]} de ${y}`; }

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Barlow',sans-serif;background:#888;color:#14130F}
.a4{width:210mm;min-height:297mm;background:#fff;margin:12px auto;padding:15mm 16mm;display:flex;flex-direction:column}
.cab{display:flex;align-items:baseline;gap:14px;border-bottom:4px solid #8FA715;padding-bottom:9px;margin-bottom:16px}
.marca{font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:800;color:#8FA715;letter-spacing:.02em}
.cab-t{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;color:#14130F;letter-spacing:.06em;text-transform:uppercase}
.cab-r{margin-left:auto;padding-left:14px;font-size:11.5px;color:#6B6B5E;white-space:nowrap}
h1{font-family:'Anton',sans-serif;font-size:34px;line-height:1.05;letter-spacing:.01em;margin-bottom:4px}
.sub{font-size:14px;color:#6B6B5E;margin-bottom:18px}
.meta{display:flex;flex-wrap:wrap;gap:18px;background:#F7F6F1;border-radius:10px;padding:12px 16px;margin-bottom:20px}
.meta div{font-size:12.5px}.meta b{display:block;font-size:9.5px;color:#6B6B5E;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}
h2{font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;border-bottom:1.5px solid #14130F;padding-bottom:5px;margin:22px 0 10px}
h2 span{color:#8FA715}
.txt{font-size:13px;line-height:1.55;white-space:pre-line}
.vazio{font-size:12.5px;color:#9a9a90;font-style:italic}
.etapas{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:6px}
.et{font-size:11.5px;border:1.5px solid #E3E1D9;border-radius:16px;padding:3px 11px;color:#6B6B5E}
.et.ok{border-color:#497A5D;color:#497A5D;font-weight:700}
.visita{border:1px solid #E3E1D9;border-radius:9px;padding:12px 14px;margin-bottom:10px;break-inside:avoid;page-break-inside:avoid}
.visita-h{display:flex;align-items:baseline;gap:9px;margin-bottom:7px;flex-wrap:wrap}
.visita-d{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800}
.tag{font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border-radius:10px;padding:2px 8px;border:1px solid #1A4F71;color:#1A4F71}
.tag.reg{border-color:#8FA715;color:#5c7211}
.visita-f{font-size:11.5px;color:#6B6B5E;margin-left:auto}
.bloco{margin-bottom:7px}
.bloco b{display:block;font-size:9.5px;color:#6B6B5E;letter-spacing:.07em;text-transform:uppercase;margin-bottom:2px}
.bloco p{font-size:12.5px;line-height:1.5;white-space:pre-line}
table{width:100%;border-collapse:collapse;margin:6px 0 2px}
th{font-size:9.5px;color:#6B6B5E;text-align:left;padding:6px 8px;letter-spacing:.06em;text-transform:uppercase;border-bottom:1.5px solid #14130F}
td{font-size:12.5px;padding:7px 8px;border-bottom:1px solid #F0EEE8;vertical-align:top}
.ok{color:#497A5D;font-weight:700}.pend{color:#C4502B;font-weight:700}
.metas li{list-style:none;font-size:13px;padding:5px 0 5px 22px;position:relative;border-bottom:1px solid #F5F3EE}
.metas li:before{content:"";position:absolute;left:0;top:11px;width:9px;height:9px;border-radius:50%}
.metas li.sim:before{background:#497A5D}.metas li.nao:before{background:#D9D5C8}
.metas .obs{color:#6B6B5E;font-size:11.5px}
.rodape{margin-top:auto;padding-top:16px;border-top:1px solid #E3E1D9;display:flex;justify-content:space-between;align-items:flex-end;font-size:11px;color:#6B6B5E}
.assin{font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;color:#14130F}
@page{size:A4;margin:0}
@media print{
  body{background:#fff}
  .a4{margin:0;width:auto;min-height:auto;padding:14mm 15mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  h2{break-after:avoid;page-break-after:avoid}
  .visita{break-inside:avoid;page-break-inside:avoid}
  tr{break-inside:avoid}
  thead{display:table-header-group}
}`;

export function gerarRelatorioLabHTML({ participacao, ciclo, clienteNome }) {
  const p = participacao || {}, c = ciclo || {};
  const visitas = [...(c.visitas || [])].sort((a, b) => (a.data || "").localeCompare(b.data || ""));
  const acoes = visitas.flatMap(v => (v.acoes || []).map(a => ({ ...a, visita: v.data })));
  const feitas = acoes.filter(a => a.feito), abertas = acoes.filter(a => !a.feito);
  const etapas = c.etapas || [], metas = c.metas || [];
  const modulos = (p.modulos || []).length;
  const hoje = new Date().toISOString().slice(0, 10);

  const secVisitas = visitas.length ? visitas.map(v => `
    <div class="visita">
      <div class="visita-h">
        <span class="visita-d">${dataBR(v.data)}</span>
        <span class="tag ${v.tipo === "auditoria" ? "" : "reg"}">${v.tipo === "auditoria" ? "Auditoria POP-10" : "Acompanhamento"}</span>
        ${v.foco ? `<span class="visita-f">${esc(v.foco)}</span>` : ""}
      </div>
      ${v.presentes ? `<div class="bloco"><b>Equipe presente</b><p>${nl2br(v.presentes)}</p></div>` : ""}
      ${v.observado ? `<div class="bloco"><b>O que foi observado</b><p>${nl2br(v.observado)}</p></div>` : ""}
      ${v.desvios ? `<div class="bloco"><b>Desvios em relação ao padrão</b><p>${nl2br(v.desvios)}</p></div>` : ""}
      ${v.corrigido ? `<div class="bloco"><b>Corrigido durante a visita</b><p>${nl2br(v.corrigido)}</p></div>` : ""}
      ${v.pendente ? `<div class="bloco"><b>Pendências</b><p>${nl2br(v.pendente)}</p></div>` : ""}
    </div>`).join("") : `<p class="vazio">Nenhuma visita registrada neste ciclo.</p>`;

  const tabAcoes = acoes.length ? `
    <table>
      <thead><tr><th style="width:46%">Ação</th><th style="width:20%">Responsável</th><th style="width:16%">Prazo</th><th style="width:18%">Situação</th></tr></thead>
      <tbody>${acoes.map(a => `<tr>
        <td>${esc(a.oque) || "—"}</td><td>${esc(a.quem) || "—"}</td><td>${dataBR(a.prazo) || "—"}</td>
        <td class="${a.feito ? "ok" : "pend"}">${a.feito ? "Concluída" : "Em aberto"}</td></tr>`).join("")}</tbody>
    </table>` : `<p class="vazio">Nenhuma ação registrada.</p>`;

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório do Lab — ${esc(clienteNome)}</title><style>${CSS}</style></head><body>
<div class="a4">
  <div class="cab"><span class="marca">ZESTE</span><span class="cab-t">Zeste Lab · Relatório de acompanhamento</span><span class="cab-r">Emitido em ${dataBR(hoje)}</span></div>

  <h1>${esc(c.rotulo || "Ciclo")}</h1>
  <div class="sub">${esc(clienteNome || "")}${c.inicio ? " · início em " + mesExtenso(c.inicio) : ""}</div>

  <div class="meta">
    <div><b>Período acompanhado</b>${periodoTexto(visitas, c.inicio) || "—"}</div>
    <div><b>Visitas realizadas</b>${visitas.length}</div>
    <div><b>Fase atual</b>${esc(c.fase || "—")}</div>
    <div><b>Ações concluídas</b>${feitas.length} de ${acoes.length}</div>
    ${modulos ? `<div><b>Módulos no escopo</b>${modulos} de 6</div>` : ""}
  </div>

  ${etapas.length ? `<h2><span>01</span> Andamento do ciclo</h2>
  <div class="etapas">${etapas.map(e => `<span class="et ${e.feito ? "ok" : ""}">${e.feito ? "✓ " : ""}${esc(e.rotulo)}</span>`).join("")}</div>
  ${etapas.filter(e => e.obs).map(e => `<div class="bloco"><b>${esc(e.rotulo)}</b><p>${nl2br(e.obs)}</p></div>`).join("")}` : ""}

  <h2><span>02</span> O que foi acompanhado</h2>
  ${secVisitas}

  <h2><span>03</span> Ações e responsáveis</h2>
  ${tabAcoes}

  ${metas.length ? `<h2><span>04</span> Metas do ciclo</h2>
  <ul class="metas">${metas.map(m => `<li class="${m.ok ? "sim" : "nao"}">${esc(m.rotulo)}${m.obs ? ` <span class="obs">— ${esc(m.obs)}</span>` : ""}</li>`).join("")}</ul>` : ""}

  ${c.relatorio ? `<h2><span>05</span> Leitura do período</h2><div class="txt">${nl2br(c.relatorio)}</div>` : ""}

  ${c.planoAcao ? `<h2><span>06</span> Plano de ação — próximo período</h2><div class="txt">${nl2br(c.planoAcao)}</div>` : ""}

  ${abertas.length ? `<h2><span>07</span> Em aberto para o próximo ciclo</h2>
  <table><thead><tr><th style="width:56%">Ação</th><th style="width:22%">Responsável</th><th style="width:22%">Prazo</th></tr></thead>
  <tbody>${abertas.map(a => `<tr><td>${esc(a.oque) || "—"}</td><td>${esc(a.quem) || "—"}</td><td>${dataBR(a.prazo) || "—"}</td></tr>`).join("")}</tbody></table>` : ""}

  <div class="rodape">
    <div><span class="assin">Zeste Consultoria Gastronômica</span><br>Inteligência aplicada ao negócio gastronômico</div>
    <div>${esc(clienteNome || "")}${p.proximaVisita ? ` · próxima visita ${dataBR(p.proximaVisita)}` : ""}</div>
  </div>
</div>
</body></html>`;
}

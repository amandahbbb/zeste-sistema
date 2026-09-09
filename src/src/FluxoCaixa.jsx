import { useState, useEffect } from "react";
import CMVPainel from "./CMVPainel.jsx";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const C = { preto: "#0E0E0C", branco: "#fff", lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B", cinzaF: "#F0EEE8", cinzaM: "#D9D5C8", cinzaE: "#6B6B5E", border: "#E3E1D9" };

const brl = n => "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct1 = n => (Math.round((Number(n) || 0) * 10) / 10).toLocaleString("pt-BR") + "%";
const num = v => { const n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isNaN(n) ? 0 : n; };
const mesKey = d => (d || "").slice(0, 7);
const mesLabel = mk => { const [y, m] = (mk || "").split("-"); const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]; return `${nomes[+m - 1]}/${y}`; };
const mesHoje = () => new Date().toISOString().slice(0, 7);
const hojeStr = () => new Date().toISOString().slice(0, 10);
const compDe = l => l.competencia || mesKey(l.data);
const ehLanc = l => l && (l.tipo === "entrada" || l.tipo === "saida");

// ── Taxonomia-mãe (Nuts, limpa) ──────────────────────────────────────────────
const NAT = { receita: { rot: "Receita", cor: "#497A5D" }, cmv: { rot: "CMV", cor: "#C4502B" }, cpv: { rot: "Produção (CPV)", cor: "#B8860B" }, operacional: { rot: "Despesa operacional", cor: "#6B6B5E" }, imobilizado: { rot: "Investimento / Imobilizado", cor: "#1A4F71" }, prolabore: { rot: "Pró-labore", cor: "#7a3fa0" } };
const CANAIS = { "PDV / Balcão": [], "iFood": [], "Delivery / Pedido": [], "Eventos": [], "Outras receitas": [] };
const MATRIZES = {
  "Matérias-primas / Supermercado": { natureza: "cmv", subs: ["Açougue", "Hortifruti e verduras", "Laticínios", "Estoque seco", "Peixaria", "Temperos", "Bebidas / Vinhos / Cervejas", "Frios / Congelados", "Embutidos", "Enlatados", "Para revenda"] },
  "Produção e Embalagens": { natureza: "cpv", subs: ["Embalagens", "Rótulo e adesivos", "Gás de cozinha", "Manutenção de máquinas", "Materiais de consumo", "Testes de produtos", "Prejuízo e desperdício", "Aluguel de equipamentos"] },
  "Despesas administrativas": { natureza: "operacional", subs: ["Água e esgoto", "Energia elétrica", "Aluguel sede", "Telefone / Internet", "Contador / Honorários", "Material de limpeza", "Material de expediente", "EPI / Uniformes", "Publicidade e marketing", "Seguro", "Manutenção / Limpeza", "Outras despesas gerais"] },
  "Despesas com funcionários": { natureza: "operacional", subs: ["Salários", "FGTS", "INSS", "13º salário", "Férias", "Comissões", "Vale transporte", "Freelance", "Plano de saúde", "Indenizações", "Premiações"] },
  "Impostos e taxas": { natureza: "operacional", subs: ["DAS - Simples", "ISSQN", "IPTU", "Alvarás e taxas", "Imposto de renda", "Contribuição sindical", "Outros impostos"] },
  "Despesas financeiras": { natureza: "operacional", subs: ["Taxas de cartão", "Taxas do iFood", "Mensalidade máquina de cartão", "Mensalidade bancária", "Outras despesas financeiras"] },
  "Transporte / Entrega": { natureza: "operacional", subs: ["Frete de entrega", "Combustível", "Manutenção de veículos", "Locação de veículos", "Documentação", "Seguro veículo", "Outras de transporte"] },
  "Investimento / Imobilizado": { natureza: "imobilizado", subs: ["Equipamentos e móveis", "Utensílios de cozinha", "Decoração", "Reformas / Sede", "Cursos e treinamentos"] },
  "Pró-labore": { natureza: "prolabore", subs: ["Pró-labore", "Retiradas dos sócios"] },
};
function arvoreProdutosCanais(pratos) { const t = {}; Object.entries(CANAIS).forEach(([c, s]) => t[c] = { natureza: "receita", subs: [...s] }); return t; }
function arvorePadrao() { return { entrada: arvoreProdutosCanais(), saida: JSON.parse(JSON.stringify(MATRIZES)) }; }
// compat: config antiga { cat: [subs] } vira { cat: { natureza, subs } }
function normalizarArvore(arvore) {
  const out = { entrada: {}, saida: {} };
  ["entrada", "saida"].forEach(tipo => {
    const src = (arvore && arvore[tipo]) || {};
    Object.entries(src).forEach(([cat, v]) => {
      if (Array.isArray(v)) { const natDefault = tipo === "entrada" ? "receita" : (MATRIZES[cat] ? MATRIZES[cat].natureza : "operacional"); out[tipo][cat] = { natureza: natDefault, subs: [...v] }; }
      else if (v && typeof v === "object") out[tipo][cat] = { natureza: v.natureza || (tipo === "entrada" ? "receita" : "operacional"), subs: [...(v.subs || [])] };
    });
  });
  if (!Object.keys(out.entrada).length) out.entrada = arvoreProdutosCanais();
  if (!Object.keys(out.saida).length) out.saida = JSON.parse(JSON.stringify(MATRIZES));
  return out;
}
const catsDe = (arvore, tipo) => Object.keys(arvore[tipo] || {});
const subsDe = (arvore, tipo, cat) => (arvore[tipo] && arvore[tipo][cat] && arvore[tipo][cat].subs) || [];
const natDe = (arvore, tipo, cat) => (arvore[tipo] && arvore[tipo][cat] && arvore[tipo][cat].natureza) || (tipo === "entrada" ? "receita" : "operacional");

// status pago/vencido/a vencer
function statusLanc(l) { if (l.pago) return "pago"; if (l.previsto && l.previsto < hojeStr()) return "vencido"; return "a vencer"; }

// ── DRE por competência ──────────────────────────────────────────────────────
function calcDRE(ls, arvore, mk) {
  const doMes = ls.filter(l => ehLanc(l) && compDe(l) === mk);
  const somaNat = (tipo, nat) => doMes.filter(l => l.tipo === tipo && natDe(arvore, tipo, l.categoria) === nat).reduce((a, l) => a + num(l.valor), 0);
  const porCanal = {}; doMes.filter(l => l.tipo === "entrada").forEach(l => { const c = l.categoria || "—"; porCanal[c] = (porCanal[c] || 0) + num(l.valor); });
  const faturamento = Object.values(porCanal).reduce((a, b) => a + b, 0);
  const cmv = somaNat("saida", "cmv"), cpv = somaNat("saida", "cpv");
  const mc = faturamento - cmv - cpv;
  // despesas operacionais por matriz
  const opPorMatriz = {}; doMes.filter(l => l.tipo === "saida" && natDe(arvore, "saida", l.categoria) === "operacional").forEach(l => { const c = l.categoria || "—"; opPorMatriz[c] = (opPorMatriz[c] || 0) + num(l.valor); });
  const despOper = Object.values(opPorMatriz).reduce((a, b) => a + b, 0);
  const resultOper = mc - despOper;
  const proLabore = somaNat("saida", "prolabore");
  const resultado = resultOper - proLabore;
  const imobilizado = somaNat("saida", "imobilizado");
  return { faturamento, porCanal, cmv, cpv, mc, mcPct: faturamento ? mc / faturamento * 100 : 0, cmvPct: faturamento ? cmv / faturamento * 100 : 0, opPorMatriz, despOper, resultOper, proLabore, resultado, imobilizado };
}

// ── Import / export CSV ──────────────────────────────────────────────────────
const normH = s => (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
function modeloCSV(arvore) {
  const linhas = ["Data;Competencia;Tipo;Categoria;Subcategoria;Descrição;Valor;Previsto;Pago"];
  const ex = (tipo, n, base) => { let i = 0; for (const cat of catsDe(arvore, tipo)) { if (i >= n) break; const sub = subsDe(arvore, tipo, cat)[0] || ""; linhas.push(`2026-09-0${i + 1};2026-09;${tipo};${cat};${sub};exemplo;${(base * (i + 1)).toFixed(2).replace(".", ",")};;sim`); i++; } };
  ex("entrada", 3, 350); ex("saida", 4, 180);
  return linhas.join("\n");
}
function parseCSVFluxo(texto, arvore) {
  const linhas = (texto || "").replace(/\r/g, "").split("\n").filter(l => l.trim());
  if (!linhas.length) return { rows: [], avisos: ["Arquivo vazio."], novas: [] };
  const delim = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ";" : ",";
  const split = l => { const out = []; let cur = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === delim && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map(s => s.trim().replace(/^"|"$/g, "")); };
  const head = split(linhas[0]).map(normH);
  const idx = (...ns) => { for (const n of ns) { const i = head.indexOf(n); if (i >= 0) return i; } return -1; };
  const iData = idx("data", "date", "dia", "emissao", "vencimento"), iComp = idx("competencia", "competência", "mes competencia", "referencia"), iTipo = idx("tipo", "type", "natureza", "operacao"), iCat = idx("categoria", "matriz", "grupo", "plano de contas", "conta", "classificacao"), iSub = idx("subcategoria", "sub matriz", "sub", "item", "insumo", "produto"), iDesc = idx("descricao", "historico", "obs"), iVal = idx("valor", "value", "amount", "total", "valor pago", "valor total"), iPago = idx("pago", "situacao pagamento", "status");
  if (iData < 0 || iVal < 0) return { rows: [], avisos: ["Não encontrei Data e Valor. Baixe o modelo e ajuste os títulos."], novas: [] };
  const parseData = s => { s = (s || "").trim(); if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10); const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/); if (m) { let [, d, mo, y] = m; if (y.length === 2) y = "20" + y; return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`; } return ""; };
  const parseValor = s => { s = (s || "").toString().replace(/[R$\s]/gi, ""); if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); const n = parseFloat(s); return isNaN(n) ? null : n; };
  const avisos = [], rows = [], novasSet = {};
  for (let i = 1; i < linhas.length; i++) {
    const c = split(linhas[i]); const data = parseData(c[iData]); let valor = parseValor(c[iVal]);
    if (!data || valor === null) { avisos.push(`Linha ${i + 1} ignorada (data/valor).`); continue; }
    const rawTipo = iTipo >= 0 ? normH(c[iTipo]) : "";
    let t = /entrada|receita|credito|venda|recebi/.test(rawTipo) ? "entrada" : /saida|despesa|debito|pagamento|compra|custo|investimento/.test(rawTipo) ? "saida" : (valor < 0 ? "saida" : "entrada");
    valor = Math.abs(valor);
    const categoria = (iCat >= 0 && c[iCat]) ? c[iCat].trim() : (t === "entrada" ? "Outras receitas" : "Outras despesas gerais");
    const subcategoria = (iSub >= 0 && c[iSub]) ? c[iSub].trim() : "";
    const competencia = (iComp >= 0 && c[iComp]) ? mesKey(parseData(c[iComp]) || c[iComp]) : mesKey(data);
    const pago = iPago >= 0 ? /pago|sim|quitad|recebid/.test(normH(c[iPago])) : true;
    const existeCat = arvore && arvore[t] && arvore[t][categoria];
    if (!existeCat) { novasSet[`${t}||${categoria}`] = true; if (subcategoria) novasSet[`${t}||${categoria}||${subcategoria}`] = true; }
    else if (subcategoria && !subsDe(arvore, t, categoria).includes(subcategoria)) novasSet[`${t}||${categoria}||${subcategoria}`] = true;
    rows.push({ data, competencia, tipo: t, categoria, subcategoria, descricao: iDesc >= 0 ? (c[iDesc] || "") : "", valor, pago });
  }
  if (!rows.length && !avisos.length) avisos.push("Nenhuma linha de dados.");
  return { rows, avisos, novas: Object.keys(novasSet) };
}
function toCSVFluxo(ls) {
  const head = "Data;Competencia;Tipo;Categoria;Subcategoria;Descrição;Valor;Pago";
  const body = ls.filter(ehLanc).sort((a, b) => (a.data || "").localeCompare(b.data || "")).map(l => [l.data, compDe(l), l.tipo, l.categoria, l.subcategoria || "", (l.descricao || "").replace(/;/g, ","), String(l.valor).replace(".", ","), l.pago ? "sim" : "não"].join(";"));
  return [head, ...body].join("\n");
}
function baixarArquivo(nome, conteudo) { const blob = new Blob(["\ufeff" + conteudo], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
function aplicarNovas(arvore, novas) {
  const out = { entrada: JSON.parse(JSON.stringify(arvore.entrada || {})), saida: JSON.parse(JSON.stringify(arvore.saida || {})) };
  novas.forEach(k => { const [t, cat, sub] = k.split("||"); if (!out[t][cat]) out[t][cat] = { natureza: t === "entrada" ? "receita" : "operacional", subs: [] }; if (sub && !out[t][cat].subs.includes(sub)) out[t][cat].subs.push(sub); });
  return out;
}

async function carregar(clienteId, token) { try { const r = await fetch(`${SB_URL}/rest/v1/fin_cliente_fluxo?cliente_id=eq.${clienteId}&deleted_at=is.null&select=*&order=created_at.desc`, { headers: sbH(token) }); const d = await r.json(); return Array.isArray(d) ? d.map(x => ({ ...(x.dados || {}), _row: x.id })) : []; } catch { return []; } }
async function upsert(item, clienteId, token) { const r = await fetch(`${SB_URL}/rest/v1/fin_cliente_fluxo`, { method: "POST", headers: { ...sbH(token), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: item.id, cliente_id: clienteId, dados: item, updated_at: new Date().toISOString() }) }); return r.ok; }
async function excluir(id, token) { const r = await fetch(`${SB_URL}/rest/v1/fin_cliente_fluxo?id=eq.${id}`, { method: "PATCH", headers: sbH(token), body: JSON.stringify({ deleted_at: new Date().toISOString() }) }); return r.ok; }

export default function FluxoCaixa({ token, clienteId, clienteNome, podeEditar = true, onBack }) {
  const [ls, setLs] = useState([]);
  const [arvore, setArvore] = useState({ entrada: {}, saida: {} });
  const [cfgId, setCfgId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(mesHoje());
  const [vista, setVista] = useState("lancamentos"); // lancamentos | dre | cmv
  const [addOpen, setAddOpen] = useState(false);
  const [avancado, setAvancado] = useState(false);
  const [gerCat, setGerCat] = useState(false);
  const [imp, setImp] = useState(null);
  const [importando, setImportando] = useState(false);
  const [nv, setNv] = useState({ data: hojeStr(), competencia: mesHoje(), tipo: "entrada", categoria: "", subcategoria: "", descricao: "", valor: "", previsto: "", pago: true });

  useEffect(() => { carregar(clienteId, token).then(rows => { const cfg = rows.find(l => l.tipo === "config"); setCfgId(cfg ? cfg._row : null); setArvore(cfg && cfg.arvore ? normalizarArvore(cfg.arvore) : arvorePadrao()); setLs(rows.filter(ehLanc)); setLoading(false); }); }, [clienteId]);

  const salvarArvore = async (nova) => { setArvore(nova); const id = cfgId || "cfg_" + clienteId; setCfgId(id); await upsert({ id, tipo: "config", arvore: nova }, clienteId, token); };
  const inp = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.cinzaM}`, borderRadius: 8, padding: "8px 10px", fontSize: 14, background: "#fff", fontFamily: "inherit" };
  const lbl = { fontSize: 10, color: C.cinzaE, fontWeight: 700, letterSpacing: ".04em", display: "block", marginBottom: 3 };
  const card = { border: `1px solid ${C.border}`, borderRadius: 10, background: "#fff", padding: 14, marginBottom: 12 };
  const btnSec = { background: "#fff", border: `1.5px solid ${C.cinzaM}`, borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.azul };

  const doMes = ls.filter(l => compDe(l) === mes).sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const meses = (() => { const s = new Set(ls.map(compDe).filter(Boolean)); s.add(mesHoje()); return [...s].sort().reverse(); })();
  const dre = calcDRE(ls, arvore, mes);
  const pendencias = ls.filter(l => compDe(l) === mes && !l.pago);
  const catsTipo = catsDe(arvore, nv.tipo), subsCat = subsDe(arvore, nv.tipo, nv.categoria);

  const salvar = async () => {
    const valor = num(nv.valor); if (valor <= 0 || !nv.categoria) return;
    const item = { id: uid(), data: nv.data, competencia: nv.competencia || mesKey(nv.data), tipo: nv.tipo, categoria: nv.categoria, subcategoria: nv.subcategoria, descricao: nv.descricao, valor, previsto: nv.previsto, pago: !!nv.pago };
    setLs(p => [{ ...item, _row: item.id }, ...p]); setAddOpen(false);
    setNv({ data: hojeStr(), competencia: mesHoje(), tipo: "entrada", categoria: "", subcategoria: "", descricao: "", valor: "", previsto: "", pago: true });
    await upsert(item, clienteId, token);
  };
  const togglePago = async (l) => { const upd = { ...l, pago: !l.pago }; setLs(p => p.map(x => x.id === l.id ? upd : x)); await upsert(upd, clienteId, token); };
  const remover = async (l) => { setLs(p => p.filter(x => x.id !== l.id)); await excluir(l.id, token); };

  const lerArquivo = (file) => { const rd = new FileReader(); rd.onload = () => setImp({ ...parseCSVFluxo(String(rd.result || ""), arvore), nome: file.name }); rd.readAsText(file, "UTF-8"); };
  const confirmarImport = async () => { if (!imp || !imp.rows.length) return; setImportando(true); if (imp.novas && imp.novas.length) await salvarArvore(aplicarNovas(arvore, imp.novas)); const novos = imp.rows.map(r => ({ ...r, id: uid() })); setLs(p => [...novos.map(n => ({ ...n, _row: n.id })), ...p]); for (const n of novos) await upsert(n, clienteId, token); setImportando(false); setImp(null); };

  const addCategoria = (tipo) => { const nome = (window.prompt("Nova categoria:") || "").trim(); if (!nome || arvore[tipo][nome]) return; salvarArvore({ ...arvore, [tipo]: { ...arvore[tipo], [nome]: { natureza: tipo === "entrada" ? "receita" : "operacional", subs: [] } } }); };
  const addSub = (tipo, cat) => { const nome = (window.prompt(`Nova subcategoria em "${cat}":`) || "").trim(); if (!nome || subsDe(arvore, tipo, cat).includes(nome)) return; salvarArvore({ ...arvore, [tipo]: { ...arvore[tipo], [cat]: { ...arvore[tipo][cat], subs: [...arvore[tipo][cat].subs, nome] } } }); };
  const setNatureza = (cat, nat) => salvarArvore({ ...arvore, saida: { ...arvore.saida, [cat]: { ...arvore.saida[cat], natureza: nat } } });
  const renomearCat = (tipo, cat) => { const nome = (window.prompt("Renomear categoria:", cat) || "").trim(); if (!nome || nome === cat) return; const t = { ...arvore[tipo] }; t[nome] = t[cat]; delete t[cat]; salvarArvore({ ...arvore, [tipo]: t }); };
  const removerCat = (tipo, cat) => { const usos = ls.filter(l => l.tipo === tipo && l.categoria === cat).length; if (!window.confirm(`Remover "${cat}"?${usos ? ` ${usos} lançamento(s) usam ela (mantêm o texto, só somem do menu).` : ""}`)) return; const t = { ...arvore[tipo] }; delete t[cat]; salvarArvore({ ...arvore, [tipo]: t }); };
  const removerSub = (tipo, cat, sub) => salvarArvore({ ...arvore, [tipo]: { ...arvore[tipo], [cat]: { ...arvore[tipo][cat], subs: arvore[tipo][cat].subs.filter(s => s !== sub) } } });

  const chipStatus = (st) => { const cor = st === "pago" ? C.verde : st === "vencido" ? C.coral : "#B8860B"; return <span style={{ fontSize: 10, fontWeight: 700, color: cor, border: `1px solid ${cor}`, borderRadius: 10, padding: "1px 7px", whiteSpace: "nowrap" }}>{st}</span>; };

  return (
    <div style={{ fontFamily: "'Barlow',sans-serif", color: C.preto }}>
      <div style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>
        {onBack && <button onClick={onBack} style={{ background: "none", border: "none", color: C.azul, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>‹ Voltar</button>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700 }}>Financeiro{clienteNome ? ` · ${clienteNome}` : ""}</div>
            <div style={{ fontSize: 12.5, color: C.cinzaE }}>Fluxo de caixa e DRE por competência.</div>
          </div>
          <select value={mes} onChange={e => setMes(e.target.value)} style={{ ...inp, width: "auto" }}>{meses.map(mk => <option key={mk} value={mk}>{mesLabel(mk)}</option>)}</select>
        </div>

        {/* toggle de vista */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12, background: C.cinzaF, borderRadius: 10, padding: 4, width: "fit-content" }}>
          {[["lancamentos", "Lançamentos"], ["dre", "DRE / Resultado"], ["cmv", "CMV"]].map(([id, l]) => (
            <button key={id} onClick={() => setVista(id)} style={{ border: "none", borderRadius: 7, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", background: vista === id ? "#fff" : "transparent", color: vista === id ? C.preto : C.cinzaE, boxShadow: vista === id ? "0 1px 3px rgba(0,0,0,.1)" : "none" }}>{l}</button>
          ))}
        </div>

        {loading ? <div style={{ padding: 30, textAlign: "center", color: C.cinzaE }}>Carregando…</div> :
          vista === "cmv" ? (
            <CMVPainel token={token} clienteId={clienteId} mes={mes} cmvCompras={dre.cmv + dre.cpv} faturamentoCaixa={dre.faturamento} podeEditar={podeEditar} />
          ) :
          vista === "dre" ? (
            /* ═══════════ DRE ═══════════ */
            <div style={card}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Resultado de {mesLabel(mes)} <span style={{ fontSize: 11, color: C.cinzaE, fontWeight: 400 }}>(por competência)</span></div>
              {(() => {
                const Lin = ({ rot, val, bold, cor, ind, memo, sub }) => (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: sub ? "3px 0" : "6px 0", paddingLeft: ind ? 16 : 0, borderTop: bold ? `1.5px solid ${C.border}` : "none", fontSize: sub ? 12.5 : 13.5 }}>
                    <span style={{ fontWeight: bold ? 700 : (sub ? 400 : 600), color: memo ? C.cinzaE : (cor || C.preto) }}>{rot}</span>
                    <b style={{ color: cor || (val < 0 ? C.coral : C.preto), fontWeight: bold ? 800 : 600, fontFamily: "'Barlow Condensed',sans-serif", fontSize: sub ? 13 : 15 }}>{brl(val)}</b>
                  </div>
                );
                return <>
                  {Object.entries(dre.porCanal).map(([c, v]) => <Lin key={c} rot={c} val={v} sub />)}
                  <Lin rot="Faturamento" val={dre.faturamento} bold cor={C.verde} />
                  <Lin rot={`(−) CMV — matérias-primas  ·  ${pct1(dre.cmvPct)}`} val={-dre.cmv} ind />
                  <Lin rot="(−) Produção / embalagens (CPV)" val={-dre.cpv} ind />
                  <Lin rot="= Margem de contribuição" val={dre.mc} bold cor={C.azul} />
                  <div style={{ fontSize: 11, color: C.cinzaE, textAlign: "right", marginBottom: 4 }}>{pct1(dre.mcPct)} do faturamento</div>
                  {Object.entries(dre.opPorMatriz).map(([c, v]) => <Lin key={c} rot={`(−) ${c}`} val={-v} sub ind />)}
                  <Lin rot="(−) Despesas operacionais" val={-dre.despOper} ind />
                  <Lin rot="= Resultado operacional" val={dre.resultOper} bold />
                  <Lin rot="(−) Pró-labore" val={-dre.proLabore} ind />
                  <Lin rot="= Resultado do período" val={dre.resultado} bold cor={dre.resultado >= 0 ? C.verde : C.coral} />
                  {dre.imobilizado > 0 && <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${C.cinzaM}` }}><Lin rot="Investimentos / imobilizado (não operacional)" val={-dre.imobilizado} memo /></div>}
                </>;
              })()}
              <div style={{ fontSize: 11, color: C.cinzaE, fontStyle: "italic", marginTop: 10 }}>CMV% e margem consideram lançamentos com esta competência. O CMV real (por contagem de estoque) entra na próxima onda.</div>
            </div>
          ) : (
            /* ═══════════ LANÇAMENTOS ═══════════ */
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                <div style={{ ...card, flex: "1 1 130px", marginBottom: 0, borderTop: `3px solid ${C.verde}` }}><div style={lbl}>ENTRADAS</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 21, fontWeight: 800, color: C.verde }}>{brl(dre.faturamento)}</div></div>
                <div style={{ ...card, flex: "1 1 130px", marginBottom: 0, borderTop: `3px solid ${C.coral}` }}><div style={lbl}>SAÍDAS</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 21, fontWeight: 800, color: C.coral }}>{brl(dre.cmv + dre.cpv + dre.despOper + dre.proLabore + dre.imobilizado)}</div></div>
                <div style={{ ...card, flex: "1 1 130px", marginBottom: 0, borderTop: `3px solid ${C.azul}` }}><div style={lbl}>RESULTADO</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 21, fontWeight: 800, color: dre.resultado >= 0 ? C.azul : C.coral }}>{brl(dre.resultado)}</div></div>
                {pendencias.length > 0 && <div style={{ ...card, flex: "1 1 130px", marginBottom: 0, borderTop: `3px solid #B8860B` }}><div style={lbl}>A PAGAR / RECEBER</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 21, fontWeight: 800, color: "#B8860B" }}>{pendencias.length}</div></div>}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
                {podeEditar && !addOpen && <button onClick={() => setAddOpen(true)} style={{ background: C.lima, color: C.preto, border: "none", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Novo lançamento</button>}
                {podeEditar && <label style={{ ...btnSec, display: "inline-flex", alignItems: "center", gap: 6 }}>⬆ Importar<input type="file" accept=".csv,.txt,text/csv" style={{ display: "none" }} onChange={e => { const f = e.target.files && e.target.files[0]; if (f) lerArquivo(f); e.target.value = ""; }} /></label>}
                <button onClick={() => baixarArquivo("modelo_financeiro.csv", modeloCSV(arvore))} style={btnSec}>⬇ Modelo</button>
                {ls.length > 0 && <button onClick={() => baixarArquivo(`financeiro${clienteNome ? "_" + clienteNome.replace(/\s+/g, "_") : ""}.csv`, toCSVFluxo(ls))} style={btnSec}>⤓ Exportar</button>}
                {podeEditar && <button onClick={() => setGerCat(v => !v)} style={btnSec}>⚙ Categorias</button>}
              </div>

              {gerCat && <div style={{ ...card, borderColor: C.azul }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700 }}>Categorias · natureza</div>
                  <button onClick={() => setGerCat(false)} style={{ background: "none", border: "none", color: C.cinzaE, fontSize: 18, cursor: "pointer" }}>×</button>
                </div>
                {["entrada", "saida"].map(tipo => (
                  <div key={tipo} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: tipo === "entrada" ? C.verde : C.coral, textTransform: "uppercase" }}>{tipo === "entrada" ? "Entradas (canais)" : "Saídas (matrizes)"}</span>
                      <button onClick={() => addCategoria(tipo)} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 6, padding: "3px 9px", fontSize: 11.5, cursor: "pointer", color: C.azul }}>+ categoria</button>
                    </div>
                    {catsDe(arvore, tipo).map(cat => (
                      <div key={cat} style={{ border: `1px solid ${C.cinzaF}`, borderRadius: 8, padding: "7px 10px", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{cat}</span>
                          {tipo === "saida" && <select value={natDe(arvore, tipo, cat)} onChange={e => setNatureza(cat, e.target.value)} style={{ fontSize: 11, border: `1px solid ${C.cinzaM}`, borderRadius: 6, padding: "2px 5px", color: NAT[natDe(arvore, tipo, cat)].cor, fontWeight: 700 }}>{Object.entries(NAT).filter(([k]) => k !== "receita").map(([k, v]) => <option key={k} value={k}>{v.rot}</option>)}</select>}
                          <button onClick={() => addSub(tipo, cat)} style={{ background: "none", border: "none", color: C.lima, fontSize: 15, cursor: "pointer", fontWeight: 800 }}>+</button>
                          <button onClick={() => renomearCat(tipo, cat)} style={{ background: "none", border: "none", color: C.cinzaE, fontSize: 12, cursor: "pointer" }}>✎</button>
                          <button onClick={() => removerCat(tipo, cat)} style={{ background: "none", border: "none", color: C.coral, fontSize: 14, cursor: "pointer" }}>×</button>
                        </div>
                        {subsDe(arvore, tipo, cat).length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>{subsDe(arvore, tipo, cat).map(s => <span key={s} style={{ fontSize: 11.5, background: C.cinzaF, borderRadius: 12, padding: "2px 8px", display: "inline-flex", gap: 4 }}>{s}<button onClick={() => removerSub(tipo, cat, s)} style={{ background: "none", border: "none", color: C.coral, cursor: "pointer", padding: 0 }}>×</button></span>)}</div>}
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ fontSize: 11, color: C.cinzaE, fontStyle: "italic" }}>A <b>natureza</b> de cada matriz define onde ela entra no DRE (CMV, produção, operacional, imobilizado, pró-labore).</div>
              </div>}

              {imp && <div style={{ ...card, borderColor: C.azul }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Importar “{imp.nome}”</div>
                <div style={{ fontSize: 13, marginBottom: 8 }}><b style={{ color: imp.rows.length ? C.verde : C.coral }}>{imp.rows.length} lançamento(s)</b>{imp.novas && imp.novas.length ? ` · ${imp.novas.length} categoria(s) nova(s)` : ""}{imp.avisos.length ? ` · ${imp.avisos.length} aviso(s)` : ""}.</div>
                {imp.rows.length > 0 && <div style={{ maxHeight: 140, overflowY: "auto", border: `1px solid ${C.cinzaF}`, borderRadius: 8, marginBottom: 8 }}>{imp.rows.slice(0, 8).map((r, i) => <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, padding: "5px 8px", borderBottom: `1px solid ${C.cinzaF}` }}><span style={{ width: 66, color: C.cinzaE }}>{r.data.split("-").reverse().join("/")}</span><span style={{ width: 48, color: r.tipo === "entrada" ? C.verde : C.coral, fontWeight: 700 }}>{r.tipo}</span><span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.categoria}{r.subcategoria ? " › " + r.subcategoria : ""}</span><b>{brl(r.valor)}</b></div>)}</div>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={confirmarImport} disabled={importando || !imp.rows.length} style={{ background: imp.rows.length && !importando ? C.verde : C.cinzaM, color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{importando ? "Importando…" : `Importar ${imp.rows.length}`}</button>
                  <button onClick={() => setImp(null)} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer", color: C.cinzaE }}>Cancelar</button>
                </div>
              </div>}

              {podeEditar && addOpen && <div style={{ ...card, borderColor: C.lima }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Novo lançamento</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ flex: "1 1 120px" }}><label style={lbl}>DATA</label><input type="date" value={nv.data} onChange={e => setNv(v => ({ ...v, data: e.target.value, competencia: v.competencia || mesKey(e.target.value) }))} style={inp} /></div>
                  <div style={{ flex: "1 1 110px" }}><label style={lbl}>TIPO</label><select value={nv.tipo} onChange={e => setNv(v => ({ ...v, tipo: e.target.value, categoria: "", subcategoria: "" }))} style={inp}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div>
                  <div style={{ flex: "1 1 170px" }}><label style={lbl}>{nv.tipo === "entrada" ? "CANAL" : "MATRIZ"}</label><select value={nv.categoria} onChange={e => { const val = e.target.value; if (val === "__nova") { const nome = (window.prompt("Nova categoria:") || "").trim(); if (nome) { salvarArvore({ ...arvore, [nv.tipo]: { ...arvore[nv.tipo], [nome]: arvore[nv.tipo][nome] || { natureza: nv.tipo === "entrada" ? "receita" : "operacional", subs: [] } } }); setNv(s => ({ ...s, categoria: nome, subcategoria: "" })); } } else setNv(s => ({ ...s, categoria: val, subcategoria: "" })); }} style={inp}><option value="">— selecione —</option>{catsTipo.map(c => <option key={c} value={c}>{c}</option>)}<option value="__nova">+ nova…</option></select></div>
                  <div style={{ flex: "1 1 170px" }}><label style={lbl}>SUBCATEGORIA</label><select value={nv.subcategoria} onChange={e => { const val = e.target.value; if (val === "__nova") { const nome = (window.prompt("Nova subcategoria:") || "").trim(); if (nome && nv.categoria) { salvarArvore({ ...arvore, [nv.tipo]: { ...arvore[nv.tipo], [nv.categoria]: { ...arvore[nv.tipo][nv.categoria], subs: [...subsDe(arvore, nv.tipo, nv.categoria), nome] } } }); setNv(s => ({ ...s, subcategoria: nome })); } } else setNv(s => ({ ...s, subcategoria: val })); }} disabled={!nv.categoria} style={inp}><option value="">— opcional —</option>{subsCat.map(s => <option key={s} value={s}>{s}</option>)}{nv.categoria && <option value="__nova">+ nova…</option>}</select></div>
                  <div style={{ flex: "1 1 120px" }}><label style={lbl}>VALOR (R$)</label><input type="text" inputMode="decimal" value={nv.valor} onChange={e => setNv(v => ({ ...v, valor: e.target.value.replace(/[^0-9.,]/g, "") }))} placeholder="0,00" style={inp} /></div>
                  <div style={{ flex: "1 1 100%" }}><label style={lbl}>DESCRIÇÃO (OPCIONAL)</label><input value={nv.descricao} onChange={e => setNv(v => ({ ...v, descricao: e.target.value }))} style={inp} /></div>
                </div>
                <button onClick={() => setAvancado(a => !a)} style={{ background: "none", border: "none", color: C.azul, fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 8, padding: 0 }}>{avancado ? "− ocultar" : "+ competência e pagamento"}</button>
                {avancado && <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8, alignItems: "center" }}>
                  <div style={{ flex: "1 1 120px" }}><label style={lbl}>COMPETÊNCIA</label><input type="month" value={nv.competencia} onChange={e => setNv(v => ({ ...v, competencia: e.target.value }))} style={inp} /></div>
                  <div style={{ flex: "1 1 120px" }}><label style={lbl}>PREVISTO P/ (VENC.)</label><input type="date" value={nv.previsto} onChange={e => setNv(v => ({ ...v, previsto: e.target.value }))} style={inp} /></div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", marginTop: 14 }}><input type="checkbox" checked={nv.pago} onChange={e => setNv(v => ({ ...v, pago: e.target.checked }))} /> {nv.tipo === "entrada" ? "já recebido" : "já pago"}</label>
                </div>}
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button onClick={salvar} disabled={!nv.categoria} style={{ background: nv.categoria ? C.lima : C.cinzaM, color: C.preto, border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Salvar</button>
                  <button onClick={() => setAddOpen(false)} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 8, padding: "10px 16px", fontSize: 14, cursor: "pointer", color: C.cinzaE }}>Cancelar</button>
                </div>
              </div>}

              <div style={{ ...card, padding: 0 }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>Lançamentos · {mesLabel(mes)} ({doMes.length})</div>
                {doMes.length === 0 ? <div style={{ padding: 26, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum lançamento nesta competência.</div> :
                  doMes.map((l, i) => { const st = statusLanc(l); return (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: i < doMes.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
                      <div style={{ width: 42, flexShrink: 0, textAlign: "center", fontSize: 11, color: C.cinzaE }}>{(l.data || "").slice(8, 10)}/{(l.data || "").slice(5, 7)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.categoria}{l.subcategoria ? <span style={{ color: C.cinzaE, fontWeight: 400 }}> › {l.subcategoria}</span> : ""}</div>{l.descricao && <div style={{ fontSize: 12, color: C.cinzaE }}>{l.descricao}</div>}</div>
                      {podeEditar ? <button onClick={() => togglePago(l)} title="marcar pago/pendente">{chipStatus(st)}</button> : chipStatus(st)}
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16, color: l.tipo === "entrada" ? C.verde : C.coral, whiteSpace: "nowrap" }}>{l.tipo === "entrada" ? "+" : "−"} {brl(l.valor)}</div>
                      {podeEditar && <button onClick={() => { if (window.confirm("Excluir?")) remover(l); }} style={{ background: "none", border: "none", color: C.cinzaM, fontSize: 16, cursor: "pointer" }}>×</button>}
                    </div>
                  ); })}
              </div>
            </>
          )}
      </div>
    </div>
  );
}

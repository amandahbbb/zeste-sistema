import { useState, useEffect } from "react";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const C = { preto: "#0E0E0C", branco: "#fff", lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B", cinzaF: "#F0EEE8", cinzaM: "#D9D5C8", cinzaE: "#6B6B5E", border: "#E3E1D9" };

const brl = n => "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const mesKey = d => (d || "").slice(0, 7);
const mesLabel = mk => { const [y, m] = mk.split("-"); const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]; return `${nomes[+m - 1]}/${y}`; };
const mesHoje = () => new Date().toISOString().slice(0, 7);
const ehLanc = l => l && (l.tipo === "entrada" || l.tipo === "saida");
const somaMes = (ls, mk, tipo) => ls.filter(l => mesKey(l.data) === mk && l.tipo === tipo).reduce((a, l) => a + (Number(l.valor) || 0), 0);
const saldoAcumulado = (ls, mk) => ls.filter(l => ehLanc(l) && mesKey(l.data) <= mk).reduce((a, l) => a + (l.tipo === "entrada" ? 1 : -1) * (Number(l.valor) || 0), 0);
function porCategoria(ls, mk, tipo) {
  const m = {};
  ls.filter(l => mesKey(l.data) === mk && l.tipo === tipo).forEach(l => { const k = l.categoria || "—"; m[k] = (m[k] || 0) + (Number(l.valor) || 0); });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
function mesesComDados(ls) { const s = new Set(ls.filter(ehLanc).map(l => mesKey(l.data)).filter(Boolean)); s.add(mesHoje()); return [...s].sort().reverse(); }

// ── Árvore de categorias ─────────────────────────────────────────────────────
// Vendas = produtos do cliente (agrupados por praça). Despesas = padrão de restaurante.
const RECEITA_EXTRA = { "Outras receitas": ["Eventos", "Couvert", "Gorjeta", "Outros"] };
const DESPESA_PADRAO = {
  "Insumos (CMV)": ["Hortifruti", "Carnes e peixes", "Laticínios e frios", "Mercearia / secos", "Bebidas", "Descartáveis e embalagens", "Gás de cozinha"],
  "Pessoal": ["Salários", "Encargos (INSS/FGTS)", "Pró-labore", "Vale-transporte", "Vale-refeição", "Freelancers / extras", "Uniformes", "Treinamento"],
  "Ocupação": ["Aluguel", "Condomínio", "IPTU"],
  "Utilidades": ["Energia elétrica", "Água e esgoto", "Gás encanado", "Internet e telefone"],
  "Operação": ["Manutenção e reparos", "Limpeza e higiene", "Equipamentos e utensílios", "Sistema / PDV", "Contabilidade"],
  "Comercial": ["Marketing e anúncios", "Taxas de apps (iFood etc.)", "Taxas de cartão", "Embalagem delivery"],
  "Impostos e taxas": ["Simples Nacional / impostos", "Tarifas bancárias", "Alvarás e licenças"],
  "Financeiro": ["Empréstimos e juros", "Outras despesas financeiras"],
  "Outras despesas": ["Retiradas dos sócios", "Diversos"],
};
function arvoreProdutos(pratos) {
  const t = {};
  (pratos || []).forEach(p => { const cat = p.categoria || "Cardápio"; (t[cat] = t[cat] || []); if (p.nome && !t[cat].includes(p.nome)) t[cat].push(p.nome); });
  return t;
}
function arvorePadrao(pratos) { return { entrada: { ...arvoreProdutos(pratos), ...RECEITA_EXTRA }, saida: JSON.parse(JSON.stringify(DESPESA_PADRAO)) }; }
// garante que produtos novos apareçam mesmo depois de a config ter sido salva
function comProdutos(arvore, pratos) {
  const out = { entrada: { ...(arvore.entrada || {}) }, saida: { ...(arvore.saida || {}) } };
  const prod = arvoreProdutos(pratos);
  Object.entries(prod).forEach(([cat, subs]) => { out.entrada[cat] = out.entrada[cat] || []; subs.forEach(s => { if (!out.entrada[cat].includes(s)) out.entrada[cat] = [...out.entrada[cat], s]; }); });
  Object.keys(RECEITA_EXTRA).forEach(k => { if (!out.entrada[k]) out.entrada[k] = [...RECEITA_EXTRA[k]]; });
  return out;
}
function modeloCSV(arvore) {
  const linhas = ["Data;Tipo;Categoria;Subcategoria;Descrição;Valor"];
  const ex = (tipo, n, valBase) => { let i = 0; for (const [cat, subs] of Object.entries(arvore[tipo] || {})) { if (i >= n) break; const sub = subs[0] || ""; linhas.push(`2026-08-0${i + 1};${tipo};${cat};${sub};exemplo;${(valBase * (i + 1)).toFixed(2).replace(".", ",")}`); i++; } };
  ex("entrada", 3, 350); ex("saida", 4, 180);
  return linhas.join("\n");
}

// ── Import CSV ────────────────────────────────────────────────────────────────
const normH = s => (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
function parseCSVFluxo(texto, arvore) {
  const linhas = (texto || "").replace(/\r/g, "").split("\n").filter(l => l.trim());
  if (!linhas.length) return { rows: [], avisos: ["Arquivo vazio."], novas: [] };
  const delim = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ";" : ",";
  const split = l => { const out = []; let cur = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === delim && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map(s => s.trim().replace(/^"|"$/g, "")); };
  const head = split(linhas[0]).map(normH);
  const idx = (...ns) => { for (const n of ns) { const i = head.indexOf(n); if (i >= 0) return i; } return -1; };
  const iData = idx("data", "date", "dia", "emissao", "vencimento"), iTipo = idx("tipo", "type", "natureza", "operacao"), iCat = idx("categoria", "category", "classificacao", "plano de contas", "conta", "grupo"), iSub = idx("subcategoria", "sub", "item", "produto", "subgrupo"), iDesc = idx("descricao", "historico", "description", "detalhe", "observacao"), iVal = idx("valor", "value", "amount", "total", "valor total", "valor liquido");
  if (iData < 0 || iVal < 0) return { rows: [], avisos: ["Não encontrei as colunas obrigatórias Data e Valor. Baixe o modelo e ajuste os títulos das colunas."], novas: [] };
  const parseData = s => { s = (s || "").trim(); if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10); const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/); if (m) { let [, d, mo, y] = m; if (y.length === 2) y = "20" + y; return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`; } return ""; };
  const parseValor = s => { s = (s || "").toString().replace(/[R$\s]/gi, ""); if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); const n = parseFloat(s); return isNaN(n) ? null : n; };
  const avisos = [], rows = [], novasSet = {};
  for (let i = 1; i < linhas.length; i++) {
    const c = split(linhas[i]); const data = parseData(c[iData]); let valor = parseValor(c[iVal]);
    if (!data || valor === null) { avisos.push(`Linha ${i + 1} ignorada (data ou valor inválido).`); continue; }
    const rawTipo = iTipo >= 0 ? normH(c[iTipo]) : "";
    let t = /entrada|receita|credito|venda|recebi/.test(rawTipo) ? "entrada" : /saida|despesa|debito|pagamento|compra|custo/.test(rawTipo) ? "saida" : (valor < 0 ? "saida" : "entrada");
    valor = Math.abs(valor);
    const categoria = (iCat >= 0 && c[iCat]) ? c[iCat].trim() : (t === "entrada" ? "Outras receitas" : "Outras despesas");
    const subcategoria = (iSub >= 0 && c[iSub]) ? c[iSub].trim() : "";
    const descricao = iDesc >= 0 ? (c[iDesc] || "") : "";
    // detecta categorias/subcategorias que ainda não existem na árvore
    const existeCat = arvore && arvore[t] && arvore[t][categoria];
    if (!existeCat) { novasSet[`${t}||${categoria}`] = true; if (subcategoria) novasSet[`${t}||${categoria}||${subcategoria}`] = true; }
    else if (subcategoria && !arvore[t][categoria].includes(subcategoria)) novasSet[`${t}||${categoria}||${subcategoria}`] = true;
    rows.push({ data, tipo: t, categoria, subcategoria, descricao, valor });
  }
  if (!rows.length && !avisos.length) avisos.push("Nenhuma linha de dados encontrada.");
  return { rows, avisos, novas: Object.keys(novasSet) };
}
function toCSVFluxo(ls) {
  const head = "Data;Tipo;Categoria;Subcategoria;Descrição;Valor";
  const body = ls.filter(ehLanc).sort((a, b) => (a.data || "").localeCompare(b.data || "")).map(l => [l.data, l.tipo, l.categoria, l.subcategoria || "", (l.descricao || "").replace(/;/g, ","), String(l.valor).replace(".", ",")].join(";"));
  return [head, ...body].join("\n");
}
function baixarArquivo(nome, conteudo) {
  const blob = new Blob(["\ufeff" + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
// aplica uma lista de "novas" (t||cat ou t||cat||sub) numa árvore
function aplicarNovas(arvore, novas) {
  const out = { entrada: JSON.parse(JSON.stringify(arvore.entrada || {})), saida: JSON.parse(JSON.stringify(arvore.saida || {})) };
  novas.forEach(k => { const [t, cat, sub] = k.split("||"); out[t][cat] = out[t][cat] || []; if (sub && !out[t][cat].includes(sub)) out[t][cat].push(sub); });
  return out;
}

async function carregarTudo(clienteId, cid, token) {
  try {
    const [rf, rp] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/fin_cliente_fluxo?cliente_id=eq.${clienteId}&deleted_at=is.null&select=*&order=created_at.desc`, { headers: sbH(token) }).then(r => r.json()),
      fetch(`${SB_URL}/rest/v1/fin_pratos?or=(cliente_id.eq.${cid},cliente_id.like.${cid}-*)&deleted_at=is.null&select=cliente_id,dados`, { headers: sbH(token) }).then(r => r.json()),
    ]);
    const linhas = Array.isArray(rf) ? rf.map(x => ({ ...(x.dados || {}), _row: x.id })) : [];
    const pratos = Array.isArray(rp) ? rp.map(x => ({ ...(x.dados || {}) })) : [];
    return { linhas, pratos };
  } catch { return { linhas: [], pratos: [] }; }
}
async function upsert(item, clienteId, token) { const r = await fetch(`${SB_URL}/rest/v1/fin_cliente_fluxo`, { method: "POST", headers: { ...sbH(token), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: item.id, cliente_id: clienteId, dados: item, updated_at: new Date().toISOString() }) }); return r.ok; }
async function excluir(id, token) { const r = await fetch(`${SB_URL}/rest/v1/fin_cliente_fluxo?id=eq.${id}`, { method: "PATCH", headers: sbH(token), body: JSON.stringify({ deleted_at: new Date().toISOString() }) }); return r.ok; }

export default function FluxoCaixa({ token, clienteId, clienteNome, podeEditar = true, onBack }) {
  const [ls, setLs] = useState([]);
  const [arvore, setArvore] = useState({ entrada: {}, saida: {} });
  const [cfgId, setCfgId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(mesHoje());
  const [addOpen, setAddOpen] = useState(false);
  const [gerCat, setGerCat] = useState(false);
  const hoje = new Date().toISOString().slice(0, 10);
  const [nv, setNv] = useState({ data: hoje, tipo: "entrada", categoria: "", subcategoria: "", descricao: "", valor: "" });
  const [imp, setImp] = useState(null);
  const [importando, setImportando] = useState(false);

  useEffect(() => {
    const cid = clienteId;
    carregarTudo(clienteId, cid, token).then(({ linhas, pratos }) => {
      const cfg = linhas.find(l => l.tipo === "config");
      setCfgId(cfg ? cfg._row : null);
      const base = cfg && cfg.arvore ? comProdutos(cfg.arvore, pratos) : arvorePadrao(pratos);
      setArvore(base);
      setLs(linhas.filter(ehLanc));
      setLoading(false);
    });
  }, [clienteId]);

  const salvarArvore = async (nova) => { setArvore(nova); const id = cfgId || "cfg_" + clienteId; setCfgId(id); await upsert({ id, tipo: "config", arvore: nova }, clienteId, token); };

  const inp = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.cinzaM}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, background: "#fff", fontFamily: "inherit" };
  const lbl = { fontSize: 10, color: C.cinzaE, fontWeight: 700, letterSpacing: ".04em", display: "block", marginBottom: 3 };
  const card = { border: `1px solid ${C.border}`, borderRadius: 10, background: "#fff", padding: 14, marginBottom: 12 };
  const btnSec = { background: "#fff", border: `1.5px solid ${C.cinzaM}`, borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.azul };

  const entradas = somaMes(ls, mes, "entrada"), saidas = somaMes(ls, mes, "saida"), saldoMes = entradas - saidas, acumulado = saldoAcumulado(ls, mes);
  const doMes = ls.filter(l => mesKey(l.data) === mes).sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const catSaidas = porCategoria(ls, mes, "saida"); const maxCat = catSaidas.length ? catSaidas[0][1] : 1;
  const meses = mesesComDados(ls);
  const catsDoTipo = Object.keys(arvore[nv.tipo] || {});
  const subsDaCat = (arvore[nv.tipo] && arvore[nv.tipo][nv.categoria]) || [];

  const salvar = async () => {
    const valor = parseFloat(String(nv.valor).replace(",", ".")) || 0; if (valor <= 0 || !nv.categoria) return;
    const item = { id: uid(), data: nv.data, tipo: nv.tipo, categoria: nv.categoria, subcategoria: nv.subcategoria, descricao: nv.descricao, valor };
    setLs(p => [{ ...item, _row: item.id }, ...p]); setAddOpen(false);
    setNv({ data: hoje, tipo: "entrada", categoria: "", subcategoria: "", descricao: "", valor: "" });
    await upsert(item, clienteId, token);
  };
  const remover = async (l) => { setLs(p => p.filter(x => x.id !== l.id)); await excluir(l.id, token); };

  const lerArquivo = (file) => { const rd = new FileReader(); rd.onload = () => setImp({ ...parseCSVFluxo(String(rd.result || ""), arvore), nome: file.name }); rd.readAsText(file, "UTF-8"); };
  const confirmarImport = async () => {
    if (!imp || !imp.rows.length) return; setImportando(true);
    if (imp.novas && imp.novas.length) await salvarArvore(aplicarNovas(arvore, imp.novas));
    const novos = imp.rows.map(r => ({ ...r, id: uid() }));
    setLs(p => [...novos.map(n => ({ ...n, _row: n.id })), ...p]);
    for (const n of novos) await upsert(n, clienteId, token);
    setImportando(false); setImp(null);
  };

  // gerenciar categorias
  const addCategoria = (tipo) => { const nome = (window.prompt("Nova categoria:") || "").trim(); if (!nome || (arvore[tipo] && arvore[tipo][nome])) return; salvarArvore({ ...arvore, [tipo]: { ...arvore[tipo], [nome]: [] } }); };
  const addSub = (tipo, cat) => { const nome = (window.prompt(`Nova subcategoria em "${cat}":`) || "").trim(); if (!nome || arvore[tipo][cat].includes(nome)) return; salvarArvore({ ...arvore, [tipo]: { ...arvore[tipo], [cat]: [...arvore[tipo][cat], nome] } }); };
  const renomearCat = (tipo, cat) => { const nome = (window.prompt("Renomear categoria:", cat) || "").trim(); if (!nome || nome === cat) return; const t = { ...arvore[tipo] }; t[nome] = t[cat]; delete t[cat]; salvarArvore({ ...arvore, [tipo]: t }); };
  const removerCat = (tipo, cat) => { const usos = ls.filter(l => l.tipo === tipo && l.categoria === cat).length; if (!window.confirm(`Remover a categoria "${cat}"?${usos ? ` ${usos} lançamento(s) já usam ela — eles continuam com o texto, só somem do menu.` : ""}`)) return; const t = { ...arvore[tipo] }; delete t[cat]; salvarArvore({ ...arvore, [tipo]: t }); };
  const removerSub = (tipo, cat, sub) => { salvarArvore({ ...arvore, [tipo]: { ...arvore[tipo], [cat]: arvore[tipo][cat].filter(s => s !== sub) } }); };

  return (
    <div style={{ fontFamily: "'Barlow',sans-serif", color: C.preto }}>
      <div style={{ padding: 16, maxWidth: 760, margin: "0 auto" }}>
        {onBack && <button onClick={onBack} style={{ background: "none", border: "none", color: C.azul, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>‹ Voltar</button>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700 }}>Fluxo de caixa{clienteNome ? ` · ${clienteNome}` : ""}</div>
            <div style={{ fontSize: 12.5, color: C.cinzaE }}>Entradas e saídas do seu caixa, mês a mês.</div>
          </div>
          <select value={mes} onChange={e => setMes(e.target.value)} style={{ ...inp, width: "auto" }}>{meses.map(mk => <option key={mk} value={mk}>{mesLabel(mk)}</option>)}</select>
        </div>

        {loading ? <div style={{ padding: 30, textAlign: "center", color: C.cinzaE }}>Carregando…</div> : <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div style={{ ...card, flex: "1 1 150px", marginBottom: 0, borderTop: `3px solid ${C.verde}` }}><div style={lbl}>ENTRADAS DO MÊS</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: C.verde }}>{brl(entradas)}</div></div>
            <div style={{ ...card, flex: "1 1 150px", marginBottom: 0, borderTop: `3px solid ${C.coral}` }}><div style={lbl}>SAÍDAS DO MÊS</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: C.coral }}>{brl(saidas)}</div></div>
            <div style={{ ...card, flex: "1 1 150px", marginBottom: 0, borderTop: `3px solid ${saldoMes >= 0 ? C.azul : C.coral}` }}><div style={lbl}>SALDO DO MÊS</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: saldoMes >= 0 ? C.azul : C.coral }}>{brl(saldoMes)}</div></div>
            <div style={{ ...card, flex: "1 1 150px", marginBottom: 0, borderTop: `3px solid ${C.cinzaM}` }}><div style={lbl}>SALDO ACUMULADO</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: acumulado >= 0 ? C.preto : C.coral }}>{brl(acumulado)}</div></div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
            {podeEditar && !addOpen && <button onClick={() => setAddOpen(true)} style={{ background: C.lima, color: C.preto, border: "none", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Novo lançamento</button>}
            {podeEditar && <label style={{ ...btnSec, display: "inline-flex", alignItems: "center", gap: 6 }}>⬆ Importar planilha<input type="file" accept=".csv,.txt,text/csv" style={{ display: "none" }} onChange={e => { const f = e.target.files && e.target.files[0]; if (f) lerArquivo(f); e.target.value = ""; }} /></label>}
            <button onClick={() => baixarArquivo("modelo_fluxo_caixa.csv", modeloCSV(arvore))} style={btnSec}>⬇ Baixar modelo</button>
            {ls.length > 0 && <button onClick={() => baixarArquivo(`fluxo_caixa${clienteNome ? "_" + clienteNome.replace(/\s+/g, "_") : ""}.csv`, toCSVFluxo(ls))} style={btnSec}>⤓ Exportar</button>}
            {podeEditar && <button onClick={() => setGerCat(v => !v)} style={btnSec}>⚙ Categorias</button>}
          </div>

          {/* GERENCIAR CATEGORIAS */}
          {gerCat && <div style={{ ...card, borderColor: C.azul }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700 }}>Categorias e subcategorias</div>
              <button onClick={() => setGerCat(false)} style={{ background: "none", border: "none", color: C.cinzaE, fontSize: 18, cursor: "pointer" }}>×</button>
            </div>
            {["entrada", "saida"].map(tipo => (
              <div key={tipo} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: tipo === "entrada" ? C.verde : C.coral, textTransform: "uppercase", letterSpacing: ".04em" }}>{tipo === "entrada" ? "Vendas / receitas" : "Despesas"}</span>
                  <button onClick={() => addCategoria(tipo)} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 6, padding: "3px 9px", fontSize: 11.5, cursor: "pointer", color: C.azul }}>+ categoria</button>
                </div>
                {Object.entries(arvore[tipo] || {}).map(([cat, subs]) => (
                  <div key={cat} style={{ border: `1px solid ${C.cinzaF}`, borderRadius: 8, padding: "7px 10px", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{cat}</span>
                      <button onClick={() => addSub(tipo, cat)} title="nova subcategoria" style={{ background: "none", border: "none", color: C.lima, fontSize: 15, cursor: "pointer", fontWeight: 800 }}>+</button>
                      <button onClick={() => renomearCat(tipo, cat)} title="renomear" style={{ background: "none", border: "none", color: C.cinzaE, fontSize: 12, cursor: "pointer" }}>✎</button>
                      <button onClick={() => removerCat(tipo, cat)} title="remover" style={{ background: "none", border: "none", color: C.coral, fontSize: 14, cursor: "pointer" }}>×</button>
                    </div>
                    {subs.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>{subs.map(s => (
                      <span key={s} style={{ fontSize: 11.5, background: C.cinzaF, borderRadius: 12, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>{s}<button onClick={() => removerSub(tipo, cat, s)} style={{ background: "none", border: "none", color: C.coral, cursor: "pointer", padding: 0, fontSize: 12 }}>×</button></span>
                    ))}</div>}
                  </div>
                ))}
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.cinzaE, fontStyle: "italic" }}>As vendas já vêm dos produtos cadastrados no sistema; aqui você ajusta o que quiser. Categorias novas de uma planilha importada entram sozinhas.</div>
          </div>}

          {/* PRÉVIA IMPORT */}
          {imp && <div style={{ ...card, borderColor: C.azul }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Importar “{imp.nome}”</div>
            <div style={{ fontSize: 13, marginBottom: 8 }}><b style={{ color: imp.rows.length ? C.verde : C.coral }}>{imp.rows.length} lançamento(s)</b>{imp.novas && imp.novas.length ? ` · ${imp.novas.length} categoria(s)/subcategoria(s) nova(s) serão criadas` : ""}{imp.avisos.length ? ` · ${imp.avisos.length} aviso(s)` : ""}.</div>
            {imp.rows.length > 0 && <div style={{ maxHeight: 150, overflowY: "auto", border: `1px solid ${C.cinzaF}`, borderRadius: 8, marginBottom: 8 }}>
              {imp.rows.slice(0, 8).map((r, i) => (<div key={i} style={{ display: "flex", gap: 8, fontSize: 12, padding: "5px 8px", borderBottom: `1px solid ${C.cinzaF}` }}>
                <span style={{ width: 70, color: C.cinzaE }}>{r.data.split("-").reverse().join("/")}</span>
                <span style={{ width: 50, color: r.tipo === "entrada" ? C.verde : C.coral, fontWeight: 700 }}>{r.tipo}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.categoria}{r.subcategoria ? " › " + r.subcategoria : ""}</span>
                <b style={{ whiteSpace: "nowrap" }}>{brl(r.valor)}</b></div>))}
              {imp.rows.length > 8 && <div style={{ fontSize: 11, color: C.cinzaE, padding: "5px 8px" }}>… e mais {imp.rows.length - 8}</div>}
            </div>}
            {imp.avisos.length > 0 && <div style={{ fontSize: 11.5, color: C.coral, marginBottom: 8, maxHeight: 60, overflowY: "auto" }}>{imp.avisos.slice(0, 5).map((a, i) => <div key={i}>⚠ {a}</div>)}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={confirmarImport} disabled={importando || !imp.rows.length} style={{ background: imp.rows.length && !importando ? C.verde : C.cinzaM, color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: imp.rows.length && !importando ? "pointer" : "default" }}>{importando ? "Importando…" : `Importar ${imp.rows.length}`}</button>
              <button onClick={() => setImp(null)} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer", color: C.cinzaE }}>Cancelar</button>
            </div>
            <div style={{ fontSize: 11, color: C.cinzaE, marginTop: 8, fontStyle: "italic" }}>Colunas: Data · Tipo · Categoria · Subcategoria · Descrição · Valor. Aceita “;” ou “,” e vírgula decimal. No Sischef, exporte o relatório e salve como CSV.</div>
          </div>}

          {/* NOVO LANÇAMENTO */}
          {podeEditar && addOpen && <div style={{ ...card, borderColor: C.lima }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Novo lançamento</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <div style={{ flex: "1 1 120px" }}><label style={lbl}>DATA</label><input type="date" value={nv.data} onChange={e => setNv(v => ({ ...v, data: e.target.value }))} style={inp} /></div>
              <div style={{ flex: "1 1 120px" }}><label style={lbl}>TIPO</label><select value={nv.tipo} onChange={e => setNv(v => ({ ...v, tipo: e.target.value, categoria: "", subcategoria: "" }))} style={inp}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div>
              <div style={{ flex: "1 1 180px" }}><label style={lbl}>CATEGORIA</label>
                <select value={nv.categoria} onChange={e => { const v = e.target.value; if (v === "__nova") { const nome = (window.prompt("Nova categoria:") || "").trim(); if (nome) { salvarArvore({ ...arvore, [nv.tipo]: { ...arvore[nv.tipo], [nome]: arvore[nv.tipo][nome] || [] } }); setNv(s => ({ ...s, categoria: nome, subcategoria: "" })); } } else setNv(s => ({ ...s, categoria: v, subcategoria: "" })); }} style={inp}>
                  <option value="">— selecione —</option>{catsDoTipo.map(c => <option key={c} value={c}>{c}</option>)}<option value="__nova">+ nova categoria…</option>
                </select></div>
              <div style={{ flex: "1 1 180px" }}><label style={lbl}>SUBCATEGORIA</label>
                <select value={nv.subcategoria} onChange={e => { const v = e.target.value; if (v === "__nova") { const nome = (window.prompt("Nova subcategoria:") || "").trim(); if (nome && nv.categoria) { salvarArvore({ ...arvore, [nv.tipo]: { ...arvore[nv.tipo], [nv.categoria]: [...(arvore[nv.tipo][nv.categoria] || []), nome] } }); setNv(s => ({ ...s, subcategoria: nome })); } } else setNv(s => ({ ...s, subcategoria: v })); }} disabled={!nv.categoria} style={inp}>
                  <option value="">— opcional —</option>{subsDaCat.map(s => <option key={s} value={s}>{s}</option>)}{nv.categoria && <option value="__nova">+ nova subcategoria…</option>}
                </select></div>
              <div style={{ flex: "1 1 120px" }}><label style={lbl}>VALOR (R$)</label><input type="text" inputMode="decimal" value={nv.valor} onChange={e => setNv(v => ({ ...v, valor: e.target.value.replace(/[^0-9.,]/g, "") }))} placeholder="0,00" style={inp} /></div>
              <div style={{ flex: "1 1 100%" }}><label style={lbl}>DESCRIÇÃO (OPCIONAL)</label><input value={nv.descricao} onChange={e => setNv(v => ({ ...v, descricao: e.target.value }))} placeholder="ex.: vendas do dia, feira da semana" style={inp} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={salvar} disabled={!nv.categoria} style={{ background: nv.categoria ? C.lima : C.cinzaM, color: C.preto, border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: nv.categoria ? "pointer" : "default" }}>Salvar lançamento</button>
              <button onClick={() => setAddOpen(false)} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 8, padding: "10px 16px", fontSize: 14, cursor: "pointer", color: C.cinzaE }}>Cancelar</button>
            </div>
          </div>}

          {catSaidas.length > 0 && <div style={card}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Para onde foi o dinheiro ({mesLabel(mes)})</div>
            {catSaidas.map(([cat, val]) => (<div key={cat} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 2 }}><span>{cat}</span><b>{brl(val)}</b></div>
              <div style={{ height: 7, background: C.cinzaF, borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${Math.max(3, val / maxCat * 100)}%`, height: "100%", background: C.coral }} /></div></div>))}
          </div>}

          <div style={{ ...card, padding: 0 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>Lançamentos de {mesLabel(mes)} ({doMes.length})</div>
            {doMes.length === 0 ? <div style={{ padding: 26, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum lançamento neste mês.</div> :
              doMes.map((l, i) => (<div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: i < doMes.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
                <div style={{ width: 44, flexShrink: 0, textAlign: "center", fontSize: 11, color: C.cinzaE }}>{(l.data || "").slice(8, 10)}/{(l.data || "").slice(5, 7)}</div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.categoria}{l.subcategoria ? <span style={{ color: C.cinzaE, fontWeight: 400 }}> › {l.subcategoria}</span> : ""}</div>{l.descricao && <div style={{ fontSize: 12, color: C.cinzaE }}>{l.descricao}</div>}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16, color: l.tipo === "entrada" ? C.verde : C.coral, whiteSpace: "nowrap" }}>{l.tipo === "entrada" ? "+" : "−"} {brl(l.valor)}</div>
                {podeEditar && <button onClick={() => { if (window.confirm("Excluir este lançamento?")) remover(l); }} style={{ background: "none", border: "none", color: C.cinzaM, fontSize: 16, cursor: "pointer" }}>×</button>}
              </div>))}
          </div>
        </>}
      </div>
    </div>
  );
}

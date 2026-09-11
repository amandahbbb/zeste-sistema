import { useState, useEffect } from "react";
import { calcAllFichas, calcPrato, calcFicha } from "./cmv.js";
import { novoMov, gravarMovimentos, apagarMovimentosPorRef } from "./estoque.js";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
const C = { preto: "#0E0E0C", lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B", cinzaF: "#F0EEE8", cinzaM: "#B0AC9E", cinzaE: "#4A4A42", border: "#E3E1D9" };

const brl = n => "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct1 = n => (Math.round((Number(n) || 0) * 10) / 10).toLocaleString("pt-BR") + "%";
const num = v => { const n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isNaN(n) ? 0 : n; };
const normN = s => (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const mesLabel = mk => { const [y, m] = (mk || "").split("-"); const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]; return `${nomes[+m - 1]}/${y}`; };

// ── CMV teórico: vendas (qtd por prato) × custo da ficha (cmv.js) ────────────
export function calcCMVTeorico(pratosCalc, vendas) {
  const q = vendas || {};
  const linhas = pratosCalc.map(p => {
    const qtd = num(q[p.nome]);
    // confeitaria: se vende por fatia, usa custo/preço da fatia
    const usaFatia = (p.rendFatias > 0 && p.precoFatia > 0);
    const custoUn = usaFatia ? p.custoFatia : p.custoTotal;
    const precoUn = usaFatia ? p.precoFatia : p.preco;
    const custo = qtd * custoUn, receita = qtd * precoUn;
    return { nome: p.nome, categoria: p.categoria || "", qtd, custoUn, precoUn, custo, receita, mcRS: receita - custo, cmvPct: precoUn > 0 ? custoUn / precoUn * 100 : 0, semPreco: !(precoUn > 0), custoIncompleto: !!p.custoIncompleto, usaFatia };
  });
  const comVenda = linhas.filter(l => l.qtd > 0);
  const custo = comVenda.reduce((a, l) => a + l.custo, 0);
  const receita = comVenda.reduce((a, l) => a + l.receita, 0);
  return { linhas, comVenda, custo, receita, mc: receita - custo, cmvPct: receita > 0 ? custo / receita * 100 : 0, mcPct: receita > 0 ? (receita - custo) / receita * 100 : 0, alertas: comVenda.filter(l => l.semPreco || l.custoIncompleto) };
}

// ── Consumo teórico por INSUMO: explode prato → fichas → ingredientes ───────
export function consumoPorInsumo(pratosCalc, vendas, fichasCalc) {
  const uso = {}; // nome do insumo -> kg
  const addFicha = (nomeFicha, kgFicha) => {
    const f = fichasCalc.find(x => x.nome === nomeFicha); if (!f || !kgFicha) return;
    const pesoTotal = (f.itens || []).reduce((s, i) => s + (Number(i.pesoFinal) || 0), 0) || 1;
    (f.itens || []).forEach(it => {
      const fracao = (Number(it.pesoFinal) || 0) / pesoTotal;      // proporção do item na ficha
      const kgItem = kgFicha * fracao * ((Number(it.fc) || 1));     // volta pra peso BRUTO comprado
      if (it.tipo === 'ficha') addFicha(it.nomeRef, kgFicha * fracao);
      else { const n = it.nomeRef || (it.ref && it.ref.nome); if (n) uso[n] = (uso[n] || 0) + kgItem; }
    });
  };
  pratosCalc.forEach(p => {
    const qtd = num((vendas || {})[p.nome]); if (!qtd) return;
    const usaFatia = (p.rendFatias > 0 && p.precoFatia > 0);
    const fator = usaFatia && p.rendFatias ? qtd / p.rendFatias : qtd;  // fatia: converte pra "pratos inteiros"
    (p.comps || []).forEach(c => {
      const kg = (Number(c.qtdKg) || 0) * fator * (Number(c.fc) || 1);
      if (!kg) return;
      if (c.tipo === 'ficha') addFicha(c.nomeRef, kg);
      else { const n = c.nomeRef || (c.ref && c.ref.nome); if (n) uso[n] = (uso[n] || 0) + kg; }
    });
  });
  return uso;
}

// ── Curva A: insumos que concentram o custo (o app propõe o que contar) ──────
export function curvaA(uso, ingredientes, corte = 0.8) {
  const preco = n => { const i = ingredientes.find(g => g.nome === n); return i ? (Number(i.p) || 0) : 0; };
  const linhas = Object.entries(uso).map(([nome, kg]) => ({ nome, kg, preco: preco(nome), valor: kg * preco(nome) })).sort((a, b) => b.valor - a.valor);
  const total = linhas.reduce((a, l) => a + l.valor, 0) || 1;
  let acc = 0;
  return linhas.map(l => { acc += l.valor; const dentro = (acc - l.valor) / total < corte; return { ...l, pctAcum: acc / total * 100, curvaA: dentro }; });
}

// ── CMV real e variância por insumo ─────────────────────────────────────────
export function calcVariancia(itens, receita) {
  // itens: { nome, kg (consumo teórico), preco, inicial, compras, final }
  const linhas = itens.map(i => {
    const inicial = num(i.inicial), compras = num(i.compras), final = num(i.final);
    const temContagem = String(i.final || '').trim() !== '';
    const deveriaTer = inicial + compras - i.kg;
    const quebraKg = temContagem ? deveriaTer - final : null;      // >0 = sumiu
    const realKg = temContagem ? inicial + compras - final : null; // consumo real
    return { ...i, inicial, compras, final, temContagem, deveriaTer, quebraKg, quebraRS: temContagem ? quebraKg * i.preco : null, realKg, realRS: temContagem ? realKg * i.preco : null, teoricoRS: i.kg * i.preco };
  });
  const comContagem = linhas.filter(l => l.temContagem);
  const realRS = comContagem.reduce((a, l) => a + l.realRS, 0);
  const teoricoRS = comContagem.reduce((a, l) => a + l.teoricoRS, 0);
  const quebraRS = comContagem.reduce((a, l) => a + l.quebraRS, 0);
  return { linhas, comContagem, realRS, teoricoRS, quebraRS, realPct: receita > 0 ? realRS / receita * 100 : 0, teoricoPct: receita > 0 ? teoricoRS / receita * 100 : 0, quebraPct: teoricoRS > 0 ? quebraRS / teoricoRS * 100 : 0 };
}

// import de relatório de vendas por produto (Sischef/PDV): produto + quantidade
export function parseVendasCSV(texto, nomesPratos) {
  const linhas = (texto || "").replace(/\r/g, "").split("\n").filter(l => l.trim());
  if (!linhas.length) return { itens: [], avisos: ["Arquivo vazio."] };
  const delim = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ";" : ",";
  const split = l => { const out = []; let cur = "", q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === delim && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map(s => s.trim().replace(/^"|"$/g, "")); };
  const head = split(linhas[0]).map(normN);
  const idx = (...ns) => { for (const n of ns) { const i = head.indexOf(n); if (i >= 0) return i; } return -1; };
  const iProd = idx("produto", "descricao", "item", "nome", "cardapio", "descricao do produto");
  const iQtd = idx("quantidade", "qtd", "qtde", "qtd vendida", "quantidade vendida", "vendas", "qtd.");
  if (iProd < 0 || iQtd < 0) return { itens: [], avisos: ["Não encontrei as colunas Produto e Quantidade. Baixe o modelo e ajuste os títulos."] };
  const parseQtd = s => { s = (s || "").toString().replace(/\s/g, ""); if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); const n = parseFloat(s); return isNaN(n) ? 0 : n; };
  const alvo = (nomesPratos || []).map(n => ({ n, k: normN(n) }));
  const itens = [], avisos = [], acc = {};
  for (let i = 1; i < linhas.length; i++) {
    const c = split(linhas[i]); const prodRaw = (c[iProd] || "").trim(); const qtd = parseQtd(c[iQtd]);
    if (!prodRaw || !qtd) continue;
    const k = normN(prodRaw);
    let m = alvo.find(a => a.k === k) || alvo.find(a => k.includes(a.k) || a.k.includes(k));
    if (!m) { avisos.push(`"${prodRaw}" não bate com nenhum prato cadastrado.`); continue; }
    acc[m.n] = (acc[m.n] || 0) + qtd;
  }
  Object.entries(acc).forEach(([nome, qtd]) => itens.push({ nome, qtd }));
  if (!itens.length && !avisos.length) avisos.push("Nenhuma linha reconhecida.");
  return { itens, avisos };
}
const modeloVendasCSV = nomes => ["Produto;Quantidade", ...(nomes || []).slice(0, 6).map((n, i) => `${n};${(i + 1) * 10}`)].join("\n");
function baixarArquivo(nome, conteudo) { const blob = new Blob(["\ufeff" + conteudo], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

async function carregarBase(cid, token) {
  const g = (tab, q) => fetch(`${SB_URL}/rest/v1/${tab}?${q}`, { headers: sbH(token) }).then(r => r.json()).catch(() => []);
  const filtro = `or=(cliente_id.eq.${cid},cliente_id.like.${cid}-*,cliente_id.eq.zeste)&deleted_at=is.null&select=id,cliente_id,dados`;
  const [ing, fic, pra] = await Promise.all([g("fin_ingredientes", filtro), g("fin_fichas", filtro), g("fin_pratos", filtro)]);
  const map = r => (Array.isArray(r) ? r.map(x => ({ ...x.dados, id: x.dados && x.dados.id ? x.dados.id : x.id, _cliente: x.cliente_id })) : []);
  return { ingredientes: map(ing), fichas: map(fic), pratos: map(pra).filter(p => p._cliente !== "zeste") };
}
async function carregarVendas(cid, token) { try { const r = await fetch(`${SB_URL}/rest/v1/fin_cmv?cliente_id=eq.${cid}&deleted_at=is.null&select=*`, { headers: sbH(token) }); const d = await r.json(); return Array.isArray(d) ? d.map(x => ({ ...(x.dados || {}), _row: x.id })) : []; } catch { return []; } }
async function salvarVendas(reg, cid, token) { const r = await fetch(`${SB_URL}/rest/v1/fin_cmv`, { method: "POST", headers: { ...sbH(token), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: reg.id, cliente_id: cid, dados: reg, updated_at: new Date().toISOString() }) }); return r.ok; }

export default function CMVPainel({ token, clienteId, mes, cmvCompras, faturamentoCaixa, podeEditar = true }) {
  const [base, setBase] = useState(null);
  const [vendas, setVendas] = useState({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [imp, setImp] = useState(null);
  const [salvo, setSalvo] = useState(false);
  const [aba, setAba] = useState("vendas"); // vendas | estoque
  const [cont, setCont] = useState({});      // insumo -> {inicial, compras, final}
  const [todos, setTodos] = useState(false);

  useEffect(() => {
    let vivo = true;
    Promise.all([carregarBase(clienteId, token), carregarVendas(clienteId, token)]).then(([b, regs]) => {
      if (!vivo) return;
      setBase(b);
      const reg = regs.find(r => r.tipo === "vendas" && r.competencia === mes);
      setVendas(reg ? (reg.qtds || {}) : {});
      const rc = regs.find(r => r.tipo === "contagem" && r.competencia === mes);
      setCont(rc ? (rc.itens || {}) : {});
      setLoading(false);
    });
    return () => { vivo = false; };
  }, [clienteId, mes]);

  const inp = { boxSizing: "border-box", border: `1.5px solid ${C.cinzaM}`, borderRadius: 7, padding: "6px 8px", fontSize: 13, background: "#fff", fontFamily: "inherit" };
  const card = { border: `1px solid ${C.border}`, borderRadius: 10, background: "#fff", padding: 14, marginBottom: 12 };
  const btnSec = { background: "#fff", border: `1.5px solid ${C.cinzaM}`, borderRadius: 8, padding: "8px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", color: C.azul };

  if (loading) return <div style={{ padding: 30, textAlign: "center", color: C.cinzaE }}>Carregando fichas e pratos…</div>;
  if (!base || !base.pratos.length) return <div style={{ ...card, textAlign: "center", color: C.cinzaE, fontStyle: "italic", padding: 28 }}>Nenhum prato cadastrado para este cliente — o CMV teórico precisa dos pratos com ficha e preço de venda.</div>;

  const fichasCalc = calcAllFichas(base.fichas, base.ingredientes, clienteId);
  const pratosCalc = base.pratos.map(p => calcPrato(p, base.ingredientes, fichasCalc, clienteId));
  const r = calcCMVTeorico(pratosCalc, vendas);
  const nomes = pratosCalc.map(p => p.nome);
  const cmvComprasPct = faturamentoCaixa > 0 ? (cmvCompras || 0) / faturamentoCaixa * 100 : 0;
  const difPP = (cmvComprasPct || 0) - (r.cmvPct || 0);

  const setQtd = (nome, v) => setVendas(q => ({ ...q, [nome]: v }));
  const salvar = async () => {
    setSalvando(true);
    await salvarVendas({ id: `vendas_${clienteId}_${mes}`, tipo: "vendas", competencia: mes, qtds: vendas }, clienteId, token);
    // gera consumo_teorico no razão: explode vendas → insumo (kg), 1 movimento por insumo na competência
    try {
      const consumo = consumoPorInsumo(pratosCalc, vendas, fichasCalc); // { nomeInsumo: kg }
      const byNome = {}; (base.ingredientes || []).forEach(i => { byNome[normN(i.nome)] = i; });
      const dataMov = `${mes}-15`; // meio do mês de competência
      const movs = Object.entries(consumo).filter(([, kg]) => kg > 0).map(([nome, kg]) => {
        const ing = byNome[normN(nome)] || {};
        return novoMov({ ingId: ing.id || nome, ingNome: nome, tipo: "consumo_teorico", qtdBase: kg, custoUnit: +ing.p || 0, origem: "vendas", origemRef: mes, data: dataMov });
      });
      await apagarMovimentosPorRef(clienteId, token, "vendas", mes); // não duplica se salvar de novo
      if (movs.length) await gravarMovimentos(movs, clienteId, token);
    } catch (e) { /* consumo é derivado; se falhar, as vendas já foram salvas */ }
    setSalvando(false); setSalvo(true); setTimeout(() => setSalvo(false), 1800);
  };
  const salvarContagem = async () => { setSalvando(true); await salvarVendas({ id: `contagem_${clienteId}_${mes}`, tipo: "contagem", competencia: mes, itens: cont }, clienteId, token); setSalvando(false); setSalvo(true); setTimeout(() => setSalvo(false), 1800); };
  const setC = (nome, campo, v) => setCont(c => ({ ...c, [nome]: { ...(c[nome] || {}), [campo]: v } }));
  const lerArquivo = f => { const rd = new FileReader(); rd.onload = () => setImp({ ...parseVendasCSV(String(rd.result || ""), nomes), nome: f.name }); rd.readAsText(f, "UTF-8"); };
  const aplicarImport = () => { const novo = { ...vendas }; imp.itens.forEach(i => { novo[i.nome] = String(i.qtd); }); setVendas(novo); setImp(null); };

  const uso = consumoPorInsumo(pratosCalc, vendas, fichasCalc);
  const ca = curvaA(uso, base.ingredientes);
  const listaEstoque = (todos ? ca : ca.filter(l => l.curvaA));
  const varres = calcVariancia(listaEstoque.map(l => ({ nome: l.nome, kg: l.kg, preco: l.preco, ...(cont[l.nome] || {}) })), r.receita);

  const ordenadas = [...r.linhas].sort((a, b) => (b.qtd * b.custo) - (a.qtd * a.custo) || b.qtd - a.qtd || a.nome.localeCompare(b.nome));

  return (
    <div>
      {/* RESUMO */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <div style={{ ...card, flex: "1 1 140px", marginBottom: 0, borderTop: `3px solid ${C.coral}` }}>
          <div style={{ fontSize: 10, color: C.cinzaE, fontWeight: 700 }}>CMV TEÓRICO (FICHAS)</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: C.coral }}>{r.receita > 0 ? pct1(r.cmvPct) : "—"}</div>
          <div style={{ fontSize: 11, color: C.cinzaE }}>{brl(r.custo)} de custo</div>
        </div>
        <div style={{ ...card, flex: "1 1 140px", marginBottom: 0, borderTop: `3px solid ${C.verde}` }}>
          <div style={{ fontSize: 10, color: C.cinzaE, fontWeight: 700 }}>RECEITA DAS VENDAS</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: C.verde }}>{brl(r.receita)}</div>
          <div style={{ fontSize: 11, color: C.cinzaE }}>margem {r.receita > 0 ? pct1(r.mcPct) : "—"}</div>
        </div>
        <div style={{ ...card, flex: "1 1 140px", marginBottom: 0, borderTop: `3px solid ${C.azul}` }}>
          <div style={{ fontSize: 10, color: C.cinzaE, fontWeight: 700 }}>CMV DE COMPRAS (CAIXA)</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: C.azul }}>{faturamentoCaixa > 0 ? pct1(cmvComprasPct) : "—"}</div>
          <div style={{ fontSize: 11, color: C.cinzaE }}>{brl(cmvCompras || 0)} comprado</div>
        </div>
      </div>

      {r.receita > 0 && faturamentoCaixa > 0 && (
        <div style={{ ...card, borderLeft: `4px solid ${Math.abs(difPP) > 5 ? C.coral : C.verde}` }}>
          <div style={{ fontSize: 13.5 }}>
            <b>Diferença: {difPP > 0 ? "+" : ""}{pct1(difPP)}</b> entre o que você <b>comprou</b> e o que as fichas dizem que foi <b>consumido</b>.{" "}
            {Math.abs(difPP) <= 5 ? "Dentro do esperado." : difPP > 0 ? "Comprou mais do que as vendas consumiriam — pode ser estoque subindo, desperdício, porção fora do padrão ou desvio." : "Comprou menos do que as vendas consumiriam — provavelmente consumiu estoque que já existia."}
          </div>
          <div style={{ fontSize: 11, color: C.cinzaE, marginTop: 5, fontStyle: "italic" }}>Para separar “estoque” de “perda” é preciso a contagem de estoque (próxima etapa).</div>
        </div>
      )}

      {r.alertas.length > 0 && <div style={{ ...card, borderColor: "#B8860B", background: "#FBF3E0", fontSize: 12.5, color: "#7a5a00" }}>
        ⚠ {r.alertas.length} prato(s) com venda mas <b>sem preço ou com custo incompleto</b> — o CMV teórico fica distorcido: {r.alertas.slice(0, 4).map(a => a.nome).join(" · ")}{r.alertas.length > 4 ? "…" : ""}
      </div>}

      {/* SUB-ABAS */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12, background: C.cinzaF, borderRadius: 9, padding: 3, width: "fit-content" }}>
        {[["vendas", "Vendas por prato"], ["estoque", "Contagem de estoque"]].map(([id, l]) => (
          <button key={id} onClick={() => setAba(id)} style={{ border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", background: aba === id ? "#fff" : "transparent", color: aba === id ? C.preto : C.cinzaE }}>{l}</button>
        ))}
      </div>

      {aba === "estoque" ? (
        <>
          {varres.comContagem.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div style={{ ...card, flex: "1 1 140px", marginBottom: 0, borderTop: `3px solid ${C.coral}` }}><div style={{ fontSize: 10, color: C.cinzaE, fontWeight: 700 }}>CMV REAL (CONTAGEM)</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: C.coral }}>{r.receita > 0 ? pct1(varres.realPct) : "—"}</div><div style={{ fontSize: 11, color: C.cinzaE }}>{brl(varres.realRS)}</div></div>
            <div style={{ ...card, flex: "1 1 140px", marginBottom: 0, borderTop: `3px solid ${C.azul}` }}><div style={{ fontSize: 10, color: C.cinzaE, fontWeight: 700 }}>CMV TEÓRICO (FICHAS)</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: C.azul }}>{r.receita > 0 ? pct1(varres.teoricoPct) : "—"}</div><div style={{ fontSize: 11, color: C.cinzaE }}>{brl(varres.teoricoRS)}</div></div>
            <div style={{ ...card, flex: "1 1 140px", marginBottom: 0, borderTop: `3px solid ${varres.quebraPct > 5 ? C.coral : C.verde}` }}><div style={{ fontSize: 10, color: C.cinzaE, fontWeight: 700 }}>PERDA / VARIÂNCIA</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: varres.quebraPct > 5 ? C.coral : C.verde }}>{pct1(varres.quebraPct)}</div><div style={{ fontSize: 11, color: C.cinzaE }}>{brl(varres.quebraRS)} a mais que a ficha</div></div>
          </div>}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10, alignItems: "center" }}>
            {podeEditar && <button onClick={salvarContagem} disabled={salvando} style={{ background: C.verde, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{salvando ? "Salvando…" : "Salvar contagem"}</button>}
            <button onClick={() => setTodos(t => !t)} style={btnSec}>{todos ? "Mostrar só a curva A" : `Mostrar todos (${ca.length})`}</button>
            {salvo && <span style={{ color: C.verde, fontSize: 12, fontWeight: 600 }}>✓ salvo</span>}
          </div>

          <div style={{ ...card, padding: 0 }}>
            <div style={{ padding: "11px 14px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>Contar {listaEstoque.length} insumo(s) · {mesLabel(mes)}</div>
              <div style={{ fontSize: 11.5, color: C.cinzaE, marginTop: 2 }}>{todos ? "Todos os insumos usados nas vendas." : "Estes concentram ~80% do custo — contar só eles já dá o CMV real com boa precisão."}</div>
            </div>
            <div style={{ display: "flex", gap: 6, padding: "6px 14px", background: C.cinzaF, fontSize: 10, fontWeight: 700, color: C.cinzaE }}>
              <span style={{ flex: 1 }}>INSUMO</span><span style={{ width: 60, textAlign: "right" }}>INICIAL</span><span style={{ width: 60, textAlign: "right" }}>COMPRAS</span><span style={{ width: 60, textAlign: "right" }}>CONTOU</span><span style={{ width: 66, textAlign: "right" }}>DEVERIA</span><span style={{ width: 78, textAlign: "right" }}>PERDA</span>
            </div>
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {varres.linhas.map(l => (
                <div key={l.nome} style={{ display: "flex", gap: 6, alignItems: "center", padding: "7px 14px", borderBottom: `1px solid ${C.cinzaF}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.nome}</div>
                    <div style={{ fontSize: 10.5, color: C.cinzaE }}>ficha diz {l.kg.toFixed(2)} kg · {brl(l.preco)}/kg</div>
                  </div>
                  {["inicial", "compras", "final"].map(campo => (
                    <input key={campo} type="text" inputMode="decimal" value={(cont[l.nome] || {})[campo] ?? ""} onChange={e => setC(l.nome, campo, e.target.value.replace(/[^0-9.,]/g, ""))} disabled={!podeEditar} placeholder="kg" style={{ ...inp, width: 60, textAlign: "right" }} />
                  ))}
                  <span style={{ width: 66, textAlign: "right", fontSize: 12.5, color: C.cinzaE }}>{l.temContagem || l.inicial || l.compras ? l.deveriaTer.toFixed(2) : "—"}</span>
                  <span style={{ width: 78, textAlign: "right", fontSize: 12.5, fontWeight: 700, color: l.quebraRS == null ? C.cinzaM : (l.quebraRS > 0 ? C.coral : C.verde) }}>{l.quebraRS == null ? "—" : brl(l.quebraRS)}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.cinzaE, fontStyle: "italic", padding: "9px 14px" }}>Em kg (ou L/un conforme o insumo). <b>Deveria ter</b> = inicial + compras − o que as vendas consumiriam pelas fichas. A diferença para o que você contou é a perda: desperdício, porção fora do padrão ou desvio.</div>
          </div>
        </>
      ) : (<>

      {/* AÇÕES */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10, alignItems: "center" }}>
        {podeEditar && <label style={{ ...btnSec, display: "inline-flex", alignItems: "center", gap: 6 }}>⬆ Importar vendas<input type="file" accept=".csv,.txt,text/csv" style={{ display: "none" }} onChange={e => { const f = e.target.files && e.target.files[0]; if (f) lerArquivo(f); e.target.value = ""; }} /></label>}
        <button onClick={() => baixarArquivo("modelo_vendas_por_produto.csv", modeloVendasCSV(nomes))} style={btnSec}>⬇ Modelo</button>
        {podeEditar && <button onClick={salvar} disabled={salvando} style={{ background: C.verde, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{salvando ? "Salvando…" : "Salvar vendas"}</button>}
        {salvo && <span style={{ color: C.verde, fontSize: 12, fontWeight: 600 }}>✓ salvo</span>}
      </div>

      {imp && <div style={{ ...card, borderColor: C.azul }}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15 }}>Importar “{imp.nome}”</div>
        <div style={{ fontSize: 13, marginBottom: 8 }}><b style={{ color: imp.itens.length ? C.verde : C.coral }}>{imp.itens.length} prato(s)</b> reconhecido(s){imp.avisos.length ? ` · ${imp.avisos.length} não reconhecido(s)` : ""}.</div>
        {imp.avisos.length > 0 && <div style={{ fontSize: 11.5, color: C.coral, marginBottom: 8, maxHeight: 70, overflowY: "auto" }}>{imp.avisos.slice(0, 5).map((a, i) => <div key={i}>⚠ {a}</div>)}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={aplicarImport} disabled={!imp.itens.length} style={{ background: imp.itens.length ? C.verde : C.cinzaM, color: "#fff", border: "none", padding: "8px 15px", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Preencher a grade</button>
          <button onClick={() => setImp(null)} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 8, padding: "8px 14px", fontSize: 12.5, cursor: "pointer", color: C.cinzaE }}>Cancelar</button>
        </div>
      </div>}

      {/* GRADE */}
      <div style={{ ...card, padding: 0 }}>
        <div style={{ padding: "11px 14px", borderBottom: `1px solid ${C.border}`, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>Vendas por prato · {mesLabel(mes)}</div>
        <div style={{ display: "flex", gap: 8, padding: "6px 14px", background: C.cinzaF, fontSize: 10, fontWeight: 700, color: C.cinzaE, letterSpacing: ".04em" }}>
          <span style={{ flex: 1 }}>PRATO</span><span style={{ width: 62, textAlign: "right" }}>QTD</span><span style={{ width: 74, textAlign: "right" }}>CUSTO UN</span><span style={{ width: 62, textAlign: "right" }}>CMV%</span><span style={{ width: 82, textAlign: "right" }}>CUSTO TOTAL</span><span style={{ width: 82, textAlign: "right" }}>MARGEM R$</span>
        </div>
        <div style={{ maxHeight: 460, overflowY: "auto" }}>
          {ordenadas.map(l => (
            <div key={l.nome} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 14px", borderBottom: `1px solid ${C.cinzaF}`, background: l.qtd > 0 ? "#fff" : "#FCFCFA" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: l.qtd > 0 ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.nome}{l.usaFatia ? <span style={{ fontSize: 10, color: C.azul }}> · fatia</span> : ""}</div>
                {(l.semPreco || l.custoIncompleto) && <div style={{ fontSize: 10.5, color: C.coral }}>{l.semPreco ? "sem preço de venda" : "custo incompleto"}</div>}
              </div>
              <input type="text" inputMode="decimal" value={vendas[l.nome] ?? ""} onChange={e => setQtd(l.nome, e.target.value.replace(/[^0-9.,]/g, ""))} disabled={!podeEditar} placeholder="0" style={{ ...inp, width: 62, textAlign: "right" }} />
              <span style={{ width: 74, textAlign: "right", fontSize: 12.5, color: C.cinzaE }}>{l.custoUn > 0 ? brl(l.custoUn) : "—"}</span>
              <span style={{ width: 62, textAlign: "right", fontSize: 12.5, fontWeight: 600, color: l.cmvPct > 35 ? C.coral : C.preto }}>{l.precoUn > 0 ? pct1(l.cmvPct) : "—"}</span>
              <span style={{ width: 82, textAlign: "right", fontSize: 13, fontWeight: 700 }}>{l.qtd > 0 ? brl(l.custo) : "—"}</span>
              <span style={{ width: 82, textAlign: "right", fontSize: 13, color: l.mcRS >= 0 ? C.verde : C.coral }}>{l.qtd > 0 ? brl(l.mcRS) : "—"}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: C.cinzaE, fontStyle: "italic", padding: "9px 14px" }}>Custo e CMV% vêm das fichas técnicas (motor de custo do sistema). Preencha a quantidade vendida no mês — ou importe o relatório de vendas por produto do PDV.</div>
      </div>
      </>)}
    </div>
  );
}

// ============================================================
// ESTOQUE — RAZÃO DE MOVIMENTOS (Fase 2)
// Fonte única do saldo. Toda entrada/saída/consumo/perda/ajuste
// vira uma linha em est_movimentos. Saldo é DERIVADO daqui.
// Funções puras (testáveis) + acesso ao banco.
// ============================================================

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
export const uidMov = () => "mov_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// tipos e se somam (+) ou subtraem (−) do estoque
export const TIPOS_MOV = {
  entrada_nfe: { sinal: +1, rot: "Entrada (NF-e)", cor: "#497A5D" },
  entrada_manual: { sinal: +1, rot: "Entrada manual", cor: "#497A5D" },
  consumo_teorico: { sinal: -1, rot: "Consumo (vendas)", cor: "#1A4F71" },
  perda: { sinal: -1, rot: "Perda / desperdício", cor: "#C4502B" },
  saida_manual: { sinal: -1, rot: "Saída manual", cor: "#C4502B" },
  ajuste_contagem: { sinal: 0, rot: "Ajuste de contagem", cor: "#B8860B" }, // sinal 0: não entra no cálculo do esperado (é a correção do próprio esperado)
};
const sinal = tipo => (TIPOS_MOV[tipo] ? TIPOS_MOV[tipo].sinal : 0);

// cria um objeto de movimento (não grava — só monta)
export function novoMov({ ingId, ingNome, tipo, qtdBase, custoUnit = 0, origem, origemRef = "", usuario = "", data, obs = "" }) {
  return { id: uidMov(), data: data || new Date().toISOString().slice(0, 10), ingId, ingNome, tipo, qtdBase: +qtdBase || 0, custoUnit: +custoUnit || 0, origem: origem || tipo, origemRef, usuario, obs };
}

// ── SALDO ESPERADO ───────────────────────────────────────────
// Para cada insumo: parte da última contagem fechada (ancora) e soma/subtrai
// os movimentos posteriores. Sem contagem, parte de zero e soma tudo.
// contagens: [{ fechadaEm|data, itens: { ingId: {contadoBase} } }] (só as fechadas)
export function saldoEsperado(movimentos, contagens, ingId) {
  const ancora = ultimaContagemDoInsumo(contagens, ingId);
  let saldo = ancora ? ancora.qtd : 0;
  const desde = ancora ? ancora.data : "";
  (movimentos || []).forEach(m => {
    if (m.ingId !== ingId) return;
    if (desde && (m.data || "") < desde) return;         // ignora o que é anterior à âncora
    saldo += sinal(m.tipo) * (+m.qtdBase || 0);
  });
  return saldo;
}
// última contagem fechada que inclui o insumo (com data e quantidade contada)
export function ultimaContagemDoInsumo(contagens, ingId) {
  const fechadas = (contagens || []).filter(c => c.status === "fechada" && c.itens && c.itens[ingId] != null)
    .sort((a, b) => (b.fechadaEm || b.data || "").localeCompare(a.fechadaEm || a.data || ""));
  if (!fechadas.length) return null;
  const c = fechadas[0]; const it = c.itens[ingId];
  const qtd = typeof it === "object" ? (+it.contadoBase || 0) : (+it || 0);
  return { data: (c.fechadaEm || c.data || "").slice(0, 10), qtd };
}

// saldo esperado de TODOS os insumos (mapa ingId -> kg) — para a tela de saldo
export function saldosEsperados(movimentos, contagens, ingIds) {
  const out = {};
  (ingIds || []).forEach(id => { out[id] = saldoEsperado(movimentos, contagens, id); });
  return out;
}

// resumo por tipo no período (mês YYYY-MM) — para o extrato
export function resumoPeriodo(movimentos, mk) {
  const r = {};
  (movimentos || []).forEach(m => {
    if (mk && (m.data || "").slice(0, 7) !== mk) return;
    const k = m.tipo; r[k] = r[k] || { qtd: 0, valor: 0, n: 0 };
    r[k].qtd += (+m.qtdBase || 0); r[k].valor += (+m.qtdBase || 0) * (+m.custoUnit || 0); r[k].n += 1;
  });
  return r;
}

// ── ACESSO AO BANCO ──────────────────────────────────────────
export async function carregarMovimentos(clienteId, token, { desde } = {}) {
  try {
    let q = `est_movimentos?cliente_id=eq.${clienteId}&deleted_at=is.null&select=*&order=data.desc,created_at.desc`;
    const r = await fetch(`${SB_URL}/rest/v1/${q}`, { headers: sbH(token) });
    const d = await r.json();
    let arr = Array.isArray(d) ? d.map(x => ({ ...(x.dados || {}), _row: x.id })) : [];
    if (desde) arr = arr.filter(m => (m.data || "") >= desde);
    return arr;
  } catch { return []; }
}
export async function carregarContagens(clienteId, token) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/est_contagens?cliente_id=eq.${clienteId}&deleted_at=is.null&select=*&order=created_at.desc`, { headers: sbH(token) });
    const d = await r.json();
    return Array.isArray(d) ? d.map(x => ({ ...(x.dados || {}), _row: x.id })) : [];
  } catch { return []; }
}
export async function gravarMovimentos(movs, clienteId, token) {
  if (!movs || !movs.length) return true;
  const body = movs.map(m => ({ id: m.id, cliente_id: clienteId, dados: m, updated_at: new Date().toISOString() }));
  const r = await fetch(`${SB_URL}/rest/v1/est_movimentos`, { method: "POST", headers: { ...sbH(token), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(body) });
  return r.ok;
}
// remove movimentos de uma origem (ex.: reprocessar uma NF-e ou uma competência de vendas)
export async function apagarMovimentosPorRef(clienteId, token, origem, origemRef) {
  try {
    const movs = await carregarMovimentos(clienteId, token);
    const alvo = movs.filter(m => m.origem === origem && m.origemRef === origemRef);
    for (const m of alvo) await fetch(`${SB_URL}/rest/v1/est_movimentos?id=eq.${m._row}`, { method: "PATCH", headers: sbH(token), body: JSON.stringify({ deleted_at: new Date().toISOString() }) });
    return alvo.length;
  } catch { return 0; }
}

// ============================================================
// HISTÓRICO DE PREÇO — evento "de → para" por insumo
// Alimenta o card da manteiga (R$18 → R$21 · +16,7% · N pratos)
// e o Cockpit ("N insumos subiram de preço este mês").
// Funções puras + acesso ao banco.
// ============================================================

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbHp = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
const uidH = () => "ph_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// variação percentual de → para
export function variacaoPct(de, para) {
  const d = +de || 0, p = +para || 0;
  if (d <= 0) return null;              // sem preço anterior: não é "mudança", é primeiro preço
  return (p - d) / d * 100;
}

// monta o evento (não grava)
export function novoEventoPreco({ ingId, ingNome, de, para, origem = "manual", origemRef = "", usuario = "", data }) {
  return { id: uidH(), data: data || new Date().toISOString().slice(0, 10), ingId, ingNome, de: +de || 0, para: +para || 0, pct: variacaoPct(de, para), origem, origemRef, usuario };
}

// quais pratos usam um insumo (direto OU via ficha) → "pratos afetados"
// pratos: [{nome, componentes:[{tipo,nomeRef}]}] · fichas: [{nome, itens:[{tipo,nomeRef}]}]
export function pratosAfetados(ingNome, pratos, fichas) {
  const alvo = norm(ingNome);
  // fichas que contêm o insumo (direto ou recursivo por ficha-dentro-de-ficha)
  const fichaMap = {}; (fichas || []).forEach(f => { fichaMap[f.nome] = f; });
  const fichaUsa = {};
  const resolve = (nomeFicha, vistos = new Set()) => {
    if (fichaUsa[nomeFicha] !== undefined) return fichaUsa[nomeFicha];
    if (vistos.has(nomeFicha)) return false; vistos.add(nomeFicha);
    const f = fichaMap[nomeFicha]; if (!f) return false;
    let usa = (f.itens || []).some(it => it.tipo !== "ficha" && norm(it.nomeRef) === alvo);
    if (!usa) usa = (f.itens || []).some(it => it.tipo === "ficha" && resolve(it.nomeRef, vistos));
    fichaUsa[nomeFicha] = usa; return usa;
  };
  (fichas || []).forEach(f => resolve(f.nome));
  const nomes = [];
  (pratos || []).forEach(p => {
    const comps = p.componentes || p.comps || [];
    const usa = comps.some(c => (c.tipo !== "ficha" && norm(c.nomeRef) === alvo) || (c.tipo === "ficha" && fichaUsa[c.nomeRef]));
    if (usa) nomes.push(p.nome);
  });
  return nomes;
}
const norm = s => (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

// resumo do mês para o Cockpit: quantos insumos subiram/desceram
export function resumoPrecoMes(eventos, mk) {
  const doMes = (eventos || []).filter(e => (e.data || "").slice(0, 7) === mk && e.pct != null);
  const subiram = doMes.filter(e => e.pct > 0.5);
  const desceram = doMes.filter(e => e.pct < -0.5);
  return { subiram: subiram.length, desceram: desceram.length, eventos: doMes, maiorAlta: subiram.sort((a, b) => b.pct - a.pct)[0] || null };
}

// ── banco ──
export async function carregarHistPreco(clienteId, token) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/preco_historico?cliente_id=eq.${clienteId}&deleted_at=is.null&select=*&order=data.desc,created_at.desc`, { headers: sbHp(token) });
    const d = await r.json();
    return Array.isArray(d) ? d.map(x => ({ ...(x.dados || {}), _row: x.id })) : [];
  } catch { return []; }
}
export async function gravarEventosPreco(eventos, clienteId, token) {
  if (!eventos || !eventos.length) return true;
  const body = eventos.map(e => ({ id: e.id, cliente_id: clienteId, dados: e, updated_at: new Date().toISOString() }));
  const r = await fetch(`${SB_URL}/rest/v1/preco_historico`, { method: "POST", headers: { ...sbHp(token), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(body) });
  return r.ok;
}

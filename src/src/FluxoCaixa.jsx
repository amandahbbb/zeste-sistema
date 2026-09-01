import { useState, useEffect } from "react";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const C = { preto: "#0E0E0C", branco: "#fff", lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B", cinzaF: "#F0EEE8", cinzaM: "#D9D5C8", cinzaE: "#6B6B5E", border: "#E3E1D9" };

const ENTRADA_CATS = ["Vendas", "Delivery", "Eventos", "Outras receitas"];
const SAIDA_CATS = ["Insumos / Compras", "Folha / Equipe", "Aluguel", "Água / Luz / Gás", "Impostos", "Marketing", "Manutenção", "Outras despesas"];
const brl = n => "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const mesKey = d => (d || "").slice(0, 7);
const mesLabel = mk => { const [y, m] = mk.split("-"); const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]; return `${nomes[+m - 1]}/${y}`; };
const mesHoje = () => new Date().toISOString().slice(0, 7);
const somaMes = (ls, mk, tipo) => ls.filter(l => mesKey(l.data) === mk && l.tipo === tipo).reduce((a, l) => a + (Number(l.valor) || 0), 0);
const saldoAcumulado = (ls, mk) => ls.filter(l => mesKey(l.data) <= mk).reduce((a, l) => a + (l.tipo === "entrada" ? 1 : -1) * (Number(l.valor) || 0), 0);
function porCategoria(ls, mk, tipo) {
  const m = {};
  ls.filter(l => mesKey(l.data) === mk && l.tipo === tipo).forEach(l => { const k = l.categoria || "—"; m[k] = (m[k] || 0) + (Number(l.valor) || 0); });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
function mesesComDados(ls) {
  const s = new Set(ls.map(l => mesKey(l.data)).filter(Boolean)); s.add(mesHoje());
  return [...s].sort().reverse();
}

async function carregar(clienteId, token) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/fin_cliente_fluxo?cliente_id=eq.${clienteId}&deleted_at=is.null&select=*&order=created_at.desc`, { headers: sbH(token) });
    const d = await r.json(); return Array.isArray(d) ? d.map(x => ({ ...(x.dados || {}), _row: x.id })) : [];
  } catch { return []; }
}
async function upsert(item, clienteId, token) {
  const r = await fetch(`${SB_URL}/rest/v1/fin_cliente_fluxo`, { method: "POST", headers: { ...sbH(token), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: item.id, cliente_id: clienteId, dados: item, updated_at: new Date().toISOString() }) });
  return r.ok;
}
async function excluir(id, token) {
  const r = await fetch(`${SB_URL}/rest/v1/fin_cliente_fluxo?id=eq.${id}`, { method: "PATCH", headers: sbH(token), body: JSON.stringify({ deleted_at: new Date().toISOString() }) });
  return r.ok;
}

export default function FluxoCaixa({ token, clienteId, clienteNome, podeEditar = true, onBack }) {
  const [ls, setLs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(mesHoje());
  const [addOpen, setAddOpen] = useState(false);
  const hoje = new Date().toISOString().slice(0, 10);
  const [nv, setNv] = useState({ data: hoje, tipo: "entrada", categoria: ENTRADA_CATS[0], descricao: "", valor: "" });

  useEffect(() => { carregar(clienteId, token).then(d => { setLs(d); setLoading(false); }); }, [clienteId]);

  const inp = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.cinzaM}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, background: "#fff", fontFamily: "inherit" };
  const lbl = { fontSize: 10, color: C.cinzaE, fontWeight: 700, letterSpacing: ".04em", display: "block", marginBottom: 3 };
  const card = { border: `1px solid ${C.border}`, borderRadius: 10, background: "#fff", padding: 14, marginBottom: 12 };

  const entradas = somaMes(ls, mes, "entrada");
  const saidas = somaMes(ls, mes, "saida");
  const saldoMes = entradas - saidas;
  const acumulado = saldoAcumulado(ls, mes);
  const doMes = ls.filter(l => mesKey(l.data) === mes).sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const catSaidas = porCategoria(ls, mes, "saida");
  const maxCat = catSaidas.length ? catSaidas[0][1] : 1;
  const meses = mesesComDados(ls);

  const salvar = async () => {
    const valor = parseFloat(String(nv.valor).replace(",", ".")) || 0;
    if (valor <= 0) return;
    const item = { id: uid(), data: nv.data, tipo: nv.tipo, categoria: nv.categoria, descricao: nv.descricao, valor };
    setLs(p => [{ ...item, _row: item.id }, ...p]);
    setAddOpen(false); setNv({ data: hoje, tipo: "entrada", categoria: ENTRADA_CATS[0], descricao: "", valor: "" });
    await upsert(item, clienteId, token);
  };
  const remover = async (l) => { setLs(p => p.filter(x => x.id !== l.id)); await excluir(l.id, token); };
  const cats = nv.tipo === "entrada" ? ENTRADA_CATS : SAIDA_CATS;

  return (
    <div style={{ fontFamily: "'Barlow',sans-serif", color: C.preto }}>
      <div style={{ padding: 16, maxWidth: 760, margin: "0 auto" }}>
        {onBack && <button onClick={onBack} style={{ background: "none", border: "none", color: C.azul, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>‹ Voltar</button>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700 }}>Fluxo de caixa{clienteNome ? ` · ${clienteNome}` : ""}</div>
            <div style={{ fontSize: 12.5, color: C.cinzaE }}>Entradas e saídas do seu caixa, mês a mês.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <select value={mes} onChange={e => setMes(e.target.value)} style={{ ...inp, width: "auto" }}>
              {meses.map(mk => <option key={mk} value={mk}>{mesLabel(mk)}</option>)}
            </select>
          </div>
        </div>

        {loading ? <div style={{ padding: 30, textAlign: "center", color: C.cinzaE }}>Carregando…</div> : <>
          {/* KPIs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div style={{ ...card, flex: "1 1 150px", marginBottom: 0, borderTop: `3px solid ${C.verde}` }}><div style={lbl}>ENTRADAS DO MÊS</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: C.verde }}>{brl(entradas)}</div></div>
            <div style={{ ...card, flex: "1 1 150px", marginBottom: 0, borderTop: `3px solid ${C.coral}` }}><div style={lbl}>SAÍDAS DO MÊS</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: C.coral }}>{brl(saidas)}</div></div>
            <div style={{ ...card, flex: "1 1 150px", marginBottom: 0, borderTop: `3px solid ${saldoMes >= 0 ? C.azul : C.coral}` }}><div style={lbl}>SALDO DO MÊS</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: saldoMes >= 0 ? C.azul : C.coral }}>{brl(saldoMes)}</div></div>
            <div style={{ ...card, flex: "1 1 150px", marginBottom: 0, borderTop: `3px solid ${C.cinzaM}` }}><div style={lbl}>SALDO ACUMULADO</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: acumulado >= 0 ? C.preto : C.coral }}>{brl(acumulado)}</div></div>
          </div>

          {podeEditar && (addOpen ? (
            <div style={{ ...card, borderColor: C.lima }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Novo lançamento</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <div style={{ flex: "1 1 120px" }}><label style={lbl}>DATA</label><input type="date" value={nv.data} onChange={e => setNv(v => ({ ...v, data: e.target.value }))} style={inp} /></div>
                <div style={{ flex: "1 1 130px" }}><label style={lbl}>TIPO</label><select value={nv.tipo} onChange={e => setNv(v => ({ ...v, tipo: e.target.value, categoria: (e.target.value === "entrada" ? ENTRADA_CATS : SAIDA_CATS)[0] }))} style={inp}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div>
                <div style={{ flex: "1 1 170px" }}><label style={lbl}>CATEGORIA</label><select value={nv.categoria} onChange={e => setNv(v => ({ ...v, categoria: e.target.value }))} style={inp}>{cats.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div style={{ flex: "1 1 130px" }}><label style={lbl}>VALOR (R$)</label><input type="text" inputMode="decimal" value={nv.valor} onChange={e => setNv(v => ({ ...v, valor: e.target.value.replace(/[^0-9.,]/g, "") }))} placeholder="0,00" style={inp} /></div>
                <div style={{ flex: "1 1 100%" }}><label style={lbl}>DESCRIÇÃO (OPCIONAL)</label><input value={nv.descricao} onChange={e => setNv(v => ({ ...v, descricao: e.target.value }))} placeholder="ex.: feira da semana, vendas do dia" style={inp} /></div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={salvar} style={{ background: C.lima, color: C.preto, border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Salvar lançamento</button>
                <button onClick={() => setAddOpen(false)} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 8, padding: "10px 16px", fontSize: 14, cursor: "pointer", color: C.cinzaE }}>Cancelar</button>
              </div>
            </div>
          ) : <button onClick={() => setAddOpen(true)} style={{ background: C.lima, color: C.preto, border: "none", padding: "11px 18px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 12 }}>+ Novo lançamento</button>)}

          {/* QUEBRA POR CATEGORIA (saídas) */}
          {catSaidas.length > 0 && <div style={card}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Para onde foi o dinheiro ({mesLabel(mes)})</div>
            {catSaidas.map(([cat, val]) => (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 2 }}><span>{cat}</span><b>{brl(val)}</b></div>
                <div style={{ height: 7, background: C.cinzaF, borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${Math.max(3, val / maxCat * 100)}%`, height: "100%", background: C.coral }} /></div>
              </div>
            ))}
          </div>}

          {/* LISTA */}
          <div style={{ ...card, padding: 0 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>Lançamentos de {mesLabel(mes)} ({doMes.length})</div>
            {doMes.length === 0 ? <div style={{ padding: 26, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum lançamento neste mês.</div> :
              doMes.map((l, i) => (
                <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: i < doMes.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
                  <div style={{ width: 44, flexShrink: 0, textAlign: "center", fontSize: 11, color: C.cinzaE }}>{(l.data || "").slice(8, 10)}/{(l.data || "").slice(5, 7)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.categoria}</div>
                    {l.descricao && <div style={{ fontSize: 12, color: C.cinzaE }}>{l.descricao}</div>}
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16, color: l.tipo === "entrada" ? C.verde : C.coral, whiteSpace: "nowrap" }}>{l.tipo === "entrada" ? "+" : "−"} {brl(l.valor)}</div>
                  {podeEditar && <button onClick={() => { if (window.confirm("Excluir este lançamento?")) remover(l); }} style={{ background: "none", border: "none", color: C.cinzaM, fontSize: 16, cursor: "pointer" }}>×</button>}
                </div>
              ))}
          </div>
        </>}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const C = { preto: "#0E0E0C", branco: "#fff", lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B", cinzaF: "#F0EEE8", cinzaM: "#B0AC9E", cinzaE: "#4A4A42", border: "#E3E1D9" };

const num = v => { const n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isNaN(n) ? 0 : n; };
const kg = n => (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " kg";
const g = n => Math.round((Number(n) || 0) * 1000) + " g";
const pct = n => (Math.round((Number(n) || 0) * 10) / 10).toLocaleString("pt-BR") + "%";
const mesKey = d => (d || "").slice(0, 7);
const mesLabel = mk => { const [y, m] = mk.split("-"); const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]; return `${nomes[+m - 1]}/${y}`; };
const mesHoje = () => new Date().toISOString().slice(0, 7);

const kgCons = it => Math.max(0, num(it.produzido) - num(it.sobra));
const despItem = it => num(it.produzido) > 0 ? num(it.sobra) / num(it.produzido) * 100 : 0;
function totaisDia(dia) {
  const its = dia.itens || [];
  const prod = its.reduce((a, i) => a + num(i.produzido), 0);
  const sobra = its.reduce((a, i) => a + num(i.sobra), 0);
  const cons = its.reduce((a, i) => a + kgCons(i), 0);
  return { prod, sobra, cons, desp: prod > 0 ? sobra / prod * 100 : 0, porPessoa: num(dia.nClientes) > 0 ? cons / num(dia.nClientes) : 0 };
}
function resumoPreparacoes(dias) {
  const m = {};
  dias.forEach(d => (d.itens || []).forEach(it => {
    const k = (it.nome || "—").trim(); if (!k) return;
    const r = m[k] || (m[k] = { nome: k, prod: 0, sobra: 0, cons: 0, ndias: 0, pessoas: 0 });
    r.prod += num(it.produzido); r.sobra += num(it.sobra); r.cons += kgCons(it); r.ndias += 1; r.pessoas += num(d.nClientes);
  }));
  return Object.values(m).map(r => ({ ...r, desp: r.prod > 0 ? r.sobra / r.prod * 100 : 0, consDia: r.ndias ? r.cons / r.ndias : 0, porPessoa: r.pessoas ? r.cons / r.pessoas : 0 })).sort((a, b) => b.cons - a.cons);
}

async function carregar(clienteId, cid, token) {
  try {
    const [rd, rf] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/buffet_producao?cliente_id=eq.${clienteId}&deleted_at=is.null&select=*&order=created_at.desc`, { headers: sbH(token) }).then(r => r.json()),
      fetch(`${SB_URL}/rest/v1/fin_fichas?or=(cliente_id.eq.${cid},cliente_id.like.${cid}-*)&deleted_at=is.null&select=dados`, { headers: sbH(token) }).then(r => r.json()),
    ]);
    const dias = Array.isArray(rd) ? rd.map(x => ({ ...(x.dados || {}), _row: x.id })) : [];
    const fichas = Array.isArray(rf) ? rf.map(x => (x.dados && x.dados.nome) || "").filter(Boolean) : [];
    return { dias, fichas };
  } catch { return { dias: [], fichas: [] }; }
}
async function upsert(item, clienteId, token) { const r = await fetch(`${SB_URL}/rest/v1/buffet_producao`, { method: "POST", headers: { ...sbH(token), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: item.id, cliente_id: clienteId, dados: item, updated_at: new Date().toISOString() }) }); return r.ok; }
async function excluir(id, token) { const r = await fetch(`${SB_URL}/rest/v1/buffet_producao?id=eq.${id}`, { method: "PATCH", headers: sbH(token), body: JSON.stringify({ deleted_at: new Date().toISOString() }) }); return r.ok; }

export default function Buffet({ token, clienteId, clienteNome, podeEditar = true, onBack }) {
  const [dias, setDias] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(mesHoje());
  const [edit, setEdit] = useState(null); // dia sendo editado (cópia)

  useEffect(() => { carregar(clienteId, clienteId, token).then(({ dias, fichas }) => { setDias(dias); setFichas(fichas); setLoading(false); }); }, [clienteId]);

  const inp = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.cinzaM}`, borderRadius: 8, padding: "8px 10px", fontSize: 14, background: "#fff", fontFamily: "inherit" };
  const lbl = { fontSize: 10, color: C.cinzaE, fontWeight: 700, letterSpacing: ".04em", display: "block", marginBottom: 3 };
  const card = { border: `1px solid ${C.border}`, borderRadius: 10, background: "#fff", padding: 14, marginBottom: 12 };

  const doMes = dias.filter(d => mesKey(d.data) === mes).sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const meses = (() => { const s = new Set(dias.map(d => mesKey(d.data)).filter(Boolean)); s.add(mesHoje()); return [...s].sort().reverse(); })();
  const resumo = resumoPreparacoes(doMes);
  const totalMes = doMes.reduce((a, d) => { const t = totaisDia(d); return { prod: a.prod + t.prod, sobra: a.sobra + t.sobra, cons: a.cons + t.cons }; }, { prod: 0, sobra: 0, cons: 0 });
  const despMes = totalMes.prod > 0 ? totalMes.sobra / totalMes.prod * 100 : 0;

  const novoDia = () => setEdit({ id: uid(), data: new Date().toISOString().slice(0, 10), nClientes: "", faturamento: "", itens: [{ id: uid(), nome: "", produzido: "", sobra: "" }] });
  const upDia = patch => setEdit(d => ({ ...d, ...patch }));
  const upItem = (i, patch) => setEdit(d => ({ ...d, itens: d.itens.map((x, j) => j === i ? { ...x, ...patch } : x) }));
  const addItem = () => setEdit(d => ({ ...d, itens: [...d.itens, { id: uid(), nome: "", produzido: "", sobra: "" }] }));
  const delItem = i => setEdit(d => ({ ...d, itens: d.itens.filter((_, j) => j !== i) }));
  const salvar = async () => { const clean = { ...edit, itens: edit.itens.filter(i => (i.nome || "").trim() || num(i.produzido) || num(i.sobra)) }; setDias(p => p.find(x => x.id === clean.id) ? p.map(x => x.id === clean.id ? clean : x) : [clean, ...p]); setEdit(null); await upsert(clean, clienteId, token); };
  const remover = async (d) => { setDias(p => p.filter(x => x.id !== d.id)); await excluir(d.id, token); };

  // ─────────── EDITOR DE UM DIA ───────────
  if (edit) {
    const t = totaisDia(edit);
    return (
      <div style={{ fontFamily: "'Barlow',sans-serif", color: C.preto }}>
        <div style={{ padding: 16, maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={() => setEdit(null)} style={{ background: "none", border: "none", color: C.azul, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>‹ Voltar</button>
            <button onClick={salvar} style={{ background: C.verde, color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Salvar dia</button>
          </div>
          <div style={card}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <div style={{ flex: "1 1 130px" }}><label style={lbl}>DATA</label><input type="date" value={edit.data} onChange={e => upDia({ data: e.target.value })} style={inp} /></div>
              <div style={{ flex: "1 1 120px" }}><label style={lbl}>Nº DE CLIENTES</label><input type="text" inputMode="numeric" value={edit.nClientes} onChange={e => upDia({ nClientes: e.target.value.replace(/[^0-9]/g, "") })} placeholder="ex.: 120" style={inp} /></div>
              <div style={{ flex: "1 1 140px" }}><label style={lbl}>FATURAMENTO DO BUFFET (R$, opc.)</label><input type="text" inputMode="decimal" value={edit.faturamento} onChange={e => upDia({ faturamento: e.target.value.replace(/[^0-9.,]/g, "") })} placeholder="opcional" style={inp} /></div>
            </div>
          </div>

          <datalist id="prep-fichas">{fichas.map(f => <option key={f} value={f} />)}</datalist>
          <div style={{ ...card, padding: 0 }}>
            <div style={{ display: "flex", gap: 8, padding: "8px 12px", background: C.cinzaF, fontSize: 10, fontWeight: 700, color: C.cinzaE, letterSpacing: ".04em" }}>
              <span style={{ flex: 1 }}>PREPARAÇÃO</span><span style={{ width: 82, textAlign: "right" }}>PRODUZIDO</span><span style={{ width: 72, textAlign: "right" }}>SOBRA</span><span style={{ width: 78, textAlign: "right" }}>CONSUMIDO</span><span style={{ width: 54, textAlign: "right" }}>DESP.</span><span style={{ width: 20 }}></span>
            </div>
            {edit.itens.map((it, i) => (
              <div key={it.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 12px", borderBottom: `1px solid ${C.cinzaF}` }}>
                <input list="prep-fichas" value={it.nome} onChange={e => upItem(i, { nome: e.target.value })} placeholder="arroz, feijão, salada…" style={{ ...inp, flex: 1, padding: "6px 8px" }} />
                <input type="text" inputMode="decimal" value={it.produzido} onChange={e => upItem(i, { produzido: e.target.value.replace(/[^0-9.,]/g, "") })} placeholder="kg" style={{ ...inp, width: 82, padding: "6px 8px", textAlign: "right" }} />
                <input type="text" inputMode="decimal" value={it.sobra} onChange={e => upItem(i, { sobra: e.target.value.replace(/[^0-9.,]/g, "") })} placeholder="kg" style={{ ...inp, width: 72, padding: "6px 8px", textAlign: "right" }} />
                <span style={{ width: 78, textAlign: "right", fontWeight: 700, fontSize: 13, color: C.verde }}>{kg(kgCons(it))}</span>
                <span style={{ width: 54, textAlign: "right", fontSize: 12, color: despItem(it) > 25 ? C.coral : C.cinzaE }}>{pct(despItem(it))}</span>
                <button onClick={() => delItem(i)} style={{ width: 20, background: "none", border: "none", color: C.coral, fontSize: 16, cursor: "pointer" }}>×</button>
              </div>
            ))}
            <button onClick={addItem} style={{ background: "none", border: "none", color: C.azul, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "9px 12px" }}>+ Adicionar preparação</button>
          </div>

          <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
            <div><div style={lbl}>PRODUZIDO</div><b style={{ fontSize: 17 }}>{kg(t.prod)}</b></div>
            <div><div style={lbl}>CONSUMIDO</div><b style={{ fontSize: 17, color: C.verde }}>{kg(t.cons)}</b></div>
            <div><div style={lbl}>SOBRA</div><b style={{ fontSize: 17, color: C.coral }}>{kg(t.sobra)}</b></div>
            <div><div style={lbl}>DESPERDÍCIO</div><b style={{ fontSize: 17, color: t.desp > 25 ? C.coral : C.preto }}>{pct(t.desp)}</b></div>
            {t.porPessoa > 0 && <div><div style={lbl}>CONSUMO / PESSOA</div><b style={{ fontSize: 17, color: C.azul }}>{g(t.porPessoa)}</b></div>}
          </div>
        </div>
      </div>
    );
  }

  // ─────────── LISTA / RESUMO ───────────
  return (
    <div style={{ fontFamily: "'Barlow',sans-serif", color: C.preto }}>
      <div style={{ padding: 16, maxWidth: 760, margin: "0 auto" }}>
        {onBack && <button onClick={onBack} style={{ background: "none", border: "none", color: C.azul, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>‹ Voltar</button>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700 }}>Produção × Sobra{clienteNome ? ` · ${clienteNome}` : ""}</div>
            <div style={{ fontSize: 12.5, color: C.cinzaE }}>Buffet: quanto foi produzido, quanto sobrou e quanto foi consumido — por dia e por preparação.</div>
          </div>
          <select value={mes} onChange={e => setMes(e.target.value)} style={{ ...inp, width: "auto" }}>{meses.map(mk => <option key={mk} value={mk}>{mesLabel(mk)}</option>)}</select>
        </div>

        {loading ? <div style={{ padding: 30, textAlign: "center", color: C.cinzaE }}>Carregando…</div> : <>
          {/* TOTAIS DO MÊS */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div style={{ ...card, flex: "1 1 130px", marginBottom: 0 }}><div style={lbl}>PRODUZIDO ({mesLabel(mes)})</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 21, fontWeight: 800 }}>{kg(totalMes.prod)}</div></div>
            <div style={{ ...card, flex: "1 1 130px", marginBottom: 0, borderTop: `3px solid ${C.verde}` }}><div style={lbl}>CONSUMIDO</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 21, fontWeight: 800, color: C.verde }}>{kg(totalMes.cons)}</div></div>
            <div style={{ ...card, flex: "1 1 130px", marginBottom: 0, borderTop: `3px solid ${C.coral}` }}><div style={lbl}>DESPERDÍCIO</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 21, fontWeight: 800, color: despMes > 25 ? C.coral : C.preto }}>{pct(despMes)}</div><div style={{ fontSize: 11, color: C.cinzaE }}>{kg(totalMes.sobra)} de sobra</div></div>
          </div>

          {podeEditar && <button onClick={novoDia} style={{ background: C.lima, color: C.preto, border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 12 }}>+ Registrar dia</button>}

          {/* RESUMO POR PREPARAÇÃO */}
          {resumo.length > 0 && <div style={{ ...card, padding: 0 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>Por preparação — {mesLabel(mes)}</div>
            <div style={{ display: "flex", gap: 8, padding: "6px 16px", background: C.cinzaF, fontSize: 10, fontWeight: 700, color: C.cinzaE, letterSpacing: ".04em" }}>
              <span style={{ flex: 1 }}>PREPARAÇÃO</span><span style={{ width: 90, textAlign: "right" }}>CONSUMO/DIA</span><span style={{ width: 78, textAlign: "right" }}>/PESSOA</span><span style={{ width: 54, textAlign: "right" }}>DESP.</span>
            </div>
            {resumo.map(r => (
              <div key={r.nome} style={{ display: "flex", gap: 8, alignItems: "center", padding: "9px 16px", borderBottom: `1px solid ${C.cinzaF}` }}>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{r.nome}</span>
                <span style={{ width: 90, textAlign: "right", fontSize: 13 }}>{kg(r.consDia)}</span>
                <span style={{ width: 78, textAlign: "right", fontSize: 13, color: C.azul }}>{r.porPessoa > 0 ? g(r.porPessoa) : "—"}</span>
                <span style={{ width: 54, textAlign: "right", fontSize: 12.5, color: r.desp > 25 ? C.coral : C.cinzaE }}>{pct(r.desp)}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.cinzaE, fontStyle: "italic", padding: "9px 16px" }}>O “/pessoa” é a gramatura média por cliente — use nas fichas do buffet pra o custo por pessoa (CMV teórico).</div>
          </div>}

          {/* DIAS REGISTRADOS */}
          <div style={{ ...card, padding: 0 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>Dias registrados ({doMes.length})</div>
            {doMes.length === 0 ? <div style={{ padding: 26, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum dia registrado neste mês.</div> :
              doMes.map((d, i) => { const t = totaisDia(d); return (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: i < doMes.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
                  <div style={{ flex: 1, cursor: podeEditar ? "pointer" : "default" }} onClick={() => podeEditar && setEdit(JSON.parse(JSON.stringify(d)))}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{(d.data || "").split("-").reverse().join("/")}{num(d.nClientes) ? ` · ${num(d.nClientes)} clientes` : ""}</div>
                    <div style={{ fontSize: 12, color: C.cinzaE }}>{(d.itens || []).length} preparações · consumido {kg(t.cons)} · desperdício <b style={{ color: t.desp > 25 ? C.coral : C.cinzaE }}>{pct(t.desp)}</b>{t.porPessoa > 0 ? ` · ${g(t.porPessoa)}/pessoa` : ""}</div>
                  </div>
                  {podeEditar && <><button onClick={() => setEdit(JSON.parse(JSON.stringify(d)))} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 7, padding: "5px 11px", fontSize: 12, cursor: "pointer", color: C.azul }}>Abrir</button>
                  <button onClick={() => { if (window.confirm("Excluir este dia?")) remover(d); }} style={{ background: "none", border: "none", color: C.coral, fontSize: 17, cursor: "pointer" }}>×</button></>}
                </div>
              ); })}
          </div>
        </>}
      </div>
    </div>
  );
}

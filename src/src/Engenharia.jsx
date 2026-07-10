import { useState, useEffect } from "react";
import { calcAllFichas, calcPrato } from "./cmv.js";

// ── SUPABASE ──────────────────────────────────────────────────────
const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
async function sbLoad(table, t) { try { const r = await fetch(`${SB_URL}/rest/v1/${table}?deleted_at=is.null&order=created_at.desc`, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d.map(r => ({ ...r.dados, _id: r.id, _cliente: r.cliente_id })) : []; } catch { return []; } }
async function sbLoadAll(table, t) { try { const r = await fetch(`${SB_URL}/rest/v1/${table}?order=created_at.desc`, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d.map(r => (r.dados ? { ...r.dados, _id: r.id, _cliente: r.cliente_id } : r)) : []; } catch { return []; } }
async function sbUpsert(table, item, t) { await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: { ...sbH(t), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: item.id, dados: item, updated_at: new Date().toISOString() }) }); }

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const brl = v => "R$ " + (Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = v => (Number(v) * 100 || 0).toFixed(1) + "%";

// ── CORES ZESTE ──
const C = {
  preto: "#0E0E0C", branco: "#FFFFFF",
  lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B",
  cinzaF: "#F0EEE8", cinzaM: "#D9D5C8", cinzaE: "#6B6B5E", border: "#E3E1D9",
};

const QUAD = {
  estrela: { label: "⭐ Estrela", col: "#8FA715", desc: "Alta popularidade + alta margem", diretriz: "Manter e proteger. Destaque no cardápio, nunca tire de linha." },
  cavalo: { label: "🐎 Cavalo", col: "#1A4F71", desc: "Alta popularidade + baixa margem", diretriz: "Reduzir custo ou repensar porção. Volume existe, falta rentabilidade." },
  enigma: { label: "❓ Enigma", col: "#C4502B", desc: "Baixa popularidade + alta margem", diretriz: "Promover melhor. Rentável mas pouco vendido — reposicionar no menu." },
  cachorro: { label: "🐶 Cachorro", col: "#6B6B5E", desc: "Baixa popularidade + baixa margem", diretriz: "Candidato a sair do cardápio. Avaliar remoção ou reformulação." },
};

// ── CMV ENGINE (replicado de Fichas) ──

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Nunito+Sans:wght@400;600;700&display=swap');
.eng-wrap{font-family:'Nunito Sans',sans-serif;background:${C.cinzaF};min-height:100vh;color:${C.preto}}
.eng-header{background:${C.preto};position:sticky;top:0;z-index:300;border-bottom:1px solid #2A2A2A}
.eng-tabs{display:flex;background:${C.preto};border-bottom:1px solid #2A2A2A;overflow-x:auto}
.eng-tab{flex:1;padding:12px 8px;font-size:11px;font-weight:700;border:none;cursor:pointer;background:transparent;white-space:nowrap;letter-spacing:.04em;font-family:'Barlow Condensed',sans-serif;border-bottom:2px solid transparent}
.eng-card{background:${C.branco};border:1px solid ${C.border};border-radius:12px;overflow:hidden}
.eng-input{border:1.5px solid ${C.cinzaM};border-radius:6px;padding:6px 9px;font-size:13px;font-family:inherit;background:#FCFBF9;outline:none}
.eng-input:focus{border-color:${C.lima}}
.eng-btn{padding:9px 16px;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;letter-spacing:.05em;cursor:pointer;border:none}
.eng-stat{background:${C.branco};border:1px solid ${C.border};border-radius:10px;padding:12px 14px;text-align:center}
@media(max-width:600px){.eng-matrix{grid-template-columns:1fr!important}.eng-stats4{grid-template-columns:1fr 1fr!important}}
`;

// ── ABA 1 · DADOS DE VENDA ──
function AbaVendas({ pratos, vendas, periodo, setPeriodo, onSaveVendas }) {
  const [local, setLocal] = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const init = {};
    pratos.forEach(p => { const v = vendas.find(x => x.prato_id === p._id && x.periodo_inicio === periodo.inicio); init[p._id] = v ? v.quantidade : ""; });
    setLocal(init);
  }, [pratos, vendas, periodo]);

  const salvar = async () => {
    setSalvando(true);
    const novas = pratos.filter(p => local[p._id] !== "" && local[p._id] != null).map(p => ({
      id: uid(), prato_id: p._id, quantidade: +local[p._id],
      periodo_inicio: periodo.inicio, periodo_fim: periodo.fim,
    }));
    await onSaveVendas(novas);
    setSalvando(false);
  };

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div className="eng-card" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: C.cinzaE, marginBottom: 8 }}>📅 PERÍODO DA ANÁLISE</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 130 }}><div style={{ fontSize: 10, color: C.cinzaE, marginBottom: 4 }}>Início</div><input className="eng-input" type="date" style={{ width: "100%" }} value={periodo.inicio} onChange={e => setPeriodo(p => ({ ...p, inicio: e.target.value }))} /></div>
          <div style={{ flex: 1, minWidth: 130 }}><div style={{ fontSize: 10, color: C.cinzaE, marginBottom: 4 }}>Fim</div><input className="eng-input" type="date" style={{ width: "100%" }} value={periodo.fim} onChange={e => setPeriodo(p => ({ ...p, fim: e.target.value }))} /></div>
        </div>
      </div>

      <div className="eng-card">
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15 }}>Quantidade vendida por prato</span>
          <span style={{ fontSize: 11, color: C.cinzaE }}>{pratos.length} pratos</span>
        </div>
        {pratos.length === 0 ? <div style={{ padding: 32, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum prato cadastrado nas Fichas Técnicas</div> :
          pratos.map((p, i) => (
            <div key={p._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: i < pratos.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14 }}>{p.nome}</div>
                <div style={{ fontSize: 11, color: C.cinzaE }}>{p.preco > 0 ? `${brl(p.preco)} · CMV ${pct(p.cmv)} · Margem ${brl(p.margemRS)}` : "⚠ sem preço de venda"}</div>
              </div>
              <input className="eng-input" type="number" min="0" placeholder="0" style={{ width: 70, textAlign: "center" }}
                value={local[p._id] ?? ""} onChange={e => setLocal(s => ({ ...s, [p._id]: e.target.value }))} />
            </div>
          ))}
      </div>

      <button className="eng-btn" onClick={salvar} disabled={salvando} style={{ width: "100%", marginTop: 14, background: C.lima, color: C.preto, fontSize: 14, padding: "12px" }}>
        {salvando ? "Salvando…" : "💾 Salvar e Calcular Matriz"}
      </button>
    </div>
  );
}

// ── ABA 2 · MATRIZ ──
function AbaMatriz({ analise, onUpdateAnalise }) {
  const [sel, setSel] = useState(null);
  const classificados = analise.filter(a => a.quadrante);
  const semDado = analise.filter(a => !a.quadrante);

  const grupos = { estrela: [], cavalo: [], enigma: [], cachorro: [] };
  classificados.forEach(a => { if (grupos[a.quadrante]) grupos[a.quadrante].push(a); });

  const QuadCard = ({ qid }) => {
    const q = QUAD[qid];
    return (
      <div className="eng-card" style={{ borderTop: `3px solid ${q.col}`, minHeight: 160 }}>
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.cinzaF}` }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: q.col }}>{q.label}</div>
          <div style={{ fontSize: 10, color: C.cinzaE, marginTop: 1 }}>{q.desc}</div>
        </div>
        <div style={{ padding: 8 }}>
          {grupos[qid].length === 0 ? <div style={{ padding: 16, textAlign: "center", color: C.cinzaM, fontSize: 12, fontStyle: "italic" }}>—</div> :
            grupos[qid].map(a => (
              <div key={a.prato_id} onClick={() => setSel(a)} style={{ padding: "8px 10px", borderRadius: 7, background: C.cinzaF, marginBottom: 6, cursor: "pointer", border: `1px solid transparent` }}
                onMouseEnter={e => e.currentTarget.style.borderColor = q.col} onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13 }}>{a.nome}{a.intocavel ? " 🔒" : ""}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: q.col }}>{a.quantidade}x</span>
                </div>
                <div style={{ fontSize: 10, color: C.cinzaE, marginTop: 2 }}>CMV {pct(a.cmv)} · {brl(a.margemRS)}/un</div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  if (classificados.length === 0) return (
    <div style={{ padding: 40, textAlign: "center", color: C.cinzaE }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Matriz vazia</div>
      <div style={{ fontSize: 13 }}>Insira os dados de venda na aba <strong>Dados de Venda</strong> e clique em "Salvar e Calcular Matriz".</div>
    </div>
  );

  return (
    <div style={{ padding: 16, maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 11, color: C.cinzaE, padding: "0 4px" }}>
        <span>↑ Mais popular</span><span>Mais rentável →</span>
      </div>
      <div className="eng-matrix" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <QuadCard qid="cavalo" /><QuadCard qid="estrela" />
        <QuadCard qid="cachorro" /><QuadCard qid="enigma" />
      </div>

      {semDado.length > 0 && <div style={{ marginTop: 14, padding: "10px 14px", background: "#FFF8E8", borderRadius: 8, fontSize: 12, color: "#92400E" }}>
        ⚠ {semDado.length} prato(s) fora da matriz:
        <div style={{ marginTop: 6, lineHeight: 1.6 }}>
          {semDado.map(a => <div key={a.prato_id}>• <strong>{a.nome}</strong> — {(!a.margemRS && a.margemRS !== 0) || a.cmv === 0 ? "sem preço de venda cadastrado" : "sem quantidade vendida no período"}</div>)}
        </div>
        <div style={{ marginTop: 6, fontSize: 11, opacity: .85 }}>Cadastre o preço de venda (nas Fichas) e a quantidade vendida (aba Dados de Venda) para o prato entrar na análise.</div>
      </div>}

      {sel && <PainelEdit analise={sel} onClose={() => setSel(null)} onSave={a => { onUpdateAnalise(a); setSel(null); }} />}
    </div>
  );
}

function PainelEdit({ analise, onClose, onSave }) {
  const [a, setA] = useState({ ...analise });
  const q = QUAD[a.quadrante] || {};
  const S = (k, v) => setA(p => ({ ...p, [k]: v }));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 16 }} onClick={onClose}>
      <div className="eng-card" style={{ width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `3px solid ${q.col}` }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16 }}>{a.nome}</div>
            <div style={{ fontSize: 11, color: q.col, fontWeight: 700 }}>{q.label}</div>
          </div>
          <button onClick={onClose} style={{ background: C.cinzaF, border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            <div className="eng-stat" style={{ padding: 8 }}><div style={{ fontSize: 9, color: C.cinzaE, fontWeight: 700 }}>VENDIDO</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, color: C.azul }}>{a.quantidade}x</div></div>
            <div className="eng-stat" style={{ padding: 8 }}><div style={{ fontSize: 9, color: C.cinzaE, fontWeight: 700 }}>CMV</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, color: C.coral }}>{pct(a.cmv)}</div></div>
            <div className="eng-stat" style={{ padding: 8 }}><div style={{ fontSize: 9, color: C.cinzaE, fontWeight: 700 }}>MARGEM/UN</div><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, color: C.verde }}>{brl(a.margemRS)}</div></div>
          </div>

          <label style={{ fontSize: 11, fontWeight: 700, color: C.cinzaE, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Diretriz</label>
          <textarea className="eng-input" style={{ width: "100%", resize: "vertical" }} rows={3} value={a.diretriz || q.diretriz} onChange={e => S("diretriz", e.target.value)} />

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.cinzaE, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Complexidade</label>
              <select className="eng-input" style={{ width: "100%" }} value={a.complexidade || "media"} onChange={e => S("complexidade", e.target.value)}>
                <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.cinzaE, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Posicionamento</label>
              <input className="eng-input" style={{ width: "100%" }} value={a.posicionamento || ""} onChange={e => S("posicionamento", e.target.value)} placeholder="ex: destaque, rodapé" />
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={!!a.intocavel} onChange={e => S("intocavel", e.target.checked)} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>🔒 Prato intocável (fora de recomendação automática)</span>
          </label>

          <label style={{ fontSize: 11, fontWeight: 700, color: C.cinzaE, textTransform: "uppercase", display: "block", marginBottom: 5, marginTop: 14 }}>Notas</label>
          <textarea className="eng-input" style={{ width: "100%", resize: "vertical" }} rows={2} value={a.notas || ""} onChange={e => S("notas", e.target.value)} />

          <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 18 }}>
            <button className="eng-btn" onClick={onClose} style={{ background: C.cinzaF, color: C.cinzaE }}>Cancelar</button>
            <button className="eng-btn" onClick={() => onSave(a)} style={{ background: C.verde, color: "#fff" }}>✓ Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ABA 3 · RELATÓRIO ──
function AbaRelatorio({ analise }) {
  const [sortKey, setSortKey] = useState("contrib");
  const [sortDir, setSortDir] = useState("desc");

  const classificados = analise.filter(a => a.quadrante);
  const rows = classificados.map(a => ({ ...a, contrib: a.margemRS * a.quantidade }));

  const sorted = [...rows].sort((x, y) => {
    const a = x[sortKey], b = y[sortKey];
    const cmp = typeof a === "string" ? a.localeCompare(b) : (a - b);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const setSort = k => { if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(k); setSortDir("desc"); } };

  const cont = { estrela: 0, cavalo: 0, enigma: 0, cachorro: 0 };
  classificados.forEach(a => cont[a.quadrante]++);

  const exportExcel = async () => {
    const XLSX = await new Promise((resolve, reject) => {
      if (window.XLSX) return resolve(window.XLSX);
      const s = document.createElement("script");
      s.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
      s.onload = () => resolve(window.XLSX);
      s.onerror = () => reject(new Error("Falha ao carregar SheetJS"));
      document.head.appendChild(s);
    });
    const data = sorted.map(a => ({
      Prato: a.nome, Quadrante: QUAD[a.quadrante]?.label.replace(/[^\w\s]/g, "").trim() || "",
      "CMV %": (a.cmv * 100).toFixed(1) + "%", "Margem R$": a.margemRS.toFixed(2),
      Vendido: a.quantidade, "Contribuição Total": a.contrib.toFixed(2),
      Intocável: a.intocavel ? "Sim" : "", Diretriz: a.diretriz || QUAD[a.quadrante]?.diretriz || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Engenharia");
    XLSX.writeFile(wb, "engenharia_cardapio_zeste.xlsx");
  };

  const Th = ({ k, children, align }) => (
    <th onClick={() => setSort(k)} style={{ padding: "8px 10px", textAlign: align || "left", fontSize: 10, color: C.lima, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: ".04em" }}>
      {children} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  if (classificados.length === 0) return <div style={{ padding: 40, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Sem dados para relatório. Calcule a matriz primeiro.</div>;

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <div className="eng-stats4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        {Object.entries(QUAD).map(([qid, q]) => (
          <div key={qid} className="eng-stat" style={{ borderTop: `3px solid ${q.col}` }}>
            <div style={{ fontSize: 9, color: C.cinzaE, fontWeight: 700, marginBottom: 4 }}>{q.label}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700, color: q.col }}>{cont[qid]}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button className="eng-btn" onClick={exportExcel} style={{ background: "#ECFDF5", border: `1.5px solid #10B981`, color: "#065F46" }}>⬇ Exportar Excel</button>
      </div>

      <div className="eng-card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600, fontSize: 12 }}>
          <thead><tr style={{ background: C.preto }}>
            <Th k="nome">Prato</Th>
            <Th k="quadrante">Quadrante</Th>
            <Th k="cmv" align="right">CMV</Th>
            <Th k="margemRS" align="right">Margem R$</Th>
            <Th k="quantidade" align="right">Vendido</Th>
            <Th k="contrib" align="right">Contrib. Total</Th>
          </tr></thead>
          <tbody>
            {sorted.map((a, i) => {
              const q = QUAD[a.quadrante] || {};
              return (
                <tr key={a.prato_id} style={{ background: i % 2 === 0 ? C.branco : "#FAFAF6", borderBottom: `1px solid ${C.cinzaF}` }}>
                  <td style={{ padding: "9px 10px", fontWeight: 600 }}>{a.nome}{a.intocavel ? " 🔒" : ""}</td>
                  <td style={{ padding: "9px 10px" }}><span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 5, background: q.col + "22", color: q.col, fontWeight: 700 }}>{q.label}</span></td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: C.coral }}>{pct(a.cmv)}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: C.verde, fontWeight: 600 }}>{brl(a.margemRS)}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700 }}>{a.quantidade}x</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: a.contrib >= 0 ? C.verde : C.coral }}>{brl(a.contrib)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── ROOT ──
// ── ABA 4 · PRIME COST ──
// Prime cost = (CMV + Mão de obra) / Receita. Só faz sentido no CARDÁPIO COMPLETO:
// a folha da cozinha é do cardápio inteiro, não dá pra diluí-la sobre um recorte de pratos.
// Por isso há 2 modos: completo (prime cost real) e recorte (só CMV/margem, sem mão de obra).
function AbaPrimeCost({ pratos, vendas, periodo, folha, onSaveFolha }) {
  const [modo, setModo] = useState(folha.modo || "completo"); // 'completo' | 'recorte'
  const [linhas, setLinhas] = useState(folha.linhas || []);
  const [receitaExtra, setReceitaExtra] = useState(folha.receitaExtra || "");
  const [salvando, setSalvando] = useState(false);

  const vendasPer = vendas.filter(v => v.periodo_inicio === periodo.inicio);
  let receitaPratos = 0, cmvTotal = 0, semVenda = 0, comVenda = 0;
  pratos.forEach(p => {
    const v = vendasPer.find(x => x.prato_id === p._id);
    if (!v || !v.quantidade) { semVenda++; return; }
    comVenda++;
    receitaPratos += (p.preco || 0) * v.quantidade;
    cmvTotal += (p.custoTotal || 0) * v.quantidade;
  });
  const ehRecorte = modo === "recorte";
  const receita = receitaPratos + (ehRecorte ? 0 : (Number(receitaExtra) || 0));
  const folhaTotal = linhas.reduce((s, l) => s + (Number(l.salario) || 0) * (1 + (Number(l.encargos) || 0) / 100), 0);

  const cmvPct = receita > 0 ? cmvTotal / receita : 0;
  const moPct = receita > 0 ? folhaTotal / receita : 0;
  const primeCost = cmvPct + moPct;

  const faixa = primeCost <= 0.60 ? { cor: C.verde, txt: "Saudável", desc: "Sua operação está no verde. Prime cost até 60% é o alvo da maioria dos restaurantes lucrativos." }
    : primeCost <= 0.65 ? { cor: "#B8860B", txt: "Atenção", desc: "Zona limítrofe. Entre 60% e 65% ainda dá lucro, mas sobra pouca margem para imprevistos — vale apertar." }
    : { cor: C.coral, txt: "Crítico", desc: "Acima de 65%, a operação consome o lucro. Cada real que entra, mais de 65 centavos já saem em comida e equipe antes de pagar aluguel, energia e o resto." };
  const faixaCMV = cmvPct <= 0.32 ? { cor: C.verde, txt: "Saudável" } : cmvPct <= 0.38 ? { cor: "#B8860B", txt: "Atenção" } : { cor: C.coral, txt: "Alto" };

  const gargalo = moPct > cmvPct
    ? "O peso maior está na MÃO DE OBRA, não na comida. A cozinha pode estar superdimensionada para o volume, ou há retrabalho/ociosidade. A comida está sob controle."
    : "O peso maior está no CMV (comida). Fichas, porções ou preços de compra estão apertando a margem — é aqui que a engenharia de cardápio e a negociação com fornecedor atuam.";

  const addLinha = () => setLinhas([...linhas, { id: uid(), cargo: "", salario: "", encargos: "" }]);
  const upLinha = (id, campo, val) => setLinhas(linhas.map(l => l.id === id ? { ...l, [campo]: val } : l));
  const rmLinha = id => setLinhas(linhas.filter(l => l.id !== id));
  const salvar = async () => { setSalvando(true); await onSaveFolha({ linhas, receitaExtra, modo }); setSalvando(false); };

  const Barra = ({ label, valor, pct, cor }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 700, color: cor }}>{(pct * 100).toFixed(1)}% · {brl(valor)}</span>
      </div>
      <div style={{ height: 10, background: C.cinzaF, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: Math.min(pct * 100, 100) + "%", height: "100%", background: cor, borderRadius: 6 }} />
      </div>
    </div>
  );
  const MB = ({ id, titulo, sub }) => (
    <button onClick={() => setModo(id)} style={{ flex: 1, textAlign: "left", padding: "12px 14px", borderRadius: 10, border: `2px solid ${modo === id ? C.lima : C.border}`, background: modo === id ? "#FBFCF5" : "#fff", cursor: "pointer" }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: modo === id ? C.preto : C.cinzaE }}>{titulo}</div>
      <div style={{ fontSize: 12, color: C.cinzaE, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
    </button>
  );

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ fontSize: 14, color: C.cinzaE, lineHeight: 1.55, marginBottom: 14 }}>
        O <strong>prime cost</strong> soma os dois maiores custos de um restaurante — <strong>comida (CMV)</strong> e <strong>mão de obra</strong> — e mostra quanto de cada R$100 vendidos é consumido por eles. Antes, escolha o tipo de análise:
      </div>

      {/* Seletor de modo */}
      <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
        <MB id="completo" titulo="Cardápio completo" sub="Todos os pratos vendidos. Calcula o prime cost real (CMV + mão de obra)." />
        <MB id="recorte" titulo="Recorte de pratos" sub="Só alguns pratos do cardápio. Mostra CMV e margem — sem mão de obra." />
      </div>
      {ehRecorte && (
        <div style={{ fontSize: 13, color: C.cinzaE, background: "#FBF9F2", border: `1px solid ${C.cinzaM}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, lineHeight: 1.5 }}>
          <strong>Por que sem mão de obra?</strong> A folha da cozinha produz o cardápio inteiro — não dá pra diluí-la sobre um punhado de pratos sem inflar o número e mentir. Nesse modo mostramos o que é <strong>rastreável por prato</strong>: o custo da comida e a margem. O prime cost real exige o cardápio completo.
        </div>
      )}

      {/* Resultado */}
      {!ehRecorte ? (
        <div className="eng-card" style={{ padding: 22, marginBottom: 16, borderLeft: `5px solid ${faixa.cor}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: C.cinzaE }}>PRIME COST DO PERÍODO</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", margin: "4px 0 10px" }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 44, fontWeight: 800, color: faixa.cor, lineHeight: 1 }}>{receita > 0 ? (primeCost * 100).toFixed(1) + "%" : "—"}</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", background: faixa.cor, padding: "4px 12px", borderRadius: 10 }}>{faixa.txt}</span>
          </div>
          {receita > 0 ? <>
            <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>{faixa.desc}</div>
            <Barra label="Comida (CMV)" valor={cmvTotal} pct={cmvPct} cor={C.coral} />
            <Barra label="Mão de obra" valor={folhaTotal} pct={moPct} cor={C.azul} />
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12, fontSize: 13, color: C.cinzaE }}>
              Receita considerada: <strong style={{ color: C.preto }}>{brl(receita)}</strong> · sobra depois do prime cost: <strong style={{ color: primeCost < 0.65 ? C.verde : C.coral }}>{brl(receita - cmvTotal - folhaTotal)}</strong> para aluguel, energia, impostos e lucro.
            </div>
            <div style={{ marginTop: 14, background: "#FBF9F2", border: `1px solid ${C.cinzaM}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", color: C.verde, marginBottom: 4 }}>LEITURA DA ZESTE</div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{gargalo}</div>
            </div>
          </> : (
            <div style={{ fontSize: 14, color: C.cinzaE, lineHeight: 1.6 }}>
              Para calcular, cadastre <strong>vendas</strong> na aba "Dados de Venda" e a <strong>folha da cozinha</strong> abaixo.
              {semVenda > 0 && ` Hoje ${semVenda} prato(s) estão sem quantidade vendida no período.`}
            </div>
          )}
        </div>
      ) : (
        <div className="eng-card" style={{ padding: 22, marginBottom: 16, borderLeft: `5px solid ${faixaCMV.cor}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: C.cinzaE }}>ANÁLISE DO RECORTE ({comVenda} prato{comVenda !== 1 ? "s" : ""})</div>
          {receita > 0 ? <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", margin: "4px 0 10px" }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 44, fontWeight: 800, color: faixaCMV.cor, lineHeight: 1 }}>{(cmvPct * 100).toFixed(1) + "%"}</span>
              <span style={{ fontSize: 15, color: C.cinzaE }}>CMV destes pratos</span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, color: "#fff", background: faixaCMV.cor, padding: "3px 10px", borderRadius: 9 }}>{faixaCMV.txt}</span>
            </div>
            <Barra label="Comida (CMV)" valor={cmvTotal} pct={cmvPct} cor={C.coral} />
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12, fontSize: 14, lineHeight: 1.6 }}>
              Faturamento destes pratos: <strong>{brl(receitaPratos)}</strong><br />
              Custo de comida: <strong style={{ color: C.coral }}>{brl(cmvTotal)}</strong><br />
              Margem de contribuição (antes da mão de obra): <strong style={{ color: C.verde }}>{brl(receitaPratos - cmvTotal)}</strong>
            </div>
            <div style={{ marginTop: 14, background: "#FBF9F2", border: `1px solid ${C.cinzaM}`, borderRadius: 12, padding: "14px 16px", fontSize: 13, color: C.cinzaE, lineHeight: 1.55 }}>
              Esta é a margem que estes pratos deixam <strong>antes</strong> de descontar mão de obra e custos fixos. Para o prime cost completo (com equipe), analise o cardápio inteiro no modo "Cardápio completo".
            </div>
          </> : (
            <div style={{ fontSize: 14, color: C.cinzaE, lineHeight: 1.6 }}>Cadastre as vendas dos pratos deste recorte na aba "Dados de Venda".{semVenda > 0 && ` (${semVenda} prato(s) sem venda no período.)`}</div>
          )}
        </div>
      )}

      {/* Folha da cozinha — só no modo completo */}
      {!ehRecorte && (
        <div className="eng-card" style={{ padding: 18 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 17, marginBottom: 2 }}>Folha da cozinha</div>
          <div style={{ fontSize: 13, color: C.cinzaE, marginBottom: 14 }}>Some só a equipe ligada à produção (cozinha, confeitaria, apoio). Encargos = % sobre o salário (férias, 13º, FGTS, INSS — na CLT gira em torno de 70-80%).</div>
          {linhas.map(l => (
            <div key={l.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input placeholder="Cargo (ex: Cozinheira)" value={l.cargo} onChange={e => upLinha(l.id, "cargo", e.target.value)} style={{ flex: "2 1 140px", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 15 }} />
              <input placeholder="Salário R$" inputMode="decimal" value={l.salario} onChange={e => upLinha(l.id, "salario", e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."))} style={{ flex: "1 1 90px", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 15 }} />
              <input placeholder="Encargos %" inputMode="decimal" value={l.encargos} onChange={e => upLinha(l.id, "encargos", e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."))} style={{ flex: "1 1 80px", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 15 }} />
              <button onClick={() => rmLinha(l.id)} style={{ color: C.coral, fontSize: 13, fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>remover</button>
            </div>
          ))}
          <button onClick={addLinha} style={{ marginTop: 4, color: C.azul, fontWeight: 700, fontSize: 14, background: "none", border: `1.5px dashed ${C.cinzaM}`, borderRadius: 8, padding: "9px 14px", cursor: "pointer", width: "100%", minHeight: 44 }}>+ Adicionar pessoa</button>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <label style={{ fontSize: 12.5, fontWeight: 700, color: C.cinzaE, letterSpacing: ".05em", textTransform: "uppercase" }}>Receita extra do período (opcional)</label>
            <div style={{ fontSize: 12, color: C.cinzaE, margin: "2px 0 6px" }}>Vendas que não passam pelos pratos cadastrados (bebidas, delivery, couvert). Some aqui para o prime cost refletir a receita real.</div>
            <input placeholder="R$ 0,00" inputMode="decimal" value={receitaExtra} onChange={e => setReceitaExtra(e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."))} style={{ padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 15, width: "100%", maxWidth: 200 }} />
          </div>
          <button onClick={salvar} disabled={salvando} style={{ marginTop: 16, background: C.lima, color: C.preto, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, borderRadius: 8, padding: "12px 20px", border: "none", cursor: "pointer", width: "100%", minHeight: 46, opacity: salvando ? .6 : 1 }}>{salvando ? "Salvando…" : "Salvar folha e recalcular"}</button>
        </div>
      )}
      {ehRecorte && (
        <button onClick={salvar} disabled={salvando} style={{ background: C.lima, color: C.preto, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, borderRadius: 8, padding: "12px 20px", border: "none", cursor: "pointer", width: "100%", minHeight: 46, opacity: salvando ? .6 : 1 }}>{salvando ? "Salvando…" : "Salvar preferência deste modo"}</button>
      )}
    </div>
  );
}

export default function Engenharia({ onBack, token }) {
  const [aba, setAba] = useState("vendas");
  const [pratos, setPratos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [analise, setAnalise] = useState([]);
  const [folha, setFolha] = useState({ linhas: [], receitaExtra: "" });
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(() => {
    const fim = new Date(); const ini = new Date(); ini.setDate(ini.getDate() - 30);
    return { inicio: ini.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
  });

  useEffect(() => {
    Promise.all([
      sbLoadAll("fin_ingredientes", token), sbLoad("fin_fichas", token), sbLoad("fin_pratos", token),
      sbLoad("eng_vendas", token), sbLoad("eng_analise", token), sbLoad("eng_folha", token),
    ]).then(([ings, fics, prts, vds, anl, flh]) => {
      const fichasCalc = calcAllFichas(fics, ings, null); // admin: sempre a base zeste
      const pratosCalc = prts.map(p => calcPrato(p, ings, fichasCalc, null));
      setPratos(pratosCalc);
      setVendas(vds);
      setAnalise(anl);
      if (flh && flh[0]) setFolha(flh[0]);
    }).finally(() => setLoading(false));
  }, []);

  // Calcular matriz ao salvar vendas
  const calcularMatriz = (vendasPeriodo) => {
    const comVenda = pratos.map(p => {
      const v = vendasPeriodo.find(x => x.prato_id === p._id);
      return { prato: p, qtd: v ? v.quantidade : null };
    }).filter(x => x.qtd != null && x.prato.preco > 0);

    if (comVenda.length === 0) return [];

    const mediaPopularidade = comVenda.reduce((s, x) => s + x.qtd, 0) / comVenda.length;
    const mediaMargem = comVenda.reduce((s, x) => s + x.prato.margemRS, 0) / comVenda.length;

    return pratos.map(p => {
      const v = vendasPeriodo.find(x => x.prato_id === p._id);
      const existente = analise.find(a => a.prato_id === p._id);
      if (!v || p.preco <= 0) return { id: existente?.id || uid(), prato_id: p._id, nome: p.nome, cmv: p.cmv, margemRS: p.margemRS, quadrante: null };
      const popAlta = v.quantidade >= mediaPopularidade;
      const margAlta = p.margemRS >= mediaMargem;
      const quadrante = popAlta && margAlta ? "estrela" : popAlta && !margAlta ? "cavalo" : !popAlta && margAlta ? "enigma" : "cachorro";
      return {
        id: existente?.id || uid(), prato_id: p._id, nome: p.nome,
        cmv: p.cmv, margemRS: p.margemRS, quantidade: v.quantidade, quadrante,
        diretriz: existente?.diretriz || QUAD[quadrante].diretriz,
        complexidade: existente?.complexidade || "media",
        posicionamento: existente?.posicionamento || "", intocavel: existente?.intocavel || false,
        notas: existente?.notas || "", periodo_inicio: periodo.inicio, periodo_fim: periodo.fim,
      };
    });
  };

  const saveVendas = async (novas) => {
    // salvar vendas no supabase
    for (const v of novas) await sbUpsert("eng_vendas", v, token);
    const todasVendas = [...vendas.filter(v => !(v.periodo_inicio === periodo.inicio)), ...novas];
    setVendas(todasVendas);
    // recalcular matriz
    const novaAnalise = calcularMatriz(novas);
    setAnalise(novaAnalise);
    for (const a of novaAnalise.filter(x => x.quadrante)) await sbUpsert("eng_analise", a, token);
    setAba("matriz");
  };

  const updateAnalise = async (a) => {
    setAnalise(prev => prev.map(x => x.prato_id === a.prato_id ? a : x));
    await sbUpsert("eng_analise", a, token);
  };

  const saveFolha = async (dados) => {
    const item = { id: folha.id || uid(), ...dados };
    await sbUpsert("eng_folha", item, token);
    setFolha(item);
  };

  const ABAS = [["vendas", "Dados de Venda"], ["matriz", "Matriz"], ["primecost", "Prime Cost"], ["relatorio", "Relatório"]];

  return (
    <div className="eng-wrap">
      <style>{STYLE}</style>
      <div className="eng-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {onBack && <button onClick={onBack} style={{ color: C.lima, fontSize: 24, background: "none", border: "none", cursor: "pointer", minWidth: 36, minHeight: 36, display: "flex", alignItems: "center" }}>‹</button>}
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 800, color: C.lima, letterSpacing: ".06em" }}>ZESTE</span>
              <span style={{ fontSize: 9, color: "#555", letterSpacing: ".14em" }}>ENGENHARIA DE CARDÁPIO</span>
            </div>
          </div>
        </div>
      </div>
      <div className="eng-tabs">
        {ABAS.map(([id, l]) => (
          <button key={id} className="eng-tab" onClick={() => setAba(id)} style={{ color: aba === id ? C.lima : "#555", borderBottomColor: aba === id ? C.lima : "transparent" }}>{l}</button>
        ))}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: "center", color: C.cinzaE }}>Carregando pratos…</div> : <>
        {aba === "vendas" && <AbaVendas pratos={pratos} vendas={vendas} periodo={periodo} setPeriodo={setPeriodo} onSaveVendas={saveVendas} />}
        {aba === "matriz" && <AbaMatriz analise={analise} onUpdateAnalise={updateAnalise} />}
        {aba === "primecost" && <AbaPrimeCost pratos={pratos} vendas={vendas} periodo={periodo} folha={folha} onSaveFolha={saveFolha} />}
        {aba === "relatorio" && <AbaRelatorio analise={analise} />}
      </>}
    </div>
  );
}

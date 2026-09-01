import { useState, useEffect } from "react";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
async function sbLoadRaw(table, t, query = "") { try { const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d : []; } catch { return []; } }
async function sbUpsert(table, item, t, clienteId) { await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: { ...sbH(t), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: item.id, cliente_id: clienteId, dados: item, updated_at: new Date().toISOString() }) }); }
async function sbDel(table, id, t) { await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: sbH(t) }); }

const _n = v => (v || "").toString().trim().toLowerCase();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const td = () => new Date().toISOString().slice(0, 10);

const C = { preto: "#0E0E0C", branco: "#fff", lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B", cinzaF: "#F0EEE8", cinzaM: "#D9D5C8", cinzaE: "#6B6B5E", border: "#E3E1D9" };

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;600;700&display=swap');
.pa-wrap{font-family:'Barlow',sans-serif;background:${C.cinzaF};min-height:100vh;color:${C.preto}}
.pa-header{background:${C.preto};position:sticky;top:0;z-index:300;border-bottom:1px solid #2A2A2A;padding:10px 16px;display:flex;align-items:center;gap:10px}
.pa-card{background:#fff;border:1px solid ${C.border};border-radius:12px;overflow:hidden}
.pa-input{width:100%;border:1.5px solid ${C.cinzaM};border-radius:7px;padding:9px 11px;font-size:14px;font-family:inherit;background:#FCFBF9;outline:none}
.pa-input:focus{border-color:${C.lima}}
.pa-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${C.cinzaE};display:block;margin-bottom:5px;margin-top:12px}
.pa-btn{padding:9px 16px;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;letter-spacing:.05em;cursor:pointer;border:none}
.pa-tab{flex:1;padding:11px 8px;font-size:12px;font-weight:700;border:none;cursor:pointer;background:transparent;font-family:'Barlow Condensed',sans-serif;border-bottom:2px solid transparent}
`;

// ── POP-10 · Auditoria de Experiência Real ──────────────────────────────────
const CRITERIOS_AUD = [["A", "Aparência e empratamento"], ["B", "Porcionamento"], ["C", "Sabor"], ["D", "Textura"], ["E", "Temperatura"], ["F", "Coerência operacional"], ["tempo", "Tempo de entrega"], ["exp", "Experiência geral"]];
const STATUS_AUD = ["Aprovado", "Aprovado com ajuste fino", "Requer ajuste obrigatório", "Requer revalidação"];
const TIPO_FALHA_AUD = ["", "Pontual", "Padronização", "Operacional", "Estratégica"];
function mediaPrato(p) { const vs = CRITERIOS_AUD.map(([k]) => parseFloat(p.notas && p.notas[k])).filter(n => !isNaN(n)); return vs.length ? +(vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(1) : null; }
function statusAutoAud(media, falhaCrit) { if (media == null) return ""; if (falhaCrit || media < 3) return "Requer ajuste obrigatório"; if (media < 4) return "Aprovado com ajuste fino"; return "Aprovado"; }
function coberturaAud(auditorias, totalPratos) { const set = new Set(); (auditorias || []).forEach(a => (a.pratos || []).forEach(p => { const n = (p.nome || "").trim().toLowerCase(); if (n) set.add(n); })); const aud = set.size; return { aud, total: totalPratos, pct: totalPratos > 0 ? Math.round(aud / totalPratos * 100) : 0 }; }
function corStatusAud(s) { if (s === "Aprovado") return C.verde; if (s === "Aprovado com ajuste fino") return C.azul; if (s === "Requer revalidação") return "#B8860B"; if (s) return C.coral; return C.cinzaE; }

function AuditoriaPOP10({ auditorias, pratosCliente, onSave, onDelete, clienteNome }) {
  const [draft, setDraft] = useState(null);
  const cob = coberturaAud(auditorias, (pratosCliente || []).length);
  const inp = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.cinzaM}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, background: "#fff", fontFamily: "inherit" };
  const lbl = { fontSize: 10, color: C.cinzaE, fontWeight: 700, letterSpacing: ".04em", display: "block", marginBottom: 3 };

  const novaAuditoria = () => setDraft({ id: uid(), data: td(), horario: "", responsaveis: "", movimento: "", chegada: { espera: "", equipe: "", explicou: "", comunicacao: "", obs: "" }, pratos: [], resumo: { q1: "", q2: "", q3: "", q4: "", q5: "", q6: "" } });
  const up = patch => setDraft(d => ({ ...d, ...patch }));
  const upCheg = patch => setDraft(d => ({ ...d, chegada: { ...d.chegada, ...patch } }));
  const upResumo = patch => setDraft(d => ({ ...d, resumo: { ...d.resumo, ...patch } }));
  const addPrato = () => setDraft(d => ({ ...d, pratos: [...d.pratos, { id: uid(), nome: "", hPedido: "", hChegada: "", tempoTotal: "", tempoStatus: "", notas: {}, obs: {}, status: "", falhaCrit: false, tipoFalha: "", positivos: "", atencao: "", ajustes: "", responsavel: "", prazo: "" }] }));
  const upPrato = (i, patch) => setDraft(d => ({ ...d, pratos: d.pratos.map((p, j) => j === i ? { ...p, ...patch } : p) }));
  const upNota = (i, k, v) => setDraft(d => ({ ...d, pratos: d.pratos.map((p, j) => j === i ? { ...p, notas: { ...p.notas, [k]: v } } : p) }));
  const upObs = (i, k, v) => setDraft(d => ({ ...d, pratos: d.pratos.map((p, j) => j === i ? { ...p, obs: { ...p.obs, [k]: v } } : p) }));
  const delPrato = i => setDraft(d => ({ ...d, pratos: d.pratos.filter((_, j) => j !== i) }));
  const salvar = () => { const out = { ...draft, pratos: draft.pratos.map(p => { const m = mediaPrato(p); return { ...p, media: m, status: p.status || statusAutoAud(m, p.falhaCrit) }; }) }; onSave(out); setDraft(null); };

  // ─── LISTA ───
  if (!draft) return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div className="pa-card" style={{ padding: 16, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 700 }}>Implementação · Auditoria POP-10</div>
          <div style={{ fontSize: 12.5, color: C.cinzaE, marginTop: 2 }}>Cobertura: <b style={{ color: cob.pct >= 70 ? C.verde : C.coral }}>{cob.aud} de {cob.total} pratos ({cob.pct}%)</b> · regra: ≥ 70%</div>
        </div>
        <button className="pa-btn" onClick={novaAuditoria} style={{ background: C.lima, color: C.preto, border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Nova auditoria</button>
      </div>
      {cob.total > 0 && cob.pct < 70 && <div style={{ fontSize: 12, color: C.coral, marginBottom: 12, padding: "8px 12px", background: "#FBEDE8", borderRadius: 8 }}>⚠ Amostragem abaixo de 70% — avalie mais pratos antes de concluir a implementação.</div>}
      {auditorias.length === 0 ? <div className="pa-card" style={{ padding: 28, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhuma auditoria ainda. Toque em “+ Nova auditoria” para registrar a primeira visita.</div> :
        <div className="pa-card">
          {auditorias.map((a, i) => {
            const npr = (a.pratos || []).length;
            const crit = (a.pratos || []).filter(p => (p.status || "").startsWith("Requer")).length;
            return (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i < auditorias.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
                <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setDraft(JSON.parse(JSON.stringify(a)))}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Auditoria · {a.data || "sem data"}{a.horario ? " · " + a.horario : ""}</div>
                  <div style={{ fontSize: 12, color: C.cinzaE }}>{npr} prato{npr !== 1 ? "s" : ""} avaliado{npr !== 1 ? "s" : ""}{crit ? ` · ${crit} requer ajuste` : ""}{a.movimento ? " · mov. " + a.movimento : ""}</div>
                </div>
                <button onClick={() => setDraft(JSON.parse(JSON.stringify(a)))} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: C.azul }}>Abrir</button>
                <button onClick={() => { if (window.confirm("Excluir esta auditoria?")) onDelete(a.id); }} style={{ background: "none", border: "none", color: C.coral, fontSize: 18, cursor: "pointer" }}>×</button>
              </div>
            );
          })}
        </div>}
    </div>
  );

  // ─── EDITOR ───
  const opcoesPratos = (pratosCliente || []).map(p => p.nome).filter(Boolean);
  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => setDraft(null)} style={{ background: "none", border: "none", color: C.azul, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>‹ Voltar</button>
        <button onClick={salvar} className="pa-btn" style={{ background: C.verde, color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Salvar auditoria</button>
      </div>

      <div className="pa-card" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📋 Cabeçalho</div>
        <div style={{ fontSize: 11.5, color: C.cinzaE, marginBottom: 10 }}>Cliente: {clienteNome}. Postura: agir como cliente — não corrigir, não entrar na cozinha, não avisar que está avaliando.</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <div style={{ flex: "1 1 120px" }}><label style={lbl}>DATA</label><input type="date" value={draft.data} onChange={e => up({ data: e.target.value })} style={inp} /></div>
          <div style={{ flex: "1 1 100px" }}><label style={lbl}>HORÁRIO</label><input value={draft.horario} onChange={e => up({ horario: e.target.value })} placeholder="ex.: 12h30" style={inp} /></div>
          <div style={{ flex: "1 1 160px" }}><label style={lbl}>RESPONSÁVEIS ZESTE</label><input value={draft.responsaveis} onChange={e => up({ responsaveis: e.target.value })} style={inp} /></div>
          <div style={{ flex: "1 1 130px" }}><label style={lbl}>MOVIMENTO PERCEBIDO</label><select value={draft.movimento} onChange={e => up({ movimento: e.target.value })} style={inp}><option value="">—</option><option>Baixo</option><option>Médio</option><option>Alto</option></select></div>
        </div>
      </div>

      <div className="pa-card" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>🚪 Chegada</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <div style={{ flex: "1 1 130px" }}><label style={lbl}>TEMPO DE ESPERA</label><input value={draft.chegada.espera} onChange={e => upCheg({ espera: e.target.value })} placeholder="p/ atendimento" style={inp} /></div>
          <div style={{ flex: "1 1 130px" }}><label style={lbl}>EQUIPE PRESENTE</label><input value={draft.chegada.equipe} onChange={e => upCheg({ equipe: e.target.value })} style={inp} /></div>
          <div style={{ flex: "1 1 150px" }}><label style={lbl}>ATENDIMENTO EXPLICOU O PRATO?</label><select value={draft.chegada.explicou} onChange={e => upCheg({ explicou: e.target.value })} style={inp}><option value="">—</option><option>Sim</option><option>Parcial</option><option>Não</option></select></div>
          <div style={{ flex: "1 1 150px" }}><label style={lbl}>COMUNICAÇÃO SALÃO/COZINHA ORGANIZADA?</label><select value={draft.chegada.comunicacao} onChange={e => upCheg({ comunicacao: e.target.value })} style={inp}><option value="">—</option><option>Sim</option><option>Não</option></select></div>
        </div>
        <label style={{ ...lbl, marginTop: 10 }}>OBSERVAÇÕES DA CHEGADA</label>
        <textarea value={draft.chegada.obs} onChange={e => upCheg({ obs: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 2px 8px" }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700 }}>🍽️ Pratos avaliados ({draft.pratos.length})</div>
        <button onClick={addPrato} style={{ background: C.lima, color: C.preto, border: "none", padding: "7px 14px", borderRadius: 7, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>+ Adicionar prato</button>
      </div>

      {draft.pratos.map((p, i) => {
        const media = mediaPrato(p);
        const stAuto = statusAutoAud(media, p.falhaCrit);
        const stEfetivo = p.status || stAuto;
        return (
          <div key={p.id} className="pa-card" style={{ padding: 14, marginBottom: 12, borderLeft: `3px solid ${corStatusAud(stEfetivo)}` }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>PRATO</label>
                {opcoesPratos.length ? (
                  <select value={p.nome} onChange={e => upPrato(i, { nome: e.target.value })} style={inp}>
                    <option value="">— selecione —</option>
                    {opcoesPratos.map(n => <option key={n} value={n}>{n}</option>)}
                    {p.nome && !opcoesPratos.includes(p.nome) && <option value={p.nome}>{p.nome}</option>}
                  </select>
                ) : <input value={p.nome} onChange={e => upPrato(i, { nome: e.target.value })} placeholder="nome do prato" style={inp} />}
              </div>
              <button onClick={() => delPrato(i)} style={{ background: "none", border: "none", color: C.coral, fontSize: 20, cursor: "pointer", marginTop: 16 }}>×</button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              <div style={{ flex: "1 1 90px" }}><label style={lbl}>PEDIDO</label><input value={p.hPedido} onChange={e => upPrato(i, { hPedido: e.target.value })} placeholder="hora" style={inp} /></div>
              <div style={{ flex: "1 1 90px" }}><label style={lbl}>CHEGADA</label><input value={p.hChegada} onChange={e => upPrato(i, { hChegada: e.target.value })} placeholder="hora" style={inp} /></div>
              <div style={{ flex: "1 1 90px" }}><label style={lbl}>TEMPO TOTAL</label><input value={p.tempoTotal} onChange={e => upPrato(i, { tempoTotal: e.target.value })} placeholder="min" style={inp} /></div>
              <div style={{ flex: "1 1 120px" }}><label style={lbl}>TEMPO</label><select value={p.tempoStatus} onChange={e => upPrato(i, { tempoStatus: e.target.value })} style={inp}><option value="">—</option><option>Aprovado</option><option>Atenção</option><option>Crítico</option></select></div>
            </div>

            <label style={lbl}>CRITÉRIOS (NOTA 1–5)</label>
            <div style={{ border: `1px solid ${C.cinzaF}`, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
              {CRITERIOS_AUD.map(([k, nome], ci) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: ci % 2 ? "#fff" : C.cinzaF, borderBottom: ci < CRITERIOS_AUD.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
                  <div style={{ flex: "1 1 auto", fontSize: 12.5 }}>{k.length === 1 ? k + " · " : ""}{nome}</div>
                  <select value={(p.notas && p.notas[k]) || ""} onChange={e => upNota(i, k, e.target.value)} style={{ width: 56, border: `1.5px solid ${C.cinzaM}`, borderRadius: 6, padding: "5px", fontSize: 13, background: "#fff" }}>
                    <option value="">–</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <input value={(p.obs && p.obs[k]) || ""} onChange={e => upObs(i, k, e.target.value)} placeholder="obs" style={{ flex: "1 1 110px", minWidth: 0, border: `1.5px solid ${C.cinzaM}`, borderRadius: 6, padding: "5px 7px", fontSize: 12, background: "#fff" }} />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13 }}>Média: <b style={{ fontSize: 16, color: corStatusAud(stEfetivo) }}>{media == null ? "—" : media.toFixed(1)}</b></div>
              <div style={{ flex: "1 1 200px" }}>
                <label style={lbl}>STATUS FINAL {p.status ? "" : (media != null ? "(auto)" : "")}</label>
                <select value={stEfetivo} onChange={e => upPrato(i, { status: e.target.value })} style={{ ...inp, color: corStatusAud(stEfetivo), fontWeight: 600 }}>
                  <option value="">—</option>{STATUS_AUD.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer", marginTop: 14 }}>
                <input type="checkbox" checked={!!p.falhaCrit} onChange={e => upPrato(i, { falhaCrit: e.target.checked })} /> falha crítica
              </label>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <div style={{ flex: "1 1 150px" }}><label style={lbl}>TIPO DE FALHA</label><select value={p.tipoFalha} onChange={e => upPrato(i, { tipoFalha: e.target.value })} style={inp}>{TIPO_FALHA_AUD.map(t => <option key={t} value={t}>{t || "—"}</option>)}</select></div>
              <div style={{ flex: "1 1 100%" }}><label style={lbl}>PONTOS POSITIVOS</label><textarea value={p.positivos} onChange={e => upPrato(i, { positivos: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} /></div>
              <div style={{ flex: "1 1 100%" }}><label style={lbl}>PONTOS DE ATENÇÃO</label><textarea value={p.atencao} onChange={e => upPrato(i, { atencao: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} /></div>
              <div style={{ flex: "1 1 100%" }}><label style={lbl}>AJUSTES NECESSÁRIOS</label><textarea value={p.ajustes} onChange={e => upPrato(i, { ajustes: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} /></div>
              <div style={{ flex: "1 1 160px" }}><label style={lbl}>RESPONSÁVEL</label><input value={p.responsavel} onChange={e => upPrato(i, { responsavel: e.target.value })} style={inp} /></div>
              <div style={{ flex: "1 1 120px" }}><label style={lbl}>PRAZO</label><input value={p.prazo} onChange={e => upPrato(i, { prazo: e.target.value })} placeholder="ex.: 15/09" style={inp} /></div>
            </div>
          </div>
        );
      })}

      {draft.pratos.length === 0 && <div className="pa-card" style={{ padding: 20, textAlign: "center", color: C.cinzaE, fontStyle: "italic", marginBottom: 12 }}>Nenhum prato ainda. Toque em “+ Adicionar prato”.</div>}

      <div className="pa-card" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📊 Resumo geral</div>
        <div style={{ fontSize: 11.5, color: C.cinzaE, marginBottom: 10 }}>Regra de ouro: 1) o prato sai como foi aprovado? 2) a equipe executa sem a Zeste? 3) o prato é viável na operação? Sim às três = implementado.</div>
        {[["q1", "1. O cardápio está funcionando na prática?"], ["q2", "2. A equipe demonstra autonomia?"], ["q3", "3. Os pratos mantêm o padrão aprovado?"], ["q4", "4. A operação sustenta os pratos?"], ["q5", "5. Há gargalos relevantes?"], ["q6", "6. O que precisa ser ajustado antes do encerramento?"]].map(([k, q]) => (
          <div key={k} style={{ marginBottom: 8 }}><label style={lbl}>{q}</label><textarea value={draft.resumo[k]} onChange={e => upResumo({ [k]: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} /></div>
        ))}
      </div>

      <button onClick={salvar} className="pa-btn" style={{ width: "100%", background: C.verde, color: "#fff", border: "none", padding: "12px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 20 }}>Salvar auditoria</button>
    </div>
  );
}

export default function PortalAdmin({ onBack, token }) {
  const [clientes, setClientes] = useState([]);
  const [sel, setSel] = useState(null);
  const [aba, setAba] = useState("visao");
  const [docs, setDocs] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [docsOp, setDocsOp] = useState([]);
  const [pratos, setPratos] = useState([]);
  const [fichasCount, setFichasCount] = useState(0);
  const [crm, setCrm] = useState(null); // contato do CRM vinculado (fase do 5E)
  const [auditorias, setAuditorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sbLoadRaw("fin_portal_clientes", token, "select=*&order=nome_display.asc").then(r => { setClientes(r); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!sel) return;
    setAba("visao");
    const cid = sel.cliente_id;
    sbLoadRaw("portal_documentos", token, `cliente_id=eq.${cid}&select=*&order=created_at.desc`).then(r => setDocs(r.map(x => x.dados || x)));
    sbLoadRaw("portal_etapas", token, `cliente_id=eq.${cid}&select=*&order=created_at.asc`).then(r => setEtapas(r.map(x => x.dados || x)));
    sbLoadRaw("docs_operacionais", token, `cliente_id=eq.${cid}&deleted_at=is.null&select=*&order=updated_at.desc`).then(r => setDocsOp(r.map(x => x.dados || x)));
    sbLoadRaw("fin_pratos", token, `cliente_id=eq.${cid}&deleted_at=is.null&select=*`).then(r => setPratos(r.map(x => x.dados || x)));
    sbLoadRaw("fin_fichas", token, `cliente_id=eq.${cid}&deleted_at=is.null&select=id`).then(r => setFichasCount(r.length));
    sbLoadRaw("portal_auditorias", token, `cliente_id=eq.${cid}&deleted_at=is.null&select=*&order=created_at.desc`).then(r => setAuditorias(r.map(x => x.dados || x)));
    sbLoadRaw("crm_contatos", token, `deleted_at=is.null&select=id,data`).then(rows => {
      const alvo = _n(sel.nome_display);
      const m = rows.map(r => ({ ...(r.data || {}), _rowId: r.id })).find(c =>
        [_n(c.company), _n(c.empresa), _n(c.nome), _n(c.name)].includes(alvo) || c._rowId === cid
      );
      setCrm(m || null);
    });
  }, [sel]);

  // fase do 5E vive no contato do CRM — o portal do cliente lê de lá
  const saveFase = async n => {
    if (!crm) return;
    const novo = { ...crm, faseAtual: n };
    setCrm(novo);
    const { _rowId, ...data } = novo;
    await fetch(`${SB_URL}/rest/v1/crm_contatos?id=eq.${_rowId}`, { method: "PATCH", headers: sbH(token), body: JSON.stringify({ data, updated_at: new Date().toISOString() }) });
  };

  const toggleVisibilidade = async d => {
    const novo = { ...d, visibilidade: d.visibilidade === "entregavel" ? "interno" : "entregavel" };
    setDocsOp(p => p.map(x => x.id === d.id ? novo : x));
    await sbUpsert("docs_operacionais", novo, token, sel.cliente_id);
  };

  const saveDoc = async d => { setDocs(p => p.find(x => x.id === d.id) ? p.map(x => x.id === d.id ? d : x) : [d, ...p]); await sbUpsert("portal_documentos", d, token, sel.cliente_id); };
  const delDoc = async id => { setDocs(p => p.filter(x => x.id !== id)); await sbDel("portal_documentos", id, token); };
  const saveEtapa = async e => { setEtapas(p => p.find(x => x.id === e.id) ? p.map(x => x.id === e.id ? e : x) : [...p, e]); await sbUpsert("portal_etapas", e, token, sel.cliente_id); };
  const delEtapa = async id => { setEtapas(p => p.filter(x => x.id !== id)); await sbDel("portal_etapas", id, token); };
  const saveAuditoria = async a => { setAuditorias(p => p.find(x => x.id === a.id) ? p.map(x => x.id === a.id ? a : x) : [a, ...p]); await sbUpsert("portal_auditorias", a, token, sel.cliente_id); };
  const delAuditoria = async id => { setAuditorias(p => p.filter(x => x.id !== id)); await sbDel("portal_auditorias", id, token); };

  // SELEÇÃO DE CLIENTE
  if (!sel) return (
    <div className="pa-wrap">
      <style>{STYLE}</style>
      <div className="pa-header">
        {onBack && <button onClick={onBack} style={{ color: C.lima, fontSize: 22, background: "none", border: "none", cursor: "pointer" }}>‹</button>}
        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 800, color: C.lima, letterSpacing: ".06em" }}>ZESTE</span>
        <span style={{ fontSize: 9, color: "#555", letterSpacing: ".14em" }}>ÁREA DE MEMBROS · ADMIN</span>
      </div>
      <div style={{ padding: 16, maxWidth: 640, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, marginBottom: 4 }}>Gerenciar Área de Membros</h2>
        <p style={{ color: C.cinzaE, fontSize: 13, marginBottom: 16 }}>Escolha um cliente para ver o hub completo: projeto, documentos, pratos e portal.</p>
        {loading ? <div style={{ padding: 30, textAlign: "center", color: C.cinzaE }}>Carregando…</div> :
          clientes.length === 0 ? <div className="pa-card" style={{ padding: 30, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum cliente com acesso ao portal ainda. Toque em “+ Novo Cliente” para criar o primeiro acesso.</div> :
            <div className="pa-card">
              {clientes.map((c, i) => (
                <button key={c.cliente_id} onClick={() => setSel(c)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i < clientes.length - 1 ? `1px solid ${C.cinzaF}` : "none", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.lima, color: C.preto, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>{(c.nome_display || "?")[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16 }}>{c.nome_display}</div>
                    <div style={{ fontSize: 12, color: C.cinzaE }}>{c.email}{c.ativo ? "" : " · inativo"}</div>
                  </div>
                  <span style={{ color: C.azul, fontWeight: 700 }}>→</span>
                </button>
              ))}
            </div>}
      </div>
    </div>
  );

  // GESTÃO DO CLIENTE
  return (
    <div className="pa-wrap">
      <style>{STYLE}</style>
      <div className="pa-header">
        <button onClick={() => setSel(null)} style={{ color: C.lima, fontSize: 22, background: "none", border: "none", cursor: "pointer" }}>‹</button>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>{sel.nome_display}</div>
          <div style={{ fontSize: 10, color: "#777" }}>{sel.email}</div>
        </div>
      </div>
      <div style={{ display: "flex", background: C.preto, borderBottom: "1px solid #2A2A2A" }}>
        {[["visao", "Visão geral"], ["projeto", "Projeto"], ["documentos", "Documentos"], ["pratos", "Pratos"], ["implementacao", "Implementação"]].map(([id, l]) => (
          <button key={id} className="pa-tab" onClick={() => setAba(id)} style={{ color: aba === id ? C.lima : "#555", borderBottomColor: aba === id ? C.lima : "transparent" }}>{l}</button>
        ))}
      </div>

      {aba === "visao" && <VisaoGeral sel={sel} crm={crm} pratos={pratos} fichasCount={fichasCount} docsOp={docsOp} docs={docs} etapas={etapas} saveFase={saveFase} setAba={setAba} />}
      {aba === "projeto" && <EtapasAdmin etapas={etapas} onSave={saveEtapa} onDelete={delEtapa} />}
      {aba === "documentos" && <><CadernosAdmin docsOp={docsOp} onToggle={toggleVisibilidade} /><DocsAdmin docs={docs} onSave={saveDoc} onDelete={delDoc} /></>}
      {aba === "pratos" && <PratosResumo pratos={pratos} />}
      {aba === "implementacao" && <AuditoriaPOP10 auditorias={auditorias} pratosCliente={pratos} onSave={saveAuditoria} onDelete={delAuditoria} clienteNome={sel.nome_display} />}
    </div>
  );
}

function DocsAdmin({ docs, onSave, onDelete }) {
  const [f, setF] = useState({ nome: "", url: "", tipo: "pdf", data: td() });
  const add = () => {
    if (!f.nome || !f.url) { alert("Preencha nome e link do documento."); return; }
    onSave({ ...f, id: uid() });
    setF({ nome: "", url: "", tipo: "pdf", data: td() });
  };
  return (
    <div style={{ padding: 16, maxWidth: 640, margin: "0 auto" }}>
      <div className="pa-card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>+ Adicionar documento</div>
        <label className="pa-label">Nome do documento</label>
        <input className="pa-input" value={f.nome} onChange={e => setF(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Diagnóstico Operacional — Outubro" />
        <label className="pa-label">Link (Google Drive, Dropbox, etc)</label>
        <input className="pa-input" value={f.url} onChange={e => setF(p => ({ ...p, url: e.target.value }))} placeholder="https://drive.google.com/..." />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label className="pa-label">Tipo</label>
            <select className="pa-input" value={f.tipo} onChange={e => setF(p => ({ ...p, tipo: e.target.value }))}>
              <option value="pdf">📄 PDF / Documento</option>
              <option value="img">🖼 Imagem</option>
              <option value="link">📎 Link / Outro</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="pa-label">Data</label>
            <input className="pa-input" type="date" value={f.data} onChange={e => setF(p => ({ ...p, data: e.target.value }))} />
          </div>
        </div>
        <button className="pa-btn" onClick={add} style={{ background: C.lima, color: C.preto, marginTop: 14, width: "100%" }}>✓ Compartilhar com o cliente</button>
        <div style={{ fontSize: 11, color: C.cinzaE, marginTop: 8 }}>💡 Dica: no Google Drive, deixe o arquivo como "qualquer pessoa com o link pode ver" antes de colar aqui.</div>
      </div>

      <div className="pa-card">
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>Documentos compartilhados ({docs.length})</div>
        {docs.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum documento compartilhado ainda. Use o formulário acima para enviar um link ao cliente.</div> :
          docs.map((d, i) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: i < docs.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
              <div style={{ fontSize: 22 }}>{d.tipo === "pdf" ? "📄" : d.tipo === "img" ? "🖼" : "📎"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{d.nome}</div>
                <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: C.azul, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{d.url}</a>
              </div>
              <button onClick={() => { if (confirm("Remover documento?")) onDelete(d.id); }} style={{ background: "none", border: "none", color: C.coral, cursor: "pointer", fontSize: 14 }}>🗑</button>
            </div>
          ))}
      </div>
    </div>
  );
}

function EtapasAdmin({ etapas, onSave, onDelete }) {
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [tipo, setTipo] = useState("reuniao");
  const [escopo, setEscopo] = useState("");
  const [preparar, setPreparar] = useState("");
  const add = () => { if (!titulo) return; onSave({ id: uid(), titulo, data, tipo, escopo, preparar, done: false }); setTitulo(""); setData(""); setEscopo(""); setPreparar(""); };
  const toggle = e => onSave({ ...e, done: !e.done });
  const TIPOS = [["reuniao", "Reunião"], ["entrega", "Entrega"], ["tarefa", "Tarefa"]];
  return (
    <div style={{ padding: 16, maxWidth: 640, margin: "0 auto" }}>
      <div className="pa-card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>+ Adicionar etapa do projeto</div>
        <div style={{ fontSize: 12, color: C.cinzaE, marginBottom: 10 }}>O que você preencher aqui aparece no portal do cliente — copie do Notion: data, escopo do encontro e o que o cliente precisa levar (conforme o POP do projeto).</div>
        <label className="pa-label">Tipo</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          {TIPOS.map(([v, l]) => <button key={v} onClick={() => setTipo(v)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1.5px solid ${tipo === v ? C.lima : C.border}`, background: tipo === v ? C.lima : "#fff", color: tipo === v ? C.preto : C.cinzaE, fontWeight: 700, fontSize: 13 }}>{l}</button>)}
        </div>
        <label className="pa-label">Título</label>
        <input className="pa-input" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Reunião de Diagnóstico de Coerência" />
        <label className="pa-label">Data (opcional)</label>
        <input className="pa-input" type="date" value={data} onChange={e => setData(e.target.value)} />
        <label className="pa-label">O que vai ser tratado (escopo)</label>
        <textarea className="pa-input" rows={2} value={escopo} onChange={e => setEscopo(e.target.value)} placeholder="Ex: Apresentação do diagnóstico do cardápio atual e definição das prioridades do reposicionamento." style={{ resize: "vertical", fontFamily: "inherit" }} />
        <label className="pa-label">O que o cliente precisa para este dia (1 item por linha)</label>
        <textarea className="pa-input" rows={3} value={preparar} onChange={e => setPreparar(e.target.value)} placeholder={"Cardápio atual impresso\nNotas de compra do último mês\n30 min sem interrupções"} style={{ resize: "vertical", fontFamily: "inherit" }} />
        <button className="pa-btn" onClick={add} style={{ background: C.lima, color: C.preto, marginTop: 14, width: "100%" }}>Adicionar etapa</button>
      </div>

      <div className="pa-card">
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>Etapas do projeto ({etapas.length})</div>
        {etapas.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhuma etapa ainda. Cadastre as etapas do projeto para o cliente acompanhar o andamento.</div> :
          etapas.map((e, i) => (
            <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", borderBottom: i < etapas.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
              <button onClick={() => toggle(e)} title={e.done ? "Concluída" : "Marcar como concluída"} style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${e.done ? C.verde : C.cinzaM}`, background: e.done ? C.verde : "#fff", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 2 }}>{e.done ? "✓" : ""}</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, textDecoration: e.done ? "line-through" : "none", color: e.done ? C.cinzaE : "inherit" }}>
                  {e.tipo && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", color: C.cinzaE, marginRight: 6 }}>[{(e.tipo || "").toUpperCase()}]</span>}{e.titulo}
                </div>
                {e.data && <div style={{ fontSize: 11, color: C.cinzaE }}>{new Date(e.data + "T12:00:00").toLocaleDateString("pt-BR")}</div>}
                {e.escopo && <div style={{ fontSize: 12, color: C.cinzaE, marginTop: 2 }}>{e.escopo}</div>}
                {e.preparar && <div style={{ fontSize: 12, color: C.verde, marginTop: 2 }}>Preparar: {e.preparar.split("\n").filter(x => x.trim()).join(" · ")}</div>}
              </div>
              <button onClick={() => { if (confirm("Remover etapa?")) onDelete(e.id); }} style={{ color: C.coral, fontSize: 12, fontWeight: 700 }}>Remover</button>
            </div>
          ))}
      </div>
    </div>
  );
}


// ── VISÃO GERAL — hub do cliente ─────────────────────────────────
const FASES_5E = ["Enxergar", "Estruturar", "Evoluir", "Escalar", "Elevar"];
function VisaoGeral({ sel, crm, pratos, fichasCount, docsOp, docs, etapas, saveFase, setAba }) {
  const entregaveis = docsOp.filter(d => d.visibilidade === "entregavel").length;
  const semMop = pratos.filter(p => !(p.modoPreparo || "").trim()).length;
  const semPreco = pratos.filter(p => !p.precoVenda).length;
  const proxima = etapas.filter(e => !e.done && e.data).sort((a, b) => (a.data > b.data ? 1 : -1))[0];
  const faseAtual = crm?.faseAtual || 1;
  const stats = [
    { n: pratos.length, l: "pratos", aba: "pratos" },
    { n: fichasCount, l: "fichas", aba: null },
    { n: entregaveis, l: "cadernos no portal", aba: "documentos" },
    { n: docs.length, l: "links compartilhados", aba: "documentos" },
  ];
  const alertas = [];
  if (semPreco > 0) alertas.push(`${semPreco} prato${semPreco > 1 ? "s" : ""} sem preço de venda — não entra na matriz nem no caderno gerencial`);
  if (semMop > 0) alertas.push(`${semMop} prato${semMop > 1 ? "s" : ""} sem modo de preparo — caderno operacional sai incompleto`);
  if (entregaveis === 0 && pratos.length > 0) alertas.push("Nenhum caderno visível no portal — gere em Operação → Cadernos");
  return (
    <div style={{ padding: 16, maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
        {stats.map(st => (
          <button key={st.l} onClick={() => st.aba && setAba(st.aba)} className="pa-card" style={{ padding: "12px 6px", textAlign: "center", cursor: st.aba ? "pointer" : "default", border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, fontWeight: 800, color: C.preto }}>{st.n}</div>
            <div style={{ fontSize: 10, color: C.cinzaE, letterSpacing: ".03em", textTransform: "uppercase", fontWeight: 700 }}>{st.l}</div>
          </button>
        ))}
      </div>

      {alertas.length > 0 && (
        <div className="pa-card" style={{ padding: 14, marginBottom: 14, borderLeft: `4px solid ${C.coral}` }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 13, color: C.coral, marginBottom: 6, letterSpacing: ".05em" }}>EXIGE ATENÇÃO</div>
          {alertas.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "3px 0", color: C.preto }}>• {a}</div>)}
        </div>
      )}

      <div className="pa-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 10, letterSpacing: ".05em" }}>MÉTODO 5E — FASE ATUAL</div>
        {!crm ? <div style={{ fontSize: 13, color: C.cinzaE, fontStyle: "italic" }}>Sem contato vinculado no CRM (Comercial). Cadastre a empresa "{sel.nome_display}" no CRM para controlar a fase do projeto aqui.</div> : (
          <div style={{ display: "flex", gap: 6 }}>
            {FASES_5E.map((f, i) => {
              const n = i + 1, done = n < faseAtual, cur = n === faseAtual;
              return (
                <button key={f} onClick={() => { if (confirm(`Mudar a fase atual para "${f}"? O cliente vê isso no portal.`)) saveFase(n); }}
                  style={{ flex: 1, padding: "10px 2px", borderRadius: 8, border: `1.5px solid ${cur ? C.lima : done ? C.verde : C.border}`, background: cur ? C.lima : done ? C.verde : "#fff", color: cur ? C.preto : done ? "#fff" : C.cinzaE, cursor: "pointer" }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15 }}>{done ? "✓" : n}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".02em" }}>{f}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="pa-card" style={{ padding: 16 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 8, letterSpacing: ".05em" }}>PRÓXIMO ENCONTRO</div>
        {proxima ? (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{proxima.titulo}</div>
            <div style={{ fontSize: 13, color: C.cinzaE, marginTop: 2 }}>{new Date(proxima.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</div>
            {proxima.escopo && <div style={{ fontSize: 13, color: C.cinzaE, marginTop: 4 }}>{proxima.escopo}</div>}
          </div>
        ) : <div style={{ fontSize: 13, color: C.cinzaE, fontStyle: "italic" }}>Nenhum encontro agendado. Adicione na aba Projeto.</div>}
      </div>
    </div>
  );
}

// ── CADERNOS GERADOS — visibilidade no portal ────────────────────
function CadernosAdmin({ docsOp, onToggle }) {
  if (docsOp.length === 0) return null;
  return (
    <div style={{ padding: "16px 16px 0", maxWidth: 640, margin: "0 auto" }}>
      <div className="pa-card" style={{ marginBottom: 0 }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>Cadernos gerados ({docsOp.length})</div>
        {docsOp.map((d, i) => {
          const vis = d.visibilidade === "entregavel";
          return (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: i < docsOp.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
              <div style={{ fontSize: 20 }}>{d.modelo === "fichas_praca" ? "🖼" : d.modelo === "caderno_gerencial" ? "📊" : "⚡"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.titulo}</div>
                <div style={{ fontSize: 11, color: vis ? C.verde : C.cinzaE }}>{vis ? "✓ Visível no portal do cliente" : "Interno — cliente não vê"}</div>
              </div>
              <button onClick={() => onToggle(d)} className="pa-btn" style={{ background: vis ? C.cinzaF : C.verde, color: vis ? C.cinzaE : "#fff", fontSize: 12, padding: "7px 12px" }}>{vis ? "Ocultar" : "Publicar"}</button>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: C.cinzaE, marginTop: 8 }}>💡 Os cadernos são gerados em Operação → Cadernos. Aqui você controla o que o cliente vê.</div>
    </div>
  );
}

// ── PRATOS DO CLIENTE — leitura ──────────────────────────────────
function PratosResumo({ pratos }) {
  const brl = n => "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  return (
    <div style={{ padding: 16, maxWidth: 640, margin: "0 auto" }}>
      <div className="pa-card">
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>Pratos do cliente ({pratos.length})</div>
        {pratos.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum prato ainda. Cadastre em Operação → Pratos com o cliente selecionado.</div> :
          pratos.map((p, i) => (
            <div key={p.id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: i < pratos.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
                <div style={{ fontSize: 11, color: C.cinzaE }}>
                  {p.categoria || "sem categoria"}
                  {!(p.modoPreparo || "").trim() && <span style={{ color: C.coral, fontWeight: 700 }}> · sem MOP</span>}
                </div>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16, color: p.precoVenda ? C.preto : C.coral }}>{p.precoVenda ? brl(p.precoVenda) : "sem preço"}</div>
            </div>
          ))}
      </div>
      <div style={{ fontSize: 11, color: C.cinzaE, marginTop: 8 }}>💡 Edição de pratos, fichas e custos acontece em Operação. Esta é a visão consolidada do cliente.</div>
    </div>
  );
}

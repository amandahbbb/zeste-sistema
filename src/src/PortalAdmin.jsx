import { useState, useEffect } from "react";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
async function sbLoadRaw(table, t, query = "") { try { const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d : []; } catch { return []; } }
async function sbUpsert(table, item, t, clienteId) { await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: { ...sbH(t), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: item.id, cliente_id: clienteId, dados: item, updated_at: new Date().toISOString() }) }); }
async function sbDel(table, id, t) { await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: sbH(t) }); }

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
    sbLoadRaw("crm_contatos", token, `deleted_at=is.null&select=id,data`).then(rows => {
      const m = rows.map(r => ({ ...(r.data || {}), _rowId: r.id })).find(c =>
        c.empresa?.toLowerCase() === sel.nome_display?.toLowerCase() ||
        c.nome?.toLowerCase() === sel.nome_display?.toLowerCase() ||
        c._rowId === cid
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
        {[["visao", "Visão geral"], ["projeto", "Projeto"], ["documentos", "Documentos"], ["pratos", "Pratos"]].map(([id, l]) => (
          <button key={id} className="pa-tab" onClick={() => setAba(id)} style={{ color: aba === id ? C.lima : "#555", borderBottomColor: aba === id ? C.lima : "transparent" }}>{l}</button>
        ))}
      </div>

      {aba === "visao" && <VisaoGeral sel={sel} crm={crm} pratos={pratos} fichasCount={fichasCount} docsOp={docsOp} docs={docs} etapas={etapas} saveFase={saveFase} setAba={setAba} />}
      {aba === "projeto" && <EtapasAdmin etapas={etapas} onSave={saveEtapa} onDelete={delEtapa} />}
      {aba === "documentos" && <><CadernosAdmin docsOp={docsOp} onToggle={toggleVisibilidade} /><DocsAdmin docs={docs} onSave={saveDoc} onDelete={delDoc} /></>}
      {aba === "pratos" && <PratosResumo pratos={pratos} />}
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

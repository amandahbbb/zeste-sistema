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
  const [aba, setAba] = useState("documentos");
  const [docs, setDocs] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sbLoadRaw("fin_portal_clientes", token, "select=*&order=nome_display.asc").then(r => { setClientes(r); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!sel) return;
    sbLoadRaw("portal_documentos", token, `cliente_id=eq.${sel.cliente_id}&select=*&order=created_at.desc`).then(r => setDocs(r.map(x => x.dados || x)));
    sbLoadRaw("portal_etapas", token, `cliente_id=eq.${sel.cliente_id}&select=*&order=created_at.asc`).then(r => setEtapas(r.map(x => x.dados || x)));
  }, [sel]);

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
        <p style={{ color: C.cinzaE, fontSize: 13, marginBottom: 16 }}>Escolha um cliente para gerenciar documentos e etapas do projeto.</p>
        {loading ? <div style={{ padding: 30, textAlign: "center", color: C.cinzaE }}>Carregando…</div> :
          clientes.length === 0 ? <div className="pa-card" style={{ padding: 30, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum cliente com acesso ao portal ainda.</div> :
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
        {[["documentos", "📁 Documentos"], ["etapas", "🎯 Etapas do Projeto"]].map(([id, l]) => (
          <button key={id} className="pa-tab" onClick={() => setAba(id)} style={{ color: aba === id ? C.lima : "#555", borderBottomColor: aba === id ? C.lima : "transparent" }}>{l}</button>
        ))}
      </div>

      {aba === "documentos" && <DocsAdmin docs={docs} onSave={saveDoc} onDelete={delDoc} />}
      {aba === "etapas" && <EtapasAdmin etapas={etapas} onSave={saveEtapa} onDelete={delEtapa} />}
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
        {docs.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum documento ainda</div> :
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
        {etapas.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhuma etapa ainda</div> :
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

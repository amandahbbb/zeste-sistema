import { useState, useEffect } from "react";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
async function sbLoad(t) { try { const r = await fetch(`${SB_URL}/rest/v1/docs_operacionais?deleted_at=is.null&order=updated_at.desc`, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d.map(x => x.dados) : []; } catch { return []; } }
async function sbSave(doc, t) { await fetch(`${SB_URL}/rest/v1/docs_operacionais`, { method: "POST", headers: { ...sbH(t), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: doc.id, cliente_id: doc.clienteId || "zeste", dados: doc, updated_at: new Date().toISOString() }) }); }
async function sbDel(id, t) { await fetch(`${SB_URL}/rest/v1/docs_operacionais?id=eq.${id}`, { method: "PATCH", headers: sbH(t), body: JSON.stringify({ deleted_at: new Date().toISOString() }) }); }

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const td = () => new Date().toISOString().slice(0, 10);
const C = { preto: "#0E0E0C", branco: "#fff", lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B", creme: "#F2EBD8", cinzaE: "#6B6B5E", cinzaF: "#F0EEE8", cinzaM: "#D9D5C8", border: "#E3E1D9" };

// ── MODELOS DE DOCUMENTO ──────────────────────────────────
// Cada modelo tem seções; cada seção tem campos (ou é repetível)
const MODELOS = {
  caderno_op: {
    nome: "Caderno Operacional",
    icon: "📕",
    desc: "Empratamento, modo de preparo, checklists e receitas base — o padrão 440.",
    secoes: [
      { id: "pratos", titulo: "Pratos", repetivel: true, itemNome: "prato", campos: [
        { k: "nome", label: "Nome do prato", tipo: "texto" },
        { k: "ingredientes", label: "Ingredientes (um por linha)", tipo: "lista" },
        { k: "mop", label: "Modo de preparo / Empratamento", tipo: "textao" },
        { k: "checklist", label: "Checklist de finalização (um por linha)", tipo: "lista" },
        { k: "utensilios", label: "Utensílios", tipo: "lista" },
      ]},
      { id: "receitas", titulo: "Receitas Base", repetivel: true, itemNome: "receita", campos: [
        { k: "nome", label: "Nome da receita base", tipo: "texto" },
        { k: "rendimento", label: "Rendimento", tipo: "texto" },
        { k: "ingredientes", label: "Ingredientes (um por linha)", tipo: "lista" },
        { k: "preparo", label: "Modo de preparo", tipo: "textao" },
      ]},
      { id: "checklists", titulo: "Checklists Operacionais", repetivel: true, itemNome: "checklist", campos: [
        { k: "nome", label: "Título do checklist", tipo: "texto" },
        { k: "itens", label: "Itens (um por linha)", tipo: "lista" },
      ]},
    ],
  },
  pop_interno: {
    nome: "POP — Procedimento Interno",
    icon: "📘",
    desc: "Procedimento operacional padrão da Zeste (Método 5E).",
    secoes: [
      { id: "info", titulo: "Identificação", repetivel: false, campos: [
        { k: "etapa5e", label: "Etapa do Método 5E", tipo: "texto" },
        { k: "objetivo", label: "Objetivo do POP", tipo: "textao" },
      ]},
      { id: "atividades", titulo: "Atividades", repetivel: true, itemNome: "atividade", campos: [
        { k: "nome", label: "Atividade", tipo: "texto" },
        { k: "descricao", label: "Como executar", tipo: "textao" },
        { k: "responsavel", label: "Responsável", tipo: "texto" },
      ]},
      { id: "checklist", titulo: "Checklist de Execução", repetivel: false, campos: [
        { k: "itens", label: "Itens do checklist (um por linha)", tipo: "lista" },
      ]},
      { id: "criterios", titulo: "Critérios de Aprovação", repetivel: false, campos: [
        { k: "criterios", label: "Critérios (um por linha)", tipo: "lista" },
      ]},
    ],
  },
  ficha_gerencial: {
    nome: "Documento Gerencial",
    icon: "📊",
    desc: "Análise gerencial livre — custos, margens, recomendações.",
    secoes: [
      { id: "contexto", titulo: "Contexto", repetivel: false, campos: [
        { k: "resumo", label: "Resumo executivo", tipo: "textao" },
      ]},
      { id: "topicos", titulo: "Tópicos", repetivel: true, itemNome: "tópico", campos: [
        { k: "titulo", label: "Título", tipo: "texto" },
        { k: "conteudo", label: "Conteúdo", tipo: "textao" },
      ]},
    ],
  },
};

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Antonio:wght@400;600;700&family=Barlow:wght@400;500;600;700&display=swap');
.doc-page{padding:16px;max-width:820px;margin:0 auto}
.doc-card{background:#fff;border:1px solid ${C.border};border-radius:12px;overflow:hidden}
.doc-input{width:100%;border:1.5px solid ${C.cinzaM};border-radius:7px;padding:9px 11px;font-size:14px;font-family:inherit;background:#FCFBF9;outline:none}
.doc-input:focus{border-color:${C.lima}}
.doc-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${C.cinzaE};display:block;margin-bottom:5px;margin-top:14px}
.doc-btn{padding:9px 15px;border-radius:8px;font-family:'Antonio',sans-serif;font-weight:600;font-size:14px;letter-spacing:.03em;cursor:pointer;border:none}
.doc-modelo{background:#fff;border:1.5px solid ${C.border};border-radius:12px;padding:18px;cursor:pointer;transition:all .15s;text-align:left}
.doc-modelo:hover{border-color:${C.lima};box-shadow:0 4px 16px rgba(0,0,0,.08)}
`;

export default function Documentos({ token, clientes = [] }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // documento em edição
  const [escolhendo, setEscolhendo] = useState(false); // escolha de modelo

  useEffect(() => { sbLoad(token).then(d => { setDocs(d); setLoading(false); }); }, []);

  const salvar = async (doc) => {
    const d = { ...doc, atualizadoEm: new Date().toISOString() };
    setDocs(p => p.find(x => x.id === d.id) ? p.map(x => x.id === d.id ? d : x) : [d, ...p]);
    await sbSave(d, token);
    setEditing(null);
  };
  const excluir = async (id) => { if (!confirm("Excluir este documento?")) return; setDocs(p => p.filter(x => x.id !== id)); await sbDel(id, token); setEditing(null); };

  const novoDoc = (modeloId) => {
    const modelo = MODELOS[modeloId];
    const dados = {};
    modelo.secoes.forEach(s => { dados[s.id] = s.repetivel ? [] : {}; });
    setEditing({ id: uid(), modelo: modeloId, titulo: "", clienteId: "zeste", visibilidade: "interno", dados, criadoEm: new Date().toISOString() });
    setEscolhendo(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.cinzaE }}><style>{STYLE}</style>Carregando documentos…</div>;

  // EDITOR
  if (editing) return <Editor doc={editing} clientes={clientes} onSave={salvar} onDelete={excluir} onCancel={() => setEditing(null)} />;

  // ESCOLHA DE MODELO
  if (escolhendo) return (
    <div className="doc-page">
      <style>{STYLE}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={() => setEscolhendo(false)} style={{ color: C.verde, background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>‹</button>
        <h2 style={{ fontFamily: "'Antonio',sans-serif", fontSize: 22, fontWeight: 700 }}>Escolha um modelo</h2>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {Object.entries(MODELOS).map(([id, m]) => (
          <button key={id} className="doc-modelo" onClick={() => novoDoc(id)}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontFamily: "'Antonio',sans-serif", fontSize: 18, fontWeight: 600 }}>{m.nome}</div>
            <div style={{ fontSize: 13, color: C.cinzaE, marginTop: 3 }}>{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // LISTA
  return (
    <div className="doc-page">
      <style>{STYLE}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Antonio',sans-serif", fontSize: 22, fontWeight: 700 }}>Documentos</h2>
          <p style={{ fontSize: 13, color: C.cinzaE, marginTop: 2 }}>Crie documentos operacionais e gerenciais no padrão Zeste.</p>
        </div>
        <button className="doc-btn" onClick={() => setEscolhendo(true)} style={{ background: C.lima, color: C.preto }}>+ Novo</button>
      </div>

      {docs.length === 0 ? (
        <div className="doc-card" style={{ padding: 40, textAlign: "center", color: C.cinzaE }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div style={{ fontFamily: "'Antonio',sans-serif", fontSize: 18, fontWeight: 600, marginBottom: 6, color: C.preto }}>Nenhum documento ainda</div>
          <div style={{ fontSize: 13 }}>Clique em <strong>+ Novo</strong> e escolha um modelo para começar.</div>
        </div>
      ) : (
        <div className="doc-card">
          {docs.map((d, i) => {
            const m = MODELOS[d.modelo] || {};
            const cli = clientes.find(c => c.cliente_id === d.clienteId);
            return (
              <div key={d.id} onClick={() => setEditing(d)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < docs.length - 1 ? `1px solid ${C.cinzaF}` : "none", cursor: "pointer" }}>
                <div style={{ fontSize: 26 }}>{m.icon || "📄"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Antonio',sans-serif", fontWeight: 600, fontSize: 16 }}>{d.titulo || "(sem título)"}</div>
                  <div style={{ fontSize: 12, color: C.cinzaE }}>{m.nome}{d.visibilidade === "entregavel" ? ` · 📤 ${cli ? cli.nome_display : "cliente"}` : " · 🔒 interno"}</div>
                </div>
                <span style={{ color: C.azul, fontWeight: 700 }}>→</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Editor({ doc, clientes, onSave, onDelete, onCancel }) {
  const [d, setD] = useState(doc);
  const modelo = MODELOS[d.modelo];
  const S = (patch) => setD(p => ({ ...p, ...patch }));
  const setSecao = (sid, val) => setD(p => ({ ...p, dados: { ...p.dados, [sid]: val } }));

  const addItem = (sec) => {
    const novo = {}; sec.campos.forEach(c => novo[c.k] = c.tipo === "lista" ? "" : "");
    setSecao(sec.id, [...(d.dados[sec.id] || []), novo]);
  };
  const updItem = (sid, idx, k, v) => setSecao(sid, d.dados[sid].map((it, i) => i === idx ? { ...it, [k]: v } : it));
  const delItem = (sid, idx) => setSecao(sid, d.dados[sid].filter((_, i) => i !== idx));
  const updCampo = (sid, k, v) => setSecao(sid, { ...(d.dados[sid] || {}), [k]: v });

  const Campo = ({ c, val, onCh }) => {
    if (c.tipo === "textao") return <textarea className="doc-input" rows={4} value={val || ""} onChange={e => onCh(e.target.value)} style={{ resize: "vertical" }} />;
    if (c.tipo === "lista") return <textarea className="doc-input" rows={3} value={val || ""} onChange={e => onCh(e.target.value)} placeholder="Um item por linha…" style={{ resize: "vertical" }} />;
    return <input className="doc-input" value={val || ""} onChange={e => onCh(e.target.value)} />;
  };

  return (
    <div className="doc-page">
      <style>{STYLE}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button onClick={onCancel} style={{ color: C.verde, background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>‹</button>
        <span style={{ fontSize: 24 }}>{modelo.icon}</span>
        <span style={{ fontFamily: "'Antonio',sans-serif", fontSize: 18, fontWeight: 600, color: C.cinzaE }}>{modelo.nome}</span>
      </div>

      <div className="doc-card" style={{ padding: 18, marginBottom: 16 }}>
        <label className="doc-label" style={{ marginTop: 0 }}>Título do documento</label>
        <input className="doc-input" value={d.titulo} onChange={e => S({ titulo: e.target.value })} placeholder="Ex: Caderno Operacional — 440 Restaurante" />

        <label className="doc-label">Visibilidade</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="doc-btn" onClick={() => S({ visibilidade: "interno" })} style={{ flex: 1, background: d.visibilidade === "interno" ? C.verde : "#F0EEE8", color: d.visibilidade === "interno" ? "#fff" : C.cinzaE }}>🔒 Interno (só Zeste)</button>
          <button className="doc-btn" onClick={() => S({ visibilidade: "entregavel" })} style={{ flex: 1, background: d.visibilidade === "entregavel" ? C.lima : "#F0EEE8", color: d.visibilidade === "entregavel" ? C.preto : C.cinzaE }}>📤 Entregável (cliente)</button>
        </div>
        {d.visibilidade === "entregavel" && (
          <>
            <label className="doc-label">Cliente que vai receber</label>
            <select className="doc-input" value={d.clienteId} onChange={e => S({ clienteId: e.target.value })}>
              <option value="zeste">— selecione —</option>
              {clientes.map(c => <option key={c.cliente_id} value={c.cliente_id}>{c.nome_display}</option>)}
            </select>
          </>
        )}
      </div>

      {modelo.secoes.map(sec => (
        <div key={sec.id} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <h3 style={{ fontFamily: "'Antonio',sans-serif", fontSize: 17, fontWeight: 600 }}>{sec.titulo}</h3>
            {sec.repetivel && <button className="doc-btn" onClick={() => addItem(sec)} style={{ background: "#F0EEE8", color: C.verde, fontSize: 13, padding: "6px 12px" }}>+ {sec.itemNome}</button>}
          </div>

          {sec.repetivel ? (
            (d.dados[sec.id] || []).length === 0 ? <div style={{ fontSize: 13, color: C.cinzaE, fontStyle: "italic", padding: "6px 2px" }}>Nenhum {sec.itemNome} ainda.</div> :
              (d.dados[sec.id] || []).map((item, idx) => (
                <div key={idx} className="doc-card" style={{ padding: 16, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Antonio',sans-serif", fontSize: 14, fontWeight: 600, color: C.lima }}>{sec.itemNome.toUpperCase()} {idx + 1}</span>
                    <button onClick={() => delItem(sec.id, idx)} style={{ background: "none", border: "none", color: C.coral, cursor: "pointer", fontSize: 14 }}>🗑</button>
                  </div>
                  {sec.campos.map(c => (
                    <div key={c.k}>
                      <label className="doc-label">{c.label}</label>
                      <Campo c={c} val={item[c.k]} onCh={v => updItem(sec.id, idx, c.k, v)} />
                    </div>
                  ))}
                </div>
              ))
          ) : (
            <div className="doc-card" style={{ padding: 16 }}>
              {sec.campos.map(c => (
                <div key={c.k}>
                  <label className="doc-label" style={{ marginTop: sec.campos[0].k === c.k ? 0 : 14 }}>{c.label}</label>
                  <Campo c={c} val={(d.dados[sec.id] || {})[c.k]} onCh={v => updCampo(sec.id, c.k, v)} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 20, position: "sticky", bottom: 0, background: C.cinzaF, padding: "12px 0" }}>
        <button className="doc-btn" onClick={() => onDelete(d.id)} style={{ background: "#fff", color: C.coral, border: `1px solid ${C.coral}` }}>🗑 Excluir</button>
        <button className="doc-btn" onClick={() => onSave(d)} style={{ marginLeft: "auto", background: C.lima, color: C.preto, padding: "10px 24px" }}>💾 Salvar documento</button>
      </div>
    </div>
  );
}

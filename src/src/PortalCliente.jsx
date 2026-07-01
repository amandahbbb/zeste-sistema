import { useState, useEffect } from "react";
import Fichas from "./Fichas.jsx";
import Compras from "./Compras.jsx";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json" });
async function sbLoad(table, t, query = "") { try { const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d : []; } catch { return []; } }

const dbr = d => d ? new Date(d + (d.length <= 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR") : "";

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--lima:#8FA715;--verde:#497A5D;--azul:#1A4F71;--coral:#C4502B;--preto:#0E0E0C;--offwhite:#F2EBD8;--cinzaF:#F0EEE8;--cinzaM:#D9D5C8;--cinzaE:#6B6B5E;--border:#E3E1D9;--ff:'Barlow Condensed',sans-serif;--fb:'Barlow',sans-serif}
html,body{height:100%;font-family:var(--fb);background:var(--cinzaF);color:var(--preto);overflow-x:hidden}
button{cursor:pointer;border:none;background:none;font-family:var(--fb)}
.pcl-header{background:var(--preto);position:sticky;top:0;z-index:300;border-bottom:1px solid #2A2A2A}
.pcl-tabs{display:flex;background:var(--preto);border-bottom:1px solid #2A2A2A;overflow-x:auto}
.pcl-tab{flex:1;padding:13px 8px;font-size:11px;font-weight:700;white-space:nowrap;letter-spacing:.05em;font-family:var(--ff);border-bottom:2px solid transparent;color:#555;min-width:90px}
.pcl-card{background:#fff;border:1px solid var(--border);border-radius:14px;overflow:hidden}
.pcl-stat{background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px}
@media(max-width:600px){.pcl-grid3,.pcl-grid2{grid-template-columns:1fr!important}}
`;

const STATUS_COR = { "PROPOSTA": "#8FA715", "EM ANDAMENTO": "#1A4F71", "ATIVO": "#1A4F71", "CONCLUÍDO": "#497A5D", "PAUSADO": "#6B6B5E", "NEGOCIAÇÃO": "#C4502B" };

function Dashboard({ clienteInfo, projeto, fichasCount, docs, setAba }) {
  const nome = clienteInfo.nome_display || "Cliente";
  const primeiro = nome.split(" ")[0];
  const status = projeto?.statusProjeto || projeto?.stage || "EM ANDAMENTO";
  const cor = STATUS_COR[status?.toUpperCase()] || "#1A4F71";

  return (
    <div style={{ padding: 16, maxWidth: 820, margin: "0 auto" }}>
      <div className="pcl-card" style={{ background: "linear-gradient(135deg, var(--preto) 0%, #1a2420 100%)", border: "none", padding: "28px 24px", marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--ff)", fontSize: 12, color: "var(--lima)", letterSpacing: ".12em", marginBottom: 6 }}>BEM-VINDA</div>
        <div style={{ fontFamily: "var(--ff)", fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{primeiro}</div>
        <div style={{ fontSize: 13, color: "#A8A89E", marginTop: 8, lineHeight: 1.5 }}>Este é o seu espaço Zeste. Aqui você acompanha o projeto, acessa suas fichas técnicas e documentos.</div>
      </div>

      <div className="pcl-card" style={{ padding: "18px 20px", marginBottom: 16, borderLeft: `4px solid ${cor}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--cinzaE)", fontWeight: 700, letterSpacing: ".06em", marginBottom: 4 }}>STATUS DO PROJETO</div>
            <div style={{ fontFamily: "var(--ff)", fontSize: 22, fontWeight: 700, color: cor }}>{status}</div>
          </div>
          {projeto?.projeto && <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--cinzaE)" }}>Projeto</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{projeto.projeto}</div>
          </div>}
        </div>
      </div>

      <div className="pcl-grid3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button className="pcl-stat" onClick={() => setAba("fichas")} style={{ textAlign: "left" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <div style={{ fontFamily: "var(--ff)", fontSize: 24, fontWeight: 700, color: "var(--verde)" }}>{fichasCount}</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Fichas Técnicas</div>
          <div style={{ fontSize: 11, color: "var(--cinzaE)", marginTop: 2 }}>Ver receitas padronizadas →</div>
        </button>
        <button className="pcl-stat" onClick={() => setAba("compras")} style={{ textAlign: "left" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🛒</div>
          <div style={{ fontFamily: "var(--ff)", fontSize: 24, fontWeight: 700, color: "var(--lima)" }}>→</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Compras</div>
          <div style={{ fontSize: 11, color: "var(--cinzaE)", marginTop: 2 }}>Fornecedores e cotações →</div>
        </button>
        <button className="pcl-stat" onClick={() => setAba("documentos")} style={{ textAlign: "left" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
          <div style={{ fontFamily: "var(--ff)", fontSize: 24, fontWeight: 700, color: "var(--azul)" }}>{docs.length}</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Documentos</div>
          <div style={{ fontSize: 11, color: "var(--cinzaE)", marginTop: 2 }}>Materiais e entregas →</div>
        </button>
        <button className="pcl-stat" onClick={() => setAba("projeto")} style={{ textAlign: "left" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          <div style={{ fontFamily: "var(--ff)", fontSize: 24, fontWeight: 700, color: "var(--coral)" }}>→</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Acompanhamento</div>
          <div style={{ fontSize: 11, color: "var(--cinzaE)", marginTop: 2 }}>Etapas e próximos passos →</div>
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "var(--cinzaE)" }}>
        Dúvidas? Fale com a equipe Zeste pelo WhatsApp.
      </div>
    </div>
  );
}

function Documentos({ docs, docsOp = [] }) {
  const [verDoc, setVerDoc] = useState(null);
  const MODELO_NOMES = { caderno_op: "📕 Caderno Operacional", caderno_auto: "⚡ Caderno Operacional", fichas_praca: "🖼 Fichas de Praça", pop_interno: "📘 POP", ficha_gerencial: "📊 Documento Gerencial" };
  const linha = t => (t || "").split("\n").filter(x => x.trim());

  if (verDoc) return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <button onClick={() => setVerDoc(null)} style={{ color: "var(--verde)", background: "none", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>‹ Voltar</button>
      <div className="pcl-card" style={{ padding: 20 }}>
        <div style={{ fontFamily: "var(--ff)", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{verDoc.titulo}</div>
        <div style={{ fontSize: 12, color: "var(--cinzaE)", marginBottom: 16 }}>{MODELO_NOMES[verDoc.modelo] || "Documento"}</div>
        {verDoc.modelo === "caderno_op" && <CadernoView doc={verDoc} linha={linha} />}
        {verDoc.modelo !== "caderno_op" && <GenericView doc={verDoc} linha={linha} />}
      </div>
    </div>
  );

  const temAlgo = docs.length > 0 || docsOp.length > 0;
  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      {docsOp.length > 0 && (
        <div className="pcl-card" style={{ marginBottom: 16 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontFamily: "var(--ff)", fontWeight: 700, fontSize: 16 }}>📘 Documentos Zeste</div>
          {docsOp.map((d, i) => (
            <div key={d.id || i} onClick={() => { if (d.modelo === "caderno_auto" || d.modelo === "fichas_praca") { const w = window.open("", "_blank"); if (w) { w.document.write(d.html || ""); w.document.close(); } } else setVerDoc(d); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i < docsOp.length - 1 ? "1px solid var(--cinzaF)" : "none", cursor: "pointer" }}>
              <div style={{ fontSize: 24 }}>{(MODELO_NOMES[d.modelo] || "📄").slice(0, 2)}</div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{d.titulo}</div></div>
              <div style={{ color: "var(--azul)", fontSize: 13, fontWeight: 600 }}>Ver →</div>
            </div>
          ))}
        </div>
      )}
      <div className="pcl-card">
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", fontFamily: "var(--ff)", fontWeight: 700, fontSize: 16 }}>📁 Materiais e links</div>
        {docs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--cinzaE)" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <div style={{ fontStyle: "italic" }}>{temAlgo ? "Nenhum link ainda." : "Nenhum documento disponível ainda."}</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Quando a Zeste compartilhar materiais, eles aparecerão aqui.</div>
          </div>
        ) : docs.map((d, i) => (
          <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i < docs.length - 1 ? "1px solid var(--cinzaF)" : "none", textDecoration: "none", color: "inherit" }}>
            <div style={{ fontSize: 24 }}>{d.tipo === "pdf" ? "📄" : d.tipo === "img" ? "🖼" : "📎"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{d.nome}</div>
              {d.data && <div style={{ fontSize: 11, color: "var(--cinzaE)" }}>{dbr(d.data)}</div>}
            </div>
            <div style={{ color: "var(--azul)", fontSize: 13, fontWeight: 600 }}>Abrir →</div>
          </a>
        ))}
      </div>
    </div>
  );
}

function CadernoView({ doc, linha }) {
  const d = doc.dados || {};
  return (<div>
    {(d.pratos || []).length > 0 && <><SecTit>Pratos</SecTit>
      {(d.pratos || []).map((p, i) => (<div key={i} style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--cinzaF)" }}>
        <div style={{ fontFamily: "var(--ff)", fontSize: 17, fontWeight: 700, color: "var(--lima)", marginBottom: 6 }}>{p.nome}</div>
        {p.ingredientes && <Bloco titulo="Ingredientes" itens={linha(p.ingredientes)} />}
        {p.mop && <div style={{ marginTop: 8 }}><Sub>Modo de preparo</Sub><div style={{ fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{p.mop}</div></div>}
        {p.checklist && <Bloco titulo="Checklist" itens={linha(p.checklist)} check />}
        {p.utensilios && <Bloco titulo="Utensílios" itens={linha(p.utensilios)} />}
      </div>))}</>}
    {(d.receitas || []).length > 0 && <><SecTit>Receitas Base</SecTit>
      {(d.receitas || []).map((r, i) => (<div key={i} style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--ff)", fontSize: 15, fontWeight: 700 }}>{r.nome}{r.rendimento ? ` · ${r.rendimento}` : ""}</div>
        {r.ingredientes && <Bloco titulo="Ingredientes" itens={linha(r.ingredientes)} />}
        {r.preparo && <div style={{ fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.5, marginTop: 4 }}>{r.preparo}</div>}
      </div>))}</>}
    {(d.checklists || []).length > 0 && <><SecTit>Checklists</SecTit>
      {(d.checklists || []).map((c, i) => (<div key={i} style={{ marginBottom: 12 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{c.nome}</div><Bloco itens={linha(c.itens)} check /></div>))}</>}
  </div>);
}

function GenericView({ doc, linha }) {
  const d = doc.dados || {};
  return (<div>
    {Object.entries(d).map(([sid, val]) => {
      if (Array.isArray(val)) return val.map((item, i) => (<div key={sid + i} style={{ marginBottom: 12 }}>{Object.entries(item).map(([k, v]) => v && <div key={k} style={{ marginBottom: 4 }}><Sub>{k}</Sub><div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{v}</div></div>)}</div>));
      if (val && typeof val === "object") return Object.entries(val).map(([k, v]) => v && <div key={sid + k} style={{ marginBottom: 8 }}><Sub>{k}</Sub><div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{v}</div></div>);
      return null;
    })}
  </div>);
}
const SecTit = ({ children }) => <div style={{ fontFamily: "var(--ff)", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: "var(--cinzaE)", textTransform: "uppercase", margin: "16px 0 10px", paddingBottom: 4, borderBottom: "2px solid var(--lima)" }}>{children}</div>;
const Sub = ({ children }) => <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cinzaE)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 2 }}>{children}</div>;
const Bloco = ({ titulo, itens, check }) => (<div style={{ marginTop: 6 }}>{titulo && <Sub>{titulo}</Sub>}{itens.map((it, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0", display: "flex", gap: 6 }}>{check ? <span>☐</span> : <span style={{ color: "var(--lima)" }}>•</span>}<span>{it}</span></div>)}</div>);

function Acompanhamento({ projeto, etapas }) {
  const METODO = [
    { fase: "Enxergar", desc: "Diagnóstico e mapeamento operacional", icon: "👁" },
    { fase: "Estruturar", desc: "Padronização de fichas e processos", icon: "🏗" },
    { fase: "Evoluir", desc: "Engenharia de cardápio e CMV", icon: "📈" },
    { fase: "Escalar", desc: "Treinamentos e implementação", icon: "🚀" },
    { fase: "Elevar", desc: "Refinamento e acompanhamento contínuo", icon: "✨" },
  ];
  const faseAtual = projeto?.faseAtual || 1;

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div className="pcl-card" style={{ padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--ff)", fontSize: 12, color: "var(--lima)", letterSpacing: ".1em", marginBottom: 4 }}>METODOLOGIA</div>
        <div style={{ fontFamily: "var(--ff)", fontSize: 20, fontWeight: 700 }}>Método Zeste® 5E</div>
        <div style={{ fontSize: 13, color: "var(--cinzaE)", marginTop: 4 }}>Acompanhe em que etapa o seu projeto está.</div>
      </div>

      <div className="pcl-card" style={{ padding: "8px 0" }}>
        {METODO.map((m, i) => {
          const num = i + 1;
          const done = num < faseAtual, current = num === faseAtual;
          return (
            <div key={m.fase} style={{ display: "flex", gap: 14, padding: "14px 20px", alignItems: "flex-start", opacity: done || current ? 1 : 0.5 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: current ? "var(--lima)" : done ? "var(--verde)" : "var(--cinzaF)", color: current || done ? "#fff" : "var(--cinzaE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{done ? "✓" : m.icon}</div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ fontFamily: "var(--ff)", fontWeight: 700, fontSize: 16, color: current ? "var(--lima)" : "inherit" }}>{num}. {m.fase} {current && <span style={{ fontSize: 10, background: "var(--lima)", color: "#fff", padding: "2px 8px", borderRadius: 10, marginLeft: 6, verticalAlign: "middle" }}>ATUAL</span>}</div>
                <div style={{ fontSize: 13, color: "var(--cinzaE)", marginTop: 2 }}>{m.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {etapas.length > 0 && <>
        <div style={{ fontFamily: "var(--ff)", fontWeight: 700, fontSize: 15, margin: "20px 0 10px" }}>Próximos passos</div>
        <div className="pcl-card">
          {etapas.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "12px 18px", borderBottom: i < etapas.length - 1 ? "1px solid var(--cinzaF)" : "none" }}>
              <div style={{ fontSize: 18 }}>{e.done ? "✅" : "⬜"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, textDecoration: e.done ? "line-through" : "none", color: e.done ? "var(--cinzaE)" : "inherit" }}>{e.titulo}</div>
                {e.data && <div style={{ fontSize: 11, color: "var(--cinzaE)" }}>{dbr(e.data)}</div>}
              </div>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}

export default function PortalCliente({ clienteInfo, token, onLogout }) {
  const [aba, setAba] = useState("dashboard");
  const [projeto, setProjeto] = useState(null);
  const [fichasCount, setFichasCount] = useState(0);
  const [docs, setDocs] = useState([]);
  const [docsOp, setDocsOp] = useState([]);
  const [etapas, setEtapas] = useState([]);

  useEffect(() => {
    const cid = clienteInfo.cliente_id;
    sbLoad("crm_contatos", token, "deleted_at=is.null&select=id,data").then(rows => {
      const match = rows.map(r => ({ ...r.data, _id: r.id })).find(c =>
        c.empresa?.toLowerCase() === clienteInfo.nome_display?.toLowerCase() ||
        c.nome?.toLowerCase() === clienteInfo.nome_display?.toLowerCase() ||
        c._id === cid
      );
      if (match) setProjeto(match);
    });
    sbLoad("fin_pratos", token, `cliente_id=eq.${cid}&deleted_at=is.null&select=id`).then(r => setFichasCount(r.length));
    sbLoad("portal_documentos", token, `cliente_id=eq.${cid}&select=*&order=created_at.desc`).then(r => setDocs(r.map(x => x.dados || x)));
    sbLoad("docs_operacionais", token, `cliente_id=eq.${cid}&deleted_at=is.null&select=*&order=updated_at.desc`).then(r => setDocsOp(r.map(x => x.dados || x).filter(d => d.visibilidade === "entregavel")));
    sbLoad("portal_etapas", token, `cliente_id=eq.${cid}&select=*&order=created_at.asc`).then(r => setEtapas(r.map(x => x.dados || x)));
  }, []);

  const ABAS = [["dashboard", "🏠 Início"], ["fichas", "📋 Fichas"], ["compras", "🛒 Compras"], ["documentos", "📁 Documentos"], ["projeto", "🎯 Projeto"]];

  if (aba === "fichas") {
    return (<>
      <style>{STYLE}</style>
      <div style={{ background: "var(--preto)", padding: "8px 12px", display: "flex", gap: 8, position: "sticky", top: 0, zIndex: 400 }}>
        <button onClick={() => setAba("dashboard")} style={{ color: "var(--lima)", fontSize: 13, fontWeight: 700, padding: "6px 14px", border: "1px solid var(--lima)", borderRadius: 6 }}>‹ Voltar ao início</button>
      </div>
      <Fichas onBack={() => setAba("dashboard")} token={token} clienteId={clienteInfo.cliente_id} clienteNome={clienteInfo.nome_display} userInfo={{ email: clienteInfo.email, nome: clienteInfo.nome_display }} onLogout={onLogout} />
    </>);
  }

  if (aba === "compras") {
    return (<>
      <style>{STYLE}</style>
      <div style={{ background: "var(--preto)", padding: "8px 12px", display: "flex", gap: 8, position: "sticky", top: 0, zIndex: 400 }}>
        <button onClick={() => setAba("dashboard")} style={{ color: "var(--lima)", fontSize: 13, fontWeight: 700, padding: "6px 14px", border: "1px solid var(--lima)", borderRadius: 6 }}>‹ Voltar ao início</button>
      </div>
      <Compras onBack={() => setAba("dashboard")} token={token} clienteId={clienteInfo.cliente_id} />
    </>);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cinzaF)" }}>
      <style>{STYLE}</style>
      <div className="pcl-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span style={{ fontFamily: "var(--ff)", fontSize: 20, fontWeight: 800, color: "var(--lima)", letterSpacing: ".06em" }}>ZESTE</span>
            <span style={{ fontSize: 9, color: "#555", letterSpacing: ".14em" }}>ÁREA DE MEMBROS</span>
          </div>
          {onLogout && <button onClick={onLogout} style={{ color: "#888", fontSize: 11, padding: "6px 12px", border: "1px solid #333", borderRadius: 6, letterSpacing: ".06em", fontWeight: 600 }}>SAIR</button>}
        </div>
        <div className="pcl-tabs">
          {ABAS.map(([id, l]) => (
            <button key={id} className="pcl-tab" onClick={() => setAba(id)} style={{ color: aba === id ? "var(--lima)" : "#555", borderBottomColor: aba === id ? "var(--lima)" : "transparent" }}>{l}</button>
          ))}
        </div>
      </div>

      {aba === "dashboard" && <Dashboard clienteInfo={clienteInfo} projeto={projeto} fichasCount={fichasCount} docs={docs} setAba={setAba} />}
      {aba === "documentos" && <Documentos docs={docs} docsOp={docsOp} />}
      {aba === "projeto" && <Acompanhamento projeto={projeto} etapas={etapas} />}
    </div>
  );
}

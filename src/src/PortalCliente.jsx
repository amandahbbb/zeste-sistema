import { useState, useEffect } from "react";
import Fichas from "./Fichas.jsx";
import Compras from "./Compras.jsx";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json" });
async function sbLoad(table, t, query = "") { try { const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d : []; } catch { return []; } }

const dbr = d => d ? new Date(d + (d.length <= 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR") : "";
const diaSemana = d => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long" }) : "";
const hoje = () => new Date().toISOString().slice(0, 10);

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--lima:#8FA715;--verde:#497A5D;--azul:#1A4F71;--coral:#C4502B;--preto:#0E0E0C;--offwhite:#F2EBD8;--cinzaF:#F0EEE8;--cinzaM:#D9D5C8;--cinzaE:#5C5C50;--border:#E3E1D9;--ff:'Barlow Condensed',sans-serif;--fb:'Barlow',sans-serif}
html,body{height:100%;font-family:var(--fb);font-size:16px;background:var(--cinzaF);color:var(--preto);overflow-x:hidden;-webkit-font-smoothing:antialiased}
button{cursor:pointer;border:none;background:none;font-family:var(--fb)}
.pcl-header{background:var(--preto);position:sticky;top:0;z-index:300;border-bottom:1px solid #2A2A2A}
.pcl-tabs{display:flex;background:var(--preto);border-bottom:1px solid #2A2A2A;overflow-x:auto;-webkit-overflow-scrolling:touch}
.pcl-tab{flex:1;padding:15px 10px;font-size:14px;font-weight:700;white-space:nowrap;letter-spacing:.05em;font-family:var(--ff);border-bottom:3px solid transparent;color:#666;min-width:96px;min-height:48px}
.pcl-card{background:#fff;border:1px solid var(--border);border-radius:16px;overflow:hidden}
.pcl-stat{background:#fff;border:1px solid var(--border);border-radius:14px;padding:20px;transition:border-color .15s}
.pcl-stat:active{border-color:var(--lima)}
.pcl-wrap{padding:20px 16px 48px;max-width:860px;margin:0 auto}
.pcl-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}
.pcl-sec{font-family:var(--ff);font-size:14px;font-weight:700;letter-spacing:.1em;color:var(--cinzaE);text-transform:uppercase;margin:26px 0 12px}
.pcl-explica{font-size:14px;color:var(--cinzaE);line-height:1.55}
@media(min-width:768px){.pcl-wrap{padding:28px 24px 64px}}
@media(max-width:480px){.pcl-grid{grid-template-columns:1fr 1fr}}
@media(max-width:360px){.pcl-grid{grid-template-columns:1fr}}
`;

const STATUS_COR = { "PROPOSTA": "#8FA715", "EM ANDAMENTO": "#1A4F71", "ATIVO": "#1A4F71", "CONCLUÍDO": "#497A5D", "PAUSADO": "#6B6B5E", "NEGOCIAÇÃO": "#C4502B" };

/* ── Agenda: separa a próxima reunião, o que vem depois e o que já foi ── */
function organizarEtapas(etapas) {
  const h = hoje();
  const pend = etapas.filter(e => !e.done);
  const comData = pend.filter(e => e.data && e.data >= h).sort((a, b) => a.data.localeCompare(b.data));
  const proxima = comData[0] || null;
  const futuras = comData.slice(1);
  const semData = pend.filter(e => !e.data || e.data < h).filter(e => e !== proxima);
  const feitas = etapas.filter(e => e.done).sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  return { proxima, futuras, semData, feitas };
}

const TIPO_LABEL = { reuniao: "REUNIÃO", entrega: "ENTREGA", tarefa: "TAREFA" };
const TIPO_COR = { reuniao: "var(--azul)", entrega: "var(--verde)", tarefa: "var(--coral)" };

/* ── Cartão da próxima reunião: data, escopo e o que preparar ── */
function ProximoEncontro({ etapa, compacto }) {
  if (!etapa) return null;
  const tipo = etapa.tipo || "reuniao";
  return (
    <div className="pcl-card" style={{ borderLeft: "5px solid var(--lima)", marginBottom: 16 }}>
      <div style={{ padding: compacto ? "18px 20px" : "22px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "var(--ff)", fontSize: 13, fontWeight: 700, letterSpacing: ".1em", color: TIPO_COR[tipo] }}>{"PRÓXIMA " + (TIPO_LABEL[tipo] || "ETAPA")}</div>
            <div style={{ fontFamily: "var(--ff)", fontSize: 24, fontWeight: 800, marginTop: 2, lineHeight: 1.15 }}>{etapa.titulo}</div>
          </div>
          {etapa.data && (
            <div style={{ textAlign: "right", background: "var(--preto)", color: "#fff", borderRadius: 12, padding: "10px 16px", minWidth: 96 }}>
              <div style={{ fontFamily: "var(--ff)", fontSize: 20, fontWeight: 800, color: "var(--lima)" }}>{dbr(etapa.data)}</div>
              <div style={{ fontSize: 12, color: "#A8A89E", textTransform: "capitalize" }}>{diaSemana(etapa.data)}</div>
            </div>
          )}
        </div>

        {etapa.escopo && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".06em", color: "var(--cinzaE)", marginBottom: 4 }}>O QUE VAMOS TRATAR</div>
            <div style={{ fontSize: 15, lineHeight: 1.6 }}>{etapa.escopo}</div>
          </div>
        )}

        {etapa.preparar && (
          <div style={{ marginTop: 14, background: "#FBF9F2", border: "1px solid var(--cinzaM)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".06em", color: "var(--verde)", marginBottom: 6 }}>O QUE VOCÊ PRECISA PARA ESTE DIA</div>
            {etapa.preparar.split("\n").filter(x => x.trim()).map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 15, lineHeight: 1.6, padding: "1px 0" }}>
                <span style={{ color: "var(--lima)", fontWeight: 700 }}>—</span><span>{l}</span>
              </div>
            ))}
            <div style={{ fontSize: 13, color: "var(--cinzaE)", marginTop: 8, fontStyle: "italic" }}>Com isso em mãos, o encontro rende o dobro — a gente decide em vez de levantar informação.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Dashboard ── */
function Dashboard({ clienteInfo, projeto, fichasCount, docs, etapas, setAba }) {
  const nome = clienteInfo.nome_display || "Cliente";
  const primeiro = nome.split(" ")[0];
  const status = projeto?.statusProjeto || projeto?.stage || "EM ANDAMENTO";
  const cor = STATUS_COR[status?.toUpperCase()] || "#1A4F71";
  const { proxima } = organizarEtapas(etapas);

  const CARDS = [
    { id: "fichas", n: fichasCount, cor: "var(--verde)", t: "Fichas Técnicas", d: "Suas receitas padronizadas, com custo real por porção. É daqui que sai o preço certo de cada item." },
    { id: "projeto", n: "→", cor: "var(--coral)", t: "Projeto", d: "Agenda de encontros, o que será tratado em cada um e o que preparar. Transparência total do andamento." },
    { id: "documentos", n: docs.length, cor: "var(--azul)", t: "Documentos", d: "Cadernos, POPs e materiais entregues pela Zeste — sempre a versão mais atual, num lugar só." },
    { id: "compras", n: "→", cor: "var(--lima)", t: "Compras", d: "Fornecedores e cotações organizados para comprar melhor, sem depender da memória." },
  ];

  return (
    <div className="pcl-wrap">
      <div className="pcl-card" style={{ background: "linear-gradient(135deg, var(--preto) 0%, #1a2420 100%)", border: "none", padding: "30px 26px", marginBottom: 18 }}>
        <div style={{ fontFamily: "var(--ff)", fontSize: 14, color: "var(--lima)", letterSpacing: ".12em", marginBottom: 6 }}>BEM-VINDA</div>
        <div style={{ fontFamily: "var(--ff)", fontSize: "clamp(30px, 6vw, 40px)", fontWeight: 800, color: "#fff", lineHeight: 1.05 }}>{primeiro}</div>
        <div style={{ fontSize: 15, color: "#B8B8AC", marginTop: 10, lineHeight: 1.6, maxWidth: 560 }}>
          Este é o seu espaço no projeto com a Zeste. Tudo o que construímos juntas fica registrado aqui — receitas, custos, documentos e a agenda do projeto — para você consultar quando quiser, sem depender de ninguém.
        </div>
      </div>

      {proxima && <ProximoEncontro etapa={proxima} compacto />}

      <div className="pcl-card" style={{ padding: "18px 22px", marginBottom: 18, borderLeft: `5px solid ${cor}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--cinzaE)", fontWeight: 700, letterSpacing: ".06em", marginBottom: 4 }}>STATUS DO PROJETO</div>
            <div style={{ fontFamily: "var(--ff)", fontSize: 26, fontWeight: 700, color: cor }}>{status}</div>
          </div>
          {projeto?.projeto && <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "var(--cinzaE)" }}>Projeto</div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{projeto.projeto}</div>
          </div>}
        </div>
      </div>

      <div className="pcl-grid">
        {CARDS.map(c => (
          <button key={c.id} className="pcl-stat" onClick={() => setAba(c.id)} style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontFamily: "var(--ff)", fontSize: 30, fontWeight: 800, color: c.cor, lineHeight: 1 }}>{c.n}</div>
            <div style={{ fontFamily: "var(--ff)", fontSize: 19, fontWeight: 700 }}>{c.t}</div>
            <div className="pcl-explica">{c.d}</div>
            <div style={{ fontSize: 14, color: c.cor, fontWeight: 700, marginTop: "auto" }}>Abrir →</div>
          </button>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 30, fontSize: 14, color: "var(--cinzaE)", lineHeight: 1.6 }}>
        Ficou com dúvida sobre qualquer número ou documento?<br />Fale com a equipe Zeste pelo WhatsApp — explicar o porquê faz parte do trabalho.
      </div>
    </div>
  );
}

/* ── Documentos ── */
function Documentos({ docs, docsOp = [] }) {
  const [verDoc, setVerDoc] = useState(null);
  const MODELO_NOMES = { caderno_op: "Caderno Operacional", caderno_auto: "Caderno Operacional", caderno_gerencial: "Caderno Gerencial", fichas_praca: "Fichas de Praça", pop_interno: "POP", ficha_gerencial: "Documento Gerencial" };
  const linha = t => (t || "").split("\n").filter(x => x.trim());

  if (verDoc) {
    const ehHtml = (verDoc.modelo === "caderno_auto" || verDoc.modelo === "caderno_gerencial" || verDoc.modelo === "fichas_praca") && verDoc.html;
    return (
      <div className="pcl-wrap" style={{ maxWidth: ehHtml ? 980 : 760 }}>
        <button onClick={() => setVerDoc(null)} style={{ color: "var(--verde)", fontSize: 15, fontWeight: 700, marginBottom: 12, minHeight: 44 }}>‹ Voltar</button>
        {ehHtml ? (
          <div className="pcl-card" style={{ padding: 0, overflow: "hidden" }}>
            <iframe title={verDoc.titulo} srcDoc={verDoc.html} style={{ display: "block", width: "100%", height: "78vh", border: "none", background: "#fff" }} />
          </div>
        ) : (
          <div className="pcl-card" style={{ padding: 22 }}>
            <div style={{ fontFamily: "var(--ff)", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{verDoc.titulo}</div>
            <div style={{ fontSize: 14, color: "var(--cinzaE)", marginBottom: 16 }}>{MODELO_NOMES[verDoc.modelo] || "Documento"}</div>
            {verDoc.modelo === "caderno_op" && <CadernoView doc={verDoc} linha={linha} />}
            {verDoc.modelo !== "caderno_op" && <GenericView doc={verDoc} linha={linha} />}
          </div>
        )}
      </div>
    );
  }

  const temAlgo = docs.length > 0 || docsOp.length > 0;
  const Selo = ({ txt }) => <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--preto)", color: "var(--lima)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff)", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{txt}</div>;

  return (
    <div className="pcl-wrap" style={{ maxWidth: 760 }}>
      <div className="pcl-explica" style={{ marginBottom: 16 }}>Tudo o que a Zeste entrega fica arquivado aqui, sempre na versão mais recente. Se um documento mudar, você não precisa procurar em conversas — a versão válida é a desta página.</div>

      {docsOp.length > 0 && (
        <div className="pcl-card" style={{ marginBottom: 18 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontFamily: "var(--ff)", fontWeight: 700, fontSize: 18 }}>Documentos Zeste</div>
          {docsOp.map((d, i) => (
            <div key={d.id || i} onClick={() => setVerDoc(d)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: i < docsOp.length - 1 ? "1px solid var(--cinzaF)" : "none", cursor: "pointer", minHeight: 56 }}>
              <Selo txt={(MODELO_NOMES[d.modelo] || "DOC").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{d.titulo}</div>
                <div style={{ fontSize: 13, color: "var(--cinzaE)" }}>{MODELO_NOMES[d.modelo] || "Documento"}</div>
              </div>
              <div style={{ color: "var(--azul)", fontSize: 15, fontWeight: 700 }}>Ver →</div>
            </div>
          ))}
        </div>
      )}
      <div className="pcl-card">
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontFamily: "var(--ff)", fontWeight: 700, fontSize: 18 }}>Materiais e links</div>
        {docs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--cinzaE)" }}>
            <div style={{ fontSize: 15 }}>{temAlgo ? "Nenhum link ainda." : "Nenhum documento disponível ainda."}</div>
            <div style={{ fontSize: 14, marginTop: 6 }}>Quando a Zeste compartilhar materiais, eles aparecerão aqui.</div>
          </div>
        ) : docs.map((d, i) => (
          <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: i < docs.length - 1 ? "1px solid var(--cinzaF)" : "none", textDecoration: "none", color: "inherit", minHeight: 56 }}>
            <Selo txt={(d.tipo || "LNK").slice(0, 3).toUpperCase()} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{d.nome}</div>
              {d.data && <div style={{ fontSize: 13, color: "var(--cinzaE)" }}>{dbr(d.data)}</div>}
            </div>
            <div style={{ color: "var(--azul)", fontSize: 15, fontWeight: 700 }}>Abrir →</div>
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
        <div style={{ fontFamily: "var(--ff)", fontSize: 19, fontWeight: 700, color: "var(--verde)", marginBottom: 6 }}>{p.nome}</div>
        {p.ingredientes && <Bloco titulo="Ingredientes" itens={linha(p.ingredientes)} />}
        {p.mop && <div style={{ marginTop: 8 }}><Sub>Modo de preparo</Sub><div style={{ fontSize: 15, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{p.mop}</div></div>}
        {p.checklist && <Bloco titulo="Checklist" itens={linha(p.checklist)} check />}
        {p.utensilios && <Bloco titulo="Utensílios" itens={linha(p.utensilios)} />}
      </div>))}</>}
    {(d.receitas || []).length > 0 && <><SecTit>Receitas Base</SecTit>
      {(d.receitas || []).map((r, i) => (<div key={i} style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--ff)", fontSize: 17, fontWeight: 700 }}>{r.nome}{r.rendimento ? ` · ${r.rendimento}` : ""}</div>
        {r.ingredientes && <Bloco titulo="Ingredientes" itens={linha(r.ingredientes)} />}
        {r.preparo && <div style={{ fontSize: 15, whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 4 }}>{r.preparo}</div>}
      </div>))}</>}
    {(d.checklists || []).length > 0 && <><SecTit>Checklists</SecTit>
      {(d.checklists || []).map((c, i) => (<div key={i} style={{ marginBottom: 12 }}><div style={{ fontWeight: 700, fontSize: 16 }}>{c.nome}</div><Bloco itens={linha(c.itens)} check /></div>))}</>}
  </div>);
}

function GenericView({ doc, linha }) {
  const d = doc.dados || {};
  return (<div>
    {Object.entries(d).map(([sid, val]) => {
      if (Array.isArray(val)) return val.map((item, i) => (<div key={sid + i} style={{ marginBottom: 12 }}>{Object.entries(item).map(([k, v]) => v && <div key={k} style={{ marginBottom: 4 }}><Sub>{k}</Sub><div style={{ fontSize: 15, whiteSpace: "pre-wrap" }}>{v}</div></div>)}</div>));
      if (val && typeof val === "object") return Object.entries(val).map(([k, v]) => v && <div key={sid + k} style={{ marginBottom: 8 }}><Sub>{k}</Sub><div style={{ fontSize: 15, whiteSpace: "pre-wrap" }}>{v}</div></div>);
      return null;
    })}
  </div>);
}
const SecTit = ({ children }) => <div style={{ fontFamily: "var(--ff)", fontSize: 14, fontWeight: 700, letterSpacing: ".08em", color: "var(--cinzaE)", textTransform: "uppercase", margin: "16px 0 10px", paddingBottom: 4, borderBottom: "2px solid var(--lima)" }}>{children}</div>;
const Sub = ({ children }) => <div style={{ fontSize: 12, fontWeight: 700, color: "var(--cinzaE)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 2 }}>{children}</div>;
const Bloco = ({ titulo, itens, check }) => (<div style={{ marginTop: 6 }}>{titulo && <Sub>{titulo}</Sub>}{itens.map((it, i) => <div key={i} style={{ fontSize: 15, padding: "2px 0", display: "flex", gap: 8 }}>{check ? <span style={{ color: "var(--cinzaM)" }}>☐</span> : <span style={{ color: "var(--lima)" }}>•</span>}<span>{it}</span></div>)}</div>);

/* ── Projeto / Acompanhamento ── */
function Acompanhamento({ projeto, etapas }) {
  const METODO = [
    { fase: "Enxergar", desc: "Diagnóstico e mapeamento operacional", pq: "Antes de mudar qualquer coisa, medimos a realidade: cardápio, custos, rotina. Decisão boa nasce de dado, não de achismo." },
    { fase: "Estruturar", desc: "Padronização de fichas e processos", pq: "Cada receita vira ficha técnica com quantidades e custo. É o que garante o mesmo prato, o mesmo sabor e a mesma margem em qualquer dia." },
    { fase: "Evoluir", desc: "Engenharia de cardápio e CMV", pq: "Com os números na mão, ajustamos preços, porções e mix. É onde o cardápio deixa de ser lista e vira estratégia de lucro." },
    { fase: "Escalar", desc: "Treinamentos e implementação", pq: "O padrão só vale se a equipe executa. Treinamos as pessoas para que o resultado não dependa de você estar presente." },
    { fase: "Elevar", desc: "Refinamento e acompanhamento contínuo", pq: "Medimos o que mudou, corrigimos rota e consolidamos. Um negócio saudável se sustenta com acompanhamento, não com sorte." },
  ];
  const faseAtual = projeto?.faseAtual || 1;
  const { proxima, futuras, semData, feitas } = organizarEtapas(etapas);

  return (
    <div className="pcl-wrap" style={{ maxWidth: 760 }}>
      <div className="pcl-explica" style={{ marginBottom: 16 }}>
        Esta página é o mapa do seu projeto: em que fase estamos, qual é o próximo encontro, o que será tratado nele e o que você precisa preparar. Sem surpresa e sem "confia em mim" — você acompanha tudo.
      </div>

      <ProximoEncontro etapa={proxima} />

      {(futuras.length > 0 || semData.length > 0) && <>
        <div className="pcl-sec">Agenda do projeto</div>
        <div className="pcl-card">
          {[...futuras, ...semData].map((e, i, arr) => {
            const tipo = e.tipo || "tarefa";
            return (
              <div key={e.id || i} style={{ padding: "16px 20px", borderBottom: i < arr.length - 1 ? "1px solid var(--cinzaF)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--ff)", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "#fff", background: TIPO_COR[tipo], padding: "3px 9px", borderRadius: 8 }}>{TIPO_LABEL[tipo] || "ETAPA"}</span>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{e.titulo}</span>
                  </div>
                  {e.data && <span style={{ fontFamily: "var(--ff)", fontWeight: 700, fontSize: 16, color: "var(--cinzaE)" }}>{dbr(e.data)}</span>}
                </div>
                {e.escopo && <div style={{ fontSize: 14, color: "var(--cinzaE)", marginTop: 6, lineHeight: 1.55 }}>{e.escopo}</div>}
                {e.preparar && <div style={{ fontSize: 14, marginTop: 6, lineHeight: 1.55 }}><strong style={{ color: "var(--verde)" }}>Preparar: </strong>{e.preparar.split("\n").filter(x => x.trim()).join(" · ")}</div>}
              </div>
            );
          })}
        </div>
      </>}

      <div className="pcl-sec">Método Zeste 5E — onde estamos e por quê</div>
      <div className="pcl-card" style={{ padding: "8px 0" }}>
        {METODO.map((m, i) => {
          const num = i + 1;
          const done = num < faseAtual, current = num === faseAtual;
          return (
            <div key={m.fase} style={{ display: "flex", gap: 16, padding: "18px 22px", alignItems: "flex-start", opacity: done || current ? 1 : 0.55, borderBottom: i < METODO.length - 1 ? "1px solid var(--cinzaF)" : "none" }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: current ? "var(--lima)" : done ? "var(--verde)" : "var(--cinzaF)", color: current || done ? "#fff" : "var(--cinzaE)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff)", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>{done ? "✓" : num}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--ff)", fontWeight: 700, fontSize: 19, color: current ? "var(--lima)" : "inherit", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {m.fase}
                  {current && <span style={{ fontSize: 11, background: "var(--lima)", color: "#fff", padding: "3px 10px", borderRadius: 10, letterSpacing: ".06em" }}>FASE ATUAL</span>}
                  {done && <span style={{ fontSize: 11, background: "var(--verde)", color: "#fff", padding: "3px 10px", borderRadius: 10, letterSpacing: ".06em" }}>CONCLUÍDA</span>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{m.desc}</div>
                <div style={{ fontSize: 14, color: "var(--cinzaE)", marginTop: 4, lineHeight: 1.55 }}>{m.pq}</div>
              </div>
            </div>
          );
        })}
      </div>

      {feitas.length > 0 && <>
        <div className="pcl-sec">O que já foi feito</div>
        <div className="pcl-card">
          {feitas.map((e, i) => (
            <div key={e.id || i} style={{ display: "flex", gap: 12, padding: "14px 20px", borderBottom: i < feitas.length - 1 ? "1px solid var(--cinzaF)" : "none", alignItems: "center" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--verde)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: "var(--cinzaE)" }}>{e.titulo}</div>
              </div>
              {e.data && <div style={{ fontSize: 14, color: "var(--cinzaE)" }}>{dbr(e.data)}</div>}
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}

/* ── Componente principal ── */
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
      const _n = v => (v || "").toString().trim().toLowerCase();
      const alvo = _n(clienteInfo.nome_display);
      const match = rows.map(r => ({ ...r.data, _id: r.id })).find(c =>
        [_n(c.company), _n(c.empresa), _n(c.nome), _n(c.name)].includes(alvo) || c._id === cid
      );
      if (match) setProjeto(match);
    });
    sbLoad("fin_pratos", token, `cliente_id=eq.${cid}&deleted_at=is.null&select=id`).then(r => setFichasCount(r.length));
    sbLoad("portal_documentos", token, `cliente_id=eq.${cid}&select=*&order=created_at.desc`).then(r => setDocs(r.map(x => x.dados || x)));
    sbLoad("docs_operacionais", token, `cliente_id=eq.${cid}&deleted_at=is.null&select=*&order=updated_at.desc`).then(r => setDocsOp(r.map(x => x.dados || x).filter(d => d.visibilidade === "entregavel")));
    sbLoad("portal_etapas", token, `cliente_id=eq.${cid}&select=*&order=created_at.asc`).then(r => setEtapas(r.map(x => x.dados || x)));
  }, []);

  const ABAS = [["dashboard", "Início"], ["fichas", "Fichas"], ["compras", "Compras"], ["documentos", "Documentos"], ["projeto", "Projeto"]];

  if (aba === "fichas") {
    return (<>
      <style>{STYLE}</style>
      <div style={{ background: "var(--preto)", padding: "10px 14px", display: "flex", gap: 8, position: "sticky", top: 0, zIndex: 400 }}>
        <button onClick={() => setAba("dashboard")} style={{ color: "var(--lima)", fontSize: 14, fontWeight: 700, padding: "8px 16px", border: "1px solid var(--lima)", borderRadius: 8, minHeight: 44 }}>‹ Voltar ao início</button>
      </div>
      <Fichas onBack={() => setAba("dashboard")} token={token} clienteId={clienteInfo.cliente_id} clienteNome={clienteInfo.nome_display} userInfo={{ email: clienteInfo.email, nome: clienteInfo.nome_display }} onLogout={onLogout} />
    </>);
  }

  if (aba === "compras") {
    return (<>
      <style>{STYLE}</style>
      <div style={{ background: "var(--preto)", padding: "10px 14px", display: "flex", gap: 8, position: "sticky", top: 0, zIndex: 400 }}>
        <button onClick={() => setAba("dashboard")} style={{ color: "var(--lima)", fontSize: 14, fontWeight: 700, padding: "8px 16px", border: "1px solid var(--lima)", borderRadius: 8, minHeight: 44 }}>‹ Voltar ao início</button>
      </div>
      <Compras onBack={() => setAba("dashboard")} token={token} clienteId={clienteInfo.cliente_id} />
    </>);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cinzaF)" }}>
      <style>{STYLE}</style>
      <div className="pcl-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "var(--ff)", fontSize: 22, fontWeight: 800, color: "var(--lima)", letterSpacing: ".06em" }}>ZESTE</span>
            <span style={{ fontSize: 10, color: "#666", letterSpacing: ".14em" }}>{(clienteInfo.nome_display || "ÁREA DE MEMBROS").toUpperCase()}</span>
          </div>
          {onLogout && <button onClick={onLogout} style={{ color: "#999", fontSize: 12, padding: "8px 14px", border: "1px solid #333", borderRadius: 8, letterSpacing: ".06em", fontWeight: 600, minHeight: 40 }}>SAIR</button>}
        </div>
        <div className="pcl-tabs">
          {ABAS.map(([id, l]) => (
            <button key={id} className="pcl-tab" onClick={() => setAba(id)} style={{ color: aba === id ? "var(--lima)" : "#666", borderBottomColor: aba === id ? "var(--lima)" : "transparent" }}>{l}</button>
          ))}
        </div>
      </div>

      {aba === "dashboard" && <Dashboard clienteInfo={clienteInfo} projeto={projeto} fichasCount={fichasCount} docs={docs} etapas={etapas} setAba={setAba} />}
      {aba === "documentos" && <Documentos docs={docs} docsOp={docsOp} />}
      {aba === "projeto" && <Acompanhamento projeto={projeto} etapas={etapas} />}
    </div>
  );
}

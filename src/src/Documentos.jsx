import { useState, useEffect } from "react";
import { toast } from "./toast.js";
import { gerarCadernoOperacionalHTML, gerarCadernoGerencialHTML, gerarFichasPracaHTML } from "./gerarCaderno.js";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
async function sbLoad(t) { try { const r = await fetch(`${SB_URL}/rest/v1/docs_operacionais?deleted_at=is.null&order=updated_at.desc`, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d.map(x => x.dados) : []; } catch { return []; } }
async function sbSave(doc, t) { try { const r = await fetch(`${SB_URL}/rest/v1/docs_operacionais`, { method: "POST", headers: { ...sbH(t), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: doc.id, cliente_id: doc.clienteId || "zeste", dados: doc, updated_at: new Date().toISOString() }) }); if (!r.ok) { toast("Erro ao salvar o documento", "erro"); return false; } toast("✓ Documento salvo"); return true; } catch { toast("Sem conexão — não foi salvo", "erro"); return false; } }
async function sbDel(id, t) { try { const r = await fetch(`${SB_URL}/rest/v1/docs_operacionais?id=eq.${id}`, { method: "PATCH", headers: sbH(t), body: JSON.stringify({ deleted_at: new Date().toISOString() }) }); if (!r.ok) { toast("Erro ao excluir", "erro"); return false; } toast("✓ Excluído"); return true; } catch { toast("Sem conexão — não foi excluído", "erro"); return false; } }

// Carrega pratos/fichas/ingredientes de um cliente para gerar o caderno
async function sbLoadTabela(tabela, t, clienteId) {
  try {
    let q = `${SB_URL}/rest/v1/${tabela}?deleted_at=is.null&select=*`;
    if (clienteId && tabela !== "fin_ingredientes") q += `&cliente_id=eq.${clienteId}`;
    const r = await fetch(q, { headers: sbH(t) });
    const d = await r.json();
    return Array.isArray(d) ? d.map(x => ({ ...x.dados, _cliente: x.cliente_id })) : [];
  } catch { return []; }
}

// CMV engine (replicado do Fichas para gerar a ficha gerencial)
function _calcFicha(ficha, ingredientes, fichas) {
  const itens = (ficha.itens || []).map(it => {
    const ref = it.tipo === "ficha" ? fichas.find(f => f.nome === it.nomeRef) : ingredientes.find(i => i.nome === it.nomeRef);
    if (!ref) return { ...it, custo: 0, pesoFinal: 0, erro: true };
    const precoKg = it.tipo === "ficha" ? (ref._custoPorKg || 0) : (ref.p || 0);
    const fc = it.tipo === "ficha" ? 1 : (ref.fc || 1);
    const fk = it.tipo === "ficha" ? 1 : (ref.fk || 1);
    const qtdLiq = Number(it.qtdLiquida) || 0;
    const qtdBruta = qtdLiq * fc;
    return { ...it, custo: qtdBruta * precoKg, pesoFinal: qtdLiq * fk, qtdBruta, fc };
  });
  const custoSomado = itens.reduce((s, i) => s + i.custo, 0);
  const pesoFinal = itens.reduce((s, i) => s + i.pesoFinal, 0);
  const custoTotal = custoSomado * (1 + Number(ficha.margemSeguranca || 0));
  return { ...ficha, itens, custoTotal, pesoFinal, _custoPorKg: pesoFinal > 0 ? custoTotal / pesoFinal : 0 };
}
function _calcAllFichas(fichasRaw, ingredientes) {
  const resolved = []; const nameMap = new Map();
  const pending = [...fichasRaw]; let maxIter = 50;
  while (pending.length > 0 && maxIter-- > 0) {
    for (let i = pending.length - 1; i >= 0; i--) {
      const f = pending[i];
      const deps = (f.itens || []).filter(it => it.tipo === "ficha").map(it => it.nomeRef);
      if (deps.every(d => nameMap.has(d))) {
        const calc = _calcFicha(f, ingredientes, resolved);
        resolved.push(calc); nameMap.set(f.nome, calc); pending.splice(i, 1);
      }
    }
  }
  pending.forEach(f => { const calc = _calcFicha(f, ingredientes, resolved); resolved.push(calc); nameMap.set(f.nome, calc); });
  return resolved;
}
function _calcPrato(prato, ingredientes, fichas) {
  const comps = (prato.componentes || []).map(c => {
    const ref = c.tipo === "ficha" ? fichas.find(f => f.nome === c.nomeRef) : ingredientes.find(i => i.nome === c.nomeRef);
    if (!ref) return { ...c, custo: 0, erro: true };
    const custoPorKg = c.tipo === "ficha" ? (ref._custoPorKg || 0) : (ref.p || 0);
    const qtdKg = (Number(c.qtdGramas) || 0) / 1000;
    const fc = c.tipo === "ficha" ? 1 : (ref.fc || 1);
    return { ...c, custo: qtdKg * fc * custoPorKg, custoPorKg, qtdKg, fc };
  });
  const custoTotal = comps.reduce((s, c) => s + c.custo, 0);
  const preco = Number(prato.precoVenda || 0);
  return { ...prato, comps, custoTotal, cmv: preco > 0 ? custoTotal / preco : 0, margem: preco > 0 ? (preco - custoTotal) / preco : 0 };
}

async function gerarCadernoDoCliente(token, clienteId, clienteNome) {
  const [pratosRaw, fichasRaw, ingredientes] = await Promise.all([
    sbLoadTabela("fin_pratos", token, clienteId),
    sbLoadTabela("fin_fichas", token, clienteId),
    sbLoadTabela("fin_ingredientes", token, null),
  ]);
  const fichasCalc = _calcAllFichas(fichasRaw, ingredientes);
  const pratosCalc = pratosRaw.map(p => _calcPrato(p, ingredientes, fichasCalc));
  return { pratosCalc, fichasCalc, count: pratosCalc.length };
}

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
  const [gerando, setGerando] = useState(false); // modal gerar caderno automático
  const [gerTipo, setGerTipo] = useState("caderno"); // caderno | praca
  const [gerLoading, setGerLoading] = useState(false);
  const [verAuto, setVerAuto] = useState(null); // visualizador inline de caderno/fichas de praça

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

  // VISUALIZADOR (caderno automático / fichas de praça) — dentro do app, com Voltar
  if (verAuto) {
    const htmlDoc = /name=["']viewport["']/i.test(verAuto.html || "")
      ? (verAuto.html || "")
      : (verAuto.html || "").replace(/<head>/i, '<head><meta name="viewport" content="width=device-width, initial-scale=1">');
    return (
      <div className="doc-page">
        <style>{STYLE}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <button onClick={() => setVerAuto(null)} style={{ color: C.verde, background: "none", border: "none", fontFamily: "'Antonio',sans-serif", fontSize: 16, fontWeight: 700, cursor: "pointer", minHeight: 44, padding: 0 }}>‹ Voltar</button>
          <div style={{ flex: 1, fontFamily: "'Antonio',sans-serif", fontWeight: 700, fontSize: 17, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{verAuto.titulo}</div>
          <button className="doc-btn" onClick={() => { const f = document.getElementById("doc-view-frame"); try { f.contentWindow.focus(); f.contentWindow.print(); } catch { } }} style={{ background: C.azul, color: "#fff" }}>🖨 Imprimir</button>
        </div>
        <div className="doc-card" style={{ overflow: "hidden" }}>
          <iframe id="doc-view-frame" title={verAuto.titulo} srcDoc={htmlDoc} style={{ display: "block", width: "100%", height: "78vh", border: "none", background: "#fff" }} />
        </div>
      </div>
    );
  }

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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="doc-btn" onClick={() => { setGerTipo("caderno"); setGerando(true); }} style={{ background: C.azul, color: "#fff" }}>⚡ Gerar Caderno</button>
          <button className="doc-btn" onClick={() => { setGerTipo("praca"); setGerando(true); }} style={{ background: C.verde, color: "#fff" }}>🖼 Fichas de Praça</button>
          <button className="doc-btn" onClick={() => setEscolhendo(true)} style={{ background: C.lima, color: C.preto }}>+ Novo</button>
        </div>
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
            const AUTO_META = { caderno_auto: { icon: "⚡", nome: "Caderno Operacional" }, caderno_gerencial: { icon: "📊", nome: "Caderno Gerencial" }, fichas_praca: { icon: "🖼", nome: "Fichas de Praça" } };
            const ehAuto = !!AUTO_META[d.modelo];
            const m = ehAuto ? AUTO_META[d.modelo] : (MODELOS[d.modelo] || {});
            const cli = clientes.find(c => c.cliente_id === d.clienteId);
            const abrir = () => {
              if (ehAuto) setVerAuto(d);
              else setEditing(d);
            };
            return (
              <div key={d.id} onClick={abrir} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < docs.length - 1 ? `1px solid ${C.cinzaF}` : "none", cursor: "pointer" }}>
                <div style={{ fontSize: 26 }}>{m.icon || "📄"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Antonio',sans-serif", fontWeight: 600, fontSize: 16 }}>{d.titulo || "(sem título)"}</div>
                  <div style={{ fontSize: 12, color: C.cinzaE }}>{m.nome}{d.visibilidade === "entregavel" ? ` · 📤 ${cli ? cli.nome_display : "cliente"}` : " · 🔒 interno"}</div>
                </div>
                <span style={{ color: C.azul, fontWeight: 700 }}>{ehAuto ? "🖨" : "→"}</span>
              </div>
            );
          })}
        </div>
      )}

      {gerando && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => !gerLoading && setGerando(false)}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 24, maxWidth: 460, width: "100%" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Antonio',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{gerTipo === "praca" ? "🖼 Fichas de Praça" : "⚡ Gerar Caderno Automático"}</div>
            <div style={{ fontSize: 13, color: C.cinzaE, marginBottom: 16, lineHeight: 1.45 }}>{gerTipo === "praca" ? "Gera uma folha A4 por prato, com foto grande e o modo de empratar em letra grande — pra plastificar e colar na parede da cozinha. Dica: cadastre a foto do prato (link) no cadastro de cada prato." : "O sistema monta DOIS cadernos a partir dos pratos e fichas já cadastrados: o Operacional (empratamento + receitas base, uso da cozinha) e o Gerencial (custos e CMV, confidencial). Sem digitar nada."}</div>
            <label className="doc-label" style={{ marginTop: 0 }}>Cliente</label>
            <select id="ger-cli" className="doc-input" defaultValue="" style={{ color: C.preto, background: "#FCFBF9" }}>
              <option value="" style={{ color: C.preto, background: "#fff" }}>— selecione —</option>
              {clientes.map(c => <option key={c.cliente_id} value={c.cliente_id} style={{ color: C.preto, background: "#fff" }}>{c.nome_display}</option>)}
            </select>
            {gerLoading && <div style={{ textAlign: "center", color: C.azul, fontSize: 13, padding: "14px 0" }}>⚙️ {gerTipo === "praca" ? "Montando fichas de praça…" : "Montando caderno…"}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="doc-btn" onClick={() => setGerando(false)} disabled={gerLoading} style={{ background: "#F0EEE8", color: C.cinzaE }}>Cancelar</button>
              <button className="doc-btn" disabled={gerLoading} onClick={async () => {
                const sel = document.getElementById("ger-cli");
                const cid = sel.value;
                if (!cid) { alert("Escolha um cliente."); return; }
                const cli = clientes.find(c => c.cliente_id === cid);
                setGerLoading(true);
                try {
                  const { pratosCalc, fichasCalc, count } = await gerarCadernoDoCliente(token, cid, cli?.nome_display);
                  const quebrados = [
                    ...pratosCalc.flatMap(p => (p.comps || []).filter(c => c.erro).map(c => `${p.nome} → ${c.nomeRef}`)),
                    ...fichasCalc.flatMap(f => (f.itens || []).filter(it => it.erro).map(it => `${f.nome} → ${it.nomeRef}`))
                  ];
                  if (quebrados.length) {
                    setGerLoading(false);
                    alert("Caderno NÃO gerado — referências quebradas (custo zeraria):\n\n" + quebrados.slice(0, 8).join("\n") + (quebrados.length > 8 ? `\n…e mais ${quebrados.length - 8}` : "") + "\n\nCorrija nas fichas/pratos e gere de novo.");
                    return;
                  }
                  if (count === 0) { alert("Este cliente não tem pratos cadastrados ainda. Cadastre os pratos nas Fichas primeiro."); setGerLoading(false); return; }
                  const agora = new Date().toISOString();
                  const novos = [];
                  if (gerTipo === "praca") {
                    const titulo = `Fichas de Praça — ${cli?.nome_display || ""}`;
                    novos.push({ id: uid(), modelo: "fichas_praca", titulo, clienteId: cid, visibilidade: "entregavel", html: gerarFichasPracaHTML({ clienteNome: cli?.nome_display, pratos: pratosCalc }), geradoEm: agora });
                  } else {
                    const tituloOp = `Caderno Operacional — ${cli?.nome_display || ""}`;
                    const tituloGer = `Caderno Gerencial — ${cli?.nome_display || ""}`;
                    novos.push({ id: uid(), modelo: "caderno_auto", titulo: tituloOp, clienteId: cid, visibilidade: "entregavel", html: gerarCadernoOperacionalHTML({ titulo: tituloOp, clienteNome: cli?.nome_display, pratos: pratosCalc, fichas: fichasCalc }), geradoEm: agora });
                    novos.push({ id: uid(), modelo: "caderno_gerencial", titulo: tituloGer, clienteId: cid, visibilidade: "entregavel", html: gerarCadernoGerencialHTML({ titulo: tituloGer, clienteNome: cli?.nome_display, pratos: pratosCalc }), geradoEm: agora });
                  }
                  // substitui versões anteriores do mesmo tipo/cliente (evita duplicatas)
                  const modelosNovos = novos.map(n => n.modelo);
                  const antigos = docs.filter(x => modelosNovos.includes(x.modelo) && x.clienteId === cid);
                  for (const a of antigos) await sbDel(a.id, token);
                  for (const n of novos) await sbSave(n, token);
                  setDocs(p => [...novos, ...p.filter(x => !(modelosNovos.includes(x.modelo) && x.clienteId === cid))]);
                  setGerLoading(false); setGerando(false);
                  setVerAuto(novos[0]);
                } catch (e) { alert("Erro ao gerar: " + e.message); setGerLoading(false); }
              }} style={{ marginLeft: "auto", background: gerTipo === "praca" ? C.verde : C.azul, color: "#fff", padding: "10px 20px" }}>{gerTipo === "praca" ? "🖼 Gerar" : "⚡ Gerar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Exporta documento como HTML formatado (padrão Zeste) e abre para impressão/PDF
// Devolve o HTML do documento (renderizado inline em iframe — window.open quebra no iOS)
function exportarDoc(d, modelo) {
  const linha = t => (t || "").split("\n").filter(x => x.trim());
  const esc = s => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let corpo = "";
  if (d.modelo === "caderno_op") {
    const dd = d.dados;
    if ((dd.pratos || []).length) {
      corpo += `<h2>Pratos</h2>`;
      dd.pratos.forEach(p => {
        corpo += `<div class="item"><h3>${esc(p.nome)}</h3>`;
        if (p.ingredientes) corpo += `<div class="sub">Ingredientes</div><ul>${linha(p.ingredientes).map(i => `<li>${esc(i)}</li>`).join("")}</ul>`;
        if (p.mop) corpo += `<div class="sub">Modo de preparo / Empratamento</div><p>${esc(p.mop).replace(/\n/g, "<br>")}</p>`;
        if (p.checklist) corpo += `<div class="sub">Checklist de finalização</div><ul class="chk">${linha(p.checklist).map(i => `<li>${esc(i)}</li>`).join("")}</ul>`;
        if (p.utensilios) corpo += `<div class="sub">Utensílios</div><ul>${linha(p.utensilios).map(i => `<li>${esc(i)}</li>`).join("")}</ul>`;
        corpo += `</div>`;
      });
    }
    if ((dd.receitas || []).length) {
      corpo += `<h2>Receitas Base</h2>`;
      dd.receitas.forEach(r => {
        corpo += `<div class="item"><h3>${esc(r.nome)}${r.rendimento ? ` — ${esc(r.rendimento)}` : ""}</h3>`;
        if (r.ingredientes) corpo += `<div class="sub">Ingredientes</div><ul>${linha(r.ingredientes).map(i => `<li>${esc(i)}</li>`).join("")}</ul>`;
        if (r.preparo) corpo += `<div class="sub">Modo de preparo</div><p>${esc(r.preparo).replace(/\n/g, "<br>")}</p>`;
        corpo += `</div>`;
      });
    }
    if ((dd.checklists || []).length) {
      corpo += `<h2>Checklists Operacionais</h2>`;
      dd.checklists.forEach(c => {
        corpo += `<div class="item"><h3>${esc(c.nome)}</h3><ul class="chk">${linha(c.itens).map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>`;
      });
    }
  } else {
    modelo.secoes.forEach(sec => {
      const val = d.dados[sec.id];
      corpo += `<h2>${esc(sec.titulo)}</h2>`;
      if (Array.isArray(val)) val.forEach(item => {
        corpo += `<div class="item">`;
        sec.campos.forEach(c => { if (item[c.k]) corpo += `<div class="sub">${esc(c.label)}</div><p>${esc(item[c.k]).replace(/\n/g, "<br>")}</p>`; });
        corpo += `</div>`;
      });
      else if (val) sec.campos.forEach(c => { if (val[c.k]) corpo += `<div class="sub">${esc(c.label)}</div><p>${esc(val[c.k]).replace(/\n/g, "<br>")}</p>`; });
    });
  }
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(d.titulo || "Documento Zeste")}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Antonio:wght@600;700&family=Barlow:wght@400;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Barlow',sans-serif;color:#1C1D1B;padding:48px 56px;max-width:800px;margin:0 auto;line-height:1.5}
    .cab{border-bottom:3px solid #8FA715;padding-bottom:16px;margin-bottom:28px}
    .marca{font-family:'Antonio',sans-serif;font-size:26px;font-weight:700;color:#8FA715;letter-spacing:.04em}
    .tipo{font-size:12px;color:#6B6B5E;text-transform:uppercase;letter-spacing:.1em;margin-top:2px}
    .titulo{font-family:'Antonio',sans-serif;font-size:30px;font-weight:700;margin-top:12px;color:#1C1D1B}
    h2{font-family:'Antonio',sans-serif;font-size:19px;color:#497A5D;margin:28px 0 12px;padding-bottom:5px;border-bottom:2px solid #E3E1D9;text-transform:uppercase;letter-spacing:.03em}
    h3{font-family:'Antonio',sans-serif;font-size:17px;color:#1A4F71;margin-bottom:8px}
    .item{margin-bottom:22px;padding:16px 18px;background:#FAF9F5;border-radius:10px;border-left:3px solid #8FA715;page-break-inside:avoid}
    .sub{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6B6B5E;margin:12px 0 4px}
    ul{margin-left:20px;margin-top:4px}li{font-size:14px;margin-bottom:2px}
    ul.chk{list-style:none;margin-left:0}ul.chk li:before{content:"☐  ";color:#8FA715}
    p{font-size:14px;margin-top:2px}
    .rodape{margin-top:40px;padding-top:16px;border-top:1px solid #E3E1D9;font-size:11px;color:#9a9a8e;text-align:center}
    @media print{body{padding:24px}.item{background:#FAF9F5!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
    <div class="cab"><div class="marca">ZESTE</div><div class="tipo">${esc(modelo.nome)}</div><div class="titulo">${esc(d.titulo || "")}</div></div>
    ${corpo}
    <div class="rodape">Documento gerado por Zeste \u00b7 Intelig\u00eancia para Neg\u00f3cios Gastron\u00f4micos</div>
  </body></html>`;
  return html;
}

function DocCampo({ c, val, onCh }) {
  if (c.tipo === "textao") return <textarea className="doc-input" rows={4} value={val || ""} onChange={e => onCh(e.target.value)} style={{ resize: "vertical" }} />;
  if (c.tipo === "lista") return <textarea className="doc-input" rows={3} value={val || ""} onChange={e => onCh(e.target.value)} placeholder="Um item por linha…" style={{ resize: "vertical" }} />;
  return <input className="doc-input" value={val || ""} onChange={e => onCh(e.target.value)} />;
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

  const [verExport, setVerExport] = useState(null);
  const exportar = () => setVerExport(exportarDoc(d, modelo));

  if (verExport) return (
    <div className="doc-page">
      <style>{STYLE}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button onClick={() => setVerExport(null)} style={{ color: C.verde, background: "none", border: "none", fontFamily: "'Antonio',sans-serif", fontSize: 16, fontWeight: 700, cursor: "pointer", minHeight: 44, padding: 0 }}>‹ Voltar</button>
        <div style={{ flex: 1, fontFamily: "'Antonio',sans-serif", fontWeight: 700, fontSize: 17, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.titulo}</div>
        <button className="doc-btn" onClick={() => { const f = document.getElementById("doc-export-frame"); try { f.contentWindow.focus(); f.contentWindow.print(); } catch { } }} style={{ background: C.azul, color: "#fff" }}>🖨 Imprimir</button>
      </div>
      <div className="doc-card" style={{ overflow: "hidden" }}>
        <iframe id="doc-export-frame" title={d.titulo} srcDoc={verExport} style={{ display: "block", width: "100%", height: "78vh", border: "none", background: "#fff" }} />
      </div>
    </div>
  );



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
            <select className="doc-input" value={d.clienteId} onChange={e => S({ clienteId: e.target.value })} style={{ color: C.preto, background: "#FCFBF9" }}>
              <option value="zeste" style={{ color: C.preto, background: "#fff" }}>— selecione —</option>
              {clientes.map(c => <option key={c.cliente_id} value={c.cliente_id} style={{ color: C.preto, background: "#fff" }}>{c.nome_display}</option>)}
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
                      <DocCampo c={c} val={item[c.k]} onCh={v => updItem(sec.id, idx, c.k, v)} />
                    </div>
                  ))}
                </div>
              ))
          ) : (
            <div className="doc-card" style={{ padding: 16 }}>
              {sec.campos.map(c => (
                <div key={c.k}>
                  <label className="doc-label" style={{ marginTop: sec.campos[0].k === c.k ? 0 : 14 }}>{c.label}</label>
                  <DocCampo c={c} val={(d.dados[sec.id] || {})[c.k]} onCh={v => updCampo(sec.id, c.k, v)} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 20, position: "sticky", bottom: 0, background: C.cinzaF, padding: "12px 0" }}>
        <button className="doc-btn" onClick={() => onDelete(d.id)} style={{ background: "#fff", color: C.coral, border: `1px solid ${C.coral}` }}>🗑 Excluir</button>
        <button className="doc-btn" onClick={exportar} style={{ background: "#fff", color: C.azul, border: `1px solid ${C.azul}` }}>🖨 Exportar PDF</button>
        <button className="doc-btn" onClick={() => onSave(d)} style={{ marginLeft: "auto", background: C.lima, color: C.preto, padding: "10px 24px" }}>💾 Salvar documento</button>
      </div>
    </div>
  );
}

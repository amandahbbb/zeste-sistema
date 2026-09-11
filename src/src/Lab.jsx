import { useState, useEffect } from "react";
import FluxoCaixa from "./FluxoCaixa.jsx";
import Buffet from "./Buffet.jsx";
import { gerarRelatorioLabHTML } from "./relatorioLab.js";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
async function sbLoadRaw(table, t, query = "") { try { const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d : []; } catch { return []; } }
async function sbUpsert(table, item, t, clienteId) { await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: { ...sbH(t), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: item.id, cliente_id: clienteId, dados: item, updated_at: new Date().toISOString() }) }); }
async function sbDel(table, id, t) { await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: sbH(t) }); }

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const td = () => new Date().toISOString().slice(0, 10);
const C = { preto: "#0E0E0C", branco: "#fff", lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B", cinzaF: "#F0EEE8", cinzaM: "#B0AC9E", cinzaE: "#4A4A42", border: "#E3E1D9" };

// ── POP-08 · Zeste Lab ───────────────────────────────────────────────────────
const MODULOS_LAB = [["01", "Estoque e Compras"], ["02", "Operacional e Equipe"], ["03", "Custos e Documentação"], ["04", "Produto e Performance"], ["05", "Sistema"], ["06", "Treinamento e Gestão"]];
const FASES = ["Definir", "Preparar", "Observar", "Agir", "Analisar", "Evoluir", "Renovação"];
const ETAPAS_INAUGURAL = [
  { rotulo: "Abertura", foco: "Reunião de alinhamento — prioridades do mês" },
  { rotulo: "Semana 1", foco: "Observar — leitura da operação real" },
  { rotulo: "Semana 2", foco: "Registrar + Corrigir" },
  { rotulo: "Semana 3", foco: "Corrigir + Acompanhar (serviço)" },
  { rotulo: "Semana 4", foco: "Acompanhar + Evoluir — relatório + proposta" },
];
const METAS_PADRAO = ["Padrão sustentado", "Equipe autônoma", "CMV sob controle", "Cardápio evoluindo"];
const FOCOS_VISITA = ["Produção / pré-preparo", "Serviço (almoço)", "Confeitaria", "Estoque e compras", "Equipe / treinamento", "Degustação de referência"];
const novaVisita = () => ({ id: uid(), data: td(), tipo: "registro", foco: "", presentes: "", observado: "", desvios: "", corrigido: "", pendente: "", acoes: [], auditoriaId: "" });
const novaAcao = () => ({ id: uid(), oque: "", quem: "", prazo: "", feito: false });
const acoesAbertas = p => (p.ciclos || []).flatMap(c => (c.visitas || []).flatMap(v => (v.acoes || []).filter(a => !a.feito)));
const MODALIDADES = [["30d", "Aviso prévio 30 dias (Mod. 01)"], ["15d", "Aviso prévio 15 dias (Mod. 02)"]];
const STATUS_LAB = ["ativo", "pausado", "encerrado"];
const TETO = 2;

const cicloAtual = p => (p && p.ciclos && p.ciclos.length ? p.ciclos[p.ciclos.length - 1] : null);
function contarPendencias(p) {
  const c = cicloAtual(p); if (!c) return 0; let n = 0;
  if (p.proximaVisita && p.proximaVisita < td()) n++;
  n += acoesAbertas(p).length;
  return n;
}
function saude(p) {
  if (p.status !== "ativo") return { cor: C.cinzaM, txt: p.status };
  const n = contarPendencias(p);
  if (n === 0) return { cor: C.verde, txt: "em dia" };
  if (n <= 2) return { cor: "#B8860B", txt: n + " pendência" + (n > 1 ? "s" : "") };
  return { cor: C.coral, txt: n + " pendências" };
}
function etapaAtual(c) { if (!c || !c.etapas) return null; return c.etapas.find(e => !e.feito) || null; }
const novasMetas = () => METAS_PADRAO.map(r => ({ rotulo: r, ok: false, obs: "" }));
const novoInaugural = () => ({ id: uid(), tipo: "inaugural", rotulo: "Ciclo Inaugural", inicio: td(), fase: "Definir", etapas: ETAPAS_INAUGURAL.map(e => ({ ...e, feito: false, obs: "" })), visitas: [], relatorio: "", planoAcao: "", metas: novasMetas() });
const novoMensal = () => ({ id: uid(), tipo: "mensal", rotulo: "Ciclo mensal", inicio: td(), fase: "Observar", etapas: [], visitas: [], relatorio: "", planoAcao: "", metas: novasMetas() });

export default function Lab({ onBack, token }) {
  const [parts, setParts] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);       // id da participação aberta
  const [draft, setDraft] = useState(null);    // cópia editável
  const [addOpen, setAddOpen] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [verFluxo, setVerFluxo] = useState(false);
  const [verBuffet, setVerBuffet] = useState(false);
  const [visitaSel, setVisitaSel] = useState(null); // id da visita aberta
  const [relHTML, setRelHTML] = useState(null);

  useEffect(() => {
    Promise.all([
      sbLoadRaw("lab_participacoes", token, "deleted_at=is.null&select=*&order=created_at.desc"),
      sbLoadRaw("fin_portal_clientes", token, "select=*&order=nome_display.asc"),
    ]).then(([lp, cl]) => { setParts(lp.map(x => x.dados || x)); setClientes(cl); setLoading(false); });
  }, []);

  const salvar = async (p) => {
    setParts(prev => prev.find(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]);
    await sbUpsert("lab_participacoes", p, token, p.clienteId || "zeste");
    setSalvo(true); setTimeout(() => setSalvo(false), 1800);
  };
  const remover = async (p) => { setParts(prev => prev.filter(x => x.id !== p.id)); setSel(null); setDraft(null); await sbDel("lab_participacoes", p.id, token); };

  const inp = { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.cinzaM}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, background: "#fff", fontFamily: "inherit" };
  const lbl = { fontSize: 10, color: C.cinzaE, fontWeight: 700, letterSpacing: ".04em", display: "block", marginBottom: 3 };
  const card = { border: `1px solid ${C.border}`, borderRadius: 10, background: "#fff", padding: 14, marginBottom: 12 };
  const ativos = parts.filter(p => p.status === "ativo").length;
  const disponiveis = clientes.filter(c => !parts.some(p => p.clienteId === c.cliente_id));

  const abrir = (p) => { setSel(p.id); setDraft(JSON.parse(JSON.stringify(p))); setVerFluxo(false); setVerBuffet(false); setVisitaSel(null); };
  const upDraft = patch => setDraft(d => ({ ...d, ...patch }));

  // ─────────── HEADER ───────────
  const Header = ({ titulo, voltar }) => (
    <div style={{ background: C.preto, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <button onClick={voltar} style={{ color: C.lima, fontSize: 22, background: "none", border: "none", cursor: "pointer" }}>‹</button>
      <span style={{ fontSize: 20 }}>🧪</span>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: ".04em" }}>{titulo}</div>
      {salvo && <span style={{ marginLeft: "auto", color: C.lima, fontSize: 12, fontWeight: 600 }}>✓ salvo</span>}
    </div>
  );

  if (loading) return (<div style={{ background: C.cinzaF, minHeight: "100vh" }}><Header titulo="Zeste Lab" voltar={onBack} /><div style={{ padding: 40, textAlign: "center", color: C.cinzaE }}>Carregando…</div></div>);

  // ══════════════ PAINEL (lista) ══════════════
  if (!sel) return (
    <div style={{ background: C.cinzaF, minHeight: "100vh", fontFamily: "'Barlow',sans-serif" }}>
      <Header titulo="Zeste Lab" voltar={onBack} />
      <div style={{ padding: 16, maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700 }}>Acompanhamento contínuo</div>
            <div style={{ fontSize: 12.5, color: C.cinzaE, marginTop: 2 }}>
              Capacidade: <b style={{ color: ativos >= TETO ? C.coral : C.verde }}>{ativos} de {TETO} clientes ativos</b> · teto por capacidade (POP-08)
            </div>
          </div>
          {disponiveis.length > 0 && <button onClick={() => setAddOpen(v => !v)} style={{ background: C.lima, color: C.preto, border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Adicionar cliente</button>}
        </div>

        {ativos >= TETO && <div style={{ ...card, borderColor: "#B8860B", background: "#FBF3E0", fontSize: 12.5, color: "#7a5a00" }}>⚠ No teto de capacidade — avaliar antes de assumir mais um Lab (acompanhamento semanal é intenso).</div>}

        {addOpen && <AddCliente clientes={disponiveis} inp={inp} lbl={lbl} card={card} onCancel={() => setAddOpen(false)} onCriar={async (nova) => { setAddOpen(false); await salvar(nova); abrir(nova); }} />}

        {parts.length === 0 && !addOpen ? <div style={{ ...card, padding: 28, textAlign: "center", color: C.cinzaE, fontStyle: "italic" }}>Nenhum cliente no Lab ainda. Toque em “+ Adicionar cliente” para começar o primeiro ciclo.</div> :
          parts.map(p => {
            const c = cicloAtual(p); const s = saude(p); const ea = etapaAtual(c);
            return (
              <div key={p.id} onClick={() => abrir(p)} style={{ ...card, cursor: "pointer", borderLeft: `4px solid ${s.cor}`, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 17 }}>{p.clienteNome}</span>
                    <span style={{ fontSize: 11, color: s.cor, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{s.txt}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.cinzaE, marginTop: 3 }}>
                    {c ? <>{c.rotulo} · fase <b style={{ color: C.azul }}>{c.fase}</b>{ea ? ` · em ${ea.rotulo}` : ""}</> : "sem ciclo aberto"}
                    {p.proximaVisita ? <> · próxima visita <b style={{ color: p.proximaVisita < td() ? C.coral : C.preto }}>{p.proximaVisita.split("-").reverse().join("/")}</b></> : ""}
                  </div>
                </div>
                <span style={{ color: C.azul, fontWeight: 700 }}>→</span>
              </div>
            );
          })}
      </div>
    </div>
  );

  // ══════════════ WORKSPACE (cliente) ══════════════
  const d = draft; const c = cicloAtual(d);
  const setCiclo = (patch) => setDraft(dr => { const cs = [...dr.ciclos]; cs[cs.length - 1] = { ...cs[cs.length - 1], ...patch }; return { ...dr, ciclos: cs }; });
  const addCiclo = (novo) => setDraft(dr => ({ ...dr, ciclos: [...(dr.ciclos || []), novo] }));
  const gerarRelatorio = () => { if (!c) return; setRelHTML(gerarRelatorioLabHTML({ participacao: d, ciclo: c, clienteNome: d.clienteNome })); };
  const criarAuditoria = async (visita) => {
    const aud = { id: uid(), data: visita.data || td(), horario: "", responsaveis: d.clienteNome ? "" : "", movimento: "", origem: "lab", labVisitaId: visita.id,
      chegada: { espera: "", equipe: "", explicou: "", comunicacao: "", obs: "" }, pratos: [], resumo: { q1: "", q2: "", q3: "", q4: "", q5: "", q6: "" } };
    await sbUpsert("portal_auditorias", aud, token, d.clienteId);
    setCiclo({ visitas: c.visitas.map(x => x.id === visita.id ? { ...x, tipo: "auditoria", auditoriaId: aud.id } : x) });
    window.alert("Auditoria POP-10 criada e vinculada a esta visita.\n\nPara preencher os 8 critérios por prato, abra:\nClientes → " + d.clienteNome + " → Implementação.");
  };

  // ═══════ REGISTRO DE ACOMPANHAMENTO (uma visita) ═══════
  if (visitaSel && c) {
    const v = (c.visitas || []).find(x => x.id === visitaSel);
    if (!v) { setVisitaSel(null); return null; }
    const upV = patch => setCiclo({ visitas: c.visitas.map(x => x.id === v.id ? { ...x, ...patch } : x) });
    const upAcao = (i, patch) => upV({ acoes: (v.acoes || []).map((a, j) => j === i ? { ...a, ...patch } : a) });
    const campo = (rot, key, ph, rows = 3) => (
      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>{rot}</label>
        <textarea value={v[key] || ""} onChange={e => upV({ [key]: e.target.value })} rows={rows} placeholder={ph} style={{ ...inp, resize: "vertical" }} />
      </div>
    );
    return (
      <div style={{ background: C.cinzaF, minHeight: "100vh", fontFamily: "'Barlow',sans-serif" }}>
        <Header titulo={`${d.clienteNome} · Registro de visita`} voltar={() => setVisitaSel(null)} />
        <div style={{ padding: 16, maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <button onClick={() => setVisitaSel(null)} style={{ background: "none", border: "none", color: C.azul, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>‹ Voltar ao ciclo</button>
            <button onClick={() => { salvar(d); setVisitaSel(null); }} style={{ background: C.verde, color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Salvar registro</button>
          </div>

          <div style={card}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <div style={{ flex: "1 1 130px" }}><label style={lbl}>DATA</label><input type="date" value={v.data || ""} onChange={e => upV({ data: e.target.value })} style={inp} /></div>
              <div style={{ flex: "1 1 170px" }}><label style={lbl}>FOCO DA VISITA</label>
                <select value={v.foco || ""} onChange={e => upV({ foco: e.target.value })} style={inp}><option value="">— selecione —</option>{FOCOS_VISITA.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
              <div style={{ flex: "1 1 180px" }}><label style={lbl}>QUEM ESTAVA (EQUIPE)</label><input value={v.presentes || ""} onChange={e => upV({ presentes: e.target.value })} placeholder="ex.: Sandra, cozinha" style={inp} /></div>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Observar → Registrar → Corrigir</div>
            {campo("O QUE FOI OBSERVADO", "observado", "como a operação estava funcionando na prática")}
            {campo("DESVIOS EM RELAÇÃO AO PADRÃO", "desvios", "o que saiu do que foi treinado/documentado")}
            {campo("O QUE FOI CORRIGIDO NA HORA", "corrigido", "ajustes feitos durante a visita")}
            {campo("PENDÊNCIAS / PRÓXIMA VISITA", "pendente", "o que ficou para acompanhar", 2)}
          </div>

          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700 }}>Ações combinadas</div>
              <button onClick={() => upV({ acoes: [...(v.acoes || []), novaAcao()] })} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 6, padding: "4px 10px", fontSize: 11.5, cursor: "pointer", color: C.azul }}>+ ação</button>
            </div>
            {(v.acoes || []).length === 0 ? <div style={{ fontSize: 12, color: C.cinzaM, fontStyle: "italic" }}>Nenhuma ação registrada. Ações em aberto aparecem como pendência no painel do Lab.</div> :
              (v.acoes || []).map((a, i) => (
                <div key={a.id} style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                  <input type="checkbox" checked={!!a.feito} onChange={e => upAcao(i, { feito: e.target.checked })} style={{ width: 18, height: 18, flexShrink: 0, margin: 0 }} />
                  <input value={a.oque} onChange={e => upAcao(i, { oque: e.target.value })} placeholder="o que precisa ser feito" style={{ ...inp, flex: "2 1 200px", textDecoration: a.feito ? "line-through" : "none", color: a.feito ? C.cinzaE : C.preto }} />
                  <input value={a.quem} onChange={e => upAcao(i, { quem: e.target.value })} placeholder="quem" style={{ ...inp, flex: "1 1 110px" }} />
                  <input type="date" value={a.prazo} onChange={e => upAcao(i, { prazo: e.target.value })} style={{ ...inp, width: 138 }} />
                  <button onClick={() => upV({ acoes: v.acoes.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: C.coral, fontSize: 15, cursor: "pointer" }}>×</button>
                </div>
              ))}
          </div>

          <div style={card}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Auditoria POP-10</div>
            <div style={{ fontSize: 12.5, color: C.cinzaE, marginBottom: 10 }}>Para avaliar prato a prato (8 critérios, nota 1–5, status e amostragem de 70%), use a auditoria formal — ela fica vinculada a esta visita.</div>
            {v.auditoriaId
              ? <div style={{ fontSize: 13, color: C.verde, fontWeight: 600 }}>✓ Auditoria vinculada a esta visita. Preencha em <b>Clientes → {d.clienteNome} → Implementação</b>.</div>
              : <button onClick={() => criarAuditoria(v)} style={{ background: C.azul, color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Criar auditoria POP-10 desta visita</button>}
          </div>

          <button onClick={() => { salvar(d); setVisitaSel(null); }} style={{ width: "100%", background: C.verde, color: "#fff", border: "none", padding: "12px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 24 }}>Salvar registro</button>
        </div>
      </div>
    );
  }

  if (relHTML) return (
    <div style={{ background: C.cinzaF, minHeight: "100vh", fontFamily: "'Barlow',sans-serif", display: "flex", flexDirection: "column" }}>
      <Header titulo={`${d.clienteNome} · Relatório do ciclo`} voltar={() => setRelHTML(null)} />
      <div style={{ padding: "10px 16px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", background: "#fff", borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => { const f = document.getElementById("lab-rel-frame"); try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { } }} style={{ background: C.azul, color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>🖨 Imprimir / Salvar PDF</button>
        <span style={{ fontSize: 12, color: C.cinzaE }}>Na janela de impressão, escolha <b>Salvar como PDF</b> para enviar ao cliente.</span>
      </div>
      <iframe id="lab-rel-frame" title="Relatório" srcDoc={relHTML} style={{ flex: 1, width: "100%", border: "none", background: "#888" }} />
    </div>
  );

  if (verBuffet) return (
    <div style={{ background: C.cinzaF, minHeight: "100vh", fontFamily: "'Barlow',sans-serif" }}>
      <Header titulo={`${d.clienteNome} · Produção × Sobra`} voltar={() => setVerBuffet(false)} />
      <Buffet token={token} clienteId={d.clienteId} clienteNome={d.clienteNome} podeEditar={true} />
    </div>
  );

  if (verFluxo) return (
    <div style={{ background: C.cinzaF, minHeight: "100vh", fontFamily: "'Barlow',sans-serif" }}>
      <Header titulo={`${d.clienteNome} · Fluxo de caixa`} voltar={() => setVerFluxo(false)} />
      <FluxoCaixa token={token} clienteId={d.clienteId} clienteNome={d.clienteNome} podeEditar={true} />
    </div>
  );

  return (
    <div style={{ background: C.cinzaF, minHeight: "100vh", fontFamily: "'Barlow',sans-serif" }}>
      <Header titulo={d.clienteNome} voltar={() => { setSel(null); setDraft(null); }} />
      <div style={{ padding: 16, maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={() => { setSel(null); setDraft(null); }} style={{ background: "none", border: "none", color: C.azul, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>‹ Painel do Lab</button>
          <button onClick={() => salvar(d)} style={{ background: C.verde, color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Salvar alterações</button>
        </div>

        {/* CONFIGURAÇÃO */}
        <div style={card}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Configuração do ciclo</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <div style={{ flex: "1 1 120px" }}><label style={lbl}>STATUS</label><select value={d.status} onChange={e => upDraft({ status: e.target.value })} style={inp}>{STATUS_LAB.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div style={{ flex: "1 1 130px" }}><label style={lbl}>INÍCIO</label><input type="date" value={d.inicio || ""} onChange={e => upDraft({ inicio: e.target.value })} style={inp} /></div>
            <div style={{ flex: "1 1 130px" }}><label style={lbl}>PRÓXIMA VISITA</label><input type="date" value={d.proximaVisita || ""} onChange={e => upDraft({ proximaVisita: e.target.value })} style={inp} /></div>
            <div style={{ flex: "1 1 120px" }}><label style={lbl}>PREÇO/MÊS (R$)</label><input type="text" inputMode="decimal" value={d.preco ?? ""} onChange={e => upDraft({ preco: e.target.value.replace(/[^0-9.,]/g, "") })} placeholder="a calibrar" style={inp} /></div>
            <div style={{ flex: "1 1 100%" }}><label style={lbl}>MODALIDADE DE CONTRATO</label><select value={d.modalidade || "30d"} onChange={e => upDraft({ modalidade: e.target.value })} style={inp}>{MODALIDADES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div>
          <label style={{ ...lbl, marginTop: 12 }}>MÓDULOS CONTRATADOS (o cliente não compra todos)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MODULOS_LAB.map(([n, nome]) => {
              const on = (d.modulos || []).includes(n);
              return <button key={n} onClick={() => upDraft({ modulos: on ? d.modulos.filter(x => x !== n) : [...(d.modulos || []), n] })} style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 20, cursor: "pointer", border: `1.5px solid ${on ? C.lima : C.cinzaM}`, background: on ? "#F4F7E8" : "#fff", color: on ? "#5c7211" : C.cinzaE }}>{n} · {nome}</button>;
            })}
          </div>
        </div>

        {/* CICLO ATUAL */}
        {c && <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700 }}>{c.rotulo} <span style={{ fontSize: 11, color: C.cinzaE, fontWeight: 400 }}>· início {(c.inicio || "").split("-").reverse().join("/")}</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={gerarRelatorio} style={{ background: "#fff", color: C.azul, border: `1.5px solid ${C.azul}`, padding: "6px 13px", borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>📄 Relatório do ciclo</button>
              <label style={{ ...lbl, display: "inline", marginRight: 6 }}>FASE</label>
              <select value={c.fase} onChange={e => setCiclo({ fase: e.target.value })} style={{ ...inp, width: "auto", display: "inline-block" }}>{FASES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
          </div>

          {/* ETAPAS */}
          {(c.etapas || []).length > 0 && <>
            <label style={lbl}>ETAPAS</label>
            <div style={{ marginBottom: 12 }}>
              {c.etapas.map((et, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < c.etapas.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
                  <input type="checkbox" checked={!!et.feito} onChange={e => setCiclo({ etapas: c.etapas.map((x, j) => j === i ? { ...x, feito: e.target.checked } : x) })} style={{ width: 18, height: 18, flexShrink: 0, marginTop: 3 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, textDecoration: et.feito ? "line-through" : "none", color: et.feito ? C.cinzaE : C.preto }}>{et.rotulo} <span style={{ fontWeight: 400, color: C.cinzaE }}>— {et.foco}</span></div>
                    <input value={et.obs || ""} onChange={e => setCiclo({ etapas: c.etapas.map((x, j) => j === i ? { ...x, obs: e.target.value } : x) })} placeholder="observações da etapa" style={{ ...inp, marginTop: 5, fontSize: 12 }} />
                  </div>
                </div>
              ))}
            </div>
          </>}

          {/* VISITAS */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ ...lbl, marginBottom: 0 }}>VISITAS / REGISTROS DE ACOMPANHAMENTO</label>
            <button onClick={() => { const v = novaVisita(); setCiclo({ visitas: [...(c.visitas || []), v] }); setVisitaSel(v.id); }} style={{ background: C.lima, color: C.preto, border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>+ Registrar visita</button>
          </div>
          {(c.visitas || []).length === 0 ? <div style={{ fontSize: 12, color: C.cinzaM, fontStyle: "italic", marginBottom: 10 }}>Nenhuma visita registrada.</div> :
            <div style={{ marginBottom: 12 }}>{c.visitas.map(v => {
              const ab = (v.acoes || []).filter(a => !a.feito).length;
              return (
                <div key={v.id} onClick={() => setVisitaSel(v.id)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 11px", border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 6, cursor: "pointer", borderLeft: `3px solid ${v.tipo === "auditoria" ? C.azul : C.lima}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{(v.data || "").split("-").reverse().join("/")}{v.foco ? <span style={{ fontWeight: 400, color: C.cinzaE }}> · {v.foco}</span> : ""}</div>
                    <div style={{ fontSize: 11.5, color: C.cinzaE }}>{v.tipo === "auditoria" ? "Auditoria POP-10" : "Registro de acompanhamento"}{ab ? ` · ${ab} ação(ões) em aberto` : ""}{v.observado ? " · preenchido" : " · vazio"}</div>
                  </div>
                  <span style={{ color: C.azul, fontWeight: 700 }}>›</span>
                  <button onClick={e => { e.stopPropagation(); if (window.confirm("Excluir esta visita?")) setCiclo({ visitas: c.visitas.filter(x => x.id !== v.id) }); }} style={{ background: "none", border: "none", color: C.coral, fontSize: 16, cursor: "pointer" }}>×</button>
                </div>
              );
            })}</div>}

          {/* RELATÓRIO + PLANO */}
          <label style={lbl}>RELATÓRIO DO CICLO</label>
          <textarea value={c.relatorio || ""} onChange={e => setCiclo({ relatorio: e.target.value })} rows={3} style={{ ...inp, resize: "vertical", marginBottom: 10 }} placeholder="o que foi acompanhado e corrigido no período" />
          <label style={lbl}>PLANO DE AÇÃO (PRÓXIMO PERÍODO)</label>
          <textarea value={c.planoAcao || ""} onChange={e => setCiclo({ planoAcao: e.target.value })} rows={3} style={{ ...inp, resize: "vertical", marginBottom: 10 }} placeholder="prioridades do período seguinte" />

          {/* METAS */}
          <label style={lbl}>METAS / KPIS</label>
          {(c.metas || []).map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <input type="checkbox" checked={!!m.ok} onChange={e => setCiclo({ metas: c.metas.map((x, j) => j === i ? { ...x, ok: e.target.checked } : x) })} style={{ width: 18, height: 18, flexShrink: 0, margin: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, width: 150, color: m.ok ? C.verde : C.preto }}>{m.rotulo}</span>
              <input value={m.obs || ""} onChange={e => setCiclo({ metas: c.metas.map((x, j) => j === i ? { ...x, obs: e.target.value } : x) })} placeholder="evidência / nota" style={{ ...inp, flex: 1, fontSize: 12 }} />
            </div>
          ))}
        </div>}

        {/* NOVO CICLO */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          {(!d.ciclos || d.ciclos.length === 0) && <button onClick={() => addCiclo(novoInaugural())} style={{ background: C.lima, color: C.preto, border: "none", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Abrir Ciclo Inaugural</button>}
          {d.ciclos && d.ciclos.length > 0 && <button onClick={() => addCiclo(novoMensal())} style={{ background: "#fff", color: C.azul, border: `1.5px solid ${C.azul}`, padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>+ Novo ciclo mensal</button>}
          {d.ciclos && d.ciclos.length > 1 && <span style={{ fontSize: 12, color: C.cinzaE, alignSelf: "center" }}>{d.ciclos.length} ciclos no histórico</span>}
        </div>

        {/* MÓDULO 05 */}
        <div style={card}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700 }}>Módulo 05 · Sistema</div>
          <div style={{ fontSize: 12.5, color: C.cinzaE, margin: "4px 0 10px" }}>Fluxo de caixa do cliente <b style={{ color: C.verde }}>(ativo)</b> · CMV real × teórico <span style={{ fontStyle: "italic" }}>(em construção)</span>.</div>
          <button onClick={() => setVerFluxo(true)} style={{ background: C.azul, color: "#fff", border: "none", padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Abrir fluxo de caixa</button>
          <button onClick={() => setVerBuffet(true)} style={{ background: "#fff", color: C.azul, border: `1.5px solid ${C.azul}`, padding: "9px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer", marginLeft: 8 }}>Produção × Sobra (buffet)</button>
        </div>

        <button onClick={() => { if (window.confirm("Remover este cliente do Lab? (não apaga dados do cliente, só a participação no Lab)")) remover(d); }} style={{ background: "none", border: "none", color: C.coral, fontSize: 12.5, cursor: "pointer", marginBottom: 24 }}>Remover do Lab</button>
      </div>
    </div>
  );
}

function AddCliente({ clientes, inp, lbl, card, onCancel, onCriar }) {
  const [cid, setCid] = useState("");
  const [modalidade, setModalidade] = useState("30d");
  const [inicio, setInicio] = useState(td());
  const [preco, setPreco] = useState("");
  const [comInaugural, setComInaugural] = useState(true);
  const criar = () => {
    if (!cid) return;
    const cl = clientes.find(c => c.cliente_id === cid);
    onCriar({ id: uid(), clienteId: cid, clienteNome: cl ? cl.nome_display : cid, status: "ativo", modalidade, inicio, preco, modulos: [], proximaVisita: "", ciclos: comInaugural ? [novoInaugural()] : [] });
  };
  return (
    <div style={{ ...card, borderColor: C.lima }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Adicionar cliente ao Lab</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <div style={{ flex: "1 1 220px" }}><label style={lbl}>CLIENTE</label><select value={cid} onChange={e => setCid(e.target.value)} style={inp}><option value="">— selecione —</option>{clientes.map(c => <option key={c.cliente_id} value={c.cliente_id}>{c.nome_display}</option>)}</select></div>
        <div style={{ flex: "1 1 130px" }}><label style={lbl}>INÍCIO</label><input type="date" value={inicio} onChange={e => setInicio(e.target.value)} style={inp} /></div>
        <div style={{ flex: "1 1 120px" }}><label style={lbl}>PREÇO/MÊS</label><input type="text" inputMode="decimal" value={preco} onChange={e => setPreco(e.target.value.replace(/[^0-9.,]/g, ""))} placeholder="a calibrar" style={inp} /></div>
        <div style={{ flex: "1 1 100%" }}><label style={lbl}>MODALIDADE</label><select value={modalidade} onChange={e => setModalidade(e.target.value)} style={inp}>{MODALIDADES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={comInaugural} onChange={e => setComInaugural(e.target.checked)} style={{ width: 18, height: 18, flexShrink: 0, margin: 0 }} /> Já abrir o Ciclo Inaugural (4 semanas + abertura)</label>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={criar} disabled={!cid} style={{ background: cid ? C.lima : C.cinzaM, color: C.preto, border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: cid ? "pointer" : "default" }}>Adicionar</button>
        <button onClick={onCancel} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer", color: C.cinzaE }}>Cancelar</button>
      </div>
    </div>
  );
}

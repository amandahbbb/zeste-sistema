import { useState, useEffect } from "react";
import FluxoCaixa from "./FluxoCaixa.jsx";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
async function sbLoadRaw(table, t, query = "") { try { const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: sbH(t) }); const d = await r.json(); return Array.isArray(d) ? d : []; } catch { return []; } }
async function sbUpsert(table, item, t, clienteId) { await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: { ...sbH(t), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: item.id, cliente_id: clienteId, dados: item, updated_at: new Date().toISOString() }) }); }
async function sbDel(table, id, t) { await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: sbH(t) }); }

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const td = () => new Date().toISOString().slice(0, 10);
const C = { preto: "#0E0E0C", branco: "#fff", lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B", cinzaF: "#F0EEE8", cinzaM: "#D9D5C8", cinzaE: "#6B6B5E", border: "#E3E1D9" };

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
const MODALIDADES = [["30d", "Aviso prévio 30 dias (Mod. 01)"], ["15d", "Aviso prévio 15 dias (Mod. 02)"]];
const STATUS_LAB = ["ativo", "pausado", "encerrado"];
const TETO = 2;

const cicloAtual = p => (p && p.ciclos && p.ciclos.length ? p.ciclos[p.ciclos.length - 1] : null);
function contarPendencias(p) {
  const c = cicloAtual(p); if (!c) return 0; let n = 0;
  if (p.proximaVisita && p.proximaVisita < td()) n++;
  (c.metas || []).forEach(m => { if (!m.ok) n++; });
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

  const abrir = (p) => { setSel(p.id); setDraft(JSON.parse(JSON.stringify(p))); setVerFluxo(false); };
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
            <div><label style={{ ...lbl, display: "inline", marginRight: 6 }}>FASE</label>
              <select value={c.fase} onChange={e => setCiclo({ fase: e.target.value })} style={{ ...inp, width: "auto", display: "inline-block" }}>{FASES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
          </div>

          {/* ETAPAS */}
          {(c.etapas || []).length > 0 && <>
            <label style={lbl}>ETAPAS</label>
            <div style={{ marginBottom: 12 }}>
              {c.etapas.map((et, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < c.etapas.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
                  <input type="checkbox" checked={!!et.feito} onChange={e => setCiclo({ etapas: c.etapas.map((x, j) => j === i ? { ...x, feito: e.target.checked } : x) })} style={{ marginTop: 3 }} />
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
            <button onClick={() => setCiclo({ visitas: [...(c.visitas || []), { id: uid(), data: td(), tipo: "registro", obs: "" }] })} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 6, padding: "4px 10px", fontSize: 11.5, cursor: "pointer", color: C.azul }}>+ Registrar visita</button>
          </div>
          {(c.visitas || []).length === 0 ? <div style={{ fontSize: 12, color: C.cinzaM, fontStyle: "italic", marginBottom: 10 }}>Nenhuma visita registrada.</div> :
            <div style={{ marginBottom: 12 }}>{c.visitas.map((v, i) => (
              <div key={v.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <input type="date" value={v.data} onChange={e => setCiclo({ visitas: c.visitas.map(x => x.id === v.id ? { ...x, data: e.target.value } : x) })} style={{ ...inp, width: 140 }} />
                <select value={v.tipo} onChange={e => setCiclo({ visitas: c.visitas.map(x => x.id === v.id ? { ...x, tipo: e.target.value } : x) })} style={{ ...inp, width: 140 }}><option value="registro">Registro</option><option value="auditoria">Auditoria POP-10</option></select>
                <input value={v.obs || ""} onChange={e => setCiclo({ visitas: c.visitas.map(x => x.id === v.id ? { ...x, obs: e.target.value } : x) })} placeholder="o que foi observado / corrigido" style={{ ...inp, flex: 1 }} />
                <button onClick={() => setCiclo({ visitas: c.visitas.filter(x => x.id !== v.id) })} style={{ background: "none", border: "none", color: C.coral, fontSize: 16, cursor: "pointer" }}>×</button>
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.cinzaE, fontStyle: "italic", marginTop: 2 }}>A auditoria formal POP-10 (8 critérios por prato) fica em Clientes → Implementação — mesma família de registro.</div>
            </div>}

          {/* RELATÓRIO + PLANO */}
          <label style={lbl}>RELATÓRIO DO CICLO</label>
          <textarea value={c.relatorio || ""} onChange={e => setCiclo({ relatorio: e.target.value })} rows={3} style={{ ...inp, resize: "vertical", marginBottom: 10 }} placeholder="o que foi acompanhado e corrigido no período" />
          <label style={lbl}>PLANO DE AÇÃO (PRÓXIMO PERÍODO)</label>
          <textarea value={c.planoAcao || ""} onChange={e => setCiclo({ planoAcao: e.target.value })} rows={3} style={{ ...inp, resize: "vertical", marginBottom: 10 }} placeholder="prioridades do período seguinte" />

          {/* METAS */}
          <label style={lbl}>METAS / KPIS</label>
          {(c.metas || []).map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <input type="checkbox" checked={!!m.ok} onChange={e => setCiclo({ metas: c.metas.map((x, j) => j === i ? { ...x, ok: e.target.checked } : x) })} />
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
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, cursor: "pointer" }}><input type="checkbox" checked={comInaugural} onChange={e => setComInaugural(e.target.checked)} /> Já abrir o Ciclo Inaugural (4 semanas + abertura)</label>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={criar} disabled={!cid} style={{ background: cid ? C.lima : C.cinzaM, color: C.preto, border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: cid ? "pointer" : "default" }}>Adicionar</button>
        <button onClick={onCancel} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer", color: C.cinzaE }}>Cancelar</button>
      </div>
    </div>
  );
}

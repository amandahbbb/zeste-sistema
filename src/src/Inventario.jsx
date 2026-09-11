import { useState, useEffect, useRef } from "react";

const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH = t => ({ apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const td = () => new Date().toISOString().slice(0, 10);
const agora = () => new Date().toISOString();
const C = { preto: "#0E0E0C", lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71", coral: "#C4502B", cinzaF: "#F0EEE8", cinzaM: "#D9D5C8", cinzaE: "#6B6B5E", border: "#E3E1D9" };
const brl = n => "R$ " + (Number(n) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nkg = n => (Math.round((Number(n) || 0) * 1000) / 1000).toLocaleString("pt-BR");
const normN = s => (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const LOCAIS = ["Freezer", "Geladeira", "Seco", "Bancada", "Bar", "Sem local"];

function jwtEmail(token) { try { const p = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); return p.email || p.user_metadata?.email || "usuário"; } catch { return "usuário"; } }

// ── Número falado em português → valor ──────────────────────────────────────
const NUM_PT = { zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, meia: 0.5, meio: 0.5, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90, cem: 100, cento: 100 };
export function parseNumeroPt(texto) {
  const t = normN(texto);
  if (!t) return null;
  // 1) dígitos com vírgula/ponto: "12,5" "12.5" "12"
  const mNum = t.replace(/(\d)\s+(\d)/g, "$1$2").match(/(\d+(?:[.,]\d+)?)/);
  let base = mNum ? parseFloat(mNum[1].replace(",", ".")) : null;
  // "e meio/meia" adiciona 0,5 (se veio dígito)
  if (base != null) { if (/\be\s+(meio|meia)\b/.test(t) || /\bmeio\b|\bmeia\b/.test(t.replace(mNum[0], ""))) base += 0.5; return base; }
  // 2) por extenso
  // "dois vírgula cinco" → decimal
  const mVirg = t.split(/\bvirgula\b/);
  if (mVirg.length === 2) {
    const ini = (mVirg[0].trim().split(/\s+/).filter(w => w !== "e").reduce((a, w) => a + (NUM_PT[w] || 0), 0));
    const decW = mVirg[1].trim().split(/\s+/).filter(Boolean);
    const dec = decW.map(w => NUM_PT[w]).filter(n => n != null && n < 10).join("");
    if (dec) return parseFloat(`${ini}.${dec}`);
  }
  const palavras = t.split(/\s+/).filter(w => w !== "e");
  let total = 0, achou = false, temMeio = false;
  for (const w of palavras) {
    if (w === "meio" || w === "meia") { temMeio = true; achou = true; continue; }
    if (w === "virgula") continue;
    if (NUM_PT[w] != null) { total += NUM_PT[w]; achou = true; }
  }
  if (!achou) return null;
  return total + (temMeio ? 0.5 : 0);
}

// ── Estrutura da contagem ────────────────────────────────────────────────────
function itensParaContar(ingredientes, escopo) {
  const marcado = i => (i.local && i.local.trim()) || (i.emb && i.emb.unidade);
  const base = (ingredientes || []).filter(i => escopo === "completa" ? true : marcado(i));
  return base.map(i => {
    const emb = i.emb && i.emb.unidade ? i.emb : null;
    return { ingId: i.id || i.nome, nome: i.nome, preco: +i.p || 0, un: i.un || "KG",
      local: i.local || "Sem local", embUn: emb ? emb.unidade : "", fator: emb ? (+emb.fator || 1) : 1, nota: i.notaContagem || "" };
  }).sort((a, b) => a.nome.localeCompare(b.nome));
}
const contadoBase = (it, valorDigitado) => { const v = parseFloat(String(valorDigitado).replace(",", ".")) || 0; return it.embUn ? v * it.fator : v; };

async function carregar(clienteId, token) { try { const r = await fetch(`${SB_URL}/rest/v1/est_contagens?cliente_id=eq.${clienteId}&deleted_at=is.null&select=*&order=created_at.desc`, { headers: sbH(token) }); const d = await r.json(); return Array.isArray(d) ? d.map(x => ({ ...(x.dados || {}), _row: x.id })) : []; } catch { return []; } }
async function salvar(reg, clienteId, token) { await fetch(`${SB_URL}/rest/v1/est_contagens`, { method: "POST", headers: { ...sbH(token), Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ id: reg.id, cliente_id: clienteId, dados: reg, updated_at: agora() }) }); }

// scanner QR (BarcodeDetector nativo; onde não houver, o componente nem aparece)
function ScannerQR({ onScan, onClose }) {
  const videoRef = useRef(); const [err, setErr] = useState("");
  useEffect(() => {
    let ativo = true, stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        const det = new window.BarcodeDetector({ formats: ["qr_code"] });
        const tick = async () => {
          if (!ativo || !videoRef.current) return;
          try { const cs = await det.detect(videoRef.current); if (cs && cs[0]) { onScan(cs[0].rawValue); return; } } catch { }
          requestAnimationFrame(tick);
        }; tick();
      } catch (e) { setErr("Não consegui abrir a câmera."); }
    })();
    return () => { ativo = false; if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <video ref={videoRef} playsInline style={{ width: "100%", maxWidth: 360, borderRadius: 12, background: "#000" }} />
      {err && <div style={{ color: "#fff", marginTop: 12 }}>{err}</div>}
      <div style={{ color: "#fff", marginTop: 12, fontSize: 13 }}>Aponte para a etiqueta do insumo</div>
      <button onClick={onClose} style={{ marginTop: 16, background: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, cursor: "pointer" }}>Fechar</button>
    </div>
  );
}

export default function Inventario({ token, clienteId, mes, ingredientes, podeEditar = true }) {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fase, setFase] = useState("inicio"); // inicio | contando | revisao
  const [reg, setReg] = useState(null);        // contagem em andamento
  const [busca, setBusca] = useState("");
  const [ouvindo, setOuvindo] = useState(null); // ingId escutando
  const [scanOpen, setScanOpen] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const recRef = useRef(null); const focoRef = useRef({});
  const usuario = jwtEmail(token);
  const temVoz = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const temQR = typeof window !== "undefined" && "BarcodeDetector" in window;

  useEffect(() => { carregar(clienteId, token).then(r => { setRegs(r); setLoading(false); }); }, [clienteId]);

  const inp = { boxSizing: "border-box", border: `1.5px solid ${C.cinzaM}`, borderRadius: 8, padding: "9px 11px", fontSize: 15, background: "#fff", fontFamily: "inherit" };
  const card = { border: `1px solid ${C.border}`, borderRadius: 10, background: "#fff", padding: 14, marginBottom: 12 };

  const persistir = async (r) => { setReg(r); await salvar(r, clienteId, token); setSalvo(true); setTimeout(() => setSalvo(false), 1200); };

  const iniciar = (escopo) => {
    const its = itensParaContar(ingredientes, escopo);
    const itensMap = {}; its.forEach(it => { itensMap[it.ingId] = { ...it, valor: "" }; });
    const novo = { id: `cont_${clienteId}_${Date.now()}`, data: td(), competencia: mes, escopo, status: "aberta", usuarioAbriu: usuario, abertaEm: agora(), itens: itensMap };
    setReg(novo); setFase("contando"); salvar(novo, clienteId, token);
  };
  const retomar = (r) => { setReg(r); setFase("contando"); };
  const setValor = (ingId, v) => { const r = { ...reg, itens: { ...reg.itens, [ingId]: { ...reg.itens[ingId], valor: v } } }; persistir(r); };

  const ouvir = (ingId) => {
    if (!temVoz) return;
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    try { if (recRef.current) recRef.current.abort(); } catch { }
    const rec = new Rec(); recRef.current = rec; rec.lang = "pt-BR"; rec.interimResults = false; rec.maxAlternatives = 3;
    setOuvindo(ingId);
    rec.onresult = e => { let n = null; for (let i = 0; i < e.results[0].length && n == null; i++) n = parseNumeroPt(e.results[0][i].transcript); if (n != null) setValor(ingId, String(n).replace(".", ",")); setOuvindo(null); };
    rec.onerror = () => setOuvindo(null); rec.onend = () => setOuvindo(null);
    try { rec.start(); } catch { setOuvindo(null); }
  };

  const onScan = (val) => { setScanOpen(false); const id = (val || "").replace("ZESTE:ING:", ""); const el = focoRef.current[id]; if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus(); } };

  const fechar = async () => {
    if (!window.confirm("Fechar esta contagem? Depois de fechada ela não pode mais ser alterada — vira a base do CMV real do período.")) return;
    const r = { ...reg, status: "fechada", usuarioFechou: usuario, fechadaEm: agora() };
    await salvar(r, clienteId, token); setRegs(rs => [r, ...rs.filter(x => x.id !== r.id)]); setReg(null); setFase("inicio");
  };

  if (loading) return <div style={{ padding: 30, textAlign: "center", color: C.cinzaE }}>Carregando…</div>;

  // ══════════ INÍCIO ══════════
  if (fase === "inicio") {
    const ultima = regs.find(r => r.status === "fechada");
    const aberta = regs.find(r => r.status === "aberta");
    const nMarcados = (ingredientes || []).filter(i => (i.local && i.local.trim()) || (i.emb && i.emb.unidade)).length;
    const diasDesde = ultima ? Math.round((Date.now() - new Date(ultima.fechadaEm || ultima.data).getTime()) / 864e5) : null;
    return (
      <div>
        <div style={{ ...card, borderTop: `3px solid ${C.lima}` }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 800 }}>Modo Inventário</div>
          <div style={{ fontSize: 12.5, color: C.cinzaE, marginBottom: 12 }}>
            {ultima ? <>Última contagem <b>{diasDesde === 0 ? "hoje" : `há ${diasDesde} dia(s)`}</b> · por {ultima.usuarioFechou || ultima.usuarioAbriu}</> : "Nenhuma contagem fechada ainda."}
          </div>
          <div style={{ fontSize: 12, color: C.cinzaE, marginBottom: 12, background: C.cinzaF, borderRadius: 8, padding: "8px 11px" }}>💡 Conte com o estoque parado — antes de receber entrega, fora do serviço.</div>
          {podeEditar && <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {aberta && <button onClick={() => retomar(aberta)} style={{ background: "#B8860B", color: "#fff", border: "none", padding: "11px 18px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>↩ Retomar contagem de {aberta.data.split("-").reverse().join("/")}</button>}
            {nMarcados === 0 && <div style={{ fontSize: 12.5, color: C.coral, marginBottom: 10, background: "#FBEDE8", borderRadius: 8, padding: "8px 11px" }}>⚠ Nenhum insumo marcado para contagem. No cadastro do ingrediente (Operação → Ingredientes), preencha <b>onde fica</b> e/ou <b>como conta</b> — só os marcados entram aqui. Ou use “Contagem completa”.</div>}
            <button onClick={() => iniciar("marcados")} disabled={nMarcados === 0} style={{ background: nMarcados === 0 ? C.cinzaM : C.lima, color: C.preto, border: "none", padding: "11px 18px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: nMarcados === 0 ? "default" : "pointer" }}>Contar marcados ({nMarcados} itens)</button>
            <button onClick={() => iniciar("completa")} style={{ background: "#fff", color: C.azul, border: `1.5px solid ${C.azul}`, padding: "11px 18px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Contagem completa</button>
          </div>}
        </div>

        {regs.filter(r => r.status === "fechada").length > 0 && <div style={{ ...card, padding: 0 }}>
          <div style={{ padding: "11px 14px", borderBottom: `1px solid ${C.border}`, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700 }}>Contagens fechadas</div>
          {regs.filter(r => r.status === "fechada").slice(0, 12).map((r, i, arr) => {
            const its = Object.values(r.itens || {}); const tot = its.reduce((a, it) => a + contadoBase(it, it.valor) * (it.preco || 0), 0); const contados = its.filter(it => String(it.valor).trim() !== "").length;
            return <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < arr.length - 1 ? `1px solid ${C.cinzaF}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.data.split("-").reverse().join("/")} · {r.escopo === "completa" ? "completa" : "marcados"}</div>
                <div style={{ fontSize: 11.5, color: C.cinzaE }}>{contados} itens · valor em estoque {brl(tot)} · por {r.usuarioFechou || r.usuarioAbriu}</div>
              </div>
            </div>;
          })}
        </div>}
      </div>
    );
  }

  // ══════════ CONTANDO ══════════
  if (fase === "contando" && reg) {
    const its = Object.values(reg.itens || {});
    const filtro = normN(busca);
    const visiveis = its.filter(it => !filtro || normN(it.nome).includes(filtro));
    const contados = its.filter(it => String(it.valor).trim() !== "").length;
    const grupos = LOCAIS.map(loc => ({ loc, itens: visiveis.filter(it => (it.local || "Sem local") === loc) })).filter(g => g.itens.length);

    return (
      <div>
        {scanOpen && <ScannerQR onScan={onScan} onClose={() => setScanOpen(false)} />}
        {/* barra fixa de progresso */}
        <div style={{ position: "sticky", top: 0, zIndex: 5, background: C.preto, color: "#fff", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setFase("revisao")} style={{ background: C.lima, color: C.preto, border: "none", borderRadius: 7, padding: "7px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Revisar e fechar →</button>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16 }}>{contados} de {its.length}</div>
          <div style={{ flex: 1, height: 6, background: "#333", borderRadius: 4, minWidth: 60 }}><div style={{ width: `${its.length ? contados / its.length * 100 : 0}%`, height: "100%", background: C.lima, borderRadius: 4 }} /></div>
          {salvo && <span style={{ fontSize: 11, color: C.lima }}>✓ salvo</span>}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="buscar insumo…" style={{ ...inp, flex: 1 }} />
          {temQR && <button onClick={() => setScanOpen(true)} style={{ ...inp, background: "#fff", cursor: "pointer", fontWeight: 700, color: C.azul }}>📷 QR</button>}
        </div>

        {grupos.map(g => (
          <div key={g.loc} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.cinzaE, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6, borderBottom: `1.5px solid ${C.border}`, paddingBottom: 3 }}>{g.loc} · {g.itens.length}</div>
            {g.itens.map(it => {
              const feito = String(it.valor).trim() !== "";
              return (
                <div key={it.ingId} style={{ ...card, marginBottom: 8, padding: "11px 13px", borderLeft: `4px solid ${feito ? C.verde : C.cinzaM}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{it.nome}</div>
                      <div style={{ fontSize: 11.5, color: C.cinzaE }}>conta em <b>{it.embUn || it.un.toLowerCase()}</b>{it.embUn ? ` (1 ${it.embUn} = ${nkg(it.fator)} ${it.un.toLowerCase()})` : ""}</div>
                      {it.nota && <div style={{ fontSize: 11.5, color: C.coral, marginTop: 2 }}>⚠ {it.nota}</div>}
                    </div>
                    <input ref={el => { if (el) focoRef.current[it.ingId] = el; }} type="text" inputMode="decimal" value={it.valor} onChange={e => setValor(it.ingId, e.target.value.replace(/[^0-9.,]/g, ""))} placeholder="0" style={{ ...inp, width: 78, textAlign: "right", fontSize: 18, fontWeight: 700 }} />
                    {temVoz && <button onClick={() => ouvir(it.ingId)} title="falar a quantidade" style={{ width: 46, height: 46, borderRadius: 23, border: "none", cursor: "pointer", fontSize: 20, background: ouvindo === it.ingId ? C.coral : C.cinzaF, color: ouvindo === it.ingId ? "#fff" : C.preto, flexShrink: 0 }}>{ouvindo === it.ingId ? "●" : "🎤"}</button>}
                  </div>
                  {feito && it.embUn && <div style={{ fontSize: 11, color: C.verde, textAlign: "right", marginTop: 3 }}>= {nkg(contadoBase(it, it.valor))} {it.un.toLowerCase()}</div>}
                </div>
              );
            })}
          </div>
        ))}
        {temVoz && <div style={{ fontSize: 11, color: C.cinzaE, fontStyle: "italic", marginBottom: 20 }}>🎤 Toque no microfone de um item e fale só a quantidade (“doze”, “três e meia”, “dois vírgula cinco”). O número aparece no campo — confira antes de seguir.</div>}
      </div>
    );
  }

  // ══════════ REVISÃO ══════════
  if (fase === "revisao" && reg) {
    const its = Object.values(reg.itens || {}).map(it => ({ ...it, base: contadoBase(it, it.valor), valorRS: contadoBase(it, it.valor) * (it.preco || 0), feito: String(it.valor).trim() !== "" })).sort((a, b) => b.valorRS - a.valorRS);
    const total = its.reduce((a, it) => a + it.valorRS, 0); const naoContados = its.filter(it => !it.feito);
    return (
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setFase("contando")} style={{ background: "none", border: `1px solid ${C.cinzaM}`, borderRadius: 8, padding: "9px 15px", fontSize: 13, cursor: "pointer", color: C.azul, fontWeight: 600 }}>‹ Voltar a contar</button>
          {podeEditar && <button onClick={fechar} style={{ background: C.verde, color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Fechar contagem</button>}
        </div>
        <div style={{ ...card, borderTop: `3px solid ${C.azul}` }}>
          <div style={{ fontSize: 10, color: C.cinzaE, fontWeight: 700 }}>VALOR EM ESTOQUE (CONTADO)</div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 26, fontWeight: 800, color: C.azul }}>{brl(total)}</div>
          <div style={{ fontSize: 12, color: C.cinzaE }}>{its.length - naoContados.length} de {its.length} itens contados · contando como {usuario}</div>
        </div>
        {naoContados.length > 0 && <div style={{ ...card, borderColor: "#B8860B", background: "#FBF3E0", fontSize: 12.5, color: "#7a5a00" }}>
          ⚠ {naoContados.length} item(ns) sem contagem — ficam como zero se você fechar agora: {naoContados.slice(0, 6).map(i => i.nome).join(" · ")}{naoContados.length > 6 ? "…" : ""}
        </div>}
        <div style={{ ...card, padding: 0 }}>
          <div style={{ display: "flex", gap: 8, padding: "6px 14px", background: C.cinzaF, fontSize: 10, fontWeight: 700, color: C.cinzaE }}><span style={{ flex: 1 }}>INSUMO</span><span style={{ width: 90, textAlign: "right" }}>CONTADO</span><span style={{ width: 88, textAlign: "right" }}>VALOR</span></div>
          {its.map((it, i) => (
            <div key={it.ingId} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 14px", borderBottom: i < its.length - 1 ? `1px solid ${C.cinzaF}` : "none", opacity: it.feito ? 1 : .5 }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{it.nome}</span>
              <span style={{ width: 90, textAlign: "right", fontSize: 12.5 }}>{it.feito ? `${it.valor} ${it.embUn || it.un.toLowerCase()}` : "—"}</span>
              <span style={{ width: 88, textAlign: "right", fontSize: 13, fontWeight: 700 }}>{it.feito ? brl(it.valorRS) : "—"}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: C.cinzaE, fontStyle: "italic", margin: "6px 0 20px" }}>Ao fechar, esta contagem vira a base do CMV real deste período e não pode mais ser editada. Fica registrado quem contou e quando.</div>
      </div>
    );
  }
  return null;
}

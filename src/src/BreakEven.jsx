import { useState, useEffect } from "react";

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#0E0E0C;color:#F2EBD8;}
.be-wrap{min-height:100vh;background:#0E0E0C;font-family:'DM Sans',sans-serif;color:#F2EBD8;}
.be-header{display:flex;align-items:center;gap:12px;padding:16px 20px;background:#181818;border-bottom:1px solid #2A2A2A;position:sticky;top:0;z-index:10;}
.be-header-back{background:none;border:none;color:#8FA715;font-size:22px;cursor:pointer;padding:4px 8px;border-radius:6px;}
.be-header-back:hover{background:#8FA71520;}
.be-title{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;color:#F2EBD8;letter-spacing:.04em;}
.be-subtitle{font-size:11px;color:#555;letter-spacing:.1em;text-transform:uppercase;}
.be-body{max-width:960px;margin:0 auto;padding:20px 16px 60px;}
.be-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.be-card{background:#181818;border:1px solid #2A2A2A;border-radius:12px;overflow:hidden;}
.be-card-header{padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2A2A2A;}
.be-card-title{font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.1em;color:#888;}
.be-card-total{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:700;}
.be-row{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #1E1E1E;}
.be-row:last-child{border-bottom:none;}
.be-row-name{flex:1;font-size:13px;color:#D0C9B8;}
.be-input{background:#222;border:1px solid #2A2A2A;border-radius:6px;color:#F2EBD8;padding:6px 10px;font-size:13px;font-family:'Barlow Condensed',sans-serif;font-weight:700;width:100px;text-align:right;outline:none;}
.be-input:focus{border-color:#8FA715;}
.be-input-name{background:#222;border:1px solid #2A2A2A;border-radius:6px;color:#F2EBD8;padding:6px 10px;font-size:13px;flex:1;outline:none;}
.be-input-name:focus{border-color:#8FA715;}
.be-del{background:none;border:none;color:#555;cursor:pointer;font-size:16px;padding:4px;border-radius:4px;flex-shrink:0;}
.be-del:hover{color:#E8614B;background:#E8614B15;}
.be-add{display:flex;align-items:center;gap:6px;padding:10px 14px;color:#8FA715;font-size:12px;font-weight:700;cursor:pointer;background:none;border:none;width:100%;text-align:left;letter-spacing:.04em;}
.be-add:hover{background:#8FA71510;}
.be-results{background:#181818;border:1px solid #2A2A2A;border-radius:12px;overflow:hidden;margin-top:16px;}
.be-result-row{display:flex;justify-content:space-between;align-items:center;padding:13px 18px;border-bottom:1px solid #1E1E1E;}
.be-result-row:last-child{border-bottom:none;}
.be-result-label{font-size:13px;color:#888;}
.be-result-value{font-family:'Barlow Condensed',sans-serif;font-size:17px;font-weight:700;}
.be-result-row.highlight{background:#1C2820;}
.be-result-row.total{background:#0E1A10;padding:16px 18px;}
.be-result-row.total .be-result-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8FA715;}
.be-result-row.total .be-result-value{font-size:22px;}
.be-gauge-wrap{padding:14px 18px;border-bottom:1px solid #1E1E1E;}
.be-gauge-label{display:flex;justify-content:space-between;font-size:11px;color:#555;margin-bottom:6px;}
.be-gauge{height:8px;border-radius:99px;background:#2A2A2A;overflow:hidden;}
.be-gauge-fill{height:100%;border-radius:99px;transition:width .5s;}
.be-scenario{font-size:10px;padding:3px 8px;border-radius:4px;font-weight:700;letter-spacing:.06em;}
.be-params{background:#181818;border:1px solid #2A2A2A;border-radius:12px;padding:16px;margin-top:16px;}
.be-params-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.be-param-label{font-size:10px;font-weight:700;letter-spacing:.08em;color:#555;margin-bottom:5px;}
.be-param-input{background:#222;border:1px solid #2A2A2A;border-radius:7px;color:#F2EBD8;padding:10px 12px;font-size:15px;font-family:'Barlow Condensed',sans-serif;font-weight:700;width:100%;outline:none;}
.be-param-input:focus{border-color:#8FA715;}
.be-client-bar{display:flex;gap:8px;margin-bottom:16px;align-items:center;flex-wrap:wrap;}
.be-client-name{flex:1;min-width:200px;background:#181818;border:1px solid #2A2A2A;border-radius:8px;color:#F2EBD8;padding:11px 14px;font-size:14px;font-family:'Barlow Condensed',sans-serif;font-weight:700;outline:none;letter-spacing:.04em;}
.be-client-name:focus{border-color:#8FA715;}
.be-btn{padding:10px 16px;border-radius:8px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;cursor:pointer;transition:all .15s;}
.be-btn-save{background:#8FA715;border:none;color:#0E0E0C;}
.be-btn-save:hover{background:#a0bb18;}
.be-btn-load{background:transparent;border:1px solid #2A2A2A;color:#888;}
.be-btn-load:hover{border-color:#8FA715;color:#8FA715;}
.be-btn-reset{background:transparent;border:1px solid #E8614B33;color:#E8614B;}
.be-tabs{display:flex;gap:0;border-bottom:1px solid #2A2A2A;background:#181818;overflow-x:auto;}
.be-tab{padding:10px 18px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.08em;cursor:pointer;color:#555;border-bottom:2px solid transparent;white-space:nowrap;}
.be-tab.on{color:#8FA715;border-bottom-color:#8FA715;}
.be-saved-item{display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid #1E1E1E;cursor:pointer;}
.be-saved-item:hover{background:#1C1C1C;}
.be-saved-item:last-child{border-bottom:none;}
@media(max-width:600px){.be-grid{grid-template-columns:1fr;}.be-params-grid{grid-template-columns:1fr;}}
`;

const brl = v => isNaN(v) ? "—" : "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = v => isNaN(v) ? "—" : Number(v).toFixed(1) + "%";
const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_FIXOS = [
  { id: uid(), nome: "Aluguel", valor: 0 },
  { id: uid(), nome: "Folha + encargos", valor: 0 },
  { id: uid(), nome: "Pró-labore", valor: 0 },
  { id: uid(), nome: "Contador / sistemas", valor: 0 },
  { id: uid(), nome: "Energia, água e outros fixos", valor: 0 },
];

const DEFAULT_VARIAVEIS = [
  { id: uid(), nome: "CMV (insumos)", perc: 32 },
  { id: uid(), nome: "Impostos sobre venda", perc: 8 },
  { id: uid(), nome: "Taxa de cartão", perc: 3 },
  { id: uid(), nome: "Delivery (apps)", perc: 0 },
];

const DEFAULT_PARAMS = {
  ticketMedio: 65,
  diasOperacao: 26,
  faturamentoAtual: 0,
  metaLucro: 0,
};

const STORAGE_KEY = "zeste_breakeven_v1";

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveSaved(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

export default function BreakEven({ onBack }) {
  const [tab, setTab] = useState("calc");
  const [clienteNome, setClienteNome] = useState("");
  const [fixos, setFixos] = useState(DEFAULT_FIXOS);
  const [variaveis, setVariaveis] = useState(DEFAULT_VARIAVEIS);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [saved, setSaved] = useState(loadSaved);
  const [flashSaved, setFlashSaved] = useState(false);

  // ── Cálculos ──
  const totalFixo = fixos.reduce((s, x) => s + (+(x.valor) || 0), 0);
  const totalVariPct = variaveis.reduce((s, x) => s + (+(x.perc) || 0), 0);
  const mcPct = 100 - totalVariPct;
  const mc = mcPct / 100;
  const viable = mc > 0;
  const peq = viable ? totalFixo / mc : null;
  const peqEco = viable && params.metaLucro ? (totalFixo + (+params.metaLucro)) / mc : peq;
  const peqDia = peq != null ? peq / (+params.diasOperacao || 26) : null;
  const clientesMes = peq != null ? peq / (+params.ticketMedio || 1) : null;
  const clientesDia = clientesMes != null ? Math.ceil(clientesMes / (+params.diasOperacao || 26)) : null;
  const fat = +(params.faturamentoAtual) || 0;
  const lucro = fat > 0 && viable ? fat * mc - totalFixo : null;
  const margSeg = fat > 0 && peq != null ? (fat - peq) / fat * 100 : null;
  const pctFat = fat > 0 && peq != null ? Math.min(fat / peq * 100, 150) : 0;
  const acimaPE = fat > 0 && peq != null && fat >= peq;

  // ── Handlers ──
  const setFixoVal = (id, k, v) => setFixos(p => p.map(x => x.id === id ? { ...x, [k]: v } : x));
  const setVariVal = (id, k, v) => setVariaveis(p => p.map(x => x.id === id ? { ...x, [k]: v } : x));
  const addFixo = () => setFixos(p => [...p, { id: uid(), nome: "", valor: 0 }]);
  const addVari = () => setVariaveis(p => [...p, { id: uid(), nome: "", perc: 0 }]);
  const delFixo = id => setFixos(p => p.filter(x => x.id !== id));
  const delVari = id => setVariaveis(p => p.filter(x => x.id !== id));
  const setParam = (k, v) => setParams(p => ({ ...p, [k]: v }));

  const saveScenario = () => {
    const scenario = {
      id: uid(), nome: clienteNome || "Sem nome",
      date: new Date().toLocaleDateString("pt-BR"),
      fixos, variaveis, params,
      peq: peq?.toFixed(2), mcPct: mcPct.toFixed(1),
    };
    const list = [scenario, ...saved.filter(s => s.nome !== scenario.nome)].slice(0, 20);
    setSaved(list);
    saveSaved(list);
    setFlashSaved(true);
    setTimeout(() => setFlashSaved(false), 2000);
  };

  const loadScenario = s => {
    setClienteNome(s.nome);
    setFixos(s.fixos);
    setVariaveis(s.variaveis);
    setParams(s.params);
    setTab("calc");
  };

  const delScenario = id => {
    const list = saved.filter(s => s.id !== id);
    setSaved(list);
    saveSaved(list);
  };

  const reset = () => {
    setFixos(DEFAULT_FIXOS.map(x => ({ ...x, id: uid() })));
    setVariaveis(DEFAULT_VARIAVEIS.map(x => ({ ...x, id: uid() })));
    setParams(DEFAULT_PARAMS);
    setClienteNome("");
  };

  return (
    <div className="be-wrap">
      <style>{STYLE}</style>

      {/* HEADER */}
      <div className="be-header">
        <button className="be-header-back" onClick={onBack}>←</button>
        <div>
          <div className="be-title">BREAK-EVEN</div>
          <div className="be-subtitle">Ponto de Equilíbrio · Zeste Consultoria</div>
        </div>
      </div>

      {/* TABS */}
      <div className="be-tabs">
        {[["calc", "📊 Calculadora"], ["saved", `💾 Cenários (${saved.length})`]].map(([id, l]) => (
          <div key={id} className={`be-tab${tab === id ? " on" : ""}`} onClick={() => setTab(id)}>{l}</div>
        ))}
      </div>

      {/* ── SAVED SCENARIOS ── */}
      {tab === "saved" && (
        <div className="be-body">
          <div className="be-card">
            {saved.length === 0 && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#555", fontStyle: "italic" }}>
                Nenhum cenário salvo ainda
              </div>
            )}
            {saved.map(s => (
              <div key={s.id} className="be-saved-item" onClick={() => loadScenario(s)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: "#F2EBD8" }}>{s.nome}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                    PE: {brl(s.peq)} · MC: {s.mcPct}% · {s.date}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); delScenario(s.id); }}
                  style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CALCULADORA ── */}
      {tab === "calc" && (
        <div className="be-body">

          {/* CLIENTE + AÇÕES */}
          <div className="be-client-bar">
            <input className="be-client-name" value={clienteNome}
              onChange={e => setClienteNome(e.target.value)}
              placeholder="Nome do cliente / cenário (ex: 440 Restaurante)" />
            <button className={`be-btn be-btn-save`} onClick={saveScenario}>
              {flashSaved ? "✓ Salvo!" : "💾 Salvar cenário"}
            </button>
            <button className="be-btn be-btn-reset" onClick={reset}>↺ Limpar</button>
          </div>

          <div className="be-grid">
            {/* CUSTOS FIXOS */}
            <div className="be-card">
              <div className="be-card-header">
                <div className="be-card-title">💸 CUSTOS FIXOS</div>
                <div className="be-card-total" style={{ color: "#E8614B" }}>{brl(totalFixo)}<span style={{ fontSize: 10, color: "#555", marginLeft: 4 }}>/mês</span></div>
              </div>
              {fixos.map(x => (
                <div key={x.id} className="be-row">
                  <input className="be-input-name" value={x.nome}
                    onChange={e => setFixoVal(x.id, "nome", e.target.value)}
                    placeholder="Descrição" />
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "#555" }}>R$</span>
                    <input className="be-input" type="number" value={x.valor}
                      onChange={e => setFixoVal(x.id, "valor", e.target.value)}
                      placeholder="0" />
                  </div>
                  <button className="be-del" onClick={() => delFixo(x.id)}>✕</button>
                </div>
              ))}
              <button className="be-add" onClick={addFixo}>+ Adicionar custo fixo</button>
            </div>

            {/* CUSTOS VARIÁVEIS */}
            <div className="be-card">
              <div className="be-card-header">
                <div className="be-card-title">📉 CUSTOS VARIÁVEIS</div>
                <div className="be-card-total" style={{ color: totalVariPct > 60 ? "#E8614B" : "#F59E0B" }}>
                  {pct(totalVariPct)}<span style={{ fontSize: 10, color: "#555", marginLeft: 4 }}>da venda</span>
                </div>
              </div>
              {variaveis.map(x => (
                <div key={x.id} className="be-row">
                  <input className="be-input-name" value={x.nome}
                    onChange={e => setVariVal(x.id, "nome", e.target.value)}
                    placeholder="Descrição" />
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input className="be-input" type="number" value={x.perc}
                      onChange={e => setVariVal(x.id, "perc", e.target.value)}
                      placeholder="0" style={{ width: 70 }} />
                    <span style={{ fontSize: 11, color: "#555" }}>%</span>
                  </div>
                  <button className="be-del" onClick={() => delVari(x.id)}>✕</button>
                </div>
              ))}
              <button className="be-add" onClick={addVari}>+ Adicionar custo variável</button>
              {!viable && (
                <div style={{ padding: "10px 14px", background: "#E8614B15", borderTop: "1px solid #E8614B33", fontSize: 12, color: "#E8614B" }}>
                  ⚠ Custos variáveis ≥ 100% — break-even inexistente.
                </div>
              )}
            </div>
          </div>

          {/* PARÂMETROS */}
          <div className="be-params" style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "#555", marginBottom: 12 }}>⚙️ PARÂMETROS OPERACIONAIS</div>
            <div className="be-params-grid">
              {[
                ["ticketMedio", "Ticket Médio (R$)", "Ex: 65"],
                ["diasOperacao", "Dias de Operação/mês", "Ex: 26"],
                ["faturamentoAtual", "Faturamento Atual (R$)", "Ex: 90000"],
                ["metaLucro", "Meta de Lucro (R$)", "Ex: 5000"],
              ].map(([k, l, ph]) => (
                <div key={k}>
                  <div className="be-param-label">{l}</div>
                  <input className="be-param-input" type="number" value={params[k]}
                    onChange={e => setParam(k, e.target.value)} placeholder={ph} />
                </div>
              ))}
            </div>
          </div>

          {/* RESULTADOS */}
          <div className="be-results" style={{ marginTop: 16 }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #2A2A2A" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "#555" }}>📊 RESULTADOS</div>
            </div>

            {/* Margem de Contribuição */}
            <div className="be-result-row highlight">
              <div className="be-result-label">Margem de Contribuição</div>
              <div className="be-result-value" style={{ color: mcPct >= 40 ? "#8FA715" : mcPct >= 20 ? "#F59E0B" : "#E8614B" }}>
                {pct(mcPct)}
                <span style={{ fontSize: 11, color: "#555", marginLeft: 6 }}>({pct(totalVariPct)} variável)</span>
              </div>
            </div>

            {/* PONTO DE EQUILÍBRIO — destaque */}
            <div className="be-result-row total">
              <div className="be-result-label">🎯 PONTO DE EQUILÍBRIO / MÊS</div>
              <div className="be-result-value" style={{ color: viable ? "#8FA715" : "#E8614B" }}>
                {viable ? brl(peq) : "Inviável"}
              </div>
            </div>

            {params.metaLucro > 0 && viable && (
              <div className="be-result-row">
                <div className="be-result-label">PE Econômico (com meta de lucro)</div>
                <div className="be-result-value" style={{ color: "#1A4F71" }}>{brl(peqEco)}</div>
              </div>
            )}

            <div className="be-result-row">
              <div className="be-result-label">Break-even por dia</div>
              <div className="be-result-value" style={{ color: "#F2EBD8" }}>{viable ? brl(peqDia) : "—"}</div>
            </div>

            <div className="be-result-row">
              <div className="be-result-label">Clientes necessários / mês</div>
              <div className="be-result-value" style={{ color: "#F2EBD8" }}>{clientesMes != null ? Math.ceil(clientesMes).toLocaleString("pt-BR") : "—"}</div>
            </div>

            <div className="be-result-row">
              <div className="be-result-label">Clientes necessários / dia</div>
              <div className="be-result-value" style={{ color: "#F2EBD8" }}>{clientesDia ?? "—"}</div>
            </div>

            {/* Gauge de faturamento vs PE */}
            {fat > 0 && viable && (
              <div className="be-gauge-wrap">
                <div className="be-gauge-label">
                  <span>Faturamento atual vs Break-even</span>
                  <span style={{ color: acimaPE ? "#8FA715" : "#E8614B", fontWeight: 700 }}>
                    {acimaPE ? "✓ Acima do PE" : "⚠ Abaixo do PE"}
                  </span>
                </div>
                <div className="be-gauge">
                  <div className="be-gauge-fill" style={{
                    width: Math.min(pctFat, 100) + "%",
                    background: acimaPE
                      ? "linear-gradient(90deg,#8FA715,#6B9A10)"
                      : "linear-gradient(90deg,#E8614B,#C4502B)"
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555", marginTop: 4 }}>
                  <span>{brl(fat)}</span>
                  <span>PE: {brl(peq)}</span>
                </div>
              </div>
            )}

            {lucro != null && (
              <div className="be-result-row" style={{ background: lucro >= 0 ? "#1C2820" : "#1A0E0E" }}>
                <div className="be-result-label">Lucro no faturamento atual</div>
                <div className="be-result-value" style={{ color: lucro >= 0 ? "#8FA715" : "#E8614B" }}>{brl(lucro)}</div>
              </div>
            )}

            {margSeg != null && (
              <div className="be-result-row">
                <div className="be-result-label">Margem de segurança</div>
                <div className="be-result-value" style={{ color: margSeg >= 20 ? "#8FA715" : margSeg >= 0 ? "#F59E0B" : "#E8614B" }}>
                  {pct(margSeg)}
                  {margSeg >= 20 && <span className="be-scenario" style={{ background: "#8FA71522", color: "#8FA715", marginLeft: 8 }}>SAUDÁVEL</span>}
                  {margSeg >= 0 && margSeg < 20 && <span className="be-scenario" style={{ background: "#F59E0B22", color: "#F59E0B", marginLeft: 8 }}>ATENÇÃO</span>}
                  {margSeg < 0 && <span className="be-scenario" style={{ background: "#E8614B22", color: "#E8614B", marginLeft: 8 }}>CRÍTICO</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

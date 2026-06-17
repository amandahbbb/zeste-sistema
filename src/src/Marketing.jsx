import { useState, useEffect } from "react";

// ── CORES ZESTE ──────────────────────────────────────────────
const C = {
  lima: "#8FA715", verde: "#497A5D", azul: "#1A4F71",
  terra: "#C4502B", off: "#F2EBD8", dark: "#F2EBD8",
  muted: "#888", border: "#2A2A2A", card: "#181818",
  bg: "#0E0E0C", surface: "#181818", faint: "#555",
};

// ── SUPABASE (mock para preview — substituir pelas credenciais reais) ──
const SUPABASE_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${tokenProp||SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "return=representation",
    },
    ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── CAMPOS DE MÉTRICAS ────────────────────────────────────────
const IG_FIELDS = [
  { key: "seguidores", label: "Seguidores", icon: "👥" },
  { key: "novos_seguidores", label: "Novos Seguidores", icon: "➕" },
  { key: "alcance", label: "Contas Alcançadas", icon: "🎯" },
  { key: "visualizacoes", label: "Visualizações", icon: "👁" },
  { key: "interacoes", label: "Interações", icon: "❤️" },
  { key: "visitas_perfil", label: "Visitas ao Perfil", icon: "🏠" },
  { key: "cliques_link", label: "Cliques no Link", icon: "🔗" },
  { key: "publicacoes", label: "Publicações", icon: "📸" },
];

const WA_FIELDS = [
  { key: "msgs_enviadas", label: "Mensagens Enviadas", icon: "📤" },
  { key: "msgs_recebidas", label: "Mensagens Recebidas", icon: "📥" },
  { key: "contatos_novos", label: "Novos Contatos", icon: "➕" },
  { key: "taxa_resposta", label: "Taxa de Resposta (%)", icon: "⚡" },
  { key: "leads_gerados", label: "Leads Gerados", icon: "🎯" },
  { key: "conversoes", label: "Conversões", icon: "✅" },
];

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const ANOS = [2025, 2026, 2027];

// ── DADOS MOCK PARA DEMO ─────────────────────────────────────
const MOCK_HISTORY = [
  { id: 1, rede: "instagram", mes: 3, ano: 2026, seguidores: 2, novos_seguidores: 2, alcance: 4, visualizacoes: 4, interacoes: 0, visitas_perfil: 3, cliques_link: 0, publicacoes: 0, posts: [] },
  { id: 2, rede: "instagram", mes: 4, ano: 2026, seguidores: 4, novos_seguidores: 2, alcance: 40, visualizacoes: 4, interacoes: 2, visitas_perfil: 3, cliques_link: 0, publicacoes: 1, posts: [] },
  { id: 3, rede: "instagram", mes: 5, ano: 2026, seguidores: 93, novos_seguidores: 93, alcance: 1238, visualizacoes: 5972, interacoes: 354, visitas_perfil: 277, cliques_link: 19, publicacoes: 11,
    posts: [
      { titulo: '"Quem tá por trás da Zeste"', tipo: "carrossel", views: 2964, curtidas: 170, comentarios: 47, compartilhamentos: 9 },
      { titulo: '"A Zeste nasceu da vivência"', tipo: "carrossel", views: 1288, curtidas: 39, comentarios: 5, compartilhamentos: 2 },
      { titulo: '"Coisas que só quem vive cozinha entende"', tipo: "reel", views: 738, curtidas: 31, comentarios: 13, compartilhamentos: 4 },
    ]
  },
];

// ── HELPERS ───────────────────────────────────────────────────
const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n ?? 0);
const pct = (a, b) => b === 0 ? null : Math.round(((a - b) / b) * 100);

function Delta({ curr, prev }) {
  if (prev == null) return null;
  const d = pct(curr, prev);
  if (d == null) return null;
  const up = d >= 0;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: up ? C.lima : C.terra, marginLeft: 4 }}>
      {up ? "↑" : "↓"} {Math.abs(d)}%
    </span>
  );
}

// ── MINI SPARKLINE ────────────────────────────────────────────
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 80, h = 30;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * w} cy={h - (v / max) * h} r="2.5" fill={color} />
      ))}
    </svg>
  );
}

// ── BAR CHART ─────────────────────────────────────────────────
function BarChart({ items, color }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 11, color: C.muted, width: 130, flexShrink: 0, textAlign: "right", lineHeight: 1.2 }}>{item.label}</div>
          <div style={{ flex: 1, height: 10, background: "#2A2A2A", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${(item.value / max) * 100}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, fontFamily: "system-ui", width: 44, color: C.dark }}>{fmt(item.value)}</div>
        </div>
      ))}
    </div>
  );
}

// ── INSIGHT IA ────────────────────────────────────────────────
async function gerarInsights(metricas, rede, mesLabel) {
  const prompt = `Você é consultora de marketing digital especializada em gastronomia e pequenos negócios. Analise as métricas de ${rede === "instagram" ? "Instagram" : "WhatsApp Business"} da Zeste Consultoria Gastronômica referentes a ${mesLabel} e gere:
1. 3 insights estratégicos objetivos (máx 2 linhas cada)
2. 3 recomendações práticas para o próximo mês (máx 2 linhas cada)

Métricas: ${JSON.stringify(metricas)}

Responda em JSON com a estrutura:
{"insights": [{"emoji":"...","titulo":"...","texto":"..."}], "recomendacoes": [{"emoji":"...","titulo":"...","texto":"..."}]}
Retorne APENAS o JSON, sem markdown.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function RedesSociais({onBack,token:tokenProp}) {
  const [aba, setAba] = useState("dashboard"); // dashboard | cadastrar | historico
  const [rede, setRede] = useState("instagram");
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await sbFetch("fin_marketing?deleted_at=is.null&order=created_at.desc");
        if (Array.isArray(data) && data.length > 0) {
          setHistory(data.map(r => r.dados || r));
        } else {
          setHistory(MOCK_HISTORY); // seed with demo data
        }
      } catch {
        setHistory(MOCK_HISTORY);
      }
      setLoaded(true);
    })();
  }, []);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsMes, setInsightsMes] = useState(null);

  // form
  const today = new Date();
  const [form, setForm] = useState({
    mes: today.getMonth(), ano: today.getFullYear(),
    ...Object.fromEntries(IG_FIELDS.map(f => [f.key, ""])),
    ...Object.fromEntries(WA_FIELDS.map(f => [f.key, ""])),
    posts: [],
  });
  const [postForm, setPostForm] = useState({ titulo: "", tipo: "carrossel", views: "", curtidas: "", comentarios: "", compartilhamentos: "" });

  const redeFiltrada = history.filter(h => h.rede === rede).sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes);
  const ultimo = redeFiltrada[redeFiltrada.length - 1];
  const penultimo = redeFiltrada[redeFiltrada.length - 2];

  // ── HANDLERS ─────────────────────────────────────────────────
  function addPost() {
    if (!postForm.titulo) return;
    setForm(f => ({ ...f, posts: [...f.posts, { ...postForm }] }));
    setPostForm({ titulo: "", tipo: "carrossel", views: "", curtidas: "", comentarios: "", compartilhamentos: "" });
  }

  function salvar() {
    const novo = { id: Date.now(), rede, ...form };
    setHistory(h => [...h, novo]);
    setAba("dashboard");
    // Em produção: sbFetch("mkt_redes_sociais", { method: "POST", body: JSON.stringify(novo) })
  }

  async function pedirInsights(entry) {
    setLoadingInsights(true);
    setInsights(null);
    setInsightsMes(`${MONTHS[entry.mes]} ${entry.ano}`);
    try {
      const campos = rede === "instagram" ? IG_FIELDS : WA_FIELDS;
      const metricas = Object.fromEntries(campos.map(f => [f.label, entry[f.key]]));
      const result = await gerarInsights(metricas, rede, `${MONTHS[entry.mes]} ${entry.ano}`);
      setInsights(result);
    } catch {
      setInsights({ insights: [{ emoji: "⚠️", titulo: "Erro", texto: "Não foi possível gerar insights. Verifique a conexão com a API." }], recomendacoes: [] });
    }
    setLoadingInsights(false);
    setAba("insights");
  }

  // ── RENDER ────────────────────────────────────────────────────
  const fields = rede === "instagram" ? IG_FIELDS : WA_FIELDS;
  const accentColor = rede === "instagram" ? C.terra : C.verde;

  return (
    <div style={{ fontFamily: "'Nunito Sans', system-ui, sans-serif", background: C.bg, minHeight: "100vh", color: C.dark }}>

      {/* HEADER */}
      <div style={{ background: C.azul, padding: "28px 20px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, background: C.lima, borderRadius: "50%", opacity: 0.1 }} />
        {onBack&&<button onClick={onBack} style={{color:C.lima,fontSize:24,background:"none",border:"none",cursor:"pointer",lineHeight:1,position:"absolute",left:14,top:14,minWidth:40,minHeight:40,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}>‹</button>}
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: C.lima, marginBottom: 6 }}>Marketing · Zeste</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", fontFamily: "system-ui" }}>Redes Sociais</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Relatórios, métricas e insights</div>

        {/* SELETOR REDE */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {[{ id: "instagram", label: "📸 Instagram" }, { id: "whatsapp", label: "💬 WhatsApp" }].map(r => (
            <button key={r.id} onClick={() => { setRede(r.id); setInsights(null); }}
              style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: rede === r.id ? "rgba(255,255,255,0.15)" : "transparent",
                borderColor: rede === r.id ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                color: rede === r.id ? "#fff" : "rgba(255,255,255,0.5)" }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ABAS */}
      <div style={{ display: "flex", background: "#fff", borderBottom: `1px solid ${C.border}` }}>
        {[["dashboard","📊 Dashboard"],["historico","📅 Histórico"],["cadastrar","➕ Cadastrar"],["insights","✨ Insights IA"]].map(([id, label]) => (
          <button key={id} onClick={() => setAba(id)}
            style={{ flex: 1, padding: "12px 4px", fontSize: 11, fontWeight: aba === id ? 800 : 600, border: "none", cursor: "pointer",
              background: "transparent", color: aba === id ? accentColor : C.muted,
              borderBottom: aba === id ? `2px solid ${accentColor}` : "2px solid transparent" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px", maxWidth: 520, margin: "0 auto" }}>

        {/* ── DASHBOARD ── */}
        {aba === "dashboard" && (
          <div>
            {!ultimo ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhum dado cadastrado ainda</div>
                <button onClick={() => setAba("cadastrar")}
                  style={{ marginTop: 12, padding: "8px 20px", background: accentColor, color: "#fff", border: "none", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Cadastrar primeiro relatório
                </button>
              </div>
            ) : (
              <>
                {/* PERÍODO */}
                <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
                  Último mês · {MONTHS[ultimo.mes]} {ultimo.ano}
                </div>

                {/* KPI GRID */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {fields.slice(0, 6).map((f, i) => {
                    const val = ultimo[f.key] ?? 0;
                    const prev = penultimo?.[f.key];
                    const sparkData = redeFiltrada.map(h => h[f.key] ?? 0);
                    return (
                      <div key={f.key} style={{ background: i === 0 ? C.azul : C.card, borderRadius: 14, padding: "14px", border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 16, marginBottom: 6 }}>{f.icon}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? "rgba(255,255,255,0.6)" : C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label}</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "4px 0" }}>
                          <span style={{ fontFamily: "system-ui", fontSize: 26, fontWeight: 900, color: i === 0 ? "#fff" : C.dark }}>{fmt(val)}</span>
                          {prev != null && <Delta curr={val} prev={prev} />}
                        </div>
                        <Sparkline data={sparkData} color={i === 0 ? C.lima : accentColor} />
                      </div>
                    );
                  })}
                </div>

                {/* TOP POSTS (Instagram) */}
                {rede === "instagram" && ultimo.posts?.length > 0 && (
                  <div style={{ background: C.card, borderRadius: 14, padding: "16px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>🏆 Top Posts do Mês</div>
                    <BarChart
                      items={ultimo.posts.map(p => ({ label: p.titulo, value: p.views }))}
                      color={accentColor}
                    />
                  </div>
                )}

                {/* BTN INSIGHTS */}
                <button onClick={() => pedirInsights(ultimo)}
                  style={{ width: "100%", padding: "14px", background: `linear-gradient(135deg, ${C.azul}, ${C.verde})`, color: "#fff", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                  ✨ Gerar Insights com IA · {MONTHS[ultimo.mes]} {ultimo.ano}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── HISTÓRICO ── */}
        {aba === "historico" && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Todos os meses · {rede === "instagram" ? "Instagram" : "WhatsApp"}
            </div>
            {redeFiltrada.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Nenhum dado cadastrado.</div>
            ) : (
              [...redeFiltrada].reverse().map((entry, i) => {
                const prev = redeFiltrada[redeFiltrada.indexOf(entry) - 1];
                const mainField = fields[0];
                const secField = fields[2];
                return (
                  <div key={entry.id} style={{ background: C.card, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{MONTHS[entry.mes]} {entry.ano}</div>
                        <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                          {fields.slice(0, 4).map(f => (
                            <div key={f.key} style={{ fontSize: 11, color: C.muted }}>
                              {f.icon} <span style={{ fontWeight: 800, color: C.dark }}>{fmt(entry[f.key] ?? 0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => pedirInsights(entry)}
                        style={{ padding: "6px 12px", background: C.off, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", color: C.azul, flexShrink: 0 }}>
                        ✨ Insights
                      </button>
                    </div>
                    {prev && (
                      <div style={{ marginTop: 8, padding: "8px 10px", background: "#f9f7f2", borderRadius: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {fields.slice(0, 3).map(f => {
                          const d = pct(entry[f.key] ?? 0, prev[f.key] ?? 0);
                          if (d == null) return null;
                          return (
                            <span key={f.key} style={{ fontSize: 10, color: d >= 0 ? C.verde : C.terra, fontWeight: 700 }}>
                              {f.label}: {d >= 0 ? "↑" : "↓"} {Math.abs(d)}%
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── CADASTRAR ── */}
        {aba === "cadastrar" && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
              Novo Relatório · {rede === "instagram" ? "Instagram" : "WhatsApp"}
            </div>

            {/* MÊS / ANO */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div>
                <div style={labelStyle}>Mês</div>
                <select value={form.mes} onChange={e => setForm(f => ({ ...f, mes: +e.target.value }))} style={inputStyle}>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <div style={labelStyle}>Ano</div>
                <select value={form.ano} onChange={e => setForm(f => ({ ...f, ano: +e.target.value }))} style={inputStyle}>
                  {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* MÉTRICAS */}
            <div style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>📊 Métricas Gerais</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {fields.map(f => (
                  <div key={f.key}>
                    <div style={labelStyle}>{f.icon} {f.label}</div>
                    <input type="number" value={form[f.key]} onChange={e => setForm(fr => ({ ...fr, [f.key]: e.target.value }))}
                      placeholder="0" style={inputStyle} />
                  </div>
                ))}
              </div>
            </div>

            {/* POSTS (apenas Instagram) */}
            {rede === "instagram" && (
              <div style={{ background: C.card, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>📸 Top Posts</div>
                {form.posts.map((p, i) => (
                  <div key={i} style={{ fontSize: 11, padding: "8px 10px", background: C.off, borderRadius: 8, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span><strong>{p.tipo}</strong> · {p.titulo} · {fmt(p.views)} views</span>
                    <button onClick={() => setForm(f => ({ ...f, posts: f.posts.filter((_, j) => j !== i) }))}
                      style={{ background: "none", border: "none", color: C.terra, cursor: "pointer", fontWeight: 800, fontSize: 14 }}>×</button>
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                  <div style={{ gridColumn: "1/-1" }}>
                    <div style={labelStyle}>Título do post</div>
                    <input value={postForm.titulo} onChange={e => setPostForm(p => ({ ...p, titulo: e.target.value }))} placeholder='ex: "Quem tá por trás da Zeste"' style={inputStyle} />
                  </div>
                  <div>
                    <div style={labelStyle}>Tipo</div>
                    <select value={postForm.tipo} onChange={e => setPostForm(p => ({ ...p, tipo: e.target.value }))} style={inputStyle}>
                      {["carrossel","reel","post","story"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={labelStyle}>Views</div>
                    <input type="number" value={postForm.views} onChange={e => setPostForm(p => ({ ...p, views: +e.target.value }))} placeholder="0" style={inputStyle} />
                  </div>
                  <div>
                    <div style={labelStyle}>Curtidas</div>
                    <input type="number" value={postForm.curtidas} onChange={e => setPostForm(p => ({ ...p, curtidas: +e.target.value }))} placeholder="0" style={inputStyle} />
                  </div>
                  <div>
                    <div style={labelStyle}>Comentários</div>
                    <input type="number" value={postForm.comentarios} onChange={e => setPostForm(p => ({ ...p, comentarios: +e.target.value }))} placeholder="0" style={inputStyle} />
                  </div>
                </div>
                <button onClick={addPost}
                  style={{ marginTop: 10, width: "100%", padding: "8px", background: C.off, border: `1px dashed ${C.border}`, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.azul }}>
                  + Adicionar post
                </button>
              </div>
            )}

            <button onClick={salvar}
              style={{ width: "100%", padding: 14, background: accentColor, color: "#fff", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              💾 Salvar Relatório
            </button>
          </div>
        )}

        {/* ── INSIGHTS IA ── */}
        {aba === "insights" && (
          <div>
            {loadingInsights ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 36, marginBottom: 12, animation: "spin 1s linear infinite", display: "inline-block" }}>✨</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.azul }}>Analisando métricas com IA...</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{insightsMes}</div>
                <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
              </div>
            ) : !insights ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Selecione um mês no Dashboard ou Histórico</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>e clique em "Gerar Insights com IA"</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                  ✨ Insights IA · {insightsMes}
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: C.azul, marginBottom: 8 }}>ANÁLISE DO MÊS</div>
                {insights.insights?.map((ins, i) => (
                  <div key={i} style={{ background: C.card, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.border}`, borderLeft: `4px solid ${[C.verde, C.azul, C.terra][i % 3]}`, marginBottom: 10, display: "flex", gap: 10 }}>
                    <div style={{ fontSize: 20, flexShrink: 0 }}>{ins.emoji}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{ins.titulo}</div>
                      <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{ins.texto}</div>
                    </div>
                  </div>
                ))}

                <div style={{ fontSize: 12, fontWeight: 700, color: C.verde, margin: "16px 0 8px" }}>RECOMENDAÇÕES PARA O PRÓXIMO MÊS</div>
                {insights.recomendacoes?.map((rec, i) => (
                  <div key={i} style={{ background: "#f0f7f2", borderRadius: 14, padding: "14px 16px", border: `1px solid #c8e6d4`, borderLeft: `4px solid ${C.verde}`, marginBottom: 10, display: "flex", gap: 10 }}>
                    <div style={{ fontSize: 20, flexShrink: 0 }}>{rec.emoji}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{rec.titulo}</div>
                      <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{rec.texto}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const labelStyle = { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 };
const inputStyle = { width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: "inherit", background: "#fdfbf7", outline: "none", boxSizing: "border-box" };

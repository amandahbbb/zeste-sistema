// Antonio font loaded in useEffect
import { useState, useEffect, useRef } from "react";

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

// ── GERADOR DE POSTS ──────────────────────────────────────────────
const TIPOS_POST = [
  ["educativo","💡 Educativo / Dica"],
  ["case","📌 Case de cliente"],
  ["bastidores","🎬 Bastidores"],
  ["reflexao","🧠 Reflexão / Conceito"],
  ["convite","📣 Convite / CTA"],
  ["xeh","✍️ Formato 'X é:'"],
];
const TONS_POST = [
  ["editorial","Editorial (Swiss Style, implícito)"],
  ["proximo","Próximo / acolhedor"],
  ["autoridade","Autoridade técnica"],
  ["provocativo","Provocativo / questionador"],
];
const HASHTAGS_DEFAULT = "#zesteconsultoria #gastronomia #gestaodecozinha";

function PostGenerator(){
  const [tema, setTema]       = useState("");
  const [contexto, setCtx]    = useState("");
  const [tipo, setTipo]       = useState("educativo");
  const [tom, setTom]         = useState("editorial");
  const [cor, setCor]         = useState("8FA715");
  const [label, setLabel]     = useState("ZESTE");
  const [gerando, setGerando] = useState(false);
  const [erro, setErro]       = useState("");
  const [variacao, setVariacao] = useState(0); // 0 = principal, 1 = variação

  // Campos editáveis — preenchidos pelo usuário ou pela IA
  const [titulo, setTitulo]     = useState("Diagnóstico operacional");
  const [subtitulo, setSubtitulo] = useState("Mapeamos cada etapa antes de propor qualquer mudança.");
  const [legenda, setLegenda]   = useState("");
  const [hashtags, setHashtags] = useState(HASHTAGS_DEFAULT);
  const [varTitulo, setVarTitulo]   = useState("");
  const [varLegenda, setVarLegenda] = useState("");

  const [copied, setCopied]   = useState(false);
  const [downloading, setDl]  = useState(false);
  const postRef = useRef(null);

  useEffect(()=>{
    if(!document.querySelector('link[href*="Antonio"]')){
      const l=document.createElement('link');l.rel='stylesheet';
      l.href='https://fonts.googleapis.com/css2?family=Antonio:wght@400;600;700&display=swap';
      document.head.appendChild(l);
    }
    if(!window.html2canvas){
      const s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      document.head.appendChild(s);
    }
  },[]);

  const gerarComIA = async () => {
    if(!tema.trim()){setErro("Digite um tema ou conceito primeiro.");return;}
    setGerando(true); setErro("");
    try{
      const res = await fetch("/.netlify/functions/generate-post",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({tema,tipo,tom,contexto})
      });
      const data = await res.json();
      if(data.error){setErro(data.error);return;}
      if(data.titulo)    setTitulo(data.titulo);
      if(data.subtitulo) setSubtitulo(data.subtitulo);
      if(data.legenda)   setLegenda(data.legenda);
      if(data.hashtags)  setHashtags(data.hashtags);
      if(data.variacao_titulo)  setVarTitulo(data.variacao_titulo);
      if(data.variacao_legenda) setVarLegenda(data.variacao_legenda);
      setVariacao(0);
    }catch(e){setErro("Erro de conexão. Verifique a configuração da API.");}
    finally{setGerando(false);}
  };

  const tituloAtivo  = variacao===0 ? titulo  : (varTitulo||titulo);
  const legendaAtiva = variacao===0 ? legenda : (varLegenda||legenda);
  const acento = "#"+cor;

  const copiar = () => {
    navigator.clipboard.writeText(legendaAtiva+"\n\n"+hashtags);
    setCopied(true); setTimeout(()=>setCopied(false),1500);
  };

  const baixar = () => {
    if(!window.html2canvas||!postRef.current) return;
    setDl(true);
    window.html2canvas(postRef.current,{scale:3,useCORS:true})
      .then(canvas=>{const a=document.createElement("a");a.download="post-zeste.png";a.href=canvas.toDataURL();a.click();})
      .finally(()=>setDl(false));
  };

  const inp  = {width:"100%",border:"1px solid #D9D7CD",borderRadius:7,padding:"8px 10px",fontFamily:"inherit",fontSize:13,background:"#FCFBF9",color:"#1B1B1B",marginTop:4};
  const lbl  = {fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"#888",display:"block",marginTop:14};
  const btnP = (bg,fg)=>({padding:"10px 16px",borderRadius:8,border:"1px solid "+bg,background:bg,color:fg,fontWeight:700,fontSize:13,cursor:"pointer"});

  return(
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:20,alignItems:"start"}}>

      {/* ── PAINEL ESQUERDO ── */}
      <div style={{background:"#fff",border:"1px solid #E3E1D9",borderRadius:12,padding:18}}>

        {/* TEMA LIVRE */}
        <div style={{background:"#F0F7E6",borderRadius:10,padding:"12px 14px",marginBottom:6}}>
          <span style={{...lbl,marginTop:0,color:"#497A5D"}}>✍️ TEMA / CONCEITO</span>
          <textarea style={{...inp,resize:"vertical",background:"#fff"}} rows={3}
            value={tema} onChange={e=>setTema(e.target.value)}
            placeholder="ex: o silêncio que um cardápio mal formatado gera na operação"/>
          <span style={lbl}>Contexto adicional (opcional)</span>
          <input style={inp} value={contexto} onChange={e=>setCtx(e.target.value)}
            placeholder="ex: para donos de restaurante em expansão"/>
        </div>

        <span style={lbl}>Tipo de post</span>
        <select style={inp} value={tipo} onChange={e=>setTipo(e.target.value)}>
          {TIPOS_POST.map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>

        <span style={lbl}>Tom editorial</span>
        <select style={inp} value={tom} onChange={e=>setTom(e.target.value)}>
          {TONS_POST.map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>

        <span style={lbl}>Cor de destaque</span>
        <select style={inp} value={cor} onChange={e=>setCor(e.target.value)}>
          {[["8FA715","Lima (Verde Zeste)"],["C4502B","Terracota"],["1A4F71","Azul aço"],["497A5D","Verde floresta"],["F2EBD8","Off-white"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>

        <span style={lbl}>Label de seção</span>
        <input style={inp} value={label} onChange={e=>setLabel(e.target.value)} placeholder="ex: O PROJETO"/>

        {/* BOTÃO IA */}
        <button onClick={gerarComIA} disabled={gerando}
          style={{...btnP("#8FA715","#0E0E0C"),width:"100%",marginTop:14,fontSize:14,
            background:gerando?"#6B7A10":"#8FA715"}}>
          {gerando?"✦ Gerando com IA…":"✦ Gerar com IA"}
        </button>

        {erro&&<div style={{marginTop:8,padding:"8px 10px",background:"#FEE2E2",borderRadius:7,fontSize:12,color:"#991B1B"}}>{erro}</div>}

        <button onClick={baixar} disabled={downloading}
          style={{...btnP("transparent","#555"),border:"1px solid #D9D7CD",width:"100%",marginTop:8,fontSize:12}}>
          {downloading?"Gerando…":"⤓ Baixar imagem PNG"}
        </button>
      </div>

      {/* ── PAINEL DIREITO ── */}
      <div>
        {/* PREVIEW DO POST */}
        <div style={{display:"flex",justifyContent:"center",background:"#EDEBE3",borderRadius:12,padding:28,marginBottom:16}}>
          <div ref={postRef} style={{width:360,height:360,background:"#1B1B1B",position:"relative",overflow:"hidden",flexShrink:0}}>
            <div style={{position:"absolute",left:28,top:110,width:40,height:3,background:acento}}/>
            <div style={{position:"absolute",left:28,top:122,fontSize:11,fontWeight:700,letterSpacing:"1.5px",color:acento}}>{label}</div>
            <div style={{position:"absolute",left:28,top:156,right:28,fontFamily:"'Antonio','Helvetica Neue',Helvetica,Arial,sans-serif",fontWeight:600,fontSize:26,color:"#fff",lineHeight:1.2}}>{tituloAtivo}</div>
            <div style={{position:"absolute",left:28,top:240,right:28,fontSize:13,color:"#888",lineHeight:1.5}}>{subtitulo}</div>
            <div style={{position:"absolute",left:28,bottom:18,fontSize:10,color:acento,letterSpacing:"0.5px",fontWeight:600}}>zeste consultoria gastronômica</div>
          </div>
        </div>

        {/* CAMPOS EDITÁVEIS */}
        <div style={{background:"#fff",border:"1px solid #E3E1D9",borderRadius:12,padding:18}}>

          {/* VARIAÇÕES */}
          {varTitulo&&<div style={{display:"flex",gap:8,marginBottom:14}}>
            {[["Principal",0],["Variação IA",1]].map(([l,i])=>(
              <button key={i} onClick={()=>setVariacao(i)}
                style={{padding:"5px 14px",borderRadius:20,border:"1.5px solid "+(variacao===i?"#8FA715":"#D9D7CD"),
                  background:variacao===i?"#8FA715":"transparent",color:variacao===i?"#0E0E0C":"#888",
                  fontSize:11,fontWeight:700,cursor:"pointer"}}>
                {l}
              </button>
            ))}
          </div>}

          {/* TÍTULO */}
          <span style={lbl}>Título do post</span>
          <input style={inp} value={variacao===0?titulo:varTitulo}
            onChange={e=>variacao===0?setTitulo(e.target.value):setVarTitulo(e.target.value)}/>

          <span style={lbl}>Subtítulo (aparece no post visual)</span>
          <input style={inp} value={subtitulo} onChange={e=>setSubtitulo(e.target.value)}/>

          <span style={lbl}>Legenda Instagram</span>
          <textarea style={{...inp,resize:"vertical"}} rows={6}
            value={variacao===0?legenda:varLegenda}
            onChange={e=>variacao===0?setLegenda(e.target.value):setVarLegenda(e.target.value)}
            placeholder="A legenda vai aparecer aqui após gerar com IA, ou escreva livremente..."/>

          <span style={lbl}>Hashtags</span>
          <input style={inp} value={hashtags} onChange={e=>setHashtags(e.target.value)}/>

          <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
            <button onClick={copiar}
              style={{...btnP(copied?"#8FA715":"transparent",copied?"#0E0E0C":"#555"),
                border:"1px solid "+(copied?"#8FA715":"#D9D7CD"),padding:"7px 14px",fontSize:12}}>
              {copied?"✓ Copiado!":"📋 Copiar legenda + hashtags"}
            </button>
            <button onClick={()=>{
              const d={tipo,tom,label,titulo:tituloAtivo,subtitulo,legenda:legendaAtiva,hashtags};
              const b=new Blob([JSON.stringify(d,null,2)],{type:"application/json"});
              const u=URL.createObjectURL(b);const a=document.createElement("a");
              a.download="post-zeste.json";a.href=u;a.click();URL.revokeObjectURL(u);
            }} style={{...btnP("transparent","#555"),border:"1px solid #D9D7CD",padding:"7px 14px",fontSize:12}}>
              ⤓ Exportar JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

      {/* HEADER — padrão Financeiro */}
      <div style={{background:'#0E0E0C',position:'sticky',top:0,zIndex:300,borderBottom:'1px solid #2A2A2A'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {onBack&&<button onClick={onBack} style={{color:'#8FA715',fontSize:24,padding:'0 6px 0 0',lineHeight:1,minWidth:36,minHeight:36,display:'flex',alignItems:'center',background:'none',border:'none',cursor:'pointer'}}>‹</button>}
            <div style={{display:'flex',alignItems:'baseline',gap:7}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:'#8FA715',letterSpacing:'.06em'}}>ZESTE</span>
              <span style={{fontSize:9,color:'#555',letterSpacing:'.14em'}}>MARKETING</span>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {/* SELETOR REDE */}
            {[{ id: "instagram", label: "📸 Instagram" }, { id: "whatsapp", label: "💬 WhatsApp" }].map(r => (
              <button key={r.id} onClick={() => { setRede(r.id); setInsights(null); }}
                style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid", fontSize: 11, fontWeight: 700, cursor: "pointer", background: "none",
                  borderColor: rede === r.id ? "#8FA715" : "#2A2A2A",
                  color: rede === r.id ? "#8FA715" : "#555" }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ABAS */}
      <div style={{ display: "flex", background: "#0E0E0C", borderBottom: "1px solid #2A2A2A", overflowX: "auto" }}>
        {[["dashboard","📊 Dashboard"],["historico","📅 Histórico"],["cadastrar","➕ Cadastrar"],["insights","✨ Insights IA"],["posts","🎨 Posts"]].map(([id, label]) => (
          <button key={id} onClick={() => setAba(id)}
            style={{ flex: 1, padding: "12px 8px", fontSize: 11, fontWeight: aba === id ? 800 : 600, border: "none", cursor: "pointer",
              background: "transparent", color: aba === id ? "#8FA715" : "#555",
              borderBottom: aba === id ? "2px solid #8FA715" : "2px solid transparent",
              whiteSpace: "nowrap", letterSpacing: ".04em", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px", maxWidth: 520, margin: "0 auto" }}>

        {/* ── GERADOR DE POSTS ── */}
        {aba === "posts" && <PostGenerator />}

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

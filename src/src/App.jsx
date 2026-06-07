import { useState, useEffect, createContext, useContext, useCallback } from "react";
import Financeiro from "./Financeiro.jsx";
import Fichas from "./Fichas.jsx";
import Comercial from "./Comercial.jsx";
import RedesSociais from "./Marketing.jsx";
import PortalCliente from "./PortalCliente.jsx";

// ── SUPABASE ──────────────────────────────────────────────────────
const SUPABASE_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";

function createClient(url, key) {
  const h = { "apikey": key, "Content-Type": "application/json" };
  const ah = t => ({ ...h, "Authorization": `Bearer ${t || key}` });
  return {
    auth: {
      signIn: async (email, pw) => { const r = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: "POST", headers: h, body: JSON.stringify({ email, password: pw }) }); return r.json(); },
      signOut: async t => { await fetch(`${url}/auth/v1/logout`, { method: "POST", headers: ah(t) }); },
    },
    from: table => ({
      select: async (cols = "*", t) => { const r = await fetch(`${url}/rest/v1/${table}?select=${cols}&order=created_at.desc`, { headers: ah(t) }); return r.json(); },
      insert: async (data, t) => { const r = await fetch(`${url}/rest/v1/${table}`, { method: "POST", headers: { ...ah(t), "Prefer": "return=representation" }, body: JSON.stringify(data) }); return r.json(); },
      delete: async (id, t) => { await fetch(`${url}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: ah(t) }); },
    })
  };
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// ── ESTILOS GLOBAIS ───────────────────────────────────────────────
const GLOBAL_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800&family=Barlow:wght@400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
html, body, #root { height: 100%; }
body { font-family: 'Barlow', sans-serif; background: #0F0F0F; color: #E8E0CC; overflow-x: hidden; }
input, select, textarea, button { font-family: inherit; }
input, select, textarea { font-size: 16px; border: 1.5px solid #2A2A2A; border-radius: 8px; padding: 11px 13px; background: #1e1e1e; color: #E8E0CC; outline: none; width: 100%; -webkit-appearance: none; appearance: none; transition: border-color .15s; }
input:focus, select:focus, textarea:focus { border-color: #1A4F71; }
button { cursor: pointer; border: none; background: none; }
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
select option { background: #181818; }

/* ── LAYOUT ── */
.app-shell { display: flex; min-height: 100vh; background: #0F0F0F; }
.app-main { flex: 1; min-width: 0; overflow-y: auto; }

/* ── SIDEBAR (desktop) ── */
.sidebar { width: 200px; flex-shrink: 0; background: #181818; border-right: 1px solid #2A2A2A; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow: hidden; transition: width .2s ease; }
.sidebar.collapsed { width: 56px; }
.sidebar-logo { padding: 18px 16px; border-bottom: 1px solid #2A2A2A; display: flex; align-items: center; justify-content: space-between; }
.sidebar.collapsed .sidebar-logo { justify-content: center; padding: 16px 0; }
.sidebar-nav { flex: 1; padding: 8px 0; overflow-y: auto; }
.nav-btn { display: flex; align-items: center; gap: 10px; width: 100%; background: none; border: none; padding: 12px 16px; cursor: pointer; border-left: 3px solid transparent; transition: background .1s; min-height: 44px; }
.sidebar.collapsed .nav-btn { justify-content: center; gap: 0; padding: 12px 0; }
.nav-btn.active { background: rgba(143,167,21,.12); border-left-color: #8FA715; }
.nav-btn-label { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: .04em; color: #E8E0CC; white-space: nowrap; }
.nav-btn.active .nav-btn-label { color: #8FA715; }
.sidebar-user { padding: 12px 16px; border-top: 1px solid #2A2A2A; display: flex; align-items: center; gap: 8px; }
.sidebar.collapsed .sidebar-user { justify-content: center; padding: 12px 0; }
.avatar { width: 30px; height: 30px; border-radius: 50%; background: rgba(143,167,21,.2); border: 1px solid rgba(143,167,21,.4); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #8FA715; flex-shrink: 0; }

/* ── TOP BAR (mobile) ── */
.top-bar { display: none; background: #181818; border-bottom: 1px solid #2A2A2A; padding: 0 16px; height: 52px; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
.top-bar-title { font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 800; color: #E8E0CC; letter-spacing: .06em; }
.hamburger { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #222; }

/* ── DRAWER (mobile menu) ── */
.drawer-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 200; }
.drawer-overlay.open { display: block; }
.drawer { position: fixed; left: 0; top: 0; bottom: 0; width: 240px; background: #181818; z-index: 201; transform: translateX(-100%); transition: transform .25s ease; padding: 0; overflow-y: auto; }
.drawer.open { transform: translateX(0); }
.drawer-header { padding: 20px 16px 14px; border-bottom: 1px solid #2A2A2A; }
.drawer-nav-btn { display: flex; align-items: center; gap: 12px; width: 100%; background: none; border: none; padding: 14px 20px; cursor: pointer; border-left: 3px solid transparent; min-height: 52px; transition: background .1s; }
.drawer-nav-btn.active { background: rgba(143,167,21,.12); border-left-color: #8FA715; }
.drawer-nav-label { font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 600; color: #E8E0CC; }
.drawer-nav-btn.active .drawer-nav-label { color: #8FA715; }

/* ── BOTTOM NAV (mobile) ── */
.bottom-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: #181818; border-top: 1px solid #2A2A2A; z-index: 100; padding-bottom: env(safe-area-inset-bottom, 0px); }
.bottom-nav-inner { display: flex; }
.bottom-nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 4px 6px; min-height: 52px; gap: 3px; border: none; background: none; cursor: pointer; }
.bottom-nav-icon { font-size: 20px; line-height: 1; }
.bottom-nav-label { font-family: 'Barlow Condensed', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #555; }
.bottom-nav-btn.active .bottom-nav-label { color: #8FA715; }
.bottom-nav-btn.active .bottom-nav-icon { filter: drop-shadow(0 0 4px rgba(143,167,21,.6)); }

/* ── PAGE ── */
.page-content { padding: 24px; padding-bottom: 80px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #2A2A2A; }
.page-title { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 800; color: #F2EBD8; letter-spacing: .04em; margin: 0; }
.page-sub { font-size: 12px; color: #666; margin-top: 2px; }

/* ── CARDS ── */
.card { background: #181818; border: 1px solid #2A2A2A; border-radius: 8px; padding: 16px; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.kpi-card { background: #181818; border: 1px solid #2A2A2A; border-radius: 8px; padding: 14px; border-left-width: 3px; }
.kpi-label { font-size: 10px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: #666; margin-bottom: 4px; }
.kpi-value { font-family: 'Barlow Condensed', sans-serif; font-size: 26px; font-weight: 800; line-height: 1; }

/* ── CRM KANBAN ── */
.kanban { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.kanban-col-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.kanban-card { background: #181818; border: 1px solid #2A2A2A; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; }
.tag { display: inline-block; background: #22222222; border-radius: 4px; padding: 2px 8px; font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }

/* ── INPUTS / FORMS ── */
.input-dark { background: #1e1e1e; border: 1px solid #2A2A2A; border-radius: 6px; color: #E8E0CC; padding: 10px 13px; width: 100%; outline: none; }
.label-dark { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #666; margin-bottom: 4px; display: block; }
.btn-primary { background: #8FA715; color: #0F0F0F; border: none; border-radius: 6px; padding: 11px 20px; font-weight: 700; font-size: 13px; letter-spacing: .07em; text-transform: uppercase; cursor: pointer; }
.btn-ghost { background: #2A2A2A; color: #888; border: none; border-radius: 6px; padding: 11px 16px; font-weight: 700; font-size: 13px; cursor: pointer; }

/* ── FORM ADD CLIENTE ── */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.form-full { grid-column: 1 / -1; }

/* ── PLACEHOLDER ── */
.placeholder { display: flex; align-items: center; justify-content: center; min-height: 400px; padding: 24px; }
.placeholder-inner { text-align: center; max-width: 320px; }
.placeholder-icon { font-size: 48px; margin-bottom: 16px; }
.placeholder-title { font-family: 'Barlow Condensed', sans-serif; font-size: 24px; font-weight: 800; color: #F2EBD8; margin-bottom: 8px; }
.placeholder-desc { font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 16px; }

/* ── LOGIN ── */
.login-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; background: #0F0F0F; }
.login-box { width: 100%; max-width: 340px; }
.login-card { background: #181818; border: 1px solid #2A2A2A; border-radius: 10px; padding: 24px; margin-top: 24px; }
.login-footer { font-size: 11px; color: #555; text-align: center; margin-top: 16px; }
.error-msg { font-size: 12px; color: #C4502B; margin-bottom: 12px; }

/* ── MOBILE BREAKPOINT ── */
@media (max-width: 767px) {
  .sidebar { display: none; }
  .top-bar { display: flex; }
  .bottom-nav { display: block; }
  .app-main { padding-bottom: 0; }
  .page-content { padding: 16px; padding-bottom: 80px; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .kanban { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .page-title { font-size: 22px; }
}
@media (min-width: 768px) and (max-width: 1023px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .kanban { grid-template-columns: repeat(3, 1fr); }
}
`;

// ── LOGO SVG ────────────────────────────────────────────────────
function Logo({ small }) {
  const s = small ? 26 : 38;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={s} height={s * 1.3} viewBox="0 0 44 56" fill="none">
        <ellipse cx="22" cy="28" rx="19" ry="26" stroke="#8FA715" strokeWidth="2" />
        <path d="M16 16 Q21 13 26 17 Q30 21 26 27 Q22 32 18 37 Q15 41 20 44 Q24 46 28 43" stroke="#8FA715" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="20" cy="13" rx="3.5" ry="2" stroke="#8FA715" strokeWidth="1.4" fill="none" transform="rotate(-20 20 13)" />
      </svg>
      <div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: small ? 15 : 20, fontWeight: 800, letterSpacing: ".1em", color: "#F2EBD8" }}>ZESTE</div>
        {!small && <div style={{ fontSize: 9, color: "#555", letterSpacing: ".1em" }}>SISTEMA UNIFICADO</div>}
      </div>
    </div>
  );
}

// ── MÓDULOS ────────────────────────────────────────────────────
const MODULOS = [
  { id: "dashboard",  icon: "📊", label: "Dashboard"  },
  { id: "comercial",  icon: "🤝", label: "Comercial"  },
  { id: "financeiro", icon: "💰", label: "Financeiro"  },
  { id: "fichas",     icon: "🍽️", label: "Fichas"      },
  { id: "drive",      icon: "📁", label: "Drive"       },
  { id: "marketing",  icon: "📱", label: "Marketing"   },
];

// ── SIDEBAR DESKTOP ─────────────────────────────────────────────
function Sidebar({ modulo, setModulo, user, onLogout, collapsed, setCollapsed }) {
  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="sidebar-logo">
        {!collapsed && <Logo small />}
        {collapsed && (
          <svg width="22" height="28" viewBox="0 0 44 56" fill="none">
            <ellipse cx="22" cy="28" rx="19" ry="26" stroke="#8FA715" strokeWidth="2.5" />
            <path d="M16 16 Q21 13 26 17 Q30 21 26 27 Q22 32 18 37 Q15 41 20 44 Q24 46 28 43" stroke="#8FA715" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{ color: "#555", fontSize: 14, padding: 4, marginLeft: collapsed ? 0 : 4 }}>
          {collapsed ? "›" : "‹"}
        </button>
      </div>
      <nav className="sidebar-nav">
        {MODULOS.map(m => (
          <button key={m.id} className={`nav-btn${modulo === m.id ? " active" : ""}`} onClick={() => setModulo(m.id)}>
            <span style={{ fontSize: 16 }}>{m.icon}</span>
            {!collapsed && <span className="nav-btn-label">{m.label}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="avatar">{user?.email?.[0]?.toUpperCase() || "Z"}</div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#F2EBD8", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email?.split("@")[0]}</div>
            <button onClick={onLogout} style={{ fontSize: 10, color: "#555", padding: 0, letterSpacing: ".06em", textTransform: "uppercase" }}>Sair</button>
          </div>
        )}
      </div>
    </aside>
  );
}

// ── TOP BAR MOBILE ──────────────────────────────────────────────
function TopBar({ modulo, onMenu }) {
  const m = MODULOS.find(x => x.id === modulo);
  return (
    <div className="top-bar">
      <button className="hamburger" onClick={onMenu}>
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
          <rect width="18" height="2" rx="1" fill="#888" />
          <rect y="6" width="18" height="2" rx="1" fill="#888" />
          <rect y="12" width="18" height="2" rx="1" fill="#888" />
        </svg>
      </button>
      <div className="top-bar-title">{m?.icon} {m?.label}</div>
      <div style={{ width: 36 }} />
    </div>
  );
}

// ── DRAWER MOBILE ───────────────────────────────────────────────
function Drawer({ open, onClose, modulo, setModulo, user, onLogout }) {
  return (
    <>
      <div className={`drawer-overlay${open ? " open" : ""}`} onClick={onClose} />
      <div className={`drawer${open ? " open" : ""}`}>
        <div className="drawer-header">
          <Logo small />
          <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>{user?.email}</div>
        </div>
        {MODULOS.map(m => (
          <button key={m.id} className={`drawer-nav-btn${modulo === m.id ? " active" : ""}`}
            onClick={() => { setModulo(m.id); onClose(); }}>
            <span style={{ fontSize: 20 }}>{m.icon}</span>
            <span className="drawer-nav-label">{m.label}</span>
          </button>
        ))}
        <button onClick={() => { onLogout(); onClose(); }}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 20px", color: "#C4502B", fontSize: 14, fontWeight: 600, borderTop: "1px solid #2A2A2A", marginTop: 8 }}>
          <span>🚪</span> Sair
        </button>
      </div>
    </>
  );
}

// ── BOTTOM NAV MOBILE ───────────────────────────────────────────
const BOTTOM_MODS = MODULOS.slice(0, 5); // primeiros 5
function BottomNav({ modulo, setModulo }) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {BOTTOM_MODS.map(m => (
          <button key={m.id} className={`bottom-nav-btn${modulo === m.id ? " active" : ""}`} onClick={() => setModulo(m.id)}>
            <span className="bottom-nav-icon">{m.icon}</span>
            <span className="bottom-nav-label">{m.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ── LOGIN ────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoad] = useState(false);
  const login = async () => {
    if (!email || !senha) return;
    setLoad(true); setErr("");
    // 1. Tenta Supabase Auth (admin)
    const data = await db.auth.signIn(email, senha);
    if (data.access_token) {
      onLogin({ role: "admin", token: data.access_token, user: data.user });
      return;
    }
    // 2. Tenta portal do cliente
    try {
      const r = await fetch(SUPABASE_URL + "/rest/v1/fin_portal_clientes?email=eq." + encodeURIComponent(email) + "&senha_hash=eq." + encodeURIComponent(senha) + "&ativo=eq.true&select=*", { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY } });
      const clients = await r.json();
      if (Array.isArray(clients) && clients.length > 0) {
        onLogin({ role: "cliente", token: SUPABASE_KEY, user: { email }, clienteInfo: clients[0] });
        return;
      }
    } catch {}
    setErr("E-mail ou senha incorretos");
    setLoad(false);
  };
  return (
    <div className="login-wrap">
      <div className="login-box">
        <Logo />
        <div className="login-card">
          <div style={{ marginBottom: 14 }}>
            <label className="label-dark">E-mail</label>
            <input className="input-dark" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="label-dark">Senha</label>
            <input className="input-dark" type="password" placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
          </div>
          {err && <div className="error-msg">{err}</div>}
          <button className="btn-primary" style={{ width: "100%" }} onClick={login} disabled={loading}>
            {loading ? "ENTRANDO…" : "ENTRAR"}
          </button>
        </div>
        <div className="login-footer">Zeste Consultoria Gastronômica · Sistema Interno</div>
      </div>
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────────────────
function Dashboard() {
  const { token } = useApp();
  const [d, setD] = useState({ clientes:[], lancs:[], ings:[], pratos:[], loading:true });
  const mes = new Date().toISOString().slice(0, 7);
  const brl = v => v==null||isNaN(v)?'—':'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const pct = v => v==null||isNaN(v)?'—':(v*100).toFixed(1)+'%';

  useEffect(() => {
    (async () => {
      const [cl, ln, ig, pr] = await Promise.all([
        db.from("clientes").select("id,nome,status,created_at", token),
        fetch(SUPABASE_URL+"/rest/v1/fin_lancamentos?deleted_at=is.null&order=created_at.desc",{headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+(token||SUPABASE_KEY)}}).then(r=>r.json()).catch(()=>[]),
        fetch(SUPABASE_URL+"/rest/v1/fin_ingredientes?order=created_at.desc",{headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+(token||SUPABASE_KEY)}}).then(r=>r.json()).catch(()=>[]),
        fetch(SUPABASE_URL+"/rest/v1/fin_pratos?deleted_at=is.null&order=created_at.desc",{headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+(token||SUPABASE_KEY)}}).then(r=>r.json()).catch(()=>[]),
      ]);
      setD({
        clientes: Array.isArray(cl)?cl:[],
        lancs: Array.isArray(ln)?ln.map(r=>r.dados||r):[],
        ings: Array.isArray(ig)?ig.map(r=>r.dados||r):[],
        pratos: Array.isArray(pr)?pr.map(r=>r.dados||r):[],
        loading: false
      });
    })();
  }, []);

  if(d.loading) return <div className="page-content"><div style={{textAlign:'center',padding:60,color:'#555'}}>Carregando dashboard…</div></div>;

  // Financial calcs
  const lancsMes = d.lancs.filter(l=>(l.dataDoc||'').startsWith(mes));
  const recMes = lancsMes.filter(l=>l.tipo==='RECEITA').reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0);
  const desMes = lancsMes.filter(l=>l.tipo==='DESPESA').reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0);
  const resultado = recMes - desMes;
  const reembolsos = d.lancs.filter(l=>l.reembolso==='PENDENTE');
  const reembTotal = reembolsos.reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0);
  const aReceber = d.lancs.filter(l=>l.tipo==='RECEITA'&&l.status==='A RECEBER');
  const aReceberTotal = aReceber.reduce((s,l)=>s+(+(l.vlrBruto||0)),0);
  const previstos = d.lancs.filter(l=>l.tipo==='DESPESA'&&l.status==='PREVISTO');
  const cartaoDesp = d.lancs.filter(l=>l.tipo==='DESPESA'&&l.cartaoNome&&(l.dataDoc||'').startsWith(mes));

  // CMV calcs  
  const pratosComPreco = d.pratos.filter(p=>p.precoVenda>0);
  const cmvMedio = pratosComPreco.length>0?pratosComPreco.reduce((s,p)=>{const ct=(p.componentes||[]).reduce((a,c)=>a+((Number(c.qtdGramas)||0)/1000)*(c.custoPorKg||0),0);return s+(p.precoVenda>0?ct/p.precoVenda:0);},0)/pratosComPreco.length:0;

  // Stock alerts
  const estoqueBaixo = d.ings.filter(i=>i.estoqueMin>0&&(i.estoque||0)<i.estoqueMin);

  // CRM
  const clAtivos = d.clientes.filter(c=>c.status==='Ativo').length;
  const clLeads = d.clientes.filter(c=>c.status==='Lead').length;

  // Top despesas
  const topDesp = lancsMes.filter(l=>l.tipo==='DESPESA').sort((a,b)=>(+(b.vlrPago||b.vlrBruto)||0)-(+(a.vlrPago||a.vlrBruto)||0)).slice(0,5);

  // Last 3 months comparison
  const meses3 = [0,1,2].map(i=>{const d2=new Date();d2.setMonth(d2.getMonth()-i);return d2.toISOString().slice(0,7);}).reverse();
  const mesesData = meses3.map(m=>{const ml=d.lancs.filter(l=>(l.dataDoc||'').startsWith(m));return{m,rec:ml.filter(l=>l.tipo==='RECEITA').reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0),des:ml.filter(l=>l.tipo==='DESPESA').reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0)};});
  const maxBar = Math.max(...mesesData.map(m=>Math.max(m.rec,m.des)),1);

  const MESES_NOME = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const pendencias = reembolsos.length + aReceber.length + previstos.length + estoqueBaixo.length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div><h2 className="page-title">Dashboard</h2><div className="page-sub">Visão geral do negócio · {MESES_NOME[new Date().getMonth()]} {new Date().getFullYear()}</div></div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {[["Receitas do mês",brl(recMes),"#8FA715"],["Despesas do mês",brl(desMes),"#E8614B"],["Resultado",brl(resultado),resultado>=0?"#C5D943":"#E8614B"],["Clientes Ativos",clAtivos,"#1A4F71"],["CMV Médio",pct(cmvMedio),cmvMedio<.30?"#8FA715":cmvMedio<.35?"#B8860B":"#E8614B"]].map(([l,v,c])=>(
          <div key={l} className="kpi-card" style={{borderLeftColor:c}}>
            <div className="kpi-label">{l}</div>
            <div className="kpi-value" style={{color:c}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {pendencias>0&&<div className="card" style={{background:'#1a1710',border:'1px solid #3a3520'}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'#F59E0B',marginBottom:12}}>⚠️ PENDÊNCIAS — {pendencias} item{pendencias>1?'s':''}</div>
        {reembolsos.length>0&&<div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #2a2a20',alignItems:'center'}}><div style={{fontSize:13,color:'#F2EBD8'}}>💰 <strong>{reembolsos.length}</strong> reembolso{reembolsos.length>1?'s':''} pendente{reembolsos.length>1?'s':''}</div><div style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:'#F59E0B'}}>{brl(reembTotal)}</div></div>}
        {aReceber.length>0&&<div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #2a2a20',alignItems:'center'}}><div style={{fontSize:13,color:'#F2EBD8'}}>📥 <strong>{aReceber.length}</strong> receita{aReceber.length>1?'s':''} a receber</div><div style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:'#8FA715'}}>{brl(aReceberTotal)}</div></div>}
        {previstos.length>0&&<div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #2a2a20',alignItems:'center'}}><div style={{fontSize:13,color:'#F2EBD8'}}>📋 <strong>{previstos.length}</strong> despesa{previstos.length>1?'s':''} prevista{previstos.length>1?'s':''}</div><div style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:'#E8614B'}}>{brl(previstos.reduce((s,l)=>s+(+(l.vlrBruto||0)),0))}</div></div>}
        {estoqueBaixo.length>0&&<div style={{padding:'8px 0'}}><div style={{fontSize:13,color:'#F2EBD8'}}>📦 <strong>{estoqueBaixo.length}</strong> ingrediente{estoqueBaixo.length>1?'s':''} com estoque baixo</div><div style={{fontSize:11,color:'#888',marginTop:4}}>{estoqueBaixo.slice(0,3).map(i=>i.nome).join(', ')}{estoqueBaixo.length>3?` +${estoqueBaixo.length-3}`:''}</div></div>}
      </div>}

      {/* Gráfico últimos 3 meses */}
      <div className="card">
        <div style={{fontSize:11,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'#555',marginBottom:14}}>RECEITA vs DESPESA — ÚLTIMOS 3 MESES</div>
        <div style={{display:'flex',gap:16,alignItems:'flex-end',height:120}}>
          {mesesData.map(m=>{const mn=MESES_NOME[parseInt(m.m.split('-')[1])-1];return(
            <div key={m.m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <div style={{display:'flex',gap:3,alignItems:'flex-end',width:'100%',justifyContent:'center',height:90}}>
                <div style={{width:'40%',background:'#8FA715',borderRadius:'4px 4px 0 0',height:`${Math.max(4,m.rec/maxBar*80)}px`,transition:'height .5s'}}/>
                <div style={{width:'40%',background:'#E8614B',borderRadius:'4px 4px 0 0',height:`${Math.max(4,m.des/maxBar*80)}px`,transition:'height .5s'}}/>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:'#888'}}>{mn}</div>
            </div>
          );})}
        </div>
        <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:10}}>
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#888'}}><div style={{width:10,height:10,borderRadius:2,background:'#8FA715'}}/>Receitas</div>
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#888'}}><div style={{width:10,height:10,borderRadius:2,background:'#E8614B'}}/>Despesas</div>
        </div>
      </div>

      {/* Cartão de crédito do mês */}
      {cartaoDesp.length>0&&<div className="card">
        <div style={{fontSize:11,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'#555',marginBottom:14}}>💳 DESPESAS NO CARTÃO — {MESES_NOME[new Date().getMonth()]}</div>
        {cartaoDesp.map(l=><div key={l.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #2A2A2A',alignItems:'center'}}>
          <div><div style={{fontSize:13,fontWeight:600,color:'#F2EBD8'}}>{l.descricao}</div><div style={{fontSize:11,color:'#888',marginTop:2}}>{l.cartaoNome} {l.cartaoUlt4?`****${l.cartaoUlt4}`:''} {l.recorrente?'🔄':''}</div></div>
          <div style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:'#E8614B'}}>{brl(+(l.vlrPago||l.vlrBruto)||0)}</div>
        </div>)}
        <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 0',marginTop:4}}>
          <span style={{fontSize:12,fontWeight:700,color:'#888'}}>Total cartão</span>
          <span style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:'#E8614B'}}>{brl(cartaoDesp.reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0))}</span>
        </div>
      </div>}

      {/* Top 5 despesas */}
      {topDesp.length>0&&<div className="card">
        <div style={{fontSize:11,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'#555',marginBottom:14}}>TOP DESPESAS DO MÊS</div>
        {topDesp.map((l,i)=><div key={l.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:i<topDesp.length-1?'1px solid #2A2A2A':'none',alignItems:'center'}}>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:'#F2EBD8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.descricao}</div><div style={{fontSize:11,color:'#888',marginTop:2}}>{l.categoria||''} · {l.pagador||''}</div></div>
          <div style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:'#E8614B',flexShrink:0}}>{brl(+(l.vlrPago||l.vlrBruto)||0)}</div>
        </div>)}
      </div>}

      {/* Clientes */}
      <div className="card">
        <div style={{fontSize:11,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'#555',marginBottom:14}}>CLIENTES — {d.clientes.length} total · {clAtivos} ativos · {clLeads} leads</div>
        {d.clientes.slice(0,6).map(c=>(
          <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #2A2A2A'}}>
            <div style={{fontSize:14,fontWeight:600,color:'#F2EBD8'}}>{c.nome}</div>
            <span className="tag" style={{background:(({Lead:'#555',Proposta:'#5b9fd4',Ativo:'#8FA715',Pausado:'#C4502B',Concluído:'#497A5D'})[c.status]||'#555')+'22',color:({Lead:'#555',Proposta:'#5b9fd4',Ativo:'#8FA715',Pausado:'#C4502B',Concluído:'#497A5D'})[c.status]||'#555'}}>{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CRM ──────────────────────────────────────────────────────────
function CRM() {
  const { token } = useApp();
  const [clientes, setClientes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState("kanban"); // kanban | list
  const [form, setForm] = useState({ nome: "", status: "Lead", email: "", telefone: "", responsavel: "Amanda", valor_contrato: "", notas: "" });
  const [saving, setSaving] = useState(false);
  const COLS = ["Lead", "Proposta", "Ativo", "Pausado", "Concluído"];
  const statusColor = s => ({ Lead: "#555", Proposta: "#5b9fd4", Ativo: "#8FA715", Pausado: "#C4502B", Concluído: "#497A5D" }[s] || "#555");
  const load = useCallback(async () => { const d = await db.from("clientes").select("*", token); if (Array.isArray(d)) setClientes(d); }, [token]);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    setSaving(true);
    await db.from("clientes").insert({ ...form, valor_contrato: form.valor_contrato ? parseFloat(form.valor_contrato) : null }, token);
    setForm({ nome: "", status: "Lead", email: "", telefone: "", responsavel: "Amanda", valor_contrato: "", notas: "" });
    setShowForm(false);
    await load();
    setSaving(false);
  };
  return (
    <div className="page-content">
      <div className="page-header">
        <div><h2 className="page-title">CRM</h2><div className="page-sub">Pipeline de clientes</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setViewMode(v => v === "kanban" ? "list" : "kanban")} className="btn-ghost" style={{ padding: "8px 12px", fontSize: 12 }}>{viewMode === "kanban" ? "≡ Lista" : "⊞ Kanban"}</button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancelar" : "+ Cliente"}</button>
        </div>
      </div>
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="form-grid">
            {[["Nome", "nome", "text"], ["E-mail", "email", "email"], ["Telefone", "telefone", "tel"], ["Valor contrato (R$)", "valor_contrato", "number"]].map(([l, k, t]) => (
              <div key={k} className={k === "nome" ? "form-full" : ""}>
                <label className="label-dark">{l}</label>
                <input className="input-dark" type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="label-dark">Status</label>
              <select className="input-dark" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {COLS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label-dark">Responsável</label>
              <select className="input-dark" value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}>
                <option>Amanda</option><option>Bruna</option><option>Zeste</option>
              </select>
            </div>
            <div className="form-full">
              <label className="label-dark">Notas</label>
              <input className="input-dark" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
            </div>
          </div>
          <button className="btn-primary" onClick={save} disabled={saving || !form.nome}>{saving ? "Salvando…" : "Salvar cliente"}</button>
        </div>
      )}
      {viewMode === "kanban" ? (
        <div className="kanban">
          {COLS.map(col => {
            const items = clientes.filter(c => c.status === col);
            return (
              <div key={col}>
                <div className="kanban-col-header">
                  <span className="tag" style={{ background: statusColor(col) + "22", color: statusColor(col), border: `1px solid ${statusColor(col)}44`, fontSize: 9 }}>{col}</span>
                  <span style={{ fontSize: 11, color: "#555" }}>{items.length}</span>
                </div>
                {items.map(c => (
                  <div key={c.id} className="kanban-card" style={{ borderLeft: `3px solid ${statusColor(col)}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#F2EBD8", marginBottom: 4, wordBreak: "break-word" }}>{c.nome}</div>
                    {c.valor_contrato && <div style={{ fontSize: 11, color: "#8FA715" }}>R$ {Number(c.valor_contrato).toLocaleString("pt-BR")}</div>}
                    <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>{c.responsavel}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          {clientes.length === 0 && <div style={{ color: "#555", fontSize: 13, padding: "20px 0" }}>Nenhum cliente ainda.</div>}
          {clientes.map((c, i) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < clientes.length - 1 ? "1px solid #2A2A2A" : "none" }}>
              <div style={{ width: 3, alignSelf: "stretch", borderRadius: 99, background: statusColor(c.status), flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#F2EBD8" }}>{c.nome}</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{c.responsavel}{c.valor_contrato ? ` · R$ ${Number(c.valor_contrato).toLocaleString("pt-BR")}` : ""}</div>
              </div>
              <span className="tag" style={{ background: statusColor(c.status) + "22", color: statusColor(c.status), border: `1px solid ${statusColor(c.status)}44`, fontSize: 9 }}>{c.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PLACEHOLDER ──────────────────────────────────────────────────
function Placeholder({ icon, title, desc, fase }) {
  return (
    <div className="placeholder">
      <div className="placeholder-inner">
        <div className="placeholder-icon">{icon}</div>
        <div className="placeholder-title">{title}</div>
        <div className="placeholder-desc">{desc}</div>
        <span className="tag" style={{ background: "#C4502B22", color: "#C4502B", border: "1px solid #C4502B44" }}>Fase {fase}</span>
      </div>
    </div>
  );
}

// ── APP ROOT ─────────────────────────────────────────────────────
export default function ZesteSistema() {
  const [session, setSession] = useState(null);
  const [modulo, setModulo] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => { if (session?.role === 'admin' && session?.token) await db.auth.signOut(session.token); setSession(null); };

  if (!session) return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <LoginScreen onLogin={(sess) => setSession(sess)} />
    </>
  );

  // Cliente logado → view restrita
  if (session.role === "cliente") return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <PortalCliente clienteInfo={session.clienteInfo} token={session.token} onLogout={() => setSession(null)} />
    </>
  );

  if (modulo === "financeiro") return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <AppCtx.Provider value={{ token: session.token, user: session.user }}>
        <Financeiro onBack={() => setModulo("dashboard")} token={session.token} />
      </AppCtx.Provider>
    </>
  );

  if (modulo === "fichas") return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <AppCtx.Provider value={{ token: session.token, user: session.user }}>
        <Fichas onBack={() => setModulo("dashboard")} token={session.token} userInfo={{email:session.user?.email,nome:"Admin"}} />
      </AppCtx.Provider>
    </>
  );

  if (modulo === "comercial") return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <AppCtx.Provider value={{ token: session.token, user: session.user }}>
        <Comercial onBack={() => setModulo("dashboard")} token={session.token} />
      </AppCtx.Provider>
    </>
  );

  if (modulo === "marketing") return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <AppCtx.Provider value={{ token: session.token, user: session.user }}>
        <RedesSociais onBack={() => setModulo("dashboard")} token={session.token} />
      </AppCtx.Provider>
    </>
  );

  const renderModulo = () => {
    switch (modulo) {
      case "dashboard": return <Dashboard />;
      // crm removed - using Comercial module
      case "drive": return <Placeholder icon="📁" title="Drive Interno" fase="3" desc="Upload de documentos por cliente." />;
      // fichas handled above as full-screen
      // marketing handled above as full-screen
      default: return <Dashboard />;
    }
  };

  return (
    <AppCtx.Provider value={{ token: session.token, user: session.user }}>
      <style>{GLOBAL_STYLE}</style>
      <div className="app-shell">
        {/* Desktop sidebar */}
        <Sidebar modulo={modulo} setModulo={setModulo} user={session.user} onLogout={handleLogout} collapsed={collapsed} setCollapsed={setCollapsed} />
        {/* Mobile drawer */}
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} modulo={modulo} setModulo={setModulo} user={session.user} onLogout={handleLogout} />
        <div className="app-main">
          {/* Mobile top bar */}
          <TopBar modulo={modulo} onMenu={() => setDrawerOpen(true)} />
          {renderModulo()}
        </div>
        {/* Mobile bottom nav */}
        <BottomNav modulo={modulo} setModulo={setModulo} />
      </div>
    </AppCtx.Provider>
  );
}

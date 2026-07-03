import { useState, useEffect, createContext, useContext, useCallback, Component } from "react";
import Financeiro from "./Financeiro.jsx";
import Fichas from "./Fichas.jsx";
import Comercial from "./Comercial.jsx";
import RedesSociais from "./Marketing.jsx";
import PortalCliente from "./PortalCliente.jsx";
import BreakEven from "./BreakEven.jsx";
import Compras from "./Compras.jsx";
import Engenharia from "./Engenharia.jsx";
import PortalAdmin from "./PortalAdmin.jsx";
import Studio from "./Studio.jsx";

// ── SUPABASE ──────────────────────────────────────────────────────
const SUPABASE_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";

function createClient(url, key) {
  const h = { "apikey": key, "Content-Type": "application/json" };
  const ah = t => ({ ...h, "Authorization": `Bearer ${t || key}` });
  return {
    auth: {
      signIn: async (email, pw) => { const r = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: "POST", headers: h, body: JSON.stringify({ email, password: pw }) }); return r.json(); },
      refresh: async rt => { try { const r = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: h, body: JSON.stringify({ refresh_token: rt }) }); return r.json(); } catch { return {}; } },
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
const AppCtx = createContext({ token: null, user: null, setModulo: () => {} });
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
.nav-btn-label { font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 600; letter-spacing: .04em; color: #E8E0CC; white-space: nowrap; }
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
.drawer-nav-label { font-family: 'Barlow Condensed', sans-serif; font-size: 17px; font-weight: 600; color: #E8E0CC; }
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
  .dash-2col { grid-template-columns: 1fr !important; }
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
      <img src="/logo-icon-t.png" alt="Zeste" style={{ height: s * 1.25, width: "auto" }} />
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
  { id: "fichas",     icon: "🍽️", label: "Operação"    },
  { id: "studio",     icon: "✦", label: "Estúdio"     },
  { id: "marketing",  icon: "📱", label: "Marketing"   },
  { id: "breakeven",  icon: "📉", label: "Break-even"  },
  { id: "compras",    icon: "🛒", label: "Compras"     },
  { id: "engenharia", icon: "📊", label: "Engenharia"  },
  { id: "portaladmin",icon: "🔑", label: "Área de Membros" },
];

// ── SIDEBAR DESKTOP ─────────────────────────────────────────────
function Sidebar({ modulo, setModulo, user, onLogout, collapsed, setCollapsed }) {
  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="sidebar-logo">
        <img src={collapsed?"/logo-icon-t.png":"/logo-zeste.png"} alt="Zeste" style={{height:collapsed?34:52,width:'auto',transition:'height .2s'}}/>
        <button onClick={() => setCollapsed(!collapsed)} style={{ color: "#555", fontSize: 14, padding: 4, marginLeft: collapsed ? 0 : 4 }}>
          {collapsed ? "›" : "‹"}
        </button>
      </div>
      <nav className="sidebar-nav">
        {MODULOS.map(m => (
          <button key={m.id} className={`nav-btn${modulo === m.id ? " active" : ""}`} onClick={() => setModulo(m.id)}>
            {collapsed && <span style={{ fontSize: 16 }}>{m.icon}</span>}
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
      <div className="top-bar-title"><img src="/logo-icon-t.png" alt="Z" style={{height:20,marginRight:6,verticalAlign:'middle'}}/> {m?.label}</div>
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
    // Login único via Supabase Auth (admin e clientes)
    const data = await db.auth.signIn(email, senha);
    if (data.access_token) {
      // Papel vem do app_metadata (só admin altera; cliente não edita). Fallback: user_metadata.
      const meta = { ...(data.user?.user_metadata || {}), ...(data.user?.app_metadata || {}) };
      const role = meta.role === "cliente" ? "cliente" : "admin";
      if (role === "cliente") {
        // Busca info do cliente com o token REAL (não a anon key)
        try {
          const r = await fetch(SUPABASE_URL + "/rest/v1/fin_portal_clientes?email=eq." + encodeURIComponent(email) + "&ativo=eq.true&select=*", { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + data.access_token } });
          const clients = await r.json();
          if (Array.isArray(clients) && clients.length > 0) {
            onLogin({ role: "cliente", token: data.access_token, refresh: data.refresh_token, user: data.user, clienteInfo: clients[0] });
            return;
          }
        } catch {}
        setErr("Acesso de cliente não configurado — fale com a Zeste");
        setLoad(false);
        return;
      }
      onLogin({ role: "admin", token: data.access_token, refresh: data.refresh_token, user: data.user });
      return;
    }
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
  const { token, user, setModulo } = useApp();
  const [d, setD] = useState({ clientes:[], lancs:[], ings:[], pratos:[], crm:[], loading:true });
  const [crmReloading, setCrmReloading] = useState(false);
  const mes = new Date().toISOString().slice(0, 7);
  const brl = v => v==null||isNaN(v)?'—':'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const brlShort = v => { if(v==null||isNaN(v)) return '—'; const n=Number(v); if(n>=1000) return 'R$'+(n/1000).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'k'; return 'R$'+n.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0}); };
  const pct = v => v==null||isNaN(v)?'—':(v*100).toFixed(1)+'%';

  useEffect(() => {
    (async () => {
      const crmH = {"Content-Type":"application/json", apikey:SUPABASE_KEY, Authorization:`Bearer ${token||SUPABASE_KEY}`};
      const [cl, ln, ig, pr, crm] = await Promise.all([
        db.from("clientes").select("id,nome,status,created_at", token),
        fetch(SUPABASE_URL+"/rest/v1/fin_lancamentos?deleted_at=is.null&order=created_at.desc",{headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+(token||SUPABASE_KEY)}}).then(r=>r.json()).catch(()=>[]),
        fetch(SUPABASE_URL+"/rest/v1/fin_ingredientes?order=created_at.desc",{headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+(token||SUPABASE_KEY)}}).then(r=>r.json()).catch(()=>[]),
        fetch(SUPABASE_URL+"/rest/v1/fin_pratos?deleted_at=is.null&order=created_at.desc",{headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+(token||SUPABASE_KEY)}}).then(r=>r.json()).catch(()=>[]),
        fetch(SUPABASE_URL+"/rest/v1/crm_contatos?deleted_at=is.null&select=id,data",{headers:crmH}).then(r=>r.json()).catch(()=>[]),
      ]);
      setD({ clientes:Array.isArray(cl)?cl:[], lancs:Array.isArray(ln)?ln.map(r=>r.dados||r):[], ings:Array.isArray(ig)?ig.map(r=>r.dados||r):[], pratos:Array.isArray(pr)?pr.map(r=>r.dados||r):[], crm:Array.isArray(crm)?crm.map(r=>({...r.data,_id:r.id})):[], loading:false });
    })();
  }, []);

  const reloadCrm = async () => {
    setCrmReloading(true);
    try {
      const crmH2 = {"Content-Type":"application/json", apikey:SUPABASE_KEY, Authorization:`Bearer ${token||SUPABASE_KEY}`};
      const crm = await fetch(SUPABASE_URL+"/rest/v1/crm_contatos?deleted_at=is.null&select=id,data",{headers:crmH2}).then(r=>r.json()).catch(()=>[]);
      setD(prev=>({...prev, crm:Array.isArray(crm)?crm.map(r=>({...r.data,_id:r.id})):[]}));
    } finally { setCrmReloading(false); }
  };

  if(d.loading) return <div className="page-content"><div style={{textAlign:'center',padding:80,color:'#555',fontSize:13}}>Carregando…</div></div>;

  const hora = new Date().getHours();
  const saudacaoFinal = hora<12?'Bom dia ☀️':hora<18?'Boa tarde 🌤️':'Boa noite 🌙';
  const emailNome = user?.email?.split('@')[0]||'';
  const nomeExibido = emailNome.charAt(0).toUpperCase()+emailNome.slice(1);
  const DIAS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const MESES_NOME = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const MESES_COMPLETO = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const hoje = new Date();
  const dataStr = DIAS[hoje.getDay()]+', '+hoje.getDate()+' de '+MESES_COMPLETO[hoje.getMonth()]+' de '+hoje.getFullYear();

  const lancsMes = d.lancs.filter(l=>(l.dataDoc||''). startsWith(mes));
  const recMes = lancsMes.filter(l=>l.tipo==='RECEITA').reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0);
  const desMes = lancsMes.filter(l=>l.tipo==='DESPESA').reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0);
  const resultado = recMes - desMes;

  const d2 = new Date(); d2.setMonth(d2.getMonth()-1);
  const mesAnt = d2.toISOString().slice(0,7);
  const lancsAnt = d.lancs.filter(l=>(l.dataDoc||''). startsWith(mesAnt));
  const recAnt = lancsAnt.filter(l=>l.tipo==='RECEITA').reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0);
  const desAnt = lancsAnt.filter(l=>l.tipo==='DESPESA').reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0);
  const trend = (cur,prev) => { if(!prev) return null; const dt=(cur-prev)/prev; return {dir:dt>=0?'up':'down',pct:Math.abs(dt*100).toFixed(0)}; };
  const tRec=trend(recMes,recAnt); const tDes=trend(desMes,desAnt); const tRes=trend(resultado,recAnt-desAnt);

  const pratosComPreco = d.pratos.filter(p=>p.precoVenda>0);
  const cmvMedio = pratosComPreco.length>0?pratosComPreco.reduce((s,p)=>{const ct=(p.componentes||[]).reduce((a,c)=>a+((Number(c.qtdGramas)||0)/1000)*(c.custoPorKg||0),0);return s+(p.precoVenda>0?ct/p.precoVenda:0);},0)/pratosComPreco.length:0;
  const cmvCor = cmvMedio<.30?'#8FA715':cmvMedio<.35?'#F59E0B':'#E8614B';

  const reembolsos = d.lancs.filter(l=>l.reembolso==='PENDENTE');
  const aReceber = d.lancs.filter(l=>l.tipo==='RECEITA'&&l.status==='A RECEBER');
  const aReceberTotal = aReceber.reduce((s,l)=>s+(+(l.vlrBruto||0)),0);
  const previstos = d.lancs.filter(l=>l.tipo==='DESPESA'&&l.status==='PREVISTO');
  const estoqueBaixo = d.ings.filter(i=>i.estoqueMin>0&&(i.estoque||0)<i.estoqueMin);
  const pendencias = reembolsos.length+aReceber.length+previstos.length+estoqueBaixo.length;
  const reembTotal = reembolsos.reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0);
  const clAtivos = d.clientes.filter(c=>c.status==='Ativo').length;

  // CRM Priority
  const STAGE_PRI = {'Negociação / Proposta':0,'Leads':1,'Cliente':2,'Prospects':3,'Portas Fechadas':4};
  const STAGE_COR = {'Negociação / Proposta':'#E8614B','Leads':'#F59E0B','Cliente':'#8FA715','Prospects':'#555','Portas Fechadas':'#333'};
  const STAGE_BADGE = {'Negociação / Proposta':'NEGOCIAÇÃO','Leads':'LEAD','Cliente':'CLIENTE','Prospects':'PROSPECT','Portas Fechadas':'FECHADO'};
  const crmPri = [...(d.crm||[])].filter(x=>x.stage!=='Portas Fechadas'&&x.stage!=='Prospects').sort((a,b)=>(STAGE_PRI[a.stage]??9)-(STAGE_PRI[b.stage]??9)).slice(0,5);

  const meses3 = [0,1,2].map(i=>{const dt=new Date();dt.setMonth(dt.getMonth()-i);return dt.toISOString().slice(0,7);}).reverse();
  const mesesData = meses3.map(m=>{const ml=d.lancs.filter(l=>(l.dataDoc||''). startsWith(m));return{m,rec:ml.filter(l=>l.tipo==='RECEITA').reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0),des:ml.filter(l=>l.tipo==='DESPESA').reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0)};});
  const maxBar = Math.max(...mesesData.map(m=>Math.max(m.rec,m.des)),1);
  const topDesp = lancsMes.filter(l=>l.tipo==='DESPESA').sort((a,b)=>(+(b.vlrPago||b.vlrBruto)||0)-(+(a.vlrPago||a.vlrBruto)||0)).slice(0,4);
  const cartaoDesp = d.lancs.filter(l=>l.tipo==='DESPESA'&&l.cartaoNome&&(l.dataDoc||''). startsWith(mes));

  const TrendBadge = ({t,bom}) => { if(!t) return null; const ok=t.dir===bom; return <span style={{fontSize:9,fontWeight:700,padding:'2px 5px',borderRadius:4,background:ok?'rgba(143,167,21,.15)':'rgba(232,97,75,.15)',color:ok?'#8FA715':'#E8614B'}}>{t.dir==='up'?'↑':'↓'}{t.pct}%</span>; };
  const QUICK = [{icon:'💰',label:'Financeiro',mod:'financeiro'},{icon:'🍳',label:'Fichas',mod:'fichas'},{icon:'🤝',label:'Comercial',mod:'comercial'},{icon:'📱',label:'Marketing',mod:'marketing'}];

  return (
    <div className="page-content">
      <div style={{marginBottom:24}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,color:'#F2EBD8',letterSpacing:'.02em'}}>{saudacaoFinal}{nomeExibido?', '+nomeExibido+'!':''}</div>
        <div style={{fontSize:12,color:'#555',marginTop:2}}>{dataStr}</div>
      </div>
      <div className="kpi-grid" style={{marginBottom:16}}>
        {[{label:'Receitas',val:brl(recMes),cor:'#8FA715',t:tRec,bom:'up'},{label:'Despesas',val:brl(desMes),cor:'#E8614B',t:tDes,bom:'down'},{label:'Resultado',val:brl(resultado),cor:resultado>=0?'#8FA715':'#E8614B',t:tRes,bom:'up'},{label:'Clientes Ativos',val:clAtivos,cor:'#1A4F71',t:null},{label:'CMV Médio',val:pct(cmvMedio),cor:cmvCor,t:null,sub:cmvMedio<.30?'✓ Excelente':cmvMedio<.35?'⚠ Atenção':'✗ Alto'}].map(({label,val,cor,t,bom,sub})=>(
          <div key={label} className="kpi-card" style={{borderLeftColor:cor}}>
            <div className="kpi-label" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span>{label}</span><TrendBadge t={t} bom={bom}/></div>
            <div className="kpi-value" style={{color:cor,fontSize:22}}>{val}</div>
            {sub&&<div style={{fontSize:10,color:cor,marginTop:3,fontWeight:700}}>{sub}</div>}
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {QUICK.map(({icon,label,mod})=>(
          <button key={mod} onClick={()=>setModulo(mod)} style={{display:'flex',alignItems:'center',gap:6,padding:'9px 14px',background:'#181818',border:'1px solid #2A2A2A',borderRadius:8,color:'#E8E0CC',fontSize:12,fontWeight:700,cursor:'pointer',letterSpacing:'.04em'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#8FA715'} onMouseLeave={e=>e.currentTarget.style.borderColor='#2A2A2A'}>
            <span style={{fontSize:16}}>{icon}</span>{label}
          </button>
        ))}
      </div>
      {/* CRM PRIORIDADES */}
      {crmPri.length>0&&<div onClick={()=>setModulo('comercial')} style={{marginBottom:16,background:'#1C2820',border:'1px solid #2C3A28',borderRadius:8,padding:16,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#8FA715'} onMouseLeave={e=>e.currentTarget.style.borderColor='#2C3A28'}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'#8FA715',marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>📋 PRIORIDADES CRM</span>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button onClick={e=>{e.stopPropagation();reloadCrm();}} disabled={crmReloading} style={{background:'none',border:'none',color:'#8FA715',cursor:'pointer',fontSize:13,padding:0}} title="Atualizar">{crmReloading?'⟳':'↻'}</button>
            <span style={{fontSize:10,color:'#8FA715',fontWeight:700,letterSpacing:'.06em'}}>VER TODOS →</span>
          </div>
        </div>
        {crmPri.map((ct,i)=>{const cor=STAGE_COR[ct.stage]||'#555';const ult=ct.historico?.slice(-1)[0];const temData=ct.proximaReuniao;return(
          <div key={ct._id||i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:i<crmPri.length-1?'1px solid #2C3A28':'none'}}>
            <div style={{width:3,alignSelf:'stretch',borderRadius:99,background:cor,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:'#F2EBD8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ct.name||ct.company||'—'}</div>
              <div style={{fontSize:11,color:'#888',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ct.company&&ct.name?ct.company:ct.segmento||''}{ult&&!temData?' · '+ult.nota?.slice(0,35):''}</div>
              {temData&&<div style={{fontSize:10,color:cor,fontWeight:700,marginTop:3}}>📅 {ct.tipoReuniao||'Reunião'} — {new Date(temData+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}{ct.horarioReuniao?' às '+ct.horarioReuniao:''}</div>}
            </div>
            <span style={{padding:'2px 7px',borderRadius:4,background:cor+'22',color:cor,fontSize:9,fontWeight:700,letterSpacing:'.06em',flexShrink:0}}>{STAGE_BADGE[ct.stage]||ct.stage}</span>
          </div>
        );})}
      </div>}

      {pendencias>0&&<div className="card" style={{background:'#1a1710',border:'1px solid #3a3520',marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'#F59E0B',marginBottom:10}}>⚠️ PENDÊNCIAS — {pendencias} item{pendencias>1?'s':''}</div>
        {reembolsos.length>0&&<div style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #2a2a20',alignItems:'center'}}><span style={{fontSize:13,color:'#F2EBD8'}}>💰 <b>{reembolsos.length}</b> reembolso pendente</span><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'#F59E0B'}}>{brl(reembTotal)}</span></div>}
        {aReceber.length>0&&<div style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #2a2a20',alignItems:'center'}}><span style={{fontSize:13,color:'#F2EBD8'}}>📥 <b>{aReceber.length}</b> a receber</span><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'#8FA715'}}>{brl(aReceberTotal)}</span></div>}
        {previstos.length>0&&<div style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #2a2a20',alignItems:'center'}}><span style={{fontSize:13,color:'#F2EBD8'}}>📋 <b>{previstos.length}</b> despesa prevista</span><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'#E8614B'}}>{brl(previstos.reduce((s,l)=>s+(+(l.vlrBruto||0)),0))}</span></div>}
        {estoqueBaixo.length>0&&<div style={{padding:'7px 0'}}><span style={{fontSize:13,color:'#F2EBD8'}}>📦 <b>{estoqueBaixo.length}</b> estoque baixo</span><div style={{fontSize:11,color:'#888',marginTop:3}}>{estoqueBaixo.slice(0,3).map(i=>i.nome).join(', ')}{estoqueBaixo.length>3?' +'+estoqueBaixo.length-3:''}</div></div>}
      </div>}
      <div className="card" style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'#555',marginBottom:16}}>RECEITA vs DESPESA — ÚLTIMOS 3 MESES</div>
        <div style={{display:'flex',gap:12,alignItems:'flex-end',height:130}}>
          {mesesData.map(m=>{const mn=MESES_NOME[parseInt(m.m.split('-')[1])-1];const hR=Math.max(8,m.rec/maxBar*100);const hD=Math.max(8,m.des/maxBar*100);return(
            <div key={m.m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <div style={{display:'flex',gap:4,alignItems:'flex-end',width:'100%',justifyContent:'center',height:110}}>
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',gap:3}}><span style={{fontSize:9,color:'#8FA715',fontWeight:700,whiteSpace:'nowrap'}}>{brlShort(m.rec)}</span><div style={{width:'100%',background:'#8FA715',borderRadius:'4px 4px 0 0',height:`${hR}px`,transition:'height .5s'}}/></div>
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',gap:3}}><span style={{fontSize:9,color:'#E8614B',fontWeight:700,whiteSpace:'nowrap'}}>{brlShort(m.des)}</span><div style={{width:'100%',background:'#E8614B',borderRadius:'4px 4px 0 0',height:`${hD}px`,transition:'height .5s'}}/></div>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:'#888'}}>{mn}</div>
              <div style={{fontSize:10,color:m.rec>=m.des?'#8FA715':'#E8614B',fontWeight:700}}>{m.rec>=m.des?'+':''}{brlShort(m.rec-m.des)}</div>
            </div>
          );})}
        </div>
        <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:10}}>
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#888'}}><div style={{width:10,height:10,borderRadius:2,background:'#8FA715'}}/>Receitas</div>
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#888'}}><div style={{width:10,height:10,borderRadius:2,background:'#E8614B'}}/>Despesas</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}} className="dash-2col">
        {topDesp.length>0&&<div className="card">
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'#555',marginBottom:12}}>TOP DESPESAS</div>
          {topDesp.map((l,i)=><div key={l.id} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:i<topDesp.length-1?'1px solid #2A2A2A':'none',alignItems:'center',gap:8}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:'#F2EBD8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.descricao}</div><div style={{fontSize:10,color:'#555'}}>{l.categoria}</div></div><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:'#E8614B',flexShrink:0}}>{brl(+(l.vlrPago||l.vlrBruto)||0)}</span></div>)}
        </div>}
        {cartaoDesp.length>0&&<div className="card">
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'#555',marginBottom:12}}>💳 CARTÃO</div>
          {cartaoDesp.slice(0,4).map(l=><div key={l.id} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #2A2A2A',alignItems:'center',gap:8}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:'#F2EBD8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.descricao}</div><div style={{fontSize:10,color:'#555'}}>{l.cartaoNome}</div></div><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:'#E8614B',flexShrink:0}}>{brl(+(l.vlrPago||l.vlrBruto)||0)}</span></div>)}
          <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0 0',marginTop:4}}><span style={{fontSize:11,fontWeight:700,color:'#888'}}>Total</span><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:'#E8614B'}}>{brl(cartaoDesp.reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0))}</span></div>
        </div>}
      </div>
      <div className="card">
        <div style={{fontSize:11,fontWeight:700,letterSpacing:'.09em',textTransform:'uppercase',color:'#555',marginBottom:12}}>CLIENTES — {d.clientes.length} total · {clAtivos} ativos</div>
        {d.clientes.slice(0,5).map((c,i)=>(
          <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:i<Math.min(d.clientes.length,5)-1?'1px solid #2A2A2A':'none'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#F2EBD8'}}>{c.nome}</div>
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
class AppErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { erro: null }; }
  static getDerivedStateFromError(error) { return { erro: error }; }
  render() {
    if (this.state.erro) return (
      <div style={{ minHeight: "100vh", background: "#F0EEE8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🍋</div>
        <div style={{ fontSize: 21, fontWeight: 800, marginBottom: 8, color: "#1C1D1B" }}>Ops — algo travou por aqui</div>
        <div style={{ fontSize: 14, color: "#6B6B5E", maxWidth: 440, marginBottom: 18 }}>Recarregue a página. Se continuar acontecendo, envie a mensagem abaixo para o suporte da Zeste:</div>
        <div style={{ fontSize: 11.5, color: "#C4502B", background: "#fff", padding: 14, borderRadius: 10, maxWidth: 540, wordBreak: "break-word", fontFamily: "monospace", border: "1px solid #E3E1D9" }}>{String(this.state.erro?.message || this.state.erro)}</div>
        <button onClick={() => window.location.reload()} style={{ marginTop: 22, background: "#8FA715", color: "#1C1D1B", border: "none", borderRadius: 10, padding: "11px 26px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>↻ Recarregar</button>
      </div>
    );
    return this.props.children;
  }
}

export default function ZesteSistema() {
  return <AppErrorBoundary><ZesteSistemaInner /></AppErrorBoundary>;
}

function ZesteSistemaInner() {
  const [session, setSession] = useState(null);
  const [modulo, setModulo] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Renova o token antes de expirar (~1h) pra não derrubar saves no meio do trabalho
  useEffect(() => {
    if (!session?.refresh) return;
    const renovar = async () => {
      const d = await db.auth.refresh(session.refresh);
      if (d?.access_token) setSession(s => s ? { ...s, token: d.access_token, refresh: d.refresh_token || s.refresh } : s);
    };
    const iv = setInterval(renovar, 45 * 60 * 1000);
    const onVis = () => { if (document.visibilityState === "visible") renovar(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
  }, [session?.refresh]);

  const handleLogout = async () => { if (session?.token) await db.auth.signOut(session.token); setSession(null); };

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

  if (modulo === "breakeven") return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <AppCtx.Provider value={{ token: session.token, user: session.user, setModulo }}>
        <BreakEven onBack={() => setModulo("dashboard")} />
      </AppCtx.Provider>
    </>
  );

  if (modulo === "compras") return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <AppCtx.Provider value={{ token: session.token, user: session.user, setModulo }}>
        <Compras onBack={() => setModulo("dashboard")} token={session.token} />
      </AppCtx.Provider>
    </>
  );

  if (modulo === "engenharia") return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <AppCtx.Provider value={{ token: session.token, user: session.user, setModulo }}>
        <Engenharia onBack={() => setModulo("dashboard")} token={session.token} />
      </AppCtx.Provider>
    </>
  );

  if (modulo === "portaladmin") return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <AppCtx.Provider value={{ token: session.token, user: session.user, setModulo }}>
        <PortalAdmin onBack={() => setModulo("dashboard")} token={session.token} />
      </AppCtx.Provider>
    </>
  );

  if (modulo === "studio") return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <AppCtx.Provider value={{ token: session.token, user: session.user, setModulo }}>
        <Studio onBack={() => setModulo("dashboard")} token={session.token} />
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
      // fichas handled above as full-screen
      // marketing handled above as full-screen
      default: return <Dashboard />;
    }
  };

  return (
    <AppCtx.Provider value={{ token: session.token, user: session.user, setModulo }}>
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

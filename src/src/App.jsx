import { useState, useEffect, createContext, useContext, useCallback } from "react";

const C = {
  lima:"#8FA715",verde:"#497A5D",azul:"#1A4F71",
  terra:"#C4502B",off:"#F2EBD8",bg:"#0F0F0F",
  card:"#181818",card2:"#202020",borda:"#2A2A2A",
  texto:"#E8E0CC",muted:"#666",cinza:"#2A2A2A",
};

const SUPABASE_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";

function createClient(url, key) {
  const headers = {"apikey":key,"Content-Type":"application/json"};
  const authHeaders = (token) => ({...headers,"Authorization":`Bearer ${token||key}`});
  return {
    auth: {
      signIn: async (email,password) => {
        const r = await fetch(`${url}/auth/v1/token?grant_type=password`,{method:"POST",headers,body:JSON.stringify({email,password})});
        return r.json();
      },
      signOut: async (token) => { await fetch(`${url}/auth/v1/logout`,{method:"POST",headers:authHeaders(token)}); },
    },
    from: (table) => ({
      select: async (cols="*",token) => { const r = await fetch(`${url}/rest/v1/${table}?select=${cols}&order=created_at.desc`,{headers:authHeaders(token)}); return r.json(); },
      insert: async (data,token) => { const r = await fetch(`${url}/rest/v1/${table}`,{method:"POST",headers:{...authHeaders(token),"Prefer":"return=representation"},body:JSON.stringify(data)}); return r.json(); },
      delete: async (id,token) => { await fetch(`${url}/rest/v1/${table}?id=eq.${id}`,{method:"DELETE",headers:authHeaders(token)}); },
    })
  };
}

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const S = {
  app:{fontFamily:"'Barlow Condensed','Barlow',sans-serif",background:C.bg,minHeight:"100vh",color:C.texto},
  card:{background:C.card,border:`1px solid ${C.borda}`,borderRadius:8,padding:16},
  input:{background:"#1e1e1e",border:`1px solid ${C.borda}`,borderRadius:6,color:C.texto,fontFamily:"inherit",fontSize:14,padding:"10px 13px",width:"100%",boxSizing:"border-box",outline:"none"},
  label:{fontSize:11,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:C.muted,marginBottom:4,display:"block"},
  btn:(bg=C.lima,color=C.bg)=>({background:bg,color,border:"none",borderRadius:6,padding:"11px 20px",fontFamily:"inherit",fontWeight:700,fontSize:13,letterSpacing:".07em",textTransform:"uppercase",cursor:"pointer"}),
  tag:(c)=>({display:"inline-block",background:`${c}22`,color:c,border:`1px solid ${c}44`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}),
};

function Logo({small}){const s=small?28:40;return(<div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}><svg width={s} height={s*1.3} viewBox="0 0 44 56" fill="none"><ellipse cx="22" cy="28" rx="19" ry="26" stroke={C.lima} strokeWidth="2"/><path d="M16 16 Q21 13 26 17 Q30 21 26 27 Q22 32 18 37 Q15 41 20 44 Q24 46 28 43" stroke={C.lima} strokeWidth="2" fill="none" strokeLinecap="round"/><ellipse cx="20" cy="13" rx="3.5" ry="2" stroke={C.lima} strokeWidth="1.4" fill="none" transform="rotate(-20 20 13)"/></svg><div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:small?16:22,fontWeight:800,letterSpacing:".1em",color:C.off}}>ZESTE</div>{!small&&<div style={{fontSize:10,color:C.muted,letterSpacing:".1em"}}>SISTEMA UNIFICADO</div>}</div></div>);}

function LoginScreen({onLogin}){
  const [email,setEmail]=useState("");const [senha,setSenha]=useState("");const [err,setErr]=useState("");const [loading,setLoad]=useState(false);
  const login=async()=>{if(!email||!senha)return;setLoad(true);setErr("");const data=await db.auth.signIn(email,senha);if(data.access_token)onLogin(data.access_token,data.user);else setErr("E-mail ou senha incorretos");setLoad(false);};
  return(<div style={{...S.app,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{width:"100%",maxWidth:340}}><Logo/><div style={{...S.card,marginTop:24}}><div style={{marginBottom:14}}><label style={S.label}>E-mail</label><input style={S.input} type="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}/></div><div style={{marginBottom:20}}><label style={S.label}>Senha</label><input style={S.input} type="password" placeholder="••••••••" value={senha} onChange={e=>setSenha(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}/></div>{err&&<div style={{fontSize:12,color:C.terra,marginBottom:12}}>{err}</div>}<button style={{...S.btn(),width:"100%"}} onClick={login} disabled={loading}>{loading?"ENTRANDO…":"ENTRAR"}</button></div><div style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:16}}>Zeste Consultoria Gastronômica · Sistema Interno</div></div></div>);
}

const MODULOS=[{id:"dashboard",icon:"📊",label:"Dashboard"},{id:"crm",icon:"👥",label:"CRM"},{id:"financeiro",icon:"💰",label:"Financeiro"},{id:"drive",icon:"📁",label:"Drive"},{id:"fichas",icon:"🍽️",label:"Fichas"},{id:"marketing",icon:"📱",label:"Marketing"}];

function Sidebar({modulo,setModulo,user,onLogout,collapsed,setCollapsed}){return(<div style={{width:collapsed?56:200,flexShrink:0,background:C.card,borderRight:`1px solid ${C.borda}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",transition:"width .2s ease",overflow:"hidden"}}><div style={{padding:collapsed?"16px 0":"20px 16px",borderBottom:`1px solid ${C.borda}`,display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between"}}>{!collapsed&&<Logo small/>}{collapsed&&(<svg width="24" height="30" viewBox="0 0 44 56" fill="none"><ellipse cx="22" cy="28" rx="19" ry="26" stroke={C.lima} strokeWidth="2.5"/><path d="M16 16 Q21 13 26 17 Q30 21 26 27 Q22 32 18 37 Q15 41 20 44 Q24 46 28 43" stroke={C.lima} strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg>)}<button onClick={()=>setCollapsed(!collapsed)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,padding:4,flexShrink:0,marginLeft:collapsed?0:8}}>{collapsed?"›":"‹"}</button></div><nav style={{flex:1,padding:"8px 0",overflowY:"auto"}}>{MODULOS.map(m=>(<button key={m.id} onClick={()=>setModulo(m.id)} style={{display:"flex",alignItems:"center",gap:collapsed?0:10,width:"100%",background:modulo===m.id?`${C.lima}18`:"none",border:"none",padding:collapsed?"12px 0":"11px 16px",justifyContent:collapsed?"center":"flex-start",cursor:"pointer",borderLeft:modulo===m.id?`3px solid ${C.lima}`:"3px solid transparent"}}><span style={{fontSize:16}}>{m.icon}</span>{!collapsed&&(<span style={{fontSize:13,fontWeight:modulo===m.id?700:500,color:modulo===m.id?C.lima:C.texto,letterSpacing:".04em"}}>{m.label}</span>)}</button>))}</nav><div style={{padding:collapsed?"12px 0":"12px 16px",borderTop:`1px solid ${C.borda}`,display:"flex",alignItems:"center",gap:8,justifyContent:collapsed?"center":"flex-start"}}><div style={{width:28,height:28,borderRadius:"50%",background:`${C.lima}33`,border:`1px solid ${C.lima}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.lima,flexShrink:0}}>{user?.email?.[0]?.toUpperCase()||"Z"}</div>{!collapsed&&(<div style={{flex:1,minWidth:0}}><div style={{fontSize:11,color:C.off,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email?.split("@")[0]||"Amanda"}</div><button onClick={onLogout} style={{background:"none",border:"none",color:C.muted,fontSize:10,cursor:"pointer",padding:0,letterSpacing:".06em",textTransform:"uppercase"}}>Sair</button></div>)}</div></div>);}

function PageHeader({title,sub,action}){return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${C.borda}`}}><div><h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:800,color:C.off,letterSpacing:".04em",margin:0}}>{title}</h2>{sub&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{sub}</div>}</div>{action}</div>);}
function Field({label,value,onChange,type="text"}){return(<div><label style={S.label}>{label}</label><input style={S.input} type={type} value={value} onChange={e=>onChange(e.target.value)}/></div>);}

function Dashboard(){
  const {token}=useApp();const [stats,setStats]=useState({clientes:0,ativos:0,leads:0,posts_mes:0});const [clientes,setClientes]=useState([]);const [loading,setLoad]=useState(true);
  useEffect(()=>{(async()=>{const cl=await db.from("clientes").select("id,nome,status,created_at",token);const posts=await db.from("marketing_posts").select("id,status,data_planejada",token);const mes=new Date().toISOString().slice(0,7);if(Array.isArray(cl)){setStats({clientes:cl.length,ativos:cl.filter(c=>c.status==="Ativo").length,leads:cl.filter(c=>c.status==="Lead").length,posts_mes:Array.isArray(posts)?posts.filter(p=>p.data_planejada?.startsWith(mes)).length:0});setClientes(cl.slice(0,6));}setLoad(false);})();},[]);
  const statusColor=s=>({"Lead":C.muted,"Proposta":"#5b9fd4","Ativo":C.lima,"Pausado":C.terra,"Concluído":C.verde}[s]||C.muted);
  return(<div style={{padding:24}}><PageHeader title="Dashboard" sub="Visão geral do negócio"/><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>{[["Total Clientes",stats.clientes,C.azul],["Ativos",stats.ativos,C.lima],["Leads",stats.leads,C.verde],["Posts este mês",stats.posts_mes,C.terra]].map(([l,v,c])=>(<div key={l} style={{...S.card,borderLeft:`3px solid ${c}`}}><div style={{fontSize:10,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:C.muted,marginBottom:4}}>{l}</div><div style={{fontSize:28,fontWeight:800,color:c,lineHeight:1}}>{loading?"…":v}</div></div>))}</div><div style={S.card}><div style={{fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:C.muted,marginBottom:14}}>Clientes recentes</div>{clientes.length===0&&!loading&&<div style={{color:C.muted,fontSize:13}}>Nenhum cliente ainda.</div>}{clientes.map(c=>(<div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.borda}`}}><div style={{fontSize:14,fontWeight:600,color:C.off}}>{c.nome}</div><span style={S.tag(statusColor(c.status))}>{c.status}</span></div>))}</div></div>);
}

function CRM(){
  const {token}=useApp();const [clientes,setClientes]=useState([]);const [showForm,setShowForm]=useState(false);const [form,setForm]=useState({nome:"",status:"Lead",email:"",telefone:"",responsavel:"Amanda",valor_contrato:"",notas:""});const [saving,setSaving]=useState(false);
  const COLUNAS=["Lead","Proposta","Ativo","Pausado","Concluído"];
  const statusColor=s=>({"Lead":C.muted,"Proposta":"#5b9fd4","Ativo":C.lima,"Pausado":C.terra,"Concluído":C.verde}[s]||C.muted);
  const load=useCallback(async()=>{const data=await db.from("clientes").select("*",token);if(Array.isArray(data))setClientes(data);},[token]);
  useEffect(()=>{load();},[load]);
  const save=async()=>{setSaving(true);const payload={...form,valor_contrato:form.valor_contrato?parseFloat(form.valor_contrato):null};await db.from("clientes").insert(payload,token);setForm({nome:"",status:"Lead",email:"",telefone:"",responsavel:"Amanda",valor_contrato:"",notas:""});setShowForm(false);await load();setSaving(false);};
  return(<div style={{padding:24}}><PageHeader title="CRM" sub="Pipeline de clientes" action={<button style={S.btn()} onClick={()=>setShowForm(!showForm)}>{showForm?"CANCELAR":"+ CLIENTE"}</button>}/>{showForm&&(<div style={{...S.card,marginBottom:20}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}><Field label="Nome" value={form.nome} onChange={v=>setForm(f=>({...f,nome:v}))}/><div><label style={S.label}>Status</label><select style={S.input} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{COLUNAS.map(c=><option key={c}>{c}</option>)}</select></div><Field label="E-mail" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))}/><Field label="Telefone" value={form.telefone} onChange={v=>setForm(f=>({...f,telefone:v}))}/><Field label="Valor contrato (R$)" value={form.valor_contrato} onChange={v=>setForm(f=>({...f,valor_contrato:v}))} type="number"/><div><label style={S.label}>Responsável</label><select style={S.input} value={form.responsavel} onChange={e=>setForm(f=>({...f,responsavel:e.target.value}))}><option>Amanda</option><option>Bruna</option><option>Zeste</option></select></div></div><Field label="Notas" value={form.notas} onChange={v=>setForm(f=>({...f,notas:v}))}/><button style={{...S.btn(),marginTop:12}} onClick={save} disabled={saving||!form.nome}>{saving?"SALVANDO…":"SALVAR CLIENTE"}</button></div>)}<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>{COLUNAS.map(col=>(<div key={col}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{...S.tag(statusColor(col)),fontSize:9}}>{col}</span><span style={{fontSize:11,color:C.muted}}>{clientes.filter(c=>c.status===col).length}</span></div><div style={{display:"flex",flexDirection:"column",gap:8}}>{clientes.filter(c=>c.status===col).map(c=>(<div key={c.id} style={{...S.card,padding:"10px 12px",borderLeft:`3px solid ${statusColor(col)}`}}><div style={{fontSize:13,fontWeight:700,color:C.off,marginBottom:4,wordBreak:"break-word"}}>{c.nome}</div>{c.valor_contrato&&<div style={{fontSize:11,color:C.lima}}>R$ {Number(c.valor_contrato).toLocaleString("pt-BR")}</div>}<div style={{fontSize:10,color:C.muted,marginTop:4}}>{c.responsavel}</div></div>))}</div></div>))}</div></div>);
}

function Placeholder({icon,title,desc,fase}){return(<div style={{padding:24,display:"flex",alignItems:"center",justifyContent:"center",minHeight:400}}><div style={{textAlign:"center",maxWidth:320}}><div style={{fontSize:48,marginBottom:16}}>{icon}</div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:800,color:C.off,marginBottom:8}}>{title}</div><div style={{fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6}}>{desc}</div><span style={S.tag(C.terra)}>Fase {fase}</span></div></div>);}

export default function ZesteSistema(){
  const [session,setSession]=useState(null);const [modulo,setModulo]=useState("dashboard");const [collapsed,setCollapsed]=useState(false);
  const handleLogout=async()=>{if(session?.token)await db.auth.signOut(session.token);setSession(null);};
  if(!session)return <LoginScreen onLogin={(token,user)=>setSession({token,user})}/>;
  const ctx={token:session.token,user:session.user};
  const renderModulo=()=>{switch(modulo){case "dashboard":return <Dashboard/>;case "crm":return <CRM/>;case "financeiro":return <Placeholder icon="💰" title="Financeiro" fase="2" desc="Fluxo de caixa, DRE e importação Excel."/>;case "drive":return <Placeholder icon="📁" title="Drive Interno" fase="3" desc="Upload de documentos por cliente."/>;case "fichas":return <Placeholder icon="🍽️" title="Fichas Técnicas" fase="3" desc="Central de receitas e CMV."/>;case "marketing":return <Placeholder icon="📱" title="Marketing" fase="4" desc="Calendário editorial Instagram."/>;default:return <Dashboard/>;}};
  return(<AppCtx.Provider value={ctx}><style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800&family=Barlow:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;}select option{background:#181818;}`}</style><div style={{...S.app,display:"flex"}}><Sidebar modulo={modulo} setModulo={setModulo} user={session.user} onLogout={handleLogout} collapsed={collapsed} setCollapsed={setCollapsed}/><main style={{flex:1,overflowY:"auto",minHeight:"100vh"}}>{renderModulo()}</main></div></AppCtx.Provider>);
}

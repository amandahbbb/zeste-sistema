import { useState, useEffect } from "react";

const SB_URL="https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const sbH={"apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`,"Content-Type":"application/json"};
async function sbGet(path){const r=await fetch(`${SB_URL}/rest/v1/${path}`,{headers:sbH});return r.json();}

const MS=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const brl=v=>v==null||isNaN(v)?'—':'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct=v=>v==null||isNaN(v)?'—':(v*100).toFixed(1)+'%';
const num=(v,d=1)=>v==null||isNaN(v)?'—':Number(v).toLocaleString('pt-BR',{maximumFractionDigits:d});
const cmvColor=c=>c<.30?'#2D6E47':c<.35?'#B8860B':c<.40?'#E8914B':'#E8614B';
const cmvLabel=c=>c<.30?'Excelente':c<.35?'Bom':c<.40?'Atenção':'Alto';

function calcFicha(ficha,ingredientes,fichas){
  const itens=(ficha.itens||[]).map(it=>{const ref=it.tipo==='ficha'?fichas.find(f=>f.nome===it.nomeRef):ingredientes.find(i=>i.nome===it.nomeRef);if(!ref)return{...it,custo:0,pesoFinal:0};const precoKg=it.tipo==='ficha'?(ref._custoPorKg||0):(ref.p||0);const fc=it.tipo==='ficha'?1:(ref.fc||1);const fk=it.tipo==='ficha'?1:(ref.fk||1);const qtdLiq=Number(it.qtdLiquida)||0;const custo=qtdLiq*fc*precoKg;const pesoFinal=qtdLiq*fk;return{...it,custo,pesoFinal,precoKg,fc};});
  const custoTotal=itens.reduce((s,i)=>s+i.custo,0)*(1+(Number(ficha.margemSeguranca)||0));
  const pesoFinal=itens.reduce((s,i)=>s+i.pesoFinal,0);
  return{...ficha,itens,custoTotal,pesoFinal,_custoPorKg:pesoFinal>0?custoTotal/pesoFinal:0};
}
function calcPrato(prato,ingredientes,fichasCalc){
  const comps=(prato.componentes||[]).map(c=>{const ref=c.tipo==='ficha'?fichasCalc.find(f=>f.nome===c.nomeRef):ingredientes.find(i=>i.nome===c.nomeRef);if(!ref)return{...c,custo:0};const custoPorKg=c.tipo==='ficha'?(ref._custoPorKg||0):(ref.p||0);const fc=c.tipo==='ficha'?1:(ref.fc||1);const custo=((Number(c.qtdGramas)||0)/1000)*fc*custoPorKg;return{...c,custo,custoPorKg};});
  const custoTotal=comps.reduce((s,c)=>s+c.custo,0);const preco=Number(prato.precoVenda||0);const cmv=preco>0?custoTotal/preco:0;
  return{...prato,comps,custoTotal,cmv};
}
function calcAllFichas(fichasRaw,ingredientes){
  const resolved=[];const nameMap=new Map();
  const resolve=f=>{if(nameMap.has(f.nome))return nameMap.get(f.nome);const calc=calcFicha(f,ingredientes,resolved);resolved.push(calc);nameMap.set(f.nome,calc);return calc;};
  const pending=[...fichasRaw];let mx=50;
  while(pending.length>0&&mx-->0){const before=pending.length;for(let i=pending.length-1;i>=0;i--){const f=pending[i];const deps=(f.itens||[]).filter(it=>it.tipo==='ficha').map(it=>it.nomeRef);if(deps.every(d=>nameMap.has(d))){resolve(f);pending.splice(i,1);}}if(pending.length===before){pending.forEach(f=>resolve(f));break;}}
  return resolved;
}

const STYLE=`
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--lima:#C5D943;--verde:#2D6E47;--azul:#2E7DD1;--coral:#E8614B;--preto:#111614;--cinzaF:#F0F0EA;--cinzaM:#DDDDD5;--cinzaE:#888882;--branco:#FFFFFF;--ff:'Barlow Condensed',sans-serif;--fb:'Barlow',sans-serif}
html,body{height:100%;font-family:var(--fb);background:var(--cinzaF);color:var(--preto)}
input{font-size:16px;border:1.5px solid var(--cinzaM);border-radius:10px;padding:14px 16px;background:var(--branco);outline:none;width:100%;font-family:var(--fb);color:var(--preto)}
input:focus{border-color:var(--verde);box-shadow:0 0 0 3px rgba(45,110,71,.12)}
button{cursor:pointer;border:none;background:none;font-family:var(--fb)}
.p-card{background:var(--branco);border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,.06);overflow:hidden}
.p-kpi{background:var(--preto);border-radius:12px;padding:16px 18px;border-left:4px solid var(--lima);flex:1 1 140px;min-width:130px}
.p-kpi-l{font-family:var(--ff);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px}
.p-kpi-v{font-family:var(--ff);font-size:20px;font-weight:700;line-height:1}
.p-row{padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:background .15s;border-bottom:1px solid var(--cinzaF)}
.p-row:hover{background:#F7F7F3}
.p-overlay{position:fixed;inset:0;background:rgba(17,22,20,.5);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px}
.p-sheet{background:var(--branco);width:100%;max-width:560px;max-height:90vh;overflow:auto;border-radius:16px}
.p-shdr{position:sticky;top:0;background:var(--branco);z-index:1;padding:16px 20px;border-bottom:1px solid var(--cinzaM);display:flex;align-items:center;justify-content:space-between}
.p-close{width:36px;height:36px;border-radius:50%;background:var(--cinzaF);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--cinzaE)}
@media(max-width:600px){.p-sheet{max-width:100%;border-radius:18px 18px 0 0;max-height:94vh}.p-overlay{align-items:flex-end;padding:0}}
`;

function Modal({title,onClose,children}){useEffect(()=>{document.body.style.overflow='hidden';return()=>{document.body.style.overflow=''};},[]);return(<div className="p-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="p-sheet"><div className="p-shdr"><span style={{fontFamily:'var(--ff)',fontSize:20,fontWeight:700,color:'var(--verde)'}}>{title}</span><button className="p-close" onClick={onClose}>✕</button></div><div style={{padding:'18px 20px'}}>{children}</div></div></div>);}

// ── LOGIN DO PORTAL ───────────────────────────────────────────────
function PortalLogin({clienteId,onLogin}){
  const[senha,setSenha]=useState('');const[err,setErr]=useState('');const[loading,setLoad]=useState(false);const[info,setInfo]=useState(null);
  useEffect(()=>{(async()=>{try{const data=await sbGet(`fin_portal_clientes?id=eq.${clienteId}&ativo=eq.true`);if(data[0])setInfo(data[0]);else setErr('Portal não encontrado.');}catch{setErr('Erro ao conectar.');}})();},[clienteId]);
  const entrar=()=>{if(!info)return;setLoad(true);setErr('');if(senha===info.senha_hash){onLogin(info);}else{setErr('Senha incorreta');setLoad(false);}};
  return(<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'linear-gradient(135deg,#111614 0%,#1a2418 50%,#111614 100%)'}}>
    <div style={{width:'100%',maxWidth:380,textAlign:'center'}}>
      <div style={{marginBottom:24}}>
        <svg width={56} height={72} viewBox="0 0 44 56" fill="none" style={{margin:'0 auto'}}><ellipse cx="22" cy="28" rx="19" ry="26" stroke="#C5D943" strokeWidth="2"/><path d="M16 16 Q21 13 26 17 Q30 21 26 27 Q22 32 18 37 Q15 41 20 44 Q24 46 28 43" stroke="#C5D943" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
        <div style={{fontFamily:'var(--ff)',fontSize:28,fontWeight:800,color:'#C5D943',letterSpacing:'.08em',marginTop:8}}>ZESTE</div>
        <div style={{fontSize:11,color:'#888',letterSpacing:'.15em',marginTop:4}}>PORTAL DO CLIENTE</div>
      </div>
      {info&&<div style={{background:'#1a1a17',borderRadius:14,padding:24,border:'1px solid #2a2a28'}}>
        <div style={{fontFamily:'var(--ff)',fontSize:22,fontWeight:700,color:'#F2EBD8',marginBottom:4}}>{info.nome_display}</div>
        <div style={{fontSize:12,color:'#888',marginBottom:20}}>Acesso exclusivo às suas fichas técnicas e pratos</div>
        <input type="password" placeholder="Digite a senha de acesso" value={senha} onChange={e=>setSenha(e.target.value)} onKeyDown={e=>e.key==='Enter'&&entrar()} style={{background:'#222',border:'1.5px solid #333',color:'#E8E0CC',marginBottom:14}}/>
        {err&&<div style={{fontSize:13,color:'#E8614B',marginBottom:12}}>{err}</div>}
        <button onClick={entrar} disabled={loading||!senha} style={{width:'100%',background:'#C5D943',color:'#111',borderRadius:10,padding:'14px 20px',fontWeight:700,fontSize:15,letterSpacing:'.05em',opacity:loading?.5:1}}>{loading?'Entrando…':'ENTRAR'}</button>
      </div>}
      {!info&&!err&&<div style={{color:'#888',fontSize:14}}>Carregando…</div>}
      {!info&&err&&<div style={{color:'#E8614B',fontSize:14}}>{err}</div>}
      <div style={{fontSize:10,color:'#555',marginTop:20}}>Zeste Consultoria Gastronômica</div>
    </div>
  </div>);
}

// ── PORTAL PRINCIPAL ──────────────────────────────────────────────
function PortalView({clienteInfo}){
  const[ingredientes,setIngredientes]=useState([]);const[fichasCalc,setFichasCalc]=useState([]);const[pratosCalc,setPratosCalc]=useState([]);
  const[loading,setLoading]=useState(true);const[detail,setDetail]=useState(null);const[tab,setTab]=useState('pratos');

  useEffect(()=>{(async()=>{
    const[ings,fics,prts]=await Promise.all([
      sbGet('fin_ingredientes?order=created_at.desc'),
      sbGet(`fin_fichas?deleted_at=is.null&order=created_at.desc`),
      sbGet(`fin_pratos?deleted_at=is.null&order=created_at.desc`),
    ]);
    const ingList=Array.isArray(ings)?ings.map(r=>r.dados||r):[];
    const ficList=Array.isArray(fics)?fics.filter(f=>f.cliente_id===clienteInfo.cliente_id||f.cliente_id==='zeste').map(r=>r.dados||r):[];
    const prtList=Array.isArray(prts)?prts.filter(p=>p.cliente_id===clienteInfo.cliente_id||p.cliente_id==='zeste').map(r=>r.dados||r):[];
    setIngredientes(ingList);
    const ficCalc=calcAllFichas(ficList,ingList);
    setFichasCalc(ficCalc);
    setPratosCalc(prtList.map(p=>calcPrato(p,ingList,ficCalc)));
    setLoading(false);
  })();},[]);

  const clientePratos=pratosCalc.filter(p=>(p._cliente||p.categoria||'').toLowerCase().includes(clienteInfo.cliente_id.toLowerCase()));
  const zestePratos=pratosCalc.filter(p=>!(p._cliente||p.categoria||'').toLowerCase().includes(clienteInfo.cliente_id.toLowerCase()));
  const clienteFichas=fichasCalc.filter(f=>(f._cliente||'').toLowerCase().includes(clienteInfo.cliente_id.toLowerCase()));

  if(loading)return(<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--cinzaF)'}}><div style={{textAlign:'center'}}><div style={{fontFamily:'var(--ff)',fontSize:32,fontWeight:800,color:'var(--verde)'}}>ZESTE</div><div style={{color:'var(--cinzaE)',fontSize:13,marginTop:4}}>Carregando suas fichas…</div></div></div>);

  return(<div style={{minHeight:'100vh',background:'var(--cinzaF)'}}>
    {/* Header */}
    <div style={{background:'var(--preto)',padding:'16px 20px',position:'sticky',top:0,zIndex:100}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <svg width={24} height={30} viewBox="0 0 44 56" fill="none"><ellipse cx="22" cy="28" rx="19" ry="26" stroke="#C5D943" strokeWidth="2.5"/><path d="M16 16 Q21 13 26 17 Q30 21 26 27 Q22 32 18 37 Q15 41 20 44 Q24 46 28 43" stroke="#C5D943" strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg>
          <div><div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:800,color:'#C5D943',letterSpacing:'.06em'}}>ZESTE</div><div style={{fontSize:9,color:'#888',letterSpacing:'.1em'}}>PORTAL · {clienteInfo.nome_display.toUpperCase()}</div></div>
        </div>
      </div>
      {/* Tabs */}
      <div style={{display:'flex',gap:0,marginTop:12,borderTop:'1px solid #2a2a28',paddingTop:8}}>
        {[['pratos','🍽️ Pratos'],['fichas','📋 Fichas']].map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:'10px 0',fontFamily:'var(--ff)',fontSize:13,fontWeight:700,letterSpacing:'.08em',color:tab===id?'#C5D943':'#555',borderBottom:tab===id?'2px solid #C5D943':'2px solid transparent',background:'none'}}>{l}</button>
        ))}
      </div>
    </div>

    {/* Content */}
    <div style={{padding:'16px 16px 80px',maxWidth:700,margin:'0 auto'}}>
      {tab==='pratos'&&(<>
        {/* KPIs */}
        <div style={{display:'flex',gap:10,overflowX:'auto',marginBottom:20,paddingBottom:4}}>
          <div className="p-kpi" style={{borderColor:'var(--coral)'}}><div className="p-kpi-l" style={{color:'var(--coral)'}}>Pratos</div><div className="p-kpi-v" style={{color:'var(--coral)'}}>{clientePratos.length}</div></div>
          {clientePratos.some(p=>p.precoVenda>0)&&<>
            <div className="p-kpi" style={{borderColor:cmvColor(clientePratos.filter(p=>p.precoVenda>0).reduce((s,p)=>s+p.cmv,0)/(clientePratos.filter(p=>p.precoVenda>0).length||1))}}><div className="p-kpi-l" style={{color:'var(--cinzaE)'}}>CMV Médio</div><div className="p-kpi-v" style={{color:'var(--lima)'}}>{pct(clientePratos.filter(p=>p.precoVenda>0).reduce((s,p)=>s+p.cmv,0)/(clientePratos.filter(p=>p.precoVenda>0).length||1))}</div></div>
          </>}
        </div>

        {/* Pratos do cliente */}
        {clientePratos.length>0&&<div className="p-card" style={{marginBottom:20}}>
          {clientePratos.map((p,i)=>{const cc=cmvColor(p.cmv);return(
            <div key={p.id} className="p-row" style={{borderLeft:`4px solid ${cc}`,borderBottom:i<clientePratos.length-1?'1px solid var(--cinzaF)':'none'}} onClick={()=>setDetail(p)}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:700}}>{p.nome}</div>
                <div style={{display:'flex',gap:8,marginTop:4,fontSize:12,color:'var(--cinzaE)'}}>
                  <span>{(p.componentes||[]).length} componentes</span>
                  {p.precoVenda>0&&<span>· Venda {brl(p.precoVenda)}</span>}
                </div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:'var(--coral)'}}>{brl(p.custoTotal)}</div>
                {p.precoVenda>0&&<div style={{fontSize:12,fontWeight:700,color:cc}}>CMV {pct(p.cmv)}</div>}
              </div>
            </div>
          );})}
        </div>}
        {clientePratos.length===0&&<div style={{textAlign:'center',padding:40,color:'var(--cinzaE)',fontStyle:'italic'}}>Nenhum prato cadastrado para este cliente ainda.</div>}
      </>)}

      {tab==='fichas'&&(<>
        <div className="p-card">
          {clienteFichas.length===0&&fichasCalc.length>0&&<div style={{padding:20,textAlign:'center',color:'var(--cinzaE)'}}>Fichas base da Zeste disponíveis abaixo</div>}
          {(clienteFichas.length>0?clienteFichas:fichasCalc).map((f,i)=>(
            <div key={f.id} className="p-row" style={{borderBottom:i<(clienteFichas.length>0?clienteFichas:fichasCalc).length-1?'1px solid var(--cinzaF)':'none'}} onClick={()=>setDetail({...f,_isPrato:false})}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:700}}>{f.nome}</div>
                <div style={{fontSize:12,color:'var(--cinzaE)',marginTop:3}}>{(f.itens||[]).length} insumos · Peso final: {num(f.pesoFinal)}kg</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700,color:'var(--verde)'}}>{brl(f._custoPorKg)}</div>
                <div style={{fontSize:10,color:'var(--cinzaE)'}}>por kg</div>
              </div>
            </div>
          ))}
        </div>
      </>)}
    </div>

    {/* Detail modal */}
    {detail&&<Modal title={detail.nome} onClose={()=>setDetail(null)}>
      {detail.comps||detail.componentes?(/* PRATO */
        <div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
            <div className="p-kpi" style={{borderColor:'var(--coral)'}}><div className="p-kpi-l" style={{color:'var(--coral)'}}>Custo</div><div className="p-kpi-v" style={{color:'var(--coral)'}}>{brl(detail.custoTotal)}</div></div>
            {detail.precoVenda>0&&<><div className="p-kpi" style={{borderColor:'var(--lima)'}}><div className="p-kpi-l" style={{color:'var(--lima)'}}>Venda</div><div className="p-kpi-v" style={{color:'var(--lima)'}}>{brl(detail.precoVenda)}</div></div>
            <div className="p-kpi" style={{borderColor:cmvColor(detail.cmv)}}><div className="p-kpi-l" style={{color:cmvColor(detail.cmv)}}>CMV</div><div className="p-kpi-v" style={{color:cmvColor(detail.cmv)}}>{pct(detail.cmv)}</div></div></>}
          </div>
          <div style={{fontFamily:'var(--ff)',fontSize:12,fontWeight:700,color:'var(--cinzaE)',letterSpacing:'.1em',marginBottom:8}}>COMPONENTES</div>
          <div className="p-card">
            {(detail.comps||[]).map((c,i)=>(
              <div key={i} style={{padding:'12px 16px',borderBottom:i<detail.comps.length-1?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div><div style={{fontSize:14,fontWeight:600}}>{c.nomeRef}</div><div style={{fontSize:11,color:'var(--cinzaE)'}}>{c.tipo==='ficha'?'📋 Ficha':'🥬 Ingrediente'} · {c.qtdGramas}g</div></div>
                <div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700,color:'var(--verde)'}}>{brl(c.custo)}</div>
              </div>
            ))}
          </div>
          {detail.precoVenda>0&&<div style={{marginTop:14,background:cmvColor(detail.cmv)+'18',borderLeft:`3px solid ${cmvColor(detail.cmv)}`,borderRadius:8,padding:'12px 14px',fontSize:14,color:cmvColor(detail.cmv),fontWeight:600}}>
            CMV {pct(detail.cmv)} — {cmvLabel(detail.cmv)} · Lucro {brl(detail.precoVenda-detail.custoTotal)} por porção
          </div>}
        </div>
      ):(/* FICHA */
        <div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
            <div className="p-kpi" style={{borderColor:'var(--lima)'}}><div className="p-kpi-l" style={{color:'var(--lima)'}}>Custo Total</div><div className="p-kpi-v" style={{color:'var(--lima)'}}>{brl(detail.custoTotal)}</div></div>
            <div className="p-kpi" style={{borderColor:'var(--azul)'}}><div className="p-kpi-l" style={{color:'var(--azul)'}}>Custo/kg</div><div className="p-kpi-v" style={{color:'var(--azul)'}}>{brl(detail._custoPorKg)}</div></div>
            <div className="p-kpi" style={{borderColor:'var(--cinzaE)'}}><div className="p-kpi-l" style={{color:'var(--cinzaE)'}}>Peso Final</div><div className="p-kpi-v" style={{color:'#fff'}}>{num(detail.pesoFinal)}kg</div></div>
          </div>
          <div style={{fontFamily:'var(--ff)',fontSize:12,fontWeight:700,color:'var(--cinzaE)',letterSpacing:'.1em',marginBottom:8}}>COMPOSIÇÃO</div>
          <div className="p-card">
            {(detail.itens||[]).map((it,i)=>(
              <div key={i} style={{padding:'12px 16px',borderBottom:i<detail.itens.length-1?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div><div style={{fontSize:14,fontWeight:600}}>{it.nomeRef}</div><div style={{fontSize:11,color:'var(--cinzaE)'}}>{it.tipo==='ficha'?'📋 Sub-receita':'🥬 Ingrediente'} · {num(it.qtdLiquida||0,3)}kg</div></div>
                <div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700,color:'var(--verde)'}}>{brl(it.custo)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>}
  </div>);
}

// ── EXPORT ─────────────────────────────────────────────────────────
export default function PortalCliente({clienteId}){
  const[auth,setAuth]=useState(null);
  return(<>
    <style>{STYLE}</style>
    {!auth?<PortalLogin clienteId={clienteId} onLogin={setAuth}/>:<PortalView clienteInfo={auth}/>}
  </>);
}

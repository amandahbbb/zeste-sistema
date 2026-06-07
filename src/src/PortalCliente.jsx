import { useState, useEffect } from "react";

const SB_URL="https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
async function sbGet(path,token){const r=await fetch(`${SB_URL}/rest/v1/${path}`,{headers:{"apikey":SB_KEY,"Authorization":`Bearer ${token||SB_KEY}`}});return r.json();}

const brl=v=>v==null||isNaN(v)?'—':'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct=v=>v==null||isNaN(v)?'—':(v*100).toFixed(1)+'%';
const num=(v,d=1)=>v==null||isNaN(v)?'—':Number(v).toLocaleString('pt-BR',{maximumFractionDigits:d});
const cmvColor=c=>c<.30?'#2D6E47':c<.35?'#B8860B':c<.40?'#E8914B':'#E8614B';
const cmvLabel=c=>c<.30?'Excelente':c<.35?'Bom':c<.40?'Atenção':'Alto';

function calcFicha(ficha,ings,fichas){const itens=(ficha.itens||[]).map(it=>{const ref=it.tipo==='ficha'?fichas.find(f=>f.nome===it.nomeRef):ings.find(i=>i.nome===it.nomeRef);if(!ref)return{...it,custo:0,pesoFinal:0};const pk=it.tipo==='ficha'?(ref._custoPorKg||0):(ref.p||0);const fc=it.tipo==='ficha'?1:(ref.fc||1);const fk=it.tipo==='ficha'?1:(ref.fk||1);const q=Number(it.qtdLiquida)||0;return{...it,custo:q*fc*pk,pesoFinal:q*fk,precoKg:pk,fc};});const ct=itens.reduce((s,i)=>s+i.custo,0)*(1+(Number(ficha.margemSeguranca)||0));const pf=itens.reduce((s,i)=>s+i.pesoFinal,0);return{...ficha,itens,custoTotal:ct,pesoFinal:pf,_custoPorKg:pf>0?ct/pf:0};}
function calcPrato(p,ings,ficCalc){const comps=(p.componentes||[]).map(c=>{const ref=c.tipo==='ficha'?ficCalc.find(f=>f.nome===c.nomeRef):ings.find(i=>i.nome===c.nomeRef);if(!ref)return{...c,custo:0};const pk=c.tipo==='ficha'?(ref._custoPorKg||0):(ref.p||0);const fc=c.tipo==='ficha'?1:(ref.fc||1);return{...c,custo:((Number(c.qtdGramas)||0)/1000)*fc*pk,custoPorKg:pk};});const ct=comps.reduce((s,c)=>s+c.custo,0);const pr=Number(p.precoVenda||0);return{...p,comps,custoTotal:ct,cmv:pr>0?ct/pr:0};}
function calcAllFichas(raw,ings){const res=[];const nm=new Map();const rv=f=>{if(nm.has(f.nome))return nm.get(f.nome);const c=calcFicha(f,ings,res);res.push(c);nm.set(f.nome,c);return c;};const pend=[...raw];let mx=50;while(pend.length>0&&mx-->0){const b=pend.length;for(let i=pend.length-1;i>=0;i--){const f=pend[i];if((f.itens||[]).filter(it=>it.tipo==='ficha').every(it=>nm.has(it.nomeRef))){rv(f);pend.splice(i,1);}}if(pend.length===b){pend.forEach(rv);break;}}return res;}

const STYLE=`
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--lima:#C5D943;--verde:#2D6E47;--azul:#2E7DD1;--coral:#E8614B;--preto:#111614;--cinzaF:#F0F0EA;--cinzaM:#DDDDD5;--cinzaE:#888882;--branco:#FFFFFF;--ff:'Barlow Condensed',sans-serif;--fb:'Barlow',sans-serif;--safe:env(safe-area-inset-bottom,0px)}
html,body{height:100%;font-family:var(--fb);background:var(--cinzaF);color:var(--preto);overflow-x:hidden}
button{cursor:pointer;border:none;background:none;font-family:var(--fb)}
.pc-card{background:var(--branco);border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,.06);overflow:hidden}
.pc-kpi{background:var(--preto);border-radius:12px;padding:15px 17px;border-left:4px solid var(--lima);flex:1 1 130px;min-width:120px}
.pc-kpi-l{font-family:var(--ff);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px}
.pc-kpi-v{font-family:var(--ff);font-size:19px;font-weight:700;line-height:1}
.pc-row{padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:background .15s;border-bottom:1px solid var(--cinzaF);min-height:60px}
.pc-row:hover{background:#F7F7F3}
.pc-overlay{position:fixed;inset:0;background:rgba(17,22,20,.5);z-index:500;display:flex;align-items:flex-end;justify-content:center}
@media(min-width:600px){.pc-overlay{align-items:center;padding:16px}}
.pc-sheet{background:var(--branco);width:100%;max-width:560px;max-height:94vh;overflow:auto;border-radius:18px 18px 0 0}
@media(min-width:600px){.pc-sheet{border-radius:16px;max-height:90vh}}
.pc-shdr{position:sticky;top:0;background:var(--branco);z-index:1;padding:16px 20px;border-bottom:1px solid var(--cinzaM);display:flex;align-items:center;justify-content:space-between}
.pc-close{width:36px;height:36px;border-radius:50%;background:var(--cinzaF);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--cinzaE)}
.pc-nav{display:flex;background:var(--preto);overflow-x:auto;scrollbar-width:none}
.pc-nav::-webkit-scrollbar{display:none}
.pc-tab{flex:1;padding:13px 16px;font-family:var(--ff);font-size:13px;font-weight:700;letter-spacing:.1em;color:#555;text-align:center;position:relative;cursor:pointer;min-height:48px;display:flex;align-items:center;justify-content:center;white-space:nowrap}
.pc-tab.on{color:var(--lima)}.pc-tab.on::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--lima)}
.pc-sh{display:flex;align-items:center;gap:8px;margin:18px 0 10px}.pc-sh-bar{width:18px;height:3px;background:var(--lima)}.pc-sh-txt{font-family:var(--ff);font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--cinzaE);text-transform:uppercase}
`;

function Modal({title,onClose,children}){useEffect(()=>{document.body.style.overflow='hidden';return()=>{document.body.style.overflow=''};},[]);return(<div className="pc-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="pc-sheet"><div style={{width:36,height:4,background:'var(--cinzaM)',borderRadius:2,margin:'10px auto 2px'}}/><div className="pc-shdr"><span style={{fontFamily:'var(--ff)',fontSize:20,fontWeight:700,color:'var(--verde)'}}>{title}</span><button className="pc-close" onClick={onClose}>✕</button></div><div style={{padding:'18px 20px'}}>{children}</div></div></div>);}
const SH=({children})=><div className="pc-sh"><div className="pc-sh-bar"/><span className="pc-sh-txt">{children}</span></div>;

export default function PortalCliente({clienteInfo,token,onLogout}){
  const[ings,setIngs]=useState([]);const[ficCalc,setFicCalc]=useState([]);const[pratCalc,setPratCalc]=useState([]);
  const[loading,setLoading]=useState(true);const[tab,setTab]=useState('dashboard');const[detail,setDetail]=useState(null);
  const cid=clienteInfo.cliente_id;

  useEffect(()=>{(async()=>{
    const[ig,fi,pr]=await Promise.all([sbGet('fin_ingredientes',token),sbGet('fin_fichas?deleted_at=is.null',token),sbGet('fin_pratos?deleted_at=is.null',token)]);
    const ingL=Array.isArray(ig)?ig.map(r=>r.dados||r):[];
    const ficL=Array.isArray(fi)?fi.filter(f=>f.cliente_id===cid||f.cliente_id==='zeste').map(r=>r.dados||r):[];
    const prtL=Array.isArray(pr)?pr.filter(p=>p.cliente_id===cid||p.cliente_id==='zeste').map(r=>r.dados||r):[];
    setIngs(ingL);
    const fc=calcAllFichas(ficL,ingL);setFicCalc(fc);
    setPratCalc(prtL.map(p=>calcPrato(p,ingL,fc)));
    setLoading(false);
  })();},[]);

  const meusPratos=pratCalc.filter(p=>(p._cliente||p.categoria||'').toLowerCase().includes(cid.toLowerCase()));
  const cmvMedio=meusPratos.filter(p=>p.precoVenda>0).length>0?meusPratos.filter(p=>p.precoVenda>0).reduce((s,p)=>s+p.cmv,0)/meusPratos.filter(p=>p.precoVenda>0).length:0;
  const custoMedio=meusPratos.length>0?meusPratos.reduce((s,p)=>s+p.custoTotal,0)/meusPratos.length:0;
  const melhorPrato=meusPratos.filter(p=>p.precoVenda>0).sort((a,b)=>a.cmv-b.cmv)[0];
  const piorPrato=meusPratos.filter(p=>p.precoVenda>0).sort((a,b)=>b.cmv-a.cmv)[0];

  const TABS=[{id:'dashboard',icon:'📊',l:'Dashboard'},{id:'pratos',icon:'🍽️',l:'Pratos'},{id:'fichas',icon:'📋',l:'Fichas'},{id:'estoque',icon:'📦',l:'Estoque'}];

  if(loading)return(<><style>{STYLE}</style><div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--cinzaF)'}}><div style={{textAlign:'center'}}><div style={{fontFamily:'var(--ff)',fontSize:32,fontWeight:800,color:'var(--verde)'}}>ZESTE</div><div style={{color:'var(--cinzaE)',fontSize:13,marginTop:4}}>Carregando dados…</div></div></div></>);

  return(<><style>{STYLE}</style>
    {/* Header */}
    <div style={{background:'var(--preto)',position:'sticky',top:0,zIndex:100}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <svg width={22} height={28} viewBox="0 0 44 56" fill="none"><ellipse cx="22" cy="28" rx="19" ry="26" stroke="#C5D943" strokeWidth="2.5"/><path d="M16 16 Q21 13 26 17 Q30 21 26 27 Q22 32 18 37 Q15 41 20 44 Q24 46 28 43" stroke="#C5D943" strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg>
          <div><div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:800,color:'#C5D943',letterSpacing:'.06em'}}>ZESTE</div><div style={{fontSize:9,color:'#888',letterSpacing:'.1em'}}>{clienteInfo.nome_display.toUpperCase()}</div></div>
        </div>
        <button onClick={onLogout} style={{color:'#888',fontSize:12,padding:'8px 14px',border:'1px solid #333',borderRadius:8,letterSpacing:'.06em',fontWeight:600}}>SAIR</button>
      </div>
      <nav className="pc-nav">{TABS.map(t=>(<div key={t.id} className={`pc-tab${tab===t.id?' on':''}`} onClick={()=>setTab(t.id)}>{t.icon} {t.l}</div>))}</nav>
    </div>

    <div style={{padding:'16px 16px 80px',maxWidth:700,margin:'0 auto'}}>
      {/* DASHBOARD */}
      {tab==='dashboard'&&(<div>
        <div style={{fontFamily:'var(--ff)',fontSize:24,fontWeight:800,color:'var(--verde)',marginBottom:4}}>Olá, {clienteInfo.nome_display} 👋</div>
        <div style={{fontSize:13,color:'var(--cinzaE)',marginBottom:20}}>Resumo das suas fichas técnicas e CMV</div>
        <div style={{display:'flex',gap:10,overflowX:'auto',marginBottom:20,paddingBottom:4}}>
          <div className="pc-kpi" style={{borderColor:'var(--coral)'}}><div className="pc-kpi-l" style={{color:'var(--coral)'}}>Pratos</div><div className="pc-kpi-v" style={{color:'var(--coral)'}}>{meusPratos.length}</div></div>
          <div className="pc-kpi" style={{borderColor:cmvColor(cmvMedio)}}><div className="pc-kpi-l" style={{color:'var(--cinzaE)'}}>CMV Médio</div><div className="pc-kpi-v" style={{color:cmvColor(cmvMedio)}}>{pct(cmvMedio)}</div></div>
          <div className="pc-kpi" style={{borderColor:'var(--lima)'}}><div className="pc-kpi-l" style={{color:'var(--cinzaE)'}}>Custo Médio</div><div className="pc-kpi-v" style={{color:'var(--lima)'}}>{brl(custoMedio)}</div></div>
        </div>
        {melhorPrato&&<div style={{background:'#ECFDF5',borderLeft:'3px solid var(--verde)',borderRadius:8,padding:'12px 14px',marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--verde)',marginBottom:2}}>🏆 MELHOR CMV</div>
          <div style={{fontSize:15,fontWeight:700}}>{melhorPrato.nome} — <span style={{color:'var(--verde)'}}>{pct(melhorPrato.cmv)}</span></div>
          <div style={{fontSize:12,color:'var(--cinzaE)'}}>Custo {brl(melhorPrato.custoTotal)} · Venda {brl(melhorPrato.precoVenda)} · Lucro {brl(melhorPrato.precoVenda-melhorPrato.custoTotal)}</div>
        </div>}
        {piorPrato&&piorPrato.id!==melhorPrato?.id&&<div style={{background:'#FFF0ED',borderLeft:'3px solid var(--coral)',borderRadius:8,padding:'12px 14px',marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--coral)',marginBottom:2}}>⚠️ ATENÇÃO — CMV ALTO</div>
          <div style={{fontSize:15,fontWeight:700}}>{piorPrato.nome} — <span style={{color:'var(--coral)'}}>{pct(piorPrato.cmv)}</span></div>
          <div style={{fontSize:12,color:'var(--cinzaE)'}}>Custo {brl(piorPrato.custoTotal)} · Venda {brl(piorPrato.precoVenda)} · Lucro {brl(piorPrato.precoVenda-piorPrato.custoTotal)}</div>
        </div>}
        {meusPratos.filter(p=>p.precoVenda>0).length>0&&<><SH>CMV por Prato</SH><div className="pc-card">{meusPratos.filter(p=>p.precoVenda>0).map((p,i)=>{const cc=cmvColor(p.cmv);return(<div key={p.id} style={{padding:'12px 14px',borderBottom:i<meusPratos.length-1?'1px solid var(--cinzaF)':'none'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}><span style={{fontWeight:700,fontSize:14}}>{p.nome}</span><span style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:cc}}>{pct(p.cmv)} — {cmvLabel(p.cmv)}</span></div>
          <div style={{height:6,borderRadius:99,background:'var(--cinzaF)'}}><div style={{height:'100%',width:`${Math.min(100,p.cmv*100)}%`,background:cc,borderRadius:99}}/></div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontSize:11,color:'var(--cinzaE)'}}><span>Custo {brl(p.custoTotal)}</span><span>Venda {brl(p.precoVenda)}</span><span>Lucro {brl(p.precoVenda-p.custoTotal)}</span></div>
        </div>);})}
        </div></>}
      </div>)}

      {/* PRATOS */}
      {tab==='pratos'&&(<div>
        <SH>Seus Pratos</SH>
        <div className="pc-card">{meusPratos.length===0&&<div style={{padding:32,textAlign:'center',color:'var(--cinzaE)'}}>Nenhum prato cadastrado</div>}
          {meusPratos.map((p,i)=>{const cc=cmvColor(p.cmv);return(<div key={p.id} className="pc-row" style={{borderLeft:`4px solid ${cc}`}} onClick={()=>setDetail(p)}>
            <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700}}>{p.nome}</div><div style={{fontSize:12,color:'var(--cinzaE)',marginTop:3}}>{(p.componentes||[]).length} componentes{p.precoVenda>0?` · Venda ${brl(p.precoVenda)}`:''}</div></div>
            <div style={{textAlign:'right'}}><div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:'var(--coral)'}}>{brl(p.custoTotal)}</div>{p.precoVenda>0&&<div style={{fontSize:12,fontWeight:700,color:cc}}>CMV {pct(p.cmv)}</div>}</div>
          </div>);})}
        </div>
      </div>)}

      {/* FICHAS */}
      {tab==='fichas'&&(<div>
        <SH>Fichas Técnicas</SH>
        <div className="pc-card">{ficCalc.map((f,i)=>(<div key={f.id} className="pc-row" onClick={()=>setDetail({...f,_isFicha:true})}>
          <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700}}>{f.nome}</div><div style={{fontSize:12,color:'var(--cinzaE)',marginTop:3}}>{(f.itens||[]).length} insumos · Peso: {num(f.pesoFinal)}kg</div></div>
          <div style={{textAlign:'right'}}><div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700,color:'var(--verde)'}}>{brl(f._custoPorKg)}</div><div style={{fontSize:10,color:'var(--cinzaE)'}}>por kg</div></div>
        </div>))}</div>
      </div>)}

      {/* ESTOQUE */}
      {tab==='estoque'&&(<div>
        <SH>Estoque de Ingredientes</SH>
        {ings.filter(i=>(i.estoque||0)>0||(i.estoqueMin||0)>0).length>0?(
          <div className="pc-card">{ings.filter(i=>(i.estoque||0)>0||(i.estoqueMin||0)>0).map((i,idx,arr)=>{
            const p=i.estoqueMin>0?Math.min(1,(i.estoque||0)/i.estoqueMin):1;
            const cor=p<0.5?'var(--coral)':p<1?'#F59E0B':'var(--verde)';
            return(<div key={i.id} style={{padding:'12px 14px',borderBottom:idx<arr.length-1?'1px solid var(--cinzaF)':'none',display:'flex',alignItems:'center',gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600}}>{i.nome}</div>
                <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center'}}>
                  <span style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:cor}}>{num(i.estoque||0,2)} {i.un}</span>
                  {i.estoqueMin>0&&<span style={{fontSize:11,color:'var(--cinzaE)'}}>mín: {num(i.estoqueMin,2)}</span>}
                </div>
                {i.estoqueMin>0&&<div style={{height:4,borderRadius:99,background:'var(--cinzaF)',marginTop:4,maxWidth:200}}><div style={{height:'100%',width:`${Math.min(100,p*100)}%`,background:cor,borderRadius:99}}/></div>}
              </div>
              {p<1&&<span style={{fontSize:11,background:'#FFF0ED',color:'var(--coral)',padding:'3px 8px',borderRadius:4,fontWeight:700,fontFamily:'var(--ff)'}}>BAIXO</span>}
            </div>);})}
          </div>
        ):(<div style={{textAlign:'center',padding:40,color:'var(--cinzaE)'}}>Estoque ainda não configurado pela equipe Zeste.</div>)}
      </div>)}
    </div>

    {/* Modal detalhe */}
    {detail&&<Modal title={detail.nome} onClose={()=>setDetail(null)}>
      {detail._isFicha?(<div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
          <div className="pc-kpi" style={{borderColor:'var(--lima)'}}><div className="pc-kpi-l" style={{color:'var(--lima)'}}>Custo Total</div><div className="pc-kpi-v" style={{color:'var(--lima)'}}>{brl(detail.custoTotal)}</div></div>
          <div className="pc-kpi" style={{borderColor:'var(--azul)'}}><div className="pc-kpi-l" style={{color:'var(--azul)'}}>Custo/kg</div><div className="pc-kpi-v" style={{color:'var(--azul)'}}>{brl(detail._custoPorKg)}</div></div>
        </div>
        <SH>Composição</SH><div className="pc-card">{(detail.itens||[]).map((it,i)=>(<div key={i} style={{padding:'12px 16px',borderBottom:i<detail.itens.length-1?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between'}}><div><div style={{fontSize:14,fontWeight:600}}>{it.nomeRef}</div><div style={{fontSize:11,color:'var(--cinzaE)'}}>{it.tipo==='ficha'?'📋':'🥬'} {num(it.qtdLiquida||0,3)}kg</div></div><div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700,color:'var(--verde)'}}>{brl(it.custo)}</div></div>))}</div>
      </div>):(<div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
          <div className="pc-kpi" style={{borderColor:'var(--coral)'}}><div className="pc-kpi-l" style={{color:'var(--coral)'}}>Custo</div><div className="pc-kpi-v" style={{color:'var(--coral)'}}>{brl(detail.custoTotal)}</div></div>
          {detail.precoVenda>0&&<><div className="pc-kpi" style={{borderColor:'var(--lima)'}}><div className="pc-kpi-l" style={{color:'var(--lima)'}}>Venda</div><div className="pc-kpi-v" style={{color:'var(--lima)'}}>{brl(detail.precoVenda)}</div></div>
          <div className="pc-kpi" style={{borderColor:cmvColor(detail.cmv)}}><div className="pc-kpi-l" style={{color:cmvColor(detail.cmv)}}>CMV</div><div className="pc-kpi-v" style={{color:cmvColor(detail.cmv)}}>{pct(detail.cmv)}</div></div></>}
        </div>
        <SH>Componentes</SH><div className="pc-card">{(detail.comps||[]).map((c,i)=>(<div key={i} style={{padding:'12px 16px',borderBottom:i<detail.comps.length-1?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between'}}><div><div style={{fontSize:14,fontWeight:600}}>{c.nomeRef}</div><div style={{fontSize:11,color:'var(--cinzaE)'}}>{c.tipo==='ficha'?'📋':'🥬'} {c.qtdGramas}g</div></div><div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700,color:'var(--verde)'}}>{brl(c.custo)}</div></div>))}</div>
        {detail.precoVenda>0&&<div style={{marginTop:14,background:cmvColor(detail.cmv)+'18',borderLeft:`3px solid ${cmvColor(detail.cmv)}`,borderRadius:8,padding:'12px 14px',fontSize:14,color:cmvColor(detail.cmv),fontWeight:600}}>CMV {pct(detail.cmv)} — {cmvLabel(detail.cmv)} · Lucro {brl(detail.precoVenda-detail.custoTotal)} por porção</div>}
      </div>)}
    </Modal>}
  </>);
}

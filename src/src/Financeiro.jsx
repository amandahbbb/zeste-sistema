import { useState, useEffect, useCallback, useRef } from "react";

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{--lima:#C5D943;--verde:#2D6E47;--azul:#2E7DD1;--coral:#E8614B;--preto:#111614;--cinzaF:#F0F0EA;--cinzaM:#DDDDD5;--cinzaE:#888882;--branco:#FFFFFF;--amarelo:#F59E0B;--ff:'Barlow Condensed',sans-serif;--fb:'Barlow',sans-serif;--safe:env(safe-area-inset-bottom,0px);}
html,body,#root{height:100%;font-family:var(--fb)}body{background:var(--cinzaF);color:var(--preto);overflow-x:hidden}
input,select,textarea,button{font-family:var(--fb)}
input,select,textarea{font-size:15px;border:1.5px solid var(--cinzaM);border-radius:8px;padding:11px 13px;background:var(--branco);outline:none;width:100%;transition:border-color .15s,box-shadow .15s;color:var(--preto);-webkit-appearance:none;appearance:none;}
input:focus,select:focus,textarea:focus{border-color:var(--azul);box-shadow:0 0 0 3px rgba(46,125,209,.14)}
input[type=file]{display:none}button{cursor:pointer;border:none;background:none}
::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:var(--cinzaM);border-radius:3px}
.nav{background:var(--preto);display:flex;align-items:stretch;overflow-x:auto;scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.nav-item{padding:13px 16px;font-family:var(--ff);font-size:13px;font-weight:700;letter-spacing:.1em;color:#777;white-space:nowrap;position:relative;cursor:pointer;flex-shrink:0;transition:color .15s}
.nav-item.on{color:var(--lima)}.nav-item.on::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--lima)}
.nav-sep{width:1px;background:#252525;margin:10px 0;flex-shrink:0}
.sh{display:flex;align-items:center;gap:8px;margin:22px 0 12px}.sh-bar{width:18px;height:3px;background:var(--lima);flex-shrink:0}.sh-txt{font-family:var(--ff);font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--cinzaE);text-transform:uppercase}
.card{background:var(--branco);border-radius:12px;box-shadow:0 1px 6px rgba(0,0,0,.07);overflow:hidden}
.warn{background:#FFF0ED;border-left:3px solid var(--coral);border-radius:6px;padding:10px 12px;font-size:13px;color:var(--coral);font-weight:500;line-height:1.4}
.warn-y{background:#FFFBEB;border-left:3px solid var(--amarelo);border-radius:6px;padding:10px 12px;font-size:13px;color:#92400E;font-weight:500;line-height:1.4}
.tag{display:inline-block;padding:3px 8px;border-radius:4px;font-family:var(--ff);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.kpi{background:var(--preto);border-radius:12px;padding:15px 17px;border-left:4px solid var(--lima);flex:1 1 130px;min-width:125px;flex-shrink:0}
.kpi-l{font-family:var(--ff);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px}
.kpi-v{font-family:var(--ff);font-size:20px;font-weight:700;line-height:1}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:8px;padding:11px 18px;font-size:14px;font-weight:600;transition:filter .15s,transform .1s;white-space:nowrap;border:none}
.btn:active{transform:scale(.96)}.btn-p{background:var(--verde);color:var(--branco)}.btn-g{background:transparent;color:var(--verde);border:1.5px solid var(--verde)}.btn-d{background:var(--coral);color:var(--branco)}.btn-sm{padding:7px 13px;font-size:13px;border-radius:7px}.btn:hover{filter:brightness(1.08)}
.fab{position:fixed;bottom:calc(24px + var(--safe));right:18px;width:52px;height:52px;border-radius:50%;background:var(--lima);color:var(--preto);font-size:26px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(197,217,67,.45);z-index:150;transition:transform .15s;font-family:var(--ff)}
.fab:active{transform:scale(.9)}
.overlay{position:fixed;inset:0;background:rgba(17,22,20,.55);z-index:500;display:flex;align-items:flex-end;justify-content:center}
@media(min-width:768px){.overlay{align-items:center;padding:20px}}
.sheet{background:var(--branco);width:100%;max-height:96vh;overflow:auto;border-radius:18px 18px 0 0}
@media(min-width:768px){.sheet{border-radius:14px;max-width:600px;max-height:91vh}}
.mhdr{position:sticky;top:0;background:var(--branco);z-index:1;padding:15px 20px 13px;border-bottom:1px solid var(--cinzaM);display:flex;align-items:center;justify-content:space-between}
.mtitle{font-family:var(--ff);font-size:20px;font-weight:700;color:var(--verde)}.mclose{width:32px;height:32px;border-radius:50%;background:var(--cinzaF);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--cinzaE)}
.fld{display:flex;flex-direction:column;gap:6px}.flbl{font-size:11px;font-weight:700;color:var(--cinzaE);letter-spacing:.07em;text-transform:uppercase}
.fg{display:flex;flex-wrap:wrap;gap:13px}.fg>.fld{flex:1 1 100%}.fg>.fld.h{flex:1 1 calc(50% - 7px)}
.fee-box{background:var(--cinzaF);border-radius:8px;padding:11px 13px;border:1px solid var(--cinzaM);display:flex;flex-direction:column;gap:6px}
.fee-r{display:flex;justify-content:space-between;align-items:center;font-size:13px}
.fee-net{border-top:1px dashed var(--cinzaM);padding-top:7px;margin-top:3px;font-weight:700;font-size:15px}
.att-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:5px}
.att-thumb{width:68px;height:68px;border-radius:8px;object-fit:cover;border:2px solid var(--cinzaM);cursor:pointer}
.att-add{width:68px;height:68px;border-radius:8px;border:2px dashed var(--cinzaM);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:var(--cinzaE);font-size:10px;cursor:pointer;background:var(--cinzaF)}
.att-pdf{width:68px;height:68px;border-radius:8px;border:2px solid var(--cinzaM);background:var(--cinzaF);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer}
.tx{background:var(--branco);padding:13px 16px;display:flex;gap:11px;align-items:flex-start;cursor:pointer;transition:background .1s}
.tx:hover{background:#F7F7F3}.tx:active{background:var(--cinzaF)}
.bar-g{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.bar-w{width:100%;display:flex;gap:2px;align-items:flex-end;height:80px}
.bar{border-radius:3px 3px 0 0;transition:height .5s;min-height:2px}
@media(max-width:767px){.pc{padding:0 14px}.page{padding-bottom:84px}.kr{display:flex;gap:9px;overflow-x:auto;padding:14px 14px 2px;scrollbar-width:none}.kr::-webkit-scrollbar{display:none}}
@media(min-width:768px){.pc{padding:0 24px}.page{padding-bottom:48px}.kr{display:flex;flex-wrap:wrap;gap:11px;padding:14px 24px 2px}}
@media(min-width:1024px){.pc{padding:0 32px}.kr{padding:14px 32px 2px}}
@keyframes up{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fi{from{opacity:0}to{opacity:1}}
.au{animation:up .2s ease}.af{animation:fi .18s ease}
@media print{.no-print{display:none!important}.print-only{display:block!important}}
`;

const FORMAS={'PIX':{taxa:0,icon:'⚡',label:'PIX'},'DÉBITO':{taxa:.015,icon:'💳',label:'Débito'},'CRÉDITO 1X':{taxa:.026,icon:'💳',label:'Crédito 1x'},'CRÉDITO 2X':{taxa:.032,icon:'💳',label:'Crédito 2x'},'CRÉDITO 3X':{taxa:.038,icon:'💳',label:'Crédito 3x'},'CRÉDITO 4X':{taxa:.043,icon:'💳',label:'Crédito 4x'},'CRÉDITO 5X':{taxa:.047,icon:'💳',label:'Crédito 5x'},'CRÉDITO 6X':{taxa:.051,icon:'💳',label:'Crédito 6x'},'CRÉDITO 7-12X':{taxa:.059,icon:'💳',label:'Crédito 7-12x'},'BOLETO':{taxa:.02,icon:'📄',label:'Boleto'},'DINHEIRO':{taxa:0,icon:'💵',label:'Dinheiro'},'TED / DOC':{taxa:0,icon:'🏦',label:'TED / DOC'}};
const CATS=['HONORÁRIOS','SERV. TERCEIROS','SOFTWARES','DESP. ADMINISTRATIVAS','MARKETING','PRÓ-LABORE','INVESTIMENTO','OUTROS'];
const NATUREZAS=['DESPESA FIXA','DESPESA VARIÁVEL','INVESTIMENTO'];
const NAT_CLR={'DESPESA FIXA':{bg:'#1B3A5C',fg:'#FFF',label:'FIXA'},'DESPESA VARIÁVEL':{bg:'#6B3E9A',fg:'#FFF',label:'VARIÁVEL'},'INVESTIMENTO':{bg:'#B8860B',fg:'#FFF',label:'INVEST.'}};
const CAT_NAT={'HONORÁRIOS':'DESPESA FIXA','SERV. TERCEIROS':'DESPESA VARIÁVEL','SOFTWARES':'DESPESA FIXA','DESP. ADMINISTRATIVAS':'DESPESA FIXA','MARKETING':'DESPESA VARIÁVEL','PRÓ-LABORE':'DESPESA FIXA','INVESTIMENTO':'INVESTIMENTO','OUTROS':'DESPESA FIXA'};
const SUBS={'HONORÁRIOS':['CONSULTORIA OPERACIONAL','CONSULTORIA GERENCIAL','PRODUÇÃO DE MATERIAIS','TREINAMENTO / MENTORIA','DIAGNÓSTICO'],'SERV. TERCEIROS':['DESIGN / DIAGRAMAÇÃO','FOTOGRAFIA','PROGRAMAÇÃO','FREELANCER'],'SOFTWARES':['ASSINATURA','DOMÍNIO / HOSPEDAGEM','OUTROS'],'DESP. ADMINISTRATIVAS':['HONORÁRIOS CONTADOR','TELEFONE / INTERNET','MATERIAL DE ESCRITÓRIO','IMPOSTOS / TAXAS','OUTRAS'],'MARKETING':['IMPRESSÃO / MATERIAIS','REDES SOCIAIS','OUTROS'],'PRÓ-LABORE':['RETIRADA'],'INVESTIMENTO':['EQUIPAMENTOS','CURSOS / CAPACITAÇÃO','OUTROS'],'OUTROS':['OUTROS']};
const MS=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const SR=['RECEBIDO','A RECEBER','CANCELADO'];
const SD=['PAGO','PREVISTO','CANCELADO'];
const SPROJ={CONCLUÍDO:{bg:'var(--verde)',fg:'var(--branco)'},'EM ANDAMENTO':{bg:'var(--azul)',fg:'var(--branco)'},PROPOSTA:{bg:'var(--lima)',fg:'var(--preto)'},PAUSADO:{bg:'var(--cinzaE)',fg:'var(--branco)'},CANCELADO:{bg:'var(--coral)',fg:'var(--branco)'}};
const STC={RECEBIDO:{bg:'var(--verde)',fg:'var(--branco)'},'A RECEBER':{bg:'var(--azul)',fg:'var(--branco)'},PAGO:{bg:'var(--verde)',fg:'var(--branco)'},PREVISTO:{bg:'var(--cinzaM)',fg:'var(--cinzaE)'},CANCELADO:{bg:'var(--coral)',fg:'var(--branco)'}};
const PAGADORES=['AMANDA','BRUNA','ZESTE'];

const uid=()=>Math.random().toString(36).slice(2,9);
const td=()=>new Date().toISOString().split('T')[0];
const brl=n=>n==null||n===''?'—':'R$ '+Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const pp=n=>(Number(n)*100).toFixed(1)+'%';
const dbr=s=>s?s.split('-').reverse().join('/'):'—';
const mc=c=>{if(!c)return'—';const[y,m]=c.split('-');return`${MS[+m-1]}/${y}`};

async function compressImg(file){if(!file.type.startsWith('image/')){return new Promise(r=>{const fr=new FileReader();fr.onload=e=>r({type:'pdf',data:e.target.result,name:file.name});fr.readAsDataURL(file);});}return new Promise(r=>{const fr=new FileReader();fr.onload=e=>{const img=new Image();img.onload=()=>{const MAX=800;let{width:w,height:h}=img;if(w>MAX){h=h*MAX/w;w=MAX;}if(h>MAX){w=w*MAX/h;h=MAX;}const c=document.createElement('canvas');c.width=Math.round(w);c.height=Math.round(h);c.getContext('2d').drawImage(img,0,0,c.width,c.height);r({type:'image',data:c.toDataURL('image/jpeg',.72),name:file.name});};img.src=e.target.result;};fr.readAsDataURL(file);});}

const SK='zeste_financeiro';
function loadData(){
  // Migração automática de versões antigas
  try{
    const main=localStorage.getItem(SK);
    if(main)return JSON.parse(main);
    // tenta migrar de versões anteriores
    for(const old of ['zeste_fin_v4','zeste_fin_v3','zeste_fin_v2']){
      const v=localStorage.getItem(old);
      if(v){const d=JSON.parse(v);persistData(d);return d;}
    }
  }catch{}
  return INIT;
}
function persistData(d){try{localStorage.setItem(SK,JSON.stringify(d));}catch{}}

async function exportExcel(lancamentos,filename='zeste_lancamentos'){
  const XLSX=await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
  const rows=[
    ['Data','Tipo','Status','Descrição','Categoria','Subcategoria','Natureza','Cliente/Fornecedor','Projeto','Competência','Forma','Valor Bruto','Taxa R$','Valor Líquido','Valor Pago','Data Pago','Pagador','Reembolso','Obs'],
    ...lancamentos.map(l=>[l.dataDoc||'',l.tipo||'',l.status||'',l.descricao||'',l.categoria||'',l.subcategoria||'',l.natureza||'',l.clienteFornecedor||'',l.projeto||'',l.competencia||'',l.forma||'',+(l.vlrBruto||0),+(l.vlrTaxa||0),+(l.vlrLiquido||0),+(l.vlrPago||0),l.dataPago||'',l.pagador||'',l.reembolso||'',l.obs||''])
  ];
  const ws=XLSX.utils.aoa_to_sheet(rows);
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Lançamentos');
  XLSX.writeFile(wb,`${filename}_${td()}.xlsx`);
}

function exportPDF(lancamentos,titulo='Lançamentos Financeiros'){
  const total=lancamentos.reduce((s,l)=>{const v=+(l.vlrPago||l.vlrLiquido||l.vlrBruto)||0;return l.tipo==='RECEITA'?{...s,r:s.r+v}:{...s,d:s.d+v};},{r:0,d:0});
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:20px}
    h1{color:#2D6E47;font-size:20px;margin-bottom:2px}
    .sub{color:#888;font-size:10px;margin-bottom:16px}
    .kpis{display:flex;gap:16px;margin-bottom:16px}
    .kpi{background:#111;border-radius:8px;padding:10px 14px;border-left:3px solid #C5D943;min-width:120px}
    .kpi-l{color:#888;font-size:9px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}
    .kpi-v{color:#C5D943;font-size:16px;font-weight:700}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th{background:#111614;color:#C5D943;padding:7px 8px;text-align:left;font-size:10px;font-family:'Arial Narrow',sans-serif;letter-spacing:.08em}
    td{padding:5px 8px;border-bottom:1px solid #eee;font-size:11px}
    tr:nth-child(even){background:#fafaf8}
    .r{color:#2D6E47;font-weight:700}.d{color:#E8614B;font-weight:700}
    .badge{display:inline-block;padding:2px 6px;border-radius:3px;font-size:9px;font-weight:700}
    .pend{background:#FFFBEB;color:#92400E;border:1px solid #F59E0B}
    .conc{background:#ECFDF5;color:#065F46;border:1px solid #10B981}
    @media print{body{margin:0}}
  </style></head><body>
    <h1>ZESTE — ${titulo}</h1>
    <div class="sub">Gerado em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})} · ${lancamentos.length} lançamentos</div>
    <div class="kpis">
      <div class="kpi"><div class="kpi-l">Receitas</div><div class="kpi-v" style="color:#C5D943">R$ ${total.r.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div>
      <div class="kpi"><div class="kpi-l">Despesas</div><div class="kpi-v" style="color:#E8614B">R$ ${total.d.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div>
      <div class="kpi"><div class="kpi-l">Resultado</div><div class="kpi-v" style="color:${total.r-total.d>=0?'#C5D943':'#E8614B'}">R$ ${(total.r-total.d).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div>
    </div>
    <table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Pagador</th><th>Forma</th><th>Valor</th><th>Status</th><th>Reembolso</th></tr></thead>
    <tbody>${lancamentos.map(l=>{const v=+(l.vlrPago||l.vlrLiquido||l.vlrBruto)||0;const isR=l.tipo==='RECEITA';return`<tr><td>${dbr(l.dataDoc)}</td><td class="${isR?'r':'d'}">${l.tipo}</td><td>${l.descricao||''}</td><td>${l.categoria||''}</td><td>${l.pagador||'—'}</td><td>${l.forma||''}</td><td class="${isR?'r':'d'}">${isR?'+':'-'}R$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td><td>${l.status||''}</td><td>${l.reembolso?`<span class="badge ${l.reembolso==='PENDENTE'?'pend':'conc'}">${l.reembolso}</span>`:'—'}</td></tr>`;}).join('')}</tbody></table>
  </body></html>`;
  const w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(()=>w.print(),400);
}

const INIT={
  lancamentos:[
    {id:uid(),status:'RECEBIDO',tipo:'RECEITA',dataDoc:'2025-01-10',categoria:'HONORÁRIOS',subcategoria:'CONSULTORIA OPERACIONAL',descricao:'Diagnóstico 440 Restaurante',clienteFornecedor:'Bianca Bueno / 440',projeto:'440 – Setup Op',competencia:'2025-01',forma:'PIX',vlrBruto:5000,taxaPct:0,vlrTaxa:0,vlrLiquido:5000,dataPrevista:'2025-01-10',vlrPago:5000,dataPago:'2025-01-10',pagador:'ZESTE',reembolso:'',obs:'',anexos:[]},
    {id:uid(),status:'PAGO',tipo:'DESPESA',natureza:'DESPESA VARIÁVEL',dataDoc:'2025-01-08',categoria:'SERV. TERCEIROS',subcategoria:'DESIGN / DIAGRAMAÇÃO',descricao:'Arte cadernos operacionais',clienteFornecedor:'Freela Design',projeto:'440 – Setup Op',competencia:'2025-01',forma:'PIX',vlrBruto:800,taxaPct:0,vlrTaxa:0,vlrLiquido:800,dataPrevista:'2025-01-08',vlrPago:800,dataPago:'2025-01-08',pagador:'AMANDA',reembolso:'PENDENTE',obs:'',anexos:[]},
    {id:uid(),status:'PAGO',tipo:'DESPESA',natureza:'DESPESA FIXA',dataDoc:'2025-01-15',categoria:'SOFTWARES',subcategoria:'ASSINATURA',descricao:'Canva Pro',clienteFornecedor:'Canva',projeto:'Zeste Interno',competencia:'2025-01',forma:'CRÉDITO 1X',vlrBruto:90,taxaPct:.026,vlrTaxa:2.34,vlrLiquido:90,dataPrevista:'2025-01-15',vlrPago:90,dataPago:'2025-01-15',pagador:'BRUNA',reembolso:'CONCLUÍDO',obs:'',anexos:[]},
  ],
  lixeira:[],
  clientes:[{id:uid(),cliente:'Bianca Bueno',estabelecimento:'440 Restaurante & Café',projeto:'Setup Operacional Completo',inicio:'2024-10-01',prazo:'2025-02-28',statusProjeto:'CONCLUÍDO',vlrContratado:8500,vlrRecebido:8500,forma:'PIX',obs:'',anexos:[]}],
};

// ─── ATOMS ────────────────────────────────────────────────────────
const SH=({children})=><div className="sh"><div className="sh-bar"/><span className="sh-txt">{children}</span></div>;
function Btn({children,onClick,v='p',sm,disabled,icon,type='button'}){return <button type={type} onClick={onClick} disabled={disabled} className={`btn btn-${v}${sm?' btn-sm':''}`} style={{opacity:disabled?.4:1}}>{icon&&<span style={{fontSize:sm?13:15}}>{icon}</span>}{children}</button>;}
function Modal({title,onClose,children}){useEffect(()=>{document.body.style.overflow='hidden';return()=>{document.body.style.overflow='';};},[]);return(<div className="overlay af" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="sheet au"><div style={{width:36,height:4,background:'var(--cinzaM)',borderRadius:2,margin:'12px auto 3px'}}/><div className="mhdr"><span className="mtitle">{title}</span><button className="mclose" onClick={onClose}>✕</button></div><div style={{padding:'18px 20px 12px'}}>{children}</div><div style={{height:'calc(12px + var(--safe))'}}/></div></div>);}
function Fld({label,children,h}){return <div className="fld" style={{flex:h?'1 1 calc(50% - 7px)':'1 1 100%'}}><label className="flbl">{label}</label>{children}</div>;}

function FeeCalc({forma,vlrBruto,tipo}){if(tipo!=='RECEITA'||!vlrBruto||+vlrBruto===0)return null;const fd=FORMAS[forma]||{taxa:0};const taxa=fd.taxa;const vt=taxa*+vlrBruto;const vl=+vlrBruto-vt;if(taxa===0)return <div className="fee-box"><div className="fee-r"><span style={{color:'var(--cinzaE)'}}>Taxa {FORMAS[forma]?.label}</span><span className="tag" style={{background:'#E8F5EE',color:'var(--verde)'}}>0% — sem desconto</span></div><div className="fee-r fee-net"><span>Valor a receber</span><span style={{color:'var(--verde)',fontFamily:'var(--ff)',fontSize:18}}>{brl(+vlrBruto)}</span></div></div>;return(<div className="fee-box"><div className="fee-r"><span style={{color:'var(--cinzaE)'}}>Valor bruto</span><span>{brl(+vlrBruto)}</span></div><div className="fee-r"><span style={{color:'var(--coral)'}}>Taxa {pp(taxa)}</span><span style={{color:'var(--coral)'}}>− {brl(vt)}</span></div><div className="fee-r fee-net"><span>Valor líquido</span><span style={{color:'var(--verde)',fontFamily:'var(--ff)',fontSize:18}}>{brl(vl)}</span></div></div>);}

function Anexos({anexos=[],onChange}){const ref=useRef();const[prev,setPrev]=useState(null);const add=async(files)=>{const p=await Promise.all(Array.from(files).map(compressImg));onChange([...anexos,...p]);};return(<div><div className="att-grid">{anexos.map((a,i)=>(<div key={i} style={{position:'relative'}}>{a.type==='image'?<img src={a.data} className="att-thumb" alt="" onClick={()=>setPrev(a)}/>:<div className="att-pdf" onClick={()=>setPrev(a)}><span style={{fontSize:22}}>📄</span><span style={{fontSize:9,color:'var(--cinzaE)'}}>{(a.name||'').slice(0,10)}</span></div>}<button onClick={()=>onChange(anexos.filter((_,j)=>j!==i))} style={{position:'absolute',top:-6,right:-6,width:18,height:18,borderRadius:'50%',background:'var(--coral)',color:'var(--branco)',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button></div>))}<div className="att-add" onClick={()=>ref.current.click()}><span style={{fontSize:20}}>📎</span><span>Comprovante</span></div></div><input ref={ref} type="file" accept="image/*,application/pdf" capture="environment" multiple onChange={e=>add(e.target.files)}/>{prev&&(<Modal title={prev.name||'Comprovante'} onClose={()=>setPrev(null)}>{prev.type==='image'?<img src={prev.data} style={{width:'100%',borderRadius:8}} alt=""/>:<div style={{textAlign:'center',padding:32}}><span style={{fontSize:48}}>📄</span><p style={{marginTop:10,color:'var(--cinzaE)',marginBottom:14}}>{prev.name}</p><a href={prev.data} download={prev.name||'comprovante.pdf'} style={{color:'var(--azul)',fontWeight:600}}>⬇ Baixar PDF</a></div>}</Modal>)}</div>);}

// ─── FORM LANÇAMENTO ──────────────────────────────────────────────
const EL={status:'PAGO',tipo:'DESPESA',natureza:'DESPESA FIXA',dataDoc:td(),categoria:'OUTROS',subcategoria:'OUTROS',descricao:'',clienteFornecedor:'',projeto:'',competencia:'',forma:'PIX',vlrBruto:'',taxaPct:0,vlrTaxa:0,vlrLiquido:'',dataPrevista:td(),vlrPago:'',dataPago:td(),pagador:'ZESTE',reembolso:'',obs:'',anexos:[]};
function FormL({init,onSave,onClose}){
  const[f,setF]=useState(init||EL);
  const[catCustom,setCatCustom]=useState(!CATS.includes(init?.categoria)?init?.categoria||'':'');
  const[pagCustom,setPagCustom]=useState(!PAGADORES.includes(init?.pagador)&&init?.pagador?init.pagador:'');
  const S=(k,v)=>setF(p=>({...p,[k]:v}));
  useEffect(()=>{if(f.tipo==='RECEITA'){const fd=FORMAS[f.forma]||{taxa:0};const t=fd.taxa;const vt=f.vlrBruto?t*+f.vlrBruto:0;const vl=f.vlrBruto?+f.vlrBruto-vt:'';setF(p=>({...p,taxaPct:t,vlrTaxa:vt,vlrLiquido:vl}));};},[f.forma,f.vlrBruto,f.tipo]);
  useEffect(()=>{if(f.tipo==='RECEITA'&&!SR.includes(f.status))S('status','RECEBIDO');if(f.tipo==='DESPESA'&&!SD.includes(f.status))S('status','PAGO');},[f.tipo]);
  const sub=SUBS[f.categoria]||['OUTROS'];
  const catVal=CATS.includes(f.categoria)?f.categoria:'__custom';
  const pagVal=PAGADORES.includes(f.pagador)?f.pagador:'__custom';
  const submit=e=>{e.preventDefault();onSave({...f,id:f.id||uid()});};
  const needReembolso=f.tipo==='DESPESA';
  return(<form onSubmit={submit}><div className="fg">
    <Fld label="Tipo" h><select value={f.tipo} onChange={e=>S('tipo',e.target.value)}><option>RECEITA</option><option>DESPESA</option></select></Fld>
    <Fld label="Status" h><select value={f.status} onChange={e=>S('status',e.target.value)}>{(f.tipo==='RECEITA'?SR:SD).map(s=><option key={s}>{s}</option>)}</select></Fld>
    <Fld label="Data Documento" h><input type="date" value={f.dataDoc} onChange={e=>S('dataDoc',e.target.value)}/></Fld>
    <Fld label="Competência" h><input type="month" value={f.competencia} onChange={e=>S('competencia',e.target.value)}/></Fld>
    <Fld label="Categoria"><select value={catVal} onChange={e=>{const v=e.target.value;if(v==='__custom'){S('categoria','');setCatCustom('');}else{S('categoria',v);S('subcategoria',SUBS[v]?.[0]||'OUTROS');if(f.tipo==='DESPESA')S('natureza',CAT_NAT[v]||'DESPESA FIXA');setCatCustom('');}}}>
      {CATS.map(c=><option key={c}>{c}</option>)}<option value="__custom">✏️ Digitar categoria...</option>
    </select>{catVal==='__custom'&&<input style={{marginTop:6,border:'1.5px solid var(--azul)',borderRadius:8,padding:'9px 12px',fontSize:14,outline:'none'}} placeholder="Nome da categoria" value={f.categoria} onChange={e=>{S('categoria',e.target.value);setCatCustom(e.target.value);}}/>}</Fld>
    {CATS.includes(f.categoria)&&<Fld label="Subcategoria"><select value={f.subcategoria} onChange={e=>S('subcategoria',e.target.value)}>{sub.map(s=><option key={s}>{s}</option>)}</select></Fld>}
    {f.tipo==='DESPESA'&&(<Fld label="Natureza da Despesa"><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:4}}>{NATUREZAS.map(n=>{const nc=NAT_CLR[n];const sel=f.natureza===n;return <button key={n} type="button" onClick={()=>S('natureza',n)} style={{padding:'6px 13px',borderRadius:6,border:`1.5px solid ${nc.bg}`,background:sel?nc.bg:'transparent',color:sel?nc.fg:nc.bg,fontFamily:'var(--ff)',fontSize:12,fontWeight:700,letterSpacing:'.06em',transition:'all .15s'}}>{nc.label}</button>;})}
    {f.natureza==='DESPESA FIXA'&&<div style={{fontSize:11,color:'var(--cinzaE)',width:'100%',marginTop:2}}>Recorrente, independe do volume</div>}
    {f.natureza==='DESPESA VARIÁVEL'&&<div style={{fontSize:11,color:'#6B3E9A',width:'100%',marginTop:2}}>Custo direto ligado à entrega</div>}
    {f.natureza==='INVESTIMENTO'&&<div style={{fontSize:11,color:'#B8860B',width:'100%',marginTop:2}}>Gera retorno futuro</div>}
    </div></Fld>)}
    <Fld label="Descrição"><input required value={f.descricao} onChange={e=>S('descricao',e.target.value)} placeholder="Ex: Consultoria operacional cliente X"/></Fld>
    <Fld label="Cliente / Fornecedor" h><input value={f.clienteFornecedor} onChange={e=>S('clienteFornecedor',e.target.value)} placeholder="Nome"/></Fld>
    <Fld label="Projeto" h><input value={f.projeto} onChange={e=>S('projeto',e.target.value)} placeholder="Projeto"/></Fld>
    <Fld label="Forma de Pagamento" h><select value={f.forma} onChange={e=>S('forma',e.target.value)}>{Object.entries(FORMAS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></Fld>
    <Fld label={f.tipo==='RECEITA'?'Valor Bruto (R$)':'Valor (R$)'} h><input type="number" step="0.01" min="0" value={f.vlrBruto} onChange={e=>S('vlrBruto',e.target.value)} placeholder="0,00"/></Fld>
    {f.vlrBruto&&f.tipo==='RECEITA'&&<Fld label="Simulação de Taxa"><FeeCalc forma={f.forma} vlrBruto={f.vlrBruto} tipo={f.tipo}/></Fld>}
    {f.tipo==='DESPESA'&&<><Fld label="Valor Pago (R$)" h><input type="number" step="0.01" min="0" value={f.vlrPago??''} onChange={e=>S('vlrPago',e.target.value)} placeholder="0,00"/></Fld><Fld label="Data Pagamento" h><input type="date" value={f.dataPago} onChange={e=>S('dataPago',e.target.value)}/></Fld></>}
    {f.tipo==='RECEITA'&&<><Fld label="Data Prevista" h><input type="date" value={f.dataPrevista} onChange={e=>S('dataPrevista',e.target.value)}/></Fld><Fld label="Data Recebimento" h><input type="date" value={f.dataPago} onChange={e=>S('dataPago',e.target.value)}/></Fld></>}

    {/* PAGADOR */}
    <Fld label="Pago por"><select value={pagVal} onChange={e=>{const v=e.target.value;if(v==='__custom'){S('pagador','');setPagCustom('');}else{S('pagador',v);setPagCustom('');}}}>
      {PAGADORES.map(p=><option key={p}>{p}</option>)}<option value="__custom">✏️ Outro (digitar)...</option>
    </select>{pagVal==='__custom'&&<input style={{marginTop:6,border:'1.5px solid var(--azul)',borderRadius:8,padding:'9px 12px',fontSize:14,outline:'none'}} placeholder="Quem pagou?" value={f.pagador} onChange={e=>{S('pagador',e.target.value);setPagCustom(e.target.value);}}/>}</Fld>

    {/* REEMBOLSO — só aparece quando Amanda ou Bruna pagou */}
    {needReembolso&&(<Fld label="Reembolso">
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:4}}>
        {[['','Não aplicável','var(--cinzaM)','var(--cinzaE)'],['PENDENTE','⏳ Pendente','#F59E0B','#92400E'],['CONCLUÍDO','✅ Concluído','#10B981','#FFF']].map(([v,l,bg,fg])=>(
          <button key={v} type="button" onClick={()=>S('reembolso',v)}
            style={{padding:'7px 14px',borderRadius:6,border:`1.5px solid ${bg}`,background:f.reembolso===v?bg:'transparent',color:f.reembolso===v?fg:bg==='var(--cinzaM)'?'var(--cinzaE)':bg,fontFamily:'var(--ff)',fontSize:12,fontWeight:700,transition:'all .15s'}}>
            {l}
          </button>
        ))}
      </div>
      {f.reembolso==='PENDENTE'&&<div style={{marginTop:6,background:'#FFFBEB',borderLeft:'3px solid #F59E0B',borderRadius:6,padding:'8px 10px',fontSize:12,color:'#92400E'}}>⚠️ {f.pagador} pagou e ainda precisa ser reembolsado pela Zeste.</div>}
      {f.reembolso==='CONCLUÍDO'&&<div style={{marginTop:6,background:'#ECFDF5',borderLeft:'3px solid #10B981',borderRadius:6,padding:'8px 10px',fontSize:12,color:'#065F46'}}>✅ Reembolso já foi realizado.</div>}
    </Fld>)}

    <Fld label="Observações"><textarea rows={2} value={f.obs} onChange={e=>S('obs',e.target.value)} style={{resize:'vertical',minHeight:52}} placeholder="Informações adicionais…"/></Fld>
    <Fld label="Comprovantes / Anexos"><Anexos anexos={f.anexos} onChange={v=>S('anexos',v)}/></Fld>
  </div>
  <div style={{display:'flex',gap:9,justifyContent:'flex-end',marginTop:22,flexWrap:'wrap'}}>
    <Btn v="g" onClick={onClose}>Cancelar</Btn><Btn v="p" icon="✓" type="submit">Salvar</Btn>
  </div></form>);
}

// ─── FORM CLIENTE ─────────────────────────────────────────────────
const EC={cliente:'',estabelecimento:'',projeto:'',inicio:td(),prazo:'',statusProjeto:'PROPOSTA',vlrContratado:'',vlrRecebido:'',forma:'PIX',obs:'',anexos:[]};
function FormC({init,onSave,onClose}){const[f,setF]=useState(init||EC);const S=(k,v)=>setF(p=>({...p,[k]:v}));return(<form onSubmit={e=>{e.preventDefault();onSave({...f,id:f.id||uid()});}}><div className="fg"><Fld label="Nome do Cliente" h><input required value={f.cliente} onChange={e=>S('cliente',e.target.value)} placeholder="Nome"/></Fld><Fld label="Estabelecimento" h><input value={f.estabelecimento} onChange={e=>S('estabelecimento',e.target.value)} placeholder="Restaurante / Bar"/></Fld><Fld label="Projeto / Escopo"><input required value={f.projeto} onChange={e=>S('projeto',e.target.value)} placeholder="Descreva o escopo"/></Fld><Fld label="Status" h><select value={f.statusProjeto} onChange={e=>S('statusProjeto',e.target.value)}>{Object.keys(SPROJ).map(s=><option key={s}>{s}</option>)}</select></Fld><Fld label="Forma Pgto" h><select value={f.forma} onChange={e=>S('forma',e.target.value)}>{Object.entries(FORMAS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></Fld><Fld label="Início" h><input type="date" value={f.inicio} onChange={e=>S('inicio',e.target.value)}/></Fld><Fld label="Prazo Previsto" h><input type="date" value={f.prazo} onChange={e=>S('prazo',e.target.value)}/></Fld><Fld label="Valor Contratado (R$)" h><input type="number" step="0.01" value={f.vlrContratado} onChange={e=>S('vlrContratado',e.target.value)} placeholder="0,00"/></Fld><Fld label="Valor Recebido (R$)" h><input type="number" step="0.01" value={f.vlrRecebido} onChange={e=>S('vlrRecebido',e.target.value)} placeholder="0,00"/></Fld><Fld label="Observações"><textarea rows={2} value={f.obs} onChange={e=>S('obs',e.target.value)} style={{resize:'vertical',minHeight:52}}/></Fld><Fld label="Contrato / Documentos"><Anexos anexos={f.anexos} onChange={v=>S('anexos',v)}/></Fld></div><div style={{display:'flex',gap:9,justifyContent:'flex-end',marginTop:22}}><Btn v="g" onClick={onClose}>Cancelar</Btn><Btn v="p" icon="✓" type="submit">Salvar</Btn></div></form>);}
function DelModal({msg,onConfirm,onClose}){return <Modal title="Confirmar exclusão" onClose={onClose}><p style={{color:'var(--cinzaE)',marginBottom:20,lineHeight:1.5}}>{msg}</p><div style={{display:'flex',gap:9,justifyContent:'flex-end'}}><Btn v="g" onClick={onClose}>Cancelar</Btn><Btn v="d" onClick={onConfirm} icon="🗑">Excluir</Btn></div></Modal>;}

// ─── IMPORTAR EXCEL ───────────────────────────────────────────────
function ImportarExcel({onImport,onClose}){
  const[preview,setPreview]=useState(null);const[mapeamento,setMapeamento]=useState({data:'',descricao:'',valor:'',tipo:''});const[colunas,setColunas]=useState([]);const[importando,setImportando]=useState(false);const[ok,setOk]=useState(false);
  const handleFile=async(e)=>{const file=e.target.files[0];if(!file)return;const XLSX=await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");const buf=await file.arrayBuffer();const wb=XLSX.read(buf);const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{header:1});const headers=rows[0].map(String);const data=rows.slice(1).filter(r=>r.some(c=>c!==undefined&&c!=='')).slice(0,5);setColunas(headers);setPreview({headers,data,allRows:rows.slice(1).filter(r=>r.some(c=>c!==undefined&&c!==''))});const find=(terms)=>headers.find(h=>terms.some(t=>h.toLowerCase().includes(t)))||'';setMapeamento({data:find(['data','date','dt']),descricao:find(['descri','hist','memo']),valor:find(['valor','value','amount','vlr']),tipo:find(['tipo','type','dc','cr','deb','cred'])});};
  const confirmar=async()=>{if(!preview||!mapeamento.data||!mapeamento.descricao||!mapeamento.valor)return;setImportando(true);const idx={data:preview.headers.indexOf(mapeamento.data),descricao:preview.headers.indexOf(mapeamento.descricao),valor:preview.headers.indexOf(mapeamento.valor),tipo:mapeamento.tipo?preview.headers.indexOf(mapeamento.tipo):-1};const lancamentos=preview.allRows.map(r=>{const raw=r[idx.valor];const valor=Math.abs(parseFloat(String(raw).replace(/[^\d,.-]/g,'').replace(',','.')));if(!valor||isNaN(valor))return null;let tipo='despesa';if(idx.tipo>=0){const t=String(r[idx.tipo]||'').toLowerCase();if(t.includes('c')||t.includes('entrada')||t.includes('cred'))tipo='receita';}else if(parseFloat(String(raw).replace(',','.'))<0)tipo='despesa';else tipo='receita';const dataRaw=r[idx.data];let data=td();if(dataRaw){const d=new Date(dataRaw);if(!isNaN(d))data=d.toISOString().split('T')[0];else data=String(dataRaw).split('/').reverse().join('-').padStart(10,'0')||td();}return{tipo:tipo.toUpperCase(),status:tipo==='receita'?'RECEBIDO':'PAGO',dataDoc:data,descricao:String(r[idx.descricao]||'Importado').slice(0,100),valor,categoria:'OUTROS',natureza:'DESPESA FIXA',origem:'excel',pagador:'ZESTE',reembolso:'',obs:'',anexos:[]};}).filter(Boolean);await onImport(lancamentos);setOk(true);setTimeout(()=>{setOk(false);onClose();},2000);setImportando(false);};
  return(<div style={{padding:'0 0 12px'}}>
    <p style={{fontSize:13,color:'var(--cinzaE)',marginBottom:16,lineHeight:1.6}}>Faça upload do extrato bancário em .xlsx. O sistema detecta as colunas automaticamente.</p>
    <input type="file" id="xlsxFile" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{display:'none'}}/>
    <label htmlFor="xlsxFile" style={{display:'inline-flex',alignItems:'center',gap:8,background:'var(--azul)',color:'#fff',padding:'10px 18px',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:600}}>📂 Selecionar arquivo .xlsx</label>
    {preview&&(<div style={{marginTop:16}}>
      <div style={{fontSize:11,fontWeight:700,color:'var(--cinzaE)',marginBottom:10,textTransform:'uppercase'}}>Mapeamento de colunas</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        {[['Data *','data'],['Descrição *','descricao'],['Valor *','valor'],['Tipo (C/D)','tipo']].map(([l,k])=>(<div key={k}><div style={{fontSize:11,fontWeight:700,color:'var(--cinzaE)',marginBottom:4,textTransform:'uppercase'}}>{l}</div><select value={mapeamento[k]} onChange={e=>setMapeamento(m=>({...m,[k]:e.target.value}))} style={{border:'1.5px solid var(--cinzaM)',borderRadius:8,padding:'9px 11px',fontSize:13,width:'100%',outline:'none'}}><option value="">— selecionar —</option>{colunas.map(c=><option key={c}>{c}</option>)}</select></div>))}
      </div>
      <div style={{fontSize:11,color:'var(--cinzaE)',marginBottom:8,textTransform:'uppercase',fontWeight:700}}>Preview ({Math.min(5,preview.data.length)} linhas)</div>
      <div style={{overflowX:'auto',marginBottom:14}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}><thead><tr>{preview.headers.map(h=><th key={h} style={{padding:'5px 7px',background:'var(--cinzaF)',color:'var(--cinzaE)',textAlign:'left',border:'1px solid var(--cinzaM)',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead><tbody>{preview.data.map((r,i)=><tr key={i}>{preview.headers.map((_,j)=><td key={j} style={{padding:'4px 7px',border:'1px solid var(--cinzaM)',whiteSpace:'nowrap'}}>{String(r[j]||'')}</td>)}</tr>)}</tbody></table></div>
      <button className="btn btn-p" onClick={confirmar} disabled={importando||!mapeamento.data||!mapeamento.descricao||!mapeamento.valor} style={{width:'100%',opacity:importando?.5:1}}>{importando?'IMPORTANDO…':`IMPORTAR ${preview.allRows.length} LANÇAMENTOS`}</button>
    </div>)}
    {ok&&<div style={{textAlign:'center',color:'var(--verde)',fontSize:13,fontWeight:700,marginTop:12}}>✅ Importação concluída!</div>}
  </div>);
}


// ─── LIXEIRA ──────────────────────────────────────────────────────
function LixeiraModal({lixeira,onRestore,onPurge,onClose}){
  return(<Modal title={`Lixeira (${lixeira.length})`} onClose={onClose}>
    {lixeira.length===0&&<div style={{textAlign:'center',padding:32,color:'var(--cinzaE)',fontStyle:'italic'}}>Lixeira vazia</div>}
    {lixeira.map(l=>{const vlr=+(l.vlrPago||l.vlrLiquido||l.vlrBruto)||0;const isR=l.tipo==='RECEITA';return(<div key={l.id} style={{padding:'12px 0',borderBottom:'1px solid var(--cinzaF)',display:'flex',alignItems:'center',gap:10}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--preto)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.descricao}</div>
        <div style={{fontSize:11,color:'var(--cinzaE)',marginTop:2}}>{dbr(l.dataDoc)} · {l.categoria} · <span style={{color:isR?'var(--verde)':'var(--coral)',fontWeight:700}}>{isR?'+':'-'}{brl(vlr)}</span></div>
        <div style={{fontSize:10,color:'var(--cinzaE)',marginTop:1}}>Deletado em {new Date(l.deletedAt).toLocaleDateString('pt-BR')}</div>
      </div>
      <div style={{display:'flex',gap:6,flexShrink:0}}>
        <button onClick={()=>onRestore(l.id)} style={{background:'#ECFDF5',border:'1.5px solid #10B981',borderRadius:6,padding:'6px 10px',fontSize:12,fontWeight:600,color:'#065F46',cursor:'pointer'}}>↩ Restaurar</button>
        <button onClick={()=>onPurge(l.id)} style={{background:'#FFF5F5',border:'1.5px solid var(--coral)',borderRadius:6,padding:'6px 10px',fontSize:12,color:'var(--coral)',cursor:'pointer'}}>✕</button>
      </div>
    </div>);})}
    {lixeira.length>0&&<div style={{marginTop:16,textAlign:'center'}}><button onClick={()=>{lixeira.forEach(l=>onPurge(l.id));}} style={{background:'#FFF5F5',border:'1.5px solid var(--coral)',borderRadius:8,padding:'9px 18px',fontSize:13,fontWeight:600,color:'var(--coral)',cursor:'pointer'}}>🗑 Esvaziar lixeira</button></div>}
  </Modal>);
}

// ─── RESUMO ───────────────────────────────────────────────────────
function Resumo({lancamentos,setAba}){
  const rec=lancamentos.filter(l=>l.tipo==='RECEITA'&&l.status==='RECEBIDO');
  const des=lancamentos.filter(l=>l.tipo==='DESPESA'&&l.status==='PAGO');
  const ar=lancamentos.filter(l=>l.status==='A RECEBER');
  const prev=lancamentos.filter(l=>l.status==='PREVISTO');
  const tR=rec.reduce((s,l)=>s+(+(l.vlrPago||l.vlrLiquido)||0),0);
  const tD=des.reduce((s,l)=>s+(+(l.vlrPago)||0),0);
  const res=tR-tD;
  const tAR=ar.reduce((s,l)=>s+(+(l.vlrBruto)||0),0);
  const mg=tR>0?res/tR:0;
  const reembolsosPend=lancamentos.filter(l=>l.reembolso==='PENDENTE');
  const tReembolso=reembolsosPend.reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0);
  const alertas=lancamentos.filter(l=>{if(!l.dataPrevista||l.status==='RECEBIDO'||l.status==='PAGO')return false;const d=(new Date(l.dataPrevista)-new Date())/86400000;return d>=-1&&d<=7;});
  const porMes=MS.map((_,i)=>{const c=`${new Date().getFullYear()}-${String(i+1).padStart(2,'0')}`;const r=rec.filter(l=>l.competencia===c).reduce((s,l)=>s+(+(l.vlrPago||l.vlrLiquido)||0),0);const d=des.filter(l=>l.competencia===c).reduce((s,l)=>s+(+(l.vlrPago)||0),0);return{m:MS[i],r,d};}).filter(x=>x.r>0||x.d>0);
  const maxB=Math.max(...porMes.flatMap(m=>[m.r,m.d]),1);
  const porCat=Object.entries(CATS.concat([...new Set(des.map(l=>l.categoria).filter(c=>!CATS.includes(c)))]).reduce((a,cat)=>{const v=des.filter(l=>l.categoria===cat).reduce((s,l)=>s+(+(l.vlrPago)||0),0);return v>0?{...a,[cat]:v}:a;},{})).sort((a,b)=>b[1]-a[1]);
  const porPagador=PAGADORES.map(p=>({p,v:des.filter(l=>l.pagador===p).reduce((s,l)=>s+(+(l.vlrPago)||0),0)})).filter(x=>x.v>0);
  return(<div className="au page">
    {(alertas.length>0||reembolsosPend.length>0)&&<div className="pc" style={{paddingTop:14,display:'flex',flexDirection:'column',gap:8}}>
      {reembolsosPend.length>0&&<div className="warn-y" style={{cursor:'pointer'}} onClick={()=>setAba('lancamentos')}>💸 <strong>Reembolso pendente:</strong> {reembolsosPend.length} lançamento{reembolsosPend.length>1?'s':''} · total {brl(tReembolso)} — {reembolsosPend.map(l=>`${l.pagador}: ${l.descricao}`).join(' · ')}</div>}
      {alertas.map(a=>(<div key={a.id} className="warn" style={{cursor:'pointer'}} onClick={()=>setAba('lancamentos')}>⚠️ <strong>{a.tipo==='RECEITA'?'A receber':'A pagar'}:</strong> {a.descricao} — {brl(a.vlrBruto)} em {dbr(a.dataPrevista)}</div>))}
    </div>}
    <div className="kr">
      <div className="kpi" style={{borderColor:'var(--lima)'}}><div className="kpi-l" style={{color:'var(--lima)'}}>Receita recebida</div><div className="kpi-v" style={{color:'var(--lima)'}}>{brl(tR)}</div></div>
      <div className="kpi" style={{borderColor:'var(--coral)'}}><div className="kpi-l" style={{color:'var(--coral)'}}>Despesas pagas</div><div className="kpi-v" style={{color:'var(--coral)'}}>{brl(tD)}</div></div>
      <div className="kpi" style={{borderColor:res>=0?'var(--lima)':'var(--coral)'}}><div className="kpi-l" style={{color:'var(--cinzaE)'}}>Resultado</div><div className="kpi-v" style={{color:res>=0?'var(--lima)':'var(--coral)'}}>{brl(res)}</div></div>
      <div className="kpi" style={{borderColor:'#60A9E0'}}><div className="kpi-l" style={{color:'#60A9E0'}}>A receber</div><div className="kpi-v" style={{color:'#60A9E0'}}>{brl(tAR)}</div></div>
      <div className="kpi" style={{borderColor:reembolsosPend.length>0?'var(--amarelo)':'var(--cinzaE)'}}><div className="kpi-l" style={{color:reembolsosPend.length>0?'var(--amarelo)':'var(--cinzaE)'}}>Reembolsos pend.</div><div className="kpi-v" style={{color:reembolsosPend.length>0?'var(--amarelo)':'var(--cinzaM)'}}>{brl(tReembolso)}</div></div>
      <div className="kpi" style={{borderColor:'var(--lima)'}}><div className="kpi-l" style={{color:'var(--cinzaE)'}}>Margem líquida</div><div className="kpi-v" style={{color:mg>=.3?'var(--lima)':mg>=.1?'#FFD600':'var(--coral)'}}>{pp(mg)}</div></div>
    </div>
    <div className="pc">
      {porMes.length>0&&<><SH>Receitas vs Despesas</SH><div className="card" style={{padding:'18px 18px 14px',marginBottom:18}}><div style={{display:'flex',gap:9,alignItems:'flex-end',marginBottom:12}}>{porMes.map(({m,r,d})=>(<div className="bar-g" key={m}><div className="bar-w"><div className="bar" style={{flex:1,background:'var(--lima)',height:`${(r/maxB)*100}%`}}/><div className="bar" style={{flex:1,background:'var(--coral)',height:`${(d/maxB)*100}%`}}/></div><span style={{fontSize:9,color:'var(--cinzaE)',fontFamily:'var(--ff)',fontWeight:700}}>{m}</span></div>))}</div><div style={{display:'flex',gap:14}}>{[['var(--lima)','Receita'],['var(--coral)','Despesa']].map(([c,l])=>(<span key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--cinzaE)'}}><span style={{width:10,height:10,borderRadius:2,background:c,display:'inline-block'}}/>{l}</span>))}</div></div></>}
      {porPagador.length>0&&<><SH>Despesas por Pagador</SH><div className="card" style={{marginBottom:18}}>{porPagador.map(({p,v},i)=>{const pend=reembolsosPend.filter(l=>l.pagador===p).reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0);return(<div key={p} style={{padding:'12px 15px',borderBottom:i<porPagador.length-1?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontFamily:'var(--ff)',fontWeight:700,fontSize:14}}>{p}</div>{pend>0&&<div style={{fontSize:11,color:'#92400E'}}>⏳ Reembolso pendente: {brl(pend)}</div>}</div><div style={{fontFamily:'var(--ff)',fontSize:17,fontWeight:700,color:'var(--coral)'}}>{brl(v)}</div></div>);})}
      </div></>}
      {porCat.length>0&&<><SH>Despesas por Categoria</SH><div className="card" style={{marginBottom:20}}>{porCat.map(([cat,v],i)=>{const p=tD>0?v/tD:0;return(<div key={cat} style={{padding:'12px 15px',borderBottom:i<porCat.length-1?'1px solid var(--cinzaF)':'none'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontFamily:'var(--ff)',fontWeight:700,fontSize:13}}>{cat}</span><span style={{fontSize:11,color:'var(--cinzaE)',fontFamily:'var(--ff)'}}>{brl(v)} <span style={{color:'var(--coral)'}}>{pp(p)}</span></span></div><div style={{height:5,borderRadius:99,background:'var(--cinzaF)'}}><div style={{height:'100%',width:`${p*100}%`,background:'var(--coral)',borderRadius:99}}/></div></div>);})}</div></>}
    </div>
  </div>);
}

// ─── LANÇAMENTOS ──────────────────────────────────────────────────
function Lancamentos({lancamentos,setLancamentos,lixeira,setLixeira,openNew}){
  const[modal,setModal]=useState(null);const[del,setDel]=useState(null);const[showImport,setShowImport]=useState(false);const[showLixeira,setShowLixeira]=useState(false);
  const[ft,setFt]=useState({tipo:'',status:'',ano:'',mes:'',dia:'',pagador:'',reembolso:'',q:''});
  useEffect(()=>{openNew.current=()=>setModal('new');},[]);
  const anos=[...new Set(lancamentos.map(l=>l.dataDoc?.slice(0,4)).filter(Boolean))].sort().reverse();
  const lst=lancamentos.filter(l=>{
    if(ft.tipo&&l.tipo!==ft.tipo)return false;
    if(ft.status&&l.status!==ft.status)return false;
    if(ft.ano&&!l.dataDoc?.startsWith(ft.ano))return false;
    if(ft.mes&&!(l.competencia?.endsWith(`-${ft.mes}`)||l.dataDoc?.slice(5,7)===ft.mes))return false;
    if(ft.dia&&l.dataDoc?.slice(8,10)!==ft.dia)return false;
    if(ft.pagador&&l.pagador!==ft.pagador)return false;
    if(ft.reembolso&&l.reembolso!==ft.reembolso)return false;
    if(ft.q){const q=ft.q.toLowerCase();if(!l.descricao?.toLowerCase().includes(q)&&!l.clienteFornecedor?.toLowerCase().includes(q)&&!l.categoria?.toLowerCase().includes(q))return false;}
    return true;
  }).sort((a,b)=>(b.dataDoc||'').localeCompare(a.dataDoc||''));
  const save=item=>{setLancamentos(p=>p.some(l=>l.id===item.id)?p.map(l=>l.id===item.id?item:l):[item,...p]);setModal(null);};
  const softDelete=id=>{const item=lancamentos.find(l=>l.id===id);if(item){setLixeira(p=>[...p,{...item,deletedAt:new Date().toISOString()}]);setLancamentos(p=>p.filter(l=>l.id!==id));}setDel(null);};
  const tot=lst.reduce((s,l)=>s+(+(l.vlrPago||l.vlrLiquido||l.vlrBruto)||0),0);
  const importar=async(novos)=>{setLancamentos(p=>[...p,...novos.map(l=>({...l,id:uid()}))]);setShowImport(false);};
  return(<div className="au page"><div className="pc" style={{paddingTop:14,display:'flex',flexDirection:'column',gap:8}}>
    {/* Filtros */}
    <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
      <input placeholder="🔍 Buscar…" value={ft.q} onChange={e=>setFt(p=>({...p,q:e.target.value}))} style={{flex:'1 1 150px',minWidth:130,border:'1.5px solid var(--cinzaM)',borderRadius:8,padding:'9px 12px',fontSize:13,outline:'none'}}/>
      <select value={ft.tipo} onChange={e=>setFt(p=>({...p,tipo:e.target.value}))} style={{flex:'1 1 100px',border:'1.5px solid var(--cinzaM)',borderRadius:8,padding:'9px 11px',fontSize:13,outline:'none',background:'var(--branco)'}}><option value="">Tipo</option><option>RECEITA</option><option>DESPESA</option></select>
      <select value={ft.ano} onChange={e=>setFt(p=>({...p,ano:e.target.value}))} style={{flex:'1 1 80px',border:'1.5px solid var(--cinzaM)',borderRadius:8,padding:'9px 11px',fontSize:13,outline:'none',background:'var(--branco)'}}><option value="">Ano</option>{anos.map(a=><option key={a}>{a}</option>)}</select>
      <select value={ft.mes} onChange={e=>setFt(p=>({...p,mes:e.target.value}))} style={{flex:'1 1 80px',border:'1.5px solid var(--cinzaM)',borderRadius:8,padding:'9px 11px',fontSize:13,outline:'none',background:'var(--branco)'}}><option value="">Mês</option>{MS.map((m,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}</select>
      <input placeholder="Dia (01-31)" value={ft.dia} onChange={e=>setFt(p=>({...p,dia:e.target.value.padStart(2,'0').slice(0,2)}))} style={{flex:'1 1 70px',minWidth:70,border:'1.5px solid var(--cinzaM)',borderRadius:8,padding:'9px 12px',fontSize:13,outline:'none'}} maxLength={2}/>
      <select value={ft.pagador} onChange={e=>setFt(p=>({...p,pagador:e.target.value}))} style={{flex:'1 1 100px',border:'1.5px solid var(--cinzaM)',borderRadius:8,padding:'9px 11px',fontSize:13,outline:'none',background:'var(--branco)'}}><option value="">Pagador</option>{PAGADORES.map(p=><option key={p}>{p}</option>)}</select>
      <select value={ft.reembolso} onChange={e=>setFt(p=>({...p,reembolso:e.target.value}))} style={{flex:'1 1 120px',border:'1.5px solid var(--cinzaM)',borderRadius:8,padding:'9px 11px',fontSize:13,outline:'none',background:'var(--branco)'}}><option value="">Reembolso</option><option value="PENDENTE">⏳ Pendente</option><option value="CONCLUÍDO">✅ Concluído</option></select>
    </div>
    {/* Barra de ações */}
    <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
      {lst.length>0&&<div style={{background:'var(--preto)',borderRadius:8,padding:'9px 13px',display:'flex',justifyContent:'space-between',alignItems:'center',flex:1,minWidth:180}}><span style={{fontFamily:'var(--ff)',fontSize:11,letterSpacing:'.1em',color:'var(--cinzaE)'}}>{lst.length} LANÇAMENTO{lst.length!==1?'S':''}</span><span style={{fontFamily:'var(--ff)',fontSize:17,fontWeight:700,color:'var(--lima)'}}>{brl(tot)}</span></div>}
      <button onClick={()=>setShowImport(true)} style={{display:'flex',alignItems:'center',gap:6,background:'var(--cinzaF)',border:'1.5px solid var(--cinzaM)',borderRadius:8,padding:'9px 13px',fontSize:13,fontWeight:600,color:'var(--cinzaE)',cursor:'pointer'}}>📂 Importar</button>
      <button onClick={()=>setShowLixeira(true)} style={{display:'flex',alignItems:'center',gap:6,background:'#FFF5F5',border:'1.5px solid var(--coral)',borderRadius:8,padding:'9px 13px',fontSize:13,fontWeight:600,color:'var(--coral)',cursor:'pointer'}}>🗑 Lixeira {lixeira.length>0?`(${lixeira.length})`:''}</button>
      <button onClick={()=>exportExcel(lst)} style={{display:'flex',alignItems:'center',gap:6,background:'#ECFDF5',border:'1.5px solid #10B981',borderRadius:8,padding:'9px 13px',fontSize:13,fontWeight:600,color:'#065F46',cursor:'pointer'}}>⬇ Excel</button>
      <button onClick={()=>exportPDF(lst)} style={{display:'flex',alignItems:'center',gap:6,background:'#EFF6FF',border:'1.5px solid var(--azul)',borderRadius:8,padding:'9px 13px',fontSize:13,fontWeight:600,color:'var(--azul)',cursor:'pointer'}}>🖨 PDF</button>
    </div>
    {showImport&&<Modal title="Importar Excel" onClose={()=>setShowImport(false)}><ImportarExcel onImport={importar} onClose={()=>setShowImport(false)}/></Modal>}
    {/* Lista */}
    <div className="card">{lst.length===0&&<div style={{padding:40,textAlign:'center',color:'var(--cinzaE)',fontStyle:'italic'}}>Nenhum lançamento encontrado</div>}
    {lst.map((l,i)=>{const vlr=+(l.vlrPago||l.vlrLiquido||l.vlrBruto)||0;const sc=STC[l.status]||{bg:'var(--cinzaM)',fg:'var(--cinzaE)'};const isR=l.tipo==='RECEITA';
      return(<div key={l.id} className="tx" style={{borderLeft:`4px solid ${isR?'var(--verde)':'var(--coral)'}`,borderBottom:i<lst.length-1?'1px solid var(--cinzaF)':'none'}} onClick={()=>setModal(l)}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4,flexWrap:'wrap'}}><span className="tag" style={{background:sc.bg,color:sc.fg,fontSize:10}}>{l.status}</span><span style={{fontFamily:'var(--ff)',fontWeight:700,fontSize:14,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.descricao}</span></div>
          <div style={{fontSize:12,color:'var(--cinzaE)',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.categoria}{l.subcategoria&&l.subcategoria!==l.categoria?` · ${l.subcategoria}`:''}{l.clienteFornecedor?` · ${l.clienteFornecedor}`:''}</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
            {l.tipo==='DESPESA'&&l.natureza&&(()=>{const nc=NAT_CLR[l.natureza];return <span style={{padding:'2px 7px',borderRadius:4,border:`1px solid ${nc.bg}`,color:nc.bg,fontFamily:'var(--ff)',fontSize:10,fontWeight:700}}>{nc.label}</span>;})()}
            <span style={{fontSize:11,color:'var(--cinzaE)'}}>{dbr(l.dataDoc)}</span>
            {l.competencia&&<span style={{fontFamily:'var(--ff)',color:'var(--azul)',fontWeight:700,fontSize:11}}>{mc(l.competencia)}</span>}
            {l.pagador&&<span style={{fontSize:10,background:'var(--cinzaF)',border:'1px solid var(--cinzaM)',borderRadius:4,padding:'1px 6px',color:'var(--cinzaE)',fontFamily:'var(--ff)',fontWeight:700}}>{l.pagador}</span>}
            {l.reembolso==='PENDENTE'&&<span style={{fontSize:10,background:'#FFFBEB',border:'1px solid #F59E0B',borderRadius:4,padding:'1px 6px',color:'#92400E',fontFamily:'var(--ff)',fontWeight:700}}>⏳ REEMBOLSO</span>}
            {l.reembolso==='CONCLUÍDO'&&<span style={{fontSize:10,background:'#ECFDF5',border:'1px solid #10B981',borderRadius:4,padding:'1px 6px',color:'#065F46',fontFamily:'var(--ff)',fontWeight:700}}>✅ REEMBOLSO</span>}
            {l.forma&&<span style={{fontSize:11,color:'var(--cinzaE)'}}>{FORMAS[l.forma]?.icon}</span>}
            {l.anexos?.length>0&&<span style={{fontSize:11}}>📎{l.anexos.length}</span>}
          </div>
        </div>
        <div style={{textAlign:'right',flexShrink:0,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3}}>
          <span style={{fontFamily:'var(--ff)',fontSize:17,fontWeight:700,color:isR?'var(--verde)':'var(--coral)'}}>{isR?'+':'−'}{brl(vlr)}</span>
          <button onClick={e=>{e.stopPropagation();setDel(l.id);}} style={{fontSize:13,color:'var(--coral)',lineHeight:1}}>🗑</button>
        </div>
      </div>);
    })}</div>
  </div>
  {modal&&<Modal title={modal==='new'?'Novo Lançamento':'Editar Lançamento'} onClose={()=>setModal(null)}><FormL init={modal!=='new'?modal:null} onSave={save} onClose={()=>setModal(null)}/></Modal>}
  {del&&<DelModal msg="Mover para a lixeira? Você pode restaurar depois." onConfirm={()=>softDelete(del)} onClose={()=>setDel(null)}/>}
  {showLixeira&&<LixeiraModal lixeira={lixeira} onRestore={id=>{const item=lixeira.find(l=>l.id===id);if(item){const{deletedAt,...rest}=item;setLancamentos(p=>[rest,...p]);setLixeira(p=>p.filter(l=>l.id!==id));}}} onPurge={id=>setLixeira(p=>p.filter(l=>l.id!==id))} onClose={()=>setShowLixeira(false)}/>}
  </div>);
}

// ─── DRE ─────────────────────────────────────────────────────────
function DRE({lancamentos}){
  const[ano,setAno]=useState(new Date().getFullYear());
  const gV=(tipo,cats,mi,sts=['RECEBIDO','PAGO'],nats=[])=>{const c=`${ano}-${String(mi+1).padStart(2,'0')}`;return lancamentos.filter(l=>l.tipo===tipo&&sts.includes(l.status)&&l.competencia===c&&(cats.length===0||cats.includes(l.categoria))&&(nats.length===0||nats.includes(l.natureza))).reduce((s,l)=>s+(+(l.vlrPago||l.vlrLiquido)||0),0);};
  const cp=MS.map((_,i)=>{const r=gV('RECEITA',[],i);const dv=gV('DESPESA',[],i,['PAGO'],['DESPESA VARIÁVEL']);const mb=r-dv;const df=gV('DESPESA',[],i,['PAGO'],['DESPESA FIXA']);const eb=mb-df;const inv=gV('DESPESA',[],i,['PAGO'],['INVESTIMENTO']);const rf=eb-inv;return{r,dv,mb,df,eb,inv,rf,mgBruta:r>0?mb/r:0,mgLiq:r>0?rf/r:0};});
  const am=MS.map((_,i)=>i).filter(i=>cp[i].r>0||cp[i].rf!==0);const sm=am.length>0?am:[0,1,2];const tot=k=>sm.reduce((s,i)=>s+(cp[i][k]||0),0);
  const anos=[...new Set(lancamentos.map(l=>l.competencia?.slice(0,4)).filter(Boolean))].sort().reverse();
  const ROWS=[{l:'RECEITA BRUTA',t:'g',fn:i=>cp[i].r,col:'var(--verde)'},{l:'Honorários',t:'i',fn:i=>gV('RECEITA',['HONORÁRIOS'],i)},{l:'Outros',t:'i',fn:i=>cp[i].r-gV('RECEITA',['HONORÁRIOS'],i)},{l:'(-) DESPESA VARIÁVEL',t:'g2',fn:i=>cp[i].dv,col:'#6B3E9A'},{l:'Serviços Terceiros',t:'i',fn:i=>gV('DESPESA',['SERV. TERCEIROS'],i,['PAGO'],['DESPESA VARIÁVEL'])},{l:'Marketing',t:'i',fn:i=>gV('DESPESA',['MARKETING'],i,['PAGO'],['DESPESA VARIÁVEL'])},{l:'Outros variáveis',t:'i',fn:i=>cp[i].dv-gV('DESPESA',['SERV. TERCEIROS','MARKETING'],i,['PAGO'],['DESPESA VARIÁVEL'])},{l:'= MARGEM BRUTA',t:'T',k:'mb',col:'var(--lima)'},{l:'% Margem',t:'P',k:'mgBruta'},{l:'(-) DESPESA FIXA',t:'g2',fn:i=>cp[i].df,col:'#1B3A5C'},{l:'Softwares',t:'i',fn:i=>gV('DESPESA',['SOFTWARES'],i,['PAGO'],['DESPESA FIXA'])},{l:'Administrativo',t:'i',fn:i=>gV('DESPESA',['DESP. ADMINISTRATIVAS'],i,['PAGO'],['DESPESA FIXA'])},{l:'Pró-labore',t:'i',fn:i=>gV('DESPESA',['PRÓ-LABORE'],i,['PAGO'],['DESPESA FIXA'])},{l:'Outros fixos',t:'i',fn:i=>cp[i].df-gV('DESPESA',['SOFTWARES','DESP. ADMINISTRATIVAS','PRÓ-LABORE'],i,['PAGO'],['DESPESA FIXA'])},{l:'= EBITDA',t:'T',k:'eb'},{l:'(-) INVESTIMENTO',t:'g2',fn:i=>cp[i].inv,col:'#B8860B'},{l:'= RESULTADO FINAL',t:'T',k:'rf',col:'var(--lima)'},{l:'% Margem Líquida',t:'P',k:'mgLiq'}];
  return(<div className="au page pc" style={{paddingTop:14}}>
    <div style={{display:'flex',alignItems:'center',gap:11,marginBottom:10,flexWrap:'wrap'}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:11,fontWeight:700,color:'var(--cinzaE)',letterSpacing:'.08em'}}>ANO</span><select value={ano} onChange={e=>setAno(+e.target.value)} style={{width:90,border:'1.5px solid var(--cinzaM)',borderRadius:8,padding:'8px 10px',fontSize:13,outline:'none'}}>{(anos.length?anos:[new Date().getFullYear()]).map(a=><option key={a}>{a}</option>)}</select></div>
      <button onClick={()=>exportExcel(lancamentos.filter(l=>l.competencia?.startsWith(String(ano))),'zeste_dre')} style={{display:'flex',alignItems:'center',gap:6,background:'#ECFDF5',border:'1.5px solid #10B981',borderRadius:8,padding:'8px 12px',fontSize:12,fontWeight:600,color:'#065F46',cursor:'pointer'}}>⬇ Exportar Excel</button>
      <button onClick={()=>exportPDF(lancamentos.filter(l=>l.competencia?.startsWith(String(ano))),`DRE ${ano}`)} style={{display:'flex',alignItems:'center',gap:6,background:'#EFF6FF',border:'1.5px solid var(--azul)',borderRadius:8,padding:'8px 12px',fontSize:12,fontWeight:600,color:'var(--azul)',cursor:'pointer'}}>🖨 PDF</button>
    </div>
    <div style={{overflowX:'auto',borderRadius:12,boxShadow:'0 1px 8px rgba(0,0,0,.07)'}}><table style={{width:'100%',borderCollapse:'collapse',background:'var(--branco)',minWidth:440,fontSize:12}}><thead><tr style={{background:'var(--preto)'}}><th style={{padding:'10px 13px',textAlign:'left',color:'var(--lima)',fontFamily:'var(--ff)',fontSize:11,letterSpacing:'.1em',minWidth:200}}>CONTA</th>{sm.map(i=><th key={i} style={{padding:'9px 11px',textAlign:'right',color:'var(--lima)',fontFamily:'var(--ff)',fontSize:11}}>{MS[i]}</th>)}<th style={{padding:'9px 11px',textAlign:'right',color:'var(--lima)',fontFamily:'var(--ff)',fontSize:11,background:'var(--verde)'}}>TOTAL</th></tr></thead><tbody>{ROWS.map(({l,t,fn,k,col},ri)=>{const isG=t==='g'||t==='g2',isT=t==='T'||t==='P';const bgMap={g:'var(--preto)',g2:col+'22',T:'var(--cinzaF)',P:'var(--cinzaF)'};const bg=bgMap[t]||(ri%2===0?'var(--branco)':'#FAFAF6');const fgMap={g:'var(--lima)',g2:col};const fg=fgMap[t]||'var(--preto)';return(<tr key={l} style={{background:bg}}><td style={{padding:isG?'8px 13px':isT?'9px 13px 9px 19px':'7px 13px 7px 21px',fontFamily:isG?'var(--ff)':'var(--fb)',fontWeight:isG||isT?700:400,color:fg,fontSize:isG?11:12,letterSpacing:isG?'.1em':'normal',borderBottom:`1px solid ${t==='g'?'#252525':'var(--cinzaF)'}`,borderLeft:t==='g2'?`3px solid ${col}`:'none'}}>{l}</td>{sm.map(i=>{const v=fn?fn(i):(cp[i][k]||0);const isPct=t==='P';return(<td key={i} style={{padding:'7px 11px',textAlign:'right',fontFamily:'var(--ff)',fontSize:13,fontWeight:isT||isG?700:400,color:t==='g'?'var(--lima)':t==='g2'?col:v<0?'var(--coral)':isT?(col||'var(--verde)'):'var(--cinzaE)',borderBottom:`1px solid ${t==='g'?'#252525':'var(--cinzaF)'}`,background:t==='g'?'var(--preto)':undefined}}>{v===0&&!isT?<span style={{color:'var(--cinzaM)'}}>—</span>:isPct?pp(v):brl(v)}</td>);})}<td style={{padding:'7px 11px',textAlign:'right',fontFamily:'var(--ff)',fontSize:13,fontWeight:700,background:'var(--verde)',color:'var(--branco)',borderBottom:'1px solid rgba(255,255,255,.1)'}}>{k?(t==='P'?pp(tot(k==='mgBruta'?'mb':k==='mgLiq'?'rf':k)/(tot(k==='mgBruta'||k==='mgLiq'?'r':k)||1)):brl(tot(k))):fn?brl(sm.reduce((s,i)=>s+(fn(i)||0),0)):'—'}</td></tr>);})}</tbody></table></div>
  </div>);
}

// ─── CLIENTES ─────────────────────────────────────────────────────
function Clientes({clientes,setClientes,openNew}){
  const[modal,setModal]=useState(null);const[del,setDel]=useState(null);
  useEffect(()=>{openNew.current=()=>setModal('new');},[]);
  const save=item=>{setClientes(p=>p.some(c=>c.id===item.id)?p.map(c=>c.id===item.id?item:c):[item,...p]);setModal(null);};
  return(<div className="au page pc" style={{paddingTop:14}}><div style={{display:'flex',flexDirection:'column',gap:13}}>{clientes.length===0&&<div style={{textAlign:'center',padding:48,color:'var(--cinzaE)',fontStyle:'italic'}}>Nenhum cliente cadastrado</div>}{clientes.map(c=>{const aR=Math.max(0,(+(c.vlrContratado)||0)-(+(c.vlrRecebido)||0));const pR=c.vlrContratado>0?Math.min(1,c.vlrRecebido/c.vlrContratado):0;const sp=SPROJ[c.statusProjeto]||{bg:'var(--cinzaE)',fg:'var(--branco)'};return(<div key={c.id} className="card" style={{borderLeft:`4px solid ${sp.bg}`}}><div style={{padding:'15px 17px'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,flexWrap:'wrap',marginBottom:10}}><div><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2,flexWrap:'wrap'}}><span style={{fontFamily:'var(--ff)',fontSize:20,fontWeight:700,color:'var(--verde)'}}>{c.cliente}</span><span className="tag" style={{background:sp.bg,color:sp.fg}}>{c.statusProjeto}</span></div><div style={{fontSize:12,color:'var(--cinzaE)'}}>{c.estabelecimento}</div><div style={{fontSize:13,fontWeight:600,marginTop:2}}>{c.projeto}</div></div><div style={{display:'flex',gap:7}}><button onClick={()=>setModal(c)} style={{background:'var(--cinzaF)',borderRadius:7,padding:'7px 12px',fontSize:13,fontWeight:600,color:'var(--azul)'}}>✏️</button><button onClick={()=>setDel(c.id)} style={{background:'var(--cinzaF)',borderRadius:7,padding:'7px 12px',fontSize:13,color:'var(--coral)'}}>🗑</button></div></div><div style={{display:'flex',gap:18,flexWrap:'wrap',marginBottom:12}}>{[{l:'Contratado',v:c.vlrContratado,col:'var(--preto)'},{l:'Recebido',v:c.vlrRecebido,col:'var(--verde)'},{l:'A receber',v:aR,col:aR>0?'var(--coral)':'var(--cinzaE)'}].map(({l,v,col})=>(<div key={l}><div style={{fontSize:10,fontWeight:700,color:'var(--cinzaE)',letterSpacing:'.07em',textTransform:'uppercase',marginBottom:2}}>{l}</div><div style={{fontFamily:'var(--ff)',fontSize:17,fontWeight:700,color:col}}>{brl(v)}</div></div>))}</div>{c.vlrContratado>0&&(<div style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--cinzaE)',marginBottom:4}}><span>Progresso</span><span style={{fontWeight:700,color:pR>=1?'var(--verde)':'var(--azul)'}}>{pp(pR)}</span></div><div style={{height:5,borderRadius:99,background:'var(--cinzaF)'}}><div style={{height:'100%',width:`${pR*100}%`,background:pR>=1?'var(--verde)':'var(--lima)',borderRadius:99}}/></div></div>)}{c.obs&&<div style={{fontSize:12,color:'var(--cinzaE)',fontStyle:'italic'}}>{c.obs}</div>}</div></div>);})}
  </div>{modal&&<Modal title={modal==='new'?'Novo Cliente':'Editar Cliente'} onClose={()=>setModal(null)}><FormC init={modal!=='new'?modal:null} onSave={save} onClose={()=>setModal(null)}/></Modal>}{del&&<DelModal msg="Deseja excluir este cliente?" onConfirm={()=>{setClientes(p=>p.filter(c=>c.id!==del));setDel(null);}} onClose={()=>setDel(null)}/>}</div>);
}

// ─── ROOT ─────────────────────────────────────────────────────────
export default function Financeiro({onBack}){
  const[data,setData]=useState(null);const[aba,setAba]=useState('resumo');const[saved,setSaved]=useState(false);
  const nL=useRef(()=>{});const nC=useRef(()=>{});
  useEffect(()=>{setData(loadData());},[]);
  const p=useCallback(next=>{persistData(next);setSaved(true);setTimeout(()=>setSaved(false),1300);return next;},[]);
  const sL=useCallback(fn=>setData(d=>{const l=typeof fn==='function'?fn(d.lancamentos):fn;return p({...d,lancamentos:l});}),[p]);
  const sC=useCallback(fn=>setData(d=>{const c=typeof fn==='function'?fn(d.clientes):fn;return p({...d,clientes:c});}),[p]);
  if(!data)return <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--cinzaF)'}}><div style={{textAlign:'center'}}><div style={{fontFamily:'var(--ff)',fontSize:36,fontWeight:800,color:'var(--verde)',letterSpacing:'.06em'}}>ZESTE</div><div style={{color:'var(--cinzaE)',fontSize:13,marginTop:4}}>Carregando…</div></div></div>;
  const ABAS=[{id:'resumo',l:'RESUMO'},{id:'lancamentos',l:'LANÇAMENTOS'},{id:'dre',l:'DRE'},{id:'clientes',l:'CLIENTES'}];
  const fab=()=>{if(aba==='lancamentos')nL.current();else if(aba==='clientes')nC.current();else{setAba('lancamentos');setTimeout(()=>nL.current(),200);}};
  return(<><style>{STYLE}</style><div style={{background:'var(--preto)',position:'sticky',top:0,zIndex:300}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px 0'}}><div style={{display:'flex',alignItems:'center',gap:10}}>{onBack&&<button onClick={onBack} style={{color:'var(--lima)',fontSize:22,padding:'0 6px 0 0',lineHeight:1}}>‹</button>}<div style={{display:'flex',alignItems:'baseline',gap:7}}><span style={{fontFamily:'var(--ff)',fontSize:22,fontWeight:800,color:'var(--lima)',letterSpacing:'.06em'}}>ZESTE</span><span style={{fontSize:10,color:'var(--cinzaE)',letterSpacing:'.14em'}}>FINANCEIRO</span></div></div><span style={{fontSize:10,color:saved?'var(--lima)':'transparent',transition:'color .3s',fontFamily:'var(--ff)',fontWeight:700,letterSpacing:'.08em'}}>✓ SALVO</span></div><nav className="nav">{ABAS.map((a,i)=>(<span key={a.id}>{i>0&&<div className="nav-sep"/>}<div className={`nav-item${aba===a.id?' on':''}`} onClick={()=>setAba(a.id)}>{a.l}</div></span>))}</nav></div>
  {aba==='resumo'&&<Resumo lancamentos={data.lancamentos} setAba={setAba}/>}
  {aba==='lancamentos'&&<Lancamentos lancamentos={data.lancamentos} setLancamentos={sL} lixeira={data.lixeira||[]} setLixeira={fn=>setData(d=>{const l=typeof fn==='function'?fn(d.lixeira||[]):fn;return p({...d,lixeira:l});})} openNew={nL}/>}
  {aba==='dre'&&<DRE lancamentos={data.lancamentos}/>}
  {aba==='clientes'&&<Clientes clientes={data.clientes} setClientes={sC} openNew={nC}/>}
  <button className="fab" onClick={fab}>+</button></>);
}

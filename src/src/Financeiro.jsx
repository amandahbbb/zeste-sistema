import { useState, useEffect, useCallback, useRef } from "react";

// ── SUPABASE ──────────────────────────────────────────────────────
const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";

function sbH(token){return{"apikey":SB_KEY,"Authorization":`Bearer ${token||SB_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"};}
async function sbLoad(table,token){try{const r=await fetch(`${SB_URL}/rest/v1/${table}?deleted_at=is.null&order=created_at.desc`,{headers:sbH(token)});const rows=await r.json();return Array.isArray(rows)?rows.map(r=>r.dados):[];}catch{return[];}}
async function sbLoadLix(table,token){try{const r=await fetch(`${SB_URL}/rest/v1/${table}?deleted_at=not.is.null&order=updated_at.desc`,{headers:sbH(token)});const rows=await r.json();return Array.isArray(rows)?rows.map(r=>({...r.dados,deletedAt:r.deleted_at})):[];}catch{return[];}}
async function sbUpsert(table,item,token){await fetch(`${SB_URL}/rest/v1/${table}`,{method:"POST",headers:{...sbH(token),"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({id:item.id,dados:item,updated_at:new Date().toISOString()})});}
async function sbSoftDel(table,id,token){await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`,{method:"PATCH",headers:sbH(token),body:JSON.stringify({deleted_at:new Date().toISOString()})});}
async function sbRestore(table,id,token){await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`,{method:"PATCH",headers:sbH(token),body:JSON.stringify({deleted_at:null})});}
async function sbPurge(table,id,token){await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`,{method:"DELETE",headers:sbH(token)});}

// ── ESTILO GLOBAL ─────────────────────────────────────────────────
const STYLE=`
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{--lima:#C5D943;--verde:#2D6E47;--azul:#2E7DD1;--coral:#E8614B;--preto:#111614;--cinzaF:#F0F0EA;--cinzaM:#DDDDD5;--cinzaE:#888882;--branco:#FFFFFF;--amarelo:#F59E0B;--ff:'Barlow Condensed',sans-serif;--fb:'Barlow',sans-serif;--safe:env(safe-area-inset-bottom,0px);}
html,body,#root{height:100%;font-family:var(--fb)}
body{background:var(--cinzaF);color:var(--preto);overflow-x:hidden}
input,select,textarea,button{font-family:var(--fb)}
input,select,textarea{font-size:16px;border:1.5px solid var(--cinzaM);border-radius:8px;padding:12px 13px;background:var(--branco);outline:none;width:100%;transition:border-color .15s;color:var(--preto);-webkit-appearance:none;appearance:none;}
input:focus,select:focus,textarea:focus{border-color:var(--azul);box-shadow:0 0 0 3px rgba(46,125,209,.12)}
input[type=file]{display:none}button{cursor:pointer;border:none;background:none}
::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:var(--cinzaM);border-radius:3px}
.nav{background:var(--preto);display:flex;align-items:stretch;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.nav::-webkit-scrollbar{display:none}
.nav-item{padding:13px 16px;font-family:var(--ff);font-size:13px;font-weight:700;letter-spacing:.1em;color:#777;white-space:nowrap;position:relative;cursor:pointer;flex-shrink:0;transition:color .15s;min-height:44px;display:flex;align-items:center}
.nav-item.on{color:var(--lima)}.nav-item.on::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--lima)}
.nav-sep{width:1px;background:#252525;margin:10px 0;flex-shrink:0}
.sh{display:flex;align-items:center;gap:8px;margin:20px 0 10px}.sh-bar{width:18px;height:3px;background:var(--lima);flex-shrink:0}.sh-txt{font-family:var(--ff);font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--cinzaE);text-transform:uppercase}
.card{background:var(--branco);border-radius:12px;box-shadow:0 1px 6px rgba(0,0,0,.07);overflow:hidden}
.warn{background:#FFF0ED;border-left:3px solid var(--coral);border-radius:6px;padding:10px 12px;font-size:13px;color:var(--coral);font-weight:500;line-height:1.4}
.warn-y{background:#FFFBEB;border-left:3px solid var(--amarelo);border-radius:6px;padding:10px 12px;font-size:13px;color:#92400E;font-weight:500;line-height:1.4}
.tag{display:inline-block;padding:3px 8px;border-radius:4px;font-family:var(--ff);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.kpi{background:var(--preto);border-radius:12px;padding:14px 16px;border-left:4px solid var(--lima);flex:1 1 130px;min-width:120px;flex-shrink:0}
.kpi-l{font-family:var(--ff);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px}
.kpi-v{font-family:var(--ff);font-size:19px;font-weight:700;line-height:1}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:8px;padding:12px 18px;font-size:14px;font-weight:600;transition:filter .15s,transform .1s;white-space:nowrap;border:none;min-height:44px}
.btn:active{transform:scale(.96)}.btn-p{background:var(--verde);color:var(--branco)}.btn-g{background:transparent;color:var(--verde);border:1.5px solid var(--verde)}.btn-d{background:var(--coral);color:var(--branco)}.btn-sm{padding:9px 14px;font-size:13px;border-radius:7px;min-height:40px}.btn:hover{filter:brightness(1.08)}
.fab{position:fixed;bottom:calc(20px + var(--safe));right:16px;width:54px;height:54px;border-radius:50%;background:var(--lima);color:var(--preto);font-size:26px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(197,217,67,.45);z-index:150;transition:transform .15s;font-family:var(--ff)}
.fab:active{transform:scale(.9)}
.overlay{position:fixed;inset:0;background:rgba(17,22,20,.55);z-index:500;display:flex;align-items:flex-end;justify-content:center}
@media(min-width:600px){.overlay{align-items:center;padding:20px}}
.sheet{background:var(--branco);width:100%;max-height:94vh;overflow:auto;border-radius:18px 18px 0 0}
@media(min-width:600px){.sheet{border-radius:14px;max-width:580px;max-height:90vh}}
.mhdr{position:sticky;top:0;background:var(--branco);z-index:1;padding:14px 18px 12px;border-bottom:1px solid var(--cinzaM);display:flex;align-items:center;justify-content:space-between}
.mtitle{font-family:var(--ff);font-size:20px;font-weight:700;color:var(--verde)}.mclose{width:36px;height:36px;border-radius:50%;background:var(--cinzaF);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--cinzaE);flex-shrink:0}
.fg{display:flex;flex-wrap:wrap;gap:12px}.fg>.fld{flex:1 1 100%}.fg>.fld.h{flex:1 1 calc(50% - 6px)}
.fld{display:flex;flex-direction:column;gap:5px}.flbl{font-size:11px;font-weight:700;color:var(--cinzaE);letter-spacing:.07em;text-transform:uppercase}
.fee-box{background:var(--cinzaF);border-radius:8px;padding:11px 13px;border:1px solid var(--cinzaM);display:flex;flex-direction:column;gap:6px}
.fee-r{display:flex;justify-content:space-between;align-items:center;font-size:13px}
.fee-net{border-top:1px dashed var(--cinzaM);padding-top:7px;margin-top:3px;font-weight:700;font-size:15px}
.att-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:5px}
.att-thumb{width:66px;height:66px;border-radius:8px;object-fit:cover;border:2px solid var(--cinzaM);cursor:pointer}
.att-add{width:66px;height:66px;border-radius:8px;border:2px dashed var(--cinzaM);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:var(--cinzaE);font-size:10px;cursor:pointer;background:var(--cinzaF)}
.att-pdf{width:66px;height:66px;border-radius:8px;border:2px solid var(--cinzaM);background:var(--cinzaF);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer}
.tx{background:var(--branco);padding:12px 14px;display:flex;gap:10px;align-items:flex-start;cursor:pointer;transition:background .1s;min-height:64px}
.tx:hover{background:#F7F7F3}.tx:active{background:var(--cinzaF)}
.bar-g{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.bar-w{width:100%;display:flex;gap:2px;align-items:flex-end;height:72px}
.bar{border-radius:3px 3px 0 0;transition:height .5s;min-height:2px}
.pc{padding:0 14px}.page{padding-bottom:90px}
.kr{display:flex;gap:9px;overflow-x:auto;padding:14px 14px 2px;scrollbar-width:none;-webkit-overflow-scrolling:touch}.kr::-webkit-scrollbar{display:none}
@media(min-width:600px){.pc{padding:0 22px}.kr{flex-wrap:wrap;padding:14px 22px 2px}}
@media(min-width:900px){.pc{padding:0 30px}.kr{padding:14px 30px 2px}}
.filter-row{display:flex;flex-wrap:wrap;gap:7px}
.filter-row input,.filter-row select{flex:1 1 120px;min-width:100px;font-size:13px;padding:9px 11px;border:1.5px solid var(--cinzaM);border-radius:8px;background:var(--branco);color:var(--preto);outline:none}
.action-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px}
.action-btn{display:flex;align-items:center;gap:6px;border:1.5px solid;border-radius:8px;padding:9px 13px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;min-height:42px;background:transparent}
@keyframes up{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fi{from{opacity:0}to{opacity:1}}
.au{animation:up .2s ease}.af{animation:fi .18s ease}
.sync-bar{height:2px;background:var(--lima);position:fixed;top:0;left:0;z-index:999;transition:width .3s}
select{color-scheme:light}select option{background:var(--branco)!important;color:var(--preto)!important}
@media(max-width:600px){.prev-grid{grid-template-columns:1fr!important}}
`;

// ── CONSTANTES ────────────────────────────────────────────────────
const FORMAS={'PIX':{taxa:0,icon:'⚡',label:'PIX'},'DÉBITO':{taxa:.015,icon:'💳',label:'Débito'},'CRÉDITO 1X':{taxa:.026,icon:'💳',label:'Crédito 1x'},'CRÉDITO 2X':{taxa:.032,icon:'💳',label:'Crédito 2x'},'CRÉDITO 3X':{taxa:.038,icon:'💳',label:'Crédito 3x'},'CRÉDITO 4X':{taxa:.043,icon:'💳',label:'Crédito 4x'},'CRÉDITO 5X':{taxa:.047,icon:'💳',label:'Crédito 5x'},'CRÉDITO 6X':{taxa:.051,icon:'💳',label:'Crédito 6x'},'CRÉDITO 7-12X':{taxa:.059,icon:'💳',label:'Crédito 7-12x'},'BOLETO':{taxa:.02,icon:'📄',label:'Boleto'},'DINHEIRO':{taxa:0,icon:'💵',label:'Dinheiro'},'TED / DOC':{taxa:0,icon:'🏦',label:'TED / DOC'}};
const CATS=['HONORÁRIOS','SERV. TERCEIROS','SOFTWARES','DESP. ADMINISTRATIVAS','MARKETING','PRÓ-LABORE','INVESTIMENTO','OUTROS'];
const NATUREZAS=['DESPESA FIXA','DESPESA VARIÁVEL','INVESTIMENTO'];
const NAT_CLR={'DESPESA FIXA':{bg:'#1B3A5C',fg:'#FFF',label:'FIXA'},'DESPESA VARIÁVEL':{bg:'#6B3E9A',fg:'#FFF',label:'VARIÁVEL'},'INVESTIMENTO':{bg:'#B8860B',fg:'#FFF',label:'INVEST.'}};
const getClassif = l => {
  if (l.tipo === 'RECEITA') return 'receita';
  if (l.natureza === 'INVESTIMENTO' || l.categoria === 'INVESTIMENTO') return 'investimento';
  if (l.natureza === 'PRÓ-LABORE' || l.categoria === 'PRÓ-LABORE') return 'retirada';
  return 'desp_op';
};
const CC = {
  receita:     {bg:'#8FA715',fg:'#0E0E0C',label:'RECEITA',icon:'💰',desc:'Entradas da empresa'},
  desp_op:     {bg:'#C4502B',fg:'#fff',label:'DESP. OPERACIONAL',icon:'💸',desc:'Custos da operação'},
  investimento:{bg:'#1A4F71',fg:'#fff',label:'INVESTIMENTO',icon:'🔧',desc:'Gera valor futuro'},
  retirada:    {bg:'#6B3E9A',fg:'#fff',label:'PRÓ-LABORE / RETIRADA',icon:'💼',desc:'Retirada dos sócios'},
};
const CLASSIF_OPTS = [
  {id:'receita',     tipo:'RECEITA',  natureza:'',               cat:null},
  {id:'desp_op',     tipo:'DESPESA',  natureza:'DESPESA FIXA',   cat:null},
  {id:'investimento',tipo:'DESPESA',  natureza:'INVESTIMENTO',   cat:'INVESTIMENTO'},
  {id:'retirada',    tipo:'DESPESA',  natureza:'PRÓ-LABORE',     cat:'PRÓ-LABORE'},
];
const CAT_NAT={'HONORÁRIOS':'DESPESA FIXA','SERV. TERCEIROS':'DESPESA VARIÁVEL','SOFTWARES':'DESPESA FIXA','DESP. ADMINISTRATIVAS':'DESPESA FIXA','MARKETING':'DESPESA VARIÁVEL','PRÓ-LABORE':'DESPESA FIXA','INVESTIMENTO':'INVESTIMENTO','OUTROS':'DESPESA FIXA'};
const SUBS={'HONORÁRIOS':['CONSULTORIA OPERACIONAL','CONSULTORIA GERENCIAL','PRODUÇÃO DE MATERIAIS','TREINAMENTO / MENTORIA','DIAGNÓSTICO'],'SERV. TERCEIROS':['DESIGN / DIAGRAMAÇÃO','FOTOGRAFIA','PROGRAMAÇÃO','FREELANCER'],'SOFTWARES':['ASSINATURA','DOMÍNIO / HOSPEDAGEM','OUTROS'],'DESP. ADMINISTRATIVAS':['HONORÁRIOS CONTADOR','TELEFONE / INTERNET','MATERIAL DE ESCRITÓRIO','IMPOSTOS / TAXAS','OUTRAS'],'MARKETING':['IMPRESSÃO / MATERIAIS','REDES SOCIAIS','OUTROS'],'PRÓ-LABORE':['RETIRADA'],'INVESTIMENTO':['IDENTIDADE VISUAL / BRANDING','SISTEMAS / SOFTWARE','EQUIPAMENTOS','CURSOS / CAPACITAÇÃO','OUTROS'],'OUTROS':['OUTROS']};
const MS=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const SR=['RECEBIDO','A RECEBER','CANCELADO'];
const SD=['PAGO','PREVISTO','CANCELADO'];
const SPROJ={CONCLUÍDO:{bg:'var(--verde)',fg:'var(--branco)'},'EM ANDAMENTO':{bg:'var(--azul)',fg:'var(--branco)'},PROPOSTA:{bg:'var(--lima)',fg:'var(--preto)'},PAUSADO:{bg:'var(--cinzaE)',fg:'var(--branco)'},CANCELADO:{bg:'var(--coral)',fg:'var(--branco)'}};
const STC={RECEBIDO:{bg:'var(--verde)',fg:'var(--branco)'},'A RECEBER':{bg:'var(--azul)',fg:'var(--branco)'},PAGO:{bg:'var(--verde)',fg:'var(--branco)'},PREVISTO:{bg:'var(--cinzaM)',fg:'var(--cinzaE)'},CANCELADO:{bg:'var(--coral)',fg:'var(--branco)'}};
const PAGADORES=['AMANDA','BRUNA','ZESTE'];

async function loadXLSX(){
  if(window.XLSX)return window.XLSX;
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    s.onload=()=>resolve(window.XLSX);
    s.onerror=()=>reject(new Error('Falha ao carregar SheetJS'));
    document.head.appendChild(s);
  });
}

const uid=()=>Math.random().toString(36).slice(2,9);
const td=()=>new Date().toISOString().split('T')[0];
const brl=n=>n==null||n===''?'—':'R$ '+Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const pp=n=>(Number(n)*100).toFixed(1)+'%';
const dbr=s=>s?s.split('-').reverse().join('/'):'—';
const mc=c=>{if(!c)return'—';const[y,m]=c.split('-');return`${MS[+m-1]}/${y}`};

// Input numérico BR: aceita vírgula, sem zero travado.
function NumBR({value,onChange,placeholder,style,className,required}){
  const fmt=v=>(v===0||v===''||v==null||isNaN(v))?'':String(v).replace('.',',');
  const[txt,setTxt]=useState(fmt(value));
  const[foco,setFoco]=useState(false);
  useEffect(()=>{if(!foco)setTxt(fmt(value));},[value,foco]);
  return <input type="text" inputMode="decimal" required={required} className={className} style={style} placeholder={placeholder||'0,00'} value={txt}
    onFocus={()=>setFoco(true)}
    onChange={e=>{const v=e.target.value.replace(/[^0-9.,]/g,'');setTxt(v);const n=parseFloat(v.replace(',','.'));onChange(isNaN(n)?'':n);}}
    onBlur={()=>{setFoco(false);setTxt(fmt(value));}}/>;
}

async function compressImg(file){if(!file.type.startsWith('image/')){return new Promise(r=>{const fr=new FileReader();fr.onload=e=>r({type:'pdf',data:e.target.result,name:file.name});fr.readAsDataURL(file);});}return new Promise(r=>{const fr=new FileReader();fr.onload=e=>{const img=new Image();img.onload=()=>{const MAX=600;let{width:w,height:h}=img;if(w>MAX){h=h*MAX/w;w=MAX;}if(h>MAX){w=w*MAX/h;h=MAX;}const c=document.createElement('canvas');c.width=Math.round(w);c.height=Math.round(h);c.getContext('2d').drawImage(img,0,0,c.width,c.height);r({type:'image',data:c.toDataURL('image/jpeg',.65),name:file.name});};img.src=e.target.result;};fr.readAsDataURL(file);});}

async function exportExcel(lancamentos,filename='zeste_lancamentos'){
  const XLSX=await loadXLSX();
  const rows=[['Data','Tipo','Status','Descrição','Categoria','Subcategoria','Natureza','Cliente/Fornecedor','Projeto','Competência','Forma','Cartão','Bandeira','Recorrente','Dia Fecha','Dia Vence','Valor Bruto','Taxa R$','Valor Líquido','Valor Pago','Data Pago','Pagador','Reembolso','Obs'],...lancamentos.map(l=>[l.dataDoc||'',l.tipo||'',l.status||'',l.descricao||'',l.categoria||'',l.subcategoria||'',l.natureza||'',l.clienteFornecedor||'',l.projeto||'',l.competencia||'',l.forma||'',l.cartaoNome||'',l.cartaoBandeira||'',l.recorrente?'SIM':'',l.cartaoDiaFecha||'',l.cartaoDiaVence||'',+(l.vlrBruto||0),+(l.vlrTaxa||0),+(l.vlrLiquido||0),+(l.vlrPago||0),l.dataPago||'',l.pagador||'',l.reembolso||'',l.obs||''])];
  const ws=XLSX.utils.aoa_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Lançamentos');XLSX.writeFile(wb,`${filename}_${td()}.xlsx`);
}

function exportPDF(lancamentos,titulo='Lançamentos'){
  const tot=lancamentos.reduce((s,l)=>{const v=+(l.vlrPago||l.vlrLiquido||l.vlrBruto)||0;return l.tipo==='RECEITA'?{...s,r:s.r+v}:{...s,d:s.d+v};},{r:0,d:0});
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:20px}h1{color:#2D6E47;font-size:18px;margin-bottom:2px}.sub{color:#888;font-size:10px;margin-bottom:14px}.kpis{display:flex;gap:14px;margin-bottom:14px}.kpi{background:#111;border-radius:6px;padding:9px 12px;border-left:3px solid #C5D943}.kpi-l{color:#888;font-size:9px;text-transform:uppercase;margin-bottom:3px}.kpi-v{font-size:15px;font-weight:700}table{width:100%;border-collapse:collapse}th{background:#111614;color:#C5D943;padding:6px 7px;text-align:left;font-size:9px;letter-spacing:.08em}td{padding:5px 7px;border-bottom:1px solid #eee;font-size:10px}tr:nth-child(even){background:#fafaf8}.r{color:#2D6E47;font-weight:700}.d{color:#E8614B;font-weight:700}.badge{display:inline-block;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:700}.pend{background:#FFFBEB;color:#92400E}.conc{background:#ECFDF5;color:#065F46}@media print{body{margin:0}}</style></head><body><h1>ZESTE — ${titulo}</h1><div class="sub">Gerado em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})} · ${lancamentos.length} lançamentos</div><div class="kpis"><div class="kpi"><div class="kpi-l">Receitas</div><div class="kpi-v" style="color:#C5D943">R$ ${tot.r.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div><div class="kpi"><div class="kpi-l">Despesas</div><div class="kpi-v" style="color:#E8614B">R$ ${tot.d.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div><div class="kpi"><div class="kpi-l">Resultado</div><div class="kpi-v" style="color:${tot.r-tot.d>=0?'#C5D943':'#E8614B'}">R$ ${(tot.r-tot.d).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div></div><table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Pagador</th><th>Forma</th><th>Valor</th><th>Status</th><th>Reembolso</th></tr></thead><tbody>${lancamentos.map(l=>{const v=+(l.vlrPago||l.vlrLiquido||l.vlrBruto)||0;const isR=l.tipo==='RECEITA';return`<tr><td>${dbr(l.dataDoc)}</td><td class="${isR?'r':'d'}">${l.tipo}</td><td>${l.descricao||''}</td><td>${l.categoria||''}</td><td>${l.pagador||'—'}</td><td>${l.forma||''}</td><td class="${isR?'r':'d'}">${isR?'+':'-'}R$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td><td>${l.status||''}</td><td>${l.reembolso?`<span class="badge ${l.reembolso==='PENDENTE'?'pend':'conc'}">${l.reembolso}</span>`:'—'}</td></tr>`;}).join('')}</tbody></table></body></html>`;
  const w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(()=>w.print(),400);
}

// ── ÁTOMOS ────────────────────────────────────────────────────────
const SH=({children})=><div className="sh"><div className="sh-bar"/><span className="sh-txt">{children}</span></div>;
function Btn({children,onClick,v='p',sm,disabled,icon,type='button'}){return <button type={type} onClick={onClick} disabled={disabled} className={`btn btn-${v}${sm?' btn-sm':''}`} style={{opacity:disabled?.45:1}}>{icon&&<span style={{fontSize:sm?13:15}}>{icon}</span>}{children}</button>;}
function Modal({title,onClose,children}){useEffect(()=>{document.body.style.overflow='hidden';return()=>{document.body.style.overflow='';};},[]);return(<div className="overlay af" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="sheet au"><div style={{width:36,height:4,background:'var(--cinzaM)',borderRadius:2,margin:'10px auto 2px'}}/><div className="mhdr"><span className="mtitle">{title}</span><button className="mclose" onClick={onClose}>✕</button></div><div style={{padding:'16px 18px 10px'}}>{children}</div><div style={{height:'calc(16px + var(--safe))'}}/></div></div>);}
function Fld({label,children,h}){return <div className="fld" style={{flex:h?'1 1 calc(50% - 6px)':'1 1 100%'}}><label className="flbl">{label}</label>{children}</div>;}

function FeeCalc({forma,vlrBruto,tipo}){if(tipo!=='RECEITA'||!vlrBruto||+vlrBruto===0)return null;const fd=FORMAS[forma]||{taxa:0};const taxa=fd.taxa;const vt=taxa*+vlrBruto;const vl=+vlrBruto-vt;if(taxa===0)return <div className="fee-box"><div className="fee-r"><span style={{color:'var(--cinzaE)'}}>Taxa {FORMAS[forma]?.label}</span><span className="tag" style={{background:'#E8F5EE',color:'var(--verde)'}}>0% — sem desconto</span></div><div className="fee-r fee-net"><span>Valor a receber</span><span style={{color:'var(--verde)',fontFamily:'var(--ff)',fontSize:17}}>{brl(+vlrBruto)}</span></div></div>;return(<div className="fee-box"><div className="fee-r"><span style={{color:'var(--cinzaE)'}}>Valor bruto</span><span>{brl(+vlrBruto)}</span></div><div className="fee-r"><span style={{color:'var(--coral)'}}>Taxa {pp(taxa)}</span><span style={{color:'var(--coral)'}}>−{brl(vt)}</span></div><div className="fee-r fee-net"><span>Valor líquido</span><span style={{color:'var(--verde)',fontFamily:'var(--ff)',fontSize:17}}>{brl(vl)}</span></div></div>);}

function Anexos({anexos=[],onChange}){const ref=useRef();const[prev,setPrev]=useState(null);const add=async(files)=>{const p=await Promise.all(Array.from(files).map(compressImg));onChange([...anexos,...p]);};return(<div><div className="att-grid">{anexos.map((a,i)=>(<div key={i} style={{position:'relative'}}>{a.type==='image'?<img src={a.data} className="att-thumb" alt="" onClick={()=>setPrev(a)}/>:<div className="att-pdf" onClick={()=>setPrev(a)}><span style={{fontSize:22}}>📄</span><span style={{fontSize:9,color:'var(--cinzaE)'}}>{(a.name||'').slice(0,10)}</span></div>}<button onClick={()=>onChange(anexos.filter((_,j)=>j!==i))} style={{position:'absolute',top:-6,right:-6,width:20,height:20,borderRadius:'50%',background:'var(--coral)',color:'var(--branco)',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button></div>))}<div className="att-add" onClick={()=>ref.current.click()}><span style={{fontSize:22}}>📎</span><span>Anexo</span></div></div><input ref={ref} type="file" accept="image/*,application/pdf" capture="environment" multiple onChange={e=>add(e.target.files)}/>{prev&&(<Modal title={prev.name||'Comprovante'} onClose={()=>setPrev(null)}>{prev.type==='image'?<img src={prev.data} style={{width:'100%',borderRadius:8}} alt=""/>:<div style={{textAlign:'center',padding:32}}><span style={{fontSize:48}}>📄</span><p style={{marginTop:10,color:'var(--cinzaE)',marginBottom:14}}>{prev.name}</p><a href={prev.data} download={prev.name||'comprovante.pdf'} style={{color:'var(--azul)',fontWeight:600}}>⬇ Baixar PDF</a></div>}</Modal>)}</div>);}

// ── FORM LANÇAMENTO ───────────────────────────────────────────────
const EL={status:'PAGO',tipo:'DESPESA',natureza:'DESPESA FIXA',dataDoc:td(),categoria:'OUTROS',subcategoria:'OUTROS',descricao:'',clienteFornecedor:'',projeto:'',competencia:'',forma:'PIX',vlrBruto:'',taxaPct:0,vlrTaxa:0,vlrLiquido:'',dataPrevista:td(),vlrPago:'',dataPago:td(),pagador:'ZESTE',reembolso:'',obs:'',anexos:[],cartao:'',cartaoNome:'',cartaoBandeira:'',cartaoUlt4:'',cartaoTitular:'',cartaoDiaFecha:'',cartaoDiaVence:'',recorrente:false,recorrenciaFreq:'mensal',isParcelado:false,nParcelas:2,diaParcela:'',parcelaAtual:'',parcelaTotal:''};

function FormL({init,onSave,onClose,lancamentos=[]}){
  const[f,setF]=useState(()=>({...EL,...(init||{}),id:(init?.id||uid())}));
  const S=(k,v)=>setF(p=>({...p,[k]:v}));
  const[sugs,setSugs]=useState([]);const[showSugs,setShowSugs]=useState(false);
  const filterSugs=txt=>{if(!txt||txt.length<2){setSugs([]);return;}const seen=new Set();const r=lancamentos.filter(l=>l.descricao?.toLowerCase().includes(txt.toLowerCase())).sort((a,b)=>(b.dataDoc||'').localeCompare(a.dataDoc||'')).filter(l=>{if(seen.has(l.descricao))return false;seen.add(l.descricao);return true;}).slice(0,6);setSugs(r);};
  const applySug=l=>{setF(p=>({...p,descricao:l.descricao,categoria:l.categoria||p.categoria,subcategoria:l.subcategoria||p.subcategoria,vlrBruto:l.vlrBruto||p.vlrBruto,forma:l.forma||p.forma,pagador:l.pagador||p.pagador,clienteFornecedor:l.clienteFornecedor||p.clienteFornecedor}));setSugs([]);setShowSugs(false);};
  const classif = f.tipo==='RECEITA'?'receita':f.natureza==='INVESTIMENTO'||f.categoria==='INVESTIMENTO'?'investimento':f.natureza==='PRÓ-LABORE'||f.categoria==='PRÓ-LABORE'?'retirada':'desp_op';
  const setClassif = id => {const opt=CLASSIF_OPTS.find(o=>o.id===id);if(!opt)return;setF(p=>({...p,tipo:opt.tipo,natureza:opt.natureza||(opt.tipo==='DESPESA'?'DESPESA FIXA':''),categoria:opt.cat||p.categoria,status:opt.tipo==='RECEITA'?'RECEBIDO':'PAGO'}));};
  useEffect(()=>{if(f.tipo==='RECEITA'){const fd=FORMAS[f.forma]||{taxa:0};const t=fd.taxa;const vt=f.vlrBruto?t*+f.vlrBruto:0;const vl=f.vlrBruto?+f.vlrBruto-vt:'';setF(p=>({...p,taxaPct:t,vlrTaxa:vt,vlrLiquido:vl}));};},[f.forma,f.vlrBruto,f.tipo]);
  useEffect(()=>{if(f.tipo==='RECEITA'&&!SR.includes(f.status))S('status','RECEBIDO');if(f.tipo==='DESPESA'&&!SD.includes(f.status))S('status','PAGO');},[f.tipo]);
  const sub=SUBS[f.categoria]||['OUTROS'];
  const catCustom=!CATS.includes(f.categoria);
  const pagCustom=!PAGADORES.includes(f.pagador);
  const[salvando,setSalvando]=useState(false);
  const submit=async e=>{
    e.preventDefault();
    setSalvando(true);
    try{
      if(f.isParcelado&&+f.nParcelas>1&&f.vlrBruto){
        const n=+f.nParcelas;
        const vlrP=((+(f.vlrBruto)||0)/n).toFixed(2);
        for(let i=0;i<n;i++){
          const d=new Date((f.dataDoc||td())+'T12:00:00');
          d.setMonth(d.getMonth()+i);
          if(f.diaParcela) d.setDate(+f.diaParcela);
          const dataStr=d.toISOString().slice(0,10);
          await onSave({...f,id:i===0?f.id:uid(),vlrBruto:vlrP,vlrPago:f.status==='PAGO'?vlrP:'',
            dataDoc:dataStr,competencia:dataStr.slice(0,7),dataPago:f.status==='PAGO'?dataStr:f.dataPago,
            descricao:`${f.descricao} — Parcela ${i+1}/${n}`,parcelaAtual:i+1,parcelaTotal:n,isParcelado:false});
        }
      } else {
        await onSave({...f});
      }
    } finally { setSalvando(false); }
  };
  return(<form onSubmit={submit}><div className="fg">
    <Fld label="Classificação do Lançamento">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:3}}>
        {CLASSIF_OPTS.map(opt=>{const cc=CC[opt.id];const sel=classif===opt.id;return(<button key={opt.id} type="button" onClick={()=>setClassif(opt.id)} style={{padding:'11px 10px',borderRadius:8,border:'2px solid '+(sel?cc.bg:'var(--cinzaM)'),background:sel?cc.bg:'transparent',color:sel?cc.fg:'var(--cinzaE)',textAlign:'center',cursor:'pointer',transition:'all .15s'}}>
          <div style={{fontSize:18,marginBottom:3}}>{cc.icon}</div>
          <div style={{fontFamily:'var(--ff)',fontSize:11,fontWeight:700,letterSpacing:'.05em'}}>{cc.label}</div>
          <div style={{fontSize:9,marginTop:2,opacity:.8}}>{cc.desc}</div>
        </button>);})}
      </div>
    </Fld>
    <Fld label="Status" h><select value={f.status} onChange={e=>S('status',e.target.value)}>{(f.tipo==='RECEITA'?SR:SD).map(s=><option key={s}>{s}</option>)}</select></Fld>
    <Fld label="Data" h><input type="date" value={f.dataDoc} onChange={e=>S('dataDoc',e.target.value)}/></Fld>
    <Fld label="Competência" h><input type="month" value={f.competencia} onChange={e=>S('competencia',e.target.value)}/></Fld>
    <Fld label="Categoria">
      <select value={catCustom?'__c':f.categoria} onChange={e=>{const v=e.target.value;if(v==='__c')S('categoria','');else{S('categoria',v);S('subcategoria',SUBS[v]?.[0]||'OUTROS');if(f.tipo==='DESPESA')S('natureza',CAT_NAT[v]||'DESPESA FIXA');}}}>
        {CATS.map(c=><option key={c}>{c}</option>)}<option value="__c">✏️ Digitar...</option>
      </select>
      {catCustom&&<input style={{marginTop:6}} placeholder="Nome da categoria" value={f.categoria} onChange={e=>S('categoria',e.target.value)}/>}
    </Fld>
    {!catCustom&&<Fld label="Subcategoria"><input list="subcat-list" value={f.subcategoria} onChange={e=>S('subcategoria',e.target.value)} placeholder="Digitar ou escolher…"/><datalist id="subcat-list">{sub.map(s=><option key={s} value={s}/>)}</datalist></Fld>}

    {f.tipo==='DESPESA'&&<Fld label="Recorrente?">
      <div style={{display:'flex',gap:8,marginBottom:f.recorrente?8:0}}>
        <button type="button" onClick={()=>S('recorrente',false)} style={{flex:1,padding:'9px 12px',borderRadius:6,border:'1.5px solid '+(f.recorrente?'var(--cinzaM)':'var(--lima)'),background:f.recorrente?'transparent':'var(--lima)',color:f.recorrente?'var(--cinzaE)':'var(--preto)',fontWeight:700,fontSize:13,minHeight:40}}>Compra única</button>
        <button type="button" onClick={()=>S('recorrente',true)} style={{flex:1,padding:'9px 12px',borderRadius:6,border:'1.5px solid '+(f.recorrente?'var(--lima)':'var(--cinzaM)'),background:f.recorrente?'var(--lima)':'transparent',color:f.recorrente?'var(--preto)':'var(--cinzaE)',fontWeight:700,fontSize:13,minHeight:40}}>🔄 Recorrente</button>
      </div>
      {f.recorrente&&<>
        <select value={f.recorrenciaFreq||'mensal'} onChange={e=>S('recorrenciaFreq',e.target.value)} style={{width:'100%',marginBottom:5}}>
          <option value="semanal">📅 Semanal (toda semana)</option>
          <option value="quinzenal">📅 Quinzenal (a cada 15 dias)</option>
          <option value="mensal">📅 Mensal (todo mês)</option>
          <option value="trimestral">📅 Trimestral (a cada 3 meses)</option>
          <option value="semestral">📅 Semestral (a cada 6 meses)</option>
          <option value="anual">📅 Anual (uma vez por ano)</option>
        </select>
        <div style={{fontSize:11,color:'var(--verde)',fontWeight:600}}>✓ Projetado automaticamente na aba Previsões</div>
      </>}
    </Fld>}
    {f.tipo==='DESPESA'&&<Fld label="Parcelado?">
      <div style={{display:'flex',gap:8,marginBottom:f.isParcelado?8:0}}>
        <button type="button" onClick={()=>S('isParcelado',false)} style={{flex:1,padding:'9px 12px',borderRadius:6,border:'1.5px solid '+(f.isParcelado?'var(--cinzaM)':'var(--coral)'),background:f.isParcelado?'transparent':'var(--coral)',color:f.isParcelado?'var(--cinzaE)':'var(--branco)',fontWeight:700,fontSize:13,minHeight:40}}>Compra à vista</button>
        <button type="button" onClick={()=>S('isParcelado',true)} style={{flex:1,padding:'9px 12px',borderRadius:6,border:'1.5px solid '+(f.isParcelado?'var(--coral)':'var(--cinzaM)'),background:f.isParcelado?'var(--coral)':'transparent',color:f.isParcelado?'var(--branco)':'var(--cinzaE)',fontWeight:700,fontSize:13,minHeight:40}}>📋 Parcelado</button>
      </div>
      {f.isParcelado&&<>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--cinzaE)',marginBottom:4,letterSpacing:'.06em'}}>FORMA DE PAGAMENTO (aplicada em todas as parcelas)</div>
          <select value={f.forma} onChange={e=>S('forma',e.target.value)} style={{width:'100%',border:'1.5px solid var(--cinzaM)',borderRadius:7,padding:'9px 10px',fontSize:14}}>
            {Object.keys(FORMAS).map(k=><option key={k} value={k}>{FORMAS[k].icon} {FORMAS[k].label}</option>)}
          </select>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
          <div><div style={{fontSize:10,fontWeight:700,color:'var(--cinzaE)',marginBottom:4,letterSpacing:'.06em'}}>Nº DE PARCELAS</div><input type="number" min="2" max="48" value={f.nParcelas} onChange={e=>S('nParcelas',+e.target.value)} style={{width:'100%',border:'1.5px solid var(--cinzaM)',borderRadius:7,padding:'9px 10px',fontSize:14,textAlign:'center',fontFamily:'var(--ff)',fontWeight:700}}/></div>
          <div><div style={{fontSize:10,fontWeight:700,color:'var(--cinzaE)',marginBottom:4,letterSpacing:'.06em'}}>DIA DO VENCIMENTO</div><input type="number" min="1" max="28" value={f.diaParcela} onChange={e=>S('diaParcela',e.target.value)} placeholder="Ex: 15" style={{width:'100%',border:'1.5px solid var(--cinzaM)',borderRadius:7,padding:'9px 10px',fontSize:14,textAlign:'center',fontFamily:'var(--ff)'}}/></div>
        </div>
        {f.vlrBruto&&f.nParcelas>=2&&<div style={{background:'#FFF5F5',border:'1.5px solid var(--coral)',borderRadius:8,padding:'10px 13px',fontSize:12}}>
          <div style={{fontWeight:700,color:'var(--coral)',marginBottom:6}}>📋 Serão criados {f.nParcelas} lançamentos:</div>
          {Array.from({length:Math.min(f.nParcelas,4)},(_,i)=>{
            const d=new Date((f.dataDoc||td())+'T12:00:00');d.setMonth(d.getMonth()+i);if(f.diaParcela)d.setDate(+f.diaParcela);
            return<div key={i} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:i<Math.min(f.nParcelas,4)-1?'1px dashed #f0c0c0':'none'}}>
              <span style={{color:'var(--cinzaE)'}}>{f.descricao||'Descrição'} — Parcela {i+1}/{f.nParcelas}</span>
              <span style={{fontFamily:'var(--ff)',fontWeight:700,color:'var(--coral)'}}>{brl((+(f.vlrBruto)||0)/f.nParcelas)}</span>
            </div>;
          })}
          {f.nParcelas>4&&<div style={{fontSize:11,color:'var(--cinzaE)',marginTop:4}}>+{f.nParcelas-4} parcelas...</div>}
        </div>}
      </>}
    </Fld>}
    <Fld label="Descrição">
      <div style={{position:'relative'}}>
        <input required value={f.descricao}
          onChange={e=>{S('descricao',e.target.value);filterSugs(e.target.value);setShowSugs(true);}}
          onFocus={()=>f.descricao.length>=2&&setShowSugs(true)}
          onBlur={()=>setTimeout(()=>setShowSugs(false),200)}
          placeholder="Ex: Consultoria operacional cliente X"/>
        {showSugs&&sugs.length>0&&<div style={{position:'absolute',top:'100%',left:0,right:0,background:'var(--branco)',border:'1.5px solid var(--lima)',borderRadius:8,boxShadow:'0 4px 20px rgba(0,0,0,.12)',zIndex:200,overflow:'hidden',marginTop:2}}>
          {sugs.map((l,i)=><div key={i} onMouseDown={()=>applySug(l)}
            style={{padding:'9px 12px',cursor:'pointer',borderBottom:i<sugs.length-1?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--cinzaF)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div><div style={{fontFamily:'var(--ff)',fontWeight:700,fontSize:13}}>{l.descricao}</div><div style={{fontSize:11,color:'var(--cinzaE)',marginTop:1}}>{l.categoria}{l.clienteFornecedor?' · '+l.clienteFornecedor:''}</div></div>
            <div style={{fontFamily:'var(--ff)',fontSize:13,fontWeight:700,color:getClassif(l)==='receita'?'var(--verde)':'var(--coral)',flexShrink:0,marginLeft:10}}>{brl(+(l.vlrBruto)||0)}</div>
          </div>)}
          <div style={{padding:'6px 12px',fontSize:10,color:'var(--cinzaE)',background:'var(--cinzaF)',borderTop:'1px solid var(--cinzaM)'}}>↑ Clique pra preencher automaticamente</div>
        </div>}
      </div>
    </Fld>
    <Fld label="Cliente / Fornecedor" h><input value={f.clienteFornecedor} onChange={e=>S('clienteFornecedor',e.target.value)} placeholder="Nome"/></Fld>
    <Fld label="Projeto" h><input value={f.projeto} onChange={e=>S('projeto',e.target.value)} placeholder="Projeto"/></Fld>
    <Fld label="Forma de Pagamento" h><select value={f.forma} onChange={e=>S('forma',e.target.value)}>{Object.entries(FORMAS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></Fld>

    {f.tipo==='DESPESA'&&f.forma.includes('CRÉDITO')&&(<div style={{background:'#1a1a17',borderRadius:10,padding:'14px 16px',marginTop:2,marginBottom:6,border:'1px solid #2a2a28'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:12}}><span style={{fontSize:16}}>💳</span><span style={{fontFamily:'var(--ff)',fontSize:13,fontWeight:700,color:'var(--lima)',letterSpacing:'.08em'}}>CARTÃO DE CRÉDITO</span></div>
      <div className="fg">
        <Fld label="Nome do Cartão" h><input value={f.cartaoNome||''} onChange={e=>S('cartaoNome',e.target.value)} placeholder="Ex: Nubank Amanda" style={{background:'#222',border:'1.5px solid #333',color:'#E8E0CC'}}/></Fld>
        <Fld label="Últimos 4 dígitos" h><input maxLength={4} value={f.cartaoUlt4||''} onChange={e=>S('cartaoUlt4',e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="0000" style={{background:'#222',border:'1.5px solid #333',color:'#E8E0CC'}}/></Fld>
        <Fld label="Bandeira" h><select value={f.cartaoBandeira||''} onChange={e=>S('cartaoBandeira',e.target.value)} style={{background:'#222',border:'1.5px solid #333',color:'#E8E0CC'}}><option value="">Selecionar</option><option>Visa</option><option>Mastercard</option><option>Elo</option><option>Amex</option><option>Hipercard</option></select></Fld>
        <Fld label="Titular" h><select value={f.cartaoTitular||''} onChange={e=>S('cartaoTitular',e.target.value)} style={{background:'#222',border:'1.5px solid #333',color:'#E8E0CC'}}><option value="">Selecionar</option><option>AMANDA</option><option>BRUNA</option><option>ZESTE</option></select></Fld>
        <Fld label="Dia Fechamento Fatura" h><input type="number" min="1" max="28" value={f.cartaoDiaFecha||''} onChange={e=>S('cartaoDiaFecha',e.target.value)} placeholder="Ex: 15" style={{background:'#222',border:'1.5px solid #333',color:'#E8E0CC'}}/></Fld>
        <Fld label="Dia Pagamento Fatura" h><input type="number" min="1" max="28" value={f.cartaoDiaVence||''} onChange={e=>S('cartaoDiaVence',e.target.value)} placeholder="Ex: 25" style={{background:'#222',border:'1.5px solid #333',color:'#E8E0CC'}}/></Fld>
        <Fld label="Despesa Recorrente?"><div style={{display:'flex',gap:8}}>
          <button type="button" onClick={()=>S('recorrente',false)} style={{flex:1,padding:'9px 12px',borderRadius:6,border:'1.5px solid '+(f.recorrente?'#333':'var(--lima)'),background:f.recorrente?'transparent':'var(--lima)',color:f.recorrente?'#666':'var(--preto)',fontWeight:700,fontSize:13,minHeight:40}}>Não</button>
          <button type="button" onClick={()=>S('recorrente',true)} style={{flex:1,padding:'9px 12px',borderRadius:6,border:'1.5px solid '+(f.recorrente?'var(--lima)':'#333'),background:f.recorrente?'var(--lima)':'transparent',color:f.recorrente?'var(--preto)':'#666',fontWeight:700,fontSize:13,minHeight:40}}>Sim, todo mês</button>
        </div></Fld>
      </div>
      {f.cartaoDiaFecha&&f.cartaoDiaVence&&<div style={{marginTop:10,background:'#111',borderRadius:6,padding:'10px 12px',fontSize:12,color:'var(--cinzaE)',borderLeft:'3px solid var(--azul)'}}>
        📅 Fatura fecha dia <strong style={{color:'var(--lima)'}}>{f.cartaoDiaFecha}</strong> · Vence dia <strong style={{color:'var(--coral)'}}>{f.cartaoDiaVence}</strong>
        {f.recorrente&&<span style={{color:'var(--lima)'}}> · 🔄 Recorrente</span>}
      </div>}
    </div>)}
    <Fld label={f.tipo==='RECEITA'?'Valor Bruto (R$)':'Valor (R$)'} h><NumBR value={f.vlrBruto} onChange={v=>S('vlrBruto',v)}/></Fld>
    {f.vlrBruto&&f.tipo==='RECEITA'&&<Fld label="Simulação de Taxa"><FeeCalc forma={f.forma} vlrBruto={f.vlrBruto} tipo={f.tipo}/></Fld>}
    {f.tipo==='DESPESA'&&<><Fld label="Valor Pago (R$)" h><NumBR value={f.vlrPago??''} onChange={v=>S('vlrPago',v)}/></Fld><Fld label="Data Pagamento" h><input type="date" value={f.dataPago} onChange={e=>S('dataPago',e.target.value)}/></Fld></>}
    {f.tipo==='RECEITA'&&<><Fld label="Data Prevista" h><input type="date" value={f.dataPrevista} onChange={e=>S('dataPrevista',e.target.value)}/></Fld><Fld label="Data Recebimento" h><input type="date" value={f.dataPago} onChange={e=>S('dataPago',e.target.value)}/></Fld></>}
    <Fld label="Pago por">
      <select value={pagCustom?'__c':f.pagador} onChange={e=>{const v=e.target.value;if(v==='__c')S('pagador','');else S('pagador',v);}}>
        {PAGADORES.map(p=><option key={p}>{p}</option>)}<option value="__c">✏️ Outro...</option>
      </select>
      {pagCustom&&<input style={{marginTop:6}} placeholder="Quem pagou?" value={f.pagador} onChange={e=>S('pagador',e.target.value)}/>}
    </Fld>
    {f.tipo==='DESPESA'&&(<Fld label="Reembolso">
      <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:3}}>
        {[['','Não aplicável','var(--cinzaM)','var(--cinzaE)'],['PENDENTE','⏳ Pendente','#F59E0B','#92400E'],['CONCLUÍDO','✅ Concluído','#10B981','#fff']].map(([v,l,bg,fg])=>(
          <button key={v} type="button" onClick={()=>S('reembolso',v)} style={{padding:'8px 13px',borderRadius:6,border:`1.5px solid ${bg}`,background:f.reembolso===v?bg:'transparent',color:f.reembolso===v?fg:bg==='var(--cinzaM)'?'var(--cinzaE)':bg,fontFamily:'var(--ff)',fontSize:12,fontWeight:700,minHeight:40}}>{l}</button>
        ))}
      </div>
      {f.reembolso==='PENDENTE'&&<div style={{marginTop:6,background:'#FFFBEB',borderLeft:'3px solid #F59E0B',borderRadius:6,padding:'8px 10px',fontSize:12,color:'#92400E'}}>⚠️ {f.pagador||'Pagador'} pagou e ainda precisa ser reembolsado.</div>}
    </Fld>)}
    <Fld label="Observações"><textarea rows={2} value={f.obs} onChange={e=>S('obs',e.target.value)} style={{resize:'vertical',minHeight:52}} placeholder="Informações adicionais…"/></Fld>
    <Fld label="Comprovantes"><Anexos anexos={f.anexos} onChange={v=>S('anexos',v)}/></Fld>
  </div>
  <div style={{display:'flex',gap:9,justifyContent:'flex-end',marginTop:20,flexWrap:'wrap'}}>
    <Btn v="g" onClick={onClose}>Cancelar</Btn><Btn v="p" icon={salvando?"⏳":"✓"} type="submit" disabled={salvando}>{salvando?(f.isParcelado?'Salvando '+f.nParcelas+'x…':'Salvando…'):`Salvar${f.isParcelado&&+f.nParcelas>1?` (${f.nParcelas}x)`:''}` }</Btn>
  </div></form>);
}

// ── FORM CLIENTE ──────────────────────────────────────────────────
const EC={cliente:'',estabelecimento:'',projeto:'',inicio:td(),prazo:'',statusProjeto:'PROPOSTA',vlrContratado:'',vlrRecebido:'',forma:'PIX',obs:'',anexos:[],tipoCobranca:'unico',parcelas:1,diaPagamento:5,duracaoMeses:1,servicoTipo:'Consultoria'};
function FormC({init,onSave,onClose}){
  const[f,setF]=useState(()=>({...EC,...(init||{}),id:(init?.id||uid())}));
  const S=(k,v)=>setF(p=>({...p,[k]:v}));
  const vlrParcela = f.tipoCobranca==='parcelado'&&f.parcelas>0?(+(f.vlrContratado)||0)/f.parcelas:+(f.vlrContratado)||0;
  // Custom installments state for 'parcelado' (free-form)
  const[parcCustom,setParcCustom]=useState(()=>{
    const n=+(init?.parcelas||2); const vlr=+(init?.vlrContratado||0);
    return Array.from({length:n},(_,i)=>({id:i+1,valor:(vlr/n).toFixed(2),vencimento:''}));
  });
  const syncParcCustom=(nParcelas,vlrTotal)=>{
    const n=+nParcelas||2; const vlr=+(vlrTotal)||0;
    setParcCustom(prev=>{
      const next=Array.from({length:n},(_,i)=>prev[i]||{id:i+1,valor:(vlr/n).toFixed(2),vencimento:''});
      // Redistribute value equally when resizing
      if(n!==prev.length) return next.map(p=>({...p,valor:(vlr/n).toFixed(2)}));
      return next;
    });
  };
  const updParc=(i,k,v)=>setParcCustom(prev=>prev.map((p,j)=>j===i?{...p,[k]:v}:p));
  const addParc=()=>setParcCustom(prev=>[...prev,{id:prev.length+1,valor:'',vencimento:''}]);
  const rmParc=i=>setParcCustom(prev=>prev.filter((_,j)=>j!==i));
  return(<form onSubmit={e=>{e.preventDefault();onSave({...f,_parcCustom:f.tipoCobranca==='parcelado'?parcCustom:null});}}><div className="fg"><Fld label="Nome do Cliente" h><input required value={f.cliente} onChange={e=>S('cliente',e.target.value)} placeholder="Nome"/></Fld><Fld label="Estabelecimento" h><input value={f.estabelecimento} onChange={e=>S('estabelecimento',e.target.value)} placeholder="Restaurante / Bar"/></Fld><Fld label="Projeto / Escopo"><input required value={f.projeto} onChange={e=>S('projeto',e.target.value)} placeholder="Descreva o escopo"/></Fld><Fld label="Status" h><select value={f.statusProjeto} onChange={e=>S('statusProjeto',e.target.value)}>{Object.keys(SPROJ).map(s=><option key={s}>{s}</option>)}</select></Fld><Fld label="Forma Pgto" h><select value={f.forma} onChange={e=>S('forma',e.target.value)}>{Object.entries(FORMAS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></Fld><Fld label="Início" h><input type="date" value={f.inicio} onChange={e=>S('inicio',e.target.value)}/></Fld><Fld label="Prazo Previsto" h><input type="date" value={f.prazo} onChange={e=>S('prazo',e.target.value)}/></Fld><Fld label="Valor Contratado (R$)" h><NumBR value={f.vlrContratado} onChange={v=>S('vlrContratado',v)}/></Fld><Fld label="Valor Recebido (R$)" h><NumBR value={f.vlrRecebido} onChange={v=>S('vlrRecebido',v)}/></Fld><Fld label="Tipo de Cobrança">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:7,marginTop:3}}>
        {[['unico','💳 Único','Pagamento em uma vez'],['parcelado','📋 Parcelado','Dividido em parcelas'],['mensal','🔄 Mensal','Valor recorrente mensal']].map(([id,l,desc])=>(
          <button key={id} type="button" onClick={()=>S('tipoCobranca',id)} style={{padding:'9px 8px',borderRadius:7,border:'2px solid '+(f.tipoCobranca===id?'var(--verde)':'var(--cinzaM)'),background:f.tipoCobranca===id?'var(--verde)':'transparent',color:f.tipoCobranca===id?'var(--branco)':'var(--cinzaE)',cursor:'pointer',textAlign:'center'}}>
            <div style={{fontFamily:'var(--ff)',fontSize:11,fontWeight:700}}>{l}</div>
            <div style={{fontSize:9,marginTop:2,opacity:.8}}>{desc}</div>
          </button>
        ))}
      </div>
    </Fld>
    {f.tipoCobranca==='parcelado'&&<><Fld label="Nº de Parcelas" h><input type="number" min="2" max="36" value={f.parcelas} onChange={e=>S('parcelas',+e.target.value)} placeholder="Ex: 3"/></Fld><Fld label="Dia do Pagamento" h><input type="number" min="1" max="28" value={f.diaPagamento} onChange={e=>S('diaPagamento',+e.target.value)} placeholder="Ex: 5"/></Fld></>}
    {f.tipoCobranca==='mensal'&&<><Fld label="Duração (meses)" h><input type="number" min="1" max="60" value={f.duracaoMeses} onChange={e=>S('duracaoMeses',+e.target.value)} placeholder="Ex: 6"/></Fld><Fld label="Dia do Pagamento" h><input type="number" min="1" max="28" value={f.diaPagamento} onChange={e=>S('diaPagamento',+e.target.value)} placeholder="Ex: 5"/></Fld></>}
    {f.tipoCobranca==='parcelado'&&f.vlrContratado&&<div style={{marginTop:4}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{fontSize:11,fontWeight:700,color:'var(--verde)',letterSpacing:'.05em'}}>📋 PARCELAS — defina valor e vencimento</div>
        <button type="button" onClick={addParc} style={{fontSize:11,padding:'4px 10px',borderRadius:6,border:'1px solid var(--verde)',color:'var(--verde)',background:'transparent',cursor:'pointer',fontWeight:700}}>+ Parcela</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {parcCustom.map((p,i)=>(
          <div key={p.id} style={{display:'grid',gridTemplateColumns:'auto 1fr 1fr auto',gap:6,alignItems:'center',background:'var(--cinzaF)',borderRadius:8,padding:'8px 10px'}}>
            <span style={{fontFamily:'var(--ff)',fontSize:12,fontWeight:700,color:'var(--cinzaE)',minWidth:24}}>{i+1}×</span>
            <div><div style={{fontSize:9,color:'var(--cinzaE)',marginBottom:2,fontWeight:700}}>VALOR (R$)</div><NumBR value={p.valor} onChange={v=>updParc(i,'valor',v)} style={{width:'100%',border:'1.5px solid var(--cinzaM)',borderRadius:6,padding:'7px 8px',fontSize:13,fontFamily:'var(--ff)',fontWeight:700,color:'var(--verde)'}}/></div>
            <div><div style={{fontSize:9,color:'var(--cinzaE)',marginBottom:2,fontWeight:700}}>VENCIMENTO</div><input type="date" value={p.vencimento} onChange={e=>updParc(i,'vencimento',e.target.value)} style={{width:'100%',border:'1.5px solid var(--cinzaM)',borderRadius:6,padding:'7px 8px',fontSize:13}}/></div>
            {parcCustom.length>1&&<button type="button" onClick={()=>rmParc(i)} style={{background:'#FEE2E2',border:'none',borderRadius:6,color:'var(--coral)',padding:'6px 8px',cursor:'pointer',fontSize:13}}>✕</button>}
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:6,padding:'8px 10px',background:'#F0F7E6',borderRadius:7}}>
        <span style={{fontSize:12,color:'var(--cinzaE)'}}>Total definido</span>
        <span style={{fontFamily:'var(--ff)',fontWeight:700,color:'var(--verde)',fontSize:14}}>{brl(parcCustom.reduce((s,p)=>s+(+(p.valor)||0),0))}</span>
      </div>
    </div>}
    {f.tipoCobranca==='mensal'&&f.vlrContratado&&<div style={{padding:'10px 14px',background:'var(--cinzaF)',borderRadius:8,fontSize:12,color:'var(--cinzaE)'}}>
      🔄 {brl(+(f.vlrContratado)||0)}/mês por {f.duracaoMeses} {f.duracaoMeses===1?'mês':'meses'} · todo dia {f.diaPagamento}
    </div>}
    <Fld label="Observações"><textarea rows={2} value={f.obs} onChange={e=>S('obs',e.target.value)} style={{resize:'vertical',minHeight:52}}/></Fld>
    <Fld label="Contrato / Documentos"><Anexos anexos={f.anexos} onChange={v=>S('anexos',v)}/></Fld>
    </div><div style={{display:'flex',gap:9,justifyContent:'flex-end',marginTop:20}}>
    <Btn v="g" onClick={onClose}>Cancelar</Btn><Btn v="p" icon="✓" type="submit">Salvar</Btn>
  </div></form>);}
function DelModal({msg,onConfirm,onClose}){return <Modal title="Confirmar" onClose={onClose}><p style={{color:'var(--cinzaE)',marginBottom:20,lineHeight:1.5}}>{msg}</p><div style={{display:'flex',gap:9,justifyContent:'flex-end'}}><Btn v="g" onClick={onClose}>Cancelar</Btn><Btn v="d" onClick={onConfirm} icon="🗑">Excluir</Btn></div></Modal>;}

// ── LIXEIRA ───────────────────────────────────────────────────────
function LixeiraModal({lixeira,onRestore,onPurge,onClose}){
  return(<Modal title={`Lixeira (${lixeira.length})`} onClose={onClose}>
    {lixeira.length===0&&<div style={{textAlign:'center',padding:32,color:'var(--cinzaE)',fontStyle:'italic'}}>Lixeira vazia</div>}
    {lixeira.map(l=>{const vlr=+(l.vlrPago||l.vlrLiquido||l.vlrBruto)||0;const isR=l.tipo==='RECEITA';return(<div key={l.id} style={{padding:'12px 0',borderBottom:'1px solid var(--cinzaF)',display:'flex',alignItems:'center',gap:10}}>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.descricao}</div><div style={{fontSize:11,color:'var(--cinzaE)',marginTop:2}}>{dbr(l.dataDoc)} · <span style={{color:isR?'var(--verde)':'var(--coral)',fontWeight:700}}>{isR?'+':'-'}{brl(vlr)}</span>{l.cartaoNome?<span style={{marginLeft:6}}>💳 {l.cartaoNome}{l.cartaoUlt4?` ****${l.cartaoUlt4}`:''}{l.recorrente?' 🔄':''}</span>:null}</div></div>
      <div style={{display:'flex',gap:6,flexShrink:0}}>
        <button onClick={()=>onRestore(l.id)} style={{background:'#ECFDF5',border:'1.5px solid #10B981',borderRadius:6,padding:'8px 11px',fontSize:13,fontWeight:600,color:'#065F46',cursor:'pointer',minHeight:40}}>↩</button>
        <button onClick={()=>onPurge(l.id)} style={{background:'#FFF5F5',border:'1.5px solid var(--coral)',borderRadius:6,padding:'8px 11px',fontSize:13,color:'var(--coral)',cursor:'pointer',minHeight:40}}>✕</button>
      </div>
    </div>);})}
    {lixeira.length>0&&<div style={{marginTop:14,textAlign:'center'}}><button onClick={()=>lixeira.forEach(l=>onPurge(l.id))} style={{background:'#FFF5F5',border:'1.5px solid var(--coral)',borderRadius:8,padding:'10px 18px',fontSize:13,fontWeight:600,color:'var(--coral)',cursor:'pointer'}}>🗑 Esvaziar lixeira</button></div>}
  </Modal>);
}

// ── IMPORTAR EXCEL ────────────────────────────────────────────────
function ImportarExcel({onImport,onClose}){
  const[preview,setPreview]=useState(null);const[map,setMap]=useState({data:'',descricao:'',valor:'',tipo:''});const[cols,setCols]=useState([]);const[imp,setImp]=useState(false);const[ok,setOk]=useState(false);
  const handleFile=async e=>{const file=e.target.files[0];if(!file)return;const XLSX=await loadXLSX();const buf=await file.arrayBuffer();const wb=XLSX.read(buf);const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{header:1});const hdrs=rows[0].map(String);const dataRows=rows.slice(1).filter(r=>r.some(c=>c!==undefined&&c!==''));setCols(hdrs);setPreview({headers:hdrs,data:dataRows.slice(0,4),all:dataRows});
    // Auto-detectar TODAS as colunas
    const f=terms=>hdrs.findIndex(h=>terms.some(t=>h.toLowerCase().replace(/[*▼ ]/g,'').includes(t)));
    setMap({data:f(['data','date','dt']),descricao:f(['descri','hist','memo']),valor:f(['valor','value','amount','vlr']),tipo:f(['tipo','type']),status:f(['status']),competencia:f(['competencia','competência']),categoria:f(['categoria','category']),subcategoria:f(['subcategoria','sub']),natureza:f(['natureza','nature']),pagador:f(['pagador','pago por']),reembolso:f(['reembolso','reemb']),clienteFornecedor:f(['cliente','fornecedor','client']),projeto:f(['projeto','project']),forma:f(['forma','pagamento','payment']),vlrBruto:f(['bruto','gross']),vlrTaxa:f(['taxa']),vlrLiquido:f(['liquido','líquido','net']),vlrPago:f(['pago','paid']),obs:f(['obs','observ','notas','notes'])});};
  const confirmar=async()=>{if(!preview||map.data<0||map.descricao<0||map.valor<0)return;setImp(true);
    const g=(r,k)=>k>=0?String(r[k]||'').trim():'';
    const gn=(r,k)=>{if(k<0)return 0;const v=String(r[k]||'').replace(/[^\d,.-]/g,'').replace(',','.');return parseFloat(v)||0;};
    const parseData=(raw)=>{if(!raw)return td();if(typeof raw==='number'){const d=new Date((raw-25569)*86400000);return isNaN(d)?td():d.toISOString().split('T')[0];}const s=String(raw);const d=new Date(s);if(!isNaN(d)&&s.includes('-'))return d.toISOString().split('T')[0];if(s.includes('/')){const p=s.split('/');if(p.length===3)return(p[2].length===4?`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`:`20${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`);}return td();};
    const items=preview.all.map(r=>{
      const valor=Math.abs(gn(r,map.valor));if(!valor)return null;
      let tipo=g(r,map.tipo).toUpperCase();if(!tipo||(!tipo.includes('RECEITA')&&!tipo.includes('DESPESA'))){tipo=gn(r,map.valor)>0?'RECEITA':'DESPESA';}else{tipo=tipo.includes('RECEITA')?'RECEITA':'DESPESA';}
      const status=g(r,map.status).toUpperCase()||(tipo==='RECEITA'?'RECEBIDO':'PAGO');
      return{id:uid(),tipo,status,dataDoc:parseData(map.data>=0?r[map.data]:null),descricao:g(r,map.descricao)||'Importado',valor,vlrBruto:gn(r,map.vlrBruto)||valor,vlrTaxa:gn(r,map.vlrTaxa),vlrLiquido:gn(r,map.vlrLiquido),vlrPago:gn(r,map.vlrPago)||valor,competencia:g(r,map.competencia),categoria:g(r,map.categoria)||'OUTROS',subcategoria:g(r,map.subcategoria)||'OUTROS',natureza:g(r,map.natureza)||(tipo==='DESPESA'?'DESPESA FIXA':''),pagador:g(r,map.pagador)||'ZESTE',reembolso:g(r,map.reembolso),clienteFornecedor:g(r,map.clienteFornecedor),projeto:g(r,map.projeto),forma:g(r,map.forma)||'PIX',obs:g(r,map.obs),anexos:[]};
    }).filter(Boolean);await onImport(items);setOk(true);setTimeout(()=>{setOk(false);onClose();},2000);setImp(false);};
  return(<div style={{paddingBottom:8}}>
    <p style={{fontSize:13,color:'var(--cinzaE)',marginBottom:14,lineHeight:1.6}}>Upload de extrato .xlsx. O sistema detecta as colunas automaticamente.</p>
    <input type="file" id="xlsxFile2" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{display:'none'}}/>
    <label htmlFor="xlsxFile2" style={{display:'inline-flex',alignItems:'center',gap:8,background:'var(--azul)',color:'#fff',padding:'11px 18px',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:600,minHeight:44}}>📂 Selecionar arquivo</label>
    {preview&&(<div style={{marginTop:14}}>
      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
        {[['Data *','data'],['Descrição *','descricao'],['Valor *','valor'],['Tipo','tipo'],['Status','status'],['Competência','competencia'],['Categoria','categoria'],['Natureza','natureza'],['Pagador','pagador'],['Reembolso','reembolso'],['Cliente/Forn.','clienteFornecedor'],['Projeto','projeto'],['Forma Pgto','forma']].map(([l,k])=>(<div key={k} style={{flex:'1 1 calc(33% - 7px)',minWidth:100}}><div style={{fontSize:10,fontWeight:700,color:l.includes('*')?'var(--verde)':'var(--cinzaE)',marginBottom:3,textTransform:'uppercase'}}>{l}</div><select value={map[k]>=0?map[k]:''} onChange={e=>setMap(m=>({...m,[k]:e.target.value===''?-1:+e.target.value}))} style={{border:'1.5px solid var(--cinzaM)',borderRadius:8,padding:'8px 10px',fontSize:12,width:'100%',outline:'none',background:map[k]>=0?'#ECFDF5':'var(--branco)'}}><option value="">—</option>{cols.map((c,i)=><option key={i} value={i}>{c}</option>)}</select></div>))}
      </div>
      <div style={{overflowX:'auto',marginBottom:12}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}><thead><tr>{preview.headers.map(h=><th key={h} style={{padding:'5px 7px',background:'var(--cinzaF)',color:'var(--cinzaE)',textAlign:'left',border:'1px solid var(--cinzaM)',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead><tbody>{preview.data.map((r,i)=><tr key={i}>{preview.headers.map((_,j)=><td key={j} style={{padding:'4px 7px',border:'1px solid var(--cinzaM)',whiteSpace:'nowrap'}}>{String(r[j]||'')}</td>)}</tr>)}</tbody></table></div>
      <button className="btn btn-p" onClick={confirmar} disabled={imp||map.data<0||map.descricao<0||map.valor<0} style={{width:'100%',opacity:imp?.5:1}}>{imp?'IMPORTANDO…':`IMPORTAR ${preview.all.length} LANÇAMENTOS`}</button>
    </div>)}
    {ok&&<div style={{textAlign:'center',color:'var(--verde)',fontSize:13,fontWeight:700,marginTop:10}}>✅ Importação concluída!</div>}
  </div>);
}

// ── RESUMO ────────────────────────────────────────────────────────
function Resumo({lancamentos,setAba}){
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const mes = new Date().toISOString().slice(0,7);
  const hojeStr = hoje.toISOString().slice(0,10);

  // Classificar todos lançamentos do mês atual
  const doMes = lancamentos.filter(l=>(l.competencia||l.dataDoc||'').startsWith(mes));
  const pagos  = doMes.filter(l=>l.status==='PAGO'||l.status==='RECEBIDO');

  const rec    = pagos.filter(l=>getClassif(l)==='receita').reduce((s,l)=>s+(+(l.vlrPago||l.vlrLiquido)||0),0);
  const despOp = pagos.filter(l=>getClassif(l)==='desp_op').reduce((s,l)=>s+(+(l.vlrPago)||0),0);
  const inv    = pagos.filter(l=>getClassif(l)==='investimento').reduce((s,l)=>s+(+(l.vlrPago)||0),0);
  const ret    = pagos.filter(l=>getClassif(l)==='retirada').reduce((s,l)=>s+(+(l.vlrPago)||0),0);

  const resOp  = rec - despOp;                // Resultado Operacional
  const resCx  = rec - despOp - inv - ret;    // Resultado Caixa
  const mg     = rec>0?resOp/rec:0;

  // Caixa total histórico
  const caixaAtual = lancamentos.reduce((s,l)=>{
    if(l.status==='RECEBIDO'||l.status==='PAGO'){const v=+(l.vlrPago||l.vlrLiquido)||0;return s+(getClassif(l)==='receita'?v:-v);}return s;
  },0);

  // A receber e reembolsos
  const aReceber  = doMes.filter(l=>l.status==='A RECEBER');
  const tAR       = aReceber.reduce((s,l)=>s+(+(l.vlrBruto)||0),0);
  const reembs    = lancamentos.filter(l=>l.reembolso==='PENDENTE');
  const tReemb    = reembs.reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0);

  // Alertas
  const venc7 = lancamentos.filter(l=>{if(!l.dataDoc||l.status==='PAGO'||l.status==='RECEBIDO')return false;const d=(new Date(l.dataDoc+'T12:00:00')-hoje)/86400000;return d>=-1&&d<=7;});
  const atrasados = lancamentos.filter(l=>{if(!l.dataDoc||l.status==='PAGO'||l.status==='RECEBIDO')return false;return new Date(l.dataDoc+'T12:00:00')<hoje;});

  // Recorrentes do mês
  const recorrentes = lancamentos.filter(l=>l.recorrente&&l.tipo==='DESPESA');

  // Barras visuais
  const maxV = Math.max(rec,despOp+inv+ret,1);
  const pct = v=>Math.max(4,v/maxV*100);

  // Gráfico mensal
  const MNAMES=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const ano = new Date().getFullYear();
  const porMes = MNAMES.map((_,i)=>{
    const m=`${ano}-${String(i+1).padStart(2,'0')}`;
    const ml=lancamentos.filter(l=>(l.competencia||'').startsWith(m)&&(l.status==='PAGO'||l.status==='RECEBIDO'));
    const r=ml.filter(l=>getClassif(l)==='receita').reduce((s,l)=>s+(+(l.vlrPago||l.vlrLiquido)||0),0);
    const d=ml.filter(l=>getClassif(l)==='desp_op').reduce((s,l)=>s+(+(l.vlrPago)||0),0);
    const iv=ml.filter(l=>getClassif(l)==='investimento').reduce((s,l)=>s+(+(l.vlrPago)||0),0);
    return{m:MNAMES[i],r,d,iv,res:r-d};
  }).filter(x=>x.r>0||x.d>0||x.iv>0);
  const maxB=Math.max(...porMes.flatMap(m=>[m.r,m.d+m.iv]),1);

  return(<div className="au page">
    {/* ALERTAS */}
    <div className="pc" style={{paddingTop:12,display:'flex',flexDirection:'column',gap:7}}>
      {atrasados.length>0&&<div className="warn" onClick={()=>setAba('lancamentos')} style={{cursor:'pointer'}}>🔴 <strong>{atrasados.length} lançamento{atrasados.length>1?'s':''} atrasado{atrasados.length>1?'s':''}:</strong> {atrasados.slice(0,2).map(l=>l.descricao).join(', ')}{atrasados.length>2?` +${atrasados.length-2}`:''}</div>}
      {venc7.length>0&&<div className="warn" onClick={()=>setAba('lancamentos')} style={{cursor:'pointer',borderLeftColor:'#F59E0B',background:'#FFFBEB'}}>🟡 <strong>{venc7.length} vencimento{venc7.length>1?'s':''} nos próximos 7 dias</strong></div>}
      {reembs.length>0&&<div className="warn-y" onClick={()=>setAba('lancamentos')} style={{cursor:'pointer'}}>💸 <strong>Reembolso pendente:</strong> {reembs.length} item{reembs.length>1?'s':''} · {brl(tReemb)}</div>}
      {aReceber.length>0&&<div style={{padding:'10px 14px',borderRadius:8,borderLeft:'3px solid var(--verde)',background:'#F0F7E6',fontSize:13,cursor:'pointer'}} onClick={()=>setAba('lancamentos')}>🟢 <strong>{brl(tAR)}</strong> a receber este mês ({aReceber.length} item{aReceber.length>1?'s':''})</div>}
    </div>

    {/* PAINEL PRINCIPAL */}
    <div className="pc">
      <div className="card" style={{padding:0,overflow:'hidden',marginBottom:16}}>
        {/* Resultado Operacional header */}
        <div style={{padding:'14px 16px',borderBottom:'1px solid var(--cinzaF)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'.1em',color:'var(--cinzaE)',marginBottom:4}}>RESULTADO OPERACIONAL (MÊS)</div>
            <div style={{fontFamily:'var(--ff)',fontSize:26,fontWeight:700,color:resOp>=0?'var(--verde)':'var(--coral)',lineHeight:1}}>{brl(resOp)}</div>
            <div style={{fontSize:11,color:'var(--cinzaE)',marginTop:3}}>Rec. {brl(rec)} - Desp. Op. {brl(despOp)} · Margem {pp(mg)}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:'.1em',color:'var(--cinzaE)',marginBottom:4}}>CAIXA ATUAL</div>
            <div style={{fontFamily:'var(--ff)',fontSize:20,fontWeight:700,color:caixaAtual>=0?'var(--preto)':'var(--coral)'}}>{brl(caixaAtual)}</div>
            <div style={{fontSize:11,color:'var(--cinzaE)',marginTop:3}}>Saldo histórico acumulado</div>
          </div>
        </div>
        {/* Barra visual */}
        <div style={{height:5,display:'flex'}}>
          <div style={{flex:rec/Math.max(rec,despOp+inv+ret,1),background:'var(--lima)',transition:'flex .5s'}}/>
          <div style={{flex:despOp/Math.max(rec,despOp+inv+ret,1),background:'var(--coral)',transition:'flex .5s'}}/>
          <div style={{flex:inv/Math.max(rec,despOp+inv+ret,1),background:'var(--azul)',transition:'flex .5s'}}/>
          <div style={{flex:ret/Math.max(rec,despOp+inv+ret,1),background:'#6B3E9A',transition:'flex .5s'}}/>
        </div>
        {/* 4 métricas */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr'}}>
          {[
            {l:'RECEITAS',v:rec,col:'var(--lima)',icon:'💰'},
            {l:'DESP. OP.',v:despOp,col:'var(--coral)',icon:'💸'},
            {l:'INVESTIM.',v:inv,col:'var(--azul)',icon:'🔧'},
            {l:'PRÓ-LABORE',v:ret,col:'#6B3E9A',icon:'💼'},
          ].map(({l,v,col,icon})=>(
            <div key={l} style={{padding:'12px 10px',borderRight:'1px solid var(--cinzaF)'}}>
              <div style={{fontSize:8,fontWeight:700,letterSpacing:'.08em',color:'var(--cinzaE)',marginBottom:4}}>{icon} {l}</div>
              <div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700,color:col}}>{brl(v)}</div>
            </div>
          ))}
        </div>
        {/* Resultado caixa footer */}
        <div style={{padding:'10px 14px',background:'var(--cinzaF)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
          <div style={{fontSize:11,color:'var(--cinzaE)'}}>
            📅 Fatura fecha <strong>dia 29</strong> · Pagamentos internos <strong>dia 2</strong>
            {recorrentes.length>0&&<span style={{marginLeft:12,color:'var(--azul)',fontWeight:600}}>🔄 {recorrentes.length} recorrente{recorrentes.length>1?'s':''}</span>}
          </div>
          <div style={{textAlign:'right'}}>
            <span style={{fontSize:9,color:'var(--cinzaE)',fontWeight:700,letterSpacing:'.08em',marginRight:6}}>RESULTADO CAIXA</span>
            <span style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700,color:resCx>=0?'var(--verde)':'var(--coral)'}}>{brl(resCx)}</span>
          </div>
        </div>
      </div>

      {/* INDICADORES */}
      {(()=>{
        const mrr = lancamentos.filter(l=>l.recorrente&&getClassif(l)==='receita').reduce((s,l)=>s+(+(l.vlrBruto)||0),0);
        const clientesComRec = [...new Set(lancamentos.filter(l=>getClassif(l)==='receita'&&(l.status==='RECEBIDO')).map(l=>l.clienteFornecedor).filter(Boolean))];
        const recTotal = lancamentos.filter(l=>getClassif(l)==='receita'&&l.status==='RECEBIDO').reduce((s,l)=>s+(+(l.vlrPago||l.vlrLiquido)||0),0);
        const ticketMedio = clientesComRec.length>0?recTotal/clientesComRec.length:0;
        if(!mrr&&!ticketMedio) return null;
        return(<><SH>Indicadores</SH><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
          {[
            {l:'MRR',v:brl(mrr),desc:'Receita Recorrente Mensal',col:'var(--verde)',ic:'📈'},
            {l:'Ticket Médio',v:brl(ticketMedio),desc:`${clientesComRec.length} cliente${clientesComRec.length!==1?'s':''} ativos`,col:'var(--azul)',ic:'🎯'},
            {l:'Receita Total',v:brl(recTotal),desc:'Histórico acumulado',col:'var(--lima)',ic:'💰'},
          ].map(({l,v,desc,col,ic})=>(
            <div key={l} className="card" style={{padding:'12px 12px',textAlign:'center'}}>
              <div style={{fontSize:10,marginBottom:4}}>{ic}</div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:'.08em',color:'var(--cinzaE)',marginBottom:4}}>{l}</div>
              <div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:col}}>{v}</div>
              <div style={{fontSize:10,color:'var(--cinzaE)',marginTop:3}}>{desc}</div>
            </div>
          ))}
        </div></>);
      })()}

      {/* RECORRENTES DO MÊS */}
      {recorrentes.length>0&&<><SH>Recorrências ({new Date().toLocaleString('pt-BR',{month:'long'})})</SH>
      <div className="card" style={{marginBottom:16}}>
        {recorrentes.slice(0,5).map((l,i)=><div key={l.id} style={{padding:'11px 14px',borderBottom:i<recorrentes.length-1?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div style={{fontFamily:'var(--ff)',fontWeight:700,fontSize:14}}>🔄 {l.descricao}</div><div style={{fontSize:11,color:'var(--cinzaE)',marginTop:2}}>{l.cartaoNome||l.categoria} · {FREQ_LABEL?.[l.recorrenciaFreq]||'Mensal'}</div></div>
          <div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700,color:'var(--coral)'}}>{brl(+(l.vlrPago||l.vlrBruto)||0)}</div>
        </div>)}
      </div></>}

      {/* GRÁFICO RECEITA vs DESP. OP. vs INVESTIMENTO */}
      {porMes.length>0&&<><SH>Evolução Mensal {ano}</SH><div className="card" style={{padding:'16px 16px 12px',marginBottom:16}}>
        <div style={{display:'flex',gap:7,alignItems:'flex-end',height:110,overflowX:'auto'}}>
          {porMes.map(({m,r,d,iv})=>(
            <div key={m} style={{flex:1,minWidth:40,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
              <div style={{display:'flex',gap:2,alignItems:'flex-end',width:'100%',justifyContent:'center',height:90}}>
                <div style={{flex:1,background:'var(--lima)',borderRadius:'3px 3px 0 0',height:Math.max(2,r/maxB*88)+'px'}}/>
                <div style={{flex:1,background:'var(--coral)',borderRadius:'3px 3px 0 0',height:Math.max(2,d/maxB*88)+'px'}}/>
                {iv>0&&<div style={{flex:1,background:'var(--azul)',borderRadius:'3px 3px 0 0',height:Math.max(2,iv/maxB*88)+'px'}}/>}
              </div>
              <div style={{fontSize:9,color:'var(--cinzaE)',fontFamily:'var(--ff)',fontWeight:700}}>{m}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:14,marginTop:10,flexWrap:'wrap'}}>
          {[['var(--lima)','💰 Receitas'],['var(--coral)','💸 Desp. Op.'],['var(--azul)','🔧 Invest.']].map(([cl,l])=>(
            <span key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--cinzaE)'}}><span style={{width:10,height:10,borderRadius:2,background:cl,display:'inline-block'}}/>{l}</span>
          ))}
        </div>
      </div></>}
    </div>
  </div>);
}

// ── LANÇAMENTOS ───────────────────────────────────────────────────
function Lancamentos({lancamentos,lixeira,openNew,onSave,onDelete,onRestore,onPurge,onImport}){
  const[modal,setModal]=useState(null);const[del,setDel]=useState(null);const[showImp,setShowImp]=useState(false);const[showLix,setShowLix]=useState(false);
  const[ft,setFt]=useState({tipo:'',status:'',ano:'',mes:'',pagador:'',reembolso:'',q:'',cats:[]});
  const[showCatFilter,setShowCatFilter]=useState(false);
  useEffect(()=>{openNew.current=()=>setModal('new');},[]);
  const anos=[...new Set(lancamentos.map(l=>l.dataDoc?.slice(0,4)).filter(Boolean))].sort().reverse();
  const lst=lancamentos.filter(l=>{
    if(ft.tipo&&l.tipo!==ft.tipo)return false;
    if(ft.status&&l.status!==ft.status)return false;
    if(ft.ano&&!l.dataDoc?.startsWith(ft.ano))return false;
    if(ft.mes&&l.dataDoc?.slice(5,7)!==ft.mes)return false;
    if(ft.pagador&&l.pagador!==ft.pagador)return false;
    if(ft.reembolso&&l.reembolso!==ft.reembolso)return false;
    if(ft.cats.length>0&&!ft.cats.includes(l.categoria))return false;
    if(ft.q){const q=ft.q.toLowerCase();if(!l.descricao?.toLowerCase().includes(q)&&!l.clienteFornecedor?.toLowerCase().includes(q)&&!l.categoria?.toLowerCase().includes(q))return false;}
    return true;
  }).sort((a,b)=>(b.dataDoc||'').localeCompare(a.dataDoc||''));
  const tot=lst.reduce((s,l)=>s+(+(l.vlrPago||l.vlrLiquido||l.vlrBruto)||0),0);
  const save=async item=>{await onSave(item);setModal(null);};
  const[replicando,setReplicando]=useState(false);
  const replicarMesAnt=async()=>{
    const hoje=new Date();const mesAtual=hoje.toISOString().slice(0,7);
    const d2=new Date();d2.setMonth(d2.getMonth()-1);const mesAnt=d2.toISOString().slice(0,7);
    const doMesAnt=lancamentos.filter(l=>(l.competencia||l.dataDoc||'').startsWith(mesAnt)&&(l.status==='PAGO'||l.status==='RECEBIDO'));
    if(!doMesAnt.length){alert('Nenhum lançamento encontrado no mês anterior.');return;}
    if(!window.confirm('Replicar '+doMesAnt.length+' lançamento(s) de '+mesAnt+' para '+mesAtual+' com status PREVISTO/A RECEBER?'))return;
    setReplicando(true);
    for(const l of doMesAnt){
      const novaData=l.dataDoc?mesAtual+l.dataDoc.slice(7):mesAtual+'-01';
      await onSave({...l,id:uid(),dataDoc:novaData,competencia:mesAtual,status:l.tipo==='RECEITA'?'A RECEBER':'PREVISTO',vlrPago:'',dataPago:''});
    }
    setReplicando(false);
    alert(doMesAnt.length+' lançamento(s) replicado(s) para '+mesAtual+'!');
  };
  return(<div className="au page"><div className="pc" style={{paddingTop:12,display:'flex',flexDirection:'column',gap:8}}>
    <div className="filter-row">
      <input placeholder="🔍 Buscar…" value={ft.q} onChange={e=>setFt(p=>({...p,q:e.target.value}))}/>
      <select value={ft.tipo} onChange={e=>setFt(p=>({...p,tipo:e.target.value}))}><option value="">Tipo</option><option>RECEITA</option><option>DESPESA</option></select>
      <select value={ft.ano} onChange={e=>setFt(p=>({...p,ano:e.target.value}))}><option value="">Ano</option>{anos.map(a=><option key={a}>{a}</option>)}</select>
      <select value={ft.mes} onChange={e=>setFt(p=>({...p,mes:e.target.value}))}><option value="">Mês</option>{MS.map((m,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}</select>
      <select value={ft.pagador} onChange={e=>setFt(p=>({...p,pagador:e.target.value}))}><option value="">Pagador</option>{PAGADORES.map(p=><option key={p}>{p}</option>)}</select>
      <select value={ft.reembolso} onChange={e=>setFt(p=>({...p,reembolso:e.target.value}))}><option value="">Reembolso</option><option value="PENDENTE">⏳ Pendente</option><option value="CONCLUÍDO">✅ Concluído</option></select>
      <div style={{position:'relative'}}>
        <button type="button" onClick={()=>setShowCatFilter(v=>!v)} style={{padding:'8px 12px',borderRadius:7,border:'1.5px solid '+(ft.cats.length>0?'var(--lima)':'var(--cinzaM)'),background:ft.cats.length>0?'#F0F7E6':'var(--branco)',color:ft.cats.length>0?'var(--verde)':'var(--cinzaE)',fontSize:13,cursor:'pointer',fontWeight:ft.cats.length>0?700:400,whiteSpace:'nowrap'}}>
          🏷 Categorias{ft.cats.length>0?` (${ft.cats.length})`:''}
        </button>
        {showCatFilter&&<div style={{position:'absolute',top:'100%',right:0,marginTop:4,background:'var(--branco)',border:'1.5px solid var(--cinzaM)',borderRadius:8,boxShadow:'0 4px 20px rgba(0,0,0,.15)',zIndex:300,minWidth:220,maxHeight:340,overflowY:'auto',padding:8}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,paddingBottom:6,borderBottom:'1px solid var(--cinzaF)'}}>
            <button type="button" onClick={()=>setFt(p=>({...p,cats:[...CATS]}))} style={{fontSize:11,color:'var(--verde)',background:'none',border:'none',cursor:'pointer',fontWeight:700}}>Todas</button>
            <button type="button" onClick={()=>setFt(p=>({...p,cats:[]}))} style={{fontSize:11,color:'var(--coral)',background:'none',border:'none',cursor:'pointer',fontWeight:700}}>Limpar</button>
          </div>
          {CATS.map(cat=>(
            <label key={cat} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 4px',cursor:'pointer',fontSize:13}}>
              <input type="checkbox" checked={ft.cats.includes(cat)} onChange={e=>setFt(p=>({...p,cats:e.target.checked?[...p.cats,cat]:p.cats.filter(c=>c!==cat)}))} style={{width:16,height:16}}/>
              {cat}
            </label>
          ))}
        </div>}
      </div>
    </div>
    <div className="action-row">
      {lst.length>0&&<div style={{background:'var(--preto)',borderRadius:8,padding:'9px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',flex:1,minWidth:160}}><span style={{fontFamily:'var(--ff)',fontSize:11,letterSpacing:'.1em',color:'var(--cinzaE)'}}>{lst.length} ITEM{lst.length!==1?'S':''}</span><span style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:'var(--lima)'}}>{brl(tot)}</span></div>}
      <button className="action-btn" title="Replicar mês anterior" disabled={replicando} onClick={replicarMesAnt} style={{borderColor:'var(--azul)',color:'var(--azul)',background:'#EFF6FF'}}>{replicando?'⟳':'↻ Mês ant.'}</button>
      <button className="action-btn" style={{borderColor:'var(--cinzaM)',color:'var(--cinzaE)'}} onClick={()=>setShowImp(true)}>📂</button>
      <button className="action-btn" style={{borderColor:'#10B981',color:'#065F46',background:'#ECFDF5'}} onClick={()=>exportExcel(lst)}>⬇ XLS</button>
      <button className="action-btn" style={{borderColor:'var(--azul)',color:'var(--azul)',background:'#EFF6FF'}} onClick={()=>exportPDF(lst)}>🖨 PDF</button>
      <button className="action-btn" style={{borderColor:'var(--coral)',color:'var(--coral)',background:'#FFF5F5'}} onClick={()=>setShowLix(true)}>🗑 {lixeira.length>0?`(${lixeira.length})`:''}</button>
    </div>
    {showImp&&<Modal title="Importar Excel" onClose={()=>setShowImp(false)}><ImportarExcel onImport={onImport} onClose={()=>setShowImp(false)}/></Modal>}
    {showLix&&<LixeiraModal lixeira={lixeira} onRestore={onRestore} onPurge={onPurge} onClose={()=>setShowLix(false)}/>}
    <div className="card">
      {lst.length===0&&<div style={{padding:40,textAlign:'center',color:'var(--cinzaE)',fontStyle:'italic'}}>Nenhum lançamento encontrado</div>}
      {lst.map((l,i)=>{const vlr=+(l.vlrPago||l.vlrLiquido||l.vlrBruto)||0;const sc=STC[l.status]||{bg:'var(--cinzaM)',fg:'var(--cinzaE)'};const isR=l.tipo==='RECEITA';
        return(<div key={l.id} className="tx" style={{borderLeft:`4px solid ${isR?'var(--verde)':'var(--coral)'}`,borderBottom:i<lst.length-1?'1px solid var(--cinzaF)':'none'}} onClick={()=>setModal(l)}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap'}}><span className="tag" style={{background:sc.bg,color:sc.fg,fontSize:10}}>{l.status}</span><span style={{fontFamily:'var(--ff)',fontWeight:700,fontSize:14,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.descricao}</span></div>
            <div style={{fontSize:12,color:'var(--cinzaE)',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.categoria}{l.clienteFornecedor?` · ${l.clienteFornecedor}`:''}</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
              {l.tipo==='DESPESA'&&l.natureza&&(()=>{const nc=NAT_CLR[l.natureza];return <span style={{padding:'2px 6px',borderRadius:4,border:`1px solid ${nc.bg}`,color:nc.bg,fontFamily:'var(--ff)',fontSize:10,fontWeight:700}}>{nc.label}</span>;})()}
              <span style={{fontSize:11,color:'var(--cinzaE)'}}>{dbr(l.dataDoc)}</span>
              {l.pagador&&<span style={{fontSize:10,background:'var(--cinzaF)',border:'1px solid var(--cinzaM)',borderRadius:4,padding:'1px 5px',fontFamily:'var(--ff)',fontWeight:700,color:'var(--cinzaE)'}}>{l.pagador}</span>}
              {l.reembolso==='PENDENTE'&&<span style={{fontSize:10,background:'#FFFBEB',border:'1px solid #F59E0B',borderRadius:4,padding:'1px 6px',color:'#92400E',fontFamily:'var(--ff)',fontWeight:700}}>⏳</span>}
              {l.reembolso==='CONCLUÍDO'&&<span style={{fontSize:10,background:'#ECFDF5',border:'1px solid #10B981',borderRadius:4,padding:'1px 6px',color:'#065F46',fontFamily:'var(--ff)',fontWeight:700}}>✅</span>}
              {l.anexos?.length>0&&<span style={{fontSize:11}}>📎{l.anexos.length}</span>}
            </div>
          </div>
          <div style={{textAlign:'right',flexShrink:0,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
            <span style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:isR?'var(--verde)':'var(--coral)'}}>{isR?'+':'−'}{brl(vlr)}</span>
            <div style={{display:'flex',gap:4}}>
              <button title="Duplicar" onClick={e=>{e.stopPropagation();setModal({...l,id:uid(),dataDoc:new Date().toISOString().slice(0,10),competencia:new Date().toISOString().slice(0,7),status:l.tipo==='RECEITA'?'A RECEBER':'PREVISTO',vlrPago:'',dataPago:''});}} style={{fontSize:13,color:'var(--azul)',lineHeight:1,minWidth:28,minHeight:28,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--cinzaF)',border:'none',borderRadius:5,cursor:'pointer'}}>⧉</button>
              <button onClick={e=>{e.stopPropagation();setDel(l.id);}} style={{fontSize:14,color:'var(--coral)',lineHeight:1,minWidth:28,minHeight:28,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'none',cursor:'pointer'}}>🗑</button>
            </div>
          </div>
        </div>);
      })}
    </div>
  </div>
  {modal&&<Modal title={modal==='new'?'Novo Lançamento':'Editar Lançamento'} onClose={()=>setModal(null)}><FormL init={modal!=='new'?modal:null} onSave={save} onClose={()=>setModal(null)} lancamentos={lancamentos}/></Modal>}
  {del&&<DelModal msg="Mover para a lixeira?" onConfirm={()=>{onDelete(del);setDel(null);}} onClose={()=>setDel(null)}/>}
  </div>);
}

// ── DRE ──────────────────────────────────────────────────────────
function DRE({lancamentos}){
  const[ano,setAno]=useState(new Date().getFullYear());
  const[showDetalhe,setShowDetalhe]=useState(true);
  const[gruposVisiveis,setGruposVisiveis]=useState({receita:true,variavel:true,fixa:true,prolabore:true,investimento:true});
  // Competência com fallback: usa campo competencia, ou deriva de dataDoc (lançamentos antigos/importados)
  const getComp=l=>l.competencia||(l.dataDoc?l.dataDoc.slice(0,7):'')||(l.dataPago?l.dataPago.slice(0,7):'');
  const anos=[...new Set(lancamentos.map(l=>getComp(l)?.slice(0,4)).filter(Boolean))].sort().reverse();

  const gM=(classifs,cats,mi,sts=['RECEBIDO','PAGO'])=>{
    const m=`${ano}-${String(mi+1).padStart(2,'0')}`;
    return lancamentos.filter(l=>
      sts.includes(l.status)&&getComp(l)===m&&
      (classifs.length===0||classifs.includes(getClassif(l)))&&
      (cats.length===0||cats.includes(l.categoria))
    ).reduce((s,l)=>s+(+(l.vlrPago||l.vlrLiquido)||0),0);
  };
  // Soma investimentos por subcategoria (investimentos têm categoria='INVESTIMENTO')
  const gInvSub=(subs,mi,sts=['RECEBIDO','PAGO'])=>{
    const m=`${ano}-${String(mi+1).padStart(2,'0')}`;
    return lancamentos.filter(l=>
      sts.includes(l.status)&&getComp(l)===m&&getClassif(l)==='investimento'&&
      (subs.length===0||subs.some(sub=>(l.subcategoria||'').toUpperCase().includes(sub)))
    ).reduce((s,l)=>s+(+(l.vlrPago||l.vlrLiquido)||0),0);
  };

  // Despesa variável = natureza DESPESA VARIÁVEL (fonte de verdade), não categoria fixa
  const gVar=(mi,sts=['RECEBIDO','PAGO'])=>{
    const m=`${ano}-${String(mi+1).padStart(2,'0')}`;
    return lancamentos.filter(l=>
      sts.includes(l.status)&&getComp(l)===m&&getClassif(l)==='desp_op'&&
      (l.natureza==='DESPESA VARIÁVEL'||CAT_NAT[l.categoria]==='DESPESA VARIÁVEL')
    ).reduce((s,l)=>s+(+(l.vlrPago||l.vlrLiquido)||0),0);
  };

  const[drill,setDrill]=useState(null); // {titulo, lancs}

  // Retorna os lançamentos do ano que compõem uma linha do DRE (para o drill-down clicável)
  const lancsDaLinha=(row)=>{
    const anoStr=String(ano);
    const base=lancamentos.filter(l=>['RECEBIDO','PAGO'].includes(l.status)&&getComp(l)?.startsWith(anoStr));
    if(row.k==='r'||row.g==='receita')return base.filter(l=>getClassif(l)==='receita'&&(!row._cats||row._cats.includes(l.categoria)));
    if(row.g==='variavel')return base.filter(l=>getClassif(l)==='desp_op'&&(l.natureza==='DESPESA VARIÁVEL'||CAT_NAT[l.categoria]==='DESPESA VARIÁVEL')&&(!row._cats||row._cats.includes(l.categoria)));
    if(row.g==='fixa')return base.filter(l=>getClassif(l)==='desp_op'&&!(l.natureza==='DESPESA VARIÁVEL'||CAT_NAT[l.categoria]==='DESPESA VARIÁVEL')&&(!row._cats||row._cats.includes(l.categoria)));
    if(row.g==='prolabore')return base.filter(l=>getClassif(l)==='retirada');
    if(row.g==='investimento'){const inv=base.filter(l=>getClassif(l)==='investimento');if(!row._subs)return inv;return inv.filter(l=>row._subs.some(s=>(l.subcategoria||'').toUpperCase().includes(s)));}
    return [];
  };
  const abrirDrill=(row)=>{const lancs=lancsDaLinha(row);setDrill({titulo:row.l,lancs:lancs.sort((a,b)=>(getComp(a)||'').localeCompare(getComp(b)||''))});};

  const cp=MS.map((_,i)=>{
    const r    = gM(['receita'],[],i);
    const dv   = gVar(i);                   // despesas variáveis (por natureza)
    const mb   = r-dv;
    const df   = gM(['desp_op'],[],i)-dv;  // fixed op = total op - variable
    const resOp= mb-df;                    // Resultado Operacional
    const plab = gM(['retirada'],[],i);
    const inv  = gM(['investimento'],[],i);
    const resCx= resOp-plab-inv;
    return{r,dv,mb,df,resOp,plab,inv,resCx,
      mgBruta:r>0?mb/r:0,mgOp:r>0?resOp/r:0};
  });

  const am=MS.map((_,i)=>i).filter(i=>cp[i].r>0||cp[i].resOp!==0||cp[i].inv>0||cp[i].plab>0);
  const sm=am.length>0?am:[new Date().getMonth()];
  const tot=k=>sm.reduce((s,i)=>s+(cp[i][k]||0),0);
  const totFn=fn=>sm.reduce((s,i)=>s+(fn(i)||0),0);

  const ROWS=[
    {l:'RECEITA BRUTA',t:'h',k:'r',col:'#8FA715',g:'receita'},
    {l:'↳ Honorários / Consultoria',t:'i',fn:i=>gM(['receita'],['HONORÁRIOS'],i),g:'receita',_cats:['HONORÁRIOS']},
    {l:'↳ Outros serviços',t:'i',fn:i=>Math.max(0,cp[i].r-gM(['receita'],['HONORÁRIOS'],i)),g:'receita'},
    {l:'(-) DESPESAS VARIÁVEIS',t:'h',k:'dv',col:'#C4502B',neg:true,g:'variavel'},
    {l:'↳ Serv. Terceiros',t:'i',fn:i=>gM(['desp_op'],['SERV. TERCEIROS'],i),g:'variavel',_cats:['SERV. TERCEIROS']},
    {l:'↳ Marketing',t:'i',fn:i=>gM(['desp_op'],['MARKETING'],i),g:'variavel',_cats:['MARKETING']},
    {l:'↳ Outros variáveis',t:'i',fn:i=>Math.max(0,cp[i].dv-gM(['desp_op'],['SERV. TERCEIROS','MARKETING'],i)),g:'variavel'},
    {l:'= MARGEM BRUTA',t:'T',k:'mb',col:'#8FA715',pctK:'mgBruta',g:'total'},
    {l:'(-) DESPESAS FIXAS OP.',t:'h',k:'df',col:'#C4502B',neg:true,g:'fixa'},
    {l:'↳ Softwares',t:'i',fn:i=>gM(['desp_op'],['SOFTWARES'],i),g:'fixa',_cats:['SOFTWARES']},
    {l:'↳ Desp. Administrativas',t:'i',fn:i=>gM(['desp_op'],['DESP. ADMINISTRATIVAS'],i),g:'fixa',_cats:['DESP. ADMINISTRATIVAS']},
    {l:'↳ Outros fixos',t:'i',fn:i=>Math.max(0,cp[i].df-gM(['desp_op'],['SOFTWARES','DESP. ADMINISTRATIVAS'],i)),g:'fixa'},
    {l:'= RESULTADO OPERACIONAL',t:'T',k:'resOp',col:'#497A5D',pctK:'mgOp',bold:true,g:'total'},
    {l:'(-) PRÓ-LABORE / RETIRADAS',t:'h',k:'plab',col:'#6B3E9A',neg:true,g:'prolabore'},
    {l:'(-) INVESTIMENTOS',t:'h',k:'inv',col:'#1A4F71',neg:true,g:'investimento'},
    {l:'↳ Identidade Visual / Branding',t:'i',fn:i=>gInvSub(['BRANDING','IDENTIDADE','MARKETING','DESIGN'],i),g:'investimento',_subs:['BRANDING','IDENTIDADE','MARKETING','DESIGN']},
    {l:'↳ Sistemas / Software',t:'i',fn:i=>gInvSub(['SISTEMA','SOFTWARE','APP','SITE','WEB'],i),g:'investimento',_subs:['SISTEMA','SOFTWARE','APP','SITE','WEB']},
    {l:'↳ Equipamentos / Outros',t:'i',fn:i=>{const total=cp[i].inv;const id=gInvSub(['BRANDING','IDENTIDADE','MARKETING','DESIGN'],i);const sw=gInvSub(['SISTEMA','SOFTWARE','APP','SITE','WEB'],i);return Math.max(0,total-id-sw);},g:'investimento'},
    {l:'= RESULTADO CAIXA',t:'T',k:'resCx',col:'#8FA715',bold:true,g:'total'},
  ].filter(row=>{
    if(!showDetalhe&&row.t==='i')return false;
    if(row.g!=='total'&&!gruposVisiveis[row.g])return false;
    return true;
  });

  const Cel=({v,t,col,pct:isPct,bold})=>{
    const clr=t==='h'?(col||'var(--preto)'):t==='T'?(v>=0?col||'var(--verde)':'var(--coral)'):v<0?'var(--coral)':'var(--cinzaE)';
    return<td style={{padding:'5px 9px',textAlign:'right',fontFamily:'var(--ff)',fontSize:11,fontWeight:bold||t==='T'||t==='h'?700:400,color:clr,borderBottom:'1px solid var(--cinzaF)',background:t==='h'?col+'11':undefined}}>{v===0&&t==='i'?<span style={{color:'var(--cinzaM)'}}>—</span>:isPct?pp(v):brl(v)}</td>;
  };

  return(<div className="au page pc" style={{paddingTop:12}}>
    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}>
      <select value={ano} onChange={e=>setAno(+e.target.value)} style={{width:90,border:'1.5px solid var(--cinzaM)',borderRadius:8,padding:'9px 10px',fontSize:13,outline:'none',background:'var(--branco)'}}>{(anos.length?anos:[new Date().getFullYear()]).map(a=><option key={a}>{a}</option>)}</select>
      <button onClick={()=>exportExcel(lancamentos.filter(l=>l.competencia?.startsWith(String(ano))),'zeste_dre')} style={{display:'flex',alignItems:'center',gap:6,background:'#ECFDF5',border:'1.5px solid #10B981',borderRadius:8,padding:'9px 12px',fontSize:12,fontWeight:600,color:'#065F46',cursor:'pointer',minHeight:42}}>⬇ Excel</button>
      <button onClick={()=>exportPDF(lancamentos.filter(l=>l.competencia?.startsWith(String(ano))),`DRE ${ano}`)} style={{display:'flex',alignItems:'center',gap:6,background:'#EFF6FF',border:'1.5px solid var(--azul)',borderRadius:8,padding:'9px 12px',fontSize:12,fontWeight:600,color:'var(--azul)',cursor:'pointer',minHeight:42}}>🖨 PDF</button>
      <button onClick={()=>setShowDetalhe(v=>!v)} style={{display:'flex',alignItems:'center',gap:6,background:showDetalhe?'#F0F7E6':'var(--branco)',border:'1.5px solid '+(showDetalhe?'var(--lima)':'var(--cinzaM)'),borderRadius:8,padding:'9px 12px',fontSize:12,fontWeight:600,color:showDetalhe?'var(--verde)':'var(--cinzaE)',cursor:'pointer',minHeight:42}}>{showDetalhe?'▾ Detalhado':'▸ Resumido'}</button>
    </div>

    {/* FILTRO DE GRUPOS */}
    <div style={{display:'flex',gap:7,marginBottom:12,flexWrap:'wrap'}}>
      {[['receita','💰 Receitas','#8FA715'],['variavel','📉 Desp. Variáveis','#C4502B'],['fixa','🏢 Desp. Fixas','#C4502B'],['prolabore','💼 Pró-labore','#6B3E9A'],['investimento','🔧 Investimentos','#1A4F71']].map(([g,l,col])=>(
        <button key={g} onClick={()=>setGruposVisiveis(p=>({...p,[g]:!p[g]}))} style={{padding:'6px 12px',borderRadius:20,border:'1.5px solid '+(gruposVisiveis[g]?col:'var(--cinzaM)'),background:gruposVisiveis[g]?col:'transparent',color:gruposVisiveis[g]?'#fff':'var(--cinzaE)',fontSize:11,fontWeight:700,cursor:'pointer'}}>{l}</button>
      ))}
    </div>

    <div style={{overflowX:'auto',borderRadius:12,boxShadow:'0 1px 8px rgba(0,0,0,.07)'}}>
      <table style={{width:'100%',borderCollapse:'collapse',background:'var(--branco)',minWidth:320,fontSize:12}}>
        <thead><tr style={{background:'var(--preto)'}}>
          <th style={{padding:'9px 12px',textAlign:'left',color:'var(--lima)',fontFamily:'var(--ff)',fontSize:11,letterSpacing:'.1em',minWidth:180}}>CONTA</th>
          {sm.map(i=><th key={i} style={{padding:'8px 10px',textAlign:'right',color:'var(--lima)',fontFamily:'var(--ff)',fontSize:11}}>{MS[i]}</th>)}
          <th style={{padding:'8px 10px',textAlign:'right',color:'var(--lima)',fontFamily:'var(--ff)',fontSize:11,background:'var(--verde)'}}>TOTAL</th>
        </tr></thead>
        <tbody>
          {ROWS.map((row,ri)=>{const {l,t,k,fn,col,neg,pctK,bold}=row;
            const isH=t==='h',isT=t==='T',isI=t==='i';
            const bg=isH?(col+'11'):(ri%2===0?'var(--branco)':'#FAFAF6');
            const border=isH?`2px solid ${col}`:undefined;
            const totV=k?tot(k):fn?totFn(fn):0;
            const totPct=pctK?(tot(pctK==='mgBruta'?'mb':pctK==='mgOp'?'resOp':pctK)/(tot('r')||1)):null;
            const clicavel=t!=='T'&&row.g!=='total';
            return(<tr key={l} style={{background:bg}}>
              <td onClick={clicavel?()=>abrirDrill(row):undefined} style={{padding:isT?'9px 14px 9px 12px':isI?'6px 12px 6px 22px':'7px 12px',fontFamily:isI?'var(--fb)':'var(--ff)',fontWeight:isH||isT?700:400,color:isH?col:isT?'var(--preto)':'var(--cinzaE)',fontSize:isH?11:12,borderBottom:`1px solid var(--cinzaF)`,borderLeft:border,background:isH?col+'11':undefined,cursor:clicavel?'pointer':'default'}}>{l}{clicavel&&<span style={{opacity:.35,fontSize:10,marginLeft:5}}>🔍</span>}</td>
              {sm.map(i=>{
                const v=k?cp[i][k]:fn?fn(i):0;
                const isPct=false;
                return<Cel key={i} v={v} t={t} col={col} bold={bold}/>;
              })}
              <td style={{padding:'5px 9px',textAlign:'right',fontFamily:'var(--ff)',fontSize:11,fontWeight:700,background:'var(--verde)',color:'var(--branco)',borderBottom:'1px solid rgba(255,255,255,.1)'}}>
                {totV===0&&isI?<span style={{opacity:.4}}>—</span>:brl(totV)}
                {pctK&&totPct!==null&&<div style={{fontSize:9,opacity:.8}}>{pp(totPct)}</div>}
              </td>
            </tr>);
          })}
        </tbody>
      </table>
    </div>

    {drill&&<Modal title={`${drill.titulo} · ${ano}`} onClose={()=>setDrill(null)}>
      {drill.lancs.length===0?<div style={{textAlign:'center',color:'var(--cinzaE)',padding:'24px 0',fontStyle:'italic'}}>Nenhum lançamento nesta linha em {ano}.</div>:<>
        <div style={{fontSize:12,color:'var(--cinzaE)',marginBottom:10}}>{drill.lancs.length} lançamento{drill.lancs.length>1?'s':''} que compõe{drill.lancs.length>1?'m':''} este valor:</div>
        <div className="card" style={{overflow:'hidden'}}>
          {drill.lancs.map((l,i)=>(<div key={l.id||i} style={{padding:'10px 13px',borderBottom:i<drill.lancs.length-1?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.descricao||l.categoria}</div>
              <div style={{fontSize:11,color:'var(--cinzaE)'}}>{l.categoria}{l.subcategoria?` · ${l.subcategoria}`:''} · {getComp(l)}{l.pagador?` · ${l.pagador}`:''}</div>
            </div>
            <div style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:getClassif(l)==='receita'?'var(--verde)':'var(--coral)',flexShrink:0}}>{brl(+(l.vlrPago||l.vlrLiquido)||0)}</div>
          </div>))}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:12,padding:'10px 13px',background:'var(--verde)',borderRadius:8,color:'#fff'}}>
          <span style={{fontFamily:'var(--ff)',fontWeight:700,fontSize:13}}>TOTAL</span>
          <span style={{fontFamily:'var(--ff)',fontWeight:700,fontSize:14}}>{brl(drill.lancs.reduce((s,l)=>s+(+(l.vlrPago||l.vlrLiquido)||0),0))}</span>
        </div>
      </>}
    </Modal>}

    {/* RESUMO EXECUTIVO */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:16}} className="prev-grid">
      {[
        {l:'Resultado Operacional',v:tot('resOp'),col:'#497A5D',desc:'Receitas - Desp. Operacionais',icon:'📊'},
        {l:'Resultado Caixa',v:tot('resCx'),col:'#1A4F71',desc:'Incluindo pró-labore e investimentos',icon:'💰'},
      ].map(({l,v,col,desc,icon})=>(
        <div key={l} className="card" style={{borderLeft:`4px solid ${col}`,padding:'14px 16px'}}>
          <div style={{fontSize:10,color:'var(--cinzaE)',marginBottom:5}}>{icon} {l}</div>
          <div style={{fontFamily:'var(--ff)',fontSize:22,fontWeight:700,color:v>=0?col:'var(--coral)'}}>{brl(v)}</div>
          <div style={{fontSize:11,color:'var(--cinzaE)',marginTop:3}}>{desc}</div>
        </div>
      ))}
    </div>
  </div>);
}


// ── CONTAS A RECEBER ──────────────────────────────────────────────
function gerarRecebimentosContrato(cliente){
  const {tipoCobranca,parcelas=1,diaPagamento=5,duracaoMeses=1,vlrContratado,inicio,projeto,cliente:nome,forma,_parcCustom} = cliente;
  const vlr = +(vlrContratado)||0;
  if(!vlr||!inicio) return [];
  const base = new Date(inicio+'T12:00:00');
  const mkLanc = (data,vlrBruto,desc) => ({
    id:uid(),tipo:'RECEITA',natureza:'',status:'A RECEBER',
    categoria:'HONORÁRIOS',subcategoria:'CONSULTORIA',
    descricao:desc,clienteFornecedor:nome,projeto,
    dataDoc:data,competencia:data.slice(0,7),
    vlrBruto,vlrLiquido:vlrBruto,vlrPago:'',dataPago:'',
    forma:forma||'PIX',pagador:'ZESTE',reembolso:'',obs:'',anexos:[],
    recorrente:tipoCobranca==='mensal',recorrenciaFreq:'mensal'
  });
  if(tipoCobranca==='unico'){
    const d=new Date(base);d.setDate(diaPagamento||5);
    return[mkLanc(d.toISOString().slice(0,10),vlr,projeto)];
  }
  if(tipoCobranca==='parcelado'){
    if(_parcCustom&&_parcCustom.length>0){
      return _parcCustom.map((p,i)=>mkLanc(p.vencimento||base.toISOString().slice(0,10),+(p.valor)||0,`${projeto} — Parcela ${i+1}/${_parcCustom.length}`));
    }
    return Array.from({length:+parcelas},(_,i)=>{
      const d=new Date(base);d.setMonth(d.getMonth()+i);d.setDate(diaPagamento||5);
      return mkLanc(d.toISOString().slice(0,10),vlr/+parcelas,`${projeto} — Parcela ${i+1}/${parcelas}`);
    });
  }
  if(tipoCobranca==='mensal'){
    return Array.from({length:+duracaoMeses},(_,i)=>{
      const d=new Date(base);d.setMonth(d.getMonth()+i);d.setDate(diaPagamento||5);
      return mkLanc(d.toISOString().slice(0,10),vlr,`${projeto} — ${new Date(d).toLocaleString('pt-BR',{month:'long',year:'numeric'})}`);
    });
  }
  return[];
}

function ContasReceber({lancamentos,clientes,onSaveL,setAba}){
  const[filtro,setFiltro]=useState('pendente');
  const[marcando,setMarcando]=useState(null);

  const hoje = new Date().toISOString().slice(0,10);
  const receitasPendentes = lancamentos.filter(l=>l.tipo==='RECEITA'&&(l.status==='A RECEBER'||l.status==='PREVISTO'));
  const receitasRecebidas = lancamentos.filter(l=>l.tipo==='RECEITA'&&l.status==='RECEBIDO');
  const atrasadas = receitasPendentes.filter(l=>(l.dataDoc||'')>''&&l.dataDoc<hoje);
  const pendentes  = receitasPendentes.filter(l=>!l.dataDoc||(l.dataDoc>=hoje));

  const tPrev = receitasPendentes.reduce((s,l)=>s+(+(l.vlrBruto)||0),0);
  const tRec  = receitasRecebidas.reduce((s,l)=>s+(+(l.vlrPago||l.vlrBruto)||0),0);
  const tAtr  = atrasadas.reduce((s,l)=>s+(+(l.vlrBruto)||0),0);

  const mostrar = filtro==='todos'?receitasPendentes:filtro==='atrasado'?atrasadas:pendentes;

  // Agrupar por cliente
  const porCliente = mostrar.reduce((acc,l)=>{
    const k=l.clienteFornecedor||'Sem cliente';
    if(!acc[k]) acc[k]=[];
    acc[k].push(l);
    return acc;
  },{});

  const marcarRecebido = async l => {
    setMarcando(l.id);
    await onSaveL({...l,status:'RECEBIDO',vlrPago:l.vlrBruto,dataPago:hoje});
    setMarcando(null);
  };

  const isAtrasado = l => (l.dataDoc||'')>''&&l.dataDoc<hoje;

  return(<div className="au page pc" style={{paddingTop:12}}>
    {/* SUMMARY */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
      {[['A RECEBER',tPrev,'var(--lima)','💰'],[`RECEBIDO (mês)`,tRec,'var(--verde)','✅'],['EM ATRASO',tAtr,'var(--coral)','⚠️']].map(([l,v,col,ic])=>(
        <div key={l} className="card" style={{padding:'12px 14px',borderLeft:'3px solid '+col}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:'.08em',color:'var(--cinzaE)',marginBottom:5}}>{ic} {l}</div>
          <div style={{fontFamily:'var(--ff)',fontSize:18,fontWeight:700,color:col}}>{brl(v)}</div>
        </div>
      ))}
    </div>

    {/* FILTROS */}
    <div style={{display:'flex',gap:7,marginBottom:14,flexWrap:'wrap'}}>
      {[['pendente','Pendentes'],['atrasado','⚠ Atrasadas'],['todos','Todas']].map(([id,l])=>(
        <button key={id} onClick={()=>setFiltro(id)} style={{padding:'7px 14px',borderRadius:7,border:'1.5px solid '+(filtro===id?'var(--verde)':'var(--cinzaM)'),background:filtro===id?'var(--verde)':'transparent',color:filtro===id?'var(--branco)':'var(--cinzaE)',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
      ))}
      <div style={{flex:1}}/>
      <button onClick={()=>setAba('clientes')} style={{padding:'7px 14px',borderRadius:7,border:'1.5px solid var(--lima)',color:'var(--lima)',background:'transparent',fontSize:12,fontWeight:700,cursor:'pointer'}}>+ Novo contrato</button>
    </div>

    {/* LISTA */}
    {Object.entries(porCliente).length===0&&<div style={{textAlign:'center',padding:40,color:'var(--cinzaE)',fontStyle:'italic'}}>Nenhuma conta a receber</div>}
    {Object.entries(porCliente).map(([cliente,items])=>(
      <div key={cliente} className="card" style={{padding:0,overflow:'hidden',marginBottom:12}}>
        <div style={{padding:'10px 14px',background:'var(--cinzaF)',borderBottom:'1px solid var(--cinzaF)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontFamily:'var(--ff)',fontWeight:700,fontSize:14,color:'var(--verde)'}}>{cliente}</div>
          <div style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:'var(--lima)'}}>{brl(items.reduce((s,l)=>s+(+(l.vlrBruto)||0),0))}</div>
        </div>
        {items.sort((a,b)=>(a.dataDoc||'').localeCompare(b.dataDoc||'')).map((l,i)=>{
          const atrasado=isAtrasado(l);
          const diff=l.dataDoc?Math.round((new Date(l.dataDoc+'T12:00:00')-new Date())/86400000):null;
          return(
            <div key={l.id} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',borderBottom:i<items.length-1?'1px solid var(--cinzaF)':'none',background:atrasado?'#FFF5F5':'transparent',flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:2}}>
                  {atrasado&&<span style={{fontSize:9,background:'#FEE2E2',color:'var(--coral)',borderRadius:3,padding:'1px 5px',fontWeight:700}}>ATRASADO {Math.abs(diff)}d</span>}
                  {!atrasado&&diff!==null&&diff<=7&&<span style={{fontSize:9,background:'#FFFBEB',color:'#92400E',borderRadius:3,padding:'1px 5px',fontWeight:700}}>vence em {diff}d</span>}
                  <span style={{fontFamily:'var(--ff)',fontWeight:700,fontSize:13}}>{l.descricao}</span>
                </div>
                <div style={{fontSize:11,color:'var(--cinzaE)'}}>{l.dataDoc?new Date(l.dataDoc+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}):''}{l.forma?' · '+l.forma:''}</div>
              </div>
              <div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:'var(--lima)',flexShrink:0}}>{brl(+(l.vlrBruto)||0)}</div>
              <button onClick={()=>marcarRecebido(l)} disabled={marcando===l.id} style={{padding:'8px 13px',borderRadius:7,border:'1.5px solid var(--verde)',background:marcando===l.id?'var(--verde)':'transparent',color:marcando===l.id?'var(--branco)':'var(--verde)',fontSize:11,fontWeight:700,cursor:'pointer',flexShrink:0}}>{marcando===l.id?'✓ Salvo!':'✓ Recebido'}</button>
            </div>
          );
        })}
      </div>
    ))}
  </div>);
}

// ── CLIENTES ──────────────────────────────────────────────────────
function Clientes({clientes,onSave,onDelete,openNew,onSaveL,lancamentos}){
  const[modal,setModal]=useState(null);const[del,setDel]=useState(null);
  const[gerando,setGerando]=useState(null);
  useEffect(()=>{openNew.current=()=>setModal('new');},[]);
  const save=async item=>{await onSave(item);setModal(null);};
  const[replicando,setReplicando]=useState(false);
  const replicarMesAnt=async()=>{
    const hoje=new Date();const mesAtual=hoje.toISOString().slice(0,7);
    const d2=new Date();d2.setMonth(d2.getMonth()-1);const mesAnt=d2.toISOString().slice(0,7);
    const doMesAnt=lancamentos.filter(l=>(l.competencia||l.dataDoc||'').startsWith(mesAnt)&&(l.status==='PAGO'||l.status==='RECEBIDO'));
    if(!doMesAnt.length){alert('Nenhum lançamento encontrado no mês anterior.');return;}
    if(!window.confirm('Replicar '+doMesAnt.length+' lançamento(s) de '+mesAnt+' para '+mesAtual+' com status PREVISTO/A RECEBER?'))return;
    setReplicando(true);
    for(const l of doMesAnt){
      const novaData=l.dataDoc?mesAtual+l.dataDoc.slice(7):mesAtual+'-01';
      await onSave({...l,id:uid(),dataDoc:novaData,competencia:mesAtual,status:l.tipo==='RECEITA'?'A RECEBER':'PREVISTO',vlrPago:'',dataPago:''});
    }
    setReplicando(false);
    alert(doMesAnt.length+' lançamento(s) replicado(s) para '+mesAtual+'!');
  };
  const gerarRecebimentos=async c=>{
    const items=gerarRecebimentosContrato(c);
    if(!items.length){alert('Preencha Valor e Data de Início para gerar recebimentos.');return;}
    setGerando(c.id);
    for(const l of items) await onSaveL(l);
    setGerando(null);
    alert(items.length+' recebimento'+(items.length>1?'s':'')+' criado'+(items.length>1?'s':'')+' em Contas a Receber!');
  };
  const temRecebimentos = c => (lancamentos||[]).some(l=>l.tipo==='RECEITA'&&l.clienteFornecedor===c.cliente&&(l.status==='A RECEBER'||l.status==='RECEBIDO'));
  return(<div className="au page pc" style={{paddingTop:12}}><div style={{display:'flex',flexDirection:'column',gap:12}}>
    {clientes.length===0&&<div style={{textAlign:'center',padding:48,color:'var(--cinzaE)',fontStyle:'italic'}}>Nenhum cliente cadastrado</div>}
    {clientes.map(c=>{const aR=Math.max(0,(+(c.vlrContratado)||0)-(+(c.vlrRecebido)||0));const pR=c.vlrContratado>0?Math.min(1,c.vlrRecebido/c.vlrContratado):0;const sp=SPROJ[c.statusProjeto]||{bg:'var(--cinzaE)',fg:'var(--branco)'};return(<div key={c.id} className="card" style={{borderLeft:`4px solid ${sp.bg}`}}><div style={{padding:'14px 15px'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,flexWrap:'wrap',marginBottom:10}}><div><div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:2}}><span style={{fontFamily:'var(--ff)',fontSize:19,fontWeight:700,color:'var(--verde)'}}>{c.cliente}</span><span className="tag" style={{background:sp.bg,color:sp.fg}}>{c.statusProjeto}</span></div><div style={{fontSize:12,color:'var(--cinzaE)'}}>{c.estabelecimento}</div><div style={{fontSize:13,fontWeight:600,marginTop:2}}>{c.projeto}</div></div><div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
              {c.vlrContratado&&!temRecebimentos(c)&&<button onClick={()=>gerarRecebimentos(c)} disabled={gerando===c.id} style={{padding:'9px 12px',borderRadius:7,border:'1.5px solid var(--verde)',background:gerando===c.id?'var(--verde)':'transparent',color:gerando===c.id?'var(--branco)':'var(--verde)',fontSize:11,fontWeight:700,cursor:'pointer',minHeight:44}}>{gerando===c.id?'Gerando…':'📅 Gerar Recebimentos'}</button>}
              {temRecebimentos(c)&&<span style={{fontSize:10,padding:'4px 8px',background:'#ECFDF5',color:'#065F46',borderRadius:5,fontWeight:600,alignSelf:'center'}}>✓ Recebimentos gerados</span>}
              <button onClick={()=>setModal(c)} style={{background:'var(--cinzaF)',borderRadius:7,padding:'9px 13px',fontSize:14,fontWeight:600,color:'var(--azul)',minHeight:44}}>✏️</button>
              <button onClick={()=>setDel(c.id)} style={{background:'var(--cinzaF)',borderRadius:7,padding:'9px 13px',fontSize:14,color:'var(--coral)',minHeight:44}}>🗑</button>
            </div></div>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:10}}>{[{l:'Contratado',v:c.vlrContratado,col:'var(--preto)'},{l:'Recebido',v:c.vlrRecebido,col:'var(--verde)'},{l:'A receber',v:aR,col:aR>0?'var(--coral)':'var(--cinzaE)'}].map(({l,v,col})=>(<div key={l}><div style={{fontSize:10,fontWeight:700,color:'var(--cinzaE)',letterSpacing:'.07em',textTransform:'uppercase',marginBottom:2}}>{l}</div><div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:col}}>{brl(v)}</div></div>))}</div>
    {c.vlrContratado>0&&(<div style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--cinzaE)',marginBottom:3}}><span>Progresso</span><span style={{fontWeight:700,color:pR>=1?'var(--verde)':'var(--azul)'}}>{pp(pR)}</span></div><div style={{height:5,borderRadius:99,background:'var(--cinzaF)'}}><div style={{height:'100%',width:`${pR*100}%`,background:pR>=1?'var(--verde)':'var(--lima)',borderRadius:99}}/></div></div>)}
    {c.obs&&<div style={{fontSize:12,color:'var(--cinzaE)',fontStyle:'italic'}}>{c.obs}</div>}
    </div></div>);})}
  </div>{modal&&<Modal title={modal==='new'?'Novo Cliente':'Editar Cliente'} onClose={()=>setModal(null)}><FormC init={modal!=='new'?modal:null} onSave={save} onClose={()=>setModal(null)}/></Modal>}{del&&<DelModal msg="Excluir este cliente?" onConfirm={()=>{onDelete(del);setDel(null);}} onClose={()=>setDel(null)}/>}</div>);
}

// ── PREVISÕES ─────────────────────────────────────────────────────
const FREQ_DIAS = {semanal:7,quinzenal:15,mensal:30,trimestral:91,semestral:182,anual:365};
const FREQ_LABEL = {semanal:'Semanal',quinzenal:'Quinzenal',mensal:'Mensal',trimestral:'Trimestral',semestral:'Semestral',anual:'Anual'};

function gerarProjecoes(lancamentos, horizonte=90){
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const fim = new Date(hoje); fim.setDate(fim.getDate()+horizonte);
  const recorrentes = lancamentos.filter(l=>l.recorrente&&l.status!=='CANCELADO');
  const projetados=[];
  for(const l of recorrentes){
    const freq = FREQ_DIAS[l.recorrenciaFreq||'mensal'];
    if(!l.dataDoc) continue;
    let base = new Date(l.dataDoc+'T12:00:00');
    // Avança até hoje ou depois
    while(base < hoje) base = new Date(base.getTime()+freq*86400000);
    // Gera ocorrências até o horizonte
    while(base <= fim){
      const isoDate = base.toISOString().slice(0,10);
      const jaCobre = lancamentos.some(p=>
        p.id!==l.id&&p.tipo===l.tipo&&
        (p.status==='PAGO'||p.status==='RECEBIDO'||p.status==='PREVISTO'||p.status==='A RECEBER')&&
        p.dataDoc===isoDate&&
        (p.descricao||'').toLowerCase()===(l.descricao||'').toLowerCase()
      );
      if(!jaCobre) projetados.push({
        ...l, id:l.id+'_proj_'+isoDate, dataDoc:isoDate,
        status:l.tipo==='RECEITA'?'A RECEBER':'PREVISTO',
        _projetado:true, _freqLabel:FREQ_LABEL[l.recorrenciaFreq||'mensal']
      });
      base = new Date(base.getTime()+freq*86400000);
    }
  }
  return projetados;
}

function FluxoChart({pontos}){
  if(!pontos||pontos.length<2) return null;
  const vals = pontos.map(p=>p.saldo);
  const minV = Math.min(...vals,0);
  const maxV = Math.max(...vals,1);
  const range = maxV-minV||1;
  const W=340,H=90,PL=8,PT=8,PB=20,PR=8;
  const w=W-PL-PR, h=H-PT-PB;
  const x=i=>(PL+i/(pontos.length-1)*w);
  const y=v=>(PT+h-(v-minV)/range*h);
  const pts = pontos.map((_,i)=>x(i)+','+y(vals[i])).join(' ');
  const isPos = v=>v>=0;
  return(
    <svg viewBox={'0 0 '+W+' '+H} style={{width:'100%',height:H,display:'block'}}>
      {/* Zero line */}
      {minV<0&&maxV>0&&<line x1={PL} y1={y(0)} x2={W-PR} y2={y(0)} stroke="var(--cinzaM)" strokeWidth="1" strokeDasharray="3,3"/>}
      {/* Fill */}
      <polygon points={[PL+','+y(0),...pontos.map((_,i)=>x(i)+','+y(vals[i])),W-PR+','+y(0)].join(' ')} fill={isPos(vals[vals.length-1])?'rgba(45,110,71,.15)':'rgba(232,97,75,.1)'}/>
      {/* Line */}
      <polyline points={pts} fill="none" stroke={isPos(vals[vals.length-1])?'var(--verde)':'var(--coral)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Points */}
      {pontos.map((p,i)=><circle key={i} cx={x(i)} cy={y(vals[i])} r="3.5" fill={isPos(vals[i])?'var(--verde)':'var(--coral)'} stroke="var(--branco)" strokeWidth="1.5"/>)}
      {/* Labels */}
      {pontos.map((p,i)=><text key={'l'+i} x={x(i)} y={H-4} textAnchor="middle" fontSize="9" fill="var(--cinzaE)" fontFamily="var(--ff)">{p.label}</text>)}
    </svg>
  );
}

function Previsoes({lancamentos,setAba}){
  const [horizonte,setHorizonte] = useState(90);
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const hojeStr = hoje.toISOString().slice(0,10);

  // Saldo atual real
  const saldoAtual = lancamentos.reduce((s,l)=>{
    if(l.status==='RECEBIDO'||l.status==='PAGO'){
      const v=+(l.vlrPago||l.vlrLiquido||l.vlrBruto)||0;
      return s+(l.tipo==='RECEITA'?v:-v);
    }
    return s;
  },0);

  // Projeções de recorrentes
  const projetados = gerarProjecoes(lancamentos, horizonte);

  // Todos os futuros (confirmados + projetados)
  const futuroConf = lancamentos.filter(l=>
    (l.status==='A RECEBER'||l.status==='PREVISTO')&&l.dataDoc>=hojeStr
  );
  const todosFuturos = [...futuroConf,...projetados];

  // Calcular saldo em N dias
  const saldoEm = dias => {
    const cutoff = new Date(hoje); cutoff.setDate(cutoff.getDate()+dias);
    const cutStr = cutoff.toISOString().slice(0,10);
    const delta = todosFuturos
      .filter(l=>(l.dataDoc||'')<= cutStr)
      .reduce((s,l)=>{const v=+(l.vlrBruto||l.vlrPago)||0;return s+(l.tipo==='RECEITA'?v:-v);},0);
    return saldoAtual+delta;
  };

  const s30=saldoEm(30),s60=saldoEm(60),s90=saldoEm(90);

  // Pontos para gráfico (hoje + 2w + 4w + 6w + 8w + 12w)
  const PONTOS=[{d:0,l:'Hoje'},{d:15,l:'15d'},{d:30,l:'30d'},{d:45,l:'45d'},{d:60,l:'60d'},{d:90,l:'90d'}];
  const chartPts = PONTOS.map(p=>({label:p.l,saldo:saldoEm(p.d)}));

  // Agrupar futuros por semana/data
  const todasEntradas = todosFuturos.filter(l=>l.tipo==='RECEITA').sort((a,b)=>(a.dataDoc||'').localeCompare(b.dataDoc||''));
  const todasSaidas   = todosFuturos.filter(l=>l.tipo==='DESPESA').sort((a,b)=>(a.dataDoc||'').localeCompare(b.dataDoc||''));

  const totalEntradas = todasEntradas.reduce((s,l)=>s+(+(l.vlrBruto||l.vlrPago)||0),0);
  const totalSaidas   = todasSaidas.reduce((s,l)=>s+(+(l.vlrBruto||l.vlrPago)||0),0);
  const nRecorr = projetados.length;

  const isAtrasado = d=>{try{return d<hojeStr;}catch{return false;}};
  const fmtDt = d=>{
    if(!d) return 'Sem data';
    try{
      const diff=Math.round((new Date(d+'T12:00:00')-hoje)/86400000);
      const label=new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
      if(diff<0) return label+' ⚠ ATRASADO';
      if(diff===0) return label+' · HOJE';
      if(diff===1) return label+' · amanhã';
      if(diff<=7) return label+' · em '+diff+'d';
      return label;
    }catch{return d;}
  };

  const agruparPorData = items => items.reduce((acc,l)=>{
    const k=l.dataDoc||'sem-data';
    if(!acc[k]) acc[k]=[];
    acc[k].push(l);
    return acc;
  },{});

  const ItemRow = ({l,tipo})=>{
    const vlr=+(l.vlrBruto||l.vlrPago)||0;
    const atrasado=isAtrasado(l.dataDoc);
    return(
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 14px',borderBottom:'1px solid var(--cinzaF)',gap:8,background:atrasado?'#FFF5F5':'transparent'}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap',marginBottom:2}}>
            {l._projetado&&<span style={{fontSize:9,background:'#EEF5E0',color:'var(--verde)',borderRadius:3,padding:'1px 5px',fontWeight:700}}>🔄 {l._freqLabel}</span>}
            {atrasado&&<span style={{fontSize:9,background:'#FEE2E2',color:'var(--coral)',borderRadius:3,padding:'1px 5px',fontWeight:700}}>ATRASADO</span>}
            <span style={{fontFamily:'var(--ff)',fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.descricao}</span>
          </div>
          <div style={{fontSize:11,color:'var(--cinzaE)'}}>{l.categoria||''}{l.clienteFornecedor?' · '+l.clienteFornecedor:''}{l.cartaoNome?' · 💳 '+l.cartaoNome:''}</div>
        </div>
        <span style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700,color:tipo==='entrada'?'var(--verde)':'var(--coral)',flexShrink:0}}>{tipo==='entrada'?'+':'-'}{brl(vlr)}</span>
      </div>
    );
  };

  const GrupoData = ({data,items,tipo})=>(
    <div>
      <div style={{padding:'5px 14px',background:'var(--cinzaF)',display:'flex',alignItems:'center',gap:7}}>
        <div style={{width:7,height:7,borderRadius:'50%',background:isAtrasado(data)?'var(--coral)':tipo==='entrada'?'var(--verde)':'var(--amarelo)'}}/>
        <span style={{fontFamily:'var(--ff)',fontSize:10,fontWeight:700,color:isAtrasado(data)?'var(--coral)':'var(--cinzaE)',letterSpacing:'.07em'}}>{fmtDt(data).toUpperCase()}</span>
      </div>
      {items.map((l,i)=><ItemRow key={l.id+i} l={l} tipo={tipo}/>)}
    </div>
  );

  const entradasGrupo = agruparPorData(todasEntradas);
  const saidasGrupo   = agruparPorData(todasSaidas);

  return(<div className="au page">
    <div className="pc" style={{paddingTop:12}}>

      {/* SELETOR DE HORIZONTE */}
      <div style={{display:'flex',gap:7,marginBottom:14}}>
        {[30,60,90].map(d=>(
          <button key={d} onClick={()=>setHorizonte(d)} style={{flex:1,padding:'8px 0',borderRadius:7,border:'1.5px solid '+(horizonte===d?'var(--lima)':'var(--cinzaM)'),background:horizonte===d?'var(--lima)':'transparent',color:horizonte===d?'var(--preto)':'var(--cinzaE)',fontFamily:'var(--ff)',fontSize:13,fontWeight:700,cursor:'pointer'}}>
            {d} dias
          </button>
        ))}
      </div>

      {/* FLUXO DE CAIXA 30/60/90 */}
      <div className="card" style={{padding:0,overflow:'hidden',marginBottom:16}}>
        <div style={{padding:'14px 16px 10px',borderBottom:'1px solid var(--cinzaF)'}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:'.1em',color:'var(--cinzaE)',marginBottom:8}}>FLUXO DE CAIXA PROJETADO</div>
          <FluxoChart pontos={chartPts}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr'}}>
          {[['Hoje',saldoAtual,'var(--preto)'],['30 dias',s30,s30>=0?'var(--verde)':'var(--coral)'],['60 dias',s60,s60>=0?'var(--verde)':'var(--coral)'],['90 dias',s90,s90>=0?'var(--verde)':'var(--coral)']].map(([l,v,col])=>(
            <div key={l} style={{padding:'12px 14px',borderRight:'1px solid var(--cinzaF)'}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:'.08em',color:'var(--cinzaE)',marginBottom:5}}>{l}</div>
              <div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:col,lineHeight:1}}>{brl(v)}</div>
              {l!=='Hoje'&&<div style={{fontSize:9,color:v>=saldoAtual?'var(--verde)':'var(--coral)',marginTop:3,fontWeight:600}}>{v>=saldoAtual?'↑':v===saldoAtual?'→':'↓'} {brl(Math.abs(v-saldoAtual))}</div>}
            </div>
          ))}
        </div>
        {nRecorr>0&&<div style={{padding:'8px 16px',background:'#F0F7E6',fontSize:11,color:'var(--verde)',fontWeight:600}}>
          🔄 {nRecorr} recorrência{nRecorr!==1?'s':''} projetada{nRecorr!==1?'s':''} automaticamente nos próximos {horizonte} dias
        </div>}
      </div>

      {/* RESUMO ENTRADAS vs SAÍDAS */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
        <div className="card" style={{padding:'12px 14px'}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:'.1em',color:'var(--cinzaE)',marginBottom:5}}>ENTRADAS PREVISTAS</div>
          <div style={{fontFamily:'var(--ff)',fontSize:19,fontWeight:700,color:'var(--verde)'}}>{brl(totalEntradas)}</div>
          <div style={{fontSize:11,color:'var(--cinzaE)',marginTop:3}}>{todasEntradas.length} item{todasEntradas.length!==1?'s':''}</div>
        </div>
        <div className="card" style={{padding:'12px 14px'}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:'.1em',color:'var(--cinzaE)',marginBottom:5}}>SAÍDAS PREVISTAS</div>
          <div style={{fontFamily:'var(--ff)',fontSize:19,fontWeight:700,color:'var(--coral)'}}>{brl(totalSaidas)}</div>
          <div style={{fontSize:11,color:'var(--cinzaE)',marginTop:3}}>{todasSaidas.length} item{todasSaidas.length!==1?'s':''}</div>
        </div>
      </div>

      {/* TIMELINE LADO A LADO */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}} className="prev-grid">
        <div>
          <SH>Entradas previstas</SH>
          <div className="card" style={{padding:0,overflow:'hidden',marginBottom:16}}>
            {todasEntradas.length===0
              ?<div style={{padding:'28px 16px',textAlign:'center',color:'var(--cinzaE)',fontSize:13,fontStyle:'italic'}}>Nenhuma entrada prevista</div>
              :Object.entries(entradasGrupo).map(([dt,items])=><GrupoData key={dt} data={dt} items={items} tipo="entrada"/>)
            }
          </div>
        </div>
        <div>
          <SH>Saídas previstas</SH>
          <div className="card" style={{padding:0,overflow:'hidden',marginBottom:16}}>
            {todasSaidas.length===0
              ?<div style={{padding:'28px 16px',textAlign:'center',color:'var(--cinzaE)',fontSize:13,fontStyle:'italic'}}>Nenhuma saída prevista</div>
              :Object.entries(saidasGrupo).map(([dt,items])=><GrupoData key={dt} data={dt} items={items} tipo="saida"/>)
            }
          </div>
        </div>
      </div>

      <div style={{textAlign:'center',marginBottom:20}}>
        <button onClick={()=>setAba('lancamentos')} style={{background:'var(--verde)',color:'#fff',border:'none',borderRadius:8,padding:'11px 24px',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Adicionar lançamento previsto</button>
      </div>
    </div>
  </div>);
}


// ── CENÁRIOS FINANCEIROS ──────────────────────────────────────────
function Cenarios({lancamentos,clientes,token}){
  const[crm,setCrm]=useState([]);
  const[horizonte,setHorizonte]=useState(6);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    fetch(`${SB_URL}/rest/v1/crm_contatos?deleted_at=is.null&select=id,data`,{headers:sbH(token)})
      .then(r=>r.json())
      .then(rows=>setCrm(Array.isArray(rows)?rows.map(r=>({...r.data,_id:r.id})):[]))
      .catch(()=>setCrm([]))
      .finally(()=>setLoading(false));
  },[]);

  const hoje=new Date(); hoje.setHours(0,0,0,0);
  const meses=Array.from({length:horizonte},(_,i)=>{const d=new Date(hoje);d.setMonth(d.getMonth()+i);return d.toISOString().slice(0,7);});
  const MS_LABEL=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  // Saldo histórico atual
  const saldoAtual=lancamentos.reduce((s,l)=>{
    if(l.status==='RECEBIDO'||l.status==='PAGO'){const v=+(l.vlrPago||l.vlrLiquido||l.vlrBruto)||0;return s+(getClassif(l)==='receita'?v:-v);}
    return s;
  },0);

  // Ticket médio de clientes ativos
  const clAtivos=clientes.filter(c=>c.statusProjeto==='ATIVO');
  const avgDeal=clAtivos.length>0?clAtivos.reduce((s,c)=>s+(+(c.vlrContratado)||0),0)/clAtivos.length:3000;

  // CRM por estágio
  const crmNeg=crm.filter(c=>c.stage==='Negociação / Proposta');
  const crmLeads=crm.filter(c=>c.stage==='Leads');

  // Clientes em proposta/negociação
  const clProposta=clientes.filter(c=>c.statusProjeto==='PROPOSTA'||c.statusProjeto==='NEGOCIAÇÃO');

  // Recorrentes confirmados
  const recorrDesps=lancamentos.filter(l=>l.recorrente&&l.tipo==='DESPESA');
  const recorrRec=lancamentos.filter(l=>l.recorrente&&l.tipo==='RECEITA');
  const tRecorrDesp=recorrDesps.reduce((s,l)=>s+(+(l.vlrBruto||l.vlrPago)||0),0);
  const tRecorrRec=recorrRec.reduce((s,l)=>s+(+(l.vlrBruto)||0),0);

  const calcMes=(m,cenario)=>{
    // Despesas confirmadas
    const despConf=lancamentos.filter(l=>l.tipo==='DESPESA'&&(l.status==='PREVISTO')&&(l.dataDoc||'').startsWith(m)).reduce((s,l)=>s+(+(l.vlrBruto)||0),0);
    const desp=despConf+tRecorrDesp;
    // Receita confirmada (A RECEBER com data)
    const recConf=lancamentos.filter(l=>l.tipo==='RECEITA'&&l.status==='A RECEBER'&&(l.dataDoc||'').startsWith(m)).reduce((s,l)=>s+(+(l.vlrBruto)||0),0);
    if(cenario==='conservador') return{rec:recConf,desp};
    // Realista: + propostas em curso (distribuída pelos próximos 3 meses)
    const idx=meses.indexOf(m);
    const recProp=idx<3?clProposta.reduce((s,c)=>s+(+(c.vlrContratado)||avgDeal)/3,0):0;
    if(cenario==='realista') return{rec:recConf+recProp+tRecorrRec,desp};
    // Otimista: + CRM leads + negociações
    const recCRM=idx<6?(crmNeg.length*avgDeal/3+crmLeads.length*avgDeal/6):0;
    return{rec:recConf+recProp+recCRM+tRecorrRec,desp};
  };

  const SCEN=[
    {id:'conservador',l:'📊 Conservador',desc:'Só A Receber confirmados',col:'#6B7280'},
    {id:'realista',l:'🎯 Realista',desc:'Confirmados + propostas em negociação',col:'#1A4F71'},
    {id:'otimista',l:'🚀 Otimista',desc:'Tudo + pipeline CRM completo',col:'#8FA715'},
  ];

  // Saldo acumulado por cenário
  const acum=SCEN.map(s=>{
    let acc=saldoAtual;
    return meses.map(m=>{const{rec,desp}=calcMes(m,s.id);acc+=rec-desp;return{m,rec,desp,acc};});
  });

  // Totais (soma dos resultados mensais)
  const totais=SCEN.map((s,si)=>({...s,total:acum[si].reduce((t,m)=>t+(m.rec-m.desp),0),saldoFinal:acum[si][acum[si].length-1]?.acc||saldoAtual}));

  // Chart SVG
  const allVals=[saldoAtual,...acum.flatMap(a=>a.map(m=>m.acc))];
  const maxV=Math.max(...allVals,0);const minV=Math.min(...allVals,0);
  const range=maxV-minV||1;
  const W=520,H=110,PL=52,PT=8,PB=22,PR=8;
  const cw=W-PL-PR,ch=H-PT-PB;
  const cx=i=>PL+(i/(horizonte))*cw;
  const cy=v=>PT+ch-(v-minV)/range*ch;
  const pts=si=>[`${cx(0)},${cy(saldoAtual)}`,...acum[si].map((m,i)=>`${cx(i+1)},${cy(m.acc)}`)].join(' ');

  return(<div className="au page pc" style={{paddingTop:12}}>
    {loading&&<div style={{textAlign:'center',padding:40,color:'var(--cinzaE)',fontSize:13}}>Carregando dados do CRM…</div>}
    {!loading&&<>
      {/* SELETOR HORIZONTE */}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[3,6,12].map(h=><button key={h} onClick={()=>setHorizonte(h)} style={{flex:1,padding:'9px 0',borderRadius:7,border:'1.5px solid '+(horizonte===h?'var(--lima)':'var(--cinzaM)'),background:horizonte===h?'var(--lima)':'transparent',color:horizonte===h?'var(--preto)':'var(--cinzaE)',fontFamily:'var(--ff)',fontSize:13,fontWeight:700,cursor:'pointer'}}>{h} meses</button>)}
      </div>

      {/* CARDS DOS CENÁRIOS */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
        {totais.map(s=><div key={s.id} className="card" style={{borderTop:`3px solid ${s.col}`,padding:'14px 14px'}}>
          <div style={{fontSize:12,fontWeight:700,color:s.col,marginBottom:4}}>{s.l}</div>
          <div style={{fontSize:10,color:'var(--cinzaE)',marginBottom:10}}>{s.desc}</div>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:'.08em',color:'var(--cinzaE)',marginBottom:3}}>RESULTADO PROJETADO</div>
          <div style={{fontFamily:'var(--ff)',fontSize:20,fontWeight:700,color:s.total>=0?s.col:'var(--coral)'}}>{brl(s.total)}</div>
          <div style={{fontSize:9,color:'var(--cinzaE)',marginTop:6}}>Saldo final estimado</div>
          <div style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:s.saldoFinal>=0?s.col:'var(--coral)'}}>{brl(s.saldoFinal)}</div>
        </div>)}
      </div>

      {/* GRÁFICO */}
      <div className="card" style={{padding:'14px 16px 10px',marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:'.09em',color:'var(--cinzaE)',marginBottom:10}}>SALDO PROJETADO — PRÓXIMOS {horizonte} MESES</div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:H,display:'block'}}>
          {minV<0&&maxV>0&&<line x1={PL} y1={cy(0)} x2={W-PR} y2={cy(0)} stroke="var(--cinzaM)" strokeWidth="1" strokeDasharray="4,3"/>}
          {SCEN.map((s,si)=><polyline key={s.id} points={pts(si)} fill="none" stroke={s.col} strokeWidth={si===1?2.5:1.8} strokeLinecap="round" strokeLinejoin="round" opacity={si===0?.5:1}/>)}
          {['Hoje',...meses.map(m=>MS_LABEL[parseInt(m.slice(5))-1])].map((l,i)=><text key={i} x={cx(i)} y={H-4} textAnchor="middle" fontSize="9" fill="var(--cinzaE)" fontFamily="var(--ff)">{l}</text>)}
        </svg>
        <div style={{display:'flex',gap:16,marginTop:8,flexWrap:'wrap'}}>
          {SCEN.map(s=><span key={s.id} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--cinzaE)'}}><span style={{width:20,height:2.5,background:s.col,display:'inline-block',borderRadius:2}}/>{s.l}</span>)}
        </div>
      </div>

      {/* TABELA MENSAL */}
      <SH>Detalhes mês a mês</SH>
      <div style={{overflowX:'auto',borderRadius:12,boxShadow:'0 1px 8px rgba(0,0,0,.06)',marginBottom:16}}>
        <table style={{width:'100%',borderCollapse:'collapse',background:'var(--branco)',minWidth:400,fontSize:12}}>
          <thead><tr style={{background:'var(--preto)'}}>
            <th style={{padding:'8px 12px',textAlign:'left',color:'var(--lima)',fontFamily:'var(--ff)',fontSize:11}}>MÊS</th>
            {SCEN.map(s=><th key={s.id} colSpan={2} style={{padding:'8px 10px',textAlign:'center',color:s.col,fontFamily:'var(--ff)',fontSize:10}}>{s.l}</th>)}
          </tr>
          <tr style={{background:'#1a1a1a'}}>
            <th style={{padding:'5px 12px',textAlign:'left',color:'var(--cinzaE)',fontFamily:'var(--ff)',fontSize:10}}>COMPETÊNCIA</th>
            {SCEN.map(s=>[<th key={s.id+'r'} style={{padding:'5px 8px',textAlign:'right',color:'#8FA715',fontFamily:'var(--ff)',fontSize:9}}>RECEITA</th>,
              <th key={s.id+'s'} style={{padding:'5px 8px',textAlign:'right',color:s.col,fontFamily:'var(--ff)',fontSize:9}}>SALDO ACUM.</th>])}
          </tr></thead>
          <tbody>
            {meses.map((m,mi)=>{
              const label=MS_LABEL[parseInt(m.slice(5))-1]+'/'+m.slice(2,4);
              return(<tr key={m} style={{background:mi%2===0?'var(--branco)':'#FAFAF6'}}>
                <td style={{padding:'9px 12px',fontFamily:'var(--ff)',fontWeight:700,fontSize:12,borderBottom:'1px solid var(--cinzaF)'}}>{label}</td>
                {acum.map((sa,si)=>[
                  <td key={'r'+si} style={{padding:'9px 8px',textAlign:'right',fontFamily:'var(--ff)',fontSize:11,color:'var(--verde)',borderBottom:'1px solid var(--cinzaF)'}}>{brl(sa[mi].rec)}</td>,
                  <td key={'s'+si} style={{padding:'9px 8px',textAlign:'right',fontFamily:'var(--ff)',fontWeight:700,fontSize:12,color:sa[mi].acc>=0?SCEN[si].col:'var(--coral)',borderBottom:'1px solid var(--cinzaF)',borderRight:'1px solid var(--cinzaF)'}}>{brl(sa[mi].acc)}</td>
                ])}
              </tr>);
            })}
          </tbody>
        </table>
      </div>

      {/* PREMISSAS */}
      <div className="card" style={{background:'var(--cinzaF)',padding:'14px 16px'}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:'.09em',color:'var(--cinzaE)',marginBottom:10}}>ℹ️ PREMISSAS DO CÁLCULO</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          {[
            ['📊 Conservador','Apenas lançamentos A RECEBER com data definida + despesas previstas + recorrências fixas'],
            ['🎯 Realista','Conservador + '+clProposta.length+' cliente(s) em proposta ('+brl(clProposta.reduce((s,c)=>s+(+(c.vlrContratado)||avgDeal),0))+') distribuídos em 3 meses'],
            ['🚀 Otimista','Realista + '+crmNeg.length+' negociações e '+crmLeads.length+' leads no CRM + recorrências de receita ('+brl(tRecorrRec)+'/mês)'],
          ].map(([t,d])=><div key={t}><div style={{fontFamily:'var(--ff)',fontWeight:700,fontSize:12,marginBottom:4}}>{t}</div><div style={{fontSize:11,color:'var(--cinzaE)',lineHeight:1.5}}>{d}</div></div>)}
        </div>
        <div style={{marginTop:12,fontSize:11,color:'var(--cinzaE)',fontStyle:'italic'}}>Ticket médio calculado: {brl(avgDeal)} · Saldo atual: {brl(saldoAtual)}</div>
      </div>
    </>}
  </div>);
}

// ── ROOT ──────────────────────────────────────────────────────────
export default function Financeiro({onBack,token}){
  const[lancamentos,setLancamentos]=useState([]);
  const[clientes,setClientes]=useState([]);
  const[lixeira,setLixeira]=useState([]);
  const[loading,setLoading]=useState(true);
  const[syncing,setSyncing]=useState(false);
  const[aba,setAba]=useState('resumo');
  const nL=useRef(()=>{});const nC=useRef(()=>{});

  useEffect(()=>{loadAll();},[]);

  async function loadAll(){
    setLoading(true);
    const[lanc,cli,lix]=await Promise.all([sbLoad('fin_lancamentos',token),sbLoad('fin_clientes',token),sbLoadLix('fin_lancamentos',token)]);
    setLancamentos(lanc);setClientes(cli);setLixeira(lix);
    setLoading(false);
  }

  const sync=async fn=>{setSyncing(true);try{await fn();}finally{setSyncing(false);}};

  const saveLancamento=async item=>{await sync(async()=>{await sbUpsert('fin_lancamentos',item,token);setLancamentos(p=>p.some(l=>l.id===item.id)?p.map(l=>l.id===item.id?item:l):[item,...p]);});};
  const softDelLancamento=async id=>{const item=lancamentos.find(l=>l.id===id);await sync(async()=>{await sbSoftDel('fin_lancamentos',id,token);setLancamentos(p=>p.filter(l=>l.id!==id));if(item)setLixeira(p=>[{...item,deletedAt:new Date().toISOString()},...p]);});};
  const restoreLancamento=async id=>{await sync(async()=>{await sbRestore('fin_lancamentos',id,token);const item=lixeira.find(l=>l.id===id);if(item){const{deletedAt,...rest}=item;setLancamentos(p=>[rest,...p]);setLixeira(p=>p.filter(l=>l.id!==id));}});};
  const purgeLancamento=async id=>{await sync(async()=>{await sbPurge('fin_lancamentos',id,token);setLixeira(p=>p.filter(l=>l.id!==id));});};
  const importLancamentos=async items=>{await sync(async()=>{await Promise.all(items.map(i=>sbUpsert('fin_lancamentos',i,token)));setLancamentos(p=>[...items,...p]);});};

  const saveCliente=async item=>{await sync(async()=>{await sbUpsert('fin_clientes',item,token);setClientes(p=>p.some(c=>c.id===item.id)?p.map(c=>c.id===item.id?item:c):[item,...p]);});};
  const delCliente=async id=>{await sync(async()=>{await sbSoftDel('fin_clientes',id,token);setClientes(p=>p.filter(c=>c.id!==id));});};

  const ABAS=[{id:'resumo',l:'RESUMO'},{id:'cenarios',l:'CENÁRIOS'},{id:'receber',l:'RECEBER'},{id:'previsoes',l:'PREVISÕES'},{id:'lancamentos',l:'LANÇAMENTOS'},{id:'dre',l:'DRE'},{id:'clientes',l:'CLIENTES'}];
  const fab=()=>{if(aba==='lancamentos')nL.current();else if(aba==='clientes')nC.current();else{setAba('lancamentos');setTimeout(()=>nL.current(),200);}};

  if(loading)return(<><style>{STYLE}</style><div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--cinzaF)'}}><div style={{textAlign:'center'}}><div style={{fontFamily:'var(--ff)',fontSize:32,fontWeight:800,color:'var(--verde)',letterSpacing:'.06em'}}>ZESTE</div><div style={{color:'var(--cinzaE)',fontSize:13,marginTop:4}}>Carregando do banco de dados…</div></div></div></>);

  return(<>
    <style>{STYLE}</style>
    {syncing&&<div className="sync-bar" style={{width:'100%'}}/>}
    <div style={{background:'var(--preto)',position:'sticky',top:0,zIndex:300}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {onBack&&<button onClick={onBack} style={{color:'var(--lima)',fontSize:24,padding:'0 6px 0 0',lineHeight:1,minWidth:36,minHeight:36,display:'flex',alignItems:'center'}}>‹</button>}
          <div style={{display:'flex',alignItems:'baseline',gap:7}}><span style={{fontFamily:'var(--ff)',fontSize:20,fontWeight:800,color:'var(--lima)',letterSpacing:'.06em'}}>ZESTE</span><span style={{fontSize:9,color:'var(--cinzaE)',letterSpacing:'.14em'}}>FINANCEIRO</span></div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {syncing&&<span style={{fontSize:10,color:'var(--lima)',fontFamily:'var(--ff)',fontWeight:700}}>SINCRONIZANDO…</span>}
          <button onClick={loadAll} style={{color:'var(--cinzaE)',fontSize:18,minWidth:36,minHeight:36,display:'flex',alignItems:'center',justifyContent:'center'}}>↻</button>
        </div>
      </div>
      <nav className="nav">{ABAS.map((a,i)=>(<span key={a.id}>{i>0&&<div className="nav-sep"/>}<div className={`nav-item${aba===a.id?' on':''}`} onClick={()=>setAba(a.id)}>{a.l}</div></span>))}</nav>
    </div>
    {aba==='resumo'&&<Resumo lancamentos={lancamentos} setAba={setAba}/>}
    {aba==='previsoes'&&<Previsoes lancamentos={lancamentos} setAba={setAba}/>}
    {aba==='lancamentos'&&<Lancamentos lancamentos={lancamentos} lixeira={lixeira} openNew={nL} onSave={saveLancamento} onDelete={softDelLancamento} onRestore={restoreLancamento} onPurge={purgeLancamento} onImport={importLancamentos}/>}
    {aba==='cenarios'&&<Cenarios lancamentos={lancamentos} clientes={clientes} token={token}/>}
    {aba==='receber'&&<ContasReceber lancamentos={lancamentos} clientes={clientes} onSaveL={saveLancamento} setAba={setAba}/>}
    {aba==='dre'&&<DRE lancamentos={lancamentos}/>}
    {aba==='clientes'&&<Clientes clientes={clientes} onSave={saveCliente} onDelete={delCliente} openNew={nC} onSaveL={saveLancamento} lancamentos={lancamentos}/>}
    <button className="fab" onClick={fab}>+</button>
  </>);
}

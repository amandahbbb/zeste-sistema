import { useState, useEffect, useCallback, useRef } from "react";
import Documentos from "./Documentos.jsx";
import { toast } from "./toast.js";
import { calcAllFichas, calcPrato } from "./cmv.js";

// ── SUPABASE ──────────────────────────────────────────────────────
const SB_URL="https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
function sbH(t){return{"apikey":SB_KEY,"Authorization":`Bearer ${t||SB_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"};}
async function sbLoad(table,t){try{const r=await fetch(`${SB_URL}/rest/v1/${table}?deleted_at=is.null&order=created_at.desc`,{headers:sbH(t)});if(!r.ok)return null;const d=await r.json();return Array.isArray(d)?d.map(r=>({...r.dados,_id:r.id,_cliente:r.cliente_id})):null;}catch{return null;}}
async function sbLoadAll(table,t){try{const r=await fetch(`${SB_URL}/rest/v1/${table}?order=created_at.desc`,{headers:sbH(t)});const d=await r.json();return Array.isArray(d)?d.map(r=>r.dados||r):[];}catch{return[];}}
async function sbUpsert(table,item,clienteId,t){try{const r=await fetch(`${SB_URL}/rest/v1/${table}`,{method:"POST",headers:{...sbH(t),"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({id:item.id,cliente_id:clienteId||'zeste',dados:item,updated_at:new Date().toISOString()})});if(!r.ok){toast("Erro ao salvar — tente de novo","erro");return false;}toast("✓ Salvo");return true;}catch{toast("Sem conexão — não foi salvo","erro");return false;}}
async function sbDel(table,id,t){try{const r=await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`,{method:"PATCH",headers:sbH(t),body:JSON.stringify({deleted_at:new Date().toISOString()})});if(!r.ok){toast("Erro ao excluir","erro");return false;}toast("✓ Excluído");return true;}catch{toast("Sem conexão — não foi excluído","erro");return false;}}
async function sbInsertIng(item,clienteId,t){try{const r=await fetch(`${SB_URL}/rest/v1/fin_ingredientes`,{method:"POST",headers:{...sbH(t),"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({id:item.id,cliente_id:clienteId||'zeste',dados:item,updated_at:new Date().toISOString()})});if(!r.ok){toast("Erro ao salvar ingrediente","erro");return false;}toast("✓ Salvo");return true;}catch{toast("Sem conexão — não foi salvo","erro");return false;}}

// ── UTILITÁRIOS ───────────────────────────────────────────────────
const uid=()=>Math.random().toString(36).slice(2,9);
const brl=v=>v==null||isNaN(v)?'—':'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct=v=>v==null||isNaN(v)?'—':(v*100).toFixed(1)+'%';
const num=(v,d=1)=>v==null||isNaN(v)?'—':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:d});
const normNome=s=>(s||'').toString().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim();

// Input numérico BR: aceita vírgula, sem zero travado. Guarda string, devolve número.
function NumInput({value,onChange,step,min,placeholder,style,className}){
  const fmt=v=>(v===0||v===''||v==null||isNaN(v))?'':String(v).replace('.',',');
  const[txt,setTxt]=useState(fmt(value));
  const[foco,setFoco]=useState(false);
  useEffect(()=>{if(!foco)setTxt(fmt(value));},[value,foco]);
  const parse=s=>{const n=parseFloat(String(s).replace(',','.'));return isNaN(n)?0:n;};
  return <input
    type="text" inputMode="decimal" className={className} style={style}
    placeholder={placeholder||'0'} value={txt}
    onFocus={()=>setFoco(true)}
    onChange={e=>{const v=e.target.value.replace(/[^0-9.,]/g,'');setTxt(v);onChange(parse(v));}}
    onBlur={()=>{setFoco(false);setTxt(fmt(value));}}
  />;
}

// ── CMV ENGINE ────────────────────────────────────────────────────
// Escolhe o ingrediente por nome, PRIORIZANDO a versão do cliente logado.
// Guarda o preço base p/ transparência. meuCli = cliente_id logado ('zeste'/undefined = admin/base).




function calcProducao(producao,pratosCalc,fichasCalc,ingredientes){
  const agreg=new Map();
  const addIng=(nomeRef,qtdLiq,nomePrato)=>{
    const ing=ingredientes.find(i=>i.nome===nomeRef);if(!ing)return;
    const at=agreg.get(nomeRef)||{nome:ing.nome,un:ing.un,qtdLiq:0,qtdBruta:0,fc:ing.fc||1,preco:ing.p||0,custo:0,usadoEm:[]};
    at.qtdLiq+=qtdLiq;at.qtdBruta=at.qtdLiq*at.fc;at.custo=at.qtdBruta*at.preco;
    const u=at.usadoEm.find(u=>u.prato===nomePrato);
    if(u)u.qtd+=qtdLiq;else at.usadoEm.push({prato:nomePrato,qtd:qtdLiq});
    agreg.set(nomeRef,at);
  };
  const expandFicha=(nomeRef,mult,nomePrato)=>{
    const ficha=fichasCalc.find(f=>f.nome===nomeRef);if(!ficha)return;
    for(const it of ficha.itens||[]){
      const qtdLiq=(Number(it.qtdLiquida)||0)*mult;
      if(it.tipo==='ficha')expandFicha(it.nomeRef,qtdLiq,nomePrato);
      else addIng(it.nomeRef,qtdLiq,nomePrato);
    }
  };
  for(const{pratoNome,qtd}of producao){
    const prato=pratosCalc.find(p=>p.nome===pratoNome);if(!prato||qtd<=0)continue;
    for(const comp of prato.comps||[]){
      const qtdKg=(Number(comp.qtdGramas)||0)/1000;const qtdTotal=qtdKg*qtd;
      if(comp.tipo==='ficha'){
        const ficha=fichasCalc.find(f=>f.nome===comp.nomeRef);
        if(!ficha||ficha.pesoFinal<=0)continue;
        expandFicha(comp.nomeRef,qtdTotal/ficha.pesoFinal,prato.nome);
      }else addIng(comp.nomeRef,qtdTotal,prato.nome);
    }
  }
  const lista=Array.from(agreg.values()).sort((a,b)=>b.custo-a.custo);
  return{lista,totalCusto:lista.reduce((s,i)=>s+i.custo,0)};
}

const cmvColor=c=>c<.30?'#2D6E47':c<.35?'#B8860B':c<.40?'#E8914B':'#E8614B';
const cmvLabel=c=>c<.30?'Excelente':c<.35?'Bom':c<.40?'Atenção':'Alto';

// ── SEED DATA ─────────────────────────────────────────────────────
const SEED_ING=[{"nome":"COXAO MOLE","un":"KG","p":48.9,"fc":1.12,"fk":0.72,"id":"ing_000"},{"nome":"MIOLO DA PALETA","un":"KG","p":48.9,"fc":1.2,"fk":0.7,"id":"ing_001"},{"nome":"OSSO PARA FUNDO","un":"KG","p":12.9,"fc":1.0,"fk":0.5,"id":"ing_002"},{"nome":"PEITO DE FRANGO","un":"KG","p":15.9,"fc":1.15,"fk":0.8,"id":"ing_003"},{"nome":"SOBRECOXA DESOSSADA COM PELE","un":"KG","p":18.9,"fc":1.7,"fk":0.9,"id":"ing_004"},{"nome":"FRANGO INTEIRO","un":"KG","p":13.9,"fc":1.3,"fk":0.68,"id":"ing_005"},{"nome":"CARCACA DE FRANGO","un":"KG","p":5.9,"fc":1.0,"fk":0.35,"id":"ing_006"},{"nome":"FILE DE TILAPIA","un":"KG","p":45.9,"fc":1.1,"fk":0.75,"id":"ing_007"},{"nome":"FILE DE ROBALO","un":"KG","p":169.0,"fc":1.14,"fk":0.75,"id":"ing_008"},{"nome":"SALMAO FRESCO","un":"KG","p":99.9,"fc":1.18,"fk":0.78,"id":"ing_009"},{"nome":"CAMARAO MEDIO LIMPO","un":"KG","p":89.9,"fc":1.0,"fk":1.0,"id":"ing_010"},{"nome":"BANHA DE PORCO","un":"KG","p":12.9,"fc":1.0,"fk":1.0,"id":"ing_011"},{"nome":"PRESUNTO PARMA","un":"KG","p":139.9,"fc":1.0,"fk":1.0,"id":"ing_012"},{"nome":"BACON","un":"KG","p":34.9,"fc":1.0,"fk":0.5,"id":"ing_013"},{"nome":"PANCETTA","un":"KG","p":69.9,"fc":1.0,"fk":0.9,"id":"ing_014"},{"nome":"MANTEIGA SEM SAL","un":"KG","p":52.9,"fc":1.0,"fk":1.0,"id":"ing_015"},{"nome":"MANTEIGA","un":"KG","p":42.9,"fc":1.0,"fk":1.0,"id":"ing_016"},{"nome":"CREME DE LEITE FRESCO","un":"L","p":52.9,"fc":1.0,"fk":0.9,"id":"ing_017"},{"nome":"CREME DE LEITE","un":"KG","p":18.9,"fc":1.0,"fk":1.0,"id":"ing_018"},{"nome":"LEITE INTEGRAL","un":"L","p":5.9,"fc":1.0,"fk":1.0,"id":"ing_019"},{"nome":"LEITE","un":"L","p":4.9,"fc":1.0,"fk":1.0,"id":"ing_020"},{"nome":"QUEIJO PARMESAO","un":"KG","p":119.9,"fc":1.0,"fk":1.0,"id":"ing_021"},{"nome":"QUEIJO GORGONZOLA","un":"KG","p":89.9,"fc":1.0,"fk":0.98,"id":"ing_022"},{"nome":"QUEIJO MINAS","un":"KG","p":54.9,"fc":1.0,"fk":1.0,"id":"ing_023"},{"nome":"MUSSARELA","un":"KG","p":42.9,"fc":1.0,"fk":0.98,"id":"ing_024"},{"nome":"MUSSARELA DE BUFALA","un":"KG","p":109.9,"fc":1.0,"fk":1.0,"id":"ing_025"},{"nome":"RICOTA","un":"KG","p":24.9,"fc":1.0,"fk":1.0,"id":"ing_026"},{"nome":"CREAM CHEESE","un":"KG","p":44.9,"fc":1.0,"fk":1.0,"id":"ing_027"},{"nome":"IOGURTE GREGO","un":"KG","p":32.9,"fc":1.0,"fk":1.0,"id":"ing_028"},{"nome":"COALHADA SECA","un":"KG","p":32.9,"fc":1.0,"fk":1.0,"id":"ing_029"},{"nome":"OVOS","un":"KG","p":15.9,"fc":1.0,"fk":1.0,"id":"ing_030"},{"nome":"FARINHA DE TRIGO","un":"KG","p":5.9,"fc":1.0,"fk":1.0,"id":"ing_031"},{"nome":"FARINHA DE MANDIOCA","un":"KG","p":5.9,"fc":1.0,"fk":1.0,"id":"ing_032"},{"nome":"FUBA MIMOSO","un":"KG","p":8.9,"fc":1.0,"fk":1.0,"id":"ing_033"},{"nome":"POLVILHO AZEDO","un":"KG","p":12.9,"fc":1.0,"fk":1.0,"id":"ing_034"},{"nome":"ARROZ ARBORIO","un":"KG","p":22.9,"fc":1.0,"fk":2.8,"id":"ing_035"},{"nome":"ARROZ BRANCO","un":"KG","p":8.9,"fc":1.0,"fk":2.2,"id":"ing_036"},{"nome":"ESPAGUETE GRANO DURO","un":"KG","p":28.9,"fc":1.0,"fk":1.9,"id":"ing_037"},{"nome":"FEIJAO PRETO","un":"KG","p":7.9,"fc":1.0,"fk":1.8,"id":"ing_038"},{"nome":"AZEITE DE OLIVA EXTRA VIRGEM","un":"L","p":79.9,"fc":1.0,"fk":1.0,"id":"ing_039"},{"nome":"AZEITE DE OLIVA","un":"L","p":42.9,"fc":1.0,"fk":1.0,"id":"ing_040"},{"nome":"OLEO DE SOJA","un":"L","p":7.9,"fc":1.0,"fk":1.0,"id":"ing_041"},{"nome":"OLEO DE GIRASSOL","un":"L","p":12.9,"fc":1.0,"fk":1.0,"id":"ing_042"},{"nome":"VINHO BRANCO SECO","un":"L","p":35.9,"fc":1.0,"fk":0.1,"id":"ing_043"},{"nome":"VINHO TINTO SECO","un":"L","p":32.9,"fc":1.0,"fk":0.1,"id":"ing_044"},{"nome":"VINAGRE BALSAMICO","un":"L","p":39.9,"fc":1.0,"fk":0.5,"id":"ing_045"},{"nome":"VINAGRE DE VINHO BRANCO","un":"L","p":14.9,"fc":1.0,"fk":1.0,"id":"ing_046"},{"nome":"VINAGRE DE VINHO TINTO","un":"L","p":14.9,"fc":1.0,"fk":1.0,"id":"ing_047"},{"nome":"CEBOLA","un":"KG","p":3.9,"fc":1.15,"fk":0.7,"id":"ing_048"},{"nome":"CEBOLA PEROLA","un":"KG","p":12.9,"fc":1.05,"fk":0.9,"id":"ing_049"},{"nome":"ALHO","un":"KG","p":22.9,"fc":1.09,"fk":0.9,"id":"ing_050"},{"nome":"ALHO PORO","un":"KG","p":24.9,"fc":1.1,"fk":0.85,"id":"ing_051"},{"nome":"CENOURA","un":"KG","p":4.9,"fc":1.09,"fk":0.8,"id":"ing_052"},{"nome":"SALSAO","un":"KG","p":15.9,"fc":1.7,"fk":0.85,"id":"ing_053"},{"nome":"SALSINHA","un":"KG","p":18.9,"fc":1.0,"fk":0.5,"id":"ing_054"},{"nome":"CEBOLINHA","un":"KG","p":14.9,"fc":1.0,"fk":0.5,"id":"ing_055"},{"nome":"CEBOLETE","un":"KG","p":34.9,"fc":1.0,"fk":1.0,"id":"ing_056"},{"nome":"MANJERICAO FRESCO","un":"KG","p":28.9,"fc":1.7,"fk":1.0,"id":"ing_057"},{"nome":"TOMILHO FRESCO","un":"KG","p":38.9,"fc":1.0,"fk":0.3,"id":"ing_058"},{"nome":"ALECRIM","un":"KG","p":28.9,"fc":1.5,"fk":1.0,"id":"ing_059"},{"nome":"LOURO","un":"KG","p":89.9,"fc":1.0,"fk":1.0,"id":"ing_060"},{"nome":"GENGIBRE","un":"KG","p":14.9,"fc":1.09,"fk":1.0,"id":"ing_061"},{"nome":"SAL REFINADO","un":"KG","p":2.9,"fc":1.0,"fk":1.0,"id":"ing_062"},{"nome":"PIMENTA DO REINO PRETA","un":"KG","p":99.9,"fc":1.0,"fk":1.0,"id":"ing_063"},{"nome":"PIMENTA DEDO DE MOCA","un":"KG","p":6.9,"fc":1.12,"fk":1.0,"id":"ing_064"},{"nome":"PIMENTA CALABRESA","un":"KG","p":29.9,"fc":1.0,"fk":1.0,"id":"ing_065"},{"nome":"COLORAU","un":"KG","p":12.9,"fc":1.0,"fk":1.0,"id":"ing_066"},{"nome":"COMINHO","un":"KG","p":29.9,"fc":1.0,"fk":1.0,"id":"ing_067"},{"nome":"CANELA EM PO","un":"KG","p":49.9,"fc":1.0,"fk":1.0,"id":"ing_068"},{"nome":"NUEZ MOSCADA","un":"KG","p":129.9,"fc":1.0,"fk":1.0,"id":"ing_069"},{"nome":"PAPRICA DEFUMADA","un":"KG","p":39.9,"fc":1.0,"fk":1.0,"id":"ing_070"},{"nome":"MOSTARDA DIJON","un":"KG","p":39.9,"fc":1.0,"fk":1.0,"id":"ing_071"},{"nome":"MOLHO INGLES","un":"L","p":39.9,"fc":1.0,"fk":1.0,"id":"ing_072"},{"nome":"EXTRATO DE TOMATE","un":"KG","p":18.9,"fc":1.0,"fk":0.85,"id":"ing_073"},{"nome":"PASSATA DE TOMATE","un":"KG","p":14.9,"fc":1.0,"fk":0.9,"id":"ing_074"},{"nome":"MEL","un":"KG","p":48.9,"fc":1.0,"fk":1.0,"id":"ing_075"},{"nome":"A\u00c7UCAR REFINADO","un":"KG","p":5.9,"fc":1.0,"fk":1.0,"id":"ing_076"},{"nome":"A\u00c7UCAR MASCAVO","un":"KG","p":18.9,"fc":1.0,"fk":1.0,"id":"ing_077"},{"nome":"DOCE DE LEITE","un":"KG","p":28.9,"fc":1.0,"fk":1.0,"id":"ing_078"},{"nome":"FERMENTO EM PO","un":"KG","p":22.9,"fc":1.0,"fk":1.0,"id":"ing_079"},{"nome":"GELATINA SEM SABOR","un":"KG","p":79.9,"fc":1.0,"fk":1.0,"id":"ing_080"},{"nome":"TOMATE ITALIANO","un":"KG","p":6.9,"fc":1.09,"fk":0.7,"id":"ing_081"},{"nome":"TOMATE FRESCO","un":"KG","p":5.9,"fc":1.09,"fk":1.0,"id":"ing_082"},{"nome":"TOMATE CEREJA","un":"KG","p":14.9,"fc":1.0,"fk":1.0,"id":"ing_083"},{"nome":"BERINJELA","un":"KG","p":6.9,"fc":1.05,"fk":0.85,"id":"ing_084"},{"nome":"ABOBRINHA","un":"KG","p":6.9,"fc":1.1,"fk":0.76,"id":"ing_085"},{"nome":"BATATA INGLESA","un":"KG","p":5.9,"fc":1.09,"fk":0.75,"id":"ing_086"},{"nome":"BATATA DOCE","un":"KG","p":5.9,"fc":1.16,"fk":0.8,"id":"ing_087"},{"nome":"BATATA BOLINHA","un":"KG","p":4.9,"fc":1.0,"fk":0.85,"id":"ing_088"},{"nome":"PIMENTAO VERMELHO","un":"KG","p":8.9,"fc":1.15,"fk":0.7,"id":"ing_089"},{"nome":"PIMENTAO VERDE","un":"KG","p":5.9,"fc":1.15,"fk":0.4,"id":"ing_090"},{"nome":"ESPINAFRE","un":"KG","p":8.9,"fc":1.4,"fk":0.3,"id":"ing_091"},{"nome":"RUCULA","un":"KG","p":28.9,"fc":1.1,"fk":1.0,"id":"ing_092"},{"nome":"BROTOS DECORATIVOS","un":"KG","p":99.9,"fc":1.0,"fk":1.0,"id":"ing_093"},{"nome":"AZEITONAS PRETAS","un":"KG","p":48.9,"fc":1.0,"fk":1.0,"id":"ing_094"},{"nome":"ALCAPARRAS","un":"KG","p":99.9,"fc":1.0,"fk":1.0,"id":"ing_095"},{"nome":"COGUMELOS PARIS","un":"KG","p":29.9,"fc":1.05,"fk":0.9,"id":"ing_096"},{"nome":"COGUMELO FUNGHI SECO","un":"KG","p":219.9,"fc":1.0,"fk":3.0,"id":"ing_097"},{"nome":"COGUMELO SHITAKE","un":"KG","p":69.9,"fc":1.05,"fk":0.85,"id":"ing_098"},{"nome":"ASPARGO","un":"KG","p":49.9,"fc":1.2,"fk":0.75,"id":"ing_099"},{"nome":"LIMAO TAHITI","un":"KG","p":6.9,"fc":1.0,"fk":1.0,"id":"ing_100"},{"nome":"LIMAO SICILIANO","un":"KG","p":14.9,"fc":1.0,"fk":1.0,"id":"ing_101"},{"nome":"BANANA","un":"KG","p":5.9,"fc":1.66,"fk":0.7,"id":"ing_102"},{"nome":"MORANGO","un":"KG","p":22.9,"fc":1.05,"fk":0.95,"id":"ing_103"},{"nome":"ABACATE","un":"KG","p":8.9,"fc":1.7,"fk":1.0,"id":"ing_104"},{"nome":"MANGA","un":"KG","p":8.9,"fc":1.3,"fk":0.75,"id":"ing_105"},{"nome":"MARACUJA","un":"KG","p":10.9,"fc":1.3,"fk":0.4,"id":"ing_106"},{"nome":"UVA","un":"KG","p":15.9,"fc":1.05,"fk":1.0,"id":"ing_107"},{"nome":"FIGO FRESCO","un":"KG","p":34.9,"fc":1.0,"fk":1.0,"id":"ing_108"},{"nome":"DAMASCO SECO","un":"KG","p":89.9,"fc":1.0,"fk":1.0,"id":"ing_109"},{"nome":"CHOCOLATE MEIO AMARGO 70","un":"KG","p":89.9,"fc":1.0,"fk":1.0,"id":"ing_110"},{"nome":"CACAU EM PO","un":"KG","p":49.9,"fc":1.0,"fk":1.0,"id":"ing_111"},{"nome":"PASTA DE AMENDOIM","un":"KG","p":44.9,"fc":1.0,"fk":1.0,"id":"ing_112"},{"nome":"CASTANHA DE CAJU","un":"KG","p":99.9,"fc":1.0,"fk":1.0,"id":"ing_113"},{"nome":"NOZES","un":"KG","p":84.9,"fc":1.0,"fk":1.0,"id":"ing_114"},{"nome":"QUINOA BRANCA","un":"KG","p":44.9,"fc":1.0,"fk":2.7,"id":"ing_115"},{"nome":"AGUA","un":"L","p":0.0,"fc":1.0,"fk":1.0,"id":"ing_116"},{"nome":"CALDO DE FRANGO","un":"L","p":8.9,"fc":1.0,"fk":1.0,"id":"ing_117"},{"nome":"CALDO DE LEGUMES","un":"L","p":6.9,"fc":1.0,"fk":1.0,"id":"ing_118"},{"nome":"LEITE DE COCO","un":"L","p":16.9,"fc":1.0,"fk":1.0,"id":"ing_119"},{"nome":"MASSA FILO","un":"KG","p":49.9,"fc":1.0,"fk":1.0,"id":"ing_120"},{"nome":"LEMON PEPPER","un":"KG","p":39.9,"fc":1.0,"fk":1.0,"id":"ing_121"},{"nome":"SOUR CREAM","un":"KG","p":34.9,"fc":1.0,"fk":1.0,"id":"ing_122"}];
const SEED_FIC=[{"nome":"FUNDO BRANCO DE FRANGO","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"CARCACA DE FRANGO","qtdLiquida":1.5},{"tipo":"ing","nomeRef":"CEBOLA","qtdLiquida":0.2},{"tipo":"ing","nomeRef":"CENOURA","qtdLiquida":0.15},{"tipo":"ing","nomeRef":"SALSAO","qtdLiquida":0.1},{"tipo":"ing","nomeRef":"ALHO PORO","qtdLiquida":0.1},{"tipo":"ing","nomeRef":"LOURO","qtdLiquida":0.002},{"tipo":"ing","nomeRef":"TOMILHO FRESCO","qtdLiquida":0.005},{"tipo":"ing","nomeRef":"SALSINHA","qtdLiquida":0.01},{"tipo":"ing","nomeRef":"PIMENTA DO REINO PRETA","qtdLiquida":0.003},{"tipo":"ing","nomeRef":"AGUA","qtdLiquida":3.0}],"modoPreparo":"","id":"fic_000"},{"nome":"FUNDO MARROM (FUNDO ESCURO)","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"OSSO PARA FUNDO","qtdLiquida":2.0},{"tipo":"ing","nomeRef":"CEBOLA","qtdLiquida":0.25},{"tipo":"ing","nomeRef":"CENOURA","qtdLiquida":0.2},{"tipo":"ing","nomeRef":"SALSAO","qtdLiquida":0.15},{"tipo":"ing","nomeRef":"EXTRATO DE TOMATE","qtdLiquida":0.05},{"tipo":"ing","nomeRef":"VINHO TINTO SECO","qtdLiquida":0.3},{"tipo":"ing","nomeRef":"LOURO","qtdLiquida":0.003},{"tipo":"ing","nomeRef":"TOMILHO FRESCO","qtdLiquida":0.006},{"tipo":"ing","nomeRef":"PIMENTA DO REINO PRETA","qtdLiquida":0.004},{"tipo":"ing","nomeRef":"OLEO DE GIRASSOL","qtdLiquida":0.04},{"tipo":"ing","nomeRef":"AGUA","qtdLiquida":4.0}],"modoPreparo":"","id":"fic_001"},{"nome":"MOLHO BECHAMEL","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"MANTEIGA SEM SAL","qtdLiquida":0.06},{"tipo":"ing","nomeRef":"FARINHA DE TRIGO","qtdLiquida":0.06},{"tipo":"ing","nomeRef":"LEITE INTEGRAL","qtdLiquida":1.0},{"tipo":"ing","nomeRef":"CEBOLA","qtdLiquida":0.05},{"tipo":"ing","nomeRef":"LOURO","qtdLiquida":0.001},{"tipo":"ing","nomeRef":"NUEZ MOSCADA","qtdLiquida":0.002},{"tipo":"ing","nomeRef":"SAL REFINADO","qtdLiquida":0.005},{"tipo":"ing","nomeRef":"PIMENTA DO REINO BRANCA","qtdLiquida":0.001}],"modoPreparo":"","id":"fic_002"},{"nome":"MOLHO VELOUTE DE FRANGO","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"MANTEIGA SEM SAL","qtdLiquida":0.06},{"tipo":"ing","nomeRef":"FARINHA DE TRIGO","qtdLiquida":0.06},{"tipo":"ficha","nomeRef":"FUNDO BRANCO DE FRANGO","qtdLiquida":1.0},{"tipo":"ing","nomeRef":"SAL REFINADO","qtdLiquida":0.004},{"tipo":"ing","nomeRef":"PIMENTA DO REINO BRANCA","qtdLiquida":0.001}],"modoPreparo":"","id":"fic_003"},{"nome":"DEMI-GLACE (SEMI-GLACE)","margemSeguranca":0.1,"itens":[{"tipo":"ficha","nomeRef":"FUNDO MARROM (FUNDO ESCURO)","qtdLiquida":2.0},{"tipo":"ing","nomeRef":"VINHO TINTO SECO","qtdLiquida":0.2},{"tipo":"ing","nomeRef":"EXTRATO DE TOMATE","qtdLiquida":0.02},{"tipo":"ing","nomeRef":"TOMILHO FRESCO","qtdLiquida":0.003},{"tipo":"ing","nomeRef":"LOURO","qtdLiquida":0.001}],"modoPreparo":"","id":"fic_004"},{"nome":"MOLHO HOLLANDAISE","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"MANTEIGA SEM SAL","qtdLiquida":0.25},{"tipo":"ing","nomeRef":"OVOS","qtdLiquida":0.12},{"tipo":"ing","nomeRef":"VINAGRE DE VINHO BRANCO","qtdLiquida":0.03},{"tipo":"ing","nomeRef":"LIMAO SICILIANO","qtdLiquida":0.03},{"tipo":"ing","nomeRef":"PIMENTA DO REINO BRANCA","qtdLiquida":0.001},{"tipo":"ing","nomeRef":"SAL REFINADO","qtdLiquida":0.003}],"modoPreparo":"","id":"fic_005"},{"nome":"MOLHO B\u00c9ARNAISE","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"MANTEIGA SEM SAL","qtdLiquida":0.25},{"tipo":"ing","nomeRef":"OVOS","qtdLiquida":0.12},{"tipo":"ing","nomeRef":"VINAGRE DE VINHO BRANCO","qtdLiquida":0.04},{"tipo":"ing","nomeRef":"VINHO BRANCO SECO","qtdLiquida":0.04},{"tipo":"ing","nomeRef":"ESTRAGAO","qtdLiquida":0.01},{"tipo":"ing","nomeRef":"CEBOLETE","qtdLiquida":0.01},{"tipo":"ing","nomeRef":"PIMENTA DO REINO PRETA","qtdLiquida":0.002},{"tipo":"ing","nomeRef":"SAL REFINADO","qtdLiquida":0.003}],"modoPreparo":"","id":"fic_006"},{"nome":"MOLHO PESTO GENOVESE","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"MANJERICAO FRESCO","qtdLiquida":0.1},{"tipo":"ing","nomeRef":"AZEITE DE OLIVA EXTRA VIRGEM","qtdLiquida":0.15},{"tipo":"ing","nomeRef":"QUEIJO PARMESAO","qtdLiquida":0.05},{"tipo":"ing","nomeRef":"PINOLES","qtdLiquida":0.03},{"tipo":"ing","nomeRef":"ALHO","qtdLiquida":0.008},{"tipo":"ing","nomeRef":"SAL REFINADO","qtdLiquida":0.003}],"modoPreparo":"","id":"fic_007"},{"nome":"MOLHO BOLONHESA","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"CARNE MOIDA PATINHO","qtdLiquida":0.5},{"tipo":"ing","nomeRef":"PANCETTA","qtdLiquida":0.08},{"tipo":"ing","nomeRef":"CEBOLA","qtdLiquida":0.15},{"tipo":"ing","nomeRef":"CENOURA","qtdLiquida":0.1},{"tipo":"ing","nomeRef":"SALSAO","qtdLiquida":0.08},{"tipo":"ing","nomeRef":"ALHO","qtdLiquida":0.01},{"tipo":"ing","nomeRef":"VINHO TINTO SECO","qtdLiquida":0.15},{"tipo":"ing","nomeRef":"TOMATE PELADO LATA","qtdLiquida":0.4},{"tipo":"ing","nomeRef":"EXTRATO DE TOMATE","qtdLiquida":0.03},{"tipo":"ing","nomeRef":"LEITE INTEGRAL","qtdLiquida":0.1},{"tipo":"ing","nomeRef":"LOURO","qtdLiquida":0.002},{"tipo":"ing","nomeRef":"AZEITE DE OLIVA","qtdLiquida":0.03},{"tipo":"ing","nomeRef":"SAL REFINADO","qtdLiquida":0.006},{"tipo":"ing","nomeRef":"PIMENTA DO REINO PRETA","qtdLiquida":0.002}],"modoPreparo":"","id":"fic_008"},{"nome":"RISOTO BASE (SOFFRITTO E MANTECATURA)","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"ARROZ ARBORIO","qtdLiquida":0.4},{"tipo":"ing","nomeRef":"CEBOLA","qtdLiquida":0.1},{"tipo":"ing","nomeRef":"MANTEIGA SEM SAL","qtdLiquida":0.06},{"tipo":"ing","nomeRef":"VINHO BRANCO SECO","qtdLiquida":0.1},{"tipo":"ing","nomeRef":"QUEIJO PARMESAO","qtdLiquida":0.06},{"tipo":"ing","nomeRef":"CALDO DE FRANGO","qtdLiquida":1.2},{"tipo":"ing","nomeRef":"SAL REFINADO","qtdLiquida":0.005}],"modoPreparo":"","id":"fic_009"},{"nome":"RISOTO DE FUNGHI PORCINI","margemSeguranca":0.1,"itens":[{"tipo":"ficha","nomeRef":"RISOTO BASE (SOFFRITTO E MANTECATURA)","qtdLiquida":0.8},{"tipo":"ing","nomeRef":"COGUMELO FUNGHI SECO","qtdLiquida":0.04},{"tipo":"ing","nomeRef":"COGUMELO SHITAKE","qtdLiquida":0.15},{"tipo":"ing","nomeRef":"MANTEIGA SEM SAL","qtdLiquida":0.03},{"tipo":"ing","nomeRef":"TOMILHO FRESCO","qtdLiquida":0.003},{"tipo":"ing","nomeRef":"ALHO","qtdLiquida":0.005}],"modoPreparo":"","id":"fic_010"},{"nome":"ESPAGUETE COZIDO","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"ESPAGUETE GRANO DURO","qtdLiquida":0.5},{"tipo":"ing","nomeRef":"SAL REFINADO","qtdLiquida":0.015},{"tipo":"ing","nomeRef":"AGUA","qtdLiquida":3.0}],"modoPreparo":"","id":"fic_011"},{"nome":"MOLHO PESTO 440","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"MANJERICAO FRESCO","qtdLiquida":0.15},{"tipo":"ing","nomeRef":"AZEITE DE OLIVA EXTRA VIRGEM","qtdLiquida":0.135},{"tipo":"ing","nomeRef":"QUEIJO PARMESAO","qtdLiquida":0.05},{"tipo":"ing","nomeRef":"CASTANHA DE CAJU","qtdLiquida":0.03},{"tipo":"ing","nomeRef":"ALHO","qtdLiquida":0.003},{"tipo":"ing","nomeRef":"LIMAO TAHITI","qtdLiquida":0.03}],"modoPreparo":"","id":"fic_012"},{"nome":"POLENTA CREMOSA 440","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"FUBA MIMOSO","qtdLiquida":0.25},{"tipo":"ing","nomeRef":"AGUA","qtdLiquida":1.9},{"tipo":"ing","nomeRef":"MANTEIGA SEM SAL","qtdLiquida":0.04},{"tipo":"ing","nomeRef":"QUEIJO PARMESAO","qtdLiquida":0.04},{"tipo":"ing","nomeRef":"SAL REFINADO","qtdLiquida":0.006}],"modoPreparo":"","id":"fic_013"},{"nome":"FRANGO AO MOLHO CAIPIRA 440","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"SOBRECOXA DESOSSADA COM PELE","qtdLiquida":0.5},{"tipo":"ing","nomeRef":"CEBOLA","qtdLiquida":0.1},{"tipo":"ing","nomeRef":"ALHO","qtdLiquida":0.008},{"tipo":"ing","nomeRef":"PASSATA DE TOMATE","qtdLiquida":0.3},{"tipo":"ing","nomeRef":"A\u00c7UCAR REFINADO","qtdLiquida":0.015},{"tipo":"ing","nomeRef":"BANHA DE PORCO","qtdLiquida":0.012},{"tipo":"ing","nomeRef":"SALSINHA","qtdLiquida":0.015},{"tipo":"ing","nomeRef":"CEBOLINHA","qtdLiquida":0.01},{"tipo":"ing","nomeRef":"MANTEIGA SEM SAL","qtdLiquida":0.015}],"modoPreparo":"","id":"fic_014"},{"nome":"CARNE DE PANELA 440","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"MIOLO DA PALETA","qtdLiquida":0.5},{"tipo":"ing","nomeRef":"CEBOLA","qtdLiquida":0.12},{"tipo":"ing","nomeRef":"ALHO","qtdLiquida":0.015},{"tipo":"ing","nomeRef":"PASSATA DE TOMATE","qtdLiquida":0.35},{"tipo":"ing","nomeRef":"AGUA","qtdLiquida":0.4},{"tipo":"ing","nomeRef":"SALSAO","qtdLiquida":0.04},{"tipo":"ing","nomeRef":"SALSINHA","qtdLiquida":0.015},{"tipo":"ing","nomeRef":"CEBOLINHA","qtdLiquida":0.015}],"modoPreparo":"","id":"fic_015"},{"nome":"FRANGO ASSADO COM ERVAS (RITA LOBO)","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"FRANGO INTEIRO","qtdLiquida":1.2},{"tipo":"ing","nomeRef":"MANTEIGA SEM SAL","qtdLiquida":0.06},{"tipo":"ing","nomeRef":"ALHO","qtdLiquida":0.02},{"tipo":"ing","nomeRef":"TOMILHO FRESCO","qtdLiquida":0.008},{"tipo":"ing","nomeRef":"ALECRIM","qtdLiquida":0.008},{"tipo":"ing","nomeRef":"LIMAO SICILIANO","qtdLiquida":0.1},{"tipo":"ing","nomeRef":"SAL REFINADO","qtdLiquida":0.012},{"tipo":"ing","nomeRef":"PIMENTA DO REINO PRETA","qtdLiquida":0.003}],"modoPreparo":"","id":"fic_016"},{"nome":"BOEUF BOURGUIGNON (ESCOFFIER/JULIA CHILD)","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"COXAO MOLE","qtdLiquida":1.0},{"tipo":"ing","nomeRef":"BACON","qtdLiquida":0.15},{"tipo":"ing","nomeRef":"CEBOLA PEROLA","qtdLiquida":0.3},{"tipo":"ing","nomeRef":"COGUMELOS PARIS","qtdLiquida":0.3},{"tipo":"ing","nomeRef":"VINHO TINTO SECO","qtdLiquida":0.5},{"tipo":"ficha","nomeRef":"FUNDO MARROM (FUNDO ESCURO)","qtdLiquida":0.3},{"tipo":"ing","nomeRef":"EXTRATO DE TOMATE","qtdLiquida":0.02},{"tipo":"ing","nomeRef":"ALHO","qtdLiquida":0.02},{"tipo":"ing","nomeRef":"CENOURA","qtdLiquida":0.15},{"tipo":"ing","nomeRef":"CEBOLA","qtdLiquida":0.15},{"tipo":"ing","nomeRef":"FARINHA DE TRIGO","qtdLiquida":0.025},{"tipo":"ing","nomeRef":"LOURO","qtdLiquida":0.003},{"tipo":"ing","nomeRef":"TOMILHO FRESCO","qtdLiquida":0.005},{"tipo":"ing","nomeRef":"MANTEIGA SEM SAL","qtdLiquida":0.04},{"tipo":"ing","nomeRef":"OLEO DE GIRASSOL","qtdLiquida":0.03}],"modoPreparo":"","id":"fic_017"},{"nome":"SALM\u00c3O GRELHADO COM MANTEIGA DE ERVAS","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"SALMAO FRESCO","qtdLiquida":0.5},{"tipo":"ing","nomeRef":"MANTEIGA SEM SAL","qtdLiquida":0.06},{"tipo":"ing","nomeRef":"ESTRAGAO","qtdLiquida":0.005},{"tipo":"ing","nomeRef":"CEBOLETE","qtdLiquida":0.008},{"tipo":"ing","nomeRef":"LIMAO SICILIANO","qtdLiquida":0.05},{"tipo":"ing","nomeRef":"SAL REFINADO","qtdLiquida":0.005},{"tipo":"ing","nomeRef":"PIMENTA DO REINO BRANCA","qtdLiquida":0.001}],"modoPreparo":"","id":"fic_018"},{"nome":"CR\u00c8ME BR\u00dbL\u00c9E (ESCOFFIER)","margemSeguranca":0.1,"itens":[{"tipo":"ing","nomeRef":"CREME DE LEITE FRESCO","qtdLiquida":0.5},{"tipo":"ing","nomeRef":"OVOS","qtdLiquida":0.15},{"tipo":"ing","nomeRef":"A\u00c7UCAR REFINADO","qtdLiquida":0.06},{"tipo":"ing","nomeRef":"ACUCAR CRISTAL","qtdLiquida":0.04}],"modoPreparo":"","id":"fic_019"}];
const SEED_PRT=[{"nome":"FIL\u00c9 DE TIL\u00c1PIA COM ESPAGUETE AO PESTO","categoria":"440 Restaurante","porcao":1,"precoVenda":39.0,"componentes":[{"tipo":"ficha","nomeRef":"ESPAGUETE COZIDO","qtdGramas":150},{"tipo":"ficha","nomeRef":"MOLHO PESTO 440","qtdGramas":40},{"tipo":"ing","nomeRef":"FILE DE TILAPIA","qtdGramas":220},{"tipo":"ing","nomeRef":"TOMATE CEREJA","qtdGramas":60},{"tipo":"ing","nomeRef":"AZEITE DE OLIVA","qtdGramas":10},{"tipo":"ing","nomeRef":"BROTOS DECORATIVOS","qtdGramas":2}],"modoPreparo":"","id":"prt_000"},{"nome":"FRANGO MOLHO CAIPIRA C/ POLENTA","categoria":"440 Restaurante","porcao":1,"precoVenda":35.0,"componentes":[{"tipo":"ficha","nomeRef":"FRANGO AO MOLHO CAIPIRA 440","qtdGramas":220},{"tipo":"ficha","nomeRef":"POLENTA CREMOSA 440","qtdGramas":200},{"tipo":"ing","nomeRef":"RUCULA","qtdGramas":30},{"tipo":"ing","nomeRef":"AZEITE DE OLIVA","qtdGramas":8}],"modoPreparo":"","id":"prt_001"},{"nome":"PRATO BRASILEIRO 440","categoria":"440 Restaurante","porcao":1,"precoVenda":38.0,"componentes":[{"tipo":"ing","nomeRef":"ARROZ BRANCO","qtdGramas":95},{"tipo":"ing","nomeRef":"FEIJAO PRETO","qtdGramas":110},{"tipo":"ficha","nomeRef":"CARNE DE PANELA 440","qtdGramas":200},{"tipo":"ing","nomeRef":"FARINHA DE MANDIOCA","qtdGramas":20},{"tipo":"ing","nomeRef":"BATATA BOLINHA","qtdGramas":70},{"tipo":"ing","nomeRef":"TOMATE ITALIANO","qtdGramas":60},{"tipo":"ing","nomeRef":"BROTOS DECORATIVOS","qtdGramas":2}],"modoPreparo":"","id":"prt_002"},{"nome":"SALM\u00c3O GRELHADO COM RISOTO DE FUNGHI","categoria":"Cl\u00e1ssicos Zeste","porcao":1,"precoVenda":0.0,"componentes":[{"tipo":"ficha","nomeRef":"SALM\u00c3O GRELHADO COM MANTEIGA DE ERVAS","qtdGramas":180},{"tipo":"ficha","nomeRef":"RISOTO DE FUNGHI PORCINI","qtdGramas":200},{"tipo":"ing","nomeRef":"ASPARGO","qtdGramas":60},{"tipo":"ing","nomeRef":"BROTOS DECORATIVOS","qtdGramas":2}],"modoPreparo":"","id":"prt_003"},{"nome":"BOEUF BOURGUIGNON COM PUR\u00ca DE BATATA","categoria":"Cl\u00e1ssicos Zeste","porcao":1,"precoVenda":0.0,"componentes":[{"tipo":"ficha","nomeRef":"BOEUF BOURGUIGNON (ESCOFFIER/JULIA CHILD)","qtdGramas":200},{"tipo":"ing","nomeRef":"BATATA INGLESA","qtdGramas":200},{"tipo":"ing","nomeRef":"MANTEIGA SEM SAL","qtdGramas":30},{"tipo":"ing","nomeRef":"CREME DE LEITE FRESCO","qtdGramas":40},{"tipo":"ing","nomeRef":"SALSINHA","qtdGramas":5}],"modoPreparo":"","id":"prt_004"},{"nome":"CR\u00c8ME BR\u00dbL\u00c9E","categoria":"Cl\u00e1ssicos Zeste","porcao":1,"precoVenda":0.0,"componentes":[{"tipo":"ficha","nomeRef":"CR\u00c8ME BR\u00dbL\u00c9E (ESCOFFIER)","qtdGramas":150},{"tipo":"ing","nomeRef":"MORANGO","qtdGramas":30},{"tipo":"ing","nomeRef":"ACUCAR CRISTAL","qtdGramas":8}],"modoPreparo":"","id":"prt_005"}];

// ── ESTILOS ───────────────────────────────────────────────────────
const STYLE=`
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{--lima:#C5D943;--verde:#2D6E47;--azul:#2E7DD1;--coral:#E8614B;--preto:#111614;--cinzaF:#F0F0EA;--cinzaM:#DDDDD5;--cinzaE:#888882;--branco:#FFFFFF;--ff:'Barlow Condensed',sans-serif;--fb:'Barlow',sans-serif;--safe:env(safe-area-inset-bottom,0px)}
html,body,#root{height:100%;font-family:var(--fb)}body{background:var(--cinzaF);color:var(--preto);overflow-x:hidden}
input,select,textarea,button{font-family:var(--fb)}
input,select,textarea{font-size:16px;border:1.5px solid var(--cinzaM);border-radius:8px;padding:12px 13px;background:var(--branco);outline:none;width:100%;color:var(--preto);-webkit-appearance:none}
input:focus,select:focus{border-color:var(--azul);box-shadow:0 0 0 3px rgba(46,125,209,.12)}
button{cursor:pointer;border:none;background:none}
.ft-nav{background:var(--preto);display:flex;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.ft-nav::-webkit-scrollbar{display:none}
.ft-tab{padding:13px 16px;font-family:var(--ff);font-size:13px;font-weight:700;letter-spacing:.1em;color:#555;white-space:nowrap;position:relative;cursor:pointer;min-height:44px;display:flex;align-items:center}
.ft-tab.on{color:var(--lima)}.ft-tab.on::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--lima)}
.ft-card{background:var(--branco);border-radius:12px;box-shadow:0 1px 6px rgba(0,0,0,.07);overflow:hidden}
.ft-kpi{background:var(--preto);border-radius:12px;padding:14px 16px;border-left:4px solid var(--lima);flex:1 1 140px;min-width:130px}
.ft-kpi-l{font-family:var(--ff);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}
.ft-kpi-v{font-family:var(--ff);font-size:21px;font-weight:700;line-height:1}
.ft-row{padding:13px 15px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:background .1s;border-bottom:1px solid var(--cinzaF);min-height:56px}
.ft-row:hover{background:#F7F7F3}.ft-row:active{background:var(--cinzaF)}
.ft-tag{display:inline-block;padding:3px 8px;border-radius:4px;font-family:var(--ff);font-size:11px;font-weight:700;letter-spacing:.05em}
.ft-fab{position:fixed;bottom:calc(20px + var(--safe));right:16px;width:54px;height:54px;border-radius:50%;background:var(--lima);color:var(--preto);font-size:26px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(197,217,67,.45);z-index:150}
.ft-overlay{position:fixed;inset:0;background:rgba(17,22,20,.55);z-index:500;display:flex;align-items:flex-end;justify-content:center}
@media(min-width:600px){.ft-overlay{align-items:center;padding:20px}}
.ft-sheet{background:var(--branco);width:100%;max-height:94vh;overflow:auto;border-radius:18px 18px 0 0}
@media(min-width:600px){.ft-sheet{border-radius:14px;max-width:600px;max-height:90vh}}
.ft-shdr{position:sticky;top:0;background:var(--branco);z-index:1;padding:14px 18px 12px;border-bottom:1px solid var(--cinzaM);display:flex;align-items:center;justify-content:space-between}
.ft-close{width:36px;height:36px;border-radius:50%;background:var(--cinzaF);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--cinzaE)}
.ft-pc{padding:0 14px}
@media(min-width:600px){.ft-pc{padding:0 22px}}
.ft-page{padding-bottom:90px}
.ft-kr{display:flex;gap:9px;overflow-x:auto;padding:14px 14px 2px;scrollbar-width:none}
.ft-kr::-webkit-scrollbar{display:none}
@media(min-width:600px){.ft-kr{flex-wrap:wrap;padding:14px 22px 2px}}
.ft-fg{display:flex;flex-wrap:wrap;gap:12px}
.ft-fg>.ft-fld{flex:1 1 100%}.ft-fg>.ft-fld.h{flex:1 1 calc(50% - 6px)}
.ft-fld{display:flex;flex-direction:column;gap:5px}
.ft-flbl{font-size:12.5px;font-weight:700;color:var(--cinzaE);letter-spacing:.05em;text-transform:uppercase}
.ft-sh{display:flex;align-items:center;gap:8px;margin:18px 0 10px}
.ft-sh-bar{width:18px;height:3px;background:var(--lima);flex-shrink:0}
.ft-sh-txt{font-family:var(--ff);font-size:12.5px;font-weight:700;letter-spacing:.12em;color:var(--cinzaE);text-transform:uppercase}
.ft-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:8px;padding:11px 18px;font-size:14px;font-weight:600;min-height:44px;white-space:nowrap}
.ft-btn-p{background:var(--verde);color:var(--branco)}.ft-btn-g{background:transparent;color:var(--verde);border:1.5px solid var(--verde)}.ft-btn-d{background:var(--coral);color:var(--branco)}
.ft-search{display:flex;gap:8px;padding:12px 14px}
@media(min-width:600px){.ft-search{padding:12px 22px}}
.sync-ind{height:2px;background:var(--lima);position:fixed;top:0;left:0;z-index:999;width:100%}
`;

// ── ÁTOMOS UI ─────────────────────────────────────────────────────
function Modal({title,onClose,children}){useEffect(()=>{document.body.style.overflow='hidden';return()=>{document.body.style.overflow=''};},[]);return(<div className="ft-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="ft-sheet"><div style={{width:36,height:4,background:'var(--cinzaM)',borderRadius:2,margin:'10px auto 2px'}}/><div className="ft-shdr"><span style={{fontFamily:'var(--ff)',fontSize:20,fontWeight:700,color:'var(--verde)'}}>{title}</span><button className="ft-close" onClick={onClose}>✕</button></div><div style={{padding:'16px 18px 16px'}}>{children}</div></div></div>);}
const SH=({children})=><div className="ft-sh"><div className="ft-sh-bar"/><span className="ft-sh-txt">{children}</span></div>;


// ── ITEM PICKER (selecionar ingrediente ou ficha) ─────────────────
function ItemPicker({open,onClose,ingredientes,fichasCalc,allowFicha=true,onPick}){
  const[q,setQ]=useState('');const[tab,setTab]=useState('ing');
  if(!open)return null;
  const filtIng=ingredientes.filter(i=>!q||normNome(i.nome).includes(normNome(q)));
  const filtFic=allowFicha?fichasCalc.filter(f=>!q||normNome(f.nome).includes(normNome(q))):[];
  return(<Modal title="Adicionar Insumo" onClose={onClose}>
    <input placeholder="🔍 Buscar…" value={q} onChange={e=>setQ(e.target.value)} style={{marginBottom:10}}/>
    {allowFicha&&<div style={{display:'flex',gap:6,marginBottom:12}}>
      <button onClick={()=>setTab('ing')} style={{flex:1,padding:'9px 12px',borderRadius:8,border:`1.5px solid ${tab==='ing'?'var(--verde)':'var(--cinzaM)'}`,background:tab==='ing'?'var(--verde)':'transparent',color:tab==='ing'?'var(--branco)':'var(--cinzaE)',fontWeight:700,fontSize:13}}>🥬 Ingredientes</button>
      <button onClick={()=>setTab('fic')} style={{flex:1,padding:'9px 12px',borderRadius:8,border:`1.5px solid ${tab==='fic'?'var(--azul)':'var(--cinzaM)'}`,background:tab==='fic'?'var(--azul)':'transparent',color:tab==='fic'?'var(--branco)':'var(--cinzaE)',fontWeight:700,fontSize:13}}>📋 Sub-fichas</button>
    </div>}
    <div style={{maxHeight:300,overflowY:'auto'}}>
      {tab==='ing'&&filtIng.map(i=>(<div key={i.id} className="ft-row" style={{borderBottom:'1px solid var(--cinzaF)'}} onClick={()=>{onPick({tipo:'ing',nomeRef:i.nome});onClose();}}>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{i.nome}</div><div style={{fontSize:11,color:'var(--cinzaE)'}}>{i.un} · {brl(i.p)}/kg · FC {num(i.fc)}</div></div>
      </div>))}
      {tab==='fic'&&filtFic.map(f=>(<div key={f.id} className="ft-row" style={{borderBottom:'1px solid var(--cinzaF)'}} onClick={()=>{onPick({tipo:'ficha',nomeRef:f.nome});onClose();}}>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{f.nome}</div><div style={{fontSize:11,color:'var(--cinzaE)'}}>📋 {brl(f._custoPorKg)}/kg · {(f.itens||[]).length} insumos</div></div>
      </div>))}
    </div>
  </Modal>);
}

// ── FICHA FORM (criar/editar ficha) ───────────────────────────────
function FichaForm({open,ficha,onClose,onSave,onDelete,ingredientes,fichasCalc}){
  const[f,setF]=useState(()=>ficha?{...ficha}:{id:uid(),nome:'',margemSeguranca:0.1,itens:[],modoPreparo:'',_cliente:'zeste'});
  const[picker,setPicker]=useState(false);
  if(!open)return null;
  const addItem=(item)=>setF(p=>({...p,itens:[...p.itens,{...item,qtdLiquida:0.1}]}));
  const updItem=(i,k,v)=>setF(p=>({...p,itens:p.itens.map((it,j)=>j===i?{...it,[k]:v}:it)}));
  const remItem=(i)=>setF(p=>({...p,itens:p.itens.filter((_,j)=>j!==i)}));
  // Calcular custos em tempo real
  const calcItems=f.itens.map(it=>{
    const ref=it.tipo==='ficha'?fichasCalc.find(fc=>fc.nome===it.nomeRef):ingredientes.find(ig=>ig.nome===it.nomeRef);
    const precoKg=it.tipo==='ficha'?(ref?._custoPorKg||0):(ref?.p||0);
    const fc=it.tipo==='ficha'?1:(ref?.fc||1);
    const qtdLiq=Number(it.qtdLiquida)||0;
    const custo=qtdLiq*fc*precoKg;
    return{...it,precoKg,fc,custo};
  });
  const custoSomado=calcItems.reduce((s,i)=>s+i.custo,0);
  const custoTotal=custoSomado*(1+(Number(f.margemSeguranca)||0));
  return(<Modal title={ficha?'Editar Ficha':'Nova Ficha'} onClose={onClose}>
    <div className="ft-fg" style={{marginBottom:14}}>
      <div className="ft-fld"><label className="ft-flbl">Nome da ficha</label><input value={f.nome} onChange={e=>setF(p=>({...p,nome:e.target.value.toUpperCase()}))}/></div>
      <div className="ft-fld h"><label className="ft-flbl">Margem Segurança (%)</label><NumInput step="0.01" value={f.margemSeguranca} onChange={v=>setF(p=>({...p,margemSeguranca:v}))}/></div>
      <div className="ft-fld h"><label className="ft-flbl">Cliente</label><select value={f._cliente||'zeste'} onChange={e=>setF(p=>({...p,_cliente:e.target.value}))}><option value="zeste">Zeste (base)</option><option value="440">440 Restaurante</option></select></div>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <span style={{fontFamily:'var(--ff)',fontSize:13,fontWeight:700,color:'var(--cinzaE)',letterSpacing:'.08em'}}>INSUMOS & SUB-FICHAS</span>
      <button className="ft-btn ft-btn-p" style={{padding:'8px 14px',fontSize:12}} onClick={()=>setPicker(true)}>+ Adicionar</button>
    </div>
    {calcItems.map((it,i)=>(<div key={i} style={{background:'var(--cinzaF)',borderRadius:10,padding:'12px 14px',marginBottom:8,border:'1px solid var(--cinzaM)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
        <div><div style={{fontSize:14,fontWeight:700}}>{it.nomeRef}{it.ehVersaoCliente&&<span style={{marginLeft:6,fontSize:9,fontWeight:700,color:'#92400E',background:'#FEF3C7',padding:'1px 6px',borderRadius:6}}>SEU PREÇO</span>}</div><div style={{fontSize:11,color:'var(--cinzaE)'}}>{brl(it.precoKg)}/kg{it.ehVersaoCliente?` · base: ${brl(it.precoBase)}`:''}{it.fc>1?` · FC ${num(it.fc)}`:''}</div></div>
        <button onClick={()=>remItem(i)} style={{fontSize:18,color:'var(--coral)',minWidth:32,minHeight:32,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
      </div>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <div style={{flex:1}}><label className="ft-flbl">QTD LÍQUIDA (KG)</label><NumInput step="0.001" min="0" value={it.qtdLiquida} onChange={v=>updItem(i,'qtdLiquida',v)}/></div>
        <div style={{textAlign:'right'}}><div className="ft-flbl">CUSTO</div><div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:'var(--verde)'}}>{brl(it.custo)}</div></div>
      </div>
    </div>))}
    {f.itens.length===0&&<div style={{textAlign:'center',padding:20,color:'var(--cinzaE)',fontStyle:'italic'}}>Clique "+ Adicionar" para incluir insumos</div>}
    <div className="ft-fld" style={{marginTop:12}}><label className="ft-flbl">Modo de preparo (opcional)</label><textarea rows={3} value={f.modoPreparo||''} onChange={e=>setF(p=>({...p,modoPreparo:e.target.value}))} style={{resize:'vertical',minHeight:60}} placeholder="Descreva o passo a passo…"/></div>
    <div style={{background:'var(--preto)',borderRadius:10,padding:'14px 16px',marginTop:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div><div style={{fontSize:10,fontWeight:700,color:'var(--cinzaE)',letterSpacing:'.1em'}}>CUSTO TOTAL</div><div style={{fontFamily:'var(--ff)',fontSize:22,fontWeight:700,color:'var(--lima)'}}>{brl(custoTotal)}</div></div>
      <div style={{textAlign:'right'}}><div style={{fontSize:10,fontWeight:700,color:'var(--cinzaE)'}}>MARGEM {pct(f.margemSeguranca)}</div><div style={{fontSize:12,color:'var(--cinzaE)'}}>Base: {brl(custoSomado)}</div></div>
    </div>
    <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:16}}>
      {ficha&&<button className="ft-btn ft-btn-d" style={{padding:'10px 14px',fontSize:13}} onClick={()=>{onDelete(ficha.id);onClose();}}>🗑 Excluir</button>}
      <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
        <button className="ft-btn ft-btn-g" onClick={onClose}>Cancelar</button>
        <button className="ft-btn ft-btn-p" onClick={()=>{onSave({...f});onClose();}} disabled={!f.nome||f.itens.length===0}>💾 Salvar</button>
      </div>
    </div>
    <ItemPicker open={picker} onClose={()=>setPicker(false)} ingredientes={ingredientes} fichasCalc={fichasCalc} onPick={addItem}/>
  </Modal>);
}

// ── PRATO FORM (criar/editar prato) ───────────────────────────────
function PratoForm({open,prato,onClose,onSave,onDelete,ingredientes,fichasCalc}){
  const[p,setP]=useState(()=>prato?{...prato}:{id:uid(),nome:'',categoria:'Clássicos Zeste',porcao:1,precoVenda:0,componentes:[],modoPreparo:'',_cliente:'zeste'});
  const[picker,setPicker]=useState(false);
  if(!open)return null;
  const addComp=(item)=>setP(pr=>({...pr,componentes:[...pr.componentes,{...item,qtdGramas:100}]}));
  const updComp=(i,k,v)=>setP(pr=>({...pr,componentes:pr.componentes.map((c,j)=>j===i?{...c,[k]:v}:c)}));
  const remComp=(i)=>setP(pr=>({...pr,componentes:pr.componentes.filter((_,j)=>j!==i)}));
  const calcComps=p.componentes.map(c=>{
    const ref=c.tipo==='ficha'?fichasCalc.find(f=>f.nome===c.nomeRef):ingredientes.find(ig=>ig.nome===c.nomeRef);
    const custoPorKg=c.tipo==='ficha'?(ref?._custoPorKg||0):(ref?.p||0);
    const fc=c.tipo==='ficha'?1:(ref?.fc||1);
    const qtdKg=(Number(c.qtdGramas)||0)/1000;
    const custo=qtdKg*fc*custoPorKg;
    return{...c,custoPorKg,fc,custo};
  });
  const custoTotal=calcComps.reduce((s,c)=>s+c.custo,0);
  const preco=Number(p.precoVenda)||0;
  const cmv=preco>0?custoTotal/preco:0;
  const lucro=preco-custoTotal;
  return(<Modal title={prato?'Editar Prato':'Novo Prato'} onClose={onClose}>
    <div className="ft-fg" style={{marginBottom:14}}>
      <div className="ft-fld"><label className="ft-flbl">Nome do prato</label><input value={p.nome} onChange={e=>setP(pr=>({...pr,nome:e.target.value.toUpperCase()}))}/></div>
      <div className="ft-fld h"><label className="ft-flbl">Categoria</label><input value={p.categoria} onChange={e=>setP(pr=>({...pr,categoria:e.target.value}))}/></div>
      <div className="ft-fld h"><label className="ft-flbl">Porções</label><input type="number" inputMode="numeric" min="1" value={p.porcao} onChange={e=>setP(pr=>({...pr,porcao:+e.target.value}))}/></div>
      <div className="ft-fld"><label className="ft-flbl">Preço de venda (R$)</label><NumInput step="0.01" min="0" value={p.precoVenda} onChange={v=>setP(pr=>({...pr,precoVenda:v}))}/></div>
      <div className="ft-fld"><label className="ft-flbl">Foto do prato empratado (link)</label><input value={p.foto||''} onChange={e=>setP(pr=>({...pr,foto:e.target.value}))} placeholder="Cole o link da foto (Drive, Instagram, etc)"/></div>
    </div>
    {p.foto&&<div style={{marginBottom:14,textAlign:'center'}}><img src={p.foto} alt="" style={{maxWidth:'100%',maxHeight:180,borderRadius:10,objectFit:'cover'}} onError={e=>{e.target.style.display='none';}}/></div>}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <span style={{fontFamily:'var(--ff)',fontSize:13,fontWeight:700,color:'var(--cinzaE)',letterSpacing:'.08em'}}>COMPONENTES (POR PORÇÃO)</span>
      <button className="ft-btn ft-btn-p" style={{padding:'8px 14px',fontSize:12}} onClick={()=>setPicker(true)}>+ Adicionar</button>
    </div>
    {calcComps.map((c,i)=>(<div key={i} style={{background:'var(--cinzaF)',borderRadius:10,padding:'12px 14px',marginBottom:8,border:'1px solid var(--cinzaM)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
        <div><div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:14,fontWeight:700}}>{c.nomeRef}</span>{c.tipo==='ficha'&&<span className="ft-tag" style={{background:'#FFFBEB',color:'#92400E',fontSize:9}}>FICHA</span>}</div><div style={{fontSize:11,color:'var(--cinzaE)'}}>{brl(c.custoPorKg)}/kg{c.ehVersaoCliente?` · base: ${brl(c.precoBase)}`:''}{c.fc>1?` · FC ${num(c.fc)}`:''}</div></div>
        <button onClick={()=>remComp(i)} style={{fontSize:18,color:'var(--coral)',minWidth:32,minHeight:32,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
      </div>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <div style={{flex:1}}><label className="ft-flbl">QUANTIDADE (KG)</label><NumInput step="0.001" min="0" value={(Number(c.qtdGramas)||0)/1000} onChange={v=>updComp(i,'qtdGramas',Math.round((v||0)*1000))}/></div>
        <div style={{textAlign:'right'}}><div className="ft-flbl">CUSTO</div><div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:'var(--verde)'}}>{brl(c.custo)}</div></div>
      </div>
    </div>))}
    {p.componentes.length===0&&<div style={{textAlign:'center',padding:20,color:'var(--cinzaE)',fontStyle:'italic'}}>Clique "+ Adicionar" para incluir componentes</div>}
    <div className="ft-fld" style={{marginTop:12}}><label className="ft-flbl">Empratamento / modo (opcional)</label><textarea rows={2} value={p.modoPreparo||''} onChange={e=>setP(pr=>({...pr,modoPreparo:e.target.value}))} style={{resize:'vertical',minHeight:50}} placeholder="1. Empratar…"/></div>
    <div style={{background:'var(--preto)',borderRadius:10,padding:'14px 16px',marginTop:14,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
      <div><div style={{fontSize:10,fontWeight:700,color:'var(--cinzaE)'}}>CUSTO</div><div style={{fontFamily:'var(--ff)',fontSize:18,fontWeight:700,color:'var(--coral)'}}>{brl(custoTotal)}</div></div>
      <div><div style={{fontSize:10,fontWeight:700,color:'var(--cinzaE)'}}>VENDA</div><div style={{fontFamily:'var(--ff)',fontSize:18,fontWeight:700,color:'var(--lima)'}}>{brl(preco)}</div></div>
      <div><div style={{fontSize:10,fontWeight:700,color:'var(--cinzaE)'}}>LUCRO</div><div style={{fontFamily:'var(--ff)',fontSize:18,fontWeight:700,color:lucro>=0?'var(--lima)':'var(--coral)'}}>{brl(lucro)}</div></div>
      <div><div style={{fontSize:10,fontWeight:700,color:'var(--cinzaE)'}}>CMV</div><div style={{fontFamily:'var(--ff)',fontSize:18,fontWeight:700,color:cmvColor(cmv)}}>{pct(cmv)}</div></div>
    </div>
    <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:16}}>
      {prato&&<button className="ft-btn ft-btn-d" style={{padding:'10px 14px',fontSize:13}} onClick={()=>{onDelete(prato.id);onClose();}}>🗑 Excluir</button>}
      <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
        <button className="ft-btn ft-btn-g" onClick={onClose}>Cancelar</button>
        <button className="ft-btn ft-btn-p" onClick={()=>{onSave({...p});onClose();}} disabled={!p.nome||p.componentes.length===0}>💾 Salvar</button>
      </div>
    </div>
    <ItemPicker open={picker} onClose={()=>setPicker(false)} ingredientes={ingredientes} fichasCalc={fichasCalc} onPick={addComp}/>
  </Modal>);
}

// ── INGREDIENTES TAB ──────────────────────────────────────────────
function TabIngredientes({ingredientes,onSave,onDelete,clienteFilter}){
  const[q,setQ]=useState('');const[edit,setEdit]=useState(null);
  const filtered=ingredientes.filter(i=>(!q||normNome(i.nome).includes(normNome(q)))&&(!clienteFilter||i._cliente===clienteFilter||i._cliente==='zeste'||!i._cliente));
  return(<div className="ft-page">
    <div className="ft-search"><input placeholder="🔍 Buscar ingrediente…" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}}/><button className="ft-btn ft-btn-p" style={{padding:'10px 14px',fontSize:13}} onClick={()=>setEdit({id:uid(),nome:'',un:'KG',p:0,fc:1,fk:1})}>+ Novo</button></div>
    <div className="ft-pc"><div className="ft-card">
      {filtered.length===0&&<div style={{padding:32,textAlign:'center',color:'var(--cinzaE)',fontStyle:'italic'}}>Nenhum ingrediente encontrado</div>}
      {filtered.map(i=>(<div key={i.id} className="ft-row" onClick={()=>setEdit({...i})}>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.nome}</div><div style={{fontSize:11,color:'var(--cinzaE)',marginTop:2}}>{i.un} · FC {num(i.fc)} · FK {num(i.fk)}</div></div>
        <div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:'var(--verde)',flexShrink:0}}>{brl(i.p)}</div>
      </div>))}
    </div></div>
    {edit&&<Modal title={edit.nome?'Editar Ingrediente':'Novo Ingrediente'} onClose={()=>setEdit(null)}>
      <div className="ft-fg">
        <div className="ft-fld"><label className="ft-flbl">Nome</label><input value={edit.nome} onChange={e=>setEdit(f=>({...f,nome:e.target.value.toUpperCase()}))}/></div>
        <div className="ft-fld h"><label className="ft-flbl">Unidade</label><select value={edit.un} onChange={e=>setEdit(f=>({...f,un:e.target.value}))}><option>KG</option><option>L</option><option>UN</option></select></div>
        <div className="ft-fld h"><label className="ft-flbl">Preço/KG (R$)</label><NumInput step="0.01" value={edit.p} onChange={v=>setEdit(f=>({...f,p:v}))}/></div>
        <div className="ft-fld h"><label className="ft-flbl">Fator Correção</label><NumInput step="0.01" value={edit.fc} onChange={v=>setEdit(f=>({...f,fc:v}))}/></div>
        <div className="ft-fld h"><label className="ft-flbl">Fator Cocção</label><NumInput step="0.01" value={edit.fk} onChange={v=>setEdit(f=>({...f,fk:v}))}/></div>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
        {edit.nome&&<button className="ft-btn ft-btn-d" style={{padding:'10px 14px',fontSize:13}} onClick={()=>{onDelete(edit.id);setEdit(null);}}>🗑</button>}
        <button className="ft-btn ft-btn-g" onClick={()=>setEdit(null)}>Cancelar</button>
        <button className="ft-btn ft-btn-p" onClick={()=>{onSave(edit);setEdit(null);}}>Salvar</button>
      </div>
    </Modal>}
  </div>);
}

// ── FICHAS TAB ────────────────────────────────────────────────────
function TabFichas({fichasCalc,ingredientes,fichasRaw,onSave,onDelete,clienteFilter}){
  const[q,setQ]=useState('');const[detail,setDetail]=useState(null);const[editForm,setEditForm]=useState(null);
  const filtered=fichasCalc.filter(f=>(!q||normNome(f.nome).includes(normNome(q)))&&(!clienteFilter||f._cliente===clienteFilter));
  return(<div className="ft-page">
    <div className="ft-search"><input placeholder="🔍 Buscar ficha…" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}}/><button className="ft-btn ft-btn-p" style={{padding:'10px 14px',fontSize:13}} onClick={()=>setEditForm({})}>+ Nova</button></div>
    <div className="ft-pc"><div className="ft-card">
      {filtered.length===0&&<div style={{padding:32,textAlign:'center',color:'var(--cinzaE)',fontStyle:'italic'}}>Nenhuma ficha encontrada</div>}
      {filtered.map(f=>(<div key={f.id} className="ft-row" onClick={()=>setDetail(f)}>
        <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.nome}</div>
          <div style={{display:'flex',gap:6,marginTop:3,flexWrap:'wrap',alignItems:'center'}}>
            <span style={{fontSize:11,color:'var(--cinzaE)'}}>{(f.itens||[]).length} itens</span>
            <span style={{fontSize:11,color:'var(--cinzaE)'}}>·</span>
            <span style={{fontSize:11,color:'var(--cinzaE)'}}>Peso final: {num(f.pesoFinal)}kg</span>
          </div>
        </div>
        <div style={{textAlign:'right',flexShrink:0}}>
          <div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700,color:'var(--verde)'}}>{brl(f.custoTotal)}</div>
          <div style={{fontSize:10,color:'var(--cinzaE)'}}>{brl(f._custoPorKg)}/kg</div>
        </div>
      </div>))}
    </div></div>
    {detail&&<Modal title={detail.nome} onClose={()=>setDetail(null)}>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
        <div className="ft-kpi" style={{borderColor:'var(--lima)'}}><div className="ft-kpi-l" style={{color:'var(--lima)'}}>Custo Total</div><div className="ft-kpi-v" style={{color:'var(--lima)'}}>{brl(detail.custoTotal)}</div></div>
        <div className="ft-kpi" style={{borderColor:'var(--azul)'}}><div className="ft-kpi-l" style={{color:'var(--azul)'}}>Custo/kg</div><div className="ft-kpi-v" style={{color:'var(--azul)'}}>{brl(detail._custoPorKg)}</div></div>
        <div className="ft-kpi" style={{borderColor:'var(--cinzaE)'}}><div className="ft-kpi-l" style={{color:'var(--cinzaE)'}}>Peso Final</div><div className="ft-kpi-v" style={{color:'var(--branco)'}}>{num(detail.pesoFinal)}kg</div></div>
      </div>
      <SH>Composição</SH>
      <div className="ft-card">
        {(detail.itens||[]).map((it,i)=>(<div key={i} style={{padding:'10px 14px',borderBottom:i<detail.itens.length-1?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div style={{fontSize:13,fontWeight:600}}>{it.nomeRef}</div><div style={{fontSize:11,color:'var(--cinzaE)'}}>{it.tipo==='ficha'?'📋 Sub-receita':'🥬 Ingrediente'} · {num(it.qtdLiquida||0,3)}kg líq.{it.fc>1?` · FC ${num(it.fc)}`:''}</div></div>
          <div style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:it.erro?'var(--coral)':'var(--verde)',flexShrink:0}}>{it.erro?'⚠️':brl(it.custo)}</div>
        </div>))}
      </div>
      {detail.margemSeguranca>0&&<div style={{marginTop:10,fontSize:12,color:'var(--cinzaE)'}}>Margem de segurança: {pct(detail.margemSeguranca)}</div>}
      {detail._ultimaEdicao&&<div style={{fontSize:11,color:'var(--cinzaE)',marginTop:10}}>Última edição: {detail._ultimaEdicao} em {detail._ultimaEdicaoEm?new Date(detail._ultimaEdicaoEm).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''}</div>}
      <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
        <button className="ft-btn ft-btn-d" style={{padding:'10px 14px',fontSize:13}} onClick={()=>{onDelete(detail.id);setDetail(null);}}>🗑 Excluir</button>
        <button className="ft-btn ft-btn-g" style={{padding:'10px 14px',fontSize:13}} onClick={()=>setHistItem(detail)}>📜 Histórico</button>
        <button className="ft-btn ft-btn-p" style={{marginLeft:'auto',padding:'10px 14px',fontSize:13}} onClick={()=>{setEditForm(fichasRaw.find(f=>f.id===detail.id)||detail);setDetail(null);}}>✏️ Editar</button>
      </div>
    </Modal>}
    {editForm&&<FichaForm open={true} ficha={editForm.id?editForm:null} onClose={()=>setEditForm(null)} onSave={onSave} onDelete={onDelete} ingredientes={ingredientes} fichasCalc={fichasCalc}/>}
  </div>);
}

// ── PRATOS TAB ────────────────────────────────────────────────────
function TabPratos({pratosCalc,ingredientes,fichasCalc,onSave,onDelete,clienteFilter}){
  const[q,setQ]=useState('');const[detail,setDetail]=useState(null);const[editForm,setEditForm]=useState(null);const[fichaDet,setFichaDet]=useState(null);
  const filtered=pratosCalc.filter(p=>(!q||normNome(p.nome).includes(normNome(q)))&&(!clienteFilter||p._cliente===clienteFilter));
  const categorias=[...new Set(filtered.map(p=>p.categoria||'Sem categoria'))];
  return(<div className="ft-page">
    <div className="ft-search"><input placeholder="🔍 Buscar prato…" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}}/><button className="ft-btn ft-btn-p" style={{padding:'10px 14px',fontSize:13}} onClick={()=>setEditForm({})}>+ Novo</button></div>
    <div className="ft-pc">
      {categorias.map(cat=>{const pratos=filtered.filter(p=>(p.categoria||'Sem categoria')===cat);return(<div key={cat}>
        <SH>{cat}</SH>
        <div className="ft-card" style={{marginBottom:16}}>
          {pratos.map((p,i)=>{const cmvC=cmvColor(p.cmv);return(<div key={p.id} className="ft-row" onClick={()=>setDetail(p)} style={{borderLeft:`4px solid ${cmvC}`}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700}}>{p.nome}</div>
              <div style={{display:'flex',gap:6,marginTop:3,flexWrap:'wrap',alignItems:'center'}}>
                <span style={{fontSize:11,color:'var(--cinzaE)'}}>{(p.componentes||[]).length} componentes</span>
                {p.precoVenda>0&&<span style={{fontSize:11,color:'var(--cinzaE)'}}>· Venda {brl(p.precoVenda)}</span>}
              </div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:700,color:'var(--coral)'}}>{brl(p.custoTotal)}</div>
              {p.precoVenda>0&&<div style={{fontSize:11,fontWeight:700,color:cmvC}}>CMV {pct(p.cmv)}</div>}
            </div>
          </div>);})}
        </div>
      </div>);})}
    </div>
    {detail&&<Modal title={detail.nome} onClose={()=>setDetail(null)}>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
        <div className="ft-kpi" style={{borderColor:'var(--coral)'}}><div className="ft-kpi-l" style={{color:'var(--coral)'}}>Custo</div><div className="ft-kpi-v" style={{color:'var(--coral)'}}>{brl(detail.custoTotal)}</div></div>
        {detail.precoVenda>0&&<><div className="ft-kpi" style={{borderColor:'var(--lima)'}}><div className="ft-kpi-l" style={{color:'var(--lima)'}}>Venda</div><div className="ft-kpi-v" style={{color:'var(--lima)'}}>{brl(detail.precoVenda)}</div></div>
        <div className="ft-kpi" style={{borderColor:cmvColor(detail.cmv)}}><div className="ft-kpi-l" style={{color:cmvColor(detail.cmv)}}>CMV</div><div className="ft-kpi-v" style={{color:cmvColor(detail.cmv)}}>{pct(detail.cmv)} — {cmvLabel(detail.cmv)}</div></div>
        <div className="ft-kpi" style={{borderColor:'var(--azul)'}}><div className="ft-kpi-l" style={{color:'var(--azul)'}}>Margem</div><div className="ft-kpi-v" style={{color:'var(--azul)'}}>{brl(detail.precoVenda-detail.custoTotal)}</div></div></>}
      </div>
      <SH>Componentes</SH>
      <div className="ft-card">
        {(detail.comps||[]).map((c,i)=>{const ehFicha=c.tipo==='ficha';const fichaObj=ehFicha?fichasCalc.find(f=>f.nome===c.nomeRef):null;return(<div key={i} onClick={ehFicha&&fichaObj?()=>setFichaDet(fichaObj):undefined} style={{padding:'10px 14px',borderBottom:i<detail.comps.length-1?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:ehFicha&&fichaObj?'pointer':'default',background:ehFicha&&fichaObj?'#FFFDF5':'transparent'}}>
          <div><div style={{fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:5}}>{c.nomeRef}{ehFicha&&fichaObj&&<span style={{color:'var(--azul)',fontSize:12}}>↗</span>}</div><div style={{fontSize:11,color:'var(--cinzaE)'}}>{ehFicha?'📋 Ficha':'🥬 Ingrediente'} · {num((Number(c.qtdGramas)||0)/1000,3)}kg{ehFicha&&fichaObj?' · toque para ver':''}</div></div>
          <div style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:c.erro?'var(--coral)':'var(--verde)',flexShrink:0}}>{c.erro?'⚠️':brl(c.custo)}</div>
        </div>);})}
      </div>
      {detail.precoVenda>0&&<div style={{marginTop:14,background:cmvColor(detail.cmv)+'18',borderLeft:`3px solid ${cmvColor(detail.cmv)}`,borderRadius:6,padding:'10px 12px',fontSize:13,color:cmvColor(detail.cmv),fontWeight:600}}>
        CMV {pct(detail.cmv)} — {cmvLabel(detail.cmv)} · Lucro bruto de {brl(detail.precoVenda-detail.custoTotal)} por porção
      </div>}
      {detail._ultimaEdicao&&<div style={{fontSize:11,color:'var(--cinzaE)',marginTop:10}}>Última edição: {detail._ultimaEdicao} em {detail._ultimaEdicaoEm?new Date(detail._ultimaEdicaoEm).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''}</div>}
      <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
        <button className="ft-btn ft-btn-d" style={{padding:'10px 14px',fontSize:13}} onClick={()=>{onDelete(detail.id);setDetail(null);}}>🗑 Excluir</button>
        <button className="ft-btn ft-btn-g" style={{padding:'10px 14px',fontSize:13}} onClick={()=>setHistItem(detail)}>📜 Histórico</button>
        <button className="ft-btn ft-btn-p" style={{marginLeft:'auto',padding:'10px 14px',fontSize:13}} onClick={()=>{setEditForm(pratosCalc.find(p=>p.id===detail.id)||detail);setDetail(null);}}>✏️ Editar</button>
      </div>
    </Modal>}
    {editForm&&<PratoForm open={true} prato={editForm.id?editForm:null} onClose={()=>setEditForm(null)} onSave={onSave} onDelete={onDelete} ingredientes={ingredientes} fichasCalc={fichasCalc}/>}
    {fichaDet&&<Modal title={`📋 ${fichaDet.nome}`} onClose={()=>setFichaDet(null)}>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
        <div className="ft-kpi" style={{borderColor:'var(--coral)'}}><div className="ft-kpi-l" style={{color:'var(--coral)'}}>Custo total</div><div className="ft-kpi-v" style={{color:'var(--coral)'}}>{brl(fichaDet.custoTotal)}</div></div>
        <div className="ft-kpi" style={{borderColor:'var(--azul)'}}><div className="ft-kpi-l" style={{color:'var(--azul)'}}>Rendimento</div><div className="ft-kpi-v" style={{color:'var(--azul)'}}>{num(fichaDet.pesoFinal||0,3)}kg</div></div>
        <div className="ft-kpi" style={{borderColor:'var(--verde)'}}><div className="ft-kpi-l" style={{color:'var(--verde)'}}>Custo/kg</div><div className="ft-kpi-v" style={{color:'var(--verde)'}}>{brl(fichaDet._custoPorKg)}</div></div>
      </div>
      <SH>Ingredientes da ficha</SH>
      <div className="ft-card">
        {(fichaDet.itens||[]).map((it,i)=>(<div key={i} style={{padding:'10px 14px',borderBottom:i<fichaDet.itens.length-1?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div style={{fontSize:13,fontWeight:600}}>{it.nomeRef}</div><div style={{fontSize:11,color:'var(--cinzaE)'}}>{it.tipo==='ficha'?'📋 Sub-receita':'🥬 Ingrediente'} · {num(it.qtdLiquida||0,3)}kg líq.{it.fc>1?` · FC ${num(it.fc)}`:''}</div></div>
          <div style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:it.erro?'var(--coral)':'var(--verde)',flexShrink:0}}>{it.erro?'⚠️':brl(it.custo)}</div>
        </div>))}
      </div>
      {fichaDet.modoPreparo&&<div style={{marginTop:14}}><SH>Modo de preparo</SH><div style={{fontSize:13,color:'var(--cinzaE)',whiteSpace:'pre-wrap',lineHeight:1.5,padding:'4px 2px'}}>{fichaDet.modoPreparo}</div></div>}
    </Modal>}
  </div>);
}


// ── PRODUÇÃO TAB ──────────────────────────────────────────────────
function TabProducao({pratosCalc,fichasCalc,ingredientes}){
  const[linhas,setLinhas]=useState([]);
  const[resultado,setResultado]=useState(null);
  const addLinha=()=>setLinhas(p=>[...p,{pratoNome:pratosCalc[0]?.nome||'',qtd:1}]);
  const updLinha=(i,k,v)=>setLinhas(p=>p.map((l,j)=>j===i?{...l,[k]:v}:l));
  const remLinha=i=>setLinhas(p=>p.filter((_,j)=>j!==i));
  const calcular=()=>{
    const res=calcProducao(linhas.filter(l=>l.qtd>0),pratosCalc,fichasCalc,ingredientes);
    setResultado(res);
  };
  return(<div className="ft-page">
    <div className="ft-pc" style={{paddingTop:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div style={{fontFamily:'var(--ff)',fontSize:20,fontWeight:700,color:'var(--verde)'}}>Planejamento de Produção</div>
        <button className="ft-btn ft-btn-p" style={{padding:'10px 14px',fontSize:13}} onClick={addLinha}>+ Prato</button>
      </div>
      {linhas.length===0&&<div style={{textAlign:'center',padding:32,color:'var(--cinzaE)',fontStyle:'italic'}}>Adicione pratos para calcular a lista de compras</div>}
      {linhas.map((l,i)=>(<div key={i} style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
        <select value={l.pratoNome} onChange={e=>updLinha(i,'pratoNome',e.target.value)} style={{flex:1,fontSize:14,padding:'10px 12px',border:'1.5px solid var(--cinzaM)',borderRadius:8,background:'var(--branco)',outline:'none'}}>
          {pratosCalc.map(p=><option key={p.id} value={p.nome}>{p.nome}</option>)}
        </select>
        <input type="number" min="1" value={l.qtd} onChange={e=>updLinha(i,'qtd',+e.target.value)} style={{width:70,textAlign:'center',fontSize:14,padding:'10px 8px',border:'1.5px solid var(--cinzaM)',borderRadius:8,outline:'none'}}/>
        <span style={{fontSize:11,color:'var(--cinzaE)',minWidth:28}}>und</span>
        <button onClick={()=>remLinha(i)} style={{color:'var(--coral)',fontSize:18,minWidth:36,minHeight:36,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
      </div>))}
      {linhas.length>0&&<button className="ft-btn ft-btn-p" style={{width:'100%',marginTop:12}} onClick={calcular}>📋 CALCULAR LISTA DE COMPRAS</button>}

      {resultado&&(<div style={{marginTop:20}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
          <div className="ft-kpi" style={{borderColor:'var(--coral)'}}><div className="ft-kpi-l" style={{color:'var(--coral)'}}>Custo Total</div><div className="ft-kpi-v" style={{color:'var(--coral)'}}>{brl(resultado.totalCusto)}</div></div>
          <div className="ft-kpi" style={{borderColor:'var(--lima)'}}><div className="ft-kpi-l" style={{color:'var(--lima)'}}>Itens</div><div className="ft-kpi-v" style={{color:'var(--lima)'}}>{resultado.lista.length}</div></div>
        </div>
        <SH>Lista de Compras</SH>
        <div className="ft-card">
          <div style={{padding:'10px 14px',background:'var(--preto)',display:'flex',fontFamily:'var(--ff)',fontSize:11,color:'var(--lima)',letterSpacing:'.08em',gap:8}}>
            <span style={{flex:2}}>INGREDIENTE</span><span style={{flex:1,textAlign:'right'}}>QTD LÍQ.</span><span style={{flex:1,textAlign:'right'}}>COMPRAR (C/ FC)</span><span style={{flex:1,textAlign:'right'}}>CUSTO</span>
          </div>
          {resultado.lista.map((it,i)=>(<div key={it.nome} style={{padding:'10px 14px',borderBottom:i<resultado.lista.length-1?'1px solid var(--cinzaF)':'none',display:'flex',gap:8,alignItems:'center'}}>
            <div style={{flex:2,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{it.nome}</div>
              <div style={{fontSize:10,color:'var(--cinzaE)',marginTop:2}}>
                {it.usadoEm.map(u=>`${u.prato}: ${num(u.qtd*1000,0)}g`).join(' · ')}
              </div>
            </div>
            <div style={{flex:1,textAlign:'right',fontSize:13,color:'var(--cinzaE)'}}>{num(it.qtdLiq,3)} {it.un}</div>
            <div style={{flex:1,textAlign:'right',fontSize:13,fontWeight:700,color:'var(--azul)'}}>{num(it.qtdBruta,3)} {it.un}{it.fc>1?` (FC ${num(it.fc)})`:''}</div>
            <div style={{flex:1,textAlign:'right',fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:'var(--coral)'}}>{brl(it.custo)}</div>
          </div>))}
        </div>
      </div>)}
    </div>
  </div>);
}


// ── QR HELPERS ────────────────────────────────────────────────────
const QR_PREFIX='ZESTE:ING:';
const qrUrl=(id,size=200)=>`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(QR_PREFIX+id)}&bgcolor=FFFFFF&color=111614&margin=1`;

function QRScanner({onScan,onClose}){
  const videoRef=useRef();const canvasRef=useRef();const streamRef=useRef();const[scanning,setScanning]=useState(true);const[err,setErr]=useState('');
  useEffect(()=>{
    let active=true;
    (async()=>{
      try{
        const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:640},height:{ideal:480}}});
        if(!active)return;streamRef.current=stream;
        if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play();}
        // Try BarcodeDetector first (native, faster)
        if('BarcodeDetector' in window){
          const detector=new BarcodeDetector({formats:['qr_code']});
          const scan=async()=>{
            if(!active||!videoRef.current)return;
            try{const codes=await detector.detect(videoRef.current);
              for(const c of codes){if(c.rawValue?.startsWith(QR_PREFIX)){onScan(c.rawValue.replace(QR_PREFIX,''));return;}}
            }catch{}
            if(active)requestAnimationFrame(scan);
          };
          videoRef.current.onplaying=()=>scan();
        }else{
          // Fallback: canvas-based check every 500ms (basic)
          const check=()=>{
            if(!active||!videoRef.current||!canvasRef.current)return;
            setErr('Aponte a câmera para o QR code');
          };
          const interval=setInterval(check,1000);
          return()=>clearInterval(interval);
        }
      }catch(e){setErr('Não foi possível acessar a câmera. Verifique as permissões.');}
    })();
    return()=>{active=false;if(streamRef.current)streamRef.current.getTracks().forEach(t=>t.stop());};
  },[]);
  return(<Modal title="📷 Escanear QR Code" onClose={()=>{if(streamRef.current)streamRef.current.getTracks().forEach(t=>t.stop());onClose();}}>
    <div style={{position:'relative',borderRadius:12,overflow:'hidden',background:'#000',marginBottom:12}}>
      <video ref={videoRef} style={{width:'100%',display:'block',borderRadius:12}} playsInline muted/>
      <canvas ref={canvasRef} style={{display:'none'}}/>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
        <div style={{width:200,height:200,border:'3px solid var(--lima)',borderRadius:16,boxShadow:'0 0 0 9999px rgba(0,0,0,.4)'}}/>
      </div>
    </div>
    {err&&<div style={{textAlign:'center',color:'var(--cinzaE)',fontSize:13,marginBottom:8}}>{err}</div>}
    <div style={{textAlign:'center',fontSize:12,color:'var(--cinzaE)'}}>Posicione o QR code dentro do quadro</div>
    <div style={{marginTop:14}}>
      <div style={{fontSize:11,fontWeight:700,color:'var(--cinzaE)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.06em'}}>Ou digite o código manualmente:</div>
      <div style={{display:'flex',gap:8}}>
        <input id="manualQR" placeholder="ID do ingrediente (ex: ing_001)" style={{flex:1}}/>
        <button className="ft-btn ft-btn-p" style={{padding:'10px 14px',fontSize:13}} onClick={()=>{const v=document.getElementById('manualQR').value;if(v)onScan(v);}}>OK</button>
      </div>
    </div>
  </Modal>);
}

function QRLabels({ingredientes,onClose}){
  const comEstoque=ingredientes.filter(i=>(i.estoque||0)>0||(i.estoqueMin||0)>0);
  const lista=comEstoque.length>0?comEstoque:ingredientes.slice(0,20);
  const imprimir=()=>{
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      body{font-family:Arial,sans-serif;margin:10px}
      h1{font-size:16px;color:#2D6E47;margin-bottom:8px}
      .grid{display:flex;flex-wrap:wrap;gap:8px}
      .label{width:140px;border:1px solid #ccc;border-radius:6px;padding:8px;text-align:center;page-break-inside:avoid}
      .label img{width:100px;height:100px}
      .label .nome{font-size:10px;font-weight:700;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .label .id{font-size:8px;color:#888;margin-top:2px}
      @media print{body{margin:0}.label{border:1px solid #ddd}}
    </style></head><body>
      <h1>ZESTE — Etiquetas QR Code Estoque</h1>
      <div class="grid">${lista.map(i=>`<div class="label"><img src="${qrUrl(i.id,100)}"/><div class="nome">${i.nome}</div><div class="id">${i.un} · ${i.id}</div></div>`).join('')}</div>
    </body></html>`;
    const w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(()=>w.print(),600);
  };
  return(<Modal title="🏷️ Gerar Etiquetas QR Code" onClose={onClose}>
    <p style={{fontSize:13,color:'var(--cinzaE)',marginBottom:14,lineHeight:1.6}}>
      {comEstoque.length>0
        ?`${comEstoque.length} ingredientes com estoque configurado. Imprima as etiquetas e cole nos potes/prateleiras.`
        :`Nenhum ingrediente com estoque. Mostrando os primeiros 20 para demonstração.`}
    </p>
    <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16,maxHeight:300,overflowY:'auto'}}>
      {lista.slice(0,12).map(i=>(<div key={i.id} style={{width:110,textAlign:'center',background:'var(--cinzaF)',borderRadius:8,padding:8}}>
        <img src={qrUrl(i.id,80)} width={80} height={80} alt={i.nome} style={{borderRadius:4}}/>
        <div style={{fontSize:10,fontWeight:700,marginTop:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.nome}</div>
      </div>))}
      {lista.length>12&&<div style={{width:110,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--cinzaE)',fontSize:12}}>+{lista.length-12} mais</div>}
    </div>
    <button className="ft-btn ft-btn-p" style={{width:'100%'}} onClick={imprimir}>🖨️ IMPRIMIR TODAS AS ETIQUETAS ({lista.length})</button>
  </Modal>);
}

// ── ESTOQUE TAB ───────────────────────────────────────────────────
function TabEstoque({ingredientes,onSave,clienteFilter}){
  const[q,setQ]=useState('');const[mov,setMov]=useState(null);
  const filtered=ingredientes.filter(i=>(!q||normNome(i.nome).includes(normNome(q)))&&(!clienteFilter||i._cliente===clienteFilter||i._cliente==='zeste'||!i._cliente));
  const comEstoque=filtered.filter(i=>(i.estoque||0)>0||(i.estoqueMin||0)>0);
  const semEstoque=filtered.filter(i=>!i.estoque&&!i.estoqueMin);
  const baixos=ingredientes.filter(i=>i.estoqueMin>0&&(i.estoque||0)<i.estoqueMin);

  const salvarMov=()=>{
    if(!mov)return;
    const ing=ingredientes.find(i=>i.id===mov.ingId);if(!ing)return;
    const novoEstoque=Math.max(0,(ing.estoque||0)+(mov.tipo==='entrada'?1:-1)*Number(mov.qtd||0));
    const hist=[...(ing.historico||[]),{tipo:mov.tipo,qtd:Number(mov.qtd),data:new Date().toISOString().split('T')[0],obs:mov.obs||''}].slice(-20);
    onSave({...ing,estoque:novoEstoque,historico:hist});
    setMov(null);
  };

  const[showScan,setShowScan]=useState(false);const[showLabels,setShowLabels]=useState(false);
  const handleScan=(ingId)=>{
    setShowScan(false);
    const ing=ingredientes.find(i=>i.id===ingId);
    if(ing)setMov({ingId:ing.id,tipo:'entrada',qtd:'',obs:''});
    else alert('Ingrediente não encontrado: '+ingId);
  };
  return(<div className="ft-page">
    <div className="ft-search" style={{flexWrap:'wrap'}}>
      <input placeholder="🔍 Buscar ingrediente…" value={q} onChange={e=>setQ(e.target.value)} style={{flex:'1 1 150px'}}/>
      <button className="ft-btn ft-btn-p" style={{padding:'10px 14px',fontSize:13,gap:4}} onClick={()=>setShowScan(true)}>📷 Escanear</button>
      <button className="ft-btn ft-btn-g" style={{padding:'10px 14px',fontSize:13,gap:4}} onClick={()=>setShowLabels(true)}>🏷️ Etiquetas</button>
    </div>
    {showScan&&<QRScanner onScan={handleScan} onClose={()=>setShowScan(false)}/>}
    {showLabels&&<QRLabels ingredientes={ingredientes} onClose={()=>setShowLabels(false)}/>}

    {baixos.length>0&&<div className="ft-pc" style={{marginBottom:12}}>
      <div style={{background:'#FFF0ED',borderLeft:'3px solid var(--coral)',borderRadius:6,padding:'12px 14px'}}>
        <div style={{fontFamily:'var(--ff)',fontSize:13,fontWeight:700,color:'var(--coral)',marginBottom:6}}>⚠️ ESTOQUE BAIXO — {baixos.length} ingrediente{baixos.length>1?'s':''}</div>
        {baixos.map(i=><div key={i.id} style={{fontSize:12,color:'#7C2D12',marginBottom:3}}>{i.nome}: <strong>{num(i.estoque||0,2)} {i.un}</strong> (mín: {num(i.estoqueMin,2)})</div>)}
      </div>
    </div>}

    <div className="ft-pc">
      {comEstoque.length>0&&<><SH>Com estoque cadastrado</SH><div className="ft-card" style={{marginBottom:16}}>
        {comEstoque.map((i,idx)=>{
          const pctEst=i.estoqueMin>0?Math.min(1,(i.estoque||0)/i.estoqueMin):1;
          const cor=pctEst<0.5?'var(--coral)':pctEst<1?'#F59E0B':'var(--verde)';
          return(<div key={i.id} style={{padding:'12px 14px',borderBottom:idx<comEstoque.length-1?'1px solid var(--cinzaF)':'none',display:'flex',alignItems:'center',gap:10}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.nome}</div>
              <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center'}}>
                <span style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:cor}}>{num(i.estoque||0,2)} {i.un}</span>
                {i.estoqueMin>0&&<span style={{fontSize:11,color:'var(--cinzaE)'}}>mín: {num(i.estoqueMin,2)}</span>}
              </div>
              {i.estoqueMin>0&&<div style={{height:4,borderRadius:99,background:'var(--cinzaF)',marginTop:4,maxWidth:200}}>
                <div style={{height:'100%',width:Math.min(100,pctEst*100)+'%',background:cor,borderRadius:99,transition:'width .5s'}}/>
              </div>}
            </div>
            <div style={{display:'flex',gap:6,flexShrink:0}}>
              <button onClick={()=>setMov({ingId:i.id,tipo:'entrada',qtd:'',obs:''})} style={{background:'#ECFDF5',border:'1.5px solid #10B981',borderRadius:6,padding:'8px 10px',fontSize:12,fontWeight:600,color:'#065F46',cursor:'pointer',minHeight:40}}>+ Entrada</button>
              <button onClick={()=>setMov({ingId:i.id,tipo:'saida',qtd:'',obs:''})} style={{background:'#FFF5F5',border:'1.5px solid var(--coral)',borderRadius:6,padding:'8px 10px',fontSize:12,fontWeight:600,color:'var(--coral)',cursor:'pointer',minHeight:40}}>- Saída</button>
            </div>
          </div>);
        })}
      </div></>}

      <SH>Configurar estoque</SH>
      <p style={{fontSize:12,color:'var(--cinzaE)',marginBottom:12}}>Clique em um ingrediente para definir estoque atual e mínimo.</p>
      <div className="ft-card">
        {semEstoque.slice(0,30).map((i,idx)=>(<div key={i.id} className="ft-row" style={{borderBottom:idx<Math.min(29,semEstoque.length-1)?'1px solid var(--cinzaF)':'none'}} onClick={()=>setMov({ingId:i.id,tipo:'config',estoque:i.estoque||0,estoqueMin:i.estoqueMin||0})}>
          <div style={{flex:1,fontSize:13,fontWeight:600}}>{i.nome}</div>
          <span style={{fontSize:11,color:'var(--cinzaE)'}}>{i.un} · {brl(i.p)}/kg</span>
        </div>))}
        {semEstoque.length>30&&<div style={{padding:'12px 14px',textAlign:'center',color:'var(--cinzaE)',fontSize:12}}>+ {semEstoque.length-30} ingredientes sem estoque</div>}
      </div>
    </div>

    {mov&&<Modal title={mov.tipo==='config'?'Configurar Estoque':mov.tipo==='entrada'?'Registrar Entrada':'Registrar Saída'} onClose={()=>setMov(null)}>
      <div style={{fontFamily:'var(--ff)',fontSize:16,fontWeight:700,color:'var(--verde)',marginBottom:14}}>{ingredientes.find(i=>i.id===mov.ingId)?.nome}</div>
      {mov.tipo==='config'?(<>
        <div className="ft-fg">
          <div className="ft-fld h"><label className="ft-flbl">Estoque atual ({ingredientes.find(i=>i.id===mov.ingId)?.un})</label><NumInput step="0.01" value={mov.estoque} onChange={v=>setMov(m=>({...m,estoque:v}))}/></div>
          <div className="ft-fld h"><label className="ft-flbl">Estoque mínimo</label><NumInput step="0.01" value={mov.estoqueMin} onChange={v=>setMov(m=>({...m,estoqueMin:v}))}/></div>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
          <button className="ft-btn ft-btn-g" onClick={()=>setMov(null)}>Cancelar</button>
          <button className="ft-btn ft-btn-p" onClick={()=>{const ing=ingredientes.find(i=>i.id===mov.ingId);if(ing)onSave({...ing,estoque:mov.estoque,estoqueMin:mov.estoqueMin});setMov(null);}}>Salvar</button>
        </div>
      </>):(<>
        <div className="ft-fg">
          <div className="ft-fld"><label className="ft-flbl">Quantidade ({ingredientes.find(i=>i.id===mov.ingId)?.un})</label><NumInput step="0.01" min="0" value={mov.qtd} onChange={v=>setMov(m=>({...m,qtd:v}))}/></div>
          <div className="ft-fld"><label className="ft-flbl">Observação (opcional)</label><input value={mov.obs||''} onChange={e=>setMov(m=>({...m,obs:e.target.value}))} placeholder="Ex: Compra Atacadão"/></div>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
          <button className="ft-btn ft-btn-g" onClick={()=>setMov(null)}>Cancelar</button>
          <button className="ft-btn ft-btn-p" onClick={salvarMov} disabled={!mov.qtd||Number(mov.qtd)<=0}>{mov.tipo==='entrada'?'+ Registrar Entrada':'- Registrar Saída'}</button>
        </div>
      </>)}
    </Modal>}
  </div>);
}

// ── RESUMO TAB ────────────────────────────────────────────────────
function TabResumo({ingredientes,fichasCalc,pratosCalc,clienteFilter}){
  const pratosVis=clienteFilter?pratosCalc.filter(p=>p._cliente===clienteFilter):pratosCalc;
  const fichasVis=clienteFilter?fichasCalc.filter(f=>f._cliente===clienteFilter):fichasCalc;
  const pratosComPreco=pratosVis.filter(p=>p.precoVenda>0);
  const cmvMedio=pratosComPreco.length>0?pratosComPreco.reduce((s,p)=>s+p.cmv,0)/pratosComPreco.length:0;
  const custoMedio=pratosComPreco.length>0?pratosComPreco.reduce((s,p)=>s+p.custoTotal,0)/pratosComPreco.length:0;
  const categorias=[...new Set(pratosVis.map(p=>p.categoria||'Sem categoria'))];
  return(<div className="ft-page">
    <div className="ft-kr">
      <div className="ft-kpi" style={{borderColor:'var(--lima)'}}><div className="ft-kpi-l" style={{color:'var(--lima)'}}>Ingredientes</div><div className="ft-kpi-v" style={{color:'var(--lima)'}}>{ingredientes.length}</div></div>
      <div className="ft-kpi" style={{borderColor:'var(--azul)'}}><div className="ft-kpi-l" style={{color:'var(--azul)'}}>Fichas</div><div className="ft-kpi-v" style={{color:'var(--azul)'}}>{fichasVis.length}</div></div>
      <div className="ft-kpi" style={{borderColor:'var(--coral)'}}><div className="ft-kpi-l" style={{color:'var(--coral)'}}>Pratos</div><div className="ft-kpi-v" style={{color:'var(--coral)'}}>{pratosVis.length}</div></div>
      {pratosComPreco.length>0&&<><div className="ft-kpi" style={{borderColor:cmvColor(cmvMedio)}}><div className="ft-kpi-l" style={{color:cmvColor(cmvMedio)}}>CMV Médio</div><div className="ft-kpi-v" style={{color:cmvColor(cmvMedio)}}>{pct(cmvMedio)}</div></div>
      <div className="ft-kpi" style={{borderColor:'var(--cinzaE)'}}><div className="ft-kpi-l" style={{color:'var(--cinzaE)'}}>Custo Médio/Prato</div><div className="ft-kpi-v" style={{color:'var(--branco)'}}>{brl(custoMedio)}</div></div></>}
    </div>
    <div className="ft-pc">
      {categorias.map(cat=>{const pratos=pratosVis.filter(p=>(p.categoria||'Sem categoria')===cat&&p.precoVenda>0);if(!pratos.length)return null;return(<div key={cat}>
        <SH>{cat}</SH>
        <div className="ft-card" style={{marginBottom:16}}>
          {pratos.map((p,i)=>(<div key={p.id} style={{padding:'12px 14px',borderBottom:i<pratos.length-1?'1px solid var(--cinzaF)':'none'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <span style={{fontWeight:700,fontSize:14}}>{p.nome}</span>
              <span style={{fontFamily:'var(--ff)',fontSize:13,fontWeight:700,color:cmvColor(p.cmv)}}>{pct(p.cmv)}</span>
            </div>
            <div style={{display:'flex',gap:2,height:8,borderRadius:4,overflow:'hidden',background:'var(--cinzaF)'}}>
              <div style={{width:`${p.cmv*100}%`,background:cmvColor(p.cmv),borderRadius:4,transition:'width .5s'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontSize:11,color:'var(--cinzaE)'}}>
              <span>Custo {brl(p.custoTotal)}</span><span>Venda {brl(p.precoVenda)}</span><span>Lucro {brl(p.precoVenda-p.custoTotal)}</span>
            </div>
          </div>))}
        </div>
      </div>);})}
      {fichasCalc.length>0&&<><SH>Top 10 — Fichas mais caras (custo/kg)</SH><div className="ft-card" style={{marginBottom:20}}>
        {[...fichasVis].sort((a,b)=>b._custoPorKg-a._custoPorKg).slice(0,10).map((f,i)=>(<div key={f.id} style={{padding:'10px 14px',borderBottom:i<9?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:13,fontWeight:600}}>{f.nome}</span>
          <span style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:'var(--coral)'}}>{brl(f._custoPorKg)}/kg</span>
        </div>))}
      </div></>}
    </div>
  </div>);
}


// ── HISTÓRICO DE VERSÕES ──────────────────────────────────────────
function HistoricoModal({item,onClose,onRevert}){
  const hist=(item._historico||[]).slice().reverse();
  if(!hist.length)return(<Modal title="Histórico" onClose={onClose}><div style={{padding:20,textAlign:'center',color:'var(--cinzaE)'}}>Nenhuma alteração registrada ainda.</div></Modal>);
  return(<Modal title={`Histórico — ${item.nome}`} onClose={onClose}>
    <div style={{fontSize:12,color:'var(--cinzaE)',marginBottom:14}}>Últimas {hist.length} alterações. Clique em "Reverter" para restaurar uma versão anterior.</div>
    {hist.map((v,i)=>(<div key={i} style={{background:i===0?'#ECFDF5':'var(--cinzaF)',borderRadius:10,padding:'12px 14px',marginBottom:8,border:`1px solid ${i===0?'var(--verde)':'var(--cinzaM)'}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
        <div>
          <div style={{fontSize:13,fontWeight:700}}>{v._editadoPor||'Admin'}</div>
          <div style={{fontSize:11,color:'var(--cinzaE)'}}>{new Date(v._editadoEm).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
        </div>
        {i>0&&<button onClick={()=>{onRevert(v);onClose();}} style={{background:'var(--verde)',color:'var(--branco)',borderRadius:6,padding:'6px 12px',fontSize:12,fontWeight:600}}>↩ Reverter</button>}
        {i===0&&<span className="ft-tag" style={{background:'#ECFDF5',color:'var(--verde)'}}>ATUAL</span>}
      </div>
      <div style={{fontSize:12,color:'var(--cinzaE)'}}>
        {v.nome&&<span>Nome: <strong>{v.nome}</strong></span>}
        {v.precoVenda!==undefined&&<span> · Venda: <strong>{brl(v.precoVenda)}</strong></span>}
        {v.itens&&<span> · {v.itens.length} insumos</span>}
        {v.componentes&&<span> · {v.componentes.length} componentes</span>}
      </div>
    </div>))}
  </Modal>);
}

// ── ROOT ──────────────────────────────────────────────────────────
const TABS=[{id:'resumo',l:'RESUMO'},{id:'ingredientes',l:'INGREDIENTES'},{id:'fichas',l:'FICHAS'},{id:'pratos',l:'PRATOS'},{id:'producao',l:'PRODUÇÃO'},{id:'estoque',l:'ESTOQUE'}];
const TABS_ADMIN=[...TABS,{id:'documentos',l:'DOCUMENTOS'}];

export default function Fichas({onBack,token,clienteId:clienteIdProp,clienteNome,onLogout,userInfo}){
  const[ingredientes,setIngredientes]=useState([]);
  const[fichasRaw,setFichasRaw]=useState([]);
  const[pratosRaw,setPratosRaw]=useState([]);
  const[loading,setLoading]=useState(true);
  const[syncing,setSyncing]=useState(false);
  const[aba,setAba]=useState('resumo');const[histItem,setHistItem]=useState(null);
  const[clientesList,setClientesList]=useState([]);
  const ehAdmin=!clienteIdProp||clienteIdProp==='zeste';
  useEffect(()=>{if(ehAdmin){fetch(`${SB_URL}/rest/v1/fin_portal_clientes?select=*&order=nome_display.asc`,{headers:sbH(token)}).then(r=>r.json()).then(d=>Array.isArray(d)&&setClientesList(d)).catch(()=>{});}},[]);
  const[clienteFilter,setClienteFilter]=useState(clienteIdProp||'');

  useEffect(()=>{loadAll();},[]);

  async function loadAll(){
    setLoading(true);
    let[ings,fics,prts]=await Promise.all([sbLoad('fin_ingredientes',token),sbLoad('fin_fichas',token),sbLoad('fin_pratos',token)]);
    // Erro de rede/sessão NÃO é banco vazio: avisa e não semeia nada
    if(ings===null||fics===null||prts===null){
      toast("Erro ao carregar — recarregue a página ou entre de novo","erro");
      setIngredientes(ings||[]);setFichasRaw(fics||[]);setPratosRaw(prts||[]);
      setLoading(false);
      return;
    }
    // Semeadura inicial: SÓ admin, e só com banco de fato vazio
    if(ings.length===0&&ehAdmin){
      setSyncing(true);
      const seedIngs=SEED_ING.map(i=>({...i,id:i.id||uid()}));
      await Promise.all(seedIngs.map(i=>sbInsertIng(i,'zeste',token)));
      ings=seedIngs;
      const seedFics=SEED_FIC.map(f=>({...f,id:f.id||uid()}));
      await Promise.all(seedFics.map(f=>sbUpsert('fin_fichas',f,'zeste',token)));
      fics=seedFics;
      const seedPrts=SEED_PRT.map(p=>({...p,id:p.id||uid()}));
      await Promise.all(seedPrts.map(p=>sbUpsert('fin_pratos',p,p.categoria?.includes('440')?'440':'zeste',token)));
      prts=seedPrts;
      setSyncing(false);
    }
    setIngredientes(ings);setFichasRaw(fics);setPratosRaw(prts);
    setLoading(false);
  }

  // Recalcular CMV sempre que dados mudam
  const meuCli=clienteIdProp&&clienteIdProp!=='zeste'?clienteIdProp:null;
  const fichasCalc=calcAllFichas(fichasRaw,ingredientes,meuCli);
  const pratosCalc=pratosRaw.map(p=>calcPrato(p,ingredientes,fichasCalc,meuCli));

  const sync=async fn=>{setSyncing(true);try{await fn();}finally{setSyncing(false);}};

  const saveIngrediente=async item=>{await sync(async()=>{
    const old=ingredientes.find(i=>i.id===item.id);
    // Isolamento: se cliente logado edita um ingrediente da base 'zeste', cria cópia própria (copy-on-write)
    const meuCliente=clienteIdProp||item._cliente||'zeste';
    const ehBaseZeste=old&&old._cliente==='zeste';
    const souCliente=!!clienteIdProp&&clienteIdProp!=='zeste';
    let saved;
    if(ehBaseZeste&&souCliente){
      // cria cópia nova vinculada ao cliente, sem alterar a base
      saved={...item,id:uid(),_cliente:clienteIdProp,_baseRef:old.id,_historico:[],_ultimaEdicao:whoAmI,_ultimaEdicaoEm:new Date().toISOString()};
      await sbInsertIng(saved,clienteIdProp,token);
      setIngredientes(p=>[saved,...p]);
    }else{
      saved={...item,_cliente:item._cliente||meuCliente,_historico:addHistory(old,whoAmI),_ultimaEdicao:whoAmI,_ultimaEdicaoEm:new Date().toISOString()};
      await sbInsertIng(saved,saved._cliente,token);
      setIngredientes(p=>p.some(i=>i.id===saved.id)?p.map(i=>i.id===saved.id?saved:i):[saved,...p]);
    }
  });};
  const delIngrediente=async id=>{const ing=ingredientes.find(i=>i.id===id);if(clienteIdProp&&clienteIdProp!=='zeste'&&ing&&ing._cliente==='zeste'){alert('Este é um ingrediente da base Zeste e não pode ser excluído. Edite-o para criar sua própria versão.');return;}await sync(async()=>{await fetch(`${SB_URL}/rest/v1/fin_ingredientes?id=eq.${id}`,{method:'DELETE',headers:sbH(token)});setIngredientes(p=>p.filter(i=>i.id!==id));});};

  const savePrato=async item=>{await sync(async()=>{
    const old=pratosRaw.find(p=>p.id===item.id);
    const saved={...item,_historico:addHistory(old,whoAmI),_ultimaEdicao:whoAmI,_ultimaEdicaoEm:new Date().toISOString()};
    await sbUpsert('fin_pratos',saved,saved._cliente||saved.categoria?.includes('440')?'440':'zeste',token);
    setPratosRaw(p=>p.some(pr=>pr.id===saved.id)?p.map(pr=>pr.id===saved.id?saved:pr):[saved,...p]);
  });};
  const delPrato=async id=>{await sync(async()=>{await sbDel('fin_pratos',id,token);setPratosRaw(p=>p.filter(pr=>pr.id!==id));});};
  const addHistory=(oldItem,who)=>{
    if(!oldItem||!oldItem.id)return[];
    const hist=(oldItem._historico||[]).slice(-19);
    hist.push({...oldItem,_historico:undefined,_editadoPor:who,_editadoEm:new Date().toISOString()});
    return hist;
  };
  const whoAmI=userInfo?.nome||userInfo?.email||clienteNome||'Admin';
  const saveFicha=async item=>{await sync(async()=>{
    const old=fichasRaw.find(f=>f.id===item.id);
    const saved={...item,_historico:addHistory(old,whoAmI),_ultimaEdicao:whoAmI,_ultimaEdicaoEm:new Date().toISOString()};
    await sbUpsert('fin_fichas',saved,saved._cliente||'zeste',token);
    setFichasRaw(p=>p.some(f=>f.id===saved.id)?p.map(f=>f.id===saved.id?saved:f):[saved,...p]);
  });};
  const delFicha=async id=>{await sync(async()=>{await sbDel('fin_fichas',id,token);setFichasRaw(p=>p.filter(f=>f.id!==id));});};

  if(loading)return(<><style>{STYLE}</style><div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--cinzaF)'}}><div style={{textAlign:'center'}}><div style={{fontFamily:'var(--ff)',fontSize:32,fontWeight:800,color:'var(--verde)'}}>ZESTE</div><div style={{color:'var(--cinzaE)',fontSize:13,marginTop:4}}>Carregando fichas técnicas…</div></div></div></>);

  return(<>
    <style>{STYLE}</style>
    {syncing&&<div className="sync-ind"/>}
    <div style={{background:'var(--preto)',position:'sticky',top:0,zIndex:300}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {onBack&&<button onClick={onBack} style={{color:'var(--lima)',fontSize:24,lineHeight:1,minWidth:36,minHeight:36,display:'flex',alignItems:'center'}}>‹</button>}
          <div style={{display:'flex',alignItems:'baseline',gap:7}}><img src="/logo-icon-t.png" alt="Z" style={{height:24,width:'auto',marginRight:4}}/><span style={{fontFamily:'var(--ff)',fontSize:20,fontWeight:800,color:'var(--lima)'}}>ZESTE</span><span style={{fontSize:9,color:'var(--cinzaE)',letterSpacing:'.14em'}}>{clienteNome?clienteNome.toUpperCase():'FICHAS TÉCNICAS'}</span></div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {syncing&&<span style={{fontSize:10,color:'var(--lima)',fontFamily:'var(--ff)',fontWeight:700}}>SYNC…</span>}
          <button onClick={loadAll} style={{color:'var(--cinzaE)',fontSize:18,minWidth:36,minHeight:36,display:'flex',alignItems:'center',justifyContent:'center'}}>↻</button>
          {onLogout&&<button onClick={onLogout} style={{color:'#888',fontSize:11,padding:'6px 12px',border:'1px solid #333',borderRadius:6,letterSpacing:'.06em',fontWeight:600,marginLeft:4}}>SAIR</button>}
        </div>
      </div>
      <nav className="ft-nav">{(ehAdmin?TABS_ADMIN:TABS).map((t,i)=>(<span key={t.id}>{i>0&&<div style={{width:1,background:'#252525',margin:'10px 0',flexShrink:0}}/>}<div className={`ft-tab${aba===t.id?' on':''}`} onClick={()=>setAba(t.id)}>{t.l}</div></span>))}</nav>
    </div>
    {aba==='resumo'&&<TabResumo ingredientes={ingredientes} fichasCalc={fichasCalc} pratosCalc={pratosCalc} clienteFilter={clienteFilter}/>}
    {aba==='ingredientes'&&<TabIngredientes ingredientes={ingredientes} onSave={saveIngrediente} onDelete={delIngrediente} clienteFilter={clienteFilter}/>}
    {aba==='fichas'&&<TabFichas fichasCalc={fichasCalc} ingredientes={ingredientes} fichasRaw={fichasRaw} onSave={saveFicha} onDelete={delFicha} clienteFilter={clienteFilter}/>}
    {aba==='pratos'&&<TabPratos pratosCalc={pratosCalc} ingredientes={ingredientes} fichasCalc={fichasCalc} onSave={savePrato} onDelete={delPrato} clienteFilter={clienteFilter}/>}
    {aba==='producao'&&<TabProducao pratosCalc={pratosCalc} fichasCalc={fichasCalc} ingredientes={ingredientes}/>}
    {aba==='estoque'&&<TabEstoque ingredientes={ingredientes} onSave={saveIngrediente} clienteFilter={clienteFilter}/>}
    {aba==='documentos'&&ehAdmin&&<Documentos token={token} clientes={clientesList}/>}
    {histItem&&<HistoricoModal item={histItem} onClose={()=>setHistItem(null)} onRevert={async(v)=>{
      const clean={...v,_historico:undefined,_editadoPor:undefined,_editadoEm:undefined};
      if(histItem.componentes)await savePrato(clean);else await saveFicha(clean);
      setHistItem(null);
    }}/>}
  </>);
}

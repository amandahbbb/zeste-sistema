import { useState, useEffect, useCallback, useRef } from "react";

// ── SUPABASE ──────────────────────────────────────────────────────
const SB_URL="https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
function sbH(t){return{"apikey":SB_KEY,"Authorization":`Bearer ${t||SB_KEY}`,"Content-Type":"application/json","Prefer":"return=representation"};}
async function sbLoad(table,t){try{const r=await fetch(`${SB_URL}/rest/v1/${table}?deleted_at=is.null&order=created_at.desc`,{headers:sbH(t)});const d=await r.json();return Array.isArray(d)?d.map(r=>({...r.dados,_id:r.id,_cliente:r.cliente_id})):[];}catch{return[];}}
async function sbLoadAll(table,t){try{const r=await fetch(`${SB_URL}/rest/v1/${table}?order=created_at.desc`,{headers:sbH(t)});const d=await r.json();return Array.isArray(d)?d.map(r=>r.dados||r):[];}catch{return[];}}
async function sbUpsert(table,item,clienteId,t){await fetch(`${SB_URL}/rest/v1/${table}`,{method:"POST",headers:{...sbH(t),"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({id:item.id,cliente_id:clienteId||'zeste',dados:item,updated_at:new Date().toISOString()})});}
async function sbDel(table,id,t){await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`,{method:"PATCH",headers:sbH(t),body:JSON.stringify({deleted_at:new Date().toISOString()})});}
async function sbInsertIng(item,t){await fetch(`${SB_URL}/rest/v1/fin_ingredientes`,{method:"POST",headers:{...sbH(t),"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({id:item.id,dados:item,updated_at:new Date().toISOString()})});}

// ── UTILITÁRIOS ───────────────────────────────────────────────────
const uid=()=>Math.random().toString(36).slice(2,9);
const brl=v=>v==null||isNaN(v)?'—':'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct=v=>v==null||isNaN(v)?'—':(v*100).toFixed(1)+'%';
const num=(v,d=1)=>v==null||isNaN(v)?'—':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:d});
const normNome=s=>(s||'').toString().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim();

// ── CMV ENGINE ────────────────────────────────────────────────────
function calcFicha(ficha,ingredientes,fichas){
  const itens=(ficha.itens||[]).map(it=>{
    const ref=it.tipo==='ficha'?fichas.find(f=>f.nome===it.nomeRef):ingredientes.find(i=>i.nome===it.nomeRef);
    if(!ref)return{...it,custo:0,pesoFinal:0,erro:true};
    const precoKg=it.tipo==='ficha'?(ref._custoPorKg||0):(ref.p||0);
    const fc=it.tipo==='ficha'?1:(ref.fc||1);
    const fk=it.tipo==='ficha'?1:(ref.fk||1);
    const qtdLiq=Number(it.qtdLiquida)||0;
    const qtdBruta=qtdLiq*fc;
    const custo=qtdBruta*precoKg;
    const pesoFinal=qtdLiq*fk;
    return{...it,ref,qtdBruta,custo,pesoFinal,precoKg,fc,fk};
  });
  const custoSomado=itens.reduce((s,i)=>s+i.custo,0);
  const pesoFinal=itens.reduce((s,i)=>s+i.pesoFinal,0);
  const margem=Number(ficha.margemSeguranca||0);
  const custoTotal=custoSomado*(1+margem);
  const custoPorKg=pesoFinal>0?custoTotal/pesoFinal:0;
  return{...ficha,itens,custoTotal,pesoFinal,_custoPorKg:custoPorKg};
}

function calcPrato(prato,ingredientes,fichas){
  const comps=(prato.componentes||[]).map(c=>{
    const ref=c.tipo==='ficha'?fichas.find(f=>f.nome===c.nomeRef):ingredientes.find(i=>i.nome===c.nomeRef);
    if(!ref)return{...c,custo:0,erro:true};
    const custoPorKg=c.tipo==='ficha'?(ref._custoPorKg||0):(ref.p||0);
    const qtdKg=(Number(c.qtdGramas)||0)/1000;
    const fc=c.tipo==='ficha'?1:(ref.fc||1);
    const custo=qtdKg*fc*custoPorKg;
    return{...c,ref,custo,custoPorKg,qtdKg};
  });
  const custoTotal=comps.reduce((s,c)=>s+c.custo,0);
  const preco=Number(prato.precoVenda||0);
  const cmv=preco>0?custoTotal/preco:0;
  const margem=preco>0?(preco-custoTotal)/preco:0;
  return{...prato,comps,custoTotal,cmv,margem,_custoPorKg:custoTotal/((comps.reduce((s,c)=>s+(c.qtdKg||0),0))||1)};
}

function calcAllFichas(fichasRaw,ingredientes){
  const resolved=[];const nameMap=new Map();
  const resolve=(f)=>{
    if(nameMap.has(f.nome))return nameMap.get(f.nome);
    const calc=calcFicha(f,ingredientes,resolved);
    resolved.push(calc);nameMap.set(f.nome,calc);
    return calc;
  };
  // Resolve in dependency order (fichas that reference other fichas)
  const pending=[...fichasRaw];let maxIter=50;
  while(pending.length>0&&maxIter-->0){
    const before=pending.length;
    for(let i=pending.length-1;i>=0;i--){
      const f=pending[i];
      const deps=(f.itens||[]).filter(it=>it.tipo==='ficha').map(it=>it.nomeRef);
      if(deps.every(d=>nameMap.has(d))){resolve(f);pending.splice(i,1);}
    }
    if(pending.length===before){pending.forEach(f=>resolve(f));break;}
  }
  return resolved;
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
.ft-kpi-l{font-family:var(--ff);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px}
.ft-kpi-v{font-family:var(--ff);font-size:19px;font-weight:700;line-height:1}
.ft-row{padding:13px 15px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:background .1s;border-bottom:1px solid var(--cinzaF);min-height:56px}
.ft-row:hover{background:#F7F7F3}.ft-row:active{background:var(--cinzaF)}
.ft-tag{display:inline-block;padding:3px 8px;border-radius:4px;font-family:var(--ff);font-size:10px;font-weight:700;letter-spacing:.06em}
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
.ft-flbl{font-size:11px;font-weight:700;color:var(--cinzaE);letter-spacing:.07em;text-transform:uppercase}
.ft-sh{display:flex;align-items:center;gap:8px;margin:18px 0 10px}
.ft-sh-bar{width:18px;height:3px;background:var(--lima);flex-shrink:0}
.ft-sh-txt{font-family:var(--ff);font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--cinzaE);text-transform:uppercase}
.ft-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:8px;padding:11px 18px;font-size:14px;font-weight:600;min-height:44px;white-space:nowrap}
.ft-btn-p{background:var(--verde);color:var(--branco)}.ft-btn-g{background:transparent;color:var(--verde);border:1.5px solid var(--verde)}.ft-btn-d{background:var(--coral);color:var(--branco)}
.ft-search{display:flex;gap:8px;padding:12px 14px}
@media(min-width:600px){.ft-search{padding:12px 22px}}
.sync-ind{height:2px;background:var(--lima);position:fixed;top:0;left:0;z-index:999;width:100%}
`;

// ── ÁTOMOS UI ─────────────────────────────────────────────────────
function Modal({title,onClose,children}){useEffect(()=>{document.body.style.overflow='hidden';return()=>{document.body.style.overflow=''};},[]);return(<div className="ft-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="ft-sheet"><div style={{width:36,height:4,background:'var(--cinzaM)',borderRadius:2,margin:'10px auto 2px'}}/><div className="ft-shdr"><span style={{fontFamily:'var(--ff)',fontSize:20,fontWeight:700,color:'var(--verde)'}}>{title}</span><button className="ft-close" onClick={onClose}>✕</button></div><div style={{padding:'16px 18px 16px'}}>{children}</div></div></div>);}
const SH=({children})=><div className="ft-sh"><div className="ft-sh-bar"/><span className="ft-sh-txt">{children}</span></div>;

// ── INGREDIENTES TAB ──────────────────────────────────────────────
function TabIngredientes({ingredientes,onSave,onDelete}){
  const[q,setQ]=useState('');const[edit,setEdit]=useState(null);
  const filtered=ingredientes.filter(i=>!q||normNome(i.nome).includes(normNome(q)));
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
        <div className="ft-fld h"><label className="ft-flbl">Preço/KG (R$)</label><input type="number" step="0.01" value={edit.p} onChange={e=>setEdit(f=>({...f,p:+e.target.value}))}/></div>
        <div className="ft-fld h"><label className="ft-flbl">Fator Correção</label><input type="number" step="0.01" value={edit.fc} onChange={e=>setEdit(f=>({...f,fc:+e.target.value}))}/></div>
        <div className="ft-fld h"><label className="ft-flbl">Fator Cocção</label><input type="number" step="0.01" value={edit.fk} onChange={e=>setEdit(f=>({...f,fk:+e.target.value}))}/></div>
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
  const[q,setQ]=useState('');const[detail,setDetail]=useState(null);
  const filtered=fichasCalc.filter(f=>(!q||normNome(f.nome).includes(normNome(q)))&&(!clienteFilter||f._cliente===clienteFilter||f._cliente==='zeste'));
  return(<div className="ft-page">
    <div className="ft-search"><input placeholder="🔍 Buscar ficha…" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}}/></div>
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
    </Modal>}
  </div>);
}

// ── PRATOS TAB ────────────────────────────────────────────────────
function TabPratos({pratosCalc,clienteFilter}){
  const[q,setQ]=useState('');const[detail,setDetail]=useState(null);
  const filtered=pratosCalc.filter(p=>(!q||normNome(p.nome).includes(normNome(q)))&&(!clienteFilter||p._cliente===clienteFilter||p._cliente==='zeste'));
  const categorias=[...new Set(filtered.map(p=>p.categoria||'Sem categoria'))];
  return(<div className="ft-page">
    <div className="ft-search"><input placeholder="🔍 Buscar prato…" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}}/></div>
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
        {(detail.comps||[]).map((c,i)=>(<div key={i} style={{padding:'10px 14px',borderBottom:i<detail.comps.length-1?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><div style={{fontSize:13,fontWeight:600}}>{c.nomeRef}</div><div style={{fontSize:11,color:'var(--cinzaE)'}}>{c.tipo==='ficha'?'📋 Ficha':'🥬 Ingrediente'} · {c.qtdGramas}g</div></div>
          <div style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:c.erro?'var(--coral)':'var(--verde)',flexShrink:0}}>{c.erro?'⚠️':brl(c.custo)}</div>
        </div>))}
      </div>
      {detail.precoVenda>0&&<div style={{marginTop:14,background:cmvColor(detail.cmv)+'18',borderLeft:`3px solid ${cmvColor(detail.cmv)}`,borderRadius:6,padding:'10px 12px',fontSize:13,color:cmvColor(detail.cmv),fontWeight:600}}>
        CMV {pct(detail.cmv)} — {cmvLabel(detail.cmv)} · Lucro bruto de {brl(detail.precoVenda-detail.custoTotal)} por porção
      </div>}
    </Modal>}
  </div>);
}

// ── RESUMO TAB ────────────────────────────────────────────────────
function TabResumo({ingredientes,fichasCalc,pratosCalc}){
  const pratosComPreco=pratosCalc.filter(p=>p.precoVenda>0);
  const cmvMedio=pratosComPreco.length>0?pratosComPreco.reduce((s,p)=>s+p.cmv,0)/pratosComPreco.length:0;
  const custoMedio=pratosComPreco.length>0?pratosComPreco.reduce((s,p)=>s+p.custoTotal,0)/pratosComPreco.length:0;
  const categorias=[...new Set(pratosCalc.map(p=>p.categoria||'Sem categoria'))];
  return(<div className="ft-page">
    <div className="ft-kr">
      <div className="ft-kpi" style={{borderColor:'var(--lima)'}}><div className="ft-kpi-l" style={{color:'var(--lima)'}}>Ingredientes</div><div className="ft-kpi-v" style={{color:'var(--lima)'}}>{ingredientes.length}</div></div>
      <div className="ft-kpi" style={{borderColor:'var(--azul)'}}><div className="ft-kpi-l" style={{color:'var(--azul)'}}>Fichas</div><div className="ft-kpi-v" style={{color:'var(--azul)'}}>{fichasCalc.length}</div></div>
      <div className="ft-kpi" style={{borderColor:'var(--coral)'}}><div className="ft-kpi-l" style={{color:'var(--coral)'}}>Pratos</div><div className="ft-kpi-v" style={{color:'var(--coral)'}}>{pratosCalc.length}</div></div>
      {pratosComPreco.length>0&&<><div className="ft-kpi" style={{borderColor:cmvColor(cmvMedio)}}><div className="ft-kpi-l" style={{color:cmvColor(cmvMedio)}}>CMV Médio</div><div className="ft-kpi-v" style={{color:cmvColor(cmvMedio)}}>{pct(cmvMedio)}</div></div>
      <div className="ft-kpi" style={{borderColor:'var(--cinzaE)'}}><div className="ft-kpi-l" style={{color:'var(--cinzaE)'}}>Custo Médio/Prato</div><div className="ft-kpi-v" style={{color:'var(--branco)'}}>{brl(custoMedio)}</div></div></>}
    </div>
    <div className="ft-pc">
      {categorias.map(cat=>{const pratos=pratosCalc.filter(p=>(p.categoria||'Sem categoria')===cat&&p.precoVenda>0);if(!pratos.length)return null;return(<div key={cat}>
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
        {[...fichasCalc].sort((a,b)=>b._custoPorKg-a._custoPorKg).slice(0,10).map((f,i)=>(<div key={f.id} style={{padding:'10px 14px',borderBottom:i<9?'1px solid var(--cinzaF)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:13,fontWeight:600}}>{f.nome}</span>
          <span style={{fontFamily:'var(--ff)',fontSize:14,fontWeight:700,color:'var(--coral)'}}>{brl(f._custoPorKg)}/kg</span>
        </div>))}
      </div></>}
    </div>
  </div>);
}

// ── ROOT ──────────────────────────────────────────────────────────
const TABS=[{id:'resumo',l:'RESUMO'},{id:'ingredientes',l:'INGREDIENTES'},{id:'fichas',l:'FICHAS'},{id:'pratos',l:'PRATOS'}];

export default function Fichas({onBack,token}){
  const[ingredientes,setIngredientes]=useState([]);
  const[fichasRaw,setFichasRaw]=useState([]);
  const[pratosRaw,setPratosRaw]=useState([]);
  const[loading,setLoading]=useState(true);
  const[syncing,setSyncing]=useState(false);
  const[aba,setAba]=useState('resumo');
  const[clienteFilter,setClienteFilter]=useState('');

  useEffect(()=>{loadAll();},[]);

  async function loadAll(){
    setLoading(true);
    let[ings,fics,prts]=await Promise.all([sbLoadAll('fin_ingredientes',token),sbLoad('fin_fichas',token),sbLoad('fin_pratos',token)]);
    // Se vazio, semear dados iniciais
    if(ings.length===0){
      setSyncing(true);
      const seedIngs=SEED_ING.map(i=>({...i,id:i.id||uid()}));
      await Promise.all(seedIngs.map(i=>sbInsertIng(i,token)));
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
  const fichasCalc=calcAllFichas(fichasRaw,ingredientes);
  const pratosCalc=pratosRaw.map(p=>calcPrato(p,ingredientes,fichasCalc));

  const sync=async fn=>{setSyncing(true);try{await fn();}finally{setSyncing(false);}};

  const saveIngrediente=async item=>{await sync(async()=>{await sbInsertIng(item,token);setIngredientes(p=>p.some(i=>i.id===item.id)?p.map(i=>i.id===item.id?item:i):[item,...p]);});};
  const delIngrediente=async id=>{await sync(async()=>{await fetch(`${SB_URL}/rest/v1/fin_ingredientes?id=eq.${id}`,{method:'DELETE',headers:sbH(token)});setIngredientes(p=>p.filter(i=>i.id!==id));});};

  const saveFicha=async item=>{await sync(async()=>{await sbUpsert('fin_fichas',item,item._cliente||'zeste',token);setFichasRaw(p=>p.some(f=>f.id===item.id)?p.map(f=>f.id===item.id?item:f):[item,...p]);});};
  const delFicha=async id=>{await sync(async()=>{await sbDel('fin_fichas',id,token);setFichasRaw(p=>p.filter(f=>f.id!==id));});};

  if(loading)return(<><style>{STYLE}</style><div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--cinzaF)'}}><div style={{textAlign:'center'}}><div style={{fontFamily:'var(--ff)',fontSize:32,fontWeight:800,color:'var(--verde)'}}>ZESTE</div><div style={{color:'var(--cinzaE)',fontSize:13,marginTop:4}}>Carregando fichas técnicas…</div></div></div></>);

  return(<>
    <style>{STYLE}</style>
    {syncing&&<div className="sync-ind"/>}
    <div style={{background:'var(--preto)',position:'sticky',top:0,zIndex:300}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {onBack&&<button onClick={onBack} style={{color:'var(--lima)',fontSize:24,lineHeight:1,minWidth:36,minHeight:36,display:'flex',alignItems:'center'}}>‹</button>}
          <div style={{display:'flex',alignItems:'baseline',gap:7}}><span style={{fontFamily:'var(--ff)',fontSize:20,fontWeight:800,color:'var(--lima)'}}>ZESTE</span><span style={{fontSize:9,color:'var(--cinzaE)',letterSpacing:'.14em'}}>FICHAS TÉCNICAS</span></div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {syncing&&<span style={{fontSize:10,color:'var(--lima)',fontFamily:'var(--ff)',fontWeight:700}}>SYNC…</span>}
          <button onClick={loadAll} style={{color:'var(--cinzaE)',fontSize:18,minWidth:36,minHeight:36,display:'flex',alignItems:'center',justifyContent:'center'}}>↻</button>
        </div>
      </div>
      <nav className="ft-nav">{TABS.map((t,i)=>(<span key={t.id}>{i>0&&<div style={{width:1,background:'#252525',margin:'10px 0',flexShrink:0}}/>}<div className={`ft-tab${aba===t.id?' on':''}`} onClick={()=>setAba(t.id)}>{t.l}</div></span>))}</nav>
    </div>
    {aba==='resumo'&&<TabResumo ingredientes={ingredientes} fichasCalc={fichasCalc} pratosCalc={pratosCalc}/>}
    {aba==='ingredientes'&&<TabIngredientes ingredientes={ingredientes} onSave={saveIngrediente} onDelete={delIngrediente}/>}
    {aba==='fichas'&&<TabFichas fichasCalc={fichasCalc} ingredientes={ingredientes} fichasRaw={fichasRaw} onSave={saveFicha} onDelete={delFicha} clienteFilter={clienteFilter}/>}
    {aba==='pratos'&&<TabPratos pratosCalc={pratosCalc} clienteFilter={clienteFilter}/>}
  </>);
}

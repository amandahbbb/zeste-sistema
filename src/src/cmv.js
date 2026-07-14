// ============================================================
// ZESTE — MOTOR CMV UNIFICADO
// Fonte única de verdade do cálculo de custo. Importado por
// Fichas.jsx e Engenharia.jsx — nunca duplicar estas funções.
//
// Regra de preço: se existe a versão do cliente de um ingrediente
// (mesmo nome, _cliente = cliente_id dele), usa o preço dela;
// senão usa a base 'zeste'. Admin (meuCli null) sempre usa a base.
// ============================================================

export function pickIngrediente(nome,ingredientes,meuCli){
  const mesmos=ingredientes.filter(i=>i.nome===nome);
  if(!mesmos.length)return null;
  const base=mesmos.find(i=>(i._cliente||'zeste')==='zeste')||mesmos[0];
  if(!meuCli||meuCli==='zeste')return{ref:base,precoBase:base.p||0,precoUsado:base.p||0,ehVersaoCliente:false};
  const daCliente=mesmos.find(i=>i._cliente===meuCli);
  if(daCliente)return{ref:daCliente,precoBase:base.p||0,precoUsado:daCliente.p||0,ehVersaoCliente:true};
  return{ref:base,precoBase:base.p||0,precoUsado:base.p||0,ehVersaoCliente:false};
}

export function calcFicha(ficha,ingredientes,fichas,meuCli){
  const itens=(ficha.itens||[]).map(it=>{
    let ref,precoKg,precoBase,ehVersaoCliente=false;
    if(it.tipo==='ficha'){
      ref=fichas.find(f=>f.nome===it.nomeRef);
      if(!ref)return{...it,custo:0,pesoFinal:0,erro:true};
      precoKg=ref._custoPorKg||0;precoBase=precoKg;
    }else{
      const pick=pickIngrediente(it.nomeRef,ingredientes,meuCli);
      if(!pick)return{...it,custo:0,pesoFinal:0,erro:true};
      ref=pick.ref;precoKg=pick.precoUsado||0;precoBase=pick.precoBase||0;ehVersaoCliente=pick.ehVersaoCliente;
    }
    // FC/FK: o valor definido NO ITEM da ficha (vindo da planilha/metodologia) tem prioridade;
    // sem override, usa o do cadastro do ingrediente. Fichas-componente não têm fator.
    const fc=it.tipo==='ficha'?1:(it.fc!=null&&it.fc!==''?+it.fc:(ref.fc||1));
    const fk=it.tipo==='ficha'?1:(it.fk!=null&&it.fk!==''?+it.fk:(ref.fk||1));
    const qtdLiq=Number(it.qtdLiquida)||0;
    const qtdBruta=qtdLiq*fc;
    const custo=qtdBruta*precoKg;
    const pesoFinal=qtdLiq*fk;
    return{...it,ref,qtdBruta,custo,pesoFinal,precoKg,precoBase,ehVersaoCliente,fc,fk};
  });
  const custoSomado=itens.reduce((s,i)=>s+i.custo,0);
  const pesoFinal=itens.reduce((s,i)=>s+i.pesoFinal,0);
  const margem=Number(ficha.margemSeguranca||0);
  const custoTotal=custoSomado*(1+margem);
  const custoPorKg=pesoFinal>0?custoTotal/pesoFinal:0;
  return{...ficha,itens,custoTotal,pesoFinal,_custoPorKg:custoPorKg};
}

export function calcAllFichas(fichasRaw,ingredientes,meuCli){
  const resolved=[];const nameMap=new Map();
  const resolve=(f)=>{
    if(nameMap.has(f.nome))return nameMap.get(f.nome);
    const calc=calcFicha(f,ingredientes,resolved,meuCli);
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

export function calcPrato(prato,ingredientes,fichas,meuCli){
  const comps=(prato.componentes||[]).map(c=>{
    let ref,custoPorKg,precoBase,ehVersaoCliente=false;
    if(c.tipo==='ficha'){
      ref=fichas.find(f=>f.nome===c.nomeRef);
      if(!ref)return{...c,custo:0,erro:true};
      custoPorKg=ref._custoPorKg||0;precoBase=custoPorKg;
    }else{
      const pick=pickIngrediente(c.nomeRef,ingredientes,meuCli);
      if(!pick)return{...c,custo:0,erro:true};
      ref=pick.ref;custoPorKg=pick.precoUsado||0;precoBase=pick.precoBase||0;ehVersaoCliente=pick.ehVersaoCliente;
    }
    const qtdKg=(Number(c.qtdGramas)||0)/1000;
    const fc=c.tipo==='ficha'?1:(c.fc!=null&&c.fc!==''?+c.fc:(ref.fc||1));
    const custo=qtdKg*fc*custoPorKg;
    return{...c,ref,custo,custoPorKg,precoBase,ehVersaoCliente,qtdKg};
  });
  // Margem de segurança do prato (a planilha usa 5%). Prato sem o campo = 0 (nada muda).
  const custoTotal=comps.reduce((s,c)=>s+c.custo,0)*(1+(+prato.margemSeguranca||0));
  const preco=Number(prato.precoVenda||0);
  const cmv=preco>0?custoTotal/preco:0;
  const margem=preco>0?(preco-custoTotal)/preco:0;
  const margemRS=preco-custoTotal;
  return{...prato,comps,custoTotal,cmv,margem,margemRS,preco,_custoPorKg:custoTotal/((comps.reduce((s,c)=>s+(c.qtdKg||0),0))||1)};
}

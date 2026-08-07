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
      const exato=it.ingId?ingredientes.find(g=>g.id===it.ingId):null;
      if(exato){ref=exato;precoKg=exato.p||0;precoBase=exato.p||0;}
      else{
        const pick=pickIngrediente(it.nomeRef,ingredientes,meuCli);
        if(!pick)return{...it,custo:0,pesoFinal:0,erro:true};
        ref=pick.ref;precoKg=pick.precoUsado||0;precoBase=pick.precoBase||0;ehVersaoCliente=pick.ehVersaoCliente;
      }
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
  const pesoCalculado=itens.reduce((s,i)=>s+i.pesoFinal,0);
  // TRAVAS DE SANIDADE: item com preço 0 (não tipo ficha) = custo incompleto; ref quebrada
  const itensSemPreco=itens.filter(i=>!i.erro&&i.tipo!=='ficha'&&!i.ref?.semCusto&&(!i.precoKg||i.precoKg<=0)).map(i=>i.nomeRef);
  const temRefQuebrada=itens.some(i=>i.erro);
  const custoIncompleto=itensSemPreco.length>0||temRefQuebrada;
  const margem=Number(ficha.margemSeguranca||0);
  const custoTotal=custoSomado*(1+margem);
  // Rendimento real (opcional): se preenchido, é a base de custo verdadeira —
  // resolve massa assada que perde água, sopa que reduz, etc. Vazio = soma dos itens (comportamento antigo).
  const rendManual=Number(ficha.rendReal)||0;
  const rendUnidade=ficha.rendUnidade||'kg';
  // pesoFinal em kg para o cálculo de custo/kg. Se o rendimento é em kg/L, usa direto;
  // se é em unidades/fatias, o peso continua vindo dos itens (custo/kg segue válido para quem usa a ficha como componente).
  const pesoFinal=(rendManual>0&&(rendUnidade==='kg'||rendUnidade==='L'))?rendManual:pesoCalculado;
  const custoPorKg=pesoFinal>0?custoTotal/pesoFinal:0;
  // Custo por unidade de rendimento (fatia, litro, porção) — só quando há rendimento manual.
  const custoPorRend=rendManual>0?custoTotal/rendManual:0;
  return{...ficha,itens,custoTotal,pesoFinal,pesoCalculado,_custoPorKg:custoPorKg,rendReal:rendManual||null,rendUnidade,custoPorRend,custoIncompleto,itensSemPreco,temRefQuebrada};
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
  // TRAVAS: componente sem preço / ref quebrada / ficha-componente com custo incompleto
  const compsSemPreco=comps.filter(c=>!c.erro&& !c.ref?.semCusto&&(!c.custoPorKg||c.custoPorKg<=0)).map(c=>c.nomeRef);
  const temRefQuebrada=comps.some(c=>c.erro);
  const custoIncompleto=compsSemPreco.length>0||temRefQuebrada;
  const preco=Number(prato.precoVenda||0);
  const semPreco=!(preco>0); // preço de venda não cadastrado (evita CMV 0% "excelente" falso)
  const cmv=preco>0?custoTotal/preco:0;
  const margem=preco>0?(preco-custoTotal)/preco:0;
  const margemRS=preco-custoTotal;
  // RENDIMENTO EM FATIAS/UNIDADES (confeitaria): deriva custo e preço por fatia de UM cadastro
  const rendFatias=Number(prato.rendFatias)||0;
  const custoFatia=rendFatias>0?custoTotal/rendFatias:0;
  const precoFatia=Number(prato.precoFatia)||0;
  const cmvFatia=(rendFatias>0&&precoFatia>0)?custoFatia/precoFatia:0;
  const margemFatiaRS=precoFatia-custoFatia;
  return{...prato,comps,custoTotal,cmv,margem,margemRS,preco,semPreco,custoIncompleto,compsSemPreco,temRefQuebrada,
    rendFatias,custoFatia,precoFatia,cmvFatia,margemFatiaRS,
    _custoPorKg:custoTotal/((comps.reduce((s,c)=>s+(c.qtdKg||0),0))||1)};
}

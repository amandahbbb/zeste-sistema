import { useState, useMemo, useEffect, useCallback } from "react";

// ─── PALETTE ────────────────────────────────────────────────────────────────
const C = {
  bg:"#0E0E0C", surface:"#1A1A17", card:"#222220", border:"#2E2E2A",
  yellow:"#C8F000", yellowDim:"#8FA715", orange:"#E8672A", red:"#D94040",
  green:"#2E8B57", blue:"#3A7BD5", purple:"#8B5CF6", teal:"#0D9488",
  text:"#E8E6DF", muted:"#888880", faint:"#555550",
  gold:"#F5D87A", offwhite:"#F2EBD8",
};

// ─── MANUAL DATA ─────────────────────────────────────────────────────────────
const MANUAL_SECTIONS = [
  {
    id:"filosofia", num:"01", label:"Filosofia",
    title:"FILOSOFIA COMERCIAL",
    sub:"De onde vem a autoridade da Zeste e como isso define cada conversa de venda",
    content: [
      { type:"quote", text:"A ZESTE NÃO VENDE CONSULTORIA. IDENTIFICA OPERAÇÕES COM POTENCIAL REAL E CONSTRÓI SOLUÇÕES QUE GERAM RETORNO MENSURÁVEL.", sub:"Essa distinção define o tom de cada conversa comercial — não estamos pedindo espaço, estamos oferecendo resultado." },
      { type:"p", text:"A maior vantagem competitiva da Zeste não está no método. Está em quem o aplica. <b>Bruna e Amanda já construíram e operaram negócios no setor</b> — viveram as mesmas pressões, tomaram as mesmas decisões difíceis e escolheram, em determinado momento, seguir um novo caminho. Não por fracasso — mas porque identificaram onde podiam gerar mais impacto: ajudando outros negócios a chegarem onde chegaram." },
      { type:"p", text:"Isso muda tudo numa conversa de venda. Não é teoria aplicada de fora — é vivência real de quem sabe o que é ter equipe que não performa, CMV fora do lugar, semana que não fecha. <b>Essa é a empatia que nenhum concorrente consegue simular.</b>" },
      { type:"tip", label:"Tom certo para falar sobre os negócios anteriores:", text:'"Eu e a Amanda já empreendemos no setor — construímos negócios, aprendemos muito com isso e, num determinado momento, escolhemos canalizar esse conhecimento para ajudar outros empreendedores a crescer com mais estrutura do que nós tínhamos." Nunca entrar em detalhes, nunca soar como superação de crise — soar como escolha estratégica consciente.' },
      { type:"sectionTitle", text:"OS 4 PRINCÍPIOS QUE GOVERNAM A VENDA" },
      { type:"principles", items:[
        { num:"01", color:C.yellow, title:"ESCUTAR PRIMEIRO", text:"A reunião de diagnóstico não é apresentação da Zeste. É investigação. Quanto mais o cliente fala, mais informação para construir a solução certa — e mais ele se convence sozinho." },
        { num:"02", color:C.orange, title:"SELECIONAR, NÃO EMPURRAR", text:"A Zeste escolhe com quem trabalha. Essa postura não é arrogância — é o que gera percepção de valor real. Nenhum desconto antes do cliente entender o que está comprando." },
        { num:"03", color:C.green, title:"NOMEAR O PROBLEMA ANTES DA SOLUÇÃO", text:"O cliente frequentemente sabe que algo está errado, mas não sabe o quê. Nomear a dor com precisão — antes de qualquer proposta — é o que cria o momento de virada numa reunião." },
        { num:"04", color:C.blue, title:"ROI, NÃO CUSTO", text:"Toda conversa sobre preço é reposicionada como conversa sobre retorno. O investimento na Zeste não é despesa — é estrutura que se paga. Sempre com exemplos concretos." },
      ]},
      { type:"sectionTitle", color:C.orange, text:"O QUE A ZESTE NÃO É" },
      { type:"warning", text:"Esses posicionamentos precisam ser evitados ativamente em toda comunicação comercial — são o que reduz percepção de valor e abre espaço para objeção de preço." },
      { type:"list", color:C.orange, items:[
        'Não somos "fazemos de tudo para restaurantes" — somos especialistas em estrutura, rentabilidade e operação',
        "Não somos baratos — somos o investimento que gera o maior retorno por real aplicado",
        "Não somos terceirizados — somos parceiros estratégicos com pele no jogo",
        "Não atendemos qualquer negócio — atendemos negócios com potencial real de evolução",
      ]},
    ],
  },
  {
    id:"posicionamento", num:"02", label:"Posicionamento",
    title:"POSICIONAMENTO DA BRUNA",
    sub:"Como se apresentar, qual autoridade comunicar e o que nunca dizer",
    content:[
      { type:"p", text:'O posicionamento pessoal da Bruna numa conversa comercial precisa combinar <b>credibilidade técnica, empatia de empreendedora e segurança consultiva</b>. Não é sobre impressionar — é sobre criar conexão genuína com quem já viveu pressão operacional.' },
      { type:"sectionTitle", text:"DIFERENCIAIS QUE PRECISAM APARECER" },
      { type:"diferenciais", items:[
        { bold:"Experiência como empreendedora do setor", text:"— já esteve do lado de quem recebe a consultoria. Sabe o que incomoda, o que resiste e o que transforma." },
        { bold:"Visão comercial + sensibilidade operacional", text:"— entende de venda, de cliente, de ticket médio e também de cozinha, processo e equipe." },
        { bold:"Cases reais recentes", text:"— a Amanda finalizou o pacote Performance de 5 novos pratos para o 440 Bebida Café em Balneário Camboriú. Resultado concreto, local, recente." },
        { bold:"Parceria com especialista técnica", text:"— não é só a Bruna. É a Bruna + Amanda. O cliente tem duas especialistas, não uma." },
      ]},
      { type:"sectionTitle", text:"COMO APRESENTAR A ZESTE EM 30 SEGUNDOS" },
      { type:"pitchCard", color:C.green, label:"VERSÃO PARA PRIMEIRO CONTATO (INSTAGRAM / ABORDAGEM DIRETA)", text:'"A Zeste é uma consultoria especializada em bares, restaurantes e cafés. Nosso foco é estrutura operacional e rentabilidade — ajudamos negócios que já têm essência a crescer com consistência. Eu e minha sócia Amanda já empreendemos no setor, então sabemos exatamente de onde vêm as dores que a maioria dos donos enfrenta."' },
      { type:"pitchCard", color:C.blue, label:"VERSÃO EXPANDIDA (REUNIÃO DE DIAGNÓSTICO)", text:'"Trabalhamos com bares, restaurantes e cafés que já têm identidade, já têm clientela — mas que percebem que algo na operação ou na rentabilidade não está no lugar certo. O que nos diferencia é que eu e a Amanda já vivemos esse lado. Já fomos empreendedoras do setor, passamos por reestruturação, por crise de caixa, por equipe que não performa. Então quando chegamos num negócio, não chegamos como consultoras de fora — chegamos como quem entende de verdade o que está em jogo."' },
      { type:"sectionTitle", color:C.orange, text:"ERROS DE POSICIONAMENTO — EVITAR SEMPRE" },
      { type:"naoNao", items:[
        { nao:'"Eu ainda estou começando, mas..."', sim:'"A Zeste está selecionando projetos iniciais com critério — queremos garantir resultado em cada operação que tocamos."' },
        { nao:'"Posso fazer um preço especial pra você."', sim:'"O valor reflete a profundidade da entrega. Posso ajustar escopo se necessário, mas o preço por prato do projeto se mantém."' },
        { nao:'"Você acha caro? Que valor você teria em mente?"', sim:'"Vamos entender juntos onde está o retorno — e por que esse investimento tem prazo pra se pagar."' },
        { nao:'"A gente pode tentar fazer isso também..."', sim:'"Isso está dentro do escopo do [serviço X]. Se precisar de algo além, estruturamos um adendo."' },
      ]},
      { type:"sectionTitle", color:C.teal, text:"FRASES DE POSICIONAMENTO PARA USAR NA REUNIÃO" },
      { type:"list", color:C.teal, items:[
        '"Cada negócio tem um diagnóstico diferente — não trabalho com solução padrão."',
        '"O objetivo do nosso trabalho é sempre que o projeto se pague — isso é o que me importa medir."',
        '"Escolho cuidadosamente os projetos em que me envolvo porque quero poder garantir resultado."',
        '"Já fui empreendedora desse segmento. Então o que estou propondo, eu já vivi do outro lado."',
        '"O 440 Bebida Café aqui em Balneário acabou de passar por um projeto de engenharia de cardápio com a gente. Posso te mostrar como foi estruturado."',
      ]},
    ],
  },
  {
    id:"perfil", num:"03", label:"Perfil Ideal",
    title:"PERFIL DE CLIENTE IDEAL",
    sub:"Com quem a Zeste trabalha — e com quem não trabalha",
    content:[
      { type:"p", text:"Clareza sobre o cliente ideal não é exclusão arbitrária — é o que permite atender melhor, entregar mais resultado e construir casos que atraem o próximo cliente certo." },
      { type:"p", text:"Todo empresário do setor tem problemas — isso é o normal, não a exceção. A Zeste não chega para julgar nem para apontar falhas. Chega para enxergar o <b>potencial que o dono já não consegue mais ver de dentro</b>, validar o que funciona e estruturar o que ainda pode crescer. Se não houver potencial real, não é o cliente ideal — simples assim." },
      { type:"sectionTitle", color:C.green, text:"SINAIS DE CLIENTE IDEAL" },
      { type:"diferenciais", items:[
        { bold:"Negócio com identidade e potencial real", text:"— tem conceito, tem clientela, tem algo genuíno que funciona. Não precisa faturar muito agora — precisa ter o que crescer." },
        { bold:"Empreendedor presente e comprometido", text:"— o dono está no dia a dia, quer entender, quer melhorar. Mesmo que esteja sobrecarregado, está aberto." },
        { bold:"Dor real reconhecida", text:"— sabe que algo está errado (CMV alto, equipe sem padrão, cardápio sem engenharia). Não precisa ser convencido de que tem problema." },
        { bold:"Disposição real para mudança", text:"— incluindo investir em capacitação de equipe, reestruturação de processos ou equipamentos quando for necessário para a entrega. Não está comprando validação — está comprando transformação." },
        { bold:"Potencial subutilizado", text:"— o critério não é faturamento atual, é o quanto ainda não está sendo aproveitado. Negócios que usam menos da metade do potencial que têm são exatamente onde a Zeste gera mais resultado." },
        { bold:"Localização ou contexto", text:"— preferencialmente SC (Balneário, Floripa, Itajaí) no início, para facilitar presença e construção de cases locais." },
      ]},
      { type:"sectionTitle", color:C.orange, text:"SINAIS DE DESALINHAMENTO — AVALIAR COM CUIDADO" },
      { type:"diferenciais", color:C.orange, items:[
        { bold:'Dono que quer "só uma olhada rápida"', text:"— não reconhece a profundidade do problema. Pode mudar de ideia após o diagnóstico, mas exige atenção." },
        { bold:"Negócio em crise aguda de caixa", text:"— não é descarte automático. Pode ser abordado com escopo menor, geração de caixa rápida como ponto de entrada. Avaliar caso a caso." },
        { bold:"Empreendedor que quer validação, não evolução", text:"— vai resistir a qualquer mudança sugerida. Se o potencial do negócio for alto, vale uma segunda conversa. Se for padrão, seguir em frente." },
        { bold:"Decisor ausente", text:"— reunião com gerente ou sócio sem poder de decisão. Não avançar sem o decisor na mesa." },
      ]},
      { type:"tip", label:"Regra prática:", text:"o cliente ideal não precisa estar bem — precisa ter potencial real e querer chegar lá. A Zeste entra para nomear o que está travando, validar o que já funciona e construir junto. Se o negócio não tiver nada genuíno que vale preservar e crescer, não é o projeto certo." },
    ],
  },
  {
    id:"fluxo", num:"04", label:"Fluxo Comercial",
    title:"FLUXO COMERCIAL",
    sub:"Do primeiro contato ao onboarding — cada etapa com objetivo claro",
    content:[
      { type:"flowSteps", items:[
        { num:"01", color:C.yellow, title:"PROSPECÇÃO E PRIMEIRO CONTATO", text:"Instagram orgânico, abordagem direta ou indicação. Objetivo: gerar curiosidade, não vender. Mensagem personalizada para o negócio, nunca template genérico." },
        { num:"02", color:C.orange, title:"QUALIFICAÇÃO RÁPIDA (WHATSAPP · 5–10 MIN)", text:"3 perguntas: tipo de negócio, principal dificuldade hoje, se está aberto a uma conversa de diagnóstico. Não qualificou → não agenda reunião." },
        { num:"03", color:C.orange, title:"CONVITE PARA UM ENCONTRO", text:'"Que tal a gente se encontrar pessoalmente? Quero te conhecer melhor, entender como funciona a sua operação e ver onde podemos somar." Sem formalidade — um encontro, não uma reunião de vendas. Presencial preferencial.' },
        { num:"04", color:C.yellow, title:"ENCONTRO DE DIAGNÓSTICO (1ª VISITA)", text:"Tom: conversa entre pares, não entrevista. Quebra-gelo → história do negócio → investigação de dores → validação genuína das qualidades → nomeação das oportunidades. Gerar empatia primeiro — todo empresário tem dificuldades, não existe operação perfeita. A Zeste está aqui para somar." },
        { num:"05", color:C.yellow, title:"ELABORAÇÃO DA PROPOSTA (ATÉ 24–48H)", text:"Amanda revisa escopo técnico. Bruna estrutura o documento. PDF visual com: diagnóstico identificado, solução recomendada, entregas, prazo, investimento e condições (50% entrada)." },
        { num:"06", color:C.blue, title:"2ª VISITA — APRESENTAÇÃO PRESENCIAL DA PROPOSTA", text:'Conversa rápida de 10–15 minutos. Ideal para fechar com muito mais naturalidade do que por WhatsApp. "Quero te apresentar pessoalmente o que estruturei para você." Não é reunião formal — é continuidade do encontro.' },
        { num:"07", color:C.blue, title:"FOLLOW-UPS ESTRUTURADOS", text:"Sequência definida: 2 dias, 5 dias, 10 dias. Cada follow-up com ângulo diferente. Máximo 3 contatos — depois encerrar sem pressão e marcar para retomar em 30 dias." },
        { num:"08", color:C.green, title:"FECHAMENTO", text:"Contrato assinado + 50% de entrada recebido = projeto iniciado. Sem exceção. Confirmar forma de pagamento, prazo de início e kick-off." },
        { num:"09", color:C.green, title:"ONBOARDING / KICK-OFF", text:"Reunião de início: apresentar Amanda, alinhar cronograma, entregáveis e canal de comunicação do projeto. Fazer o cliente sentir que comprou segurança, não só serviço." },
      ]},
    ],
  },
  {
    id:"diagnostico", num:"05", label:"Diagnóstico",
    title:"CHECKLIST DE DIAGNÓSTICO",
    sub:"O que observar, investigar e registrar na visita — antes de qualquer proposta",
    content:[
      { type:"p", text:"O checklist é o instrumento de coleta da visita. Não precisa ser preenchido na frente do cliente — mas tudo precisa ser mentalmente mapeado e registrado logo após a reunião para embasar a proposta." },
      { type:"checklist", items:[
        { title:"CONCEITO E POSICIONAMENTO", text:"O negócio tem identidade clara? O cliente sabe quem é seu público? Existe coerência entre conceito, cardápio e comunicação?" },
        { title:"CARDÁPIO E ENGENHARIA", text:"Quantos itens? Existe análise de margem por prato? Há itens mortos (baixa venda + baixa margem)? O cardápio tem lógica estratégica?" },
        { title:"PRECIFICAÇÃO E CMV", text:"O dono conhece o CMV real? Como os preços são formados? Existe FT (ficha técnica) para os pratos? O CMV está dentro da meta do segmento?" },
        { title:"FLUXO OPERACIONAL", text:"Existe mise en place padronizada? Há MOP (modo operacional padrão) para os processos críticos? Como é a produção nos horários de pico?" },
        { title:"EQUIPE E TREINAMENTO", text:"Quantas pessoas na operação? Existe onboarding para novos colaboradores? Qual o maior gargalo de equipe — cozinha ou salão?" },
        { title:"ATENDIMENTO E EXPERIÊNCIA", text:"Como o cliente descreve a experiência hoje? Há padronização no atendimento? Existe gestão de avaliações (Google, Instagram)?" },
        { title:"MARKETING E PRESENÇA DIGITAL", text:"Instagram ativo e coerente com o conceito? Há tráfego pago? O negócio aparece bem no Google Maps? Existe estratégia de conteúdo?" },
        { title:"INDICADORES E CONTROLE", text:"O dono acompanha ticket médio, faturamento por período, custo de mão de obra? Usa algum sistema de gestão? Existe DRE simplificado?" },
      ]},
      { type:"sectionTitle", color:C.green, text:"APÓS O DIAGNÓSTICO — O QUE REGISTRAR" },
      { type:"diferenciais", color:C.green, items:[
        { bold:"3 pontos fortes genuínos", text:"— que serão citados na recapitulação com o cliente" },
        { bold:"2–3 oportunidades prioritárias", text:"— que embasam a proposta" },
        { bold:"Nível de urgência percebido", text:"— o cliente quer resolver agora ou está explorando?" },
        { bold:"Objeções que já apareceram", text:"— preço, timing, desconfiança? Melhor mapear antes da proposta." },
      ]},
    ],
  },
  {
    id:"perguntas", num:"06", label:"Perguntas",
    title:"PERGUNTAS ESTRATÉGICAS",
    sub:"As perguntas que abrem o cliente, revelam a dor e criam o momento de virada",
    content:[
      { type:"p", text:"As melhores perguntas de diagnóstico não parecem perguntas de venda — parecem curiosidade genuína. Cada uma aqui tem um objetivo específico. Use-as com naturalidade, sem checklist na mão." },
      { type:"perguntaGroup", icon:"🔍", color:C.yellow, label:"ABERTURA E CONTEXTO", items:[
        { q:"O que motivou você a criar esse negócio? Como ele nasceu?", obj:"Construir rapport, entender o sonho original. O dono que reconecta com o porquê fica mais aberto a transformação." },
        { q:"Onde você imagina esse negócio daqui a 3 anos?", obj:"Entender ambição real. Se a visão for clara, o gap entre onde está e onde quer chegar se torna o argumento de venda." },
        { q:"O que você mudaria na operação se pudesse apertar um botão agora?", obj:"Revelar a dor mais consciente. A resposta costuma ser a porta de entrada para a solução certa." },
      ]},
      { type:"perguntaGroup", icon:"💰", color:C.gold, label:"FINANCEIRO E RENTABILIDADE", items:[
        { q:"Você sabe qual é a margem real dos seus pratos mais vendidos?", obj:"Revelar se há gestão de CMV. A maioria não sabe — e esse é um dos maiores pontos de sangramento silencioso." },
        { q:"Você sente que o faturamento cresceu mas o lucro não acompanhou?", obj:'Diagnosticar o clássico "fatura mais, sobra menos". Muito comum — e muito emocional para o empreendedor.' },
        { q:"Como você formou o preço dos itens do cardápio?", obj:"Entender se existe método ou se foi intuitivo. Resposta intuitiva = oportunidade enorme de melhoria." },
      ]},
      { type:"perguntaGroup", icon:"⚙️", color:C.blue, label:"OPERAÇÃO E PROCESSOS", items:[
        { q:"Quais processos mais consomem energia da sua equipe hoje?", obj:"Identificar gargalos operacionais. Resposta revela onde está o maior desperdício de tempo e dinheiro." },
        { q:"O que acontece com a operação quando você não está presente?", obj:'Mapear dependência do dono. Se a resposta for "piora muito" — é exatamente o que a Zeste resolve.' },
        { q:"Você tem fichas técnicas dos seus pratos? E elas são usadas no dia a dia?", obj:"Diagnóstico rápido de padronização. FT inexistente ou ignorada = prato inconsistente = reclamação de cliente." },
      ]},
      { type:"perguntaGroup", icon:"👥", color:C.teal, label:"EQUIPE E EXPERIÊNCIA", items:[
        { q:"Qual é o maior desafio na gestão da equipe hoje?", obj:"Revelar dor de RH. Frequentemente a raiz de inconsistência no atendimento e na produção." },
        { q:"Como você gostaria que um cliente descrevesse a experiência aqui para um amigo?", obj:"Entender o ideal do empreendedor. O gap entre esse ideal e a realidade percebida é o argumento mais poderoso da reunião." },
      ]},
    ],
  },
  {
    id:"solucao", num:"07", label:"Solução",
    title:"APRESENTAÇÃO DA SOLUÇÃO",
    sub:"Como conduzir da dor identificada ao serviço certo — sem parecer venda",
    content:[
      { type:"p", text:"A apresentação da solução nunca começa com o cardápio de serviços. Começa com a <b>recapitulação do que o cliente disse</b> — em suas próprias palavras. Isso cria espelhamento, confiança e a sensação de que a proposta foi feita especificamente para aquele negócio." },
      { type:"sectionTitle", text:"ESTRUTURA DA APRESENTAÇÃO" },
      { type:"flowSteps", items:[
        { num:"01", color:C.yellow, title:"RECONHECER O QUE FUNCIONA", text:'Sempre começa pelo positivo genuíno. Não elogio vazio — ponto forte específico que foi observado. "O conceito de vocês tem uma coerência muito interessante. Dá pra sentir que existe uma identidade real aqui."' },
        { num:"02", color:C.orange, title:"NORMALIZAR E CRIAR EMPATIA", text:'"Todo empresário do setor que conheço tem pelo menos um desses pontos travado — não é exceção, é o padrão. É difícil enxergar de dentro o que precisa mudar quando você está dentro todos os dias." Isso baixa a guarda e abre o cliente para ouvir.' },
        { num:"03", color:C.yellow, title:"VALIDAR O QUE TEM DE GENUÍNO", text:'Antes de qualquer diagnóstico de problema — apontar o que funciona de verdade. Ponto forte específico, não elogio genérico. "Tem uma coerência de conceito aqui que a maioria dos negócios não tem. Isso é difícil de construir e vocês já têm."' },
        { num:"04", color:C.orange, title:"NOMEAR O PROBLEMA COM PRECISÃO", text:'"Pelo que você me descreveu, não parece falta de cliente. Parece uma operação que cresceu mais rápido do que a estrutura conseguiu acompanhar."' },
        { num:"05", color:C.yellow, title:"VALIDAR COM O CLIENTE", text:'"Faz sentido esse diagnóstico pra você?" Se o cliente diz sim, ele acabou de concordar com o problema. Agora está pronto para ouvir a solução.' },
        { num:"06", color:C.green, title:"APRESENTAR O SERVIÇO COMO RESPOSTA AO PROBLEMA", text:'"O que faz sentido aqui é o [serviço], porque ele resolve exatamente [dor identificada]." Máximo 2 opções — mais do que isso confunde. Atenção especial: se a maior dor for falta de público, o Performance entra como estratégia de divulgação.' },
        { num:"07", color:C.blue, title:"CONECTAR AO RETORNO ESPERADO", text:'"Com CMV ajustado de 38% para 30% num faturamento de R$80k, estamos falando de R$6.400/mês de diferença. O projeto se paga em menos de 2 meses."' },
        { num:"08", color:C.green, title:"FECHAR COM PRÓXIMO PASSO CLARO", text:'"Faz sentido eu estruturar uma proposta com tudo isso e passar aqui pessoalmente pra te mostrar?" Não perguntar se quer contratar — perguntar se quer ver a proposta, pessoalmente. Passo menor, resistência menor.' },
      ]},
    ],
  },
  {
    id:"followup", num:"08", label:"Follow-Up",
    title:"ESTRATÉGIA DE FOLLOW-UP",
    sub:"Como manter contato sem parecer desesperada — cada mensagem com ângulo diferente",
    content:[
      { type:"p", text:"O follow-up é onde a maioria das consultorias perde negócios — ou por não fazer, ou por fazer de forma genérica e mecânica. Cada contato precisa ter um <b>ângulo diferente</b> e entregar algo de valor, não só \"lembrar que existe\"." },
      { type:"sectionTitle", color:C.yellow, text:"SEQUÊNCIA PÓS-REUNIÃO" },
      { type:"followupSteps", items:[
        { day:"D+1", color:C.yellow, title:"MENSAGEM DE REFORÇO (24H APÓS REUNIÃO)", text:"Agradecer a conversa + reforçar 1 ponto específico que você identificou + confirmar envio da proposta. Mostra que você estava prestando atenção — não é mensagem de template." },
        { day:"D+2", color:C.orange, title:"ENVIO DA PROPOSTA COM CONTEXTUALIZAÇÃO", text:'"Estruturei a proposta com base exatamente no que conversamos. O foco está em [dor principal]. Fico disponível para qualquer dúvida."' },
        { day:"D+4", color:C.yellow, title:"FOLLOW-UP DE ANÁLISE (ÂNGULO: DÚVIDA)", text:'"Oi [Nome], conseguiu dar uma olhada com calma? Se tiver qualquer ponto que queira aprofundar ou ajustar no escopo, fico à disposição."' },
        { day:"D+9", color:C.blue, title:"FOLLOW-UP DE VALOR (ÂNGULO: INSIGHT)", text:'"Lembrei do que você me contou sobre o CMV e encontrei isso..." Não vender — só ser útil.' },
        { day:"D+30", color:C.green, title:"RETOMADA DE LONGO PRAZO", text:'"Passando pra dar um oi e ver como as coisas estão na operação. Se em algum momento fizer sentido retomar a conversa, estou por aqui."' },
      ]},
      { type:"sectionTitle", color:C.orange, text:"REGRAS DO FOLLOW-UP" },
      { type:"list", color:C.orange, items:[
        "Máximo 3 contatos proativos após a proposta — depois só reagir",
        "Cada contato com ângulo diferente: dúvida → valor → retomada",
        '"Nunca "só queria saber se pensou" sem acrescentar nada',
        "Nunca reduzir preço no follow-up sem o cliente pedir — sinaliza desespero",
        "Se o cliente sumiu após o D+9: marcar para retomada em 30 dias e seguir em frente",
      ]},
    ],
  },
  {
    id:"kpis", num:"09", label:"KPIs",
    title:"KPIS COMERCIAIS",
    sub:"O que medir, com que frequência e o que fazer quando o número não bate",
    content:[
      { type:"p", text:"Métricas comerciais sem ação são só números. Cada KPI aqui tem uma meta de referência para os primeiros 90 dias e uma ação corretiva quando fica abaixo." },
      { type:"kpiTable", items:[
        { metric:"Taxa de resposta ao primeiro contato", meta:"> 30%", freq:"Semanal", acao:"Revisar abordagem inicial — personalização, gancho, canal usado" },
        { metric:"Taxa de agendamento (resposta → reunião)", meta:"> 50%", freq:"Semanal", acao:"Melhorar qualificação prévia · ajustar proposta de valor da reunião" },
        { metric:"Taxa de proposta (reunião → proposta enviada)", meta:"> 70%", freq:"Quinzenal", acao:"Revisar estrutura de diagnóstico — pode estar saindo sem criar urgência suficiente" },
        { metric:"Taxa de conversão (proposta → fechamento)", meta:"> 35%", freq:"Mensal", acao:"Revisar tratamento de objeções · verificar se proposta está clara sobre ROI" },
        { metric:"Ticket médio dos projetos fechados", meta:"Conforme tabela", freq:"Mensal", acao:"Verificar se está dando desconto antes da hora ou subofertando serviços" },
        { metric:"Tempo médio de fechamento", meta:"< 14 dias", freq:"Mensal", acao:"Verificar se o follow-up está sendo feito — leads esquecidos aumentam esse número" },
        { metric:"Volume de leads ativos no pipeline", meta:"≥ 5 simultâneos", freq:"Semanal", acao:"Ativar prospecção ativa · aumentar verba de anúncios se disponível" },
        { metric:"NPS / satisfação dos projetos entregues", meta:"≥ 9/10", freq:"Por projeto", acao:"Reunião de análise com Amanda — identificar o que falhou na expectativa vs entrega" },
      ]},
      { type:"tip", label:"Como usar:", text:"Bruna atualiza a planilha de pipeline semanalmente. A revisão de KPIs acontece toda segunda-feira no alinhamento semanal com Amanda — 10 minutos, dados em mãos. Se dois KPIs críticos estiverem abaixo da meta por 2 semanas seguidas → reunião estratégica para revisar abordagem." },
    ],
  },
];

// ─── CRM DATA ────────────────────────────────────────────────────────────────
const SB_URL = "https://fayysxmtzdqtplyoeowk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZheXlzeG10emRxdHBseW9lb3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzA4NDUsImV4cCI6MjA5NTU0Njg0NX0.K9zKHu7StPynJw5sTyn6MEGG2_K3eTSYSw1R9fqIGrE";
const TABLE = "crm_contatos";

async function sbLoad(token) {
  const h = {"Content-Type":"application/json", apikey: SB_KEY, ...(token && {Authorization:`Bearer ${token}`})};
  const r = await fetch(`${SB_URL}/rest/v1/${TABLE}?deleted_at=is.null&order=created_at.asc&select=id,data`, {headers: h});
  const rows = await r.json();
  return Array.isArray(rows) ? rows.map(r => ({...r.data, _sbid: r.id})) : [];
}

async function sbUpsert(contact, token) {
  const h = {"Content-Type":"application/json", apikey: SB_KEY, Prefer:"resolution=merge-duplicates", ...(token && {Authorization:`Bearer ${token}`})};
  const {_sbid, ...data} = contact;
  if (_sbid) {
    await fetch(`${SB_URL}/rest/v1/${TABLE}?id=eq.${_sbid}`, {method:"PATCH", headers: h, body: JSON.stringify({data, updated_at: new Date().toISOString()})});
    return _sbid;
  } else {
    const r = await fetch(`${SB_URL}/rest/v1/${TABLE}`, {method:"POST", headers:{...h, Prefer:"return=representation"}, body: JSON.stringify({data})});
    const rows = await r.json();
    return rows?.[0]?.id;
  }
}

async function sbDelete(sbid, token) {
  const h = {"Content-Type":"application/json", apikey: SB_KEY, ...(token && {Authorization:`Bearer ${token}`})};
  await fetch(`${SB_URL}/rest/v1/${TABLE}?id=eq.${sbid}`, {method:"PATCH", headers: h, body: JSON.stringify({deleted_at: new Date().toISOString()})});
}
const STAGES = ["Prospects","Leads","Negociação / Proposta","Cliente","Portas Fechadas"];
const STAGE_META = {
  "Prospects":             { color:"#A8C5DA44", accent:"#4A90B8", icon:"◎" },
  "Leads":                 { color:"#F5D87A44", accent:"#C9A227", icon:"◑" },
  "Negociação / Proposta": { color:"#F0A86844", accent:"#D4762A", icon:"◕" },
  "Cliente":               { color:"#7EC8A044", accent:"#2E8B57", icon:"●" },
  "Portas Fechadas":       { color:"#C4B5C044", accent:"#7D6B75", icon:"✕" },
};
const SEGMENTOS = ["Restaurante","Cafeteria","Padaria","Rotisserie","Dark Kitchen","Delivery","Franquia","Bar","Confeitaria","Catering","Outro"];
const TEMPERATURAS = { quente: { l: "🔥 Quente", cor: "#E8614B" }, morno: { l: "🌤 Morno", cor: "#E8B04B" }, frio: { l: "❄ Frio", cor: "#6A9AC8" }, "sem-aderencia": { l: "— Sem aderência", cor: "#7A7A6E" }, "nao-retornar": { l: "🚫 Não retornar", cor: "#5A5A55" } };
const ORIGENS = ["Prospecção digital","Prospecção presencial","Rota comercial","Lead passivo","Indicação","Parceria","Reativação"];
const PROXIMOS_OPTIONS = [
  {id:"pp1",emoji:"📄",label:"Enviar proposta"},
  {id:"pp2",emoji:"📅",label:"Agendar follow-up"},
  {id:"pp3",emoji:"📊",label:"Enviar apresentação"},
  {id:"pp4",emoji:"🔁",label:"Retornar contato"},
  {id:"pp5",emoji:"✍️",label:"Aguardar feedback"},
  {id:"pp6",emoji:"📝",label:"Enviar contrato"},
  {id:"pp7",emoji:"🎓",label:"Agendar onboarding"},
  {id:"pp8",emoji:"💬",label:"Alinhar internamente"},
];
const DIAG_BLOCKS = [
  { id:"negocio",icon:"🏢",label:"Negócio & Empresário",color:"#F3EEFF",accent:"#8B5CF6",
    items:[{id:"n1",label:"Modelo de negócio e segmento",desc:"Delivery, presencial, dark kitchen..."},{id:"n2",label:"Tempo de operação e histórico",desc:"Quando abriu, expansões"},{id:"n3",label:"Principais dores do negócio",desc:"O que mais trava o crescimento"},{id:"n4",label:"Dores pessoais do empresário",desc:"Estresse, dependência operacional"},{id:"n5",label:"Objetivos e visão de futuro",desc:"Onde quer chegar em 12 meses"},{id:"n6",label:"Faturamento e indicadores",desc:"Ticket médio, volume, CMV"}]},
  { id:"equipe",icon:"👥",label:"Equipe & Gestão",color:"#EAF3FF",accent:"#2563EB",
    items:[{id:"e1",label:"Estrutura e tamanho da equipe",desc:"Quantos, cargos e funções"},{id:"e2",label:"Qualificação técnica",desc:"Nível de preparo, experiência, gaps"},{id:"e3",label:"Turnover e clima",desc:"Rotatividade, engajamento"},{id:"e4",label:"Onboarding e treinamento",desc:"Como novos são integrados"},{id:"e5",label:"Liderança e gestão",desc:"Quem coordena no dia a dia"}]},
  { id:"cozinha",icon:"🍳",label:"Cozinha & Equipamentos",color:"#FFFBEA",accent:"#D97706",
    items:[{id:"c1",label:"Layout e dimensionamento",desc:"Espaço, fluxo, setores"},{id:"c2",label:"Estado dos equipamentos",desc:"Conservação, capacidade"},{id:"c3",label:"Estoque e armazenamento",desc:"Organização, PVPS, temperatura"},{id:"c4",label:"Higiene e sanitização",desc:"Protocolos de limpeza"},{id:"c5",label:"Fichas técnicas",desc:"Receitas documentadas, gramagens"}]},
  { id:"fluxo",icon:"🔄",label:"Fluxo da Cozinha",color:"#EAFAF3",accent:"#059669",
    items:[{id:"fk1",label:"Pré-preparo e mise en place",desc:"Organização antes do serviço"},{id:"fk2",label:"Gestão de picos",desc:"Como a cozinha responde"},{id:"fk3",label:"Comunicação entre praças",desc:"Comandas, KDS"},{id:"fk4",label:"Controle de desperdício",desc:"Aproveitamento, descarte"},{id:"fk5",label:"Tempo de preparo e SLA",desc:"Tempo médio por prato"}]},
  { id:"operacao",icon:"⚙️",label:"Fluxo da Operação",color:"#EEF0FF",accent:"#4F46E5",
    items:[{id:"fo1",label:"Abertura e fechamento",desc:"Checklists, responsáveis"},{id:"fo2",label:"Gestão de pedidos",desc:"Sistemas usados, erros frequentes"},{id:"fo3",label:"Compras e fornecedores",desc:"Frequência, negociação"},{id:"fo4",label:"Gestão financeira e DRE",desc:"Controle de custos, CMV"},{id:"fo5",label:"Indicadores acompanhados",desc:"Quais métricas monitora"}]},
  { id:"atendimento",icon:"🤝",label:"Atendimento & Experiência",color:"#FFF0F3",accent:"#E11D48",
    items:[{id:"a1",label:"Padrão de atendimento",desc:"Script, treinamento, identidade"},{id:"a2",label:"Experiência no salão",desc:"Acolhimento, tempo, ambiente"},{id:"a3",label:"Experiência no delivery",desc:"Embalagem, temperatura, prazo"},{id:"a4",label:"Gestão de reclamações",desc:"Como problemas são tratados"},{id:"a5",label:"Presença digital",desc:"Google, iFood, Instagram"}]},
];
const FICHA_FIELDS = [
  {key:"decisor",label:"Decisor / Sócio responsável",big:false},
  {key:"orcamento",label:"Orçamento Estimado",big:false},
  {key:"prazo",label:"Prazo de Decisão",big:false},
  {key:"telefone2",label:"Telefone adicional",big:false},
  {key:"dores",label:"Principais Dores",big:true},
  {key:"objetivo",label:"Objetivo com a Zeste",big:true},
  {key:"obs",label:"Observações Gerais",big:true},
];
function makeEmpty(){return{id:Date.now(),name:"",company:"",stage:"Prospects",email:"",phone:"",segmento:"",endereco:"",bairro:"",regiao:"",proximaReuniao:"",tipoReuniao:"Reunião",horarioReuniao:"",diagChecklist:{},diagNotes:{},proximosPassos:{},ficha:{},historico:[]};}
function getTotals(dc){const total=DIAG_BLOCKS.reduce((s,b)=>s+b.items.length,0);const done=DIAG_BLOCKS.reduce((s,b)=>s+b.items.filter(i=>dc?.[i.id]).length,0);return{total,done,pct:total===0?0:Math.round((done/total)*100)};}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const inp = {width:"100%",padding:"8px 10px",borderRadius:7,border:"1px solid #333",background:"#1A1A17",fontFamily:"inherit",fontSize:13,color:C.text,boxSizing:"border-box",outline:"none"};
const lbl = {display:"block",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4};

// ─── RING ─────────────────────────────────────────────────────────────────────
function Ring({pct,accent,size=38,stroke=5}){const r=(size-stroke*1.4)/2,circ=2*Math.PI*r,dash=(pct/100)*circ;return(<svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2A2A28" strokeWidth={stroke}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={accent} strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray 0.4s"}}/></svg>);}

// ─── MANUAL RENDERERS ─────────────────────────────────────────────────────────
function RenderBlock({block}){
  const [checks,setChecks]=useState({});
  return block.content.map((b,i)=>{
    if(b.type==="p") return <p key={i} style={{fontSize:14,lineHeight:1.75,color:"#C8C6BE",margin:"0 0 16px"}} dangerouslySetInnerHTML={{__html:b.text}}/>;
    if(b.type==="quote") return <div key={i} style={{borderLeft:`4px solid ${C.yellow}`,background:"#1C1C19",padding:"18px 20px",borderRadius:"0 10px 10px 0",margin:"0 0 20px"}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:C.text,lineHeight:1.4,marginBottom:8,textTransform:"uppercase"}}>{b.text}</div><div style={{fontStyle:"italic",color:C.muted,fontSize:13}}>{b.sub}</div></div>;
    if(b.type==="tip") return <div key={i} style={{background:"#1A2A1A",border:"1px solid #2E4A2E",borderRadius:10,padding:"14px 16px",margin:"16px 0"}}><span style={{color:C.yellow,fontWeight:700,fontSize:13}}>💡 {b.label} </span><span style={{color:"#8EC98E",fontSize:13,fontStyle:"italic"}}>{b.text}</span></div>;
    if(b.type==="warning") return <div key={i} style={{background:"#2A1A14",border:"1px solid #4A2A1A",borderRadius:10,padding:"14px 16px",margin:"16px 0",display:"flex",gap:10,alignItems:"flex-start"}}><span style={{fontSize:16}}>⚠️</span><span style={{color:"#E8A87A",fontSize:13,fontStyle:"italic"}}>{b.text}</span></div>;
    if(b.type==="sectionTitle") return <div key={i} style={{display:"flex",alignItems:"center",gap:10,margin:"24px 0 14px"}}><div style={{flex:1,height:1,background:"#2A2A28"}}/><span style={{fontSize:10,fontWeight:700,color:b.color||C.yellow,letterSpacing:"0.1em",whiteSpace:"nowrap"}}>{b.text}</span><div style={{flex:1,height:1,background:"#2A2A28"}}/></div>;
    if(b.type==="list") return <div key={i} style={{margin:"0 0 20px"}}>{b.items.map((it,j)=><div key={j} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:"1px solid #1E1E1C"}}><span style={{color:b.color||C.orange,fontSize:14,flexShrink:0,marginTop:1}}>→</span><span style={{fontSize:13,color:"#C8C6BE",lineHeight:1.6}}>{it}</span></div>)}</div>;
    if(b.type==="principles") return <div key={i} style={{display:"flex",flexDirection:"column",gap:10,margin:"0 0 20px"}}>{b.items.map((p,j)=><div key={j} style={{borderLeft:`4px solid ${p.color}`,background:"#1A1A17",borderRadius:"0 10px 10px 0",padding:"14px 16px"}}><div style={{fontSize:10,fontWeight:700,color:p.color,letterSpacing:"0.1em",marginBottom:4}}>PRINCÍPIO {p.num}</div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:15,color:C.text,marginBottom:6,textTransform:"uppercase"}}>{p.title}</div><div style={{fontSize:13,color:"#B0AEA8",lineHeight:1.6}}>{p.text}</div></div>)}</div>;
    if(b.type==="diferenciais") return <div key={i} style={{margin:"0 0 20px"}}>{b.items.map((it,j)=><div key={j} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:"1px solid #1E1E1C"}}><span style={{color:b.color||C.green,fontSize:14,flexShrink:0,marginTop:1}}>→</span><div style={{fontSize:13,color:"#C8C6BE",lineHeight:1.6}}><b style={{color:C.text}}>{it.bold}</b> {it.text}</div></div>)}</div>;
    if(b.type==="pitchCard") return <div key={i} style={{borderLeft:`4px solid ${b.color}`,background:"#1A1A17",borderRadius:"0 10px 10px 0",padding:"14px 16px",margin:"12px 0"}}><div style={{fontSize:10,fontWeight:700,color:b.color,letterSpacing:"0.08em",marginBottom:8}}>{b.label}</div><div style={{fontSize:13,color:"#B0AEA8",fontStyle:"italic",lineHeight:1.7}}>{b.text}</div></div>;
    if(b.type==="naoNao") return <div key={i} style={{display:"flex",flexDirection:"column",gap:0,margin:"0 0 20px",border:"1px solid #2A2A28",borderRadius:10,overflow:"hidden"}}>{b.items.map((it,j)=><><div key={`n${j}`} style={{padding:"11px 14px",background:"#1E1A1A",borderBottom:"1px solid #2A2A28"}}><div style={{fontSize:10,fontWeight:700,color:C.red,letterSpacing:"0.08em",marginBottom:4}}>✗ NÃO DIZER</div><div style={{fontSize:13,color:"#C0B0A8",fontStyle:"italic"}}>{it.nao}</div></div><div key={`s${j}`} style={{padding:"11px 14px",background:"#1A1E1A",borderBottom:j<b.items.length-1?"1px solid #2A2A28":"none"}}><div style={{fontSize:10,fontWeight:700,color:C.green,letterSpacing:"0.08em",marginBottom:4}}>✓ DIZER EM VEZ DISSO</div><div style={{fontSize:13,color:"#A0C8A0",fontStyle:"italic"}}>{it.sim}</div></div></>)}</div>;
    if(b.type==="flowSteps") return <div key={i} style={{border:"1px solid #2A2A28",borderRadius:10,overflow:"hidden",margin:"0 0 20px"}}>{b.items.map((s,j)=><div key={j} style={{display:"flex",gap:0,borderBottom:j<b.items.length-1?"1px solid #2A2A28":"none"}}><div style={{width:48,flexShrink:0,background:"#1A1A17",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:14}}><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:s.color}}>{s.num}</span></div><div style={{flex:1,padding:"13px 14px 13px 0"}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,color:C.text,textTransform:"uppercase",marginBottom:5}}>{s.title}</div><div style={{fontSize:12,color:"#A0A09A",lineHeight:1.6}}>{s.text}</div></div></div>)}</div>;
    if(b.type==="followupSteps") return <div key={i} style={{border:"1px solid #2A2A28",borderRadius:10,overflow:"hidden",margin:"0 0 20px"}}>{b.items.map((s,j)=><div key={j} style={{display:"flex",gap:0,borderBottom:j<b.items.length-1?"1px solid #2A2A28":"none"}}><div style={{width:52,flexShrink:0,background:"#1A1A17",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:14}}><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14,color:s.color}}>{s.day}</span></div><div style={{flex:1,padding:"13px 14px 13px 0"}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,color:C.text,textTransform:"uppercase",marginBottom:5}}>{s.title}</div><div style={{fontSize:12,color:"#A0A09A",lineHeight:1.6}}>{s.text}</div></div></div>)}</div>;
    if(b.type==="checklist") return <div key={i} style={{border:"1px solid #2A2A28",borderRadius:10,overflow:"hidden",margin:"0 0 20px"}}>{b.items.map((it,j)=><div key={j} onClick={()=>setChecks(p=>({...p,[j]:!p[j]}))} style={{display:"flex",gap:12,padding:"13px 16px",borderBottom:j<b.items.length-1?"1px solid #2A2A28":"none",background:checks[j]?"#1A2A1A":"#1A1A17",cursor:"pointer",transition:"background 0.2s"}}><div style={{width:22,height:22,borderRadius:5,flexShrink:0,border:`2px solid ${checks[j]?C.green:"#3A3A38"}`,background:checks[j]?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",marginTop:1}}>{checks[j]&&"✓"}</div><div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,color:checks[j]?"#6A9A6A":C.text,textDecoration:checks[j]?"line-through":"none",textTransform:"uppercase",marginBottom:3}}>{it.title}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{it.text}</div></div></div>)}</div>;
    if(b.type==="perguntaGroup") return <div key={i} style={{border:`1px solid ${b.color}33`,borderRadius:10,overflow:"hidden",margin:"0 0 14px"}}><div style={{padding:"10px 14px",background:`${b.color}11`,borderBottom:`1px solid ${b.color}33`,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14}}>{b.icon}</span><span style={{fontSize:11,fontWeight:700,color:b.color,letterSpacing:"0.08em"}}>{b.label}</span></div>{b.items.map((q,j)=><div key={j} style={{padding:"12px 14px",borderBottom:j<b.items.length-1?`1px solid #1E1E1C`:"none"}}><div style={{fontSize:13,fontStyle:"italic",color:C.text,marginBottom:5}}>"{q.q}"</div><div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>Objetivo: {q.obj}</div></div>)}</div>;
    if(b.type==="kpiTable") return <div key={i} style={{border:"1px solid #2A2A28",borderRadius:10,overflow:"hidden",margin:"0 0 20px"}}><div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 2fr",background:"#111110",borderBottom:"1px solid #2A2A28"}}>{["MÉTRICA","META 90 DIAS","FREQUÊNCIA","SE ABAIXO →"].map(h=><div key={h} style={{padding:"8px 10px",fontSize:9,fontWeight:700,color:C.muted,letterSpacing:"0.08em"}}>{h}</div>)}</div>{b.items.map((r,j)=><div key={j} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 2fr",borderBottom:j<b.items.length-1?"1px solid #1E1E1C":"none",background:j%2===0?"#1A1A17":"#161614"}}><div style={{padding:"10px 10px",fontSize:12,color:C.text,fontWeight:600,lineHeight:1.4}}>{r.metric}</div><div style={{padding:"10px 10px",fontSize:12,color:C.yellow,fontWeight:700}}>{r.meta}</div><div style={{padding:"10px 10px",fontSize:11,color:C.muted}}>{r.freq}</div><div style={{padding:"10px 10px",fontSize:11,color:"#A0A09A",lineHeight:1.4}}>{r.acao}</div></div>)}</div>;
    return null;
  });
}

// ─── CRM COMPONENTS ───────────────────────────────────────────────────────────
function ContactCard({contact,onClick}){
  const meta=STAGE_META[contact.stage];
  const{pct,done,total}=getTotals(contact.diagChecklist);
  const ppActive=PROXIMOS_OPTIONS.filter(o=>contact.proximosPassos?.[o.id]);
  return <div onClick={onClick} style={{background:C.card,borderRadius:10,border:`1px solid ${C.border}`,borderLeft:`4px solid ${meta.accent}`,padding:"12px 13px 10px",cursor:"pointer",marginBottom:8,transition:"transform 0.15s,box-shadow 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 20px ${meta.accent}33`;}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div style={{flex:1,minWidth:0,paddingRight:8}}>
        <div style={{fontWeight:700,fontSize:13,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{contact.name}</div>
        <div style={{fontSize:11,color:C.muted,marginTop:1}}>{contact.company}</div>
        {(contact.temperatura||contact.bairro||contact.segmento)&&<div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>{contact.temperatura&&TEMPERATURAS[contact.temperatura]&&<span style={{fontSize:10,background:`${TEMPERATURAS[contact.temperatura].cor}22`,color:TEMPERATURAS[contact.temperatura].cor,borderRadius:8,padding:"1px 7px",fontWeight:700}}>{TEMPERATURAS[contact.temperatura].l}</span>}{contact.segmento&&<span style={{fontSize:10,background:"#2A2A28",color:C.muted,borderRadius:8,padding:"1px 7px",fontWeight:600}}>{contact.segmento}</span>}{contact.bairro&&<span style={{fontSize:10,background:"#2A2A28",color:C.muted,borderRadius:8,padding:"1px 7px"}}>📍 {contact.bairro}</span>}</div>}
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        <Ring pct={pct} accent={meta.accent} size={30} stroke={4}/>
        <div style={{fontSize:9,color:C.faint,marginTop:2}}>{done}/{total}</div>
      </div>
    </div>
    {ppActive.length>0&&<div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:3}}>{ppActive.map(pp=><span key={pp.id} style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:`${meta.accent}22`,color:meta.accent,fontWeight:700}}>{pp.emoji} {pp.label}</span>)}</div>}
    {!contact.proximaReuniao&&contact.stage!=="Cliente"&&contact.stage!=="Portas Fechadas"&&<div style={{marginTop:7,fontSize:10,color:"#E8614B",fontWeight:700}}>⚠ Sem próximo passo definido</div>}
    {contact.proximaReuniao&&<div style={{marginTop:7,display:"flex",alignItems:"center",gap:5,padding:"5px 8px",borderRadius:6,background:`${meta.accent}15`,border:`1px solid ${meta.accent}33`}}>
      <span style={{fontSize:10}}>📅</span>
      <span style={{fontSize:10,fontWeight:700,color:meta.accent}}>{contact.tipoReuniao||'Reunião'}</span>
      <span style={{fontSize:10,color:C.muted}}>{new Date(contact.proximaReuniao+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}{contact.horarioReuniao?' às '+contact.horarioReuniao:''}</span>
    </div>}
  </div>;
}

function DiagItem({item,idx,done,note,blockAccent,blockColor,onToggle,onNoteChange}){
  const[expanded,setExpanded]=useState(false);
  return <div style={{borderTop:idx>0?"1px solid #1E1E1C":"none"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:done?`${blockColor}22`:"transparent"}}>
      <div onClick={onToggle} style={{width:24,height:24,borderRadius:6,flexShrink:0,cursor:"pointer",background:done?blockAccent:"#2A2A28",display:"flex",alignItems:"center",justifyContent:"center",fontSize:done?11:10,color:done?"#fff":C.faint,fontWeight:700}}>{done?"✓":idx+1}</div>
      <div style={{flex:1,cursor:"pointer"}} onClick={()=>setExpanded(v=>!v)}>
        <div style={{fontSize:12,fontWeight:600,color:done?C.faint:C.text,textDecoration:done?"line-through":"none"}}>{item.label}</div>
        <div style={{fontSize:11,color:C.faint,marginTop:1}}>{item.desc}</div>
      </div>
      <div onClick={()=>setExpanded(v=>!v)} style={{width:26,height:26,borderRadius:6,cursor:"pointer",background:expanded?`${blockAccent}22`:"#2A2A28",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,border:`1px solid ${expanded?blockAccent:"transparent"}`}}>✏️</div>
    </div>
    {expanded&&<div style={{padding:"0 14px 12px 48px",background:"#161614"}}><textarea value={note||""} onChange={e=>onNoteChange(e.target.value)} placeholder={`Anotações...`} rows={2} autoFocus style={{...inp,resize:"vertical",lineHeight:1.6}}/></div>}
  </div>;
}

function CRMModal({contact,onClose,onSave,onDelete,onFechar}){
  const[tab,setTab]=useState("diagnostico");
  const[c,setC]=useState(()=>JSON.parse(JSON.stringify(contact)));
  const[newNota,setNewNota]=useState({tipo:"Visita",nota:""});
  const[openBlock,setOpenBlock]=useState(null);
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);
  const meta=STAGE_META[c.stage];
  const today=new Date().toLocaleDateString("pt-BR");
  const{total,done,pct}=getTotals(c.diagChecklist);
  const ppCount=PROXIMOS_OPTIONS.filter(o=>c.proximosPassos?.[o.id]).length;
  const set=(k,v)=>setC(p=>({...p,[k]:v}));
  const setFicha=(k,v)=>setC(p=>({...p,ficha:{...p.ficha,[k]:v}}));
  const toggleDiag=(id)=>setC(p=>({...p,diagChecklist:{...p.diagChecklist,[id]:!p.diagChecklist?.[id]}}));
  const setNote=(id,v)=>setC(p=>({...p,diagNotes:{...p.diagNotes,[id]:v}}));
  const toggleProx=(id)=>setC(p=>({...p,proximosPassos:{...p.proximosPassos,[id]:!p.proximosPassos?.[id]}}));
  const addNota=()=>{if(!newNota.nota.trim())return;setC(p=>({...p,historico:[{data:today,tipo:newNota.tipo,nota:newNota.nota},...(p.historico||[])]}));setNewNota(p=>({...p,nota:""}));};
  const TABS=[{id:"diagnostico",icon:"🩺",label:"Diag.",badge:`${pct}%`},{id:"proximos",icon:"➡️",label:"Passos",badge:ppCount>0?String(ppCount):null},{id:"ficha",icon:"📋",label:"Ficha",badge:null},{id:"historico",icon:"🗂",label:"Hist.",badge:c.historico?.length>0?String(c.historico.length):null}];
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
    <div style={{background:C.surface,borderRadius:16,width:"100%",maxWidth:720,maxHeight:"94vh",display:"flex",flexDirection:"column",boxShadow:"0 40px 100px rgba(0,0,0,0.6)",overflow:"hidden",border:`1px solid ${C.border}`}}>
      <div style={{background:meta.accent,padding:"16px 20px 12px",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1,paddingRight:10}}>
            <div style={{fontWeight:700,fontSize:18,color:"#fff"}}>{c.name||"Sem nome"}</div>
            <div style={{color:"rgba(255,255,255,0.7)",fontSize:12,marginTop:2}}>{c.company}{c.segmento&&` · ${c.segmento}`}{c.bairro&&` · 📍 ${c.bairro}`}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:13}}>✕</button>
        </div>
        <div style={{display:"flex",gap:4,marginTop:10,flexWrap:"wrap"}}>
          {STAGES.map(s=><button key={s} onClick={()=>set("stage",s)} style={{padding:"3px 9px",borderRadius:20,border:"1.5px solid rgba(255,255,255,0.3)",background:c.stage===s?"#fff":"transparent",color:c.stage===s?meta.accent:"#fff",fontSize:10,cursor:"pointer",fontWeight:700}}>{STAGE_META[s].icon} {s}</button>)}
        </div>
        <div style={{marginTop:10,background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontWeight:700,letterSpacing:".08em",marginBottom:7}}>📅 PRÓXIMO CONTATO</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            <select value={c.tipoReuniao||"Reunião"} onChange={e=>set("tipoReuniao",e.target.value)} style={{flex:"1 1 160px",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:6,color:"#fff",padding:"7px 9px",fontSize:12,cursor:"pointer",outline:"none"}}>
              {["Reunião","Apresentação de Proposta","Follow-up","Visita","Call","Enviar Proposta","Fechar Contrato","Outro"].map(t=><option key={t} style={{background:"#1a1a1a"}}>{t}</option>)}
            </select>
            <input type="date" value={c.proximaReuniao||""} onChange={e=>set("proximaReuniao",e.target.value)} style={{flex:"1 1 130px",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:6,color:"#fff",padding:"7px 9px",fontSize:12,outline:"none",cursor:"pointer"}}/>
            <input type="time" value={c.horarioReuniao||""} onChange={e=>set("horarioReuniao",e.target.value)} style={{flex:"0 0 100px",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:6,color:"#fff",padding:"7px 9px",fontSize:12,outline:"none",cursor:"pointer"}}/>
            {c.proximaReuniao&&<button onClick={()=>{set("proximaReuniao","");set("horarioReuniao","");}} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:6,color:"rgba(255,255,255,0.7)",padding:"7px 10px",fontSize:12,cursor:"pointer",flexShrink:0}}>✕</button>}
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",background:C.card,borderBottom:`2px solid ${C.border}`,flexShrink:0}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 6px 8px",border:"none",borderBottom:tab===t.id?`3px solid ${meta.accent}`:"3px solid transparent",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,marginBottom:-2}}>
          <span style={{fontSize:14}}>{t.icon}</span>
          <span style={{fontSize:11,fontWeight:tab===t.id?700:400,color:tab===t.id?meta.accent:C.muted}}>{t.label}{t.badge&&<span style={{marginLeft:3,fontSize:9,background:tab===t.id?meta.accent:"#333",color:tab===t.id?"#fff":C.muted,borderRadius:8,padding:"0 4px"}}>{t.badge}</span>}</span>
        </button>)}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"18px 18px"}}>
        {tab==="diagnostico"&&<div>
          <div style={{background:C.card,borderRadius:12,padding:"12px 16px",marginBottom:14,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:14}}>
            <div style={{position:"relative",width:50,height:50,flexShrink:0}}><Ring pct={pct} accent={meta.accent} size={50} stroke={5}/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:meta.accent}}>{pct}%</div></div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:C.text}}>Diagnóstico Operacional</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{done}/{total} pontos levantados</div><div style={{marginTop:6,height:3,background:"#2A2A28",borderRadius:10}}><div style={{width:`${pct}%`,height:"100%",background:meta.accent,borderRadius:10,transition:"width 0.4s"}}/></div></div>
          </div>
          {DIAG_BLOCKS.map(block=>{const bd=block.items.filter(i=>c.diagChecklist?.[i.id]).length,bt=block.items.length,isOpen=openBlock===block.id;return <div key={block.id} style={{marginBottom:7,borderRadius:10,overflow:"hidden",border:`1.5px solid ${isOpen?block.accent:C.border}`}}>
            <div onClick={()=>setOpenBlock(isOpen?null:block.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",background:isOpen?`${block.color}11`:C.card}}>
              <span style={{fontSize:16}}>{block.icon}</span>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:C.text}}>{block.label}</div><div style={{fontSize:10,color:C.muted,marginTop:1}}>{bd}/{bt}</div></div>
              <div style={{width:44,height:3,background:"#2A2A28",borderRadius:4}}><div style={{width:`${(bd/bt)*100}%`,height:"100%",background:block.accent,borderRadius:4}}/></div>
              <span style={{fontSize:10,color:block.accent,width:16}}>{isOpen?"▲":"▼"}</span>
            </div>
            {isOpen&&<div style={{borderTop:`1px solid ${block.accent}33`}}>{block.items.map((item,idx)=><DiagItem key={item.id} item={item} idx={idx} done={!!c.diagChecklist?.[item.id]} note={c.diagNotes?.[item.id]||""} blockAccent={block.accent} blockColor={block.color} onToggle={()=>toggleDiag(item.id)} onNoteChange={v=>setNote(item.id,v)}/>)}</div>}
          </div>;})}
        </div>}
        {tab==="proximos"&&<div><div style={{marginBottom:12,fontSize:12,color:C.muted}}>Próximos passos aparecem no card do kanban.</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>{PROXIMOS_OPTIONS.map(opt=>{const active=!!c.proximosPassos?.[opt.id];return <div key={opt.id} onClick={()=>toggleProx(opt.id)} style={{padding:"12px 14px",borderRadius:12,cursor:"pointer",border:`2px solid ${active?meta.accent:C.border}`,background:active?`${meta.accent}15`:C.card,display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:8,flexShrink:0,background:active?meta.accent:"#2A2A28",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{opt.emoji}</div><div><div style={{fontSize:12,fontWeight:active?700:400,color:active?meta.accent:C.text}}>{opt.label}</div>{active&&<div style={{fontSize:10,color:meta.accent,marginTop:2}}>✓ Ativo</div>}</div></div>;})}</div></div>}
        {tab==="ficha"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:C.card,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>📍 Localização & Contato</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>Segmento</label><select value={c.segmento||""} onChange={e=>set("segmento",e.target.value)} style={{...inp,background:C.surface}}><option value="">—</option>{SEGMENTOS.map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={lbl}>Telefone</label><input value={c.phone||""} onChange={e=>set("phone",e.target.value)} style={inp}/></div>
              <div style={{gridColumn:"span 2"}}><label style={lbl}>Endereço</label><input value={c.endereco||""} onChange={e=>set("endereco",e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Bairro</label><input value={c.bairro||""} onChange={e=>set("bairro",e.target.value)} style={inp}/></div>
              <div><label style={lbl}>Região</label><input value={c.regiao||""} onChange={e=>set("regiao",e.target.value)} style={inp}/></div>
              <div style={{gridColumn:"span 2"}}><label style={lbl}>E-mail</label><input value={c.email||""} onChange={e=>set("email",e.target.value)} style={inp}/></div>
            </div>
          </div>
          <div style={{background:C.card,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>💼 Informações Comerciais</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {FICHA_FIELDS.map(f=><div key={f.key} style={{gridColumn:f.big?"span 2":"span 1"}}><label style={lbl}>{f.label}</label>{f.big?<textarea value={c.ficha?.[f.key]||""} onChange={e=>setFicha(f.key,e.target.value)} rows={3} style={{...inp,resize:"vertical"}}/>:<input value={c.ficha?.[f.key]||""} onChange={e=>setFicha(f.key,e.target.value)} style={inp}/>}</div>)}
            </div>
          </div>
        </div>}
        {tab==="historico"&&<div>
          <div style={{display:"flex",gap:7,marginBottom:14}}>
            <select value={newNota.tipo} onChange={e=>setNewNota(p=>({...p,tipo:e.target.value}))} style={{...inp,width:"auto",padding:"7px 10px"}}>{["Visita","Reunião","Call","E-mail","WhatsApp","Outro"].map(t=><option key={t}>{t}</option>)}</select>
            <textarea value={newNota.nota} onChange={e=>setNewNota(p=>({...p,nota:e.target.value}))} placeholder="Registrar contato..." rows={2} style={{...inp,flex:1,resize:"none"}}/>
            <button onClick={addNota} style={{padding:"7px 13px",background:meta.accent,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:15,alignSelf:"flex-end"}}>+</button>
          </div>
          {(c.historico||[]).length===0&&<div style={{color:C.faint,fontSize:13,textAlign:"center",padding:30}}>Nenhum registro ainda.</div>}
          {(c.historico||[]).map((h,i)=><div key={i} style={{padding:"11px 13px",background:C.card,borderRadius:9,border:`1px solid ${C.border}`,marginBottom:7,borderLeft:`3px solid ${meta.accent}`}}><div style={{display:"flex",gap:7,marginBottom:4}}><span style={{fontSize:10,background:`${meta.accent}22`,color:meta.accent,padding:"2px 8px",borderRadius:20,fontWeight:700}}>{h.tipo}</span><span style={{fontSize:11,color:C.muted}}>{h.data}</span></div><div style={{fontSize:12,color:"#B0B0A8",lineHeight:1.55}}>{h.nota}</div></div>)}
        </div>}
      </div>
      <div style={{padding:"11px 20px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"flex-end",gap:8,background:C.card,flexShrink:0}}>
        <button onClick={()=>{if(window.confirm(`Excluir o contato "${c.name||c.company||""}"? Ele some do CRM (recuperável por suporte).`))onDelete(c);}} style={{padding:"8px 14px",borderRadius:7,border:"1px solid #7A2E1E",background:"transparent",cursor:"pointer",fontSize:13,color:"#E8614B",marginRight:"auto"}}>Excluir</button>
        {c.stage!=="Cliente"&&onFechar&&<button onClick={()=>onFechar(c)} style={{padding:"8px 14px",borderRadius:7,border:"none",background:C.green,color:"#0E0E0C",cursor:"pointer",fontSize:13,fontWeight:800}}>🚀 Fechar projeto</button>}
        <button onClick={onClose} style={{padding:"8px 18px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",fontSize:13,color:C.muted}}>Cancelar</button>
        <button onClick={async()=>{setSaving(true);setSaved(false);await onSave(c);setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2500);}} disabled={saving} style={{padding:"8px 20px",borderRadius:7,border:"none",background:saved?"#10B981":meta.accent,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,transition:"background .3s"}}>{saving?"Salvando…":saved?"✓ Salvo!":"Salvar"}</button>
      </div>
    </div>
  </div>;
}

function NewContactModal({onClose,onSave}){
  const[c,setC]=useState(makeEmpty);
  const set=(k,v)=>setC(p=>({...p,[k]:v}));
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:C.surface,borderRadius:14,width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",border:`1px solid ${C.border}`}}>
      <div style={{padding:"16px 20px",background:C.card,borderBottom:`1px solid ${C.border}`,borderRadius:"14px 14px 0 0"}}><div style={{fontWeight:700,fontSize:16,color:C.text}}>Novo Contato</div></div>
      <div style={{padding:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
        {[["name","Nome *"],["company","Empresa"]].map(([k,l])=><div key={k} style={{gridColumn:"span 2"}}><label style={lbl}>{l}</label><input value={c[k]} onChange={e=>set(k,e.target.value)} style={inp}/></div>)}
        {[["email","E-mail"],["phone","Telefone"]].map(([k,l])=><div key={k}><label style={lbl}>{l}</label><input value={c[k]} onChange={e=>set(k,e.target.value)} style={inp}/></div>)}
        <div><label style={lbl}>Segmento</label><select value={c.segmento} onChange={e=>set("segmento",e.target.value)} style={{...inp,background:C.card}}><option value="">—</option>{SEGMENTOS.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label style={lbl}>Etapa</label><select value={c.stage} onChange={e=>set("stage",e.target.value)} style={{...inp,background:C.card}}>{STAGES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label style={lbl}>Temperatura</label><select value={c.temperatura||""} onChange={e=>set("temperatura",e.target.value)} style={{...inp,background:C.card}}><option value="">—</option>{Object.entries(TEMPERATURAS).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}</select></div>
        <div><label style={lbl}>Origem do lead</label><select value={c.origem||""} onChange={e=>set("origem",e.target.value)} style={{...inp,background:C.card}}><option value="">—</option>{ORIGENS.map(o=><option key={o}>{o}</option>)}</select></div>
        <div style={{gridColumn:"span 2"}}><label style={lbl}>Endereço</label><input value={c.endereco} onChange={e=>set("endereco",e.target.value)} style={inp}/></div>
        {[["bairro","Bairro"],["regiao","Região"]].map(([k,l])=><div key={k}><label style={lbl}>{l}</label><input value={c[k]} onChange={e=>set(k,e.target.value)} style={inp}/></div>)}
        <div style={{gridColumn:"span 2",display:"flex",gap:9,justifyContent:"flex-end",marginTop:4}}>
          <button onClick={onClose} style={{padding:"8px 18px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",fontSize:13,color:C.muted}}>Cancelar</button>
          <button onClick={()=>{if(c.name.trim())onSave({...c,id:Date.now()});}} style={{padding:"8px 18px",borderRadius:7,border:"none",background:C.yellow,color:"#0E0E0C",cursor:"pointer",fontSize:13,fontWeight:700}}>Criar</button>
        </div>
      </div>
    </div>
  </div>;
}

function CRMView({modo="pipeline"}){
  const[fechando,setFechando]=useState(null);
  const[contacts,setContacts]=useState([]);
  const[selected,setSelected]=useState(null);
  const[showNew,setShowNew]=useState(false);
  const[search,setSearch]=useState("");
  const[filterSeg,setFilterSeg]=useState("");
  const[storageOk,setStorageOk]=useState(null);
  const[syncing,setSyncing]=useState(false);
  const token = typeof window !== "undefined" ? (window.__supabaseToken || null) : null;

  const reload=async()=>{setSyncing(true);try{const data=await sbLoad(token);setContacts(data);setStorageOk(true);}catch(e){console.error(e);}finally{setSyncing(false);}};
  useEffect(()=>{reload();const t=setInterval(reload,60000);return()=>clearInterval(t);},[]);

  const saveContact=async(u)=>{
    try{
      const sbid=await sbUpsert(u,token);
      setContacts(prev=>prev.map(c=>c._sbid===u._sbid?{...u,_sbid:sbid}:c));
      // Confirm persist: reload from Supabase after a short delay
      setTimeout(()=>reload(),800);
    }catch(e){
      console.error('Erro ao salvar:',e);
      alert('Erro ao salvar. Verifique a conexão e tente novamente.');
    }
  };
  const deleteContact=async(c)=>{
    try{
      await sbDelete(c._sbid,token);
      setContacts(prev=>prev.filter(x=>x._sbid!==c._sbid));
      setSelected(null);
    }catch(e){console.error(e);alert('Erro ao excluir. Verifique a conexão e tente novamente.');}
  };
  const addContact=async(c)=>{
    try{const sbid=await sbUpsert(c,token);setContacts(prev=>[...prev,{...c,_sbid:sbid}]);}catch(e){console.error(e);}
    setShowNew(false);
  };

  const filtered=useMemo(()=>contacts.filter(c=>{const q=search.toLowerCase();return(!q||c.name.toLowerCase().includes(q)||c.company.toLowerCase().includes(q))&&(!filterSeg||c.segmento===filterSeg);}),[contacts,search,filterSeg]);

  if(storageOk===null) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300,color:C.muted,fontSize:13}}>Carregando...</div>;

  return <div style={{minHeight:"100%"}}>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar contato..." style={{...inp,flex:1,minWidth:120}}/>
      <select value={filterSeg} onChange={e=>setFilterSeg(e.target.value)} style={{...inp,width:"auto",padding:"8px 10px"}}><option value="">Todos</option>{SEGMENTOS.map(s=><option key={s}>{s}</option>)}</select>
      <button onClick={reload} disabled={syncing} title="Sincronizar" style={{padding:"8px 12px",background:syncing?"#2A2A2A":C.surface,color:syncing?C.muted:C.text,border:`1px solid ${C.border}`,borderRadius:7,cursor:syncing?"default":"pointer",fontSize:14,flexShrink:0}}>{syncing?"⟳":"↻"}</button>
      <button onClick={()=>setShowNew(true)} style={{padding:"8px 14px",background:C.yellow,color:"#0E0E0C",border:"none",borderRadius:7,cursor:"pointer",fontWeight:700,fontSize:13,flexShrink:0}}>+ Novo</button>
    </div>
    {modo==="rotas" ? (
      <RotasView token={token} onCriarContato={addContact}/>
    ) : modo==="clientes" ? (
      <ClientesAtivos contacts={filtered.filter(c=>c.stage==="Cliente")} onOpen={setSelected} onSave={saveContact}/>
    ) : (
    <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:8,alignItems:"flex-start",scrollSnapType:"x proximity",WebkitOverflowScrolling:"touch"}}>
      {STAGES.filter(s=>modo==="pipeline"?s!=="Cliente":true).map(stage=>{const meta=STAGE_META[stage],stageC=filtered.filter(c=>c.stage===stage);return <div key={stage} style={{minWidth:220,flex:"0 0 220px",display:"flex",flexDirection:"column",maxHeight:"calc(100vh - 215px)",scrollSnapAlign:"start"}}>
        <div style={{marginBottom:8,padding:"9px 12px",background:C.card,borderRadius:8,border:`1px solid ${C.border}`,borderTop:`3px solid ${meta.accent}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:700,fontSize:11,color:C.text}}>{stage}</div><div style={{fontSize:10,color:C.muted,marginTop:1}}>{stageC.length} contato{stageC.length!==1?"s":""}</div></div>
          <span style={{fontSize:14,color:meta.accent}}>{meta.icon}</span>
        </div>
        <div style={{overflowY:"auto",flex:1,minHeight:0,paddingRight:2}}>
          {stageC.map(c=><ContactCard key={c.id} contact={c} onClick={()=>setSelected(c)}/>)}
          {stageC.length===0&&<div style={{textAlign:"center",color:C.faint,fontSize:11,padding:"16px 0",borderRadius:8,border:`1.5px dashed ${C.border}`,marginTop:4}}>Nenhum contato</div>}
        </div>
      </div>;})}
    </div>
    )}
    {selected&&<CRMModal contact={selected} onClose={()=>setSelected(null)} onSave={saveContact} onDelete={deleteContact} onFechar={c=>{setSelected(null);setFechando(c);}}/>}
    {fechando&&<FecharProjetoModal contato={fechando} onClose={()=>setFechando(null)} onSave={saveContact}/>}
    {showNew&&<NewContactModal onClose={()=>setShowNew(false)} onSave={addContact}/>}
  </div>;
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function ComercialZeste({onBack,token:tokenProp}){
  // Sync token for CRM supabase calls
  if(tokenProp&&typeof window!=="undefined")window.__supabaseToken=tokenProp;
  const[activeSection,setActiveSection]=useState("filosofia");
  const[view,setView]=useState("pipeline"); // pipeline | clientes | manual
  const showCRM = view!=="manual";

  const current=MANUAL_SECTIONS.find(s=>s.id===activeSection);

  return <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Barlow',sans-serif",color:C.text}}>
    <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>

    {/* TOPBAR */}
    <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:50,padding:"0 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,height:50}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{width:28,height:28,borderRadius:8,background:C.yellow,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:14,color:"#0E0E0C"}}>Z</div>
          {onBack&&<button onClick={onBack} style={{color:C.yellow,fontSize:22,background:"none",border:"none",cursor:"pointer",lineHeight:1,marginRight:6,minWidth:36,minHeight:36,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>}<span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:16,color:C.text,letterSpacing:"0.05em"}}>ZESTE</span>
        </div>
        <div style={{width:1,height:20,background:C.border}}/>
        <span style={{fontSize:11,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",flexShrink:0}}>COMERCIAL</span>
        <div style={{flex:1}}/>
        <div style={{display:"flex",gap:4,flexShrink:0}}>
          {[["pipeline","Pipeline"],["clientes","Clientes"],["rotas","Rotas"],["manual","Diretrizes"]].map(([id,l])=>(
            <button key={id} onClick={()=>setView(id)} style={{padding:"8px 14px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,letterSpacing:"0.05em",border:"none",background:view===id?C.yellow:"transparent",color:view===id?"#0E0E0C":C.muted}}>{l}</button>
          ))}
        </div>
      </div>

      {/* SECTION TABS — only in manual mode */}
      {!showCRM&&<div style={{display:"flex",overflowX:"auto",gap:0,borderTop:`1px solid ${C.border}`,marginLeft:-16,marginRight:-16,paddingLeft:16}}>
        {MANUAL_SECTIONS.map(s=><button key={s.id} onClick={()=>setActiveSection(s.id)} style={{padding:"10px 12px",border:"none",borderBottom:activeSection===s.id?`3px solid ${C.yellow}`:"3px solid transparent",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",flexShrink:0,marginBottom:-1}}>
          <span style={{fontSize:10,fontWeight:700,color:activeSection===s.id?C.muted:C.faint}}>{s.num}</span>
          <span style={{fontSize:11,fontWeight:activeSection===s.id?700:400,color:activeSection===s.id?C.yellow:C.muted}}>{s.label.toUpperCase()}</span>
        </button>)}
      </div>}
    </div>

    {/* CONTENT */}
    <div style={{padding:"24px 18px",maxWidth:820,margin:"0 auto"}}>
      {showCRM ? (
        <CRMView modo={view}/>
      ) : current && (
        <div>
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:6}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:18,color:C.yellow}}>{current.num}</span>
              <h1 style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:26,color:C.text,margin:0,textTransform:"uppercase",lineHeight:1}}>{current.title}</h1>
            </div>
            <div style={{fontStyle:"italic",color:C.muted,fontSize:13}}>{current.sub}</div>
            <div style={{height:1,background:C.border,marginTop:14}}/>
          </div>
          <RenderBlock block={current}/>
          {/* NEXT / PREV */}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:30,paddingTop:20,borderTop:`1px solid ${C.border}`}}>
            {MANUAL_SECTIONS.findIndex(s=>s.id===activeSection)>0
              ?<button onClick={()=>setActiveSection(MANUAL_SECTIONS[MANUAL_SECTIONS.findIndex(s=>s.id===activeSection)-1].id)} style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",fontSize:12,color:C.muted}}>← Anterior</button>
              :<div/>}
            {MANUAL_SECTIONS.findIndex(s=>s.id===activeSection)<MANUAL_SECTIONS.length-1
              ?<button onClick={()=>setActiveSection(MANUAL_SECTIONS[MANUAL_SECTIONS.findIndex(s=>s.id===activeSection)+1].id)} style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${C.yellow}`,background:`${C.yellow}15`,cursor:"pointer",fontSize:12,color:C.yellow,fontWeight:700}}>Próximo →</button>
              :<button onClick={()=>setView("pipeline")} style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${C.green}`,background:`${C.green}15`,cursor:"pointer",fontSize:12,color:C.green,fontWeight:700}}>Abrir CRM →</button>}
          </div>
        </div>
      )}
    </div>
  </div>;
}



// ── ROTAS COMERCIAIS — Anexo A do Sistema Comercial como ferramenta ──
// Tabela crm_rotas: {id, dados jsonb, deleted_at} — padrão da casa
const ROTA_CLASS = { quente: { l: "🔥 Quente", cor: "#E8614B" }, morno: { l: "🌤 Morno", cor: "#E8B04B" }, frio: { l: "❄ Frio", cor: "#6A9AC8" }, "nao-retornar": { l: "🚫 Não retornar", cor: "#5A5A55" } };
async function rotasLoad(token){ try{ const r=await fetch(`${SB_URL}/rest/v1/crm_rotas?deleted_at=is.null&order=updated_at.desc&select=*`,{headers:{apikey:SB_KEY,Authorization:`Bearer ${token||SB_KEY}`}}); const d=await r.json(); return Array.isArray(d)?d.map(x=>({...x.dados,id:x.id})):[]; }catch{ return []; } }
async function rotaUpsert(rota,token){ const h={"Content-Type":"application/json",apikey:SB_KEY,Prefer:"resolution=merge-duplicates",...(token&&{Authorization:`Bearer ${token}`})}; return fetch(`${SB_URL}/rest/v1/crm_rotas`,{method:"POST",headers:h,body:JSON.stringify({id:rota.id,dados:rota,updated_at:new Date().toISOString()})}); }
async function rotaDel(id,token){ const h={"Content-Type":"application/json",apikey:SB_KEY,...(token&&{Authorization:`Bearer ${token}`})}; return fetch(`${SB_URL}/rest/v1/crm_rotas?id=eq.${id}`,{method:"PATCH",headers:h,body:JSON.stringify({deleted_at:new Date().toISOString()})}); }

function RotasView({token,onCriarContato}){
  const[rotas,setRotas]=useState(null);
  const[sel,setSel]=useState(null);
  const[novaRota,setNovaRota]=useState(null);
  const[novaParada,setNovaParada]=useState("");
  const[resultado,setResultado]=useState(null); // parada em edição de resultado
  useEffect(()=>{rotasLoad(token).then(setRotas);},[token]);
  const salvar=async r=>{setRotas(p=>p.map(x=>x.id===r.id?r:x));if(sel?.id===r.id)setSel(r);await rotaUpsert(r,token);};
  const criar=async()=>{
    if(!novaRota?.nome){alert("Dá um nome pra rota (ex: Centro — quinta de manhã).");return;}
    const r={id:uidFP(),nome:novaRota.nome,regiao:novaRota.regiao||"",data:novaRota.data||new Date().toISOString().slice(0,10),responsavel:novaRota.responsavel||"Apoio comercial",paradas:[]};
    setRotas(p=>[r,...(p||[])]);setNovaRota(null);setSel(r);await rotaUpsert(r,token);
  };
  const addParada=async()=>{
    if(!novaParada.trim())return;
    const r={...sel,paradas:[...(sel.paradas||[]),{id:uidFP(),estabelecimento:novaParada.trim(),status:"pendente"}]};
    setNovaParada("");await salvar(r);
  };
  const salvarResultado=async()=>{
    const r={...sel,paradas:sel.paradas.map(p=>p.id===resultado.id?{...resultado,status:"visitado"}:p)};
    setResultado(null);await salvar(r);
  };
  const converterParada=async p=>{
    if(!window.confirm(`Criar contato no CRM a partir de "${p.estabelecimento}"?`))return;
    await onCriarContato({id:uidFP(),name:p.respNome||"Responsável a confirmar",company:p.estabelecimento,phone:p.contato||"",segmento:"",stage:p.classificacao==="quente"?"Leads":"Prospects",temperatura:p.classificacao,origem:"Rota comercial",bairro:sel.regiao||"",endereco:"",proximosPassos:{},notas:[{data:new Date().toISOString().slice(0,10),nota:`Origem: rota "${sel.nome}" (${new Date(sel.data+"T12:00:00").toLocaleDateString("pt-BR")}). ${p.quemRecebeu?`Recebeu: ${p.quemRecebeu}. `:""}${p.melhorHorario?`Melhor horário: ${p.melhorHorario}. `:""}${p.obs||""}`}]});
    const r={...sel,paradas:sel.paradas.map(x=>x.id===p.id?{...x,convertida:true}:x)};
    await salvar(r);
  };
  const copiarRelatorio=()=>{
    const vis=sel.paradas.filter(p=>p.status==="visitado");
    const linhas=vis.map(p=>{const c=ROTA_CLASS[p.classificacao]?.l||"—";return `• ${p.estabelecimento} — ${c}${p.respNome?` · resp.: ${p.respNome}`:""}${p.contato?` · ${p.contato}`:""}${p.melhorHorario?` · melhor horário: ${p.melhorHorario}`:""}${p.obs?`\n  ${p.obs}`:""}`;}).join("\n");
    const txt=`📋 RELATÓRIO DE ROTA — ${sel.nome}\n${new Date(sel.data+"T12:00:00").toLocaleDateString("pt-BR")} · ${sel.responsavel}${sel.regiao?` · ${sel.regiao}`:""}\n\nVisitados: ${vis.length}/${sel.paradas.length}\n🔥 Quentes: ${vis.filter(p=>p.classificacao==="quente").length} · 🌤 Mornos: ${vis.filter(p=>p.classificacao==="morno").length}\n\n${linhas}`;
    try{navigator.clipboard.writeText(txt);alert("Relatório copiado!");}catch{alert(txt);}
  };
  const inp={width:"100%",background:"#222",border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"9px 11px",fontSize:13,outline:"none",colorScheme:"dark"};
  const lbl={fontSize:10,color:C.muted,fontWeight:700,letterSpacing:".06em",display:"block",marginBottom:3};

  if(rotas===null)return <div style={{color:C.muted,fontSize:13,padding:"30px 0",textAlign:"center"}}>Carregando rotas…</div>;

  // ── detalhe de uma rota ──
  if(sel){
    const vis=sel.paradas.filter(p=>p.status==="visitado").length;
    return <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
        <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:C.yellow,fontWeight:800,fontSize:14,cursor:"pointer",padding:0}}>‹ Rotas</button>
        <div style={{flex:1,minWidth:160}}>
          <div style={{fontWeight:800,fontSize:16,color:C.text}}>{sel.nome}</div>
          <div style={{fontSize:11,color:C.muted}}>{new Date(sel.data+"T12:00:00").toLocaleDateString("pt-BR")} · {sel.responsavel}{sel.regiao?` · ${sel.regiao}`:""} · {vis}/{sel.paradas.length} visitadas</div>
        </div>
        <button onClick={copiarRelatorio} style={{padding:"8px 13px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",color:C.text,cursor:"pointer",fontSize:12,fontWeight:700}}>📋 Relatório do dia</button>
        <button onClick={async()=>{if(window.confirm(`Excluir a rota "${sel.nome}"?`)){await rotaDel(sel.id,token);setRotas(p=>p.filter(x=>x.id!==sel.id));setSel(null);}}} style={{padding:"8px 13px",borderRadius:7,border:"1px solid #7A2E1E",background:"transparent",color:"#E8614B",cursor:"pointer",fontSize:12}}>Excluir</button>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input value={novaParada} onChange={e=>setNovaParada(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addParada()} placeholder="+ Adicionar estabelecimento à rota…" style={{...inp,flex:1}}/>
        <button onClick={addParada} style={{padding:"9px 16px",borderRadius:7,border:"none",background:C.yellow,color:"#0E0E0C",cursor:"pointer",fontWeight:800,fontSize:13,flexShrink:0}}>Adicionar</button>
      </div>

      <div style={{display:"grid",gap:8}}>
        {sel.paradas.length===0&&<div style={{textAlign:"center",color:C.faint,fontSize:12,padding:"26px 0",border:`1.5px dashed ${C.border}`,borderRadius:10}}>Nenhuma parada ainda. Adicione os estabelecimentos da rota acima — a ordem da lista é a ordem da visita.</div>}
        {sel.paradas.map((p,i)=>{const cls=ROTA_CLASS[p.classificacao];return(
          <div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`4px solid ${p.status==="visitado"?(cls?.cor||C.green):C.border}`,borderRadius:10,padding:"11px 13px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:15,color:C.faint,flexShrink:0}}>{String(i+1).padStart(2,"0")}</span>
              <div style={{flex:1,minWidth:140}}>
                <div style={{fontWeight:700,fontSize:14,color:C.text}}>{p.estabelecimento}</div>
                {p.status==="visitado"&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{cls?.l||"—"}{p.respNome?` · resp.: ${p.respNome}`:""}{p.contato?` · ${p.contato}`:""}{p.convertida?" · ✓ no CRM":""}</div>}
              </div>
              {p.status!=="visitado"
                ? <button onClick={()=>setResultado({...p})} style={{padding:"7px 12px",borderRadius:7,border:"none",background:C.green,color:"#0E0E0C",cursor:"pointer",fontSize:12,fontWeight:800,flexShrink:0}}>Registrar visita</button>
                : <div style={{display:"flex",gap:6,flexShrink:0}}>
                    {(p.classificacao==="quente"||p.classificacao==="morno")&&!p.convertida&&<button onClick={()=>converterParada(p)} style={{padding:"7px 12px",borderRadius:7,border:"none",background:C.yellow,color:"#0E0E0C",cursor:"pointer",fontSize:12,fontWeight:800}}>→ CRM</button>}
                    <button onClick={()=>setResultado({...p})} style={{padding:"7px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:12}}>Editar</button>
                  </div>}
            </div>
          </div>);})}
      </div>

      {resultado&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:14}} onClick={e=>{if(e.target===e.currentTarget)setResultado(null);}}>
        <div style={{background:"#161614",border:`1px solid ${C.border}`,borderRadius:14,width:"100%",maxWidth:440,maxHeight:"92vh",overflowY:"auto",padding:18}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,color:C.text,marginBottom:12}}>{resultado.estabelecimento}</div>
          <div style={{display:"grid",gap:10}}>
            <div><label style={lbl}>CLASSIFICAÇÃO DA VISITA</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {Object.entries(ROTA_CLASS).map(([k,v])=>(
                  <button key={k} onClick={()=>setResultado(r=>({...r,classificacao:k}))} style={{padding:"9px 6px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,border:`2px solid ${resultado.classificacao===k?v.cor:C.border}`,background:resultado.classificacao===k?`${v.cor}22`:"transparent",color:resultado.classificacao===k?v.cor:C.muted}}>{v.l}</button>
                ))}
              </div>
            </div>
            <div><label style={lbl}>QUEM RECEBEU O MATERIAL</label><input style={inp} value={resultado.quemRecebeu||""} onChange={e=>setResultado(r=>({...r,quemRecebeu:e.target.value}))}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>RESPONSÁVEL / DECISOR</label><input style={inp} value={resultado.respNome||""} onChange={e=>setResultado(r=>({...r,respNome:e.target.value}))}/></div>
              <div><label style={lbl}>CONTATO (WHATS/IG)</label><input style={inp} value={resultado.contato||""} onChange={e=>setResultado(r=>({...r,contato:e.target.value}))}/></div>
            </div>
            <div><label style={lbl}>MELHOR DIA/HORÁRIO DE CONTATO</label><input style={inp} value={resultado.melhorHorario||""} onChange={e=>setResultado(r=>({...r,melhorHorario:e.target.value}))}/></div>
            <div><label style={lbl}>OBSERVAÇÕES (reação, comentários)</label><textarea rows={2} style={{...inp,resize:"vertical"}} value={resultado.obs||""} onChange={e=>setResultado(r=>({...r,obs:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
            <button onClick={()=>setResultado(null)} style={{padding:"9px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:13}}>Cancelar</button>
            <button onClick={salvarResultado} disabled={!resultado.classificacao} style={{padding:"9px 18px",borderRadius:7,border:"none",background:resultado.classificacao?C.green:"#2A2A2A",color:resultado.classificacao?"#0E0E0C":"#666",cursor:resultado.classificacao?"pointer":"default",fontSize:13,fontWeight:800}}>Salvar visita</button>
          </div>
          {resultado.classificacao==="quente"&&<div style={{marginTop:10,fontSize:11,color:"#E8614B",fontWeight:700}}>🔥 Contato quente: avise a Bruna na hora, assim que sair do estabelecimento (Anexo A).</div>}
        </div>
      </div>}
    </div>;
  }

  // ── lista de rotas ──
  return <div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:12,color:C.muted,maxWidth:520,lineHeight:1.5}}>Rotas de prospecção presencial (Anexo A): monte a rota, o apoio registra cada visita em campo, e as paradas quentes viram contatos no CRM com um toque.</div>
      <button onClick={()=>setNovaRota({data:new Date().toISOString().slice(0,10)})} style={{padding:"9px 16px",borderRadius:7,border:"none",background:C.yellow,color:"#0E0E0C",cursor:"pointer",fontWeight:800,fontSize:13}}>+ Nova rota</button>
    </div>
    {rotas.length===0&&<div style={{textAlign:"center",color:C.faint,fontSize:12,padding:"30px 0",border:`1.5px dashed ${C.border}`,borderRadius:10}}>Nenhuma rota ainda. Crie a primeira — ex.: "Centro BC — quinta de manhã".</div>}
    <div style={{display:"grid",gap:8}}>
      {rotas.map(r=>{const vis=(r.paradas||[]).filter(p=>p.status==="visitado");const quentes=vis.filter(p=>p.classificacao==="quente").length;return(
        <div key={r.id} onClick={()=>setSel(r)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"13px 15px",cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:160}}>
              <div style={{fontWeight:800,fontSize:15,color:C.text}}>{r.nome}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{new Date(r.data+"T12:00:00").toLocaleDateString("pt-BR")} · {r.responsavel}{r.regiao?` · ${r.regiao}`:""}</div>
            </div>
            <div style={{fontSize:12,color:C.muted,fontWeight:700}}>{vis.length}/{(r.paradas||[]).length} visitadas{quentes>0?<span style={{color:"#E8614B"}}> · 🔥 {quentes}</span>:null}</div>
          </div>
        </div>);})}
    </div>
    {novaRota&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:14}} onClick={e=>{if(e.target===e.currentTarget)setNovaRota(null);}}>
      <div style={{background:"#161614",border:`1px solid ${C.border}`,borderRadius:14,width:"100%",maxWidth:420,padding:18}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,color:C.text,marginBottom:12}}>Nova rota</div>
        <div style={{display:"grid",gap:10}}>
          <div><label style={lbl}>NOME DA ROTA</label><input style={inp} placeholder="Centro BC — quinta de manhã" value={novaRota.nome||""} onChange={e=>setNovaRota(p=>({...p,nome:e.target.value}))}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={lbl}>REGIÃO / BAIRRO</label><input style={inp} value={novaRota.regiao||""} onChange={e=>setNovaRota(p=>({...p,regiao:e.target.value}))}/></div>
            <div><label style={lbl}>DATA</label><input type="date" style={inp} value={novaRota.data||""} onChange={e=>setNovaRota(p=>({...p,data:e.target.value}))}/></div>
          </div>
          <div><label style={lbl}>RESPONSÁVEL</label><input style={inp} placeholder="Apoio comercial" value={novaRota.responsavel||""} onChange={e=>setNovaRota(p=>({...p,responsavel:e.target.value}))}/></div>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
          <button onClick={()=>setNovaRota(null)} style={{padding:"9px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:13}}>Cancelar</button>
          <button onClick={criar} style={{padding:"9px 18px",borderRadius:7,border:"none",background:C.yellow,color:"#0E0E0C",cursor:"pointer",fontSize:13,fontWeight:800}}>Criar rota</button>
        </div>
      </div>
    </div>}
  </div>;
}

// ── FECHAMENTO → KICK-OFF: cria cliente do portal + login + financeiro + etapa ──
const slugify=t=>(t||"").toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,30)||"cliente";
const uidFP=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
async function executarFechamento(d,token){
  const h={"Content-Type":"application/json",apikey:SB_KEY,...(token&&{Authorization:`Bearer ${token}`})};
  const passos=[];
  // 1) Login (Supabase Auth)
  try{
    const r=await fetch(`${SB_URL}/auth/v1/signup`,{method:"POST",headers:{"Content-Type":"application/json",apikey:SB_KEY},body:JSON.stringify({email:d.email,password:d.senha,data:{role:"cliente"}})});
    const j=await r.json();
    if(r.ok&&j?.id||j?.user){passos.push({p:"Login do cliente (Auth)",ok:true,msg:j?.session?"criado e ativo":"criado — se o login não funcionar de primeira, confirme o e-mail em Supabase → Auth → Users"});}
    else if((j?.msg||j?.message||"").toLowerCase().includes("already")){passos.push({p:"Login do cliente (Auth)",ok:true,msg:"e-mail já tinha usuário — mantido"});}
    else passos.push({p:"Login do cliente (Auth)",ok:false,msg:j?.msg||j?.message||"falhou — crie manualmente em Supabase → Auth"});
  }catch{passos.push({p:"Login do cliente (Auth)",ok:false,msg:"sem conexão"});}
  // 2) Acesso ao portal (fin_portal_clientes)
  try{
    const g=await fetch(`${SB_URL}/rest/v1/fin_portal_clientes?email=eq.${encodeURIComponent(d.email)}&select=cliente_id`,{headers:h}).then(r=>r.json());
    if(Array.isArray(g)&&g.length>0){passos.push({p:"Acesso ao portal",ok:true,msg:`já existia (${g[0].cliente_id}) — mantido`});d.clienteId=g[0].cliente_id;}
    else{
      // senha_hash é legado (login real é via Supabase Auth), mas a coluna é NOT NULL
      const corpo={id:`${d.clienteId}-portal`,cliente_id:d.clienteId,nome_display:d.nomeDisplay,email:d.email,ativo:true,senha_hash:"auth-supabase"};
      let r=await fetch(`${SB_URL}/rest/v1/fin_portal_clientes`,{method:"POST",headers:h,body:JSON.stringify(corpo)});
      if(!r.ok){ // fallback: id em texto (coluna pode não ser uuid)
        r=await fetch(`${SB_URL}/rest/v1/fin_portal_clientes`,{method:"POST",headers:h,body:JSON.stringify({...corpo,id:(crypto?.randomUUID?crypto.randomUUID():uidFP())})});
      }
      passos.push({p:"Acesso ao portal",ok:r.ok,msg:r.ok?`cliente_id "${d.clienteId}"`:`falhou (${(await r.text().catch(()=>""))||"erro"}) — crie via SQL`});
    }
  }catch{passos.push({p:"Acesso ao portal",ok:false,msg:"sem conexão"});}
  // 3) Cliente no Financeiro (fin_clientes)
  try{
    const g=await fetch(`${SB_URL}/rest/v1/fin_clientes?deleted_at=is.null&select=id,dados`,{headers:h}).then(r=>r.json());
    const jaTem=Array.isArray(g)&&g.some(x=>((x.dados?.estabelecimento||x.dados?.cliente||"").toLowerCase()===d.nomeDisplay.toLowerCase()));
    if(jaTem)passos.push({p:"Cliente no Financeiro",ok:true,msg:"já existia — mantido"});
    else{
      const item={id:uidFP(),cliente:d.contatoNome||d.nomeDisplay,estabelecimento:d.nomeDisplay,projeto:d.projeto,statusProjeto:"EM ANDAMENTO",inicio:new Date().toISOString().slice(0,10),vlrContratado:d.valor||"",vlrRecebido:"",forma:"PIX",obs:"Criado pelo fechamento no Comercial",tipoCobranca:"unico",parcelas:1,diaPagamento:5,duracaoMeses:1,servicoTipo:"Consultoria",recebimento:"antecipado",taxaModo:"auto"};
      const r=await fetch(`${SB_URL}/rest/v1/fin_clientes`,{method:"POST",headers:{...h,Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({id:item.id,dados:item,updated_at:new Date().toISOString()})});
      passos.push({p:"Cliente no Financeiro",ok:r.ok,msg:r.ok?"criado (complete forma de pgto e parcelas lá)":"falhou"});
    }
  }catch{passos.push({p:"Cliente no Financeiro",ok:false,msg:"sem conexão"});}
  // 4) Etapa de kick-off no projeto (portal_etapas) — id fixo = idempotente
  try{
    const eid=`kick-${d.clienteId}`;
    const dados={id:eid,titulo:"Reunião de kick-off",data:d.dataKickoff,tipo:"reuniao",escopo:d.projeto?`Início do projeto: ${d.projeto}`:"Apresentação e alinhamento do projeto",preparar:"Sua presença (ou de alguém com poder de decisão)",done:false};
    const r=await fetch(`${SB_URL}/rest/v1/portal_etapas`,{method:"POST",headers:{...h,Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({id:eid,cliente_id:d.clienteId,dados})});
    passos.push({p:"Kick-off na agenda do projeto",ok:r.ok,msg:r.ok?new Date(d.dataKickoff+"T12:00:00").toLocaleDateString("pt-BR"):"falhou"});
  }catch{passos.push({p:"Kick-off na agenda do projeto",ok:false,msg:"sem conexão"});}
  passos.push({p:"Papel do usuário (role + cliente_id)",ok:null,msg:"exige 1 comando no Supabase — veja abaixo"});
  return passos;
}

function FecharProjetoModal({contato,onClose,onSave}){
  const kd=new Date();kd.setDate(kd.getDate()+7);
  const[d,setD]=useState({nomeDisplay:contato.company||contato.name||"",clienteId:slugify(contato.company||contato.name),email:contato.email||"",senha:"Zeste@"+Math.floor(1000+Math.random()*9000),projeto:"",valor:contato.value||"",dataKickoff:kd.toISOString().slice(0,10),contatoNome:contato.name||""});
  const[rodando,setRodando]=useState(false);
  const[resultado,setResultado]=useState(null);
  const token=typeof window!=="undefined"?(window.__supabaseToken||null):null;
  const set=(k,v)=>setD(p=>({...p,[k]:v}));
  const executar=async()=>{
    if(!d.email||!d.nomeDisplay){alert("Preencha estabelecimento e e-mail do cliente.");return;}
    setRodando(true);
    const passos=await executarFechamento({...d},token);
    if(passos.filter(x=>x.ok!==null).every(x=>x.ok))onSave({...contato,stage:"Cliente",faseAtual:contato.faseAtual||1});
    setResultado(passos);setRodando(false);
  };
  const sqlFinal=d=>`update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || '{"role":"cliente","cliente_id":"${d.clienteId}"}'::jsonb where email = '${d.email}';`;
  const copiarSQL=()=>{try{navigator.clipboard.writeText(sqlFinal(d));alert("SQL copiado! Cole no Supabase → SQL Editor e clique em Run.");}catch{alert(sqlFinal(d));}};
  const copiarBoasVindas=()=>{
    const txt=`Olá, ${d.contatoNome||""}! 🌿\nSeu acesso à Área do Cliente Zeste está pronto:\n\n🔗 zeste-sistema.netlify.app\n📧 ${d.email}\n🔑 ${d.senha}\n\nLá você acompanha o projeto, a agenda e recebe todos os documentos. Qualquer dúvida, é só chamar!`;
    try{navigator.clipboard.writeText(txt);alert("Mensagem de boas-vindas copiada!");}catch{alert(txt);}
  };
  const inp={width:"100%",background:"#222",border:`1px solid ${C.border}`,borderRadius:7,color:C.text,padding:"9px 11px",fontSize:13,outline:"none"};
  const lbl={fontSize:10,color:C.muted,fontWeight:700,letterSpacing:".06em",display:"block",marginBottom:3};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:14}} onClick={e=>{if(e.target===e.currentTarget&&!rodando)onClose();}}>
      <div style={{background:"#161614",border:`1px solid ${C.border}`,borderRadius:14,width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",padding:20}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:C.green,marginBottom:2}}>🚀 Fechar projeto</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Cria num passo só: login do cliente, acesso ao portal, registro no Financeiro e o kick-off na agenda.</div>
        {!resultado?<>
          <div style={{display:"grid",gap:10}}>
            <div><label style={lbl}>ESTABELECIMENTO (nome no portal)</label><input style={inp} value={d.nomeDisplay} onChange={e=>{set("nomeDisplay",e.target.value);set("clienteId",slugify(e.target.value));}}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>ID DO CLIENTE (interno)</label><input style={inp} value={d.clienteId} onChange={e=>set("clienteId",slugify(e.target.value))}/></div>
              <div><label style={lbl}>VALOR CONTRATADO (R$)</label><input style={inp} inputMode="decimal" value={d.valor} onChange={e=>set("valor",e.target.value)}/></div>
            </div>
            <div><label style={lbl}>E-MAIL DO CLIENTE (login)</label><input style={inp} type="email" value={d.email} onChange={e=>set("email",e.target.value.trim())}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>SENHA PROVISÓRIA</label><input style={inp} value={d.senha} onChange={e=>set("senha",e.target.value)}/></div>
              <div><label style={lbl}>DATA DO KICK-OFF</label><input style={inp} type="date" value={d.dataKickoff} onChange={e=>set("dataKickoff",e.target.value)}/></div>
            </div>
            <div><label style={lbl}>PROJETO / ESCOPO</label><input style={inp} value={d.projeto} onChange={e=>set("projeto",e.target.value)} placeholder="Ex: Cardápio + fichas técnicas — Etapa 1"/></div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
            <button onClick={onClose} disabled={rodando} style={{padding:"9px 16px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",fontSize:13,color:C.muted}}>Cancelar</button>
            <button onClick={executar} disabled={rodando} style={{padding:"9px 18px",borderRadius:7,border:"none",background:C.green,color:"#0E0E0C",cursor:"pointer",fontSize:13,fontWeight:800}}>{rodando?"Criando…":"Criar tudo"}</button>
          </div>
        </>:<>
          <div style={{display:"grid",gap:8,marginBottom:14}}>
            {resultado.map((r,i)=>(<div key={i} style={{display:"flex",gap:8,alignItems:"baseline",fontSize:13,color:C.text}}>
              <span style={{color:r.ok===null?"#E8B04B":r.ok?C.green:"#E8614B",fontWeight:800}}>{r.ok===null?"⚠":r.ok?"✓":"✗"}</span>
              <span style={{fontWeight:700}}>{r.p}</span><span style={{color:C.muted,fontSize:12}}>— {r.msg}</span>
            </div>))}
          </div>
          <div style={{background:"#2A2013",border:"1px solid #6B5320",borderLeft:"4px solid #E8B04B",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
            <div style={{fontSize:11,color:"#E8B04B",fontWeight:800,letterSpacing:".06em",marginBottom:5}}>⚠ FALTA 1 PASSO MANUAL (30 s)</div>
            <div style={{fontSize:12.5,color:C.text,lineHeight:1.5,marginBottom:9}}>Por segurança, o Supabase não deixa o sistema definir o papel do usuário — sem isso o cliente <b>não consegue entrar</b>. Copie o comando abaixo e rode em <b>Supabase → SQL Editor → Run</b>.</div>
            <button onClick={copiarSQL} style={{padding:"8px 14px",borderRadius:7,border:"none",background:"#E8B04B",color:"#0E0E0C",cursor:"pointer",fontSize:12.5,fontWeight:800}}>📋 Copiar comando SQL</button>
          </div>
          <div style={{background:"#1D1D1A",border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",fontSize:13,color:C.text,marginBottom:14}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:".06em",marginBottom:6}}>ACESSO DO CLIENTE</div>
            <div>🔗 zeste-sistema.netlify.app</div><div>📧 {d.email}</div><div>🔑 {d.senha}</div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={copiarBoasVindas} style={{padding:"9px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",fontSize:13,color:C.text}}>📋 Copiar boas-vindas</button>
            <button onClick={onClose} style={{padding:"9px 18px",borderRadius:7,border:"none",background:C.green,color:"#0E0E0C",cursor:"pointer",fontSize:13,fontWeight:800}}>Concluir</button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ── CLIENTES ATIVOS — carteira e pós-venda ───────────────────────
const FASES_POSVENDA=["Enxergar","Estruturar","Evoluir","Escalar","Elevar"];
function ClientesAtivos({contacts,onOpen,onSave}){
  const porFase=FASES_POSVENDA.map((f,i)=>({f,n:contacts.filter(c=>(c.faseAtual||1)===i+1).length}));
  if(contacts.length===0)return <div style={{textAlign:"center",color:C.faint,fontSize:13,padding:"40px 0",border:`1.5px dashed ${C.border}`,borderRadius:12}}>Nenhum cliente ativo ainda. Quando um contato fechar, mova-o para a etapa "Cliente" no Pipeline — ele aparece aqui.</div>;
  return <div>
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
      <div style={{padding:"10px 16px",background:C.card,border:`1px solid ${C.border}`,borderRadius:10}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:C.green}}>{contacts.length}</div>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".05em"}}>ativos</div>
      </div>
      {porFase.filter(x=>x.n>0).map(x=>(
        <div key={x.f} style={{padding:"10px 16px",background:C.card,border:`1px solid ${C.border}`,borderRadius:10}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:C.text}}>{x.n}</div>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".05em"}}>{x.f}</div>
        </div>
      ))}
    </div>
    <div style={{display:"grid",gap:10}}>
      {contacts.map(c=>{
        const fase=c.faseAtual||1;
        return <div key={c.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:180}}>
              <div style={{fontWeight:700,fontSize:15,color:C.text}}>{c.company||c.name}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{c.name}{c.segmento&&` · ${c.segmento}`}</div>
              {c.proximaReuniao&&<div style={{fontSize:12,color:C.green,marginTop:4}}>📅 {c.tipoReuniao||"Contato"} · {new Date(c.proximaReuniao+"T12:00:00").toLocaleDateString("pt-BR")}{c.horarioReuniao&&` às ${c.horarioReuniao}`}</div>}
              {!c.proximaReuniao&&<div style={{fontSize:12,color:C.faint,marginTop:4}}>Sem próximo contato agendado — pós-venda parado</div>}
            </div>
            <button onClick={()=>onOpen(c)} style={{padding:"7px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",fontSize:12,color:C.muted,flexShrink:0}}>Abrir ficha</button>
          </div>
          <div style={{display:"flex",gap:5,marginTop:12}}>
            {FASES_POSVENDA.map((f,i)=>{
              const n=i+1,done=n<fase,cur=n===fase;
              return <button key={f} title={f} onClick={()=>{if(n!==fase&&window.confirm(`Mudar "${c.company||c.name}" para a fase "${f}"? O cliente vê a fase no portal.`))onSave({...c,faseAtual:n});}}
                style={{flex:1,padding:"7px 2px",borderRadius:7,cursor:"pointer",border:`1.5px solid ${cur?C.yellow:done?C.green:C.border}`,background:cur?C.yellow:done?`${C.green}25`:"transparent",color:cur?"#0E0E0C":done?C.green:C.faint}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:13}}>{done?"✓":n}</div>
                <div style={{fontSize:8,fontWeight:700,letterSpacing:".02em"}}>{f}</div>
              </button>;
            })}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

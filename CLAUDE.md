# CLAUDE.md — Contexto Zeste

Atualizado: 21/jul/2026

---

## 1. Quem é quem

- **Amanda** — co-fundadora da Zeste Consultoria Gastronômica (50/50 com Bruna Toledo), Balneário Camboriú/SC. Cuida do lado técnico/gastronômico: fichas técnicas, POPs, CMV, cardápios, engenharia de cardápios, treinamentos, padronização. **Não é desenvolvedora** — edita código pelo editor de lápis do GitHub, um arquivo por vez.
- **Bruna Toledo** — sócia, comercial/administrativo e padronização.
- **Bianca Bueno** — cliente (440 Bebida Café / 440 Restaurante e Café, `cliente_id: 440`;.
- **Lucca** — marido da Bianca, sócio e decisor no 440.
- **Liziê Martinelli** — parceira confeiteira (Mormor Ateliê de Doces); cria as receitas e treina.

### Como trabalhar com a Amanda
- Respostas curtas e diretas.
- Deu errado: **arrume primeiro, explique depois**.
- Uma coisa de cada vez, com resultado visível antes de avançar.
- Pushback sempre — nunca concordância automática. Recomendação clara, decisão é dela.
- Entrega de código: arquivo pronto pra subir + ordem de upload + verificação por arquivo (grep dos marcadores). Pode agrupar vários passos num pacote no fim da sessão, desde que ela não edite o GitHub no meio.

---

## 2. Zeste Sistema

### Stack e infra
- React + Vite / Supabase (projeto `fayysxmtzdqtplyoeowk`, sa-east-1) / Netlify
- Repo: `github.com/amandahbbb/zeste-sistema` — código em `src/src/`, branch `main`, deploy automático
- Live: `zeste-sistema.netlify.app`
- Supabase no **plano Pro desde 21/jul** (org "Zeste Consultoria Gastronômica", spend cap ligado). BEEMA e App 1402 ficam em org free separada.
- Padrão de tabela: `(id, cliente_id, dados jsonb, deleted_at)`

### Módulos
Início (central de ação) · Operação (fichas técnicas, pratos, produção, estoque, cadernos) · Clientes (hub) · Engenharia · Compras · Financeiro · Break-even · Comercial (CRM + playbook) · Marketing · Estúdio · Portal do Cliente (login próprio)

### Motor de CMV
- Unificado em `src/src/cmv.js` — exporta `pickIngrediente`, `calcFicha`, `calcAllFichas`, `calcPrato`. Importado por `Fichas.jsx` **e** `Engenharia.jsx` (antes divergiam: Engenharia usava `.find()` sem prioridade de preço do cliente).
- **Preço de ingrediente**: usa o preço do cliente se existir, senão o base `zeste`. Exibe os dois na tela ("usando SEU preço: R$X / base: R$Y").
- **FC/FK**: caprichar em cereais/cozidos/reduções, proteínas e aproveitamento parcial. Temperos e itens abaixo de 5% do peso são ruído — usar fator padrão.
- Divergência de custo vs planilha-fonte resolvida (FC/FK por item, preços reais migrados, de-para de nomes). Referência validada: Frango ao Molho Caipira com Polenta = R$ 7,12 / CMV 19,8%.
- **Prime Cost** (aba em Engenharia) tem 2 modos: "Cardápio completo" (com folha de cozinha, tabela `eng_folha`) e "Recorte de pratos" (contrato parcial — só CMV/margem, sem diluir mão de obra).

### Segurança (concluída)
Supabase Auth real · RLS `TO authenticated` com 47 políticas de isolamento por `cliente_id` · roles em `app_metadata` · security headers via `netlify.toml` · audit log append-only em `zeste_audit_log` com triggers em 7 tabelas críticas · políticas legadas permissivas `{public}` removidas.
Decisão: **não rotacionar a anon key** — é pública por design e o RLS a neutraliza.

### Portal do Cliente
- Redesenhado: sem emojis, copy explicativa, fontes maiores, responsivo mobile/iPad, Método 5E com rationale por fase.
- Lê a fase 5E de `crm_contatos` e a agenda de `portal_etapas`.
- `portal_projeto` (jsonb) e `portal_checks` (única tabela onde o cliente escreve) existem no banco mas **sem front** — migração parada, decisão futura.
- Bug corrigido em produção: o vínculo CRM↔portal usa o campo `company`, não `empresa`.

### Cadernos / documentos
- "Gerar Caderno" emite **2 documentos**: Caderno Operacional (cozinha, sem custos) e Caderno Gerencial (custos/CMV, confidencial).
- Regenerar **arquiva/substitui** a versão anterior do mesmo tipo/cliente — sem duplicatas.
- Abrem **inline em iframe com "‹ Voltar"** — `window.open` derrubava a sessão no iOS.
- No `modoPreparo`, linhas iniciadas com `⚠` ou `!` viram caixa de alerta no caderno.
- Publicar/Ocultar por botão na aba Documentos do hub Clientes (acabou o SQL de visibilidade).

### Outros
- **Contratos** (Editar Cliente): painel de descontos separa "Entra na conta" (bruto − taxa de cartão, na hora) de "Sobra de verdade" (− imposto, pago no DAS mensal).
- **Tributação**: Simples Nacional, comparador de operadoras, cascata bruto→líquido.
- **CRM**: log de ciclo de negociação (`crm_estagio_historico`, trigger `fn_log_estagio`, view `vw_crm_ciclo`), métricas mediana/média/P90, alerta de deals parados. Contato tem botão Excluir (soft delete).
- Correções críticas do pente-fino: precedência no `savePrato` (prato podia trocar de `cliente_id` ao salvar), exclusões pedem confirmação e bloqueiam se a ficha/ingrediente estiver em uso, "Gerar Caderno" recusa gerar com referência quebrada.

### Auditoria UX — plano em 5 fases
Diagnóstico central: faltava o eixo **Cliente→Projeto** como hub.

| Fase | Escopo | Status |
|---|---|---|
| 0 | Menu reordenado (Início, Clientes), headers consistentes, aba Documentos→Cadernos, estados vazios com CTA | ✅ deployada 19/jul |
| 1 | Clientes vira hub: Visão geral / Projeto / Documentos / Pratos. Comercial com submenu Pipeline / Clientes / Diretrizes | ✅ deployada 19/jul |
| 2 | Início vira central de ação: bloco "Exige atenção" (regras derivadas) + "Próximos encontros" + KPIs | ✅ deployada 19/jul |
| 3 | Preço de venda único no prato + lista de compras derivada da produção (mexe no banco) | ⏸ pausada |
| 4 | Fechamento Comercial → kick-off automático + design system | ⏸ pausada |

Motivo da pausa: rodar **uma semana de operação real** (kick-off do 440 em 21/jul) antes de mexer no banco.

---

## 3. Projeto 440 Confeitaria (Bianca)

### Escopo e valores
- **Etapa 1 fechada**: 6 produtos novos + testes + treinamento de 3 dias — **R$ 5.400 em 4x** (maquininha Infinity).
- **Etapa 2** (reformulação de 4 receitas, R$ 2.400) — fora do escopo atual.
- Divisão de papéis: Liziê **cria e treina**; Zeste **documenta e produz entregáveis**. Amanda na direção estratégica, Bruna na padronização.
- Intocável: **Torta de Maçã da vó do Lucca** é o carro-chefe.

### Os 6 produtos definidos
1. Bolo de nozes com doce de leite
2. Bolo de coco com amêndoas
3. Bolo Matilda (pode ser servido aquecido)
4. Bolo de limão siciliano com frutas vermelhas e chocolate branco
5. Cookie recheado (aquecido; venda no caixa, para viagem)
6. Bolo simples (duas opções de sabor)

### Cronograma
- **Kick-off: 21/07 às 19h**
- Cardápio com pratos entregue: 27/07
- Lista de compras enviada até: 29/07
- Dias de Teste: 04 e 05/08
- Treinamento: 23, 24 e 25/08

⚠ Conflito em aberto: o evento "Viagem Amanda" (02/08 10h → 05/08 11h) se sobrepõe aos dias de teste.

### Entregáveis produzidos
Briefing em PDF · apresentação da imersão (desktop com 9 slides + versão mobile em rolagem) · moodboard HTML · 17 perguntas enviadas à Liziê (aguardando resposta).

### Moodboard v3 (a montar)
Colagem de design, fundo **creme claro** (não mais dark), paleta em chips Pantone (Chocolate Intenso · Terracota Caramelo · Creme Baunilha · Verde Capim Santo · Amarelo Limão Siciliano), cartões-conceito estilo recorte com fita e leve rotação, opções em etiquetas arredondadas, elementos decorativos (limão, capim santo, chocolate, amêndoas), maiúscula no início das frases, espaços reservados para as fotos dos pratos.
PNGs já enviados: paleta, amêndoas, chocolate quebrado com calda, limões fatiados, capim santo. Fotos dos pratos ainda faltam.

### Regra de vocabulário
Usar **"refinar" / "aprimorar"**. Nunca "gourmet" / "gourmetizar".

### Pendências
- Respostas da Liziê às 17 perguntas
- Divisão financeira Liziê × Zeste
- Dados do Sischef (PDV)
- Responsável interno do 440 pelo treinamento
- Enviar moodboard à Bianca antes do kick-off

### Hub do projeto
Card Notion "🧁 440 Confeitaria" (`39250527-c00c-81df-b21f-ea55a6a5ded2`) — dashboard, quadro interno, kanban (~34 cards, view "Por Fase") e painel do cliente. A seção "📌 PONTO DE RETOMADA — 18/jul/2026" tem o histórico completo.

---

## 4. Convenções

- Todo "próximo passo" vira card no board Notion **"🌿 Zeste — Gestão de Tarefas"** (`0f0a7fcd-a055-447c-ad0c-75ad41bf9385`). Tarefas pessoais ficam em Área='Pessoal'.
- **Manual Operacional Zeste** (Notion `39250527-c00c-8104-b37d-d3615d65f680`) é a fonte de verdade de POPs, precificação e regras operacionais — consultar antes de qualquer trabalho nessas áreas.
- Zeste HQ root: `37350527-c00c-8183-94a7-f6a24b5f6d1f`
- Método **Zeste® 5E**: Enxergar → Estruturar → Evoluir → Escalar → Elevar.
- Linguagem da marca: "parceiro" (não cliente), "solução" (não serviço).
- Portal: Amanda descreve em português → Claude monta o SQL/dados filtrando o que é interno → Amanda roda no SQL Editor ou no PortalAdmin.

> Credenciais e senhas **não** entram neste arquivo. Ficam no gerenciador de senhas.

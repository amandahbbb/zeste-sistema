// Netlify Function — Brainstorm IA do Estúdio Zeste
// Recebe os cards atuais do canvas e expande/conecta ideias

const SYSTEM_PROMPT = `Você é o copiloto criativo do Estúdio Zeste — um espaço de brainstorming visual da Zeste, empresa de inteligência para negócios gastronômicos (Balneário Camboriú, SC).

CONTEXTO ZESTE:
- Inteligência para negócios gastronômicos (não consultoria tradicional)
- Parceira estratégica de donos de restaurantes, bistrôs, cafés, padarias artesanais
- Territórios: Inteligência Operacional, Desenvolvimento Gastronômico, Cuidado com o Empreendedor, Crescimento Sustentável, Cultura de Restauração
- Voz: acolhedora com autoridade — profundidade, clareza, humanidade, repertório, sofisticação
- Estética: editorial, minimalista, Swiss style, referências @0verlens, Are.na, Brand New

SEU PAPEL:
Você recebe um conjunto de ideias soltas (notas, referências, conceitos) que estão num canvas criativo. Seu trabalho é AMPLIAR o pensamento — não resumir. Você é um parceiro de brainstorm sofisticado que:
- Conecta ideias aparentemente soltas
- Propõe ângulos não óbvios
- Expande conceitos em direções férteis
- Sugere desdobramentos práticos E criativos
- Provoca reflexão, traz repertório (referências culturais, gastronômicas, de design)

NUNCA seja genérico ou óbvio. Pense fora da caixa. Traga o inesperado que faz sentido.

FORMATO DE RESPOSTA:
Responda APENAS com JSON válido, sem markdown:
{
  "cards": [
    {"tipo": "ideia", "texto": "uma ideia/conexão/expansão (1-3 frases, densa e instigante)", "cor": "lima|verde|azul|coral|creme"},
    {"tipo": "ideia", "texto": "outra direção criativa", "cor": "..."}
  ],
  "sintese": "uma frase curta que captura o fio condutor ou a provocação central que emergiu"
}

Gere entre 3 e 6 cards. Varie as cores. Cada card é uma semente de pensamento, não um parágrafo longo.`;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada.' }) };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: 'JSON inválido' }; }

  const { ideias, modo, instrucao } = body;

  const modoTxt = {
    expandir: 'Expanda essas ideias em novas direções criativas. Traga ângulos não óbvios.',
    conectar: 'Encontre conexões inesperadas entre essas ideias e proponha sínteses novas.',
    provocar: 'Provoque. Questione premissas. Traga o contraponto fértil que faz repensar.',
    aterrissar: 'Aterrisse essas ideias em desdobramentos práticos e acionáveis para a operação.',
  }[modo] || 'Expanda e conecte essas ideias de forma criativa.';

  const userPrompt = `IDEIAS ATUAIS NO CANVAS:
${ideias}

${instrucao ? `INSTRUÇÃO ESPECÍFICA: ${instrucao}\n` : ''}
MODO: ${modoTxt}

Pense como um parceiro criativo de QI 170. Traga o que ninguém pensaria, mas que ilumina.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const data = await response.json();
    if (data.error) return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: data.error.message || 'Erro na API' }) };

    let txt = data.content[0].text.trim().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(txt);

    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: String(err) }) };
  }
};

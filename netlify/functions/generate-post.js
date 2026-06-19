// Netlify Function — Gerador de Posts Zeste via Claude API
// Amanda: adicione ANTHROPIC_API_KEY nas variáveis de ambiente do Netlify

const SYSTEM_PROMPT = `Você é o gerador de conteúdo editorial da Zeste Consultoria Gastronômica.

IDENTIDADE DA ZESTE:
- Consultoria de performance operacional gastronômica (Balneário Camboriú, SC)
- Método: Estruturar → Performar → Posicionar → Evoluir
- Público: donos e gestores de restaurantes/bares, 25–44 anos
- Posicionamento: parceira estratégica, não só consultora técnica

TOM E VOZ (OBRIGATÓRIO):
- Implícito, reflexivo, nunca comercial direto
- Formato favorito: "X é:" com palavras únicas e evocativas por slide
- Inspiração: @omarcusribeiro_ — cada slide uma palavra, nunca explica demais
- Falar com quem já vive o problema, não explicar o óbvio
- Jamais usar: "nós somos especialistas", "entre em contato", "clique no link"
- A legenda convida à reflexão, não vende serviço

ESTÉTICA EDITORIAL (referências visuais da marca):
- Swiss International Style (tipografia bold, muito espaço em branco)
- Brand New (underconsideration.com) — análise crítica, não decorativa
- Are.na — pesquisa profunda, sem algoritmo, intelectual
- SiteInspire / Httpster — minimalismo digital, layout limpo
- Mindsparkle Mag — identidade visual sofisticada
- Storytelling implícito: mostra, não conta

PALETA:
- Lima #8FA715 (acento principal)
- Verde floresta #497A5D
- Off-white #F2EBD8
- Terracota #C4502B

FORMATO DE RESPOSTA:
Responda APENAS com JSON válido, sem markdown, sem texto fora do JSON:
{
  "titulo": "título do post (máx 4 palavras, impactante, pode ser 'X é:' ou assertivo)",
  "subtitulo": "frase de apoio (máx 12 palavras, complementa sem repetir)",
  "legenda": "legenda completa para Instagram (3-5 parágrafos curtos, tom reflexivo, termina com CTA implícito)",
  "hashtags": "#zesteconsultoria #gastronomia #gestaodecozinha [+4 hashtags relevantes ao tema]",
  "variacao_titulo": "título alternativo com outro ângulo",
  "variacao_legenda": "versão alternativa da legenda com tom diferente"
}`;

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada nas variáveis de ambiente do Netlify.' })
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: 'JSON inválido' }; }

  const { tema, tipo, tom, contexto } = body;

  const userPrompt = `Gere conteúdo para um post do Instagram da Zeste.

TEMA / CONCEITO: ${tema}
TIPO DE POST: ${tipo || 'educativo/reflexivo'}
TOM: ${tom || 'direto e editorial'}
${contexto ? `CONTEXTO ADICIONAL: ${contexto}` : ''}

Crie copy que ressoe com gestores de restaurantes que conhecem o problema na pele.
Lembre-se: o post perfeito da Zeste não explica — provoca o reconhecimento.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: data.error?.message || 'Erro na API' })
      };
    }

    const text = data.content?.[0]?.text || '{}';

    // Garantir JSON limpo
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: jsonStr
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};

import { createClient } from 'npm:@supabase/supabase-js@2.110.2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2.110.2/cors'
import { createOpenRouterClient } from './openRouterClient.ts'
import { validateTechnicalDossierInput } from './dossierValidator.ts'

declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (request: Request) => Promise<Response> | Response): void
}

const responseHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: responseHeaders })
}

function requireEnvironment(name: string): string {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required function environment: ${name}`)
  }

  return value
}

// A IA nunca cria, seleciona ou modifica o plano tecnico (docs/PRODUCT.md
// "Papel futuro da IA", DEC-056). Esta funcao recebe um TechnicalDossierV1
// ja calculado pelo motor deterministico e devolve apenas interpretacao em
// texto - nunca numeros novos, nunca ordens executadas. Exige sessao de
// usuario autenticado real: nao ha caminho service_role/agendado aqui, o
// dossie pertence a uma simulacao pontual do usuario que a solicitou.
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: responseHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ message: 'Método não permitido.' }, 405)
  }

  const authorization = request.headers.get('Authorization')

  if (!authorization) {
    return jsonResponse({ message: 'Autenticação obrigatória.' }, 401)
  }

  try {
    const supabaseUrl = requireEnvironment('SUPABASE_URL')
    const sessionClient = createClient(
      supabaseUrl,
      requireEnvironment('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: authorization } } }
    )
    const { data: authData, error: authError } =
      await sessionClient.auth.getUser()

    if (authError || !authData.user) {
      return jsonResponse({ message: 'Sessão autenticada inválida.' }, 401)
    }

    const body = await request.json()
    const dossier = validateTechnicalDossierInput(
      (body as { dossier?: unknown } | null)?.dossier
    )

    const apiKey = requireEnvironment('OPENROUTER_API_KEY')
    const openRouterClient = createOpenRouterClient({ apiKey })
    const explanation = await openRouterClient.explain(dossier)

    return jsonResponse(explanation)
  } catch (error) {
    // Mesmo bug que DEC-062 corrigiu em refresh-market-data: catch mudo aqui
    // deixava qualquer falha (chave invalida, provider fora do ar, dossie
    // malformado) indistinguivel de sucesso nos logs da funcao. So nome e
    // mensagem do erro - nunca o dossie (dado de carteira do usuario) nem a
    // chave de API.
    console.error(
      JSON.stringify({
        event: 'explain-contribution-plan-failed',
        name: error instanceof Error ? error.name : 'UnknownError',
        detail: error instanceof Error ? error.message : String(error),
      })
    )

    return jsonResponse(
      { message: 'Não foi possível gerar a explicação do plano.' },
      500
    )
  }
})

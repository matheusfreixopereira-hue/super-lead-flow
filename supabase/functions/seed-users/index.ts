import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const users = [
    { email: 'admin@superfranquias.com', password: '@superfranquias2026', display_name: 'Admin', role: 'admin' },
    { email: 'supervisor@superfranquias.com', password: '@superfranquias2026', display_name: 'Supervisor Super Franquias', role: 'supervisor' },
    { email: 'freixovinho24h@superfranquias.com', password: '@superfranquias2026', display_name: 'Freixo', role: 'closer' },
    { email: 'luzvinho24h@superfranquias.com', password: '@superfranquias2026', display_name: 'Luz', role: 'closer' },
    { email: 'jonesvinho24h@superfranquias.com', password: '@superfranquias2026', display_name: 'Jones', role: 'closer' },
    { email: 'gabivinho24h@superfranquias.com', password: '@superfranquias2026', display_name: 'Gabi', role: 'sdr' },
    { email: 'dayvinho24h@superfranquias.com', password: '@superfranquias2026', display_name: 'Day', role: 'sdr' },
  ]

  const results = []

  for (const u of users) {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(eu => eu.email === u.email)
    
    if (existing) {
      results.push({ email: u.email, status: 'already exists', id: existing.id })
      continue
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { display_name: u.display_name }
    })

    if (error) {
      results.push({ email: u.email, status: 'error', error: error.message })
      continue
    }

    // Set role in user_roles table
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: data.user.id, role: u.role })

    // Update profile with role
    await supabaseAdmin
      .from('profiles')
      .update({ role: u.role, display_name: u.display_name })
      .eq('user_id', data.user.id)

    results.push({ email: u.email, status: roleError ? 'user created, role error' : 'success', id: data.user.id })
  }

  // Seed knowledge base
  const { data: existingKB } = await supabaseAdmin.from('knowledge_base').select('id').limit(1)
  if (!existingKB?.length) {
    await supabaseAdmin.from('knowledge_base').insert([
      { category: 'descricao', title: 'Descrição do Negócio', content: 'A Vinho 24h é uma franquia inovadora de venda de vinhos em lojas autônomas 24 horas. Modelo de negócio com baixo custo operacional e alta margem de lucro.', sort_order: 1 },
      { category: 'investimento', title: 'Modelo de Franquia', content: 'Investimento inicial: R$ 150.000 a R$ 250.000\nTaxa de franquia: R$ 50.000\nRoyalties: 5% do faturamento\nPayback estimado: 12 a 18 meses\nFaturamento médio: R$ 80.000/mês', sort_order: 2 },
      { category: 'faq', title: 'Perguntas Frequentes', content: 'P: Preciso ter experiência com vinhos?\nR: Não! Oferecemos treinamento completo.\n\nP: Qual o horário de funcionamento?\nR: 24 horas, 7 dias por semana, de forma autônoma.\n\nP: Preciso estar presente na loja?\nR: Não, o modelo é semi-autônomo com monitoramento remoto.', sort_order: 3 },
      { category: 'argumentos', title: 'Argumentos de Venda', content: '• Mercado de vinhos cresce 20% ao ano no Brasil\n• Modelo autônomo = baixo custo com funcionários\n• ROI médio de 35% ao ano\n• Suporte completo da franqueadora\n• Ponto comercial pequeno (a partir de 30m²)', sort_order: 4 },
      { category: 'objecoes', title: 'Objeções e Respostas', content: 'Objeção: "É muito caro"\nResposta: O investimento se paga em 12-18 meses, com ROI de 35% ao ano.\n\nObjeção: "Não entendo de vinho"\nResposta: Fornecemos curadoria completa, treinamento e suporte.\n\nObjeção: "E se a loja for roubada?"\nResposta: Sistema de segurança 24h com câmeras e alarme. Seguro completo incluso.', sort_order: 5 },
      { category: 'materiais', title: 'Materiais de Apoio', content: 'Site: www.vinho24h.com.br\nApresentação institucional disponível em PDF\nVídeo institucional no YouTube', sort_order: 6 },
    ])
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

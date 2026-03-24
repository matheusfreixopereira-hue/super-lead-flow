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

  // Verify the calling user is admin or supervisor
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user: callingUser }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !callingUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }

  // Check caller's role
  const { data: callerRole } = await supabaseAdmin.rpc('get_user_role', { _user_id: callingUser.id })
  if (!callerRole || !['admin', 'supervisor'].includes(callerRole)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
  }

  const body = await req.json()
  const { action, email, password, display_name, role, user_id } = body

  // Supervisor can only manage sdr/closer
  if (callerRole === 'supervisor' && role && !['sdr', 'closer'].includes(role)) {
    return new Response(JSON.stringify({ error: 'Supervisores só podem gerenciar SDR e Closer' }), { status: 403, headers: corsHeaders })
  }

  // Supervisor cannot delete supervisors
  if (callerRole === 'supervisor' && action === 'delete' && user_id) {
    const { data: targetRole } = await supabaseAdmin.rpc('get_user_role', { _user_id: user_id })
    if (targetRole === 'supervisor' || targetRole === 'admin') {
      return new Response(JSON.stringify({ error: 'Sem permissão para excluir este usuário' }), { status: 403, headers: corsHeaders })
    }
  }

  try {
    if (action === 'create') {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password || '@superfranquias2026',
        email_confirm: true,
        user_metadata: { display_name }
      })
      if (error) throw error

      await supabaseAdmin.from('user_roles').insert({ user_id: data.user.id, role })
      await supabaseAdmin.from('profiles').update({ role, display_name }).eq('user_id', data.user.id)

      return new Response(JSON.stringify({ success: true, user_id: data.user.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update') {
      const updates: Record<string, string> = {}
      if (email) updates.email = email
      if (password) updates.password = password

      if (Object.keys(updates).length > 0) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, updates)
        if (error) throw error
      }

      if (display_name) {
        await supabaseAdmin.from('profiles').update({ display_name }).eq('user_id', user_id)
      }

      if (role) {
        await supabaseAdmin.from('user_roles').update({ role }).eq('user_id', user_id)
        await supabaseAdmin.from('profiles').update({ role }).eq('user_id', user_id)
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'toggle_active') {
      await supabaseAdmin.from('profiles').update({ active: body.active }).eq('user_id', user_id)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, lead_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch knowledge base content for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: kbEntries } = await supabase
      .from("knowledge_base")
      .select("title, category, content")
      .order("sort_order");

    let knowledgeContext = "";
    if (kbEntries && kbEntries.length > 0) {
      knowledgeContext = kbEntries.map(e => `### ${e.title} (${e.category})\n${e.content}`).join("\n\n");
    }

    // Fetch lead info if available
    let leadContext = "";
    if (lead_id) {
      const { data: lead } = await supabase.from("leads").select("*").eq("id", lead_id).single();
      if (lead) {
        leadContext = `\n\nLead atual: ${lead.first_name} ${lead.last_name || ""}, Email: ${lead.email || "N/A"}, Telefone: ${lead.phone || "N/A"}, Etapa: ${lead.stage}, Temperatura: ${lead.temperature}, BANT Status: ${lead.bant_status}`;
      }
    }

    const systemPrompt = `Você é um SDR (Sales Development Representative) inteligente do FREIXO CRM. Seu papel é qualificar leads usando o método BANT (Budget, Authority, Need, Timing).

Você tem acesso à seguinte base de conhecimento da empresa:

${knowledgeContext || "Nenhum conteúdo na base de conhecimento ainda."}
${leadContext}

Regras:
- Responda SEMPRE em português brasileiro
- Use as informações da base de conhecimento para responder perguntas sobre o negócio, franquias, investimentos, etc.
- Faça perguntas de qualificação BANT de forma natural e conversacional
- Seja profissional, amigável e objetivo
- Se não souber algo que não está na base de conhecimento, diga que vai verificar com a equipe`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sdr-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

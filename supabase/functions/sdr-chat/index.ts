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

    let leadContext = "";
    if (lead_id) {
      const { data: lead } = await supabase.from("leads").select("*").eq("id", lead_id).single();
      if (lead) {
        leadContext = `\n\nLead atual: ${lead.first_name} ${lead.last_name || ""}, Email: ${lead.email || "N/A"}, Telefone: ${lead.phone || "N/A"}, Etapa: ${lead.stage}, Temperatura: ${lead.temperature}, BANT Status: ${lead.bant_status}, Budget: ${lead.bant_budget || "não informado"}, Authority: ${lead.bant_authority || "não informado"}, Need: ${lead.bant_need || "não informado"}, Timing: ${lead.bant_timing || "não informado"}`;
      }
    }

    const systemPrompt = `Você é um SDR (Sales Development Representative) humano do FREIXO CRM, atendendo leads interessados na franquia Vinho 24h. Seu objetivo é qualificar leads e agendar reunião com o gerente de expansão.

PERSONALIDADE:
- Fale como uma pessoa real, simpática, leve e direta
- Respostas CURTAS (1-3 frases no máximo)
- Use linguagem informal mas profissional
- Nunca pareça um robô ou script
- Faça UMA pergunta por vez
- Reaja ao que o lead diz antes de fazer outra pergunta
- Use emojis com moderação (1-2 no máximo por mensagem)
- Priorize conversa fluida, nunca faça perguntas em bloco

FLUXO DE ATENDIMENTO (siga naturalmente, não de forma mecânica):

1. ABERTURA: Se apresente brevemente, mencione que viu o interesse na Vinho 24h, pergunte se pode explicar como funciona.

2. APRESENTAÇÃO: Se o lead aceitar, envie os links de material:
   📎 Apresentação: https://vinho24h.com.br/wp-content/uploads/2025/02/Apresentacao-Vinho24h-5.pdf
   📎 COF: https://vinho24h.com.br/cof2025
   Explique brevemente: "A Vinho 24h é uma adega autônoma dentro de condomínios, sem funcionários, funcionando 24h. Modelo enxuto, operação simples e alta demanda."

3. QUEBRA DE GELO: Pergunte por onde conheceu a Vinho 24h.

4. INVESTIGAR INTERESSE: Entenda a dor/motivação (renda extra, sair do CLT, investir, etc.)

5. APLICAÇÃO DO BANT (natural, sem parecer questionário):
   - Budget: "Hoje você já pensa em investir quanto mais ou menos?" Se travar, ajude: "Normalmente nossos investidores entram a partir de X mil, faz sentido pra você?"
   - Authority: "Essa decisão você toma sozinho ou tem mais alguém com você?"
   - Need: Aprofunde a dor que o lead mencionou
   - Timing: "Você pensa em começar mais pra quando? Está buscando algo mais imediato ou só analisando?"

6. CONDUÇÃO PÓS-BANT:
   - Se qualificado: Conduza para agendar reunião com gerente de expansão. Pergunte melhor dia/horário, peça WhatsApp e e-mail.
   - Se não qualificado: Mantenha leve, ofereça enviar mais conteúdos conforme for evoluindo. Não perca o lead.

7. PÓS-AGENDAMENTO: Confirme que receberá confirmação por e-mail, coloque-se à disposição.

INTELIGÊNCIA ADAPTATIVA:
- "Só estou olhando" → nutrir + manter conversa leve
- "Sem dinheiro agora" → marcar como futuro + educar sobre o modelo
- "Tenho interesse real" → acelerar para reunião
- "Já conheço" → pular apresentação, ir direto pro BANT

REGRAS ABSOLUTAS:
- NUNCA liste os critérios BANT explicitamente
- NUNCA diga "vou aplicar o método BANT" ou qualquer coisa técnica sobre o processo
- Sempre conduza para a reunião com o gerente de expansão
- Sempre reforce VALOR, nunca jogue preço seco
- Evite qualquer tipo de pressão
- Se não souber algo, diga "vou confirmar com meu time e te retorno"
- Adapte a conversa conforme as respostas do lead

BASE DE CONHECIMENTO (use quando o lead perguntar sobre o negócio):
${knowledgeContext || "Nenhum conteúdo cadastrado ainda."}
${leadContext}`;

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

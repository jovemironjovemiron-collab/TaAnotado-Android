import { processVoiceAudio } from "./voice-api.mjs";

const response = (body, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });
async function sameSecret(a, b) {
  const hash = async (v) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)));
  const [x, y] = await Promise.all([hash(a), hash(b)]);
  let difference = 0;
  for (let i = 0; i < x.length; i++) difference |= x[i] ^ y[i];
  return difference === 0;
}

export async function handleMobileRequest(request, env, upstream = fetch) {
  const origin = request.headers.get("origin");
  const allowed = origin === "https://localhost";
  const cors = (result) => {
    const headers = new Headers(result.headers);
    if (allowed) headers.set("access-control-allow-origin", origin);
    headers.set("vary", "Origin");
    headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
    headers.set("access-control-allow-headers", "Authorization, Content-Type");
    return new Response(result.body, { status: result.status, headers });
  };
  const fail = (error, message, status) => cors(response({ error, message }, status));
  if (origin && !allowed) return fail("FORBIDDEN", "Origem não autorizada.", 403);
  if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
  const path = new URL(request.url).pathname;
  if (!["/api/voice/health", "/api/voice/process"].includes(path)) return fail("NOT_FOUND", "Rota não encontrada.", 404);
  if (!env.VOICE_ACCESS_TOKEN || env.VOICE_ACCESS_TOKEN.length < 32)
    return fail("ACCESS_NOT_CONFIGURED", "O administrador precisa configurar o código de acesso.", 503);
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!token || !await sameSecret(token, env.VOICE_ACCESS_TOKEN))
    return fail("UNAUTHORIZED", "Código de acesso inválido. Confira em Mais > Configurações.", 401);
  const expires = Date.parse(env.VOICE_TEST_EXPIRES_AT || "");
  if (!Number.isFinite(expires)) return fail("TEST_NOT_CONFIGURED", "Configure a data final do teste no servidor.", 503);
  if (Date.now() >= expires) return fail("TEST_ENDED", "O acesso de teste ao áudio terminou. Aguarde a liberação pelo administrador.", 403);
  if (!env.OPENAI_API_KEY) return fail("AI_NOT_CONFIGURED", "Configure a chave da OpenAI no servidor.", 503);
  if (path === "/api/voice/health") {
    if (request.method !== "GET") return fail("METHOD_NOT_ALLOWED", "Use GET.", 405);
    try {
      for (const model of [env.TRANSCRIPTION_MODEL || "gpt-transcribe", env.ORGANIZATION_MODEL || "gpt-5.6-terra"]) {
        const check = await upstream(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`, {
          headers: { authorization: `Bearer ${env.OPENAI_API_KEY}` }, signal: AbortSignal.timeout(10000),
        });
        if (!check.ok) return fail("MODEL_ACCESS_FAILED", "A chave ou o acesso aos modelos da IA precisa ser verificado pelo administrador.", 503);
      }
      return cors(response({ message: "Servidor e acesso aos modelos verificados. Grave um áudio para testar transcrição e organização.", expiresAt: env.VOICE_TEST_EXPIRES_AT }));
    } catch { return fail("AI_UNREACHABLE", "Não foi possível verificar a conexão com a OpenAI.", 502); }
  }
  if (request.method !== "POST") return fail("METHOD_NOT_ALLOWED", "Use POST.", 405);
  if (!env.VOICE_QUOTA) return fail("QUOTA_NOT_CONFIGURED", "Configure o limite diário de uso no servidor.", 503);
  const quota = env.VOICE_QUOTA.get(env.VOICE_QUOTA.idFromName("private-test"));
  const reservation = await quota.fetch("https://quota/reserve", { method: "POST" });
  if (reservation.status !== 200) return fail("DAILY_LIMIT", "O limite diário de tentativas de áudio foi atingido. Tente amanhã.", 429);
  return cors(await processVoiceAudio(request, env, upstream));
}

// A single durable counter bounds paid attempts across isolates and devices.
export class VoiceQuota {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch(request) {
    if (request.method !== "POST") return new Response(null, { status: 405 });
    const day = new Date().toISOString().slice(0, 10);
    const configured = Number(this.env.VOICE_DAILY_LIMIT);
    const limit = Number.isInteger(configured) && configured > 0 ? Math.min(configured, 500) : 30;
    const accepted = await this.state.storage.transaction(async (storage) => {
      const saved = await storage.get("usage");
      const count = saved?.day === day ? saved.count : 0;
      if (count >= limit) return false;
      await storage.put("usage", { day, count: count + 1 });
      return true;
    });
    return new Response(null, { status: accepted ? 200 : 429 });
  }
}
export default { fetch: (request, env) => handleMobileRequest(request, env) };

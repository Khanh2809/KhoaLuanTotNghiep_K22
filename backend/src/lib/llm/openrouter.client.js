// Không cần import fetch
const BASE = process.env.OPENROUTER_BASE || 'https://openrouter.ai/api/v1';
const TITLE = 'AI Learning';
const REF = process.env.APP_URL || 'http://localhost:3000';

const KEY_POOL = (process.env.OPENROUTER_KEYS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

let rr = 0;
function pickKey() {
  if (!KEY_POOL.length) throw new Error('No OpenRouter key configured');
  const key = KEY_POOL[rr % KEY_POOL.length];
  rr++;
  return key;
}

function isRetryable(status, err) {
  if (err?.name === 'FetchError') return true;
  if ([408, 409, 425, 429, 500, 502, 503, 504].includes(status)) return true;
  return false;
}
function isKeyExhausted(status) { return [402, 403].includes(status); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function openrouterChat({
  model,
  messages,
  temperature = 0.2,
  stream = false,
  max_retries = Math.max(KEY_POOL.length, 1),
  per_try_timeout_ms = 20000,
}) {
  let lastErr;
  for (let i = 0; i < max_retries; i++) {
    const key = pickKey();
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), per_try_timeout_ms);
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': REF,
          'X-Title': TITLE,
        },
        body: JSON.stringify({
          model: model || process.env.OPENROUTER_DEFAULT_MODEL,
          messages, temperature, stream,
        }),
      });
      clearTimeout(to);

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        const status = res.status;
        if (isKeyExhausted(status)) { lastErr = new Error(`Key exhausted (${status}): ${txt||res.statusText}`); continue; }
        if (isRetryable(status)) { lastErr = new Error(`Retryable HTTP ${status}: ${txt||res.statusText}`); await sleep(Math.min(1500 * 2**i + Math.random()*250, 5000)); continue; }
        throw new Error(`OpenRouter error ${status}: ${txt || res.statusText}`);
      }

      if (stream) return res;
      return await res.json();

    } catch (e) {
      clearTimeout(to);
      lastErr = e;
      await sleep(Math.min(1000 * 2**i + Math.random()*200, 4000));
      continue;
    }
  }
  throw lastErr || new Error('OpenRouter request failed');
}

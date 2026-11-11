/* Server-side provider table. Keys come ONLY from environment variables (.env locally, Vercel env vars in production). */
const P = {
  groq: {
    name: 'Groq', free: 'all', maxTokens: 8000,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    modelsUrl: 'https://api.groq.com/openai/v1/models',
    models: [{ id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' }, { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' }, { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' }]
  },
  openrouter: {
    name: 'OpenRouter', free: 'openrouter', maxTokens: 16000,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    modelsUrl: 'https://openrouter.ai/api/v1/models',
    models: [{ id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (free)' }, { id: 'qwen/qwen3-coder:free', label: 'Qwen3 Coder (free)' }]
  },
  airforce: {
    name: 'Airforce', free: 'all', maxTokens: 8000,
    endpoint: 'https://api.airforce/v1/chat/completions',
    modelsUrl: 'https://api.airforce/v1/models',
    models: [{ id: 'llama-instant', label: 'Llama Instant' }]
  },
  xai: {
    name: 'Grok (xAI)', free: false, maxTokens: 16000,
    endpoint: 'https://api.x.ai/v1/chat/completions',
    models: [{ id: 'grok-4-fast', label: 'Grok 4 Fast' }, { id: 'grok-3-mini', label: 'Grok 3 Mini' }, { id: 'grok-3', label: 'Grok 3' }]
  }
};
for (const id in P) {
  const E = id.toUpperCase(); P[id].id = id;
  P[id].endpoint = process.env[E + '_ENDPOINT'] || P[id].endpoint;      // optional override (self-hosted gateways)
  P[id].modelsUrl = process.env[E + '_MODELS_URL'] || P[id].modelsUrl;
}
/** One key (NAME_API_KEY) or several separated by commas (NAME_API_KEYS). Placeholders are ignored. */
const keysOf = id => (process.env[id.toUpperCase() + '_API_KEYS'] || process.env[id.toUpperCase() + '_API_KEY'] || '')
  .split(',').map(s => s.trim()).filter(k => k && !/^(YOUR|xxx)/i.test(k));
module.exports = { P, keysOf };

#!/usr/bin/env node

const baseUrl = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
const model = process.env.OLLAMA_MODEL ?? 'deepseek-r1:1.5b';
const prompts = [
  'Responda apenas com o número: quanto é 17 vezes 6?',
  'Em português, resuma em no máximo duas frases por que não se deve inventar o status de um pedido quando a API está indisponível.',
  'Retorne somente JSON válido com as chaves status e origem, usando os valores "indisponivel" e "api".'
];

const seconds = (nanoseconds) => nanoseconds / 1e9;
const rate = (count, duration) => duration ? count / seconds(duration) : 0;

for (const [index, prompt] of prompts.entries()) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({model, prompt, stream: false, keep_alive: '5m'})
  });
  if (!response.ok) throw new Error(`Ollama respondeu HTTP ${response.status}: ${await response.text()}`);
  const result = await response.json();
  console.log(JSON.stringify({
    test: index + 1,
    model: result.model,
    wall_seconds: (performance.now() - startedAt) / 1000,
    total_seconds: seconds(result.total_duration),
    load_seconds: seconds(result.load_duration),
    prompt_tokens: result.prompt_eval_count,
    prompt_tokens_per_second: rate(result.prompt_eval_count, result.prompt_eval_duration),
    output_tokens: result.eval_count,
    output_tokens_per_second: rate(result.eval_count, result.eval_duration),
    response: result.response,
    thinking: result.thinking
  }));
}

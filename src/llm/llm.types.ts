export interface GenerateRequest {
  message: string;
}

export interface GenerateResult {
  content: string;
  model: string;
}

export interface LlmProvider {
  generate(request: GenerateRequest): Promise<GenerateResult>;
}


export interface RagSource {
  title: string;
  url: string;
}

export interface RagResult {
  context: string;
  sources: RagSource[];
}

export interface RagRetriever {
  retrieve(query: string): Promise<RagResult>;
}


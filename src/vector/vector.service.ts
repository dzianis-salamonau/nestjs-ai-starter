import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

type VectorRecord = {
  id: string;
  values: number[];
  metadata?: Record<string, string>;
};

@Injectable()
export class VectorService {
  private readonly log = new Logger(VectorService.name);
  private readonly dims: number;
  private readonly store = new Map<string, VectorRecord>();
  private client?: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.dims = Number(this.config.get('VECTOR_DIMS') ?? 1536);
  }

  private ensureEmbeddings(): OpenAI {
    if (!this.client) {
      const key = this.config.get<string>('OPENAI_API_KEY');
      if (!key) {
        throw new BadRequestException(
          'Embeddings require OPENAI_API_KEY (OpenAI vector API).',
        );
      }
      this.client = new OpenAI({ apiKey: key });
    }
    return this.client;
  }

  async embed(text: string): Promise<number[]> {
    const model =
      this.config.get<string>('OPENAI_EMBEDDING_MODEL') ??
      'text-embedding-3-small';
    const api = this.ensureEmbeddings();
    const res = await api.embeddings.create({
      model,
      input: text,
      dimensions: this.dims,
    });
    const vec = res.data[0]?.embedding;
    if (!vec) throw new BadRequestException('embedding failed');
    return vec;
  }

  async upsert(
    id: string,
    text: string,
    metadata?: Record<string, string>,
  ): Promise<{ id: string; dims: number }> {
    const values = await this.embed(text);
    this.store.set(id, { id, values, metadata });
    this.log.debug(`vector upsert ${id}`);
    return { id, dims: values.length };
  }

  async query(text: string, topK: number) {
    const q = await this.embed(text);
    const scored = [...this.store.values()].map((row) => ({
      id: row.id,
      score: cosine(q, row.values),
      metadata: row.metadata,
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  clear() {
    this.store.clear();
  }
}

function cosine(a: number[], b: number[]) {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

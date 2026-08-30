import { NextRequest, NextResponse } from 'next/server';

const apiUrl = process.env.API_INTERNAL_URL ?? 'http://api:3000';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID();

  try {
    const payload: unknown = await request.json();
    const response = await fetch(`${apiUrl}/messages/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': correlationId,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(190000),
      cache: 'no-store',
    });
    if (!response.ok) {
      const body: unknown = await response.json();
      return NextResponse.json(body, { status: response.status });
    }
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'application/x-ndjson; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        'x-correlation-id': response.headers.get('x-correlation-id') ?? correlationId,
      },
    });
  } catch (error: unknown) {
    const timeout = error instanceof Error && error.name === 'TimeoutError';
    return NextResponse.json(
      {
        code: timeout ? 'API_TIMEOUT' : 'API_UNAVAILABLE',
        message: timeout
          ? 'A resposta está demorando mais que o esperado. Tente novamente.'
          : 'O assistente está temporariamente indisponível. Tente novamente.',
      },
      { status: timeout ? 504 : 503 },
    );
  }
}

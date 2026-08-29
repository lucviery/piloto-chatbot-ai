import { NextRequest, NextResponse } from 'next/server';

const apiUrl = process.env.API_INTERNAL_URL ?? 'http://api:3000';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID();

  try {
    const payload: unknown = await request.json();
    const response = await fetch(`${apiUrl}/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': correlationId,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(190000),
      cache: 'no-store',
    });
    const body: unknown = await response.json();
    return NextResponse.json(body, { status: response.status });
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


import { Injectable } from '@nestjs/common';

export type InitialIntent = 'CANCEL' | 'OTHER';

@Injectable()
export class IntentClassifierService {
  classify(message: string): InitialIntent {
    const normalized = message
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .replace(/\s+/g, ' ')
      .trim();

    const explicitCancellation = [
      /\bcancelar\b/,
      /\bcancelamento\b/,
      /\bdesistir (do|da) (pedido|compra|ingresso)\b/,
    ];
    return explicitCancellation.some((pattern) => pattern.test(normalized)) ? 'CANCEL' : 'OTHER';
  }
}

# Avaliação: retirada do DokuWiki e uso de RAG em `docs/skills`

Data da avaliação: 2026-08-30 UTC.

## Conclusão

Retirar o domínio `https://dokuwiki.megaue.com.br` do corpus atual faz sentido, mas os arquivos de `docs/skills` não devem ser transformados integralmente em RAG.

Esses arquivos descrevem fluxos transacionais, estados, validações, endpoints, tratamento de erros e regras de segurança. Esse conteúdo precisa de execução determinística por uma máquina de estados e por Tools tipadas, em vez de recuperação semântica probabilística.

## Classificação recomendada

| Conteúdo | Destino recomendado |
|---|---|
| Fluxos de cancelamento, transferência e vendas | Máquina de estados e Tools |
| Parâmetros e contratos dos endpoints | Schemas tipados das Tools |
| Validações de localizador, e-mail, código e opções | Código determinístico |
| Controle `BOT/HUMAN`, etapas e transições | Estado persistido da conversa |
| Mensagens de erro retornadas pelas APIs | Respostas estruturadas das Tools |
| Descrições curtas para reconhecer intenção | Prompt ou registro de Tools |
| Políticas, FAQs e explicações estáveis ao cliente | RAG, se houver corpus apropriado |

## Por que não usar RAG para todas as skills

Os documentos possuem requisitos que uma busca vetorial não consegue garantir:

- O fluxo de transferência tem dois caminhos, cancelamentos diferentes e uma ordem obrigatória de chamadas.
- O cancelamento somente pode prosseguir quando o pedido estiver com `status == CONFIRM`.
- O suporte precisa silenciar o bot depois do encaminhamento para atendimento humano.
- Algumas operações exigem códigos enviados por e-mail e validados exclusivamente pela API.
- O documento de ticket contém uma alteração de backend que ainda não foi publicada em produção.
- Alguns documentos contêm endpoints e detalhes internos que não devem ser apresentados diretamente ao usuário.

Se esses documentos forem divididos em fragmentos e transformados em embeddings, o modelo poderá recuperar apenas parte do procedimento, misturar etapas ou utilizar um contrato ainda não publicado.

O próprio arquivo `docs/skills/llm-knowledge-base.md` estabelece que os `ConversationStep` devem ser a fonte de verdade e que cada operação deve ser exposta como uma Tool com parâmetros definidos.

## Limitação da arquitetura atual

Atualmente, toda mensagem gera um embedding e consulta o pgvector antes de o sistema decidir a rota. A presença de qualquer fragmento com similaridade mínima transforma automaticamente a rota em `rag`.

Isso provoca:

- latência desnecessária para saudações e fluxos transacionais;
- risco de falso positivo baseado somente no limiar de similaridade;
- escolha do RAG antes de considerar o estado atual da conversa;
- dependência do modelo de embeddings mesmo quando ele não é necessário.

A validação anterior registrou respostas RAG levando aproximadamente 2,5 minutos no hardware atual. Essa latência não é adequada para fluxos conversacionais com várias etapas.

## Arquitetura proposta

```text
Mensagem
  |
  v
Estado atual da conversa
  |-- fluxo ativo -> executar etapa determinística + Tool
  |-- nova intenção transacional -> iniciar fluxo correspondente
  |-- pergunta documental/política -> consultar RAG
  `-- conversa geral -> resposta direta
```

As skills devem orientar a criação de:

1. `ToolDefinition`: nome, descrição, schema de entrada e schema de saída.
2. `FlowDefinition`: estados, transições e operações permitidas.
3. Handlers NestJS para suporte, cancelamento, transferência, vendas e ticket.
4. Testes derivados das tabelas de cenários já presentes nos documentos.
5. Uma base pequena para o LLM contendo apenas reconhecimento de intenção e orientação sobre quando delegar.

O LLM pode ajudar a reconhecer a intenção e extrair campos da mensagem, mas não deve decidir livremente a próxima etapa, ignorar validações ou inventar chamadas de API.

## O que pode continuar como RAG

A infraestrutura de RAG pode ser mantida para um corpus futuro composto por:

- políticas de cancelamento e reembolso;
- dúvidas gerais sobre produtos;
- manuais destinados ao cliente;
- perguntas frequentes;
- procedimentos explicativos que não executem operações transacionais.

Esse corpus deve ser explicitamente autorizado, versionado e separado das definições internas de Tools. Recomenda-se adicionar metadados como `corpus`, `visibility`, `environment` e `effective_from`, permitindo filtrar documentos antes da busca vetorial.

## Plano recomendado

1. Desativar os documentos do DokuWiki no índice, preservando-os inicialmente para rollback.
2. Remover `RAG_BASE_URL` e desacoplar a ingestão de uma URL fixa.
3. Fazer o roteamento considerar estado e intenção antes de gerar embeddings.
4. Implementar primeiro um fluxo menor, como suporte ou cancelamento, usando máquina de estados.
5. Transformar os contratos das APIs em Tools tipadas.
6. Converter os cenários de teste presentes nas skills em testes de aceite automatizados.
7. Selecionar depois apenas o conteúdo verdadeiramente documental para um novo corpus RAG.

## Decisão recomendada

`docs/skills` deve ser tratado como especificação para implementar Tools e fluxos determinísticos, e não como um corpus a ser integralmente indexado no pgvector.

O RAG permanece como componente secundário para conhecimento explicativo, autorizado e relativamente estável.

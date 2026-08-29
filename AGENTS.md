# Instruções persistentes do repositório

Estas instruções se aplicam a todo o repositório `piloto-chatbot-ai`.

## Início de cada sessão

Antes de propor ou executar mudanças:

1. Leia `README.md`, `PROJECT_CONTEXT.md` e `PROJECT_MEMORY.md`.
2. Verifique o estado do Git e preserve alterações existentes do usuário.
3. Confirme que o trabalho está restrito a este repositório.
4. Trate o código e a documentação atuais como fonte de verdade; use a memória como contexto, não como substituto da verificação.

Quando o usuário pedir para analisar as últimas ações e continuar de onde parou, execute a recuperação de sessão antes de alterar arquivos:

1. Leia a seção `Ponto de retomada` de `PROJECT_MEMORY.md`.
2. Inspecione `git status`, o diff de trabalho, os commits recentes e o histórico relevante dos arquivos.
3. Identifique mudanças concluídas, mudanças ainda não commitadas, testes executados e pendências.
4. Compare o relato da memória com o estado real do repositório e corrija divergências.
5. Apresente um resumo curto do último estado confirmado e retome a primeira pendência segura.

Não descarte alterações locais para reconstruir uma sessão. Não trate uma intenção anotada como trabalho concluído sem evidência no código, no Git ou em resultados de testes.

## Memória do projeto

- Registre em `PROJECT_MEMORY.md` todo aprendizado durável que ajude sessões futuras: decisões, restrições, descobertas técnicas, problemas encontrados, soluções validadas, estado do trabalho e próximos passos.
- Atualize a memória na mesma alteração que introduzir ou validar o aprendizado.
- Mantenha a seção `Ponto de retomada` atualizada após cada bloco material de trabalho, registrando a última ação concluída, verificações realizadas, trabalho em andamento e próximo passo exato.
- Separe fatos confirmados, decisões tomadas, hipóteses e pendências.
- Inclua a data em UTC nas novas entradas do histórico.
- Corrija informações superadas em vez de perpetuar contradições. Preserve no histórico decisões relevantes e indique quando foram substituídas.
- Não registre conversas triviais, tentativas sem valor futuro ou detalhes facilmente obtidos pelo código.
- Nunca registre tokens, senhas, chaves privadas, credenciais, dados pessoais sensíveis ou conteúdo confidencial desnecessário.

## Encerramento do trabalho

Antes de considerar uma tarefa concluída:

1. Execute verificações proporcionais à mudança.
2. Atualize `PROJECT_MEMORY.md` se houve aprendizado durável ou mudança de estado.
3. Atualize o `Ponto de retomada`, mesmo quando a tarefa ficar incompleta.
4. Informe claramente o que mudou, o que foi testado e o que permanece pendente.

## Diretrizes técnicas

- Siga a arquitetura, o escopo e a ordem do MVP definidos em `PROJECT_CONTEXT.md`.
- Avalie o ambiente antes de instalar ou configurar software, conforme a diretriz obrigatória registrada em `PROJECT_CONTEXT.md`.
- Não versione segredos. Use variáveis de ambiente e arquivos de exemplo sem valores reais.
- Mantenha o RAG documental separado das consultas transacionais feitas por Tools/APIs oficiais.

## Autonomia e permissões

- Esta máquina é o ambiente integrado de desenvolvimento e testes do piloto e poderá hospedar todos os componentes do projeto.
- Avance autonomamente em inspeções, implementação, testes e mudanças reversíveis restritas ao repositório e ao ambiente do piloto.
- Solicite somente a permissão mínima necessária, com alvo e finalidade claros.
- Agrupe aprovações semelhantes quando isso reduzir interrupções sem ampliar excessivamente o acesso.
- Peça confirmação antes de elevar privilégios, instalar pacotes no sistema, alterar firewall ou rede, expor portas, modificar serviços externos à pilha do piloto, manipular segredos ou executar ações destrutivas.
- Prefira containers, diretórios do projeto e configurações locais a mudanças globais no sistema quando forem tecnicamente adequados.
- Não reutilize a autorização para o piloto como permissão para modificar componentes não relacionados desta máquina.
- O fato de ser um piloto permite simplificar operação e disponibilidade, mas não autoriza ignorar segurança básica, isolamento de segredos, backups de dados relevantes ou verificações antes de mudanças.

# Inventário do ambiente do piloto

Última verificação: 2026-08-29 UTC.

Esta máquina é o ambiente integrado de desenvolvimento, testes e hospedagem do `piloto-chatbot-ai`. O inventário abaixo foi obtido de forma não destrutiva antes da instalação dos componentes.

## Sistema e hardware

- Sistema operacional: Ubuntu 26.04.1 LTS (Resolute Raccoon).
- Kernel: Linux 7.0.0-30-generic.
- Arquitetura: x86_64.
- CPU: Intel Core i7-8565U, 8 CPUs lógicas, com VT-x.
- Memória: 14 GiB; aproximadamente 14 GiB disponíveis no momento da inspeção.
- Swap: 4 GiB, sem uso no momento da inspeção.
- Armazenamento: volume ext4 de 98 GiB, com 84 GiB livres.
- GPU: Intel UHD Graphics 620 integrada; nenhuma GPU NVIDIA detectada.

## Ferramentas encontradas

- Node.js: 22.22.1.
- npm: 9.2.0.
- Python: 3.14.4.
- Docker: ausente.
- Docker Compose: ausente.
- Podman: ausente.
- pnpm e Yarn: ausentes.
- Cliente PostgreSQL (`psql`): ausente.
- Ollama: ausente.

## Rede e serviços

- Endereço observado na rede local: `192.168.0.80`.
- Porta TCP 22 em escuta em IPv4 e IPv6 para SSH.
- Nenhuma porta da aplicação, banco ou Ollama estava em escuta.
- O estado do UFW não pôde ser consultado sem autenticação administrativa e permanece pendente.

## Pacotes disponíveis no Ubuntu

- `docker.io`: candidato 29.1.3-0ubuntu4.1.
- `docker-compose-v2`: candidato 2.40.3+ds1-0ubuntu1.

As versões devem ser confirmadas novamente imediatamente antes da instalação, pois os repositórios do sistema podem mudar.

## Avaliação inicial

- CPU, memória e armazenamento são suficientes para iniciar a pilha web, API, PostgreSQL e serviços auxiliares do piloto.
- A ausência de GPU dedicada limita a inferência local. O primeiro teste deve usar um modelo DeepSeek pequeno e quantizado; latência e consumo de memória devem ser medidos antes de aumentar o modelo.
- Docker Compose é o caminho preferencial para isolar e reproduzir a pilha.
- A exposição externa do site exige uma decisão posterior sobre domínio, TLS, proxy reverso e regras de firewall. Nenhuma porta nova deve ser aberta antes dessa definição.

## Pendências antes da instalação

1. Confirmar acesso administrativo para instalar Docker e consultar/configurar o firewall.
2. Definir o modelo DeepSeek inicial compatível com CPU e 14 GiB de RAM.
3. Definir portas internas da composição, mantendo banco, Ollama e serviços internos sem exposição pública.
4. Confirmar como o site será acessado inicialmente: somente rede local ou internet.

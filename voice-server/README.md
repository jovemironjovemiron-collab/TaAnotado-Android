# Ativar o áudio do TáAnotado 17

Este servidor é para um teste privado compartilhado. Não exige login no ChatGPT. Não é ainda o sistema de contas, assinaturas ou teste individual por usuário.

## Publicar pelo celular com GitHub e Cloudflare

1. Entre em https://dash.cloudflare.com/ e abra Workers & Pages > Create > Import a repository.
2. Conecte sua conta GitHub e selecione `jovemironjovemiron-collab/TaAnotado-Android`, branch `main`.
3. Nome do Worker: `taanotado-audio`. Diretório raiz: `voice-server`. Comando de build: deixe vazio. Comando de deploy: `npx wrangler deploy`. Publique.
4. No Worker publicado, abra Settings > Variables and Secrets. Configure no AMBIENTE DE EXECUÇÃO, não apenas nas variáveis do build:

| Nome | Tipo | Valor |
| --- | --- | --- |
| OPENAI_API_KEY | Secret | Sua chave de API OpenAI, com saldo e acesso aos modelos |
| VOICE_ACCESS_TOKEN | Secret | Código aleatório privado de pelo menos 32 caracteres, criado por você; use o mesmo código no APK |
| VOICE_TEST_EXPIRES_AT | Text | Data final em UTC, 14 dias após começar, por exemplo `2026-10-18T17:00:00Z` se começar em 04/10 às 14h de Brasília |

5. Salve/publique as mudanças de configuração. Copie a URL HTTPS do Worker, terminada em `.workers.dev`.
6. Instale o APK 17. Em Mais > Configurações, coloque a URL e o código VOICE_ACCESS_TOKEN. Não coloque a chave OpenAI no celular. Toque em Verificar serviço de áudio e depois em Salvar configurações.
7. Em Organizar > Falar, grave seu relato real e toque em Organizar. Confira cliente, serviço, valores e datas antes de salvar. Use Ajustar por áudio para corrigir o resultado.

## Como verificar

- Diagnóstico aprovado: servidor e acesso aos dois modelos verificados. Ainda não prova saldo para inferência nem precisão da transcrição.
- Teste real aprovado: fala gravada aparece como transcrição, os dados vêm dessa fala e o relatório é salvo apenas após confirmação.
- Faça mais um áudio com conteúdo diferente e uma correção de valor; confirme que os dados anteriores não aparecem por engano.
- Falha: copie somente a mensagem do aplicativo. Não compartilhe chaves ou códigos.

O limite inicial é 30 tentativas de processamento por dia para TODO este teste privado, incluindo tentativas com falha. Reseta às 00h UTC (21h de Brasília). VOICE_DAILY_LIMIT pode ser alterado no wrangler.jsonc, até 500. A gravação tem limite de 120 segundos e 12 MiB. No fim do prazo, o servidor bloqueia o áudio; pagamentos ainda não foram implementados. O modo digitado continua local e gratuito.

Os modelos padrão são `gpt-transcribe` e `gpt-5.6-terra`, configuráveis no wrangler.jsonc. A precisão precisa ser medida com relatos reais; o serviço não promete entender toda fala. A API OpenAI tem cobrança própria para o dono do aplicativo, mesmo durante o teste gratuito para usuários.

O APK 17 usa um pacote de teste separado dos APKs 12/15/16. Exporte seus registros em Mais > Backup antes de migrar e importe no novo aplicativo. Não desinstale o antigo antes de conferir o backup.

## Publicar pelo computador (alternativa)

Na pasta voice-server, com Node.js instalado:

```bash
npm install
npx wrangler login
npx wrangler deploy
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put VOICE_ACCESS_TOKEN
npx wrangler secret put VOICE_TEST_EXPIRES_AT
```

Os comandos de secrets solicitam os valores sem colocá-los no código. O deploy cria o Durable Object VOICE_QUOTA, que mantém o contador diário entre instâncias. Não remova esse vínculo. Após o deploy, siga os passos 5 a 7 acima.

Referências oficiais:
- https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://platform.openai.com/api-keys

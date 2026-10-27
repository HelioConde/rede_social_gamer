# Auditoria visual automática (Playwright)

## O que foi configurado

A suíte de auditoria visual percorre 11 rotas, além de capturas adicionais de tema claro para feed e perfil (13 capturas por resolução).

**Resoluções:** 320×740, 375×812, 768×1024, 1024×768 e 1440×900. Total esperado: **65 capturas integrais**.

Em cada rota, a auditoria:
1. Aguarda o título correspondente para verificar se a tela foi renderizada.
2. Salva um PNG usando `page.screenshot({ fullPage: true })` e desliga as animações da captura.
3. Recolhe erros de JavaScript, exceções assíncronas, respostas HTTP de erro, falhas de recursos locais e mensagens `console.error`.
4. Mede overflow horizontal, controles fora da viewport, textos cortados, imagens quebradas e interseções indevidas no cabeçalho.
5. Salva o relatório por resolução em `visual-audit/<viewport>/manifest.json`.

A suíte executa somente o **modo demonstração**: nunca utiliza contas reais ou credenciais.

## Executar localmente

```bash
npm install
npx playwright install chromium
npm run test:e2e
npm run test:visual
npm run report:visual
```

O comando `npm run test:visual` utiliza um servidor Vite temporário em http://127.0.0.1:4173. Depois, abra `visual-audit/index.html` e navegue pelas imagens e pelos diagnósticos. A auditoria gera também `visual-audit/summary.md` e `visual-audit/summary.json`.

## Evidências no GitHub

O workflow **QA GameSocial** executa testes de unidade, build, testes funcionais e a auditoria visual em cada pull request. Mesmo com falhas, salva os PNGs, traces e relatórios no artefato **gamesocial-auditoria-visual** por 14 dias. O resumo aparece também na página de execução do GitHub Actions.

O workflow deve falhar se houver erro de JS, HTTP/rede de primeira parte, captura inválida ou overflow/recortes/controles fora da viewport. Uma captura com problemas pode ser revisada e o CSS corrigido antes do merge.

## Limitações

- A análise geométrica é **heurística**: não substitui a revisão visual humana nem uma auditoria formal de acessibilidade.
- HTTP de outros domínios e avisos do navegador são registrados para inspeção; erros de rede de primeira parte e exceções não tratadas são bloqueantes.
- Não é um pixel-diff visual entre commits. Para detectar mudanças estéticas sutis, compare as capturas armazenadas em execuções anteriores.
- Nomes de arquivos e timestamps podem variar entre execuções; nenhum PNG é publicado no site de produção, só como artefato de CI.

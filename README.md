<div align="center">
  <h1>🎮 GameSocial — Protótipo de comunidade gamer</h1>
  <p><strong>Experimento front-end para explorar telas, cadastro e navegação de uma rede social voltada a jogadores.</strong></p>
  <p><img alt="React" src="https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white"> <img alt="Status" src="https://img.shields.io/badge/status-prot%C3%B3tipo-64748b"></p>
</div>

## O que já está no código

O aplicativo usa React Router, Redux e páginas dedicadas aos primeiros passos de uma comunidade gamer. A estrutura real contém os fluxos/telas abaixo:

| Caminho | Componente |
| --- | --- |
| `/` e `/acesso` | Entrada e acesso |
| `/registro` | Registro |
| `/adicionais` | Dados complementares |
| `/inicio` | Página inicial |

Há uma base de gerenciamento de estado no diretório `src/redux/`. **Feed social público, mensagens, integrações com jogos e moderação não devem ser considerados prontos apenas porque fazem parte da ideia do produto.**

## Executar

```bash
git clone https://github.com/HelioConde/rede_social_gamer.git
cd rede_social_gamer
npm install
npm start
```

Abra `http://localhost:3000` ou a porta indicada pelo React Scripts.

Scripts disponíveis: `npm run build`, `npm test` e `npm run deploy` (este último requer GitHub Pages configurado).

## Tecnologias e organização

**React 18** · **React Router** · **Redux/React Redux** · **Axios** · **Create React App**.

```text
src/
  App.jsx       Rotas
  Acesso.jsx    Tela de acesso
  Registro.jsx  Cadastro
  Adicionais.jsx
  Inicio.jsx
  redux/        Estado global
public/         Recursos estáticos
```

## Status e limites

**Protótipo histórico.** Antes de transformar isso em serviço real, são necessários backend com autenticação confiável, controle de privacidade, tratamento de dados pessoais, regras de moderação e testes de integração.

Não use credenciais verdadeiras ou dados de terceiros enquanto essas medidas não estiverem validadas.

Criado por [Hélio Conde](https://github.com/HelioConde).

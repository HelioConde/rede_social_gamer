import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
export default [
  { ignores: ['dist/**','build/**','node_modules/**','coverage/**','server/data/**','src/Acesso.jsx','src/Registro.jsx','src/Adicionais.jsx','src/Inicio.jsx','src/redux/**','src/App.test.js','src/index.js','src/reportWebVitals.js'] },
  js.configs.recommended,
  {
    files:['src/**/*.{js,jsx}','vite.config.js','playwright.config.js','tests/**/*.{js,jsx}'],
    languageOptions:{ecmaVersion:'latest',sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}},globals:{...globals.browser,...globals.node}},
    plugins:{'react-hooks':reactHooks},
    rules:{'no-unused-vars':'off','no-undef':'error','react-hooks/rules-of-hooks':'error','react-hooks/exhaustive-deps':'warn'}
  }
];
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Acesso from './Acesso';
import Registro from './Registro';
import Inicio from './Inicio';
import Adicionais from './Adicionais';
import { Provider } from 'react-redux';
import store from './redux/store'; // Importe seu store Redux

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/acesso" element={<Acesso />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/adicionais" element={<Adicionais />} />
          {/* Adicione outras rotas conforme necessário */}
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;

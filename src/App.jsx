import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
          <Route path="/" element={<Acesso />} />
          <Route path="/acesso" element={<Acesso />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/adicionais" element={<Adicionais />} />
          <Route path="/inicio" element={<Inicio />} />
          {/* Adicione outras rotas conforme necessário */}
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
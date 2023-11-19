import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setUserData } from './redux/actions';
import Cookies from 'js-cookie'; // Importe js-cookie
import './styles/acesso.css';

function Acesso() {
    const dispatch = useDispatch();
    const [loginData, setLoginData] = useState({
        email: '',
        senha: '',
        acesso: true,
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLoginData({
            ...loginData,
            [name]: value,
        });
    };

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost/api/data.php', loginData);

            console.log('Resposta do login:', response.data);

            if (response.data.success) {
                // Set cookies only if "Manter Login" checkbox is checked
                if (loginData.acesso) {
                    Cookies.set('userId', response.data.id);
                    const expirationDate = new Date();
                    expirationDate.setDate(expirationDate.getDate() + 30); // Adiciona 30 dias à data atual
                    Cookies.set('userToken', response.data.token, {
                        secure: true,
                        sameSite: 'Lax',
                        expires: expirationDate,
                    });
                }

                dispatch(setUserData({ id: response.data.id, token: response.data.token }));
                navigate('/inicio');
            } else {
                // Handle login errors, e.g., show an error message
                console.error('Login failed:', response.data.error);
            }
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            // Handle login errors, if necessary
        }
    };

    return (
        <>
            <div className='acesso fullScreen'>
                <div className='form'>
                    <div className='info'>
                        <div className='infoBox'>
                            <div className='infoTitle'>
                                Rede Gamer
                            </div>
                            <div className='infoImg'>
                                Rede Gamer
                            </div>
                            <Link to="/registro" className='infoButton'>
                                Cadastrar
                            </Link>
                        </div>
                    </div>
                    <div className='formLogin'>
                        <div className='formLoginBox'>
                            <div className='formTitle'>
                                Fazer Login
                            </div>

                            <div className='formInput'>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    required
                                    spellCheck="false"
                                    onChange={handleChange}
                                />
                                <span className="placeholder">
                                    E-mail
                                </span>
                            </div>

                            <div className='formInput'>
                                <input
                                    type="password"
                                    name="senha"
                                    id="senha"
                                    required
                                    spellCheck="false"
                                    onChange={handleChange}
                                />
                                <span className="placeholder">
                                    Senha
                                </span>
                            </div>

                            <div className='formCheck'>
                                <input type="checkbox" name="manter" id="manter" />
                                <label htmlFor="manter">Manter Login</label>
                            </div>

                            <div className='acessButton' onClick={handleLogin}>
                                Acessar
                            </div>

                            <div className='notAcess'>
                                Não consegue acessar?
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Acesso;
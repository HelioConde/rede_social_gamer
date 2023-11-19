import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import InputMask from 'react-input-mask'; // Importe o componente InputMask
import { useDispatch } from 'react-redux';
import { setUserData } from './redux/actions';
import Cookies from 'js-cookie'; // Importe js-cookie
import './styles/registro.css'

function Registro() {
    const dispatch = useDispatch();
    const [formValues, setFormValues] = useState({
        nomeCompleto: '',
        dataNascimento: '',
        email: '',
        confirmaEmail: '',
        senha: '',
        confirmaSenha: '',
        registro: true,
    });

    const nomeCompletoRef = useRef(null);
    const dataNascimentoRef = useRef(null);
    const emailRef = useRef(null);
    const confirmaEmailRef = useRef(null);
    const senhaRef = useRef(null);
    const confirmaSenhaRef = useRef(null);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormValues({
            ...formValues,
            [name]: value,
        });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log(formValues);
        // Validar o formulário
        if (
            formValues.nomeCompleto.trim() === '' ||
            formValues.dataNascimento.trim() === '' ||
            formValues.email.trim() === '' ||
            formValues.confirmaEmail.trim() === '' ||
            formValues.senha.trim() === '' ||
            formValues.confirmaSenha.trim() === ''
        ) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        if (formValues.email !== formValues.confirmaEmail) {
            alert('Os emails não coincidem.');
            return;
        }

        if (formValues.senha !== formValues.confirmaSenha) {
            alert('As senhas não coincidem.');
            return;
        }


        try {
            // Enviar dados para localhost/api/data.php
            const response = await axios.post('http://localhost/api/data.php', formValues);

            console.log('Resposta do PHP:', response.data);
            // Redirecionar para a próxima página se o envio for bem-sucedido
            if (response.data.success) {
                Cookies.set('userId', response.data.id);
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 30); // Adiciona 30 dias à data atual

                Cookies.set('userToken', response.data.token, { secure: true, sameSite: 'Lax', expires: expirationDate });

                dispatch(setUserData({ id: response.data.id, token: response.data.token }));
                navigate('/adicionais');
            } else {
                // Se necessário, você pode lidar com erros aqui
            }
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
            // Lidar com erros de envio, se necessário
        }
    };
    return (
        <>
            <div className='registro fullScreen'>
                <div className='form'>
                    <div className='formLogin'>
                        <div className='formLoginBox'>
                            <div className='formTitle'>
                                Fazer Cadastro
                            </div>
                            <div className='registroControlBox'>
                                <div className='registroControl'>
                                    <div className='formInput'>
                                        <input
                                            ref={nomeCompletoRef}
                                            type="text"
                                            name="nomeCompleto"
                                            id="nomeCompleto"
                                            required
                                            spellCheck="false"
                                            onChange={handleChange}
                                        />
                                        <span className="placeholder">
                                            Nome Completo
                                        </span>
                                    </div>

                                    <div className='formInput'>
                                        <InputMask
                                            mask="99/99/9999"
                                            maskChar={null}
                                            type="text"
                                            name="dataNascimento"
                                            id="dataNascimento"
                                            required
                                            spellCheck="false"
                                            onChange={handleChange}
                                            ref={dataNascimentoRef}
                                        />
                                        <span className="placeholder">
                                            Data de Nascimento
                                        </span>
                                    </div>
                                </div>
                                <div className='registroControl'>
                                    <div className='formInput'>
                                        <input ref={emailRef} type="email" name="email" id="email" required spellCheck="false" onChange={handleChange} />
                                        <span className="placeholder">
                                            E-mail
                                        </span>
                                    </div>
                                    <div className='formInput'>
                                        <input ref={confirmaEmailRef} type="email" name="confirmaEmail" id="confirmaEmail" required spellCheck="false" onChange={handleChange} />
                                        <span className="placeholder">
                                            Confirma E-mail
                                        </span>
                                    </div>
                                </div>
                                <div className='registroControl'>
                                    <div className='formInput'>
                                        <input ref={senhaRef} type="password" name="senha" id="senha" required spellCheck="false" onChange={handleChange} />
                                        <span className="placeholder">
                                            Senha
                                        </span>
                                    </div>
                                    <div className='formInput'>
                                        <input ref={confirmaSenhaRef} type="password" name="confirmaSenha" id="confirmaSenha" required spellCheck="false" onChange={handleChange} />
                                        <span className="placeholder">
                                            Confirma Senha
                                        </span>
                                    </div>
                                </div>
                                <div className='acessButton' onClick={handleSubmit}>
                                    Cadastrar
                                </div>

                                <div className='acessTermos'>
                                    Ao se cadastrar, você concorda com nossos Termos, Política de Privacidade e Política de Cookies.
                                </div>

                                <div className='notAcess'>
                                    Já tenho uma conta! <Link to="/acesso">Faça login</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Registro;

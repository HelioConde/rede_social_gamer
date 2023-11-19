import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import InputMask from 'react-input-mask'; // Importe o componente InputMask
import './styles/adicionais.css';
import Cookies from 'js-cookie';
import lol_logo from './img/lol-logo.png';

function Registro() {
    const [formValues, setFormValues] = useState({
        id: Cookies.get('userId'),
        token: Cookies.get('userToken'),
        apelido: '',
        adicionais: 'true',
    });

    const [summonerData, setSummonerData] = useState({
        summonerData: '',
        profileIconId: '',
        summonerLevel: '',
    });

    const [latestVersion, setLatestVersion] = useState('');

    const fetchLatestVersion = async () => {
        try {
            const response = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
            if (response.data && response.data.length > 0) {
                setLatestVersion(response.data[0]);
            }
        } catch (error) {
            console.error('Error fetching latest version:', error);
        }
    };

    useEffect(() => {
        fetchLatestVersion();
    }, []);

    const apelidoRef = useRef(null);

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

        try {
            // Enviar dados para localhost/api/data.php
            const response = await axios.post('http://localhost/api/data.php', { ...formValues, summonerConfirmed: 'false' });

            console.log('Resposta do PHP:', response.data);
            // Redirecionar para a próxima página se o envio for bem-sucedido
            if (response.data.summonerData) {
                setSummonerData({
                    summonerData: response.data.summonerData,
                    profileIconId: response.data.profileIconId,
                    summonerLevel: response.data.summonerLevel,
                });
            }
            
            if (response.data.success) {
                navigate('/acesso');
            } else {
                // Se necessário, você pode lidar com erros aqui
            }
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
            // Lidar com erros de envio, se necessário
        }
    };

    const handleSubmit2 = async (e) => {
        e.preventDefault();

        console.log(formValues);

        try {
            // Enviar dados para localhost/api/data.php
            const response = await axios.post('http://localhost/api/data.php', {
                ...formValues,
                summonerConfirmed: true,
            });


            if (response.data.success) {
                navigate('/acesso');
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
                                Informações adicionais
                            </div>
                            <div className='adicionaisControlBox'>
                                <div className='registroControl2'>
                                    <div className='formGame'>
                                        <img src={lol_logo} alt="" />
                                    </div>
                                    <div className='formInput2'>
                                        <input
                                            ref={apelidoRef}
                                            type="text"
                                            name="apelido"
                                            id="apelido"
                                            required
                                            spellCheck="false"
                                            onChange={handleChange}
                                        />
                                        <div className='acessButtonAd' onClick={handleSubmit}>
                                            >
                                        </div>
                                        <span className="placeholder">
                                            Apelido no Jogo
                                        </span>
                                    </div>

                                    {summonerData.summonerData && (
                                        <div className='summonerIfon'>
                                            <p className='summonerImg'>
                                                <img
                                                    src={`http://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/profileicon/${summonerData.profileIconId}.png`}
                                                    alt="Profile Icon"
                                                />
                                                <span>{summonerData.summonerLevel}</span>
                                            </p>
                                            <div>
                                                <p>{summonerData.summonerData}</p>
                                                <p className='confirmButtonAd' onClick={handleSubmit2}>Confirma</p>
                                            </div>
                                        </div>
                                    )}

                                </div>
                                <div className='acessButton' onClick={handleSubmit}>
                                    Pular
                                </div>

                                <div className='acessTermos'>
                                    Adicione o seu nome de jogo ao perfil para uma experiência mais personalizada e reconhecível.
                                    <p>A diversão está apenas começando! 🎮</p>
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

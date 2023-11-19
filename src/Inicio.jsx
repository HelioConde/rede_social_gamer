import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';

function Inicio() {
    const [formValues, setFormValues] = useState({
        id: Cookies.get('userId'),
        token: Cookies.get('userToken'),
        home: true,
    });

    const [amigos, setAmigos] = useState([]);

    const navigate = useNavigate();

    const [latestVersion, setLatestVersion] = useState('');
    const [summonerData, setSummonerData] = useState({
        summonerData: '',
        profileIconId: '',
        summonerLevel: '',
    });

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

    const fetchSummonerInfo = async () => {
        try {
            const response = await axios.post('http://localhost/api/data.php', {
                ...formValues,
                summonerInfo: true,
            });

            console.log(response.data.error);
            if (response.data.error === "Token inválido.") {
                // Remover os tokens
                Cookies.remove('userId');
                Cookies.remove('userToken');

                // Redirecionar para a página de login
                navigate('/acesso');
                return;
            } else if (response.data) {
                // Assuming your response structure is like { summonerData: {...} }
                setSummonerData(response.data);
                console.log('Updated summonerData:', response.data);
            } else {
                // Handle errors if needed
                console.log('Resposta do PHP:', response.data);
            }
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
        }
    };

    const listarAmigos = async () => {
        try {
            const response = await axios.post('http://localhost/api/data.php', {
                ...formValues,
                home: false,
                listarAmigos: true,
            });

            if (response.data.amigos) {
                // Atualizar o estado com a lista de amigos
                setAmigos(response.data.amigos);
                console.log('Lista de Amigos:', response.data.amigos);
            } else {
                console.log('Resposta do PHP:', response.data);
            }
        } catch (error) {
            if (error.response) {
                // O servidor respondeu com um status de erro
                console.error('Erro na resposta do servidor:', error.response.data);
            } else if (error.request) {
                // A requisição foi feita, mas não houve resposta do servidor
                console.error('Erro na requisição para o servidor:', error.request);
            } else {
                // Algo aconteceu durante a configuração da requisição que gerou um erro
                console.error('Erro ao configurar a requisição:', error.message);
            }
        }
    };

    // Chama a função para listar amigos quando necessário
    useEffect(() => {
        fetchLatestVersion();
        fetchSummonerInfo();
        listarAmigos();
    }, [formValues]);

    return (
        <>
            {summonerData.name && (
                <div className='summonerInfo'>
                    <p className='summonerImg'>
                        <img
                            src={`http://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/profileicon/${summonerData.profileIconId}.png`}
                            alt="Profile Icon"
                        />
                        <span>{summonerData.summonerLevel}</span>
                    </p>
                    <div>
                        <p>{summonerData.name}</p>
                        <p>Summoner ID: {summonerData.id}</p>
                        <p>Account ID: {summonerData.accountId}</p>
                    </div>
                </div>
            )}

            <div>
                <h2>Amigos</h2>
                {amigos.length > 0 ? (
                    <ul>
                        {amigos.map((amigo) => (
                            <li key={amigo.id}>
                                <p className='summonerImg'>
                                    <img
                                        src={`http://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/profileicon/${amigo.profileIconId}.png`}
                                        alt="Profile Icon"
                                    />
                                    <span>{amigo.summonerLevel}</span>
                                </p>
                                <p>{amigo.name}</p>
                                <p>Status: {amigo.status}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Não há amigos para mostrar.</p>
                )}
            </div>
        </>
    );
}

export default Inicio;

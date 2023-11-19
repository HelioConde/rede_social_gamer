import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

function Inicio() {
    const [formValues, setFormValues] = useState({
        id: Cookies.get('userId'),
        token: Cookies.get('userToken'),
        home: true,
    });

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

            console.log('Resposta do PHP:', response.data);

            if (response.data) {
                // Assuming your response structure is like { summonerData: {...} }
                setSummonerData(response.data);
                console.log('Updated summonerData:', response.data);
            } else {
                // Handle errors if needed
            }
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
        }
    };

    useEffect(() => {
        fetchLatestVersion();
        fetchSummonerInfo();
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

        </>
    );
}

export default Inicio;

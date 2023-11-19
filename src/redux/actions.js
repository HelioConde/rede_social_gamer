// actions.js
export const setUserData = (userData) => ({
    type: 'SET_USER_DATA',
    payload: userData,
});

export const setSummonerData = (data) => ({
    type: 'SET_SUMMONER_DATA',
    payload: data,
});

export const setSummonerName = (name) => ({
    type: 'SET_SUMMONER_NAME',
    payload: name,
});

export const setSummonerLevel = (level) => ({
    type: 'SET_SUMMONER_LEVEL',
    payload: level,
});


export const setSummonerPositions = (position) => ({
    type: 'SET_SUMMONER_POSITION',
    payload: position,
});

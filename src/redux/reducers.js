// src/redux/reducers.js

// Defina constantes para os tipos de ação
const SET_SUMMONER_DATA = 'SET_SUMMONER_DATA';
const SET_SUMMONER_NAME = 'SET_SUMMONER_NAME';
const SET_SUMMONER_LEVEL = 'SET_SUMMONER_LEVEL';
const SET_SUMMONER_POSITION = 'SET_SUMMONER_POSITION';

const initialState = {
    summonerData: null,
    summonerName: '',
    summonerLevel: '',
};

const rootReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_USER_DATA':
            return { ...state, userData: action.payload };
        case SET_SUMMONER_DATA:
            return { ...state, summonerData: action.payload };
        case SET_SUMMONER_NAME:
            return { ...state, summonerName: action.payload };
        case SET_SUMMONER_LEVEL:
            return { ...state, summonerLevel: action.payload };
        case SET_SUMMONER_POSITION:
            return { ...state, summonerLevel: action.payload };
        default:
            return state;
    }
};

export default rootReducer;

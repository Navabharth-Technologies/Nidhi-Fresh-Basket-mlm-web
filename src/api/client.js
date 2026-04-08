import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

const API_LIVE_URL = 'https://nidhifreshbasket-dhe3c2amevgfhddz.centralindia-01.azurewebsites.net/api';
const API_LOCAL_URL = Platform.OS === 'web'
    ? 'http://localhost:5000/api'
    : 'http://10.0.2.2:5000/api';

// For development: Use LOCAL, for production Switch to LIVE
const API_BASE_URL = __DEV__ ? API_LOCAL_URL : API_LIVE_URL;

console.log('API Base URL resolved to:', API_BASE_URL, ' (DEV:', __DEV__, ')');

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60 seconds timeout for uploads
    headers: {
        'Content-Type': 'application/json'
    }
});

apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

export default apiClient;

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            // For development/testing: Clear storage to force login page on refresh if requested
            // await AsyncStorage.clear(); 

            const token = await AsyncStorage.getItem('token');
            const adminFlag = await AsyncStorage.getItem('isAdmin');
            const activeFlag = await AsyncStorage.getItem('isActive');

            if (token) {
                apiClient.defaults.headers.common['x-auth-token'] = token;
                setToken(token);
                setIsAdmin(adminFlag === 'true');
                setUser({ id: 'persisted', isActive: activeFlag === 'true' });
            }
        } catch (e) {
            console.error('Failed to load user', e);
        } finally {
            setLoading(false);
        }
    };

    const login = async (token, userType = 'user', isActive = false) => {
        const adminStatus = userType === 'admin';
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('isAdmin', adminStatus.toString());
        await AsyncStorage.setItem('isActive', isActive.toString());

        apiClient.defaults.headers.common['x-auth-token'] = token;
        setToken(token);
        setIsAdmin(adminStatus);
        setUser({ id: 'logged-in', isActive });
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('isAdmin');
        await AsyncStorage.removeItem('isActive');
        delete apiClient.defaults.headers.common['x-auth-token'];
        setToken(null);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
    };

    const updateActiveStatus = async (status) => {
        await AsyncStorage.setItem('isActive', status.toString());
        setUser(prev => prev ? ({ ...prev, isActive: status }) : null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, setProfile, token, login, logout, updateActiveStatus, loading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

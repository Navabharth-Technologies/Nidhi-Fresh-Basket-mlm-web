import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, useWindowDimensions, Platform } from 'react-native';
import apiClient from '../api/client';
import { Lock, KeyRound, ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import ScreenBackground from '../components/ScreenBackground';

const ResetPasswordScreen = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { phone } = route.params || {};
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null); // 'otp', 'new', 'confirm'

    const handleResetPassword = async () => {
        if (!otp || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/users/reset-password', {
                phone,
                otp,
                newPassword
            });
            Alert.alert('Success', res.data.msg);
            navigation.navigate('Login');
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Something went wrong';
            Alert.alert('Failed', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenBackground>
            <ScrollView contentContainerStyle={styles.container}>
                <TouchableOpacity 
                    style={[styles.backButton, isDesktop && styles.backButtonDesktop]} 
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.navigate('Login');
                        }
                    }}
                >
                    <ChevronLeft color="#1a531b" size={24} />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <View style={[styles.header, isDesktop && styles.headerDesktop]}>
                    <Image
                        source={require('../../assets/nidhi_logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>Enter the 6-digit OTP sent to your phone {phone} and your new password.</Text>
                </View>

                <View style={[styles.form, isDesktop && styles.formDesktop]}>
                    <View style={[styles.inputContainer, focusedField === 'otp' && styles.inputContainerFocused]}>
                        <KeyRound color="#1a531b" size={20} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="6-Digit OTP"
                            value={otp}
                            onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, ''))}
                            keyboardType="number-pad"
                            maxLength={6}
                            onFocus={() => setFocusedField('otp')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    <View style={[styles.inputContainer, focusedField === 'new' && styles.inputContainerFocused]}>
                        <Lock color="#1a531b" size={20} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            value={newPassword}
                            onChangeText={(v) => setNewPassword(v.replace(/\s/g, ''))}
                            secureTextEntry={!showPassword}
                            contextMenuHidden={!showPassword}
                            selectTextOnFocus={showPassword}
                            onFocus={() => setFocusedField('new')}
                            onBlur={() => setFocusedField(null)}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconBtn}>
                            {showPassword ? <Eye size={18} color="#1a531b" /> : <EyeOff size={18} color="#ccc" />}
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.inputContainer, focusedField === 'confirm' && styles.inputContainerFocused]}>
                        <Lock color="#1a531b" size={20} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChangeText={(v) => setConfirmPassword(v.replace(/\s/g, ''))}
                            secureTextEntry={!showConfirmPassword}
                            contextMenuHidden={!showConfirmPassword}
                            selectTextOnFocus={showConfirmPassword}
                            onFocus={() => setFocusedField('confirm')}
                            onBlur={() => setFocusedField(null)}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIconBtn}>
                            {showConfirmPassword ? <Eye size={18} color="#1a531b" /> : <EyeOff size={18} color="#ccc" />}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Reset Password</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: 'transparent',
        padding: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    backButtonDesktop: {
        width: '100%',
    },
    backText: {
        fontSize: 16,
        color: '#1a531b',
        fontWeight: '500',
        marginLeft: 5,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    headerDesktop: {
        width: '100%',
    },
    logo: {
        width: 150,
        height: 60,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    form: {
        width: '100%',
    },
    formDesktop: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 15,
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
    },
    inputContainerFocused: {
        borderColor: '#1a531b',
        borderWidth: 2,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        outlineStyle: 'none',
    },
    button: {
        backgroundColor: '#1a531b',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#1a531b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    eyeIconBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: { cursor: 'pointer' }
        })
    }
});

export default ResetPasswordScreen;

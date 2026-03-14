import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import apiClient from '../api/client';
import { Phone, ChevronLeft, Lock, KeyRound, CheckCircle } from 'lucide-react-native';

const ForgotPasswordScreen = ({ navigation }) => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!phone) {
            Alert.alert('Error', 'Please enter your phone number');
            return;
        }

        if (!/^\d{10}$/.test(phone)) {
            Alert.alert('Error', 'Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/users/forgot-password', { phone });
            setOtpSent(true);
            Alert.alert('Success', res.data.msg);
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Something went wrong';
            Alert.alert('Failed', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setResetLoading(true);
        try {
            const res = await apiClient.post('/users/reset-password', {
                phone,
                otp,
                newPassword
            });
            Alert.alert('Success', 'Password reset successful! Please login with your new password.', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Something went wrong';
            Alert.alert('Failed', errorMsg);
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <ChevronLeft color="#1a531b" size={24} />
                <Text style={styles.backText}>Back to Login</Text>
            </TouchableOpacity>

            <View style={styles.header}>
                <Image
                    source={require('../../assets/nidhi_logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>Enter your 10-digit phone number to receive a 6-digit OTP for password reset.</Text>
            </View>

            <View style={styles.form}>
                <View style={[styles.inputContainer, otpSent && styles.disabledInput]}>
                    <Phone color={otpSent ? "#999" : "#666"} size={20} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, otpSent && { color: "#999" }]}
                        placeholder="10-Digit Phone Number"
                        value={phone}
                        onChangeText={(txt) => {
                            setPhone(txt);
                            if (otpSent) setOtpSent(false); // Reset if they change number
                        }}
                        keyboardType="phone-pad"
                        maxLength={10}
                    />
                    {otpSent && <CheckCircle color="#1a531b" size={18} style={{marginLeft: 8}} />}
                </View>

                {!otpSent ? (
                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={handleSendOTP}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Send OTP</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.otpCard}>
                        <Text style={styles.cardTitle}>Enter Reset Details</Text>
                        <Text style={styles.cardSubtitle}>OTP has been sent to your registered mobile number.</Text>
                        
                        <View style={styles.cardInputContainer}>
                            <KeyRound color="#666" size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="6-Digit OTP"
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                        </View>

                        <View style={styles.cardInputContainer}>
                            <Lock color="#666" size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.cardInputContainer}>
                            <Lock color="#666" size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity 
                            style={styles.resetButton} 
                            onPress={handleResetPassword}
                            disabled={resetLoading}
                        >
                            {resetLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Reset Password</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.resendLink}>
                            <Text style={styles.resendText}>Change Number?</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 20,
        height: 50,
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
    disabledInput: {
        backgroundColor: '#f9f9f9',
        borderColor: '#eee',
    },
    otpCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#e8e8e8',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 20,
    },
    cardInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 15,
        height: 50,
    },
    resetButton: {
        backgroundColor: '#1a531b',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    resendLink: {
        marginTop: 15,
        alignItems: 'center',
    },
    resendText: {
        color: '#666',
        fontSize: 14,
        textDecorationLine: 'underline',
    }
});

export default ForgotPasswordScreen;

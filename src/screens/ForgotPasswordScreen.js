import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform, useWindowDimensions } from 'react-native';
import apiClient from '../api/client';
import { Phone, ChevronLeft, Lock, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react-native';
import ScreenBackground from '../components/ScreenBackground';

const ForgotPasswordScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    const handleSendOTP = async () => {
        if (!phone) {
            Alert.alert('Error', 'Please enter your phone number');
            return;
        }

        if (!/^\d{10}$/.test(phone)) {
            Alert.alert('Error', 'Please enter a valid 10-digit phone number');
            return;
        }

        // Advanced Phone Validation (Block repeated/sequential)
        const isRepeated = /^(.)\1{9}$/.test(phone);
        const isSequential = /^(0123456789|1234567890|9876543210)$/.test(phone);
        if (isRepeated || isSequential) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }

        setLoading(true);
        setPhoneError('');
        try {
            const res = await apiClient.post('/users/forgot-password', { phone });
            setOtpSent(true);
            Alert.alert('Success', res.data.msg);
        } catch (error) {
            console.log('[handleSendOTP] Catch:', error.response?.status, error.response?.data);
            const errorMsg = error.response?.data?.msg || 'Something went wrong';
            if (error.response?.status === 404) {
                setPhoneError('This phone number is not registered.');
            } else {
                Alert.alert('Failed', errorMsg);
            }
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

        if (otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setResetLoading(true);
        try {
            const res = await apiClient.post('/users/reset-password', {
                phone,
                otp,
                newPassword
            });
            Alert.alert('Success', 'Password reset successful! Please login with your new password.');
            navigation.navigate('Login');
        } catch (error) {
            const errorMsg = error.response?.data?.msg || 'Something went wrong';
            Alert.alert('Failed', errorMsg);
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <ScreenBackground>
            <ScrollView contentContainerStyle={styles.container}>
                <TouchableOpacity
                    style={[styles.backButton, resetLoading && { opacity: 0.5 }, isDesktop && styles.backButtonDesktop]}
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.navigate('Login');
                        }
                    }}
                    disabled={resetLoading}
                >
                    <ChevronLeft color="#1a531b" size={24} />
                    <Text style={styles.backText}>Back to Login</Text>
                </TouchableOpacity>

                <View style={[styles.header, isDesktop && styles.headerDesktop]}>
                    <Image
                        source={require('../../assets/nidhi_logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>Enter your 10-digit phone number to receive a 6-digit OTP for password reset.</Text>
                </View>

                <View style={[styles.form, isDesktop && styles.formDesktop]}>
                    <View style={[styles.inputContainer, otpSent && styles.disabledInput]}>
                        <Phone color={otpSent ? "#999" : "#666"} size={20} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, otpSent && { color: "#999" }]}
                            placeholder="10-Digit Phone Number"
                            value={phone}
                            onChangeText={(txt) => {
                                const cleanTxt = txt.replace(/[^0-9]/g, '');
                                setPhone(cleanTxt);
                                if (otpSent) setOtpSent(false); 
                                
                                if (cleanTxt.length > 0 && !/^[6-9]/.test(cleanTxt)) {
                                    setPhoneError('Mobile number must start with 6, 7, 8, or 9');
                                    return;
                                }

                                if (cleanTxt.length === 10) {
                                    const isRepeated = /^(.)\1{9}$/.test(cleanTxt);
                                    const isSequential = /^(0123456789|1234567890)$/.test(cleanTxt);
                                    if (isRepeated || isSequential) {
                                        setPhoneError('This phone number pattern is invalid.');
                                    } else {
                                        setPhoneError('');
                                    }
                                } else {
                                    setPhoneError('');
                                }
                            }}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                        {otpSent && <CheckCircle color="#1a531b" size={18} style={{ marginLeft: 8 }} />}
                    </View>

                    {phoneError ? (
                        <Text style={[styles.validationText, { marginTop: -15, marginBottom: 15 }]}>{phoneError}</Text>
                    ) : null}

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
                                    onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, ''))}
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
                                    onChangeText={(v) => setNewPassword(v.replace(/\s/g, ''))}
                                    secureTextEntry={!showPassword}
                                    contextMenuHidden={!showPassword}
                                    selectTextOnFocus={showPassword}
                                    editable={!resetLoading}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconBtn}>
                                    {showPassword ? <Eye size={18} color="#1a531b" /> : <EyeOff size={18} color="#999" opacity={0.5} />}
                                </TouchableOpacity>
                            </View>
                            {newPassword.length > 0 && newPassword.length < 6 && (
                                <Text style={styles.validationText}>Password must be at least 6 characters</Text>
                            )}

                            <View style={styles.cardInputContainer}>
                                <Lock color="#666" size={20} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChangeText={(v) => setConfirmPassword(v.replace(/\s/g, ''))}
                                    secureTextEntry={!showConfirmPassword}
                                    contextMenuHidden={!showConfirmPassword}
                                    selectTextOnFocus={showConfirmPassword}
                                    editable={!resetLoading}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIconBtn}>
                                    {showConfirmPassword ? <Eye size={18} color="#1a531b" /> : <EyeOff size={18} color="#999" opacity={0.5} />}
                                </TouchableOpacity>
                            </View>
                            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                                <Text style={styles.validationText}>Passwords do not match</Text>
                            )}

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


                        </View>
                    )}
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
        color: 'black',
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
        height: 130,
        marginBottom: -10,
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
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 20,
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        ...Platform.select({
            web: { backdropFilter: 'blur(8px)' }
        })
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
        backgroundColor: 'rgba(240, 240, 240, 0.8)',
        borderColor: '#eee',
    },
    otpCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 12,
        padding: 20,
        marginTop: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        })
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
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 15,
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    resetButton: {
        backgroundColor: '#1a531b',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },

    eyeIconBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: { cursor: 'pointer' }
        })
    },
    validationText: {
        color: '#dc2626',
        fontSize: 12,
        marginTop: -12,
        marginBottom: 10,
        marginLeft: 4,
    }
});

export default ForgotPasswordScreen;

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';
import ScreenBackground from '../components/ScreenBackground';

const RegisterScreen = ({ navigation }) => {
    const { login } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const showAlert = (title, message, actions) => {
        if (Platform.OS === 'web') {
            if (!actions) {
                alert(title ? `${title}: ${message}` : message);
            } else {
                const confirmed = window.confirm(title ? `${title}\n\n${message}` : message);
                if (confirmed) {
                    const action = actions.find(a => a.text === 'Create Account' || a.text === 'OK') || actions[0];
                    if (action && action.onPress) action.onPress();
                } else {
                    const cancelAction = actions.find(a => a.text === 'Cancel' || a.style === 'cancel');
                    if (cancelAction && cancelAction.onPress) cancelAction.onPress();
                }
            }
        } else {
            Alert.alert(title, message, actions);
        }
    };

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: '',
        referral_by: ''
    });
    const [loading, setLoading] = useState(false);
    const [phoneChecking, setPhoneChecking] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
    const [phoneError, setPhoneError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [nameError, setNameError] = useState('');
    const [referralInfo, setReferralInfo] = useState({ name: '', loading: false });

    useEffect(() => {
        if (Platform.OS === 'web') {
            try {
                const fullUrl = window.location.href;
                const searchPart = fullUrl.includes('?') ? fullUrl.split('?')[1] : '';
                const params = new URLSearchParams(searchPart);
                const ref = params.get('ref');

                if (ref) {
                    setFormData(prev => ({ ...prev, referral_by: ref }));
                }
            } catch (err) {
                console.log('Referral detection failed safely:', err);
            }
        }

        if (formData.phone.length === 10) {
            handlePhoneCheck(formData.phone);
        }
    }, [formData.phone]);

    const handlePhoneCheck = async (phone) => {
        setPhoneChecking(true);
        try {
            const res = await apiClient.post('/users/check-phone', { phone });
            if (res.data.exists) {
                const existingUser = res.data.user;
                showAlert(
                    'Account Found',
                    `An account already exists with this phone number (Member: ${existingUser.name}).\n\nDo you want to create another account with a different User ID?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Create Account',
                            onPress: () => {
                                setFormData(prev => ({
                                    ...prev,
                                    full_name: existingUser.name,
                                    email: existingUser.email || prev.email,
                                    phone: existingUser.phone
                                }));
                            }
                        }
                    ]
                );
            }
        } catch (e) {
            console.log('Phone check error:', e);
        } finally {
            setPhoneChecking(false);
        }
    };

    const handleRegister = async () => {
        const { full_name, email, phone, password, confirm_password } = formData;
        if (!full_name || !email || !phone || !password || !confirm_password) {
            return showAlert('Error', 'Please fill all required fields');
        }

        if (full_name.trim().length < 3) {
            return showAlert('Error', 'Full name must be at least 3 characters long');
        }

        // Check for garbage patterns in name
        const repeatedChars = /(.)\1{2,}/; 
        if (repeatedChars.test(full_name)) {
            return showAlert('Error', 'Please enter a valid full name (no more than 2 repeated characters)');
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email || /\s/.test(email) || !emailRegex.test(email)) {
            return showAlert('Error', 'Please enter a valid email address (no spaces allowed)');
        }
        if (!/^\d{10}$/.test(phone)) {
            return showAlert('Error', 'Phone number must be exactly 10 digits');
        }
        
        // Advanced Phone Validation (Block repeated/sequential)
        const isRepeated = /^(.)\1{9}$/.test(phone);
        const isSequential = /^(0123456789|1234567890|9876543210)$/.test(phone);
        if (isRepeated || isSequential) {
            return showAlert('Error', 'Please enter a valid phone number');
        }

        if (password !== confirm_password) {
            return showAlert('Error', 'Passwords do not match');
        }
        if (password.length < 6) {
            return showAlert('Error', 'Password must be at least 6 characters long');
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/users/register', formData);
            const generatedId = res.data.user_id || res.data.username || 'N/A';
            const { token } = res.data;

            showAlert('', `Registration successful!\n\nYour Generated User ID is: ${generatedId}\n\nPlease save this to login.`, [
                {
                    text: 'OK',
                    onPress: () => {
                        if (token) {
                            login(token, 'user', false);
                        } else {
                            navigation.navigate('Login');
                        }
                    }
                }
            ]);
        } catch (e) {
            showAlert('Registration Failed', e.response?.data?.msg || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const updateForm = (key, value) => {
        // --- FIELD RESTRICTIONS ---
        let cleanValue = value;
        
        if (key === 'full_name') {
            // Allow only letters and spaces, then capitalize first letter of each word
            cleanValue = value.replace(/[^a-zA-Z\s]/g, '')
                              .replace(/\b\w/g, char => char.toUpperCase());
            
            // Strictly block 3 or more repeated characters in real-time
            // If the user tries to type a 3rd identical character, it gets trimmed back to 2
            cleanValue = cleanValue.replace(/(.)\1{2,}/g, '$1$1');
        } else if (key === 'email') {
            // No spaces, all lowercase
            cleanValue = value.replace(/\s/g, '').toLowerCase();
        } else if (key === 'referral_by') {
            // No spaces, uppercase
            cleanValue = value.replace(/\s/g, '').toUpperCase();
        } else if (key === 'phone') {
            // Digits only
            cleanValue = value.replace(/[^0-9]/g, '');
        } else if (key === 'password' || key === 'confirm_password') {
            // No spaces
            cleanValue = value.replace(/\s/g, '');
        }

        setFormData(prev => ({ ...prev, [key]: cleanValue }));

        // --- REAL-TIME VALIDATION ---
        if (key === 'full_name') {
            const val = cleanValue.trim();
            if (val.length > 0 && val.length < 3) {
                setNameError('Name is too short');
            } else if (/(.)\1{2,}/.test(val)) {
                setNameError('Maximum 2 repeated characters allowed');
            } else {
                setNameError('');
            }
        } else if (key === 'phone') {
            const val = cleanValue;
            if (val.length > 0 && !/^[6-9]/.test(val)) {
                setPhoneError('Mobile number must start with 6, 7, 8, or 9');
                return;
            }

            if (val.length === 10) {
                const isRepeated = /^(.)\1{9}$/.test(val);
                const isSequential = /^(0123456789|1234567890)$/.test(val);
                if (isRepeated || isSequential) {
                    setPhoneError('This phone number pattern is invalid.');
                    return;
                }
                
                setPhoneChecking(true);
                apiClient.post('/users/check-phone', { phone: val })
                    .then(res => {
                        if (res.data.exists) {
                            setPhoneError('This phone number is already registered');
                        } else {
                            setPhoneError('');
                        }
                    })
                    .catch(() => setPhoneError(''))
                    .finally(() => setPhoneChecking(false));
            } else {
                setPhoneError('');
            }
        } else if (key === 'email') {
            const val = cleanValue;
            if (/\s/.test(value)) {
                setEmailError('Email cannot contain spaces');
            } else if (val.length > 5 && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
                setEmailError('Invalid email format');
            } else {
                setEmailError('');
            }
        } else if (key === 'referral_by') {
            const val = cleanValue;
            if (val.length >= 6) {
                setReferralInfo(prev => ({ ...prev, loading: true }));
                apiClient.post('/users/check-referral', { referral_code: val })
                    .then(res => {
                        if (res.data.exists) {
                            setReferralInfo({ name: res.data.user.name, loading: false });
                        } else {
                            setReferralInfo({ name: 'Invalid Referral Code', loading: false });
                        }
                    })
                    .catch(() => setReferralInfo({ name: '', loading: false }));
            } else {
                setReferralInfo({ name: '', loading: false });
            }
        }
    };

    return (
        <ScreenBackground>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}>
                    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
                        <Text style={styles.title}>Join Our Network</Text>
                        <Text style={styles.subtitle}>Create your account and get started today.</Text>
                    </View>

                    <View style={[styles.form, isDesktop && styles.formDesktop]}>
                        <Text style={styles.label}>Full Name *</Text>
                        <TextInput
                            style={[styles.input, nameError && { borderColor: '#dc2626' }]}
                            placeholder="Enter Your Full Name"
                            placeholderTextColor="#999"
                            value={formData.full_name}
                            onChangeText={(v) => updateForm('full_name', v)}
                        />
                        {nameError ? (
                            <Text style={[styles.validationText, { marginTop: -15, marginBottom: 15 }]}>{nameError}</Text>
                        ) : null}

                        <Text style={styles.label}>Email *</Text>
                        <TextInput
                            style={[styles.input, emailError && { borderColor: '#dc2626' }]}
                            placeholder="example@mail.com"
                            placeholderTextColor="#999"
                            value={formData.email}
                            onChangeText={(v) => updateForm('email', v)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {emailError ? (
                            <Text style={[styles.validationText, { marginTop: -15, marginBottom: 15 }]}>{emailError}</Text>
                        ) : null}

                        <View style={styles.phoneLabelRow}>
                            <Text style={styles.label}>Phone Number *</Text>
                            {phoneChecking && <ActivityIndicator size="small" color="#217323" />}
                        </View>
                        <TextInput
                            style={[styles.input, phoneError && { borderColor: '#dc2626' }]}
                            placeholder="9876543210"
                            placeholderTextColor="#999"
                            value={formData.phone}
                            onChangeText={(v) => updateForm('phone', v)}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                        {phoneError ? (
                            <Text style={[styles.validationText, { marginTop: -15, marginBottom: 15 }]}>{phoneError}</Text>
                        ) : null}

                        <Text style={styles.label}>Referral Code *</Text>
                        <TextInput
                            style={[styles.input, referralInfo.name === 'Invalid Referral Code' && { borderColor: '#dc2626' }]}
                            placeholder="REFERRED BY"
                            placeholderTextColor="#ccc"
                            value={formData.referral_by}
                            onChangeText={(v) => updateForm('referral_by', v)}
                            autoCapitalize="characters"
                        />
                        {referralInfo.loading ? (
                             <Text style={[styles.validationInfo, { marginTop: -15, marginBottom: 15 }]}>Checking referral...</Text>
                        ) : referralInfo.name ? (
                            <Text style={[
                                styles.validationInfo, 
                                { marginTop: -15, marginBottom: 15 },
                                referralInfo.name === 'Invalid Referral Code' && { color: '#dc2626' }
                            ]}>
                                {referralInfo.name === 'Invalid Referral Code' ? referralInfo.name : `Referred by: ${referralInfo.name}`}
                            </Text>
                        ) : null}

                        <Text style={styles.label}>Password *</Text>
                        <View style={[styles.passwordContainer, isPasswordFocused && styles.passwordContainerFocused]}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="••••••••"
                                placeholderTextColor="#999"
                                value={formData.password}
                                onChangeText={(v) => updateForm('password', v.replace(/\s/g, ''))}
                                secureTextEntry={!showPassword}
                                onFocus={() => setIsPasswordFocused(true)}
                                onBlur={() => setIsPasswordFocused(false)}
                            />
                            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? <Eye size={20} color="#666" /> : <EyeOff size={20} color="#666" />}
                            </TouchableOpacity>
                        </View>
                        {formData.password.length > 0 && formData.password.length < 6 && (
                            <Text style={styles.validationText}>Password must be at least 6 characters</Text>
                        )}

                        <Text style={styles.label}>Confirm Password *</Text>
                        <View style={[styles.passwordContainer, isConfirmPasswordFocused && styles.passwordContainerFocused]}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="••••••••"
                                placeholderTextColor="#999"
                                value={formData.confirm_password}
                                onChangeText={(v) => updateForm('confirm_password', v.replace(/\s/g, ''))}
                                secureTextEntry={!showConfirmPassword}
                                onFocus={() => setIsConfirmPasswordFocused(true)}
                                onBlur={() => setIsConfirmPasswordFocused(false)}
                            />
                            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <Eye size={20} color="#666" /> : <EyeOff size={20} color="#666" />}
                            </TouchableOpacity>
                        </View>
                        {formData.confirm_password.length > 0 && formData.password !== formData.confirm_password && (
                            <Text style={styles.validationText}>Passwords do not match</Text>
                        )}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Registering...' : 'Register'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.link}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: { padding: 24, paddingVertical: 40 },
    scrollContentDesktop: {
        alignItems: 'center',
    },
    header: { marginBottom: 30, alignItems: 'center' },
    headerDesktop: {
        width: '100%',
    },
    title: { fontSize: 32, color: '#1a531b', fontWeight: 'bold' },
    subtitle: { fontSize: 18, color: '#666', marginTop: 8, textAlign: 'center' },
    form: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 24,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        })
    },
    formDesktop: {
        width: '100%',
    },
    label: { color: '#333', marginBottom: 8, fontSize: 16, fontWeight: '600' },
    phoneLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#111', padding: 14,
        borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#dee2e6',
        fontSize: 16
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#dee2e6',
        paddingRight: 4,
        width: '100%',
        overflow: 'hidden',
    },
    passwordInput: {
        flex: 1,
        color: '#111',
        padding: 14,
        fontSize: 16,
        minWidth: 0,
        flexShrink: 1,
        ...Platform.select({
            web: { outlineStyle: 'none' }
        })
    },
    passwordContainerFocused: {
        borderColor: COLORS.secondary,
        borderWidth: 2,
    },
    eyeIcon: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
        ...Platform.select({
            web: { cursor: 'pointer' }
        })
    },
    button: { backgroundColor: '#217323', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 20 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { color: '#666', fontSize: 16 },
    link: { color: '#217323', fontWeight: 'bold', fontSize: 16 },
    validationText: {
        color: '#dc2626',
        fontSize: 12,
        marginTop: -12,
        marginBottom: 10,
        marginLeft: 4,
    }
});

export default RegisterScreen;

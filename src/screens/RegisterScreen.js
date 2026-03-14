import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';

const RegisterScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const showAlert = (title, message, actions) => {
        if (Platform.OS === 'web') {
            if (!actions) {
                alert(`${title}: ${message}`);
            } else {
                // For Web, if there are actions, use confirm
                const confirmed = window.confirm(`${title}\n\n${message}`);
                if (confirmed) {
                    // Find the action that isn't 'Cancel'
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

    useEffect(() => {
        if (formData.phone.length === 10) {
            handlePhoneCheck(formData.phone);
        }
    }, [formData.phone]);

    const handlePhoneCheck = async (phone) => {
        setPhoneChecking(true);
        try {
            console.log('API checkPhone requesting for:', phone);
            const res = await apiClient.post('/users/check-phone', { phone });
            console.log('API checkPhone result:', res.data);
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

        // 1. Check required fields
        if (!full_name || !email || !phone || !password || !confirm_password) {
            console.log('Validation Failed:', formData);
            return showAlert('Error', 'Please fill all required fields');
        }

        // 3. Email validation (Required)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return showAlert('Error', 'Please enter a valid email address');
        }

        // 4. Phone validation (10 digits)
        if (!/^\d{10}$/.test(phone)) {
            return showAlert('Error', 'Phone number must be exactly 10 digits');
        }

        // 5. Password match
        if (password !== confirm_password) {
            return showAlert('Error', 'Passwords do not match');
        }

        if (password.length < 6) {
            return showAlert('Error', 'Password must be at least 6 characters long');
        }

        setLoading(true);
        console.log('Attempting Register:', formData);

        try {
            const res = await apiClient.post('/users/register', formData);
            const generatedId = res.data.user_id || res.data.username || 'N/A';
            showAlert('Success', `Registration successful!\n\nYour Generated User ID is: ${generatedId}\n\nPlease save this to login.`, [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (e) {
            console.log('Registration Error:', e.response?.data || e.message);
            showAlert('Registration Failed', e.response?.data?.msg || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const updateForm = (key, val) => setFormData({ ...formData, [key]: val });

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}>
                <View style={[styles.header, isDesktop && styles.headerDesktop]}>
                    <Text style={styles.title}>Join Our Network</Text>
                    <Text style={styles.subtitle}>Create your account and get started today.</Text>
                </View>

                <View style={[styles.form, isDesktop && styles.formDesktop]}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Your Full Name"
                        placeholderTextColor="#999"
                        value={formData.full_name}
                        onChangeText={(v) => updateForm('full_name', v)}
                    />

                    <Text style={styles.label}>Email *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="example@mail.com"
                        placeholderTextColor="#999"
                        value={formData.email}
                        onChangeText={(v) => updateForm('email', v)}
                        keyboardType="email-address"
                    />

                    <View style={styles.phoneLabelRow}>
                        <Text style={styles.label}>Phone Number *</Text>
                        {phoneChecking && <ActivityIndicator size="small" color="#217323" />}
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="9876543210"
                        placeholderTextColor="#999"
                        value={formData.phone}
                        onChangeText={(v) => updateForm('phone', v)}
                        keyboardType="phone-pad"
                        maxLength={10}
                    />

                    <Text style={styles.label}>Referral Code (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="REFERRED BY"
                        placeholderTextColor="#999"
                        value={formData.referral_by}
                        onChangeText={(v) => updateForm('referral_by', v)}
                        autoCapitalize="characters"
                    />

                    <Text style={styles.label}>Password *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#999"
                        value={formData.password}
                        onChangeText={(v) => updateForm('password', v)}
                        secureTextEntry
                    />

                    <Text style={styles.label}>Confirm Password *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#999"
                        value={formData.confirm_password}
                        onChangeText={(v) => updateForm('confirm_password', v)}
                        secureTextEntry
                    />

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
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    scrollContent: { padding: 24, paddingVertical: 40 },
    scrollContentDesktop: {
        alignItems: 'center',
    },
    header: { marginBottom: 30, alignItems: 'center' },
    headerDesktop: {
        width: '100%',
        maxWidth: 600,
    },
    title: { fontSize: 32, color: '#1a531b', fontWeight: 'bold' },
    subtitle: { fontSize: 18, color: '#666', marginTop: 8, textAlign: 'center' },
    form: { backgroundColor: '#ffffff', padding: 24, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    formDesktop: {
        width: '100%',
        maxWidth: 600,
    },
    label: { color: '#333', marginBottom: 8, fontSize: 16, fontWeight: '600' },
    phoneLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    input: {
        backgroundColor: '#f1f3f5', color: '#111', padding: 14,
        borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#dee2e6',
        fontSize: 16
    },
    button: { backgroundColor: '#217323', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 20 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { color: '#666', fontSize: 16 },
    link: { color: '#217323', fontWeight: 'bold', fontSize: 16 }
});

export default RegisterScreen;

import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ImageBackground, Image, useWindowDimensions, Linking } from 'react-native';
import { useAuth } from '../store/AuthContext';
import apiClient from '../api/client';
import { LogIn, UserPlus, Facebook, Instagram, Eye, EyeOff } from 'lucide-react-native';

const LoginScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const showAlert = (title, message) => {
        if (Platform.OS === 'web') {
            alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [adminId, setAdminId] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [customerLoading, setCustomerLoading] = useState(false);
    const [adminLoading, setAdminLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [isAdminPasswordFocused, setIsAdminPasswordFocused] = useState(false);
    const [isLoginIdFocused, setIsLoginIdFocused] = useState(false);
    const [isAdminIdFocused, setIsAdminIdFocused] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!loginId || !password) return showAlert('Error', 'Please fill all fields');
        setCustomerLoading(true);
        try {
            const res = await apiClient.post('/users/login', { loginId, password });
            if (res.data && res.data.user) {
                await login(res.data.token, 'user', res.data.user.is_active);
            } else {
                showAlert('Login Failed', 'Invalid response from server.');
            }
        } catch (e) {
            console.log('Login Error:', e.response?.data || e.message);
            const errorMsg = e.response?.data?.msg || e.message || 'Something went wrong';
            showAlert('Login Failed', errorMsg);
        } finally {
            setCustomerLoading(false);
        }
    };

    const handleAdminLogin = async () => {
        if (!adminId || !adminPassword) return showAlert('Error', 'Please fill all fields');
        setAdminLoading(true);
        try {
            const res = await apiClient.post('/admin/login', { username: adminId, password: adminPassword });
            if (res.data && res.data.token) {
                await login(res.data.token, 'admin', true);
            } else {
                showAlert('Login Failed', 'Invalid response from server.');
            }
        } catch (e) {
            const errorMsg = e.response?.data?.msg || e.message || 'Something went wrong';
            showAlert('Admin Login Failed', errorMsg);
        } finally {
            setAdminLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                alwaysBounceVertical={true}
            >
                {/* Header Bar */}
                <View style={[styles.headerBar, isDesktop && styles.headerBarDesktop]}>
                    <Image
                        source={require('../../assets/nidhi_logo.png')}
                        style={[styles.headerLogo, isDesktop && styles.headerLogoDesktop]}
                        resizeMode="contain"
                    />
                    <Text style={[styles.headerTitleText, isDesktop && styles.headerTitleTextDesktop]}>NIDHI FRESH BASKET</Text>
                </View>

                {/* Fixed Banner Section */}
                <ImageBackground
                    source={require('../../assets/login_hero_fruits_v2.png')}
                    style={[styles.heroBanner, isDesktop && styles.heroBannerDesktop]}
                    resizeMode="cover"
                >
                    <View style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}>
                        <View style={[styles.heroTextWrapper, isDesktop && styles.heroTextWrapperDesktop]}>
                            <Text style={[styles.heroMainTitle, isDesktop && styles.heroMainTitleDesktop]}>
                                Earn Rewards{"\n"}While Shopping Fresh
                            </Text>
                        </View>

                        <View style={[styles.cardsWrapper, isDesktop && styles.cardsWrapperDesktop]}>
                            {/* Login Card */}
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconCircle}>
                                        <LogIn color="#1a531b" size={20} />
                                    </View>
                                    <Text style={styles.cardTitle}>Customer Login</Text>
                                </View>
                                <Text style={styles.cardSubtitle}>
                                    Have an account? Sign in to access tools, training, and shopping.
                                </Text>

                                <TextInput
                                    style={[styles.input, isLoginIdFocused && styles.inputFocused]}
                                    placeholder="User ID"
                                    placeholderTextColor="#999"
                                    value={loginId}
                                    onChangeText={(v) => setLoginId(v.toUpperCase())}
                                    autoCapitalize="characters"
                                    autoComplete="username"
                                    textContentType="username"
                                    nativeID="customer_userid"
                                    onFocus={() => setIsLoginIdFocused(true)}
                                    onBlur={() => setIsLoginIdFocused(false)}
                                />
                                <View style={[styles.passwordContainer, isPasswordFocused && styles.passwordContainerFocused]}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Password"
                                        placeholderTextColor="#999"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoComplete="current-password"
                                        textContentType="password"
                                        nativeID="customer_password"
                                        onFocus={() => setIsPasswordFocused(true)}
                                        onBlur={() => setIsPasswordFocused(false)}
                                    />
                                    <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <Eye size={20} color="#666" /> : <EyeOff size={20} color="#666" />}
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.signInButton}
                                    onPress={handleLogin}
                                    disabled={customerLoading || adminLoading}
                                >
                                    <Text style={styles.signInText}>{customerLoading ? 'Signing in...' : 'Sign In'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.forgotPasswordLink}
                                    onPress={() => navigation.navigate('ForgotPassword')}
                                >
                                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.signUpButton}
                                    onPress={() => navigation.navigate('Register')}
                                >
                                    <Text style={styles.signUpText}>Register</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Admin Login Card */}
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconCircle, { backgroundColor: '#fff0f0' }]}>
                                        <LogIn color="#8b1e3f" size={20} />
                                    </View>
                                    <Text style={styles.cardTitle}>Admin Login</Text>
                                </View>
                                <Text style={styles.cardSubtitle}>
                                    Access administrative tools and manage the network.
                                </Text>

                                <TextInput
                                    style={[styles.input, isAdminIdFocused && styles.inputFocused]}
                                    placeholder="Admin Username"
                                    placeholderTextColor="#999"
                                    value={adminId}
                                    onChangeText={setAdminId}
                                    autoCapitalize="none"
                                    autoComplete="off"
                                    textContentType="none"
                                    nativeID="admin_userid"
                                    onFocus={() => setIsAdminIdFocused(true)}
                                    onBlur={() => setIsAdminIdFocused(false)}
                                />
                                <View style={[styles.passwordContainer, isAdminPasswordFocused && styles.passwordContainerFocused]}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Password"
                                        placeholderTextColor="#999"
                                        value={adminPassword}
                                        onChangeText={setAdminPassword}
                                        secureTextEntry={!showAdminPassword}
                                        autoComplete="off"
                                        textContentType="none"
                                        nativeID="admin_password"
                                        onFocus={() => setIsAdminPasswordFocused(true)}
                                        onBlur={() => setIsAdminPasswordFocused(false)}
                                    />
                                    <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowAdminPassword(!showAdminPassword)}>
                                        {showAdminPassword ? <Eye size={20} color="#666" /> : <EyeOff size={20} color="#666" />}
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.signInButton, { backgroundColor: '#8b1e3f' }]}
                                    onPress={handleAdminLogin}
                                    disabled={customerLoading || adminLoading}
                                >
                                    <Text style={styles.signInText}>{adminLoading ? 'Authenticating...' : 'Secure Login'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ImageBackground>

                {/* Bottom Footer Area */}
                <View style={styles.footerWrap}>
                    <View style={styles.footerContent}>
                        <Image
                            source={require('../../assets/nidhi_logo.png')}
                            style={styles.footerLogoSmall}
                            resizeMode="contain"
                        />

                        <View style={styles.footerLinksCentered}>
                            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                                <Text style={styles.link}>Privacy Policy</Text>
                            </TouchableOpacity>
                            <Text style={styles.linkDivider}>|</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('TermsAndConditions')}>
                                <Text style={styles.link}>Terms of Use</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.socialLinksContainer}>
                            <TouchableOpacity
                                style={styles.socialIcon}
                                onPress={() => Linking.openURL('https://www.instagram.com/nidhifreshbasket?igsh=bDJ1MHZoeWpsY3hs')}
                            >
                                <Facebook color="#1a531b" size={18} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.socialIcon}
                                onPress={() => Linking.openURL('https://www.instagram.com/nidhifreshbasket?igsh=bDJ1MHZoeWpsY3hs')}
                            >
                                <Instagram color="#1a531b" size={18} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.copyright}>
                            © 2026 Nidhi Fresh Basket. All Rights Reserved.
                        </Text>
                        <TouchableOpacity onPress={() => Linking.openURL('https://www.navabharathtechnologies.com/')}>
                            <Text style={styles.poweredBy}>Powered by Navabharath Technologies</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1 },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        minHeight: 60,
    },
    headerBarDesktop: {
        paddingHorizontal: '5%',
        paddingVertical: 2,
    },
    headerLogo: {
        width: 100,
        height: 50,
    },
    headerTitleText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8b1e3f',
        marginLeft: 10,
        letterSpacing: 0.5,
    },
    headerTitleTextDesktop: {
        marginLeft: -60,
    },
    headerLogoDesktop: {
        width: 240,
        height: 90,
    },
    heroBanner: {
        width: '100%',
        height: 800,
        position: 'relative',
    },
    heroBannerDesktop: {
        height: 750,
    },
    heroContent: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
        paddingTop: 40,
    },
    heroContentDesktop: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: '5%',
        transform: [{ translateY: -40 }],
    },
    heroTextWrapperContent: {
        marginBottom: 30,
    },
    heroTextWrapperDesktop: {
        width: '100%',
        marginBottom: 40,
        alignItems: 'center',
    },
    heroMainTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a531b',
        lineHeight: 40,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        marginBottom: 20,
    },
    heroMainTitleDesktop: {
        fontSize: 64,
        lineHeight: 74,
    },
    cardsWrapper: {
        width: '100%',
        maxWidth: 350,
        alignSelf: 'center',
        gap: 20,
    },
    cardsWrapperDesktop: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        maxWidth: 900,
        gap: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    iconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f0f8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 10,
        marginBottom: 6,
        fontSize: 15,
        color: '#333',
        height: 45,
        outlineStyle: 'none',
    },
    inputFocused: {
        borderColor: '#000',
        borderWidth: 2,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        marginBottom: 6,
        height: 45,
    },
    passwordInput: {
        flex: 1,
        padding: 10,
        fontSize: 15,
        color: '#333',
        outlineStyle: 'none',
    },
    passwordContainerFocused: {
        borderColor: '#000',
        borderWidth: 2,
    },
    eyeIcon: {
        padding: 10,
    },
    signInButton: {
        backgroundColor: '#1a531b',
        paddingVertical: 10,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 5,
    },
    signInText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    forgotPasswordLink: {
        marginVertical: 8,
        alignItems: 'center',
    },
    forgotPasswordText: {
        color: '#1a531b',
        fontSize: 14,
        fontWeight: '500',
    },
    signUpButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#1a531b',
        paddingVertical: 10,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 8,
    },
    signUpText: {
        color: '#1a531b',
        fontWeight: 'bold',
        fontSize: 16,
    },
    adminLink: {
        marginTop: 15,
        alignItems: 'center',
    },
    adminLinkText: {
        color: '#fff',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    footerWrap: {
        width: '100%',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 20,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    footerContent: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    footerLogoSmall: {
        width: 160,
        height: 80,
        marginBottom: 5,
    },
    footerLinksCentered: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 0,
    },
    socialLinksContainer: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 0,
    },
    socialIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    link: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    linkDivider: {
        color: '#ccc',
        fontSize: 16,
        marginHorizontal: 0,
    },
    copyright: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 5,
    },
    poweredBy: {
        fontSize: 15,
        color: '#1a531b',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 2,
    }
});

export default LoginScreen;

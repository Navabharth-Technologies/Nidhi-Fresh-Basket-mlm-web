import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Image, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { COLORS } from '../theme/theme';
import { LayoutDashboard, Wallet, Network, Package, User, LogIn, Power } from 'lucide-react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import WalletScreen from '../screens/WalletScreen';
import NetworkScreen from '../screens/NetworkScreen';
import PackageScreen from '../screens/PackageScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

import PackageSelectionScreen from '../screens/PackageSelectionScreen';
import PaymentScreen from '../screens/PaymentScreen';
import KYCUploadScreen from '../screens/KYCUploadScreen';
import AdminKYCListScreen from '../screens/AdminKYCListScreen';
import KYCReviewScreen from '../screens/KYCReviewScreen';
import AdminWithdrawRequestsScreen from '../screens/AdminWithdrawRequestsScreen';
import KYCVerificationScreen from '../screens/KYCVerificationScreen';
import WithdrawRequestScreen from '../screens/WithdrawRequestScreen';
// Remove unused import: WithdrawHistoryScreen
// Removed InfoScreen import
import TermsScreen from '../screens/TermsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import SupportScreen from '../screens/SupportScreen';
import AboutScreen from '../screens/AboutScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

import CustomDrawerContent from '../components/CustomDrawerContent';

const UserDrawer = () => {
    const { user, isAdmin, profile } = useAuth();
    const isTrusted = isAdmin || (profile?.kyc_status?.toLowerCase() === 'approved') || profile?.is_active;

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                swipeEnabled: isTrusted,
                headerShown: false, // Use MainHeader in screens instead
                drawerStyle: {
                    backgroundColor: '#fff',
                    width: 260,
                    boxShadow: '0 0 20px rgba(0,0,0,0.1)', // for web
                    elevation: 10, // for android
                },
                overlayColor: 'rgba(0,0,0,0.4)',
                drawerType: 'front',
            }}
        >
            <Drawer.Screen name="Dashboard" component={DashboardScreen} />
            <Drawer.Screen name="Wallet" component={WalletScreen} />
            <Drawer.Screen name="Network" component={NetworkScreen} />
            <Drawer.Screen name="Packages" component={PackageScreen} />
            <Drawer.Screen name="Profile" component={ProfileScreen} />
        </Drawer.Navigator>
    );
};

const linking = {
    prefixes: ['https://nidhifreshbasket.in', 'nfb://'],
    config: {
        screens: {
            Login: 'login',
            Register: 'register',
            ForgotPassword: 'forgot-password',
            ResetPassword: 'reset-password',
            Main: {
                initialRouteName: 'Dashboard',
                screens: {
                    Dashboard: 'dashboard',
                    Wallet: 'wallet',
                    Network: 'network',
                    Packages: 'packages',
                    Profile: 'profile',
                }
            },
            PackageSelection: 'select-package',
            Payment: 'payment',
            KYCVerification: 'kyc',
            TermsAndConditions: 'terms-and-conditions',
            PrivacyPolicy: 'privacy-policy',
            HelpSupport: 'help-support',
            AboutUs: 'about-us',
        },
    },
};

const AppNavigation = () => {
    const { user, loading, isAdmin, logout } = useAuth();

    if (loading) return null;

    const MyTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: 'transparent',
        },
    };

    return (
        <NavigationContainer theme={MyTheme} linking={linking}>
            <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                {!user ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

                    </>
                ) : isAdmin ? (
                    <>
                        <Stack.Screen
                            name="AdminHome"
                            component={AdminKYCListScreen}
                            options={{
                                headerShown: true,
                                headerTitle: () => (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Image
                                            source={require('../../assets/nidhi_logo.png')}
                                            style={{ width: 180, height: 60, marginRight: -40, marginLeft: -25 }}
                                            resizeMode="contain"
                                        />
                                        <View style={{ marginLeft: 0 }}>
                                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1a531b', lineHeight: 22 }}>Admin Panel</Text>
                                            <Text style={{ fontSize: 12, color: '#666', lineHeight: 14 }}>Manage Approvals</Text>
                                        </View>
                                    </View>
                                ),
                                headerRight: () => (
                                    <TouchableOpacity 
                                        onPress={() => {
                                            const msg = 'Are you sure you want to logout?';
                                            if (Platform.OS === 'web') {
                                                if (window.confirm(msg)) logout();
                                            } else {
                                                Alert.alert('Logout', msg, [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    { text: 'Logout', style: 'destructive', onPress: logout }
                                                ]);
                                            }
                                        }}
                                        style={{ marginRight: 15, padding: 8, backgroundColor: '#fef2f2', borderRadius: 10 }}
                                    >
                                        <Power color="#DC2626" size={20} />
                                    </TouchableOpacity>
                                )
                            }}
                        />
                        <Stack.Screen 
                            name="KYCReview" 
                            component={KYCReviewScreen} 
                            options={{ 
                                headerShown: true, 
                                headerTitle: 'Review KYC',
                                headerTintColor: '#1a531b',
                                headerRight: () => (
                                    <TouchableOpacity 
                                        onPress={() => {
                                            const msg = 'Are you sure you want to logout?';
                                            if (Platform.OS === 'web') {
                                                if (window.confirm(msg)) logout();
                                            } else {
                                                Alert.alert('Logout', msg, [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    { text: 'Logout', style: 'destructive', onPress: logout }
                                                ]);
                                            }
                                        }}
                                        style={{ marginRight: 15, padding: 8, backgroundColor: '#fef2f2', borderRadius: 10 }}
                                    >
                                        <Power color="#DC2626" size={20} />
                                    </TouchableOpacity>
                                )
                            }} 
                        />
                        <Stack.Screen 
                            name="AdminWithdrawals" 
                            component={AdminWithdrawRequestsScreen} 
                            options={{ 
                                headerShown: true, 
                                headerTitle: 'Withdraw Requests',
                                headerTintColor: '#1a531b',
                                headerRight: () => (
                                    <TouchableOpacity 
                                        onPress={() => {
                                            const msg = 'Are you sure you want to logout?';
                                            if (Platform.OS === 'web') {
                                                if (window.confirm(msg)) logout();
                                            } else {
                                                Alert.alert('Logout', msg, [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    { text: 'Logout', style: 'destructive', onPress: logout }
                                                ]);
                                            }
                                        }}
                                        style={{ marginRight: 15, padding: 8, backgroundColor: '#fef2f2', borderRadius: 10 }}
                                    >
                                        <Power color="#DC2626" size={20} />
                                    </TouchableOpacity>
                                )
                            }} 
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Main" component={UserDrawer} />
                        <Stack.Screen name="PackageSelection" component={PackageSelectionScreen} />
                        <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="KYCVerification" component={KYCVerificationScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="WithdrawRequest" component={WithdrawRequestScreen} options={{ headerShown: false }} />

                        <Stack.Screen name="TermsAndConditions" component={TermsScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="PrivacyPolicy" component={PrivacyScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="HelpSupport" component={SupportScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="AboutUs" component={AboutScreen} options={{ headerShown: false }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigation;

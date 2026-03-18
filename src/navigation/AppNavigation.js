import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Image, Text, ImageBackground } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { COLORS } from '../theme/theme';
import { LayoutDashboard, Wallet, Network, Package, User, LogIn } from 'lucide-react-native';

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
import WithdrawHistoryScreen from '../screens/WithdrawHistoryScreen';
import InfoScreen from '../screens/InfoScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const UserDrawer = () => {
    const { user, isAdmin } = useAuth();
    const isTrusted = isAdmin || user?.isActive;

    return (
        <Drawer.Navigator
            screenOptions={{
                swipeEnabled: isTrusted, // Disable swipe for new users
                headerLeft: isTrusted ? undefined : () => null, // Hide hamburger if not trusted
                drawerActiveTintColor: '#333',
            drawerInactiveTintColor: '#666',
            drawerStyle: {
                backgroundColor: '#fff',
                width: 280,
            },
            headerStyle: {
                backgroundColor: '#fff',
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 1,
                borderBottomColor: '#eee',
            },
            headerTintColor: '#1a531b',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
            drawerLabelStyle: {
                fontWeight: '500',
                fontSize: 15,
            },
            drawerItemStyle: {
                borderRadius: 12,
                marginVertical: 4,
                marginHorizontal: 12,
            }
            }}
        >
            <Drawer.Screen 
                name="Dashboard" 
                component={DashboardScreen} 
                options={{ 
                    headerShown: false,
                    drawerIcon: ({ color, size, focused }) => <LayoutDashboard color={focused ? '#3b82f6' : color} size={size} />,
                    drawerActiveBackgroundColor: '#e0f2fe',
                    drawerActiveTintColor: '#1e40af'
                }} 
            />
            <Drawer.Screen 
                name="Wallet" 
                component={WalletScreen} 
                options={{
                    drawerIcon: ({ color, size, focused }) => <Wallet color={focused ? '#f97316' : color} size={size} />,
                    drawerActiveBackgroundColor: '#ffedd5',
                    drawerActiveTintColor: '#9a3412',
                    drawerItemStyle: isTrusted ? {} : { display: 'none' } // Hide link if not trusted
                }}
            />
            <Drawer.Screen 
                name="Network" 
                component={NetworkScreen} 
                options={{
                    drawerIcon: ({ color, size, focused }) => <Network color={focused ? '#10b981' : color} size={size} />,
                    drawerActiveBackgroundColor: '#dcfce7',
                    drawerActiveTintColor: '#166534',
                    drawerItemStyle: isTrusted ? {} : { display: 'none' }
                }}
            />
            <Drawer.Screen 
                name="Packages" 
                component={PackageScreen} 
                options={{
                    drawerIcon: ({ color, size, focused }) => <Package color={focused ? '#8b5cf6' : color} size={size} />,
                    drawerActiveBackgroundColor: '#f3e8ff',
                    drawerActiveTintColor: '#5b21b6',
                    drawerItemStyle: isTrusted ? {} : { display: 'none' }
                }}
            />
            <Drawer.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{
                    drawerIcon: ({ color, size, focused }) => <User color={focused ? '#06b6d4' : color} size={size} />,
                    drawerActiveBackgroundColor: '#e0f7f9',
                    drawerActiveTintColor: '#155e75'
                }}
            />
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
        },
    },
};

const AppNavigation = () => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) return null;

    const MyTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: 'transparent',
        },
    };

    return (
        <ImageBackground source={require('../../assets/app_bg.png')} style={{ flex: 1 }}>
            <NavigationContainer theme={MyTheme} linking={linking}>
                <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                {!user ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                        <Stack.Screen name="Info" component={InfoScreen} />
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
                                            style={{ width: 140, height: 40, marginRight: -20, marginLeft: -25 }} 
                                            resizeMode="contain" 
                                        />
                                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1a531b' }}>Approval Dashboard</Text>
                                    </View>
                                )
                            }} 
                        />
                        <Stack.Screen name="KYCReview" component={KYCReviewScreen} options={{ headerShown: true, title: 'Review KYC' }} />
                        <Stack.Screen name="AdminWithdrawals" component={AdminWithdrawRequestsScreen} options={{ headerShown: true, title: 'Withdraw Requests' }} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Main" component={UserDrawer} />
                        <Stack.Screen name="PackageSelection" component={PackageSelectionScreen} />
                        <Stack.Screen name="Payment" component={PaymentScreen} />
                        <Stack.Screen name="KYCVerification" component={KYCVerificationScreen} />
                        <Stack.Screen name="WithdrawRequest" component={WithdrawRequestScreen} options={{ headerShown: true, title: 'Withdraw Funds' }} />
                        <Stack.Screen name="WithdrawHistory" component={WithdrawHistoryScreen} options={{ headerShown: true, title: 'Withdrawal History' }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
        </ImageBackground>
    );
};

export default AppNavigation;

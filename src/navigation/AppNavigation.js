import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
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

const UserDrawer = () => (
    <Drawer.Navigator
        screenOptions={({ route }) => ({
            drawerIcon: ({ color, size }) => {
                let iconName = 'LayoutDashboard';
                if (route.name === 'Dashboard') iconName = 'LayoutDashboard';
                else if (route.name === 'Wallet') iconName = 'Wallet';
                else if (route.name === 'Network') iconName = 'Network';
                else if (route.name === 'Packages') iconName = 'Package';
                else if (route.name === 'Profile') iconName = 'User';

                const IconComponent = {
                    LayoutDashboard, Wallet, Network, Package, User
                }[iconName];

                return <IconComponent color={color} size={size} />;
            },
            drawerActiveTintColor: '#217323',
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
        })}
    >
        <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Drawer.Screen name="Wallet" component={WalletScreen} />
        <Drawer.Screen name="Network" component={NetworkScreen} />
        <Drawer.Screen name="Packages" component={PackageScreen} />
        <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
);

const AppNavigation = () => {
    const { user, loading, isAdmin } = useAuth();

    if (loading) return null;

    const MyTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            background: '#f8f9fa',
        },
    };

    return (
        <NavigationContainer theme={MyTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
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
                        <Stack.Screen name="AdminHome" component={AdminKYCListScreen} options={{ headerShown: true, title: 'KYC Reviews' }} />
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
    );
};

export default AppNavigation;

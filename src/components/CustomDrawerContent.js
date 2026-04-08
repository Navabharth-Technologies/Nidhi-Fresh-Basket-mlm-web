import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated, Alert, Image } from 'react-native';
import { DrawerContentScrollView, useDrawerStatus } from '@react-navigation/drawer';
import { COLORS } from '../theme/theme';
import { LayoutDashboard, Wallet, Network, Package, User, Power, Lock } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';
import apiClient from '../api/client';

const AnimatedMenuItem = ({ children, index, drawerStatus, style, innerStyle, isLocked, isActive, onPress }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (drawerStatus === 'open') {
            // Reset and animate in
            animatedValue.setValue(0);
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 400,
                delay: index * 60, // 60ms stagger
                useNativeDriver: true,
            }).start();
        } else {
            // Animate out or reset
            animatedValue.setValue(0);
        }
    }, [drawerStatus]);

    const translateY = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [15, 0], // Slide up by 15px
    });

    const opacity = animatedValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1], // Fade in later
    });

    return (
        <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
            <TouchableOpacity
                activeOpacity={isLocked ? 1 : 0.7}
                style={[
                    innerStyle || styles.menuItemInner,
                    isActive && style[1] // Apply active background if passed in style array
                ]}
                onPress={onPress}
            >
                {children}
            </TouchableOpacity>
        </Animated.View>
    );
};

const CustomDrawerContent = (props) => {
    const { logout, user, profile, setProfile, isAdmin } = useAuth();
    const { state, navigation } = props;
    const drawerStatus = useDrawerStatus();

    useEffect(() => {
        if (!profile && user) {
            fetchDrawerProfile();
        }
    }, [profile, user]);

    const fetchDrawerProfile = async () => {
        try {
            const res = await apiClient.get('/users/profile');
            setProfile(res.data);
        } catch (e) {
            console.error('Drawer Profile fetch failed:', e);
        }
    };

    const isVerified = isAdmin || (profile?.kyc_status?.toLowerCase() === 'approved') || profile?.is_active;

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, route: 'Dashboard', color: '#217323', bgColor: '#e7f3e7', alwaysVisible: true },
        { name: 'Wallet', icon: Wallet, route: 'Wallet', color: '#9a3412', bgColor: '#ffedd5', alwaysVisible: false },
        { name: 'Level Management', icon: Network, route: 'Network', color: '#10b981', bgColor: '#dcfce7', alwaysVisible: false },
        { name: 'Packages', icon: Package, route: 'Packages', color: '#5b21b6', bgColor: '#f3e8ff', alwaysVisible: false },
        { name: 'Profile', icon: User, route: 'Profile', color: '#155e75', bgColor: '#e0f7f9', alwaysVisible: true },
    ];

    return (
        <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContainer} style={styles.drawerWrapper}>
            <View style={styles.drawerContent}>
                <AnimatedMenuItem
                    index={0}
                    drawerStatus={drawerStatus}
                    style={styles.header}
                    innerStyle={styles.headerInner}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.profileBadge}>
                            {profile?.profile_image_binary ? (
                                <Image 
                                    source={{ uri: `${apiClient.defaults.baseURL}/users/view-profile-image/${profile.id}?t=${Date.now()}` }} 
                                    style={styles.avatarImage} 
                                />
                            ) : (
                                <User size={24} color={COLORS.primary} />
                            )}
                        </View>
                        <View>
                            <Text style={styles.userName} numberOfLines={1}>{profile?.full_name || user?.full_name || 'Member'}</Text>
                            <Text style={styles.userRole}>{profile?.userid || user?.userid || 'NFB User'}</Text>
                        </View>
                    </View>
                </AnimatedMenuItem>

                <View style={styles.menuList}>
                    {menuItems.map((item, index) => {
                        const isActive = state.routes[state.index].name === item.route;
                        const isLocked = !item.alwaysVisible && !isVerified;
                        const Icon = isLocked ? Lock : item.icon;
                        
                        return (
                            <AnimatedMenuItem
                                key={index}
                                index={index + 1} // Offset by 1 for header
                                drawerStatus={drawerStatus}
                                isLocked={isLocked}
                                isActive={isActive}
                                style={[
                                    styles.menuItem,
                                    isActive && { backgroundColor: item.bgColor },
                                    isLocked && { opacity: 0.6 }
                                ]}
                                onPress={() => {
                                    if (isLocked) {
                                        Alert.alert(
                                            'Access Restricted',
                                            'Please complete your KYC verification and first purchase to access this section.',
                                            [{ text: 'OK' }]
                                        );
                                        return;
                                    }
                                    navigation.navigate(item.route);
                                }}
                            >
                                <Icon 
                                    size={20} 
                                    color={isActive ? item.color : (isLocked ? '#94a3b8' : '#64748b')} 
                                    strokeWidth={isActive ? 2.5 : 1.8} 
                                />
                                <Text style={[
                                    styles.menuText,
                                    isActive && { color: item.color, fontWeight: '700' },
                                    isLocked && { color: '#94a3b8' }
                                ]}>
                                    {item.name}
                                </Text>
                            </AnimatedMenuItem>
                        );
                    })}
                </View>

                <View style={styles.footer}>
                    <AnimatedMenuItem
                        index={menuItems.length + 1} // Offset after all menu items
                        drawerStatus={drawerStatus}
                        style={styles.logoutBtn}
                        onPress={logout}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Power size={20} color="#dc3545" strokeWidth={2} />
                            <Text style={styles.logoutText}>Logout</Text>
                        </View>
                    </AnimatedMenuItem>
                </View>
            </View>
        </DrawerContentScrollView>
    );
};

const styles = StyleSheet.create({
    drawerWrapper: {
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    drawerContent: {
        flex: 1,
        padding: 20,
    },
    header: {
        marginBottom: 30,
        borderRadius: 12,
        overflow: 'hidden',
    },
    headerInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    profileBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden', // Ensure image is circular
        borderWidth: 1.5,
        borderColor: COLORS.primary + '20',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        maxWidth: 160,
    },
    userRole: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    menuList: {
        flex: 1,
    },
    menuItem: {
        marginBottom: 8,
        borderRadius: 10,
        overflow: 'hidden',
    },
    menuItemInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 14,
        gap: 12,
    },
    menuText: {
        fontSize: 15,
        color: '#64748b',
        fontWeight: '500',
    },
    footer: {
        marginTop: 'auto',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    logoutBtn: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    logoutText: {
        fontSize: 15,
        color: '#dc3545',
        fontWeight: 'bold',
    }
});

export default CustomDrawerContent;

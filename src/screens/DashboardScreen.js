import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert, Platform, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { Wallet, Users, Package, TrendingUp, AlertCircle, CheckCircle, Clock, FileText, Upload, ArrowLeft, LogOut, User } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';
import ScreenBackground from '../components/ScreenBackground';
import MainHeader from '../components/MainHeader';

// Framer Motion for Web animations
let motion = { button: TouchableOpacity, div: View };
if (Platform.OS === 'web') {
    try {
        const { motion: fm } = require('framer-motion');
        motion = fm;
    } catch (e) {
        console.warn('Framer Motion not available', e);
    }
}

const StatCard = ({ title, value, icon: Icon, color, onPress, fullWidth }) => {
    if (fullWidth) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[styles.card, styles.fullWidthCard]}
            >
                <View style={[styles.iconContainer, { backgroundColor: color + '20', marginBottom: 0, marginRight: 14 }]}>
                    <Icon color={color} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardValue, { fontSize: 26 }]}>{value}</Text>
                    <Text style={styles.cardTitle}>{title}</Text>
                </View>
            </TouchableOpacity>
        );
    }
    return (
        <TouchableOpacity 
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.card}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                    <Icon color={color} size={20} />
                </View>
            </View>
            <Text style={styles.cardValue}>{value}</Text>
            <Text style={styles.cardTitle}>{title}</Text>
        </TouchableOpacity>
    );
};



const DashboardScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { logout, user, isAdmin, setProfile: setGlobalProfile } = useAuth();
    const [profile, setProfile] = useState(null);
    const [purchasedPackages, setPurchasedPackages] = useState([]);
    const [kycDetails, setKycDetails] = useState({ status: 'Not Submitted' });
    const [refreshing, setRefreshing] = useState(false);

    const [showAllPackages, setShowAllPackages] = useState(false);
    const displayedPackages = showAllPackages ? purchasedPackages : purchasedPackages.slice(0, 2);

    // Access control: Trusted users are admins, or those with approved KYC OR an active account
    const isTrusted = isAdmin || (kycDetails.status?.toLowerCase() === 'approved') || (user?.isActive || profile?.is_active);

    const fetchData = async () => {
        try {
            const [profileRes, packageRes, kycRes] = await Promise.all([
                apiClient.get('/users/profile'),
                apiClient.get('/users/purchased-package'),
                apiClient.get('/kyc/user/kyc-status')
            ]);
            setProfile(profileRes.data);
            setGlobalProfile(profileRes.data);
            
            // Sync active status with context for global navigation locking
            if (profileRes.data && profileRes.data.is_active !== user?.isActive) {
                updateActiveStatus(profileRes.data.is_active);
            }

            console.log('Profile Data:', profileRes.data);
            console.log('Package Res Data:', packageRes.data);
            console.log('isAdmin flag:', isAdmin);
            setPurchasedPackages(Array.isArray(packageRes.data) ? packageRes.data : []);
            setKycDetails(kycRes.data || { status: 'Not Submitted' });
        } catch (e) {
            console.error('Failed to fetch dashboard data', e);
            if (e.response && (e.response.status === 401 || e.response.status === 404)) {
                logout();
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchData();
        });

        // Auto-refresh: Poll data every 30 seconds
        const interval = setInterval(() => {
            if (!refreshing) fetchData();
        }, 30000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [navigation, refreshing]);

    const purchaseButtonProps = Platform.OS === 'web'
        ? { onClick: () => navigation.navigate('PackageSelection') }
        : { onPress: () => navigation.navigate('PackageSelection') };

    return (
        <ScreenBackground subtle={false}>
            <View style={styles.container}>
                <MainHeader title="Dashboard" navigation={navigation} />
    
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
                >
                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <Image
                            source={require('../../assets/nidhi_logo.png')}
                            style={styles.nidhiLogo}
                            resizeMode="contain"
                        />
                        <Text style={styles.welcomeText}>Welcome back, {profile?.full_name?.split(' ')[0] || 'Member'}!</Text>
                    </View>
    
                    {/* SECTION 2: PURCHASED PACKAGE DISPLAY */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>My Package</Text>
                        </View>
                        <View style={styles.sectionBody}>
                            {purchasedPackages.length > 0 ? (
                                <>
                                    {displayedPackages.map((pkg, index) => (
                                        <View key={pkg.id || index} style={[styles.packageCard, index < displayedPackages.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 15, paddingBottom: 15 }]}>
                                            <View style={styles.packageHeader}>
                                                <Text style={styles.packageNameText}>{pkg.package_name || 'Active Plan'}</Text>
                                                <View style={{ backgroundColor: pkg.status === 'active' ? '#217323' : '#dc3545', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
                                                    <Text style={styles.statusBadgeText}>{pkg.status || 'Active'}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.packageBody}>
                                                <View style={styles.packageDetail}>
                                                    <Text style={styles.detailLabel}>Amount</Text>
                                                    <Text style={styles.detailValue}>₹{pkg.amount || pkg.price || '0.00'}</Text>
                                                </View>
                                                <View style={styles.packageDetail}>
                                                    <Text style={styles.detailLabel}>Purchase Date</Text>
                                                    <Text style={styles.detailValue}>{new Date(pkg.purchase_date || pkg.created_at).toLocaleDateString()}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                    
                                    {purchasedPackages.length > 2 && (
                                        <TouchableOpacity 
                                            style={styles.seeMoreBtn} 
                                            onPress={() => setShowAllPackages(!showAllPackages)}
                                        >
                                            <Text style={styles.seeMoreText}>
                                                {showAllPackages ? 'See Less' : `See More (${purchasedPackages.length - 2} more)`}
                                            </Text>
                                            {showAllPackages ? <Clock size={16} color="#217323" /> : <Clock size={16} color="#217323" style={{ transform: [{ rotate: '180deg' }] }} />}
                                        </TouchableOpacity>
                                    )}
                                </>
                            ) : (
                                <View style={styles.noPackageContainer}>
                                    <View style={styles.infoCircleBg}>
                                        <AlertCircle color="#999" size={32} />
                                    </View>
                                    <Text style={styles.noPackageText}>No Package Purchased Yet</Text>
                                </View>
                            )}
                        </View>
                    </View>
    
                    {/* SECTION 3: IDENTITY & PACKAGE VERIFICATION */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Identity Verification</Text>
                        </View>
                        <View style={styles.sectionBody}>
                            {/* KYC Row - Always show identity status */}
                            <View style={[styles.kycRow, { marginBottom: (kycDetails.status?.toLowerCase() === 'pending' && purchasedPackages.length > 0) ? 20 : 0 }]}>
                                <View style={styles.kycNavHeader}>
                                    <View style={[styles.kycStatusIcon, { backgroundColor: (kycDetails.status?.toLowerCase() === 'approved' || purchasedPackages.length > 0) ? '#D1FAE5' : kycDetails.status?.toLowerCase() === 'pending' ? '#FEF3C7' : '#FEE2E2' }]}>
                                        {(kycDetails.status?.toLowerCase() === 'approved' || purchasedPackages.length > 0) ? <CheckCircle color="#059669" size={24} /> :
                                            kycDetails.status?.toLowerCase() === 'pending' ? <Clock color="#D97706" size={24} /> : <AlertCircle color="#DC2626" size={24} />}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.kycNavTitle}>KYC Verification</Text>
                                        <Text style={[styles.kycStatusText, { color: (kycDetails.status?.toLowerCase() === 'approved' || purchasedPackages.length > 0) ? '#059669' : kycDetails.status?.toLowerCase() === 'pending' ? '#D97706' : '#DC2626' }]}>
                                            Status: {(kycDetails.status?.toLowerCase() === 'approved' || purchasedPackages.length > 0) ? 'Approved' : kycDetails.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Repurchase Status Row - Only show if it's a repurchase and pending */}
                            {kycDetails.status?.toLowerCase() === 'pending' && purchasedPackages.length > 0 && (
                                <View style={[styles.kycRow, { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 }]}>
                                    <View style={styles.kycNavHeader}>
                                        <View style={[styles.kycStatusIcon, { backgroundColor: '#FEF3C7' }]}>
                                            <TrendingUp color="#D97706" size={24} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.kycNavTitle}>Package Repurchase</Text>
                                            <Text style={[styles.kycStatusText, { color: '#D97706' }]}>
                                                Status: Pending Approval
                                            </Text>
                                            <Text style={styles.kycSubText}>Request for: {kycDetails.package_name}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
    
                            <TouchableOpacity
                                style={[styles.verifyBtn, { marginTop: 15 }]}
                                onPress={() => navigation.navigate('KYCVerification')}
                            >
                                <Text style={styles.verifyBtnText}>
                                    {(kycDetails.status?.toLowerCase() === 'approved' || purchasedPackages.length > 0) ? 'View Identity Info' : 'Verify Now'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
    
                    {/* STATS OVERVIEW - Only visible to trusted users */}
                    {isTrusted && (
                    <View style={[styles.section, { marginBottom: 60 }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>My Earnings</Text>
                        </View>
                        <View style={styles.sectionBody}>
                            <View style={styles.statsGrid}>
                                 <StatCard 
                                    title="Wallet Balance" 
                                    value={`₹${Number(profile?.total_balance || 0).toLocaleString('en-IN')}`} 
                                    icon={Wallet} 
                                    color="#166534" 
                                    bgColor="rgba(220, 252, 231, 0.6)"
                                    onPress={() => navigation.navigate('Wallet')}
                                    fullWidth={true}
                                />
                                <StatCard 
                                    title="Coupon Balance" 
                                    value={`₹${Number(profile?.total_coupon_benefits || 0).toLocaleString('en-IN')}`} 
                                    icon={Package} 
                                    color="#9a3412" 
                                    bgColor="rgba(255, 237, 213, 0.6)"
                                    onPress={() => navigation.navigate('Wallet')}
                                />
                                <StatCard 
                                    title="Direct Income" 
                                    value={`₹${Number(profile?.direct_income || 0).toLocaleString('en-IN')}`} 
                                    icon={TrendingUp} 
                                    color="#1e40af" 
                                    bgColor="rgba(219, 234, 254, 0.6)"
                                    onPress={() => navigation.navigate('Wallet')}
                                />
                                <StatCard 
                                    title="Level Income" 
                                    value={`₹${Number(profile?.level_income || 0).toLocaleString('en-IN')}`} 
                                    icon={TrendingUp} 
                                    color="#6b21a8" 
                                    bgColor="rgba(243, 232, 255, 0.6)"
                                    onPress={() => navigation.navigate('Wallet')}
                                />
                                <StatCard 
                                    title="Total Earnings" 
                                    value={`₹${Number(profile?.total_earnings || 0).toLocaleString('en-IN')}`} 
                                    icon={CheckCircle} 
                                    color="#3730a3" 
                                    bgColor="rgba(238, 242, 255, 0.6)"
                                    onPress={() => navigation.navigate('Wallet')}
                                />
                            </View>
                        </View>
                    </View>
                    )}
                </ScrollView>
            </View>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogoutBtn: {
        padding: 5,
    },
    menuBtn: {
        width: 30,
        justifyContent: 'center',
    },
    menuLine: {
        height: 2,
        backgroundColor: '#2d6731',
        width: 20,
        marginVertical: 2,
        borderRadius: 1,
    },
    navTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2d6731',
        marginLeft: 8,
    },
    content: {
        paddingBottom: 40,
    },
    logoSection: {
        backgroundColor: 'transparent',
        width: '100%',
        paddingVertical: 25,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 10,
    },
    nidhiLogo: {
        width: 280,
        height: 140,
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8b1e3f',
        marginTop: -3,
    },
    section: {
        width: Platform.OS === 'web' ? '98%' : '100%',
        alignSelf: 'center',
        marginBottom: 15,
        borderRadius: 8,
        overflow: 'hidden',
    },
    sectionHeader: {
        backgroundColor: 'rgba(248, 250, 252, 0.8)',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    sectionBody: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    packageCard: {
        width: '100%',
        paddingVertical: 5,
    },
    packageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 10,
    },
    packageNameText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    packageBody: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: 20,
    },
    packageDetail: {
        flex: 1,
        marginBottom: Platform.OS === 'web' ? 0 : 10,
    },
    detailLabel: {
        fontSize: 12,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
    },
    noPackageContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    infoCircleBg: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#94a3b8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    noPackageText: {
        color: '#64748b',
        fontSize: 16,
    },
    kycNavCard: {
        width: '100%',
    },
    kycNavHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    kycStatusIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    kycNavTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#334155',
    },
    kycStatusText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    kycRow: {
        width: '100%',
    },
    kycSubText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    verifyBtn: {
        backgroundColor: '#1a531b',
        width: '100%',
        paddingVertical: 14,
        borderRadius: 6,
        alignItems: 'center',
    },
    verifyBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        backgroundColor: '#fff',
        width: '48%',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    fullWidthCard: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fullWidthTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#64748b',
        marginLeft: 12,
    },
    fullWidthValue: {
        fontSize: 28,
        marginTop: 5,
    },
    cardValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    cardTitle: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    seeMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 10,
    },
    seeMoreText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#217323',
        marginRight: 8,
    },
});

export default DashboardScreen;

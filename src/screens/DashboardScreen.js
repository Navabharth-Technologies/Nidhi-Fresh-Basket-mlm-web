import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert, Platform, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { Wallet, Users, Package, TrendingUp, AlertCircle, CheckCircle, Clock, FileText, Upload, ArrowLeft, Power, User, Gem, Award, Shield, ChevronRight, RefreshCw, RotateCcw, ArrowUpRight } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';
import ScreenBackground from '../components/ScreenBackground';
import MainHeader from '../components/MainHeader';
import AnimatedCard from '../components/AnimatedCard';

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

const StatCard = ({ title, value, icon: Icon, color, onPress, fullWidth, isDesktop }) => {
    return (
        <AnimatedCard
            onPress={onPress}
            style={[styles.card, fullWidth && styles.fullWidthCard, !fullWidth && { flex: 1 }]}
        >
            <View style={{ flexDirection: fullWidth ? 'row' : 'column', alignItems: fullWidth ? 'center' : 'stretch' }}>
                <View style={[styles.iconContainer, { backgroundColor: color + '20', marginBottom: fullWidth ? 0 : 10, marginRight: fullWidth ? 14 : 0 }]}>
                    <Icon color={color} size={fullWidth ? 22 : 20} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardValue, fullWidth && { fontSize: 26 }]}>{value}</Text>
                    <Text style={styles.cardTitle}>{title}</Text>
                </View>
            </View>
        </AnimatedCard>
    );
};



const getPackageDetails = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('diamond')) return { icon: Gem, color: '#0ea5e9', bgColor: '#e0f2fe' };
    if (n.includes('gold')) return { icon: Award, color: '#eab308', bgColor: '#fefce8' };
    if (n.includes('silver')) return { icon: Shield, color: '#64748b', bgColor: '#f1f5f9' };
    return { icon: Package, color: COLORS.secondary, bgColor: '#f0fdf4' };
};

const DashboardScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { logout, user, isAdmin, setProfile: setGlobalProfile, updateActiveStatus } = useAuth();
    const [profile, setProfile] = useState(null);
    const [purchasedPackages, setPurchasedPackages] = useState([]);
    const [kycDetails, setKycDetails] = useState({ status: 'Not Submitted' });
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

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
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchData();
        } catch (e) {
            console.error('Refresh failed:', e);
        } finally {
            setRefreshing(false);
        }
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

    if (loading) {
        return (
            <ScreenBackground subtle={false}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={COLORS.secondary} />
                    <Text style={{ marginTop: 10, color: COLORS.secondary, fontWeight: '600' }}>Loading Dashboard...</Text>
                </View>
            </ScreenBackground>
        );
    }

    return (
        <ScreenBackground subtle={false}>
            <View style={styles.container}>
                <MainHeader title="Dashboard" navigation={navigation} />

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.content}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            tintColor={COLORS.secondary} 
                            colors={[COLORS.secondary]} 
                            progressBackgroundColor="#ffffff"
                        />
                    }
                    alwaysBounceVertical={true}
                    scrollEventThrottle={16}
                >
                    <View style={{ minHeight: '101%', display: 'flex' }}>
                    {/* Welcoming Header Section */}
                    <View style={[styles.logoSection, !isDesktop && { marginBottom: 10 }]}>
                        <Image
                            source={require('../../assets/nidhi_logo.png')}
                            style={[styles.nidhiLogo, !isDesktop ? { width: 150, height: 150, marginBottom: -26 } : { marginBottom: -20 }]}
                            resizeMode="contain"
                        />
                        <Text style={[styles.welcomeText, !isDesktop && { fontSize: 22 }]}>
                            Welcome back, {profile?.full_name?.split(' ')[0] || 'Member'}!
                        </Text>
                    </View>

                    {/* SECTION 2: PURCHASED PACKAGE DISPLAY */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>My Package</Text>
                        </View>
                        <View style={styles.sectionBody}>
                            {purchasedPackages.length > 0 ? (
                                <>
                                    <View style={styles.packageGrid}>
                                        {displayedPackages.map((pkg, index) => {
                                            const details = getPackageDetails(pkg.package_name);
                                            const Icon = details.icon;
                                            return (
                                                <AnimatedCard 
                                                    key={pkg.id || index} 
                                                    style={[styles.packageCardGrid, !isDesktop && { width: '100%' }]}
                                                    disableHover={true}
                                                >
                                                    <View style={styles.pkgTopRow}>
                                                        <View style={[styles.pkgIconBox, { backgroundColor: details.bgColor }]}>
                                                            <Icon color={details.color} size={20} />
                                                        </View>
                                                        <View style={styles.pkgNameContainer}>
                                                            <Text style={styles.pkgNameText} numberOfLines={1}>{pkg.package_name || 'Active Plan'}</Text>
                                                        </View>
                                                        <View style={styles.pkgStatusBadge}>
                                                            <Text style={styles.pkgStatusText}>ACTIVE</Text>
                                                        </View>
                                                    </View>
                                                    
                                                    <View style={styles.pkgValueRow}>
                                                        <Text style={styles.pkgAmount}>₹{Number(pkg.amount || pkg.price || 0).toLocaleString('en-IN')}</Text>
                                                        <Text style={styles.pkgDate}>{new Date(pkg.purchase_date || pkg.created_at).toLocaleDateString()}</Text>
                                                    </View>
                                                </AnimatedCard>
                                            );
                                        })}
                                    </View>


                                    {purchasedPackages.length > 2 && (
                                        <TouchableOpacity
                                            style={styles.seeMoreBtn}
                                            onPress={() => setShowAllPackages(!showAllPackages)}
                                        >
                                            <Text style={styles.seeMoreText}>
                                                {showAllPackages ? 'See Less' : `See More (${purchasedPackages.length - 2} more)`}
                                            </Text>
                                            {showAllPackages ? <Clock size={16} color="#909f91ff" /> : <Clock size={16} color="#217323" style={{ transform: [{ rotate: '180deg' }] }} />}
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
                                            <RotateCcw color="#D97706" size={24} />
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

                            <AnimatedCard
                                style={[styles.verifyBtn, { marginTop: 15, paddingVertical: 0 }]}
                                onPress={() => navigation.navigate('KYCVerification')}
                            >
                                <View style={{ paddingVertical: 14, width: '100%', alignItems: 'center' }}>
                                    <Text style={styles.verifyBtnText}>
                                        {(kycDetails.status?.toLowerCase() === 'approved' || purchasedPackages.length > 0) ? 'View Identity Info' : 'Verify Now'}
                                    </Text>
                                </View>
                            </AnimatedCard>
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
                                        isDesktop={isDesktop}
                                    />
                                    
                                    <View style={styles.cardRow}>
                                        <StatCard
                                            title="Coupon Balance"
                                            value={`₹${Number(profile?.total_coupon_benefits || 0).toLocaleString('en-IN')}`}
                                            icon={Package}
                                            color="#9a3412"
                                            bgColor="rgba(255, 237, 213, 0.6)"
                                            onPress={() => navigation.navigate('Wallet')}
                                            isDesktop={isDesktop}
                                        />
                                        <StatCard
                                            title="Direct Income"
                                            value={`₹${Number(profile?.direct_income || 0).toLocaleString('en-IN')}`}
                                            icon={ArrowUpRight}
                                            color="#1e40af"
                                            bgColor="rgba(219, 234, 254, 0.6)"
                                            onPress={() => navigation.navigate('Wallet')}
                                            isDesktop={isDesktop}
                                        />
                                    </View>

                                    <View style={styles.cardRow}>
                                        <StatCard
                                            title="Level Income"
                                            value={`₹${Number(profile?.level_income || 0).toLocaleString('en-IN')}`}
                                            icon={ArrowUpRight}
                                            color="#6b21a8"
                                            bgColor="rgba(243, 232, 255, 0.6)"
                                            onPress={() => navigation.navigate('Wallet')}
                                            isDesktop={isDesktop}
                                        />
                                        <StatCard
                                            title="Total Earnings"
                                            value={`₹${Number(profile?.total_earnings || 0).toLocaleString('en-IN')}`}
                                            icon={CheckCircle}
                                            color="#047857"
                                            bgColor="rgba(209, 250, 229, 0.6)"
                                            onPress={() => navigation.navigate('Wallet')}
                                            isDesktop={isDesktop}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                    </View>
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
        width: '100%',
        alignSelf: 'center',
        paddingVertical: 0,
        paddingHorizontal: 0,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    nidhiLogo: {
        width: 200,
        height: 160,
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: '700',
        color: '#8b2323',
        textAlign: 'center',
        marginLeft: 0,
    },
    section: {
        width: Platform.OS === 'web' ? '98%' : '100%',
        alignSelf: 'center',
        marginBottom: 15,
        borderRadius: 8,
        overflow: 'hidden',
    },
    sectionHeader: {
        backgroundColor: COLORS.glassBgDark,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    sectionBody: {
        backgroundColor: COLORS.glassBg,
        padding: 15,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        borderWidth: 1.5,
        borderTopWidth: 0,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        })
    },
    packageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    packageCardGrid: {
        width: '48.5%',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    pkgTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    pkgIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    pkgNameContainer: {
        flex: 1,
    },
    pkgNameText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    pkgStatusBadge: {
        backgroundColor: '#166534',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    pkgStatusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    pkgValueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    pkgAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    pkgDate: {
        fontSize: 11,
        color: '#64748b',
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
        backgroundColor: COLORS.primary,
        width: '100%',
        paddingVertical: 0,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 15,
        overflow: 'hidden'
    },
    verifyBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    statsGrid: {
        width: '100%',
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 10,
    },
    card: {
        backgroundColor: COLORS.glassBgDark, // Little transparent for sub-cards
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
        width: '100%',
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        }),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardDesktop: {
        padding: 15,
        marginBottom: 15,
    },
    fullWidthCard: {
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
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 10,
    },
    seeMoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginRight: 8,
    },
});

export default DashboardScreen;

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert, Platform, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { Wallet, Users, Package, TrendingUp, AlertCircle, CheckCircle, Clock, FileText, Upload, ArrowLeft, LogOut } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';

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

const StatCard = ({ title, value, icon: Icon, color }) => (
    <View style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Icon color={color} size={24} />
        </View>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
    </View>
);

const DashboardScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [purchasedPackage, setPurchasedPackage] = useState(null);
    const [kycDetails, setKycDetails] = useState({ status: 'Not Submitted' });
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [profileRes, packageRes, kycRes] = await Promise.all([
                apiClient.get('/users/profile'),
                apiClient.get('/users/purchased-package'),
                apiClient.get('/kyc/user/kyc-status')
            ]);
            setProfile(profileRes.data);
            setPurchasedPackage(packageRes.data);
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
        return unsubscribe;
    }, [navigation]);

    const purchaseButtonProps = Platform.OS === 'web'
        ? { onClick: () => navigation.navigate('PackageSelection') }
        : { onPress: () => navigation.navigate('PackageSelection') };

    return (
        <View style={styles.container}>
            {/* Top Navigation Bar */}
            <View style={styles.headerBar}>
                <View style={styles.headerLeft}>
                    {(kycDetails.status?.toLowerCase() === 'approved' && purchasedPackage) ? (
                        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
                            <View style={styles.menuLine} />
                            <View style={styles.menuLine} />
                            <View style={[styles.menuLine, { width: 12 }]} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 8 }} />
                    )}
                    <Text style={styles.navTitle}>Dashboard</Text>
                </View>

                {!(kycDetails.status?.toLowerCase() === 'approved' && purchasedPackage) && (
                    <TouchableOpacity style={styles.headerLogoutBtn} onPress={logout}>
                        <LogOut color="#8b1e3f" size={20} />
                    </TouchableOpacity>
                )}
            </View>

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
                        <View style={[styles.packageCard, !purchasedPackage && styles.emptyPackage]}>
                            {purchasedPackage ? (
                                <>
                                    <View style={styles.packageHeader}>
                                        <Text style={styles.packageNameText}>{purchasedPackage.package_name || 'Active Plan'}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: purchasedPackage.status === 'active' ? '#217323' : '#dc3545' }]}>
                                            <Text style={styles.statusBadgeText}>{purchasedPackage.status || 'Active'}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.packageBody}>
                                        <View style={styles.packageDetail}>
                                            <Text style={styles.detailLabel}>Amount</Text>
                                            <Text style={styles.detailValue}>₹{purchasedPackage.amount || purchasedPackage.price || '0.00'}</Text>
                                        </View>
                                        <View style={styles.packageDetail}>
                                            <Text style={styles.detailLabel}>Purchase Date</Text>
                                            <Text style={styles.detailValue}>{new Date(purchasedPackage.purchase_date || purchasedPackage.created_at).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
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
                </View>

                {/* SECTION 3: KYC VERIFICATION ENTRY */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Identity Verification</Text>
                    </View>
                    <View style={styles.sectionBody}>
                        <View style={[styles.kycNavCard, kycDetails.status?.toLowerCase() === 'approved' && styles.kycApproved]}>
                            <View style={styles.kycNavHeader}>
                                <View style={[styles.kycStatusIcon, { backgroundColor: kycDetails.status?.toLowerCase() === 'approved' ? '#D1FAE5' : kycDetails.status?.toLowerCase() === 'pending' ? '#FEF3C7' : '#FEE2E2' }]}>
                                    {kycDetails.status?.toLowerCase() === 'approved' ? <CheckCircle color="#059669" size={24} /> :
                                        kycDetails.status?.toLowerCase() === 'pending' ? <Clock color="#D97706" size={24} /> : <AlertCircle color="#DC2626" size={24} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.kycNavTitle}>KYC Verification</Text>
                                    <Text style={[styles.kycStatusText, { color: kycDetails.status?.toLowerCase() === 'approved' ? '#059669' : kycDetails.status?.toLowerCase() === 'pending' ? '#D97706' : '#DC2626' }]}>
                                        Status: {kycDetails.status}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.verifyBtn}
                                onPress={() => navigation.navigate('KYCVerification')}
                            >
                                <Text style={styles.verifyBtnText}>{kycDetails.status?.toLowerCase() === 'approved' ? 'View KYC' : 'Verify Now'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* STATS OVERVIEW */}
                <View style={[styles.section, { marginBottom: 60 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>My Earnings</Text>
                    </View>
                    <View style={styles.sectionBody}>
                        <View style={styles.statsGrid}>
                            <StatCard title="Wallet Balance" value={`₹${profile?.balance || 0}`} icon={Wallet} color="#34d399" />
                            <StatCard title="Direct Income" value={`₹${profile?.direct_income || 0}`} icon={Package} color="#34d399" />
                            <StatCard title="Level Income" value={`₹${profile?.level_income || 0}`} icon={TrendingUp} color="#34d399" />
                            <StatCard title="Total Earnings" value={`₹${profile?.total_earnings || 0}`} icon={CheckCircle} color="#34d399" />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
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
        backgroundColor: '#fff',
        width: '100%',
        paddingVertical: 25,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: 10,
    },
    nidhiLogo: {
        width: 200,
        height: 100,
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
        backgroundColor: '#f8fafc',
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
        backgroundColor: '#fff',
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
});

export default DashboardScreen;

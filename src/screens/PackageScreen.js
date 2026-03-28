import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { CheckCircle2, Package, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';
import MainHeader from '../components/MainHeader';
import ScreenBackground from '../components/ScreenBackground';

const PackageCard = ({ item, onPurchase, loading }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Text style={styles.packageName}>{item.name}</Text>
            <Text style={styles.packagePrice}>₹{item.price}</Text>
        </View>
        <View style={styles.features}>
            <View style={styles.featureItem}>
                <CheckCircle2 color={COLORS.success} size={18} />
                <Text style={styles.featureText}>Coupon: ₹{item.coupon_amount}</Text>
            </View>
            <View style={styles.featureItem}>
                <CheckCircle2 color={COLORS.success} size={18} />
                <Text style={styles.featureText}>Validity: {item.validity_months} Months</Text>
            </View>
            <View style={styles.featureItem}>
                <CheckCircle2 color={COLORS.success} size={18} />
                <Text style={styles.featureText}>15-Level Commission Access</Text>
            </View>
        </View>
        <TouchableOpacity
            style={[styles.buyButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={() => onPurchase(item.id)}
            disabled={loading}
        >
            <Text style={styles.buyButtonText}>{loading ? 'Processing...' : 'Purchase Now'}</Text>
            {!loading && <ChevronRight color={COLORS.background} size={20} />}
        </TouchableOpacity>
    </View>
);

const PackageScreen = ({ navigation }) => {
    const { logout } = useAuth();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPackages = async () => {
        try {
            const res = await apiClient.get('/packages');
            setPackages(res.data);
        } catch (e) {
            console.error('Failed to fetch packages', e);
            if (e.response && (e.response.status === 401 || e.response.status === 404)) {
                logout();
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPackages();
    };

    const handlePurchase = async (pkg) => {
        try {
            setLoading(true);
            // First check KYC status
            const kycRes = await apiClient.get('/kyc/user/kyc-status');
            const status = kycRes.data.status?.toLowerCase();
            console.log('DEBUG: User KYC/Package Status:', status);

            if (status === 'pending') {
                if (Platform.OS === 'web') {
                    alert('Order Under Review: Your package order is currently under review. Please wait for the admin to approve your request.');
                } else {
                    Alert.alert(
                        'Order Under Review',
                        'Your package order is currently under review. Please wait for the admin to approve your request.',
                        [{ text: 'OK' }]
                    );
                }
                setLoading(false);
                return;
            }

            if (status !== 'approved') {
                if (Platform.OS === 'web') {
                    const goToKyc = window.confirm('KYC Required: Your Identity Verification (KYC) must be approved by the admin before you can purchase a package. Go to KYC Verification?');
                    if (goToKyc) navigation.navigate('KYCVerification');
                } else {
                    Alert.alert(
                        'KYC Required',
                        'Your Identity Verification (KYC) must be approved by the admin before you can purchase a package. Please complete your KYC first.',
                        [
                            { text: 'Go to KYC', onPress: () => navigation.navigate('KYCVerification') },
                            { text: 'Cancel', style: 'cancel' }
                        ]
                    );
                }
                setLoading(false);
                return;
            }

            // Map the selected package
            const kycPackage = {
                name: pkg.name.includes('Package') ? pkg.name : `${pkg.name} Package`,
                amount: String(pkg.price)
            };

            navigation.navigate('KYCVerification', {
                packageName: kycPackage.name,
                packageAmount: kycPackage.amount,
                jumpToStep: 3
            });
        } catch (e) {
            console.error('KYC check failed', e);
            Alert.alert('Error', 'Failed to verify KYC status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.secondary} /></View>;

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <MainHeader title="Packages" navigation={navigation} hideProfile={true} />
                <ScrollView 
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
                >
                    <Text style={styles.title}>Investment Packages</Text>
                    <Text style={styles.subtitle}>Choose a package to start earning income</Text>

                    {packages.map(pkg => (
                        <PackageCard
                            key={pkg.id}
                            item={pkg}
                            onPurchase={() => handlePurchase(pkg)}
                            loading={false}
                        />
                    ))}
                </ScrollView>
            </View>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: SPACING.m },
    center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: SIZES.h2, color: COLORS.text, fontWeight: 'bold', marginTop: SPACING.m },
    subtitle: { fontSize: 15, color: COLORS.secondary, marginBottom: SPACING.xl, marginTop: 4, fontWeight: '700' },
    card: {
        backgroundColor: COLORS.glassBgDark, // Little transparent for items
        padding: SPACING.l,
        borderRadius: SIZES.radius,
        marginBottom: SPACING.l,
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        })
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.l },
    packageName: { fontSize: 22, color: COLORS.secondary, fontWeight: 'bold' },
    packagePrice: { fontSize: 22, color: COLORS.text, fontWeight: 'bold' },
    features: { marginBottom: SPACING.xl },
    featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    featureText: { color: COLORS.text, marginLeft: 10, fontSize: 15 },
    buyButton: {
        backgroundColor: COLORS.secondary,
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    buyButtonText: { color: COLORS.background, fontWeight: 'bold', fontSize: 16, marginRight: 8 }
});

export default PackageScreen;

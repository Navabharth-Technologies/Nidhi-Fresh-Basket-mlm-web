import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, useWindowDimensions, Animated } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { CheckCircle2, ChevronRight, Crown, Shield, Star, Power } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';
import ScreenBackground from '../components/ScreenBackground';
import AnimatedCard from '../components/AnimatedCard';

const PackageCardContent = ({ pkg, getIcon, onSelect }) => {
    const titleScale = useRef(new Animated.Value(1)).current;
    const priceScale = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const animate = () => {
        Animated.parallel([
            Animated.sequence([
                Animated.timing(titleScale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
                Animated.spring(titleScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
            ]),
            Animated.sequence([
                Animated.timing(priceScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
                Animated.spring(priceScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
            ]),
            Animated.sequence([
                Animated.timing(rotateAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: -1, duration: 120, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
            ])
        ]).start();
    };

    const handlePress = () => {
        animate();
        onSelect();
    };

    const wiggle = rotateAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-3deg', '3deg']
    });

    return (
        <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={handlePress} 
            style={{ flexDirection: 'row', alignItems: 'center', width: '100%', padding: 20 }}
        >
            <View style={styles.iconContainer}>
                {getIcon(pkg.name)}
            </View>
            <View style={styles.cardContent}>
                <Animated.Text style={[styles.packageName, { transform: [{ scale: titleScale }, { rotate: wiggle }] }]}>
                    {pkg.name} Package
                </Animated.Text>
                <Animated.Text style={[styles.packagePrice, { transform: [{ scale: priceScale }, { rotate: wiggle }] }]}>
                    ₹{pkg.price}
                </Animated.Text>
                <View style={styles.featureRow}>
                    <CheckCircle2 size={16} color="#217323" />
                    <Text style={styles.featureText}>₹{pkg.coupon_amount} Monthly Coupon</Text>
                </View>
                <View style={styles.featureRow}>
                    <CheckCircle2 size={16} color="#217323" />
                    <Text style={styles.featureText}>{pkg.duration_months} Months Duration</Text>
                </View>
                <View style={styles.featureRow}>
                    <CheckCircle2 size={16} color="#217323" />
                    <Text style={styles.featureText}>Full Dashboard Access</Text>
                </View>
            </View>
            <ChevronRight color="#ccc" size={24} />
        </TouchableOpacity>
    );
};

const PackageSelectionScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    const showAlert = (title, message) => {
        if (Platform.OS === 'web') {
            alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const res = await apiClient.get('/packages');
            setPackages(res.data);
        } catch (err) {
            showAlert('Error', 'Failed to load packages');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (pkg) => {
        navigation.navigate('Payment', { pkg });
    };

    const getIcon = (name) => {
        switch (name) {
            case 'Silver': return <Star color="#C0C0C0" size={32} />;
            case 'Gold': return <Crown color="#FFD700" size={32} />;
            case 'Diamond': return <Shield color="#B9F2FF" size={32} />;
            default: return <Star color="#217323" size={32} />;
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#217323" />
            </View>
        );
    }

    const { logout } = useAuth();

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPackages();
    };

    return (
        <ScreenBackground subtle>
            <ScrollView 
                style={styles.container} 
                contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
            >
                <View style={[styles.header, isDesktop && styles.headerDesktop]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.title}>Choose Your Plan</Text>
                        <TouchableOpacity onPress={logout} style={{ padding: 10 }}>
                            <Power color="#dc3545" size={24} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.subtitle}>Unlock your dashboard and start earning today.</Text>
                </View>
    
                <View style={[styles.packagesGrid, isDesktop && styles.packagesGridDesktop]}>
    
                {packages.map((pkg) => (
                    <AnimatedCard
                        key={pkg.id}
                        style={styles.card}
                        disableHover={true} // We handle it in content for better control
                    >
                        <PackageCardContent pkg={pkg} getIcon={getIcon} onSelect={() => handleSelect(pkg)} />
                    </AnimatedCard>
                ))}
                </View>
    
                <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
                    <Text style={styles.infoText}>* All coupons are generated automatically after payment.</Text>
                    <Text style={styles.infoText}>* Commissions represent earnings from your network.</Text>
                </View>
            </ScrollView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    scrollContentDesktop: {
        alignItems: 'center',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 30, marginTop: 20 },
    headerDesktop: { width: '100%', maxWidth: 1000 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#1a531b', marginBottom: 8 },
    subtitle: { fontSize: 18, color: '#666' },
    card: {
        backgroundColor: COLORS.glassBgDark, // Little transparent for sub-cards
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        }),
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        width: '100%',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    cardContent: { flex: 1 },
    packageName: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    packagePrice: { fontSize: 28, fontWeight: 'bold', color: '#217323', marginBottom: 12 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    featureText: { marginLeft: 8, fontSize: 16, color: '#555' },
    footer: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20, width: '100%' },
    footerDesktop: { maxWidth: 1000 },
    infoText: { fontSize: 14, color: '#999', marginBottom: 4 },
    packagesGrid: { width: '100%' },
    packagesGridDesktop: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 20,
        maxWidth: 1200,
    },
    // We can add a desktop card width here if needed, but let's keep it flexible
});

export default PackageSelectionScreen;

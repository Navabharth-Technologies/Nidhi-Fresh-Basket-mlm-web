import React from 'react';
import { StyleSheet, Text, View, ScrollView, useWindowDimensions, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import ScreenBackground from '../components/ScreenBackground';
import MainHeader from '../components/MainHeader';
import { Leaf, Users, Star, Award, Target, Milestone } from 'lucide-react-native';

const AboutScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const FeatureItem = ({ icon: Icon, title, desc, color }) => (
        <View style={styles.featureItem}>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <Icon color={color} size={28} />
            </View>
            <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDesc}>{desc}</Text>
            </View>
        </View>
    );

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <MainHeader title="About Us" navigation={navigation} showBack={true} hideProfile={true} />
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    <View style={[styles.card, isDesktop && styles.cardDesktop]}>
                        <View style={styles.heroContainer}>
                            <Image
                                source={require('../../assets/nidhi_logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <Text style={styles.tagline}>Harvesting Rewards, Growing Together</Text>
                        </View>

                        <Text style={styles.paragraph}>
                            Nidhi Fresh Basket is more than just an application; it's a revolutionary ecosystem designed to bring freshness to your table and prosperity to your wallet. We specialize in providing the highest quality fruits and vegetables while empowering our community through a structured reward-based networking model.
                        </Text>

                        <View style={[styles.missionVision, !isDesktop && { flexDirection: 'column' }]}>
                            <View style={styles.missionBox}>
                                <Target color={COLORS.secondary} size={24} />
                                <Text style={styles.mvTitle}>Our Mission</Text>
                                <Text style={styles.mvText}>To bridge the gap between farm freshness and everyday households while creating sustainable income opportunities for everyone.</Text>
                            </View>
                            <View style={styles.visionBox}>
                                <Milestone color="#8b5cf6" size={24} />
                                <Text style={styles.mvTitle}>Our Vision</Text>
                                <Text style={styles.mvText}>To be the world's most trusted reward-based network for fresh produce, fostering a global community of healthy and empowered individuals.</Text>
                            </View>
                        </View>

                        <Text style={styles.subHeading}>Why Choose Us?</Text>
                        <View style={styles.featureGrid}>
                            <FeatureItem
                                icon={Leaf}
                                title="Farm Freshness"
                                desc="Directly sourced produce ensuring maximum quality and taste."
                                color="#10b981"
                            />
                            <FeatureItem
                                icon={Users}
                                title="15-Level Network"
                                desc="A powerful, transparent structure designed for community growth."
                                color="#3b82f6"
                            />
                            <FeatureItem
                                icon={Star}
                                title="Exclusive Rewards"
                                desc="Monthly shopping coupons and lucrative referral bonuses."
                                color="#f59e0b"
                            />
                            <FeatureItem
                                icon={Award}
                                title="Secure & Trusted"
                                desc="Advanced security protocols and a transparent verification system."
                                color="#8b5cf6"
                            />
                        </View>

                        <View style={styles.statsContainer}>
                            <View style={styles.statBox}>
                                <Text style={styles.statNumber}>10k+</Text>
                                <Text style={styles.statLabel}>Happy Users</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statNumber}>15+</Text>
                                <Text style={styles.statLabel}>Reward Levels</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statNumber}>100%</Text>
                                <Text style={styles.statLabel}>Quality Check</Text>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.copyright}>
                                © 2026 Nidhi Fresh Basket. All Rights Reserved.
                            </Text>
                            <TouchableOpacity onPress={() => Linking.openURL('https://www.navabharathtechnologies.com/')}>
                                <Text style={styles.poweredBy}>Powered by Navabharath Technologies</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { padding: 15, paddingBottom: 40, alignItems: 'center' },
    card: {
        backgroundColor: COLORS.glassBg,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 800,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(16px)' }
        })
    },
    cardDesktop: { padding: 48 },
    heroContainer: {
        alignItems: 'center',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    logo: { width: 180, height: 120 },
    tagline: { fontSize: 20, color: 'black', fontWeight: '600', fontStyle: 'italic' },
    paragraph: {
        fontSize: 16,
        color: '#4b5563',
        lineHeight: 26,
        textAlign: 'justify',
        marginBottom: 30,
    },
    missionVision: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 35,
        gap: 15,
        width: '100%',
    },
    missionBox: {
        flex: 1,
        minWidth: 250,
        backgroundColor: COLORS.glassBgDark, // Little transparent
        padding: 20,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.secondary,
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
    },
    visionBox: {
        flex: 1,
        minWidth: 250,
        backgroundColor: COLORS.glassBgDark, // Little transparent
        padding: 20,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#8b5cf6',
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
    },
    mvTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginTop: 10, marginBottom: 8 },
    mvText: { fontSize: 14, color: '#4b5563', lineHeight: 22 },
    subHeading: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
    featureGrid: { marginBottom: 35 },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.02)',
    },
    iconBox: { width: 60, height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    featureInfo: { flex: 1 },
    featureTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
    featureDesc: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Slightly more transparent
        paddingVertical: 25,
        borderRadius: 20,
        marginBottom: 30,
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
    },
    statBox: { alignItems: 'center' },
    statNumber: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
    statLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginTop: 4 },
    footer: {
        marginTop: 10,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
    },
    copyright: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 4,
    },
    poweredBy: {
        fontSize: 12,
        color: COLORS.secondary,
        textAlign: 'center',
        fontWeight: '600',
        textDecorationLine: 'underline',
    }
});

export default AboutScreen;

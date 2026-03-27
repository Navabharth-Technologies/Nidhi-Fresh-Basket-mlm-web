import React from 'react';
import { StyleSheet, Text, View, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import ScreenBackground from '../components/ScreenBackground';
import MainHeader from '../components/MainHeader';

const TermsScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <MainHeader title="Terms & Conditions" navigation={navigation} showBack={true} hideProfile={true} />
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    <View style={[styles.card, isDesktop && styles.cardDesktop]}>
                        <Text style={styles.heading}>1. Acceptance of Terms</Text>
                        <Text style={styles.paragraph}>
                            By accessing and using the Nidhi Fresh Basket application, you agree to be bound by these Terms and Conditions and our business model guidelines. If you do not agree, please refrain from using the platform.
                        </Text>

                        <Text style={styles.heading}>2. Membership & Packages</Text>
                        <Text style={styles.paragraph}>
                            Membership is activated upon the purchase of a valid package (Silver, Gold, or Diamond). Each package provides a specific Coupon Wallet balance for use within our fruit and vegetable network.
                        </Text>

                        <Text style={styles.heading}>3. Earnings & Commissions</Text>
                        <Text style={styles.paragraph}>
                            Commissions are distributed up to 15 levels as per the defined structure. Direct Referral Income is fixed at 7% for your immediate invites. All earnings are subject to mandatory KYC verification.
                        </Text>

                        <Text style={styles.heading}>4. User Responsibilities</Text>
                        <Text style={styles.paragraph}>
                            Users are responsible for maintaining the confidentiality of their account credentials. Any fraudulent activity, including creating multiple accounts to manipulate the referral system, will lead to account suspension.
                        </Text>

                        <Text style={styles.heading}>5. Modifications</Text>
                        <Text style={styles.paragraph}>
                            Nidhi Fresh Basket reserves the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the updated terms.
                        </Text>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Last updated: March 2026</Text>
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
        backgroundColor: COLORS.glassBg, // Full transparent for long text
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 800,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        })
    },
    cardDesktop: { padding: 40 },
    heading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 10,
        marginTop: 15,
    },
    paragraph: {
        fontSize: 15,
        color: '#4b5563',
        lineHeight: 24,
        textAlign: 'justify',
    },
    footer: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    }
});

export default TermsScreen;

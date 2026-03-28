import React from 'react';
import { StyleSheet, Text, View, ScrollView, useWindowDimensions, Platform, RefreshControl } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import ScreenBackground from '../components/ScreenBackground';
import MainHeader from '../components/MainHeader';

const PrivacyScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 800);
    };

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <MainHeader title="Privacy Policy" navigation={navigation} showBack={true} hideProfile={true} />
                <ScrollView 
                    contentContainerStyle={styles.contentContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
                >
                    <View style={[styles.card, isDesktop && styles.cardDesktop]}>
                        <Text style={styles.heading}>1. Data Collection</Text>
                        <Text style={styles.paragraph}>
                            Nidhi Fresh Basket collects personal information like name, email, phone, and KYC documents (Aadhaar/PAN) to facilitate account creation, package purchases, and secure reward distribution.
                        </Text>

                        <Text style={styles.heading}>2. Use of Information</Text>
                        <Text style={styles.paragraph}>
                            Your data is used to:
                            {"\n"}• Verifying your identity for secure network participation.
                            {"\n"}• Processing wallet transactions and commission payouts.
                            {"\n"}• Sending important notifications about your rewards and team progress.
                            {"\n"}• Improving our services and platform experience.
                        </Text>

                        <Text style={styles.heading}>3. Data Security</Text>
                        <Text style={styles.paragraph}>
                            We implement standard security measures to protect your information. Your passwords and sensitive documents are stored using encryption. However, no internet transmission is 100% secure.
                        </Text>

                        <Text style={styles.heading}>4. Information Sharing</Text>
                        <Text style={styles.paragraph}>
                            We do not sell your personal data. We only share information with partners involved in our operations, like payment gateways and verification systems, or as required by legal authorities.
                        </Text>

                        <Text style={styles.heading}>5. User Rights</Text>
                        <Text style={styles.paragraph}>
                            You have the right to access and update your profile information within the app. You can contact support for any questions regarding your data and how it is processed.
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

export default PrivacyScreen;

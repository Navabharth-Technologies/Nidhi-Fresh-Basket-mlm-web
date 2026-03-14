import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, useWindowDimensions } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

const InfoScreen = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { title } = route.params || { title: 'Information' };

    const renderPrivacyPolicy = () => (
        <>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. Introduction</Text>
                <Text style={styles.text}>
                    Nidhi Fresh Basket ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our reward-based MLM application.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Information We Collect</Text>
                <Text style={styles.text}>
                    We collect personal information that you provide to us, including your name, contact details, KYC documents (Aadhaar/PAN), and financial information for wallet transactions and commission payouts.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
                <Text style={styles.text}>
                    Your information is used to:
                    {"\n"}• Manage your account and process package purchases.
                    {"\n"}• Calculate and distribute multi-level commissions (up to 15 levels).
                    {"\n"}• Verify identity through our KYC system.
                    {"\n"}• Send notifications regarding rewards and referral updates.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. Data Security</Text>
                <Text style={styles.text}>
                    We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </Text>
            </View>
        </>
    );

    const renderTermsOfUse = () => (
        <>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                <Text style={styles.text}>
                    By accessing Nidhi Fresh Basket, you agree to be bound by these Terms of Use and our business model guidelines.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Membership & Packages</Text>
                <Text style={styles.text}>
                    Membership is activated upon the purchase of a Silver, Gold, or Diamond package. Each package includes a specified Coupon Wallet balance intended for use within our fruit and vegetable network.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Earnings & Commissions</Text>
                <Text style={styles.text}>
                    • Direct Referral Income: 7% on direct invites.
                    {"\n"}• Level Income: Distributed up to 15 levels as per the defined structure.
                    {"\n"}• All earnings are subject to successful KYC verification and compliance with community standards.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. Restrictions</Text>
                <Text style={styles.text}>
                    Users are prohibited from creating multiple accounts to manipulate the referral system. Any fraudulent activity will result in immediate account suspension and forfeiture of wallet balances.
                </Text>
            </View>
        </>
    );

    const renderOverview = () => (
        <>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Application Overview :</Text>
                <Text style={styles.text}>
                    Nidhi Fresh Basket is a reward-based application offering users monthly shopping coupons, discount benefits, and referral income opportunities. It operates on a structured 15-level model, allowing users to invite others and earn benefits from various levels within the network.
                </Text>
            </View>

            <View style={styles.noteBox}>
                <Text style={styles.noteText}>
                    NOTE: ALL THE PACKAGES AND EARNINGS ARE ON THE FRUITS AND VEGETABLES ONLY
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available Packages :</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCell, styles.headerText]}>Package</Text>
                        <Text style={[styles.tableCell, styles.headerText]}>Amount</Text>
                        <Text style={[styles.tableCell, styles.headerText]}>Coupon Wallet</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Silver</Text>
                        <Text style={styles.tableCell}>Rs. 2500</Text>
                        <Text style={styles.tableCell}>Rs. 2750</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Gold</Text>
                        <Text style={styles.tableCell}>Rs. 5000</Text>
                        <Text style={styles.tableCell}>Rs. 5500</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Diamond</Text>
                        <Text style={styles.tableCell}>Rs. 10000</Text>
                        <Text style={styles.tableCell}>Rs. 11000</Text>
                    </View>
                </View>
                <Text style={styles.smallNote}>
                    Note: Coupon Wallet will be automatically added to the Wallet as soon as the account is activated and it will available for use.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Direct Referral Income :</Text>
                <Text style={styles.text}>
                    Users who refer a new member to the application receive a direct income of <Text style={{fontWeight: 'bold', color: '#8b1e3f'}}>"7%"</Text> from the purchased package.
                </Text>
            </View>
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#1a531b" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>

            <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/nidhi_logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.brandName}>NIDHI FRESH BASKET</Text>
                </View>

                {title === 'Privacy Policy' ? renderPrivacyPolicy() : 
                 title === 'Terms of Use' ? renderTermsOfUse() : 
                 renderOverview()}
                


                {title === 'Application Overview' && (
                    <>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Level Earnings Structure for First Purchase :</Text>
                            <View style={styles.table}>
                                <View style={[styles.tableRow, styles.tableHeader]}>
                                    <Text style={[styles.tableCell, styles.headerText]}>Level</Text>
                                    <Text style={[styles.tableCell, styles.headerText]}>Earnings</Text>
                                </View>
                                {[
                                    ['Level 1', '4%'],
                                    ['Level 2', '3%'],
                                    ['Level (3&4)', '2%'],
                                    ['Level (5 to 7)', '1%'],
                                    ['Level (8 to 11)', '0.75%'],
                                    ['Level (12 to 15)', '0.75%'],
                                ].map((item, index) => (
                                    <View key={index} style={styles.tableRow}>
                                        <Text style={styles.tableCell}>{item[0]}</Text>
                                        <Text style={styles.tableCell}>{item[1]}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Level Earnings Structure for Re-Purchase :</Text>
                            <View style={styles.table}>
                                <View style={[styles.tableRow, styles.tableHeader]}>
                                    <Text style={[styles.tableCell, styles.headerText]}>Level</Text>
                                    <Text style={[styles.tableCell, styles.headerText]}>Earnings</Text>
                                </View>
                                {[
                                    ['Level 1', '3%'],
                                    ['Level 2', '1%'],
                                    ['Level (3&4)', '0.75%'],
                                    ['Level (5 to 7)', '0.5%'],
                                    ['Level (8 to 15)', '0.25%'],
                                ].map((item, index) => (
                                    <View key={index} style={styles.tableRow}>
                                        <Text style={styles.tableCell}>{item[0]}</Text>
                                        <Text style={styles.tableCell}>{item[1]}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 Nidhi Fresh Basket International. All Rights Reserved.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a531b',
        marginLeft: 15,
    },
    content: {
        padding: 20,
    },
    contentDesktop: {
        maxWidth: 1000,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: '5%',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 120,
        height: 60,
    },
    brandName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#8b1e3f',
        marginTop: 5,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textDecorationLine: 'underline',
    },
    text: {
        fontSize: 14,
        color: '#555',
        lineHeight: 22,
    },
    noteBox: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#8b1e3f',
        marginBottom: 25,
    },
    noteText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#8b1e3f',
        textAlign: 'center',
    },
    table: {
        borderWidth: 1,
        borderColor: '#ccc',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    tableHeader: {
        backgroundColor: '#c5d3a5',
    },
    tableCell: {
        flex: 1,
        padding: 10,
        borderRightWidth: 1,
        borderRightColor: '#ccc',
        textAlign: 'center',
        fontSize: 13,
        color: '#333',
    },
    headerText: {
        fontWeight: 'bold',
    },
    smallNote: {
        fontSize: 12,
        color: '#666',
        marginTop: 8,
        fontStyle: 'italic',
    },
    footer: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
    },
});

export default InfoScreen;

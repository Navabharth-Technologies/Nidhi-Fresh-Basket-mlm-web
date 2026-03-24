import React from 'react';
import { StyleSheet, Text, View, ScrollView, useWindowDimensions, TouchableOpacity, Linking, Platform } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import ScreenBackground from '../components/ScreenBackground';
import MainHeader from '../components/MainHeader';
import { Mail, Phone, MessageCircle, Clock, MapPin } from 'lucide-react-native';

const SupportScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const handleEmail = () => Linking.openURL('mailto:contact@nidhifreshbasket.com');
    const handlePhone = () => Linking.openURL('tel:+919865445868');
    const handleWhatsApp = () => Linking.openURL('https://wa.me/919865445868');

    const ContactItem = ({ icon: Icon, title, value, onPress, color }) => (
        <TouchableOpacity
            style={styles.contactItem}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress}
        >
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <Icon color={color} size={24} />
            </View>
            <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{title}</Text>
                <Text style={styles.contactValue}>{value}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <MainHeader title="Help & Support" navigation={navigation} showBack={true} hideProfile={true} />
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    <View style={[styles.card, isDesktop && styles.cardDesktop]}>
                        <Text style={styles.heading}>Get in Touch</Text>
                        <Text style={styles.paragraph}>
                            Have questions or need assistance? Our dedicated support team is here to help you with anything related to your account, packages, or commissions.
                        </Text>

                        <View style={styles.contactList}>
                            <ContactItem
                                icon={Mail}
                                title="Email Us"
                                value="contact@nidhifreshbasket.com"
                                onPress={handleEmail}
                                color="#ef4444"
                            />
                            <ContactItem
                                icon={Phone}
                                title="Call Support"
                                value="+91 98654 45868"
                                onPress={handlePhone}
                                color="#3b82f6"
                            />
                            <ContactItem
                                icon={MessageCircle}
                                title="WhatsApp Support"
                                value="Chat with us"
                                onPress={handleWhatsApp}
                                color="#10b981"
                            />
                            <ContactItem
                                icon={Clock}
                                title="Working Hours"
                                value="Daily: 6:00 AM - 10:00 PM"
                                color="#f59e0b"
                            />
                        </View>

                        <Text style={styles.heading}>Office Address</Text>
                        <View style={styles.addressBox}>
                            <MapPin color={COLORS.secondary} size={20} />
                            <Text style={styles.addressText}>
                                Nidhi Fresh basket,{"\n"}
                                297, D.E.F Block, Nimishamba Layout,{"\n"}
                                Kuvempu Nagar, Mysuru - 570023
                            </Text>
                        </View>

                        <View style={styles.faqSection}>
                            <Text style={styles.heading}>Common Queries</Text>
                            <Text style={styles.faqQ}>• When will my package be activated?</Text>
                            <Text style={styles.faqA}>Activation usually happens within 2-4 hours after payment verification.</Text>

                            <Text style={styles.faqQ}>• How do I withdraw my commissions?</Text>
                            <Text style={styles.faqA}>Go to Wallet {'>'} Withdraw. Ensure your KYC and bank details are approved.</Text>
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 800,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    cardDesktop: { padding: 40 },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 15,
        marginTop: 10,
    },
    paragraph: {
        fontSize: 15,
        color: '#4b5563',
        lineHeight: 24,
        marginBottom: 20,
    },
    contactList: { marginBottom: 20 },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    contactInfo: { flex: 1 },
    contactTitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
    contactValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    addressBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.02)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 25,
    },
    addressText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#4b5563',
        lineHeight: 22,
    },
    faqSection: {
        marginTop: 10,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    faqQ: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginTop: 10 },
    faqA: { fontSize: 14, color: '#4b5563', marginTop: 5, lineHeight: 20 },
});

export default SupportScreen;

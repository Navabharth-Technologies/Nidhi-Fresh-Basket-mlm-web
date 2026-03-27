import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { CreditCard, Smartphone, Banknote, ShieldCheck } from 'lucide-react-native';

import MainHeader from '../components/MainHeader';
import ScreenBackground from '../components/ScreenBackground';

const PaymentScreen = ({ route, navigation }) => {
    const { pkg } = route.params;
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('UPI');

    const showAlert = (title, message, actions) => {
        if (Platform.OS === 'web') {
            alert(`${title}: ${message}`);
            if (actions && actions[0] && actions[0].onPress) actions[0].onPress();
        } else {
            Alert.alert(title, message, actions);
        }
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Create Purchase Order
            const orderRes = await apiClient.post('/packages/purchase', { packageId: pkg.id });
            const { transaction_id } = orderRes.data;

            // 2. Mock Payment Delay
            setTimeout(async () => {
                try {
                    // 3. Verify Payment (Mocking success)
                    await apiClient.post('/packages/verify', {
                        transactionId: transaction_id,
                        status: 'success'
                    });

                    showAlert('Success', 'Payment successful! Your package is now active.', [
                        { text: 'Go to Dashboard', onPress: () => navigation.replace('Main') }
                    ]);
                } catch (err) {
                    showAlert('Error', 'Payment verification failed');
                } finally {
                    setLoading(false);
                }
            }, 2000);

        } catch (err) {
            setLoading(false);
            showAlert('Error', err.response?.data?.msg || 'Could not initiate payment');
        }
    };

    const PaymentOption = ({ id, title, icon: Icon }) => (
        <TouchableOpacity
            style={[styles.option, paymentMethod === id && styles.optionSelected]}
            onPress={() => setPaymentMethod(id)}
        >
            <Icon color={paymentMethod === id ? '#217323' : '#666'} size={24} />
            <Text style={[styles.optionText, paymentMethod === id && styles.optionTextSelected]}>{title}</Text>
            <View style={[styles.radio, paymentMethod === id && styles.radioSelected]}>
                {paymentMethod === id && <View style={styles.radioInner} />}
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <MainHeader title="Payment" navigation={navigation} showBack hideProfile={true} />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Amount Payable</Text>
                        <Text style={styles.amount}>₹{pkg.price}</Text>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <Text style={styles.pkgName}>{pkg.name} Subscription</Text>
                            <Text style={styles.pkgPrice}>₹{pkg.price}</Text>
                        </View>
                    </View>

            <Text style={styles.sectionTitle}>Select Payment Method</Text>

            <PaymentOption id="UPI" title="UPI (Google Pay / PhonePe)" icon={Smartphone} />
            <PaymentOption id="Card" title="Credit / Debit Card" icon={CreditCard} />
            <PaymentOption id="Net" title="Net Banking" icon={Banknote} />

            <View style={styles.securityInfo}>
                <ShieldCheck color="#217323" size={20} />
                <Text style={styles.securityText}>100% Secure & Encrypted Payment</Text>
            </View>

            <TouchableOpacity
                style={[styles.payButton, loading && styles.payButtonDisabled]}
                onPress={handlePayment}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.payButtonText}>Pay Now ₹{pkg.price}</Text>
                )}
            </TouchableOpacity>
            </ScrollView>
        </View>
    </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: { padding: 20 },
    summaryCard: {
        backgroundColor: COLORS.glassBg, // Full transparent for main summary
        borderRadius: 16,
        padding: 24,
        marginBottom: 30,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(16px)' }
        })
    },
    summaryLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
    amount: { fontSize: 32, fontWeight: 'bold', color: '#1a531b', marginBottom: 20 },
    divider: { height: 1, backgroundColor: '#eee', marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    pkgName: { fontSize: 16, fontWeight: '600', color: '#333' },
    pkgPrice: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
    option: {
        backgroundColor: COLORS.glassBgDark, // Little transparent for sub-options
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder
    },
    optionSelected: { borderColor: COLORS.secondary, backgroundColor: 'rgba(240, 249, 241, 0.6)' },
    optionText: { flex: 1, marginLeft: 16, fontSize: 16, color: '#666' },
    optionTextSelected: { color: '#1a531b', fontWeight: '600' },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
    radioSelected: { borderColor: '#217323' },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#217323' },
    securityInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30 },
    securityText: { marginLeft: 8, fontSize: 14, color: '#666' },
    payButton: { backgroundColor: '#217323', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 24 },
    payButtonDisabled: { opacity: 0.7 },
    payButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default PaymentScreen;

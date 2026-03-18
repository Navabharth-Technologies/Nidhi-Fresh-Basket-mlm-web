import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { Wallet, Landmark, User, CreditCard } from 'lucide-react-native';

const WithdrawRequestScreen = ({ route }) => {
    const { balance } = route.params || { balance: 0 };
    const navigation = useNavigation();

    const [form, setForm] = useState({
        name: '',
        amount: '',
        pan_number: '',
        bank_account: '',
        ifsc_code: '',
        upi_id: '',
        transfer_method: 'bank' // Default method
    });
    const [amountError, setAmountError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);

    const handleAmountChange = (t) => {
        // Only allow numbers and one decimal point
        const cleanText = t.replace(/[^0-9.]/g, '');
        // Prevent multiple decimal points
        if ((cleanText.match(/\./g) || []).length > 1) return;
        
        setForm({ ...form, amount: cleanText });
        
        const val = parseFloat(cleanText);
        if (cleanText === '') {
            setAmountError('');
        } else if (isNaN(val)) {
            setAmountError('Invalid amount');
        } else if (val < 500) {
            setAmountError('Minimum withdrawal amount is ₹500');
        } else if (val > balance) {
            setAmountError('Amount exceeds commission balance');
        } else {
            setAmountError('');
        }
    };

    React.useEffect(() => {
        const loadBankDetails = async () => {
            try {
                // 1. Get Profile
                const profileRes = await apiClient.get('/users/profile');
                const profile = profileRes.data;
                
                if (profile.kyc_status?.toLowerCase() !== 'approved') {
                    Alert.alert('KYC Required', 'Your KYC must be approved before you can withdraw funds.', [
                        { text: 'Complete KYC', onPress: () => navigation.navigate('KYCVerification') },
                        { text: 'Go Back', onPress: () => navigation.goBack() }
                    ]);
                    return;
                }

                // 2. Get Payment details from KYC (Bank + UPI)
                try {
                    const paymentRes = await apiClient.get(`/kyc/payment-details/${profile.id}`);
                    if (paymentRes.data) {
                        setForm(prev => ({
                            ...prev,
                            name: profile.full_name || '',
                            pan_number: profile.pan_number || '',
                            bank_account: paymentRes.data.bank_account_number || profile.bank_account_number || '',
                            ifsc_code: paymentRes.data.ifsc_code || profile.ifsc_code || '',
                            upi_id: paymentRes.data.upi_id || '',
                        }));
                    }
                } catch (err) {
                    console.log('Payment details fetch failed:', err);
                    // Fallback to profile data only
                    setForm(prev => ({
                        ...prev,
                        name: profile.full_name || '',
                        pan_number: profile.pan_number || '',
                        bank_account: profile.bank_account_number || '',
                        ifsc_code: profile.ifsc_code || '',
                    }));
                }
            } catch (e) {
                console.log('Error fetching bank details:', e);
            } finally {
                setFetchingData(false);
            }
        };
        loadBankDetails();
    }, []);

    const handleSubmit = async () => {
        // Validation
        const isBank = form.transfer_method === 'bank';
        if (!form.name || !form.amount || !form.pan_number) {
            Alert.alert('Error', 'Please fill basic details');
            return;
        }

        if (isBank && (!form.bank_account || !form.ifsc_code)) {
            Alert.alert('Error', 'Please fill bank details');
            return;
        }
        
        if (isBank) {
            if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc_code)) {
                Alert.alert('Invalid IFSC', 'Please enter a valid 11-character IFSC code.');
                return;
            }
        }

        if (!isBank && !form.upi_id) {
            Alert.alert('Error', 'Please fill UPI ID');
            return;
        }

        const withdrawAmount = parseFloat(form.amount);
        if (isNaN(withdrawAmount) || withdrawAmount < 500) {
            Alert.alert('Error', 'Minimum withdrawal amount is ₹500');
            return;
        }

        if (withdrawAmount > balance) {
            Alert.alert('Error', 'Withdraw amount exceeds your commission balance');
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/withdraw/request', {
                ...form,
                amount: withdrawAmount
            });
            Alert.alert('Success', res.data.msg);
            navigation.goBack();
        } catch (e) {
            const errorMsg = e.response?.data?.msg || e.message;
            Alert.alert('Withdrawal Failed', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Landmark color={COLORS.secondary} size={32} />
                    <Text style={styles.title}>Withdraw Request</Text>
                    {fetchingData && <ActivityIndicator size="small" color={COLORS.secondary} style={{ marginTop: 10 }} />}
                    <View style={styles.balanceTag}>
                        <Text style={styles.balanceLabel}>Available Commission:</Text>
                        <Text style={styles.balanceValue}>₹{balance}</Text>
                    </View>
                </View>

                <View style={styles.methodSelector}>
                    <TouchableOpacity
                        style={[styles.methodBtn, form.transfer_method === 'bank' && styles.methodBtnActive]}
                        onPress={() => setForm({ ...form, transfer_method: 'bank' })}
                    >
                        <Landmark color={form.transfer_method === 'bank' ? '#fff' : COLORS.textSecondary} size={20} />
                        <Text style={[styles.methodBtnText, form.transfer_method === 'bank' && styles.methodBtnTextActive]}>Bank Transfer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.methodBtn, form.transfer_method === 'upi' && styles.methodBtnActive]}
                        onPress={() => setForm({ ...form, transfer_method: 'upi' })}
                    >
                        <CreditCard color={form.transfer_method === 'upi' ? '#fff' : COLORS.textSecondary} size={20} />
                        <Text style={[styles.methodBtnText, form.transfer_method === 'upi' && styles.methodBtnTextActive]}>UPI Transfer</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name (as in Bank)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Your Name"
                            value={form.name}
                            onChangeText={(t) => setForm({ ...form, name: t })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Withdraw Amount</Text>
                        <View style={styles.amountInputContainer}>
                            <Text style={styles.currencyPrefix}>₹</Text>
                            <TextInput
                                style={[styles.input, { paddingLeft: 30 }, amountError ? { borderColor: 'red' } : {}]}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={form.amount}
                                onChangeText={handleAmountChange}
                            />
                        </View>
                        {!!amountError && <Text style={{ color: 'red', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{amountError}</Text>}
                        <Text style={styles.hint}>Note: Commission balance only</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>PAN Number</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: '#f1f5f9' }]}
                            placeholder="Enter PAN"
                            autoCapitalize="characters"
                            value={form.pan_number}
                            editable={false}
                        />
                    </View>

                    {form.transfer_method === 'bank' ? (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Bank Account Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Account Number"
                                    keyboardType="numeric"
                                    value={form.bank_account}
                                    onChangeText={(v) => setForm({ ...form, bank_account: v.replace(/[^0-9]/g, '') })}
                                    maxLength={20}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>IFSC Code</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="IFSC Code"
                                    autoCapitalize="characters"
                                    value={form.ifsc_code}
                                    onChangeText={(v) => setForm({ ...form, ifsc_code: v.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                                    maxLength={11}
                                />
                            </View>
                        </>
                    ) : (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>UPI ID</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="yourname@upi"
                                value={form.upi_id}
                                onChangeText={(v) => setForm({ ...form, upi_id: v.toLowerCase().replace(/\s/g, '') })}
                            />
                        </View>
                    )}

                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={[styles.button, styles.submitButton, (!!amountError || !form.amount || loading) ? { backgroundColor: '#9ca3af' } : {}]}
                            onPress={handleSubmit}
                            disabled={loading || !!amountError || !form.amount}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Request</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SPACING.xl, alignItems: 'center', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.m },
    balanceTag: { marginTop: SPACING.m, alignItems: 'center' },
    balanceLabel: { color: COLORS.textSecondary, fontSize: 13 },
    balanceValue: { color: COLORS.secondary, fontSize: 20, fontWeight: '800', marginTop: 4 },

    form: { padding: SPACING.m },
    inputGroup: { marginBottom: SPACING.m },
    label: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 8 },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        color: COLORS.text,
        fontSize: 15
    },
    amountInputContainer: { position: 'relative', justifyContent: 'center' },
    currencyPrefix: { position: 'absolute', left: 12, fontSize: 16, fontWeight: 'bold', color: COLORS.textSecondary, zIndex: 1 },
    hint: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, fontStyle: 'italic' },

    buttonGroup: { marginTop: SPACING.l },
    button: { padding: SPACING.m, borderRadius: 10, alignItems: 'center', marginBottom: SPACING.m },
    submitButton: { backgroundColor: COLORS.secondary },
    cancelButton: { borderWidth: 1, borderColor: COLORS.border },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    cancelText: { color: COLORS.textSecondary, fontWeight: '600' },

    methodSelector: {
        flexDirection: 'row',
        padding: SPACING.m,
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    methodBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 5,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    methodBtnActive: {
        backgroundColor: COLORS.secondary,
        borderColor: COLORS.secondary
    },
    methodBtnText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary
    },
    methodBtnTextActive: {
        color: '#fff'
    }
});

export default WithdrawRequestScreen;

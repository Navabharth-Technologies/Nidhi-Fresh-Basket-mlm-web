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
    const [loading, setLoading] = useState(false);

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

        if (!isBank && !form.upi_id) {
            Alert.alert('Error', 'Please fill UPI ID');
            return;
        }

        const withdrawAmount = parseFloat(form.amount);
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            Alert.alert('Error', 'Invalid withdrawal amount');
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
                                style={[styles.input, { paddingLeft: 30 }]}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={form.amount}
                                onChangeText={(t) => setForm({ ...form, amount: t })}
                            />
                        </View>
                        <Text style={styles.hint}>Note: Commission balance only</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>PAN Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter PAN"
                            autoCapitalize="characters"
                            value={form.pan_number}
                            onChangeText={(t) => setForm({ ...form, pan_number: t })}
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
                                    onChangeText={(t) => setForm({ ...form, bank_account: t })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>IFSC Code</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="IFSC Code"
                                    autoCapitalize="characters"
                                    value={form.ifsc_code}
                                    onChangeText={(t) => setForm({ ...form, ifsc_code: t })}
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
                                onChangeText={(t) => setForm({ ...form, upi_id: t })}
                            />
                        </View>
                    )}

                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={[styles.button, styles.submitButton]}
                            onPress={handleSubmit}
                            disabled={loading}
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

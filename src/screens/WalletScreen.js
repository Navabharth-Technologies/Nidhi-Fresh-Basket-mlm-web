import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, Dimensions, useWindowDimensions } from 'react-native';
import { COLORS, SPACING } from '../theme/theme';
import apiClient from '../api/client';
import { ArrowUpRight, ArrowDownLeft, Wallet, Gift, ArrowRight, History } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const TransactionItem = ({ item }) => {
    const isWithdraw = !!item.status; // Withdrawal requests have a status field
    const itemType = (item.type || '').toUpperCase();
    const isCredit = itemType === 'CREDIT' || itemType === 'LEVEL' || itemType.includes('DIRECT');
    const isApproved = item.status === 'approved';
    const isRejected = item.status === 'rejected';
    const isPending = item.status === 'pending';

    let title = item.category || (itemType ? itemType : 'Transaction');
    if (itemType === 'DIRECT+LEVEL') title = 'Direct + Level Income';
    else if (itemType === 'LEVEL') title = 'Level Commission';
    else if (itemType === 'CREDIT' && item.description?.includes('Direct')) title = 'Direct Referral';

    let color = isCredit ? COLORS.success : COLORS.error;
    let iconColor = isCredit ? COLORS.success : COLORS.error;
    let iconBg = isCredit ? COLORS.success + '20' : COLORS.error + '20';
    let prefix = isCredit ? '+' : '-';

    if (isWithdraw) {
        title = 'Withdrawal Request';
        if (isPending) {
            color = '#FFA500';
            iconColor = '#FFA500';
            iconBg = '#FFA50020';
        } else if (isRejected) {
            color = COLORS.error;
            iconColor = COLORS.error;
            iconBg = COLORS.error + '20';
        } else if (item.status === 'processing') {
            color = '#3b82f6';
            iconColor = '#3b82f6';
            iconBg = '#3b82f620';
        } else {
            color = COLORS.success;
            iconColor = COLORS.success;
            iconBg = COLORS.success + '20';
        }
    }

    return (
        <View style={styles.txItem}>
            <View style={[styles.txIcon, { backgroundColor: iconBg }]}>
                {isCredit ? <ArrowDownLeft color={iconColor} size={16} /> : <ArrowUpRight color={iconColor} size={16} />}
            </View>
            <View style={styles.txInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.txDesc} numberOfLines={1}>{title}</Text>
                    {isWithdraw && (
                        <View style={[styles.miniBadge,
                        isApproved ? styles.miniApproved :
                            isRejected ? styles.miniRejected : 
                            item.status === 'processing' ? styles.miniProcessing :
                            styles.miniPending
                        ]}>
                            <Text style={styles.miniBadgeText}>{item.status.toUpperCase()}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.txDate} numberOfLines={1}>
                    {new Date(item.created_at).toLocaleDateString()} • {item.description || (isWithdraw ? `Request for ₹${item.amount}` : '')}
                </Text>
                {isRejected && item.rejection_reason && (
                    <Text style={styles.rejectionText} numberOfLines={2}>
                        Reason: {item.rejection_reason}
                    </Text>
                )}
            </View>
            <Text style={[styles.txAmount, { color: color }]}>
                {prefix}₹{item.amount || '0.00'}
            </Text>
        </View>
    );
};

const WalletScreen = () => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { logout } = useAuth();
    const navigation = useNavigation();
    const [balances, setBalances] = useState({
        coupon_balance: '0.00',
        commission_balance: '0.00',
        total_balance: '0.00'
    });

    const [activeTab, setActiveTab] = useState('commission'); // Default to commission to show EARNINGS & WITHDRAWALS first
    const [couponTx, setCouponTx] = useState([]);
    const [commissionTx, setCommissionTx] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [balRes, commTxRes, coupTxRes, withdrawRes] = await Promise.all([
                apiClient.get('/wallet/balance'),
                apiClient.get('/wallet/commission-transactions'),
                apiClient.get('/wallet/coupon-transactions'),
                apiClient.get('/withdraw/history')
            ]);

            setBalances({
                coupon_balance: balRes.data.coupon_balance || '0.00',
                commission_balance: balRes.data.commission_balance || '0.00',
                total_balance: balRes.data.total_balance || '0.00'
            });

            // Merge normal commission transactions with withdrawal requests for a unified view
            // Filter out 'debit' withdrawals from commTxRes if they are already in withdrawRes to avoid duplicates?
            // Actually, withdrawals in commTxRes have description 'Withdrawal approved by admin'. 
            // Let's just show withdrawal requests separately or merge them cleanly.
            // If we merge, we should sort by date.

            const mergedCommission = [
                ...(commTxRes.data || []).filter(tx => tx.type !== 'debit'),
                ...(withdrawRes.data || [])
            ].sort((a, b) => {
                const dateA = new Date(a.created_at || a.date);
                const dateB = new Date(b.created_at || b.date);
                return dateB - dateA;
            });

            setCommissionTx(mergedCommission);
            setCouponTx(coupTxRes.data || []);
        } catch (e) {
            console.error('Failed to fetch wallet data', e);
            Alert.alert('Wallet Error', e.response ? `API Error: ${e.response.status} - ${JSON.stringify(e.response.data)}` : e.message);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleWithdraw = () => {
        navigation.navigate('WithdrawRequest', { balance: balances.commission_balance });
    };

    const handleViewHistory = () => {
        navigation.navigate('WithdrawHistory');
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, isDesktop && styles.headerDesktop]}>
                <View style={{ width: 40 }} />
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.headerLabel}>Total Balance</Text>
                    <Text style={styles.balanceText}>₹{balances.total_balance}</Text>
                </View>
                <TouchableOpacity onPress={handleViewHistory} style={styles.historyBtn}>
                    <History color={COLORS.secondary} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
            >
                <View style={[styles.cardsRow, isDesktop && styles.cardsRowDesktop]}>
                    {/* Coupon Wallet Card */}
                    <TouchableOpacity
                        style={[styles.walletCard, isDesktop && styles.walletCardDesktop, activeTab === 'coupon' && styles.walletCardActive]}
                        onPress={() => setActiveTab('coupon')}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.iconBox}>
                                <Gift color={activeTab === 'coupon' ? COLORS.secondary : COLORS.textSecondary} size={20} />
                            </View>
                        </View>
                        <Text style={styles.cardTitle}>Coupons</Text>
                        <Text style={[styles.cardBalance, activeTab === 'coupon' && styles.textActive]}>₹{balances.coupon_balance}</Text>
                        <Text style={styles.cardInfo}>Non-withdrawable</Text>
                    </TouchableOpacity>
 
                    {/* Commission Wallet Card */}
                    <TouchableOpacity
                        style={[styles.walletCard, isDesktop && styles.walletCardDesktop, activeTab === 'commission' && styles.walletCardActive]}
                        onPress={() => setActiveTab('commission')}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.iconBox}>
                                <Wallet color={activeTab === 'commission' ? COLORS.secondary : COLORS.textSecondary} size={20} />
                            </View>
                        </View>
                        <Text style={styles.cardTitle}>Commission</Text>
                        <Text style={[styles.cardBalance, activeTab === 'commission' && styles.textActive]}>₹{balances.commission_balance}</Text>
                        <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
                            <Text style={styles.withdrawBtnText}>Withdraw <ArrowRight size={12} color="#fff" style={{ marginLeft: 2 }} /></Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>
 
                <View style={[styles.transactionsContainer, isDesktop && styles.transactionsContainerDesktop]}>
                    <Text style={styles.sectionTitle}>
                        {activeTab === 'coupon' ? 'Coupon Transactions' : 'Commission Transactions'}
                    </Text>

                    {activeTab === 'coupon' ? (
                        couponTx.length > 0 ? (
                            couponTx.map((item) => <TransactionItem key={`coup-${item.id}`} item={item} />)
                        ) : (
                            <Text style={styles.emptyText}>No coupon transactions found</Text>
                        )
                    ) : (
                        commissionTx.length > 0 ? (
                            commissionTx.map((item) => (
                                <TransactionItem
                                    key={item.status ? `withdraw-${item.id}` : `comm-${item.id}`}
                                    item={item}
                                />
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No commission transactions found</Text>
                        )
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        backgroundColor: COLORS.surface,
        padding: SPACING.l,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5
    },
    headerDesktop: {
        paddingHorizontal: '10%',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    historyBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: COLORS.background,
    },
    headerLabel: { color: COLORS.textSecondary, marginBottom: 4, fontSize: 15, textAlign: 'center' },
    balanceText: { fontSize: 32, color: COLORS.secondary, fontWeight: 'bold' },

    cardsRow: {
        flexDirection: 'row',
        padding: SPACING.m,
        justifyContent: 'space-between',
        marginTop: SPACING.s
    },
    cardsRowDesktop: {
        paddingHorizontal: '10%',
        gap: 20,
    },
    walletCard: {
        width: (width - SPACING.m * 3) / 2,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    walletCardDesktop: {
        width: '45%',
    },
    walletCardActive: {
        borderColor: COLORS.secondary,
        backgroundColor: COLORS.secondary + '08', // very light tint
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.s
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '500',
        marginBottom: 4
    },
    cardBalance: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8
    },
    textActive: {
        color: COLORS.secondary
    },
    cardInfo: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        marginTop: 6
    },
    withdrawBtn: {
        backgroundColor: COLORS.secondary,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center'
    },
    withdrawBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600'
    },

    transactionsContainer: { padding: SPACING.m, paddingBottom: 40 },
    transactionsContainerDesktop: {
        paddingHorizontal: '10%',
    },
    sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: SPACING.m },
    txItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: 12,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    txIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    txInfo: { flex: 1, marginLeft: SPACING.m, marginRight: SPACING.s },
    txDesc: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
    txDate: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
    txAmount: { fontSize: 17, fontWeight: 'bold' },
    emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },

    miniBadge: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    miniApproved: { backgroundColor: COLORS.success + '20' },
    miniRejected: { backgroundColor: COLORS.error + '20' },
    miniPending: { backgroundColor: '#FFA50020' },
    miniProcessing: { backgroundColor: '#3b82f620' },
    miniBadgeText: { fontSize: 11, fontWeight: 'bold', color: COLORS.textSecondary },
    rejectionText: { fontSize: 12, color: COLORS.error, marginTop: 2, fontStyle: 'italic' }
});

export default WalletScreen;

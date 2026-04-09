import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, useWindowDimensions } from 'react-native';
import { COLORS, SPACING } from '../theme/theme';
import apiClient from '../api/client';
import { ArrowUpRight, ArrowDownLeft, Wallet, Gift, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';
import ScreenBackground from '../components/ScreenBackground';
import MainHeader from '../components/MainHeader';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Platform } from 'react-native';
import AnimatedCard from '../components/AnimatedCard';

// Framer Motion for Web animations
let motion = { button: TouchableOpacity, div: View };
if (Platform.OS === 'web') {
    try {
        const { motion: fm } = require('framer-motion');
        motion = fm;
    } catch (e) {
        console.warn('Framer Motion not available', e);
    }
}


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
        <AnimatedCard style={styles.txItem}>
            <View style={styles.txInfo}>
                <View style={styles.txMainRow}>
                    <View style={[styles.txIcon, { backgroundColor: iconBg }]}>
                        {isCredit ? <ArrowDownLeft color={iconColor} size={16} /> : <ArrowUpRight color={iconColor} size={16} />}
                    </View>
                    <View style={styles.txTitleInfo}>
                        <Text style={styles.txDesc}>{title}</Text>
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
                </View>

                <View style={styles.txSecondaryInfo}>
                    <Text style={styles.txDate}>
                        {new Date(item.created_at || item.date).toLocaleDateString()}
                    </Text>

                    {/* Explicit UID and From User Link if available */}
                    {item.from_user_id_code && (
                        <Text style={styles.txFromUser}>
                            From: {item.from_user_name || 'Member'} ({item.from_user_id_code})
                        </Text>
                    )}

                    <Text style={styles.txFullDesc}>
                        {item.description || (isWithdraw ? `Request for ₹${item.amount}` : '')}
                    </Text>

                    {isRejected && item.rejection_reason && (
                        <Text style={styles.rejectionText}>
                            Reason: {item.rejection_reason}
                        </Text>
                    )}
                    <Text style={[styles.txAmount, { color: color, marginTop: 4 }]}>
                        {prefix}₹{item.amount || '0.00'}
                    </Text>
                </View>
            </View>
        </AnimatedCard>
    );
};



const WalletScreen = () => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { logout, profile } = useAuth();
    const navigation = useNavigation();
    const [balances, setBalances] = useState({
        coupon_balance: '0.00',
        commission_balance: '0.00',
        total_balance: '0.00'
    });

    const isWeb = Platform.OS === 'web';
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


    return (
        <ScreenBackground>
            <View style={styles.container}>
                <MainHeader title="Wallet" navigation={navigation} hideProfile={true} />
                <View style={styles.balanceHeader}>
                    <View>
                        <Text style={styles.headerLabel}>Total Balance</Text>
                        <Text style={styles.balanceText}>₹{balances.total_balance}</Text>
                    </View>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
                >
                    <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>My Wallets</Text>
                        </View>
                        <View style={[styles.sectionBody, isDesktop && styles.sectionBodyDesktop]}>
                            <View style={styles.cardsRow}>
                                {/* Coupon Wallet Card */}
                                <AnimatedCard
                                    style={StyleSheet.flatten([
                                        styles.walletCard,
                                        isDesktop && styles.walletCardDesktop,
                                        {
                                            backgroundColor: activeTab === 'coupon' ? 'rgba(255, 237, 213, 0.6)' : 'rgba(255, 237, 213, 0.3)',
                                            borderColor: activeTab === 'coupon' ? 'rgba(154, 52, 18, 0.5)' : 'rgba(154, 52, 18, 0.15)',
                                            borderStyle: 'solid',
                                        }
                                    ])}
                                    onPress={() => setActiveTab('coupon')}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.5)' }]}>
                                            <Gift color="#9a3412" size={20} />
                                        </View>
                                    </View>
                                    <Text style={styles.cardTitle}>Coupons</Text>
                                    <Text style={[styles.cardBalance, { color: '#9a3412' }]}>₹{balances.coupon_balance}</Text>
                                    <Text style={styles.cardInfo}>Non-withdrawable</Text>
                                </AnimatedCard>

                                {/* Commission Wallet Card */}
                                <AnimatedCard
                                    style={StyleSheet.flatten([
                                        styles.walletCard,
                                        isDesktop && styles.walletCardDesktop,
                                        {
                                            backgroundColor: activeTab === 'commission' ? 'rgba(220, 252, 231, 0.6)' : 'rgba(220, 252, 231, 0.3)',
                                            borderColor: activeTab === 'commission' ? 'rgba(22, 101, 52, 0.5)' : 'rgba(22, 101, 52, 0.15)',
                                            borderStyle: 'solid',
                                        }
                                    ])}
                                    onPress={() => setActiveTab('commission')}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.5)' }]}>
                                            <Wallet color="#166534" size={20} />
                                        </View>
                                    </View>
                                    <Text style={styles.cardTitle}>Commission</Text>
                                    <Text style={[styles.cardBalance, { color: '#166534' }]}>₹{balances.commission_balance}</Text>
                                    <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
                                        <Text style={styles.withdrawBtnText}>Withdraw <ArrowRight size={12} color="#fff" style={{ marginLeft: 2 }} /></Text>
                                    </TouchableOpacity>
                                </AnimatedCard>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                {activeTab === 'coupon' ? 'Coupon Transactions' : 'Commission Transactions'}
                            </Text>
                        </View>
                        <View style={[styles.sectionBody, isDesktop && styles.sectionBodyDesktop]}>
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
                    </View>
                </ScrollView>
            </View>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    balanceHeader: {
        backgroundColor: COLORS.glassBg,
        padding: SPACING.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: SPACING.m,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        })
    },
    headerDesktop: {
        paddingHorizontal: '2%',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    historyBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: COLORS.background,
    },
    headerLabel: { color: COLORS.black, marginBottom: 4, fontSize: 16, textAlign: 'left' },
    balanceText: { fontSize: 32, color: COLORS.secondary, fontWeight: 'bold' },
    uidBadge: {
        backgroundColor: COLORS.secondary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.secondary + '30',
    },
    uidLabel: { fontSize: 10, color: COLORS.secondary, fontWeight: 'bold', textTransform: 'uppercase' },
    uidText: { fontSize: 13, color: COLORS.secondary, fontWeight: 'bold', marginTop: 1 },

    // Section layout (matches Dashboard style)
    section: {
        width: Platform.OS === 'web' ? '98%' : '100%',
        alignSelf: 'center',
        marginBottom: 15,
        borderRadius: 8,
        overflow: 'hidden',
    },
    sectionDesktop: {
        width: '100%',
    },
    sectionHeader: {
        backgroundColor: COLORS.glassBgDark,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    sectionBody: {
        backgroundColor: COLORS.glassBg,
        padding: 15,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        })
    },
    sectionBodyDesktop: {
        alignItems: 'stretch',
    },
    cardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        width: '100%',
    },
    walletCard: {
        flex: 1,
        backgroundColor: COLORS.glassBgDark,
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        }),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    walletCardDesktop: {
        flex: 1,
        padding: 20,
    },
    walletCardActive: {
        borderColor: COLORS.secondary,
        backgroundColor: COLORS.secondary + '08',
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
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
        marginBottom: 4
    },
    cardBalance: {
        fontSize: 24,
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
        marginTop: 4
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
        fontSize: 13,
        fontWeight: '600'
    },

    // Transaction rows (matches Dashboard card style)
    txItem: {
        backgroundColor: COLORS.glassBgDark,
        padding: SPACING.m,
        borderRadius: 12,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(8px)' }
        }),
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    txIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    txInfo: { flex: 1 },
    txMainRow: { flexDirection: 'row', alignItems: 'center' },
    txTitleInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    txSecondaryInfo: { marginLeft: 44 }, // 32 (icon) + 12 (margin)
    txDesc: { color: '#1e293b', fontSize: 16, fontWeight: 'bold' },
    txDate: { color: '#64748b', fontSize: 12, marginTop: 4, fontWeight: '500' },
    txFromUser: { fontSize: 13, color: COLORS.secondary, marginTop: 4, fontWeight: '600' },
    txFullDesc: { color: '#64748b', fontSize: 13, marginTop: 4, lineHeight: 18 },
    txAmount: { fontSize: 16, fontWeight: 'bold' },
    emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 20 },

    miniBadge: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    miniApproved: { backgroundColor: COLORS.success + '20' },
    miniRejected: { backgroundColor: COLORS.error + '20' },
    miniPending: { backgroundColor: '#FFA50020' },
    miniProcessing: { backgroundColor: '#3b82f620' },
    miniBadgeText: { fontSize: 11, fontWeight: 'bold', color: COLORS.textSecondary },
    rejectionText: { fontSize: 12, color: COLORS.error, marginTop: 2, fontStyle: 'italic' }
});

export default WalletScreen;

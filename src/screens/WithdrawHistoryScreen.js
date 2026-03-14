import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl
} from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { History, Clock, CheckCircle, XCircle } from 'lucide-react-native';

const WithdrawHistoryScreen = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        try {
            const res = await apiClient.get('/withdraw/history');
            setHistory(res.data);
        } catch (e) {
            console.error('Fetch history failed:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const renderItem = ({ item }) => {
        const isApproved = item.status === 'approved';
        const isRejected = item.status === 'rejected';

        return (
            <View style={styles.recordCard}>
                <View style={styles.recordHeader}>
                    <Text style={styles.amountText}>₹{item.amount}</Text>
                    <View style={[
                        styles.statusBadge, 
                        isApproved ? styles.badgeApproved : 
                        isRejected ? styles.badgeRejected : 
                        item.status === 'processing' ? styles.badgeProcessing :
                        styles.badgePending
                    ]}>
                        <Text style={[
                            styles.statusText, 
                            isApproved ? styles.textApproved : 
                            isRejected ? styles.textRejected : 
                            item.status === 'processing' ? styles.textProcessing :
                            styles.textPending
                        ]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <View style={styles.recordFooter}>
                    <Clock size={12} color={COLORS.textSecondary} />
                    <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                {isRejected && item.rejection_reason && (
                    <View style={styles.rejectionBox}>
                        <Text style={styles.rejectionLabel}>Reason:</Text>
                        <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator color={COLORS.secondary} size="large" />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <History color={COLORS.secondary} size={32} />
                <Text style={styles.title}>Withdrawal History</Text>
                <Text style={styles.subtitle}>Track your payout requests</Text>
            </View>

            <FlatList
                data={history}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Clock color={COLORS.textSecondary} size={48} opacity={0.3} />
                        <Text style={styles.emptyText}>No withdrawal history found</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SPACING.xl, alignItems: 'center', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.m },
    subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },

    list: { padding: SPACING.m },
    recordCard: {
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: 12,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    amountText: { fontSize: 18, fontWeight: '800', color: COLORS.text },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    badgeApproved: { backgroundColor: COLORS.success + '15', borderColor: COLORS.success + '40' },
    badgeRejected: { backgroundColor: COLORS.error + '15', borderColor: COLORS.error + '40' },
    badgePending: { backgroundColor: '#FFA50015', borderColor: '#FFA50040' },
    badgeProcessing: { backgroundColor: '#3b82f615', borderColor: '#3b82f640' },

    statusText: { fontSize: 10, fontWeight: '700' },
    textApproved: { color: COLORS.success },
    textRejected: { color: COLORS.error },
    textPending: { color: '#FFA500' },
    textProcessing: { color: '#3b82f6' },

    recordFooter: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 6 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    empty: { marginTop: 100, alignItems: 'center', opacity: 0.6 },
    emptyText: { color: COLORS.textSecondary, marginTop: 16, fontSize: 14 },
    
    rejectionBox: {
        marginTop: 12,
        padding: 10,
        backgroundColor: COLORS.error + '10',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.error
    },
    rejectionLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.error,
        marginBottom: 2
    },
    rejectionText: {
        fontSize: 12,
        color: COLORS.text,
        fontStyle: 'italic'
    }
});

export default WithdrawHistoryScreen;

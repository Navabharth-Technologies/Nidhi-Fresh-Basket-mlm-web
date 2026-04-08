import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, ScrollView, RefreshControl,
    Modal, TextInput
} from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { useAuth } from '../store/AuthContext';
import ScreenBackground from '../components/ScreenBackground';
import AnimatedCard from '../components/AnimatedCard';
import { Landmark, User, Check, X, Wallet, Clock } from 'lucide-react-native';
import { Platform } from 'react-native';

const AdminWithdrawRequestsScreen = () => {
    const showAlert = (title, message) => {
        if (Platform.OS === 'web') {
            alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processing, setProcessing] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [pendingAction, setPendingAction] = useState({ id: null, status: null, reason: '' });

    const fetchRequests = async () => {
        try {
            const res = await apiClient.get('/withdraw/admin/requests');
            const sortedData = [...res.data].sort((a, b) => {
                const statusA = (a.status || 'pending').toLowerCase();
                const statusB = (b.status || 'pending').toLowerCase();
                
                const getPriority = (s) => {
                    if (s === 'pending') return 0;
                    if (s === 'processing') return 1;
                    if (s === 'rejected') return 2;
                    if (s === 'approved') return 3;
                    return 4;
                };
                
                return getPriority(statusA) - getPriority(statusB);
            });
            setRequests(sortedData);
        } catch (e) {
            console.error('Fetch requests failed:', e.message);
            showAlert('Error', 'Failed to fetch withdrawal requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const handleUpdateStatus = (withdrawId, status) => {
        setPendingAction({ id: withdrawId, status, reason: '' });
        setModalVisible(true);
    };

    const confirmUpdate = async () => {
        const { id: withdrawId, status, reason } = pendingAction;
        
        if (status === 'rejected' && (!reason || reason.trim().length < 3)) {
            showAlert('Required', 'Please provide a reason for rejection (min 3 chars)');
            return;
        }

        setModalVisible(false);
        setProcessing(withdrawId);
        
        try {
            const res = await apiClient.post('/withdraw/admin/update', { 
                withdrawId, 
                status,
                reason: status === 'rejected' ? reason : undefined
            });
            showAlert('Success', res.data.msg);
            fetchRequests();
        } catch (e) {
            const msg = e.response?.data?.msg || e.message;
            showAlert('Update Failed', msg);
        } finally {
            setProcessing(null);
            setPendingAction({ id: null, status: null, reason: '' });
        }
    };

    const renderRequest = ({ item }) => {
        const isPending = item.status === 'pending';

        return (
            <AnimatedCard style={styles.card} hoverStyle={styles.hoverCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.userName}>{item.user_full_name || item.name || 'No Name'}</Text>
                        <Text style={styles.userId}>User ID: {item.nfb_userid || 'N/A'}</Text>
                    </View>
                    <Text style={styles.amount}>₹{item.amount}</Text>
                </View>

                {/* Wallet Info Display (Step 7) */}
                <View style={styles.walletContainer}>
                    <View style={styles.walletBox}>
                        <Text style={styles.walletLabel}>Commission</Text>
                        <Text style={styles.walletVal}>₹{item.commission_balance}</Text>
                    </View>
                    <View style={styles.walletBox}>
                        <Text style={styles.walletLabel}>Coupons</Text>
                        <Text style={styles.walletVal}>₹{item.coupon_balance}</Text>
                    </View>
                    <View style={[styles.walletBox, { borderRightWidth: 0 }]}>
                        <Text style={styles.walletLabel}>Total</Text>
                        <Text style={[styles.walletVal, { color: COLORS.secondary }]}>₹{parseFloat(item.commission_balance || 0) + parseFloat(item.coupon_balance || 0)}</Text>
                    </View>
                </View>

                <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Method</Text>
                        <Text style={[styles.detailValue, {color: COLORS.secondary, fontWeight: 'bold'}]}>
                            {(item.transfer_method || 'bank').toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>PAN</Text>
                        <Text style={styles.detailValue}>{item.pan_number}</Text>
                    </View>

                    { (item.transfer_method === 'bank' || !item.transfer_method) ? (
                        <>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Bank A/C</Text>
                                <Text style={styles.detailValue}>{item.bank_account}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>IFSC</Text>
                                <Text style={styles.detailValue}>{item.ifsc_code}</Text>
                            </View>
                        </>
                    ) : (
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>UPI ID</Text>
                            <Text style={styles.detailValue}>{item.upi_id}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.statusSection}>
                        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                        <View style={[
                            styles.statusBadge, 
                            item.status === 'approved' ? styles.approved : 
                            item.status === 'rejected' ? styles.rejected : 
                            item.status === 'processing' ? styles.processing :
                            styles.pending
                        ]}>
                            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                        </View>
                    </View>

                    {(isPending || item.status === 'processing') && (
                        <View style={styles.actionButtons}>
                            {item.status === 'pending' && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.processBtn]}
                                    onPress={() => handleUpdateStatus(item.id, 'processing')}
                                    disabled={processing === item.id}
                                >
                                    {processing === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Clock color="#fff" size={18} />}
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.approveBtn]}
                                onPress={() => handleUpdateStatus(item.id, 'approved')}
                                disabled={processing === item.id}
                            >
                                {processing === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Check color="#fff" size={18} />}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.rejectBtn]}
                                onPress={() => handleUpdateStatus(item.id, 'rejected')}
                                disabled={processing === item.id}
                            >
                                <X color="#fff" size={18} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {item.status === 'rejected' && item.rejection_reason && (
                    <View style={styles.rejectionBox}>
                        <Text style={styles.rejectionLabel}>REJECTION REASON:</Text>
                        <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
                    </View>
                )}
            </AnimatedCard>
        );
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator color={COLORS.secondary} size="large" />
        </View>
    );

    return (
        <ScreenBackground admin>
            <View style={styles.container}>
            <FlatList
                style={{ flex: 1 }}
                data={requests}
                keyExtractor={(item) => `admin-withdraw-${item.id}`}
                renderItem={renderRequest}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Landmark color={COLORS.textSecondary} size={48} opacity={0.3} />
                        <Text style={styles.emptyText}>No pending withdrawal requests</Text>
                    </View>
                }
            />

            {/* Confirmation Modal */}
            <Modal
                transparent
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[
                            styles.modalIconBox, 
                            pendingAction.status === 'approved' ? {backgroundColor: COLORS.success + '20'} : 
                            pendingAction.status === 'processing' ? {backgroundColor: '#3b82f620'} :
                            {backgroundColor: COLORS.error + '20'}
                        ]}>
                            {pendingAction.status === 'approved' ? 
                                <Check color={COLORS.success} size={32} /> : 
                                pendingAction.status === 'processing' ?
                                <Clock color="#3b82f6" size={32} /> :
                                <X color={COLORS.error} size={32} />
                            }
                        </View>
                        
                        <Text style={styles.modalTitle}>
                            Confirm {pendingAction.status === 'approved' ? 'Approval' : pendingAction.status === 'processing' ? 'Processing' : 'Rejection'}
                        </Text>
                        
                        <Text style={styles.modalMessage}>
                            Are you sure you want to {pendingAction.status} this withdrawal request? This action cannot be undone.
                        </Text>

                        {pendingAction.status === 'rejected' && (
                            <View style={styles.reasonInputContainer}>
                                <Text style={styles.inputLabel}>Reason for Rejection</Text>
                                <TextInput
                                    style={styles.reasonInput}
                                    placeholder="e.g. Invalid bank details, low balance"
                                    value={pendingAction.reason}
                                    onChangeText={(text) => setPendingAction(prev => ({ ...prev, reason: text }))}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalCancelBtn]} 
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[
                                    styles.modalBtn, 
                                    pendingAction.status === 'approved' ? styles.modalApproveBtn : 
                                    pendingAction.status === 'processing' ? styles.modalProcessBtn :
                                    styles.modalRejectBtn
                                ]} 
                                onPress={confirmUpdate}
                            >
                                <Text style={styles.modalConfirmText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    list: { padding: SPACING.m },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    hoverCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.9)',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    userName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    userId: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
    amount: { fontSize: 22, fontWeight: '800', color: COLORS.secondary },

    walletContainer: {
        flexDirection: 'row',
        backgroundColor: 'transparent',
        borderRadius: 8,
        padding: 8,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#ffffff'
    },
    walletBox: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: COLORS.border },
    walletLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
    walletVal: { fontSize: 14, fontWeight: '700', color: COLORS.text },

    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
    detailItem: { width: '50%', marginBottom: 8 },
    detailLabel: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'uppercase' },
    detailValue: { fontSize: 14, color: COLORS.text, fontWeight: '600', marginTop: 2 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
    statusSection: { flexDirection: 'row', alignItems: 'center' },
    date: { fontSize: 11, color: COLORS.textSecondary, marginRight: 8 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    pending: { backgroundColor: '#FFA50020' },
    approved: { backgroundColor: COLORS.success + '20' },
    rejected: { backgroundColor: COLORS.error + '20' },
    processing: { backgroundColor: '#3b82f620' },
    statusText: { fontSize: 10, fontWeight: 'bold', color: COLORS.textSecondary },

    actionButtons: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: SPACING.m },
    processBtn: { backgroundColor: '#3b82f6' },
    approveBtn: { backgroundColor: COLORS.success },
    rejectBtn: { backgroundColor: COLORS.error },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
    empty: { marginTop: 100, alignItems: 'center', opacity: 0.6 },
    emptyText: { color: COLORS.textSecondary, marginTop: 16, fontSize: 14 },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: SPACING.l,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    modalIconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.s
    },
    modalMessage: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: SPACING.l
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between'
    },
    modalBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCancelBtn: {
        backgroundColor: COLORS.background,
        marginRight: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    modalApproveBtn: {
        backgroundColor: COLORS.success,
        marginLeft: SPACING.s
    },
    modalRejectBtn: {
        backgroundColor: COLORS.error,
        marginLeft: SPACING.s
    },
    modalProcessBtn: {
        backgroundColor: '#3b82f6',
        marginLeft: SPACING.s
    },
    modalCancelText: {
        color: COLORS.text,
        fontWeight: '600'
    },
    modalConfirmText: {
        color: '#fff',
        fontWeight: 'bold'
    },

    // New styles for rejection
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
    },
    reasonInputContainer: {
        width: '100%',
        marginBottom: SPACING.l
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8
    },
    reasonInput: {
        width: '100%',
        minHeight: 80,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        color: COLORS.text,
        textAlignVertical: 'top'
    }
});

export default AdminWithdrawRequestsScreen;

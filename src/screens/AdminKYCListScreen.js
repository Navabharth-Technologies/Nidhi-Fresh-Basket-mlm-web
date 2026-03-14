import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { User, Calendar, CheckCircle, XCircle, Clock, ChevronRight, Package, LogOut, Landmark } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';

const AdminKYCListScreen = ({ navigation }) => {
    const { logout, token: authToken } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRequests = useCallback(async () => {
        try {
            const res = await apiClient.get('/kyc/admin/kyc-requests');
            setRequests(res.data);
        } catch (error) {
            console.error('Error fetching KYC requests', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchRequests();
        }, [fetchRequests])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const getBaseUrl = () => apiClient.defaults.baseURL.replace('/api', '');

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('KYCReview', { kycData: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <User color="#fff" size={20} />
                    </View>
                    <View>
                        <Text style={styles.userName}>{item.full_name || 'No Name'}</Text>
                        <Text style={styles.userId}>UID: {item.user_id} | {item.userid || item.username}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, item.kyc_status?.toLowerCase() === 'approved' ? styles.statusApproved : item.kyc_status?.toLowerCase() === 'rejected' ? styles.statusRejected : styles.statusPending]}>
                    <Text style={[styles.statusText, item.kyc_status?.toLowerCase() === 'approved' ? styles.textApproved : item.kyc_status?.toLowerCase() === 'rejected' ? styles.textRejected : styles.textPending]}>
                        {(item.kyc_status || 'PENDING').toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.packageInfo}>
                <Package size={16} color="#4b5563" />
                <Text style={styles.packageName}>{item.package_name}: <Text style={styles.packagePrice}>₹{item.package_amount}</Text></Text>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.thumbnailContainer}>
                    {item.id && <Image source={{ uri: `${apiClient.defaults.baseURL}/kyc/admin/view-document/payment/${item.id}?token=${authToken}` }} style={styles.thumbnail} />}
                    {item.id && <Image source={{ uri: `${apiClient.defaults.baseURL}/kyc/admin/view-document/aadhar/${item.id}?token=${authToken}` }} style={styles.thumbnail} />}
                    {item.id && <Image source={{ uri: `${apiClient.defaults.baseURL}/kyc/admin/view-document/pan/${item.id}?token=${authToken}` }} style={styles.thumbnail} />}
                </View>
                <View style={styles.footerItem}>
                    <Calendar size={14} color="#666" />
                    <Text style={styles.footerText}>
                        {new Date(item.submitted_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1a531b" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Admin Panel</Text>
                    <Text style={styles.subtitle}>KYC & Withdrawals</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#E0F2FE' }]}
                        onPress={() => navigation.navigate('AdminWithdrawals')}
                    >
                        <Landmark color="#0284C7" size={20} />
                        <Text style={[styles.actionText, { color: '#0284C7' }]}>Withdraws</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <LogOut color="#DC2626" size={20} />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={requests}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <CheckCircle size={60} color="#ccc" />
                        <Text style={styles.emptyText}>No KYC requests found</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    count: { fontSize: 13, color: '#1a531b', fontWeight: 'bold', backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    listContent: { padding: 15 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a531b', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    userName: { fontSize: 16, fontWeight: 'bold', color: '#111' },
    userId: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusPending: { backgroundColor: '#fff9e6' },
    statusApproved: { backgroundColor: '#f0fdf4' },
    statusRejected: { backgroundColor: '#fef2f2' },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    textPending: { color: '#f39c12' },
    textApproved: { color: '#10b981' },
    textRejected: { color: '#ef4444' },
    packageInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 10, borderRadius: 8, marginBottom: 15 },
    packageName: { marginLeft: 8, fontSize: 14, color: '#374151' },
    packagePrice: { fontWeight: 'bold', color: '#1a531b' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    footerItem: { flexDirection: 'row', alignItems: 'center' },
    footerText: { fontSize: 12, color: '#6b7280', marginLeft: 5 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, color: '#9ca3af', marginTop: 15 },
    thumbnailContainer: { flexDirection: 'row' },
    thumbnail: { width: 32, height: 24, borderRadius: 4, marginRight: 6, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
    actionText: { fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
    subtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    logoutBtn: { backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8 },
    logoutText: { color: '#DC2626', fontWeight: 'bold', marginLeft: 6, fontSize: 14 }
});

export default AdminKYCListScreen;

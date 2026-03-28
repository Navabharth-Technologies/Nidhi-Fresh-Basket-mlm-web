import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image, Modal, TextInput, Alert, Platform, ScrollView } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { User, Calendar, CheckCircle, XCircle, Clock, Package, Power, Landmark, Check, X, Wallet, FileText, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import ScreenBackground from '../components/ScreenBackground';
import AnimatedCard from '../components/AnimatedCard';

const AdminKYCListScreen = ({ navigation }) => {
    const { logout, token: authToken } = useAuth();
    const [activeSection, setActiveSection] = useState('purchase'); // 'purchase', 'repurchase', 'withdraw'
    const [stats, setStats] = useState({ pending_purchases: 0, pending_repurchases: 0, pending_withdraws: 0 });
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const activeSectionRef = useRef(activeSection);

    useEffect(() => {
        activeSectionRef.current = activeSection;
    }, [activeSection]);

    const formatDate = (date) => {
        const d = new Date(date);
        const month = '' + (d.getMonth() + 1);
        const day = '' + d.getDate();
        const year = d.getFullYear();
        return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
    };

    const [filterType, setFilterType] = useState('today');
    const [startDate, setStartDate] = useState(formatDate(new Date()));
    const [endDate, setEndDate] = useState(formatDate(new Date()));
    const [activePicker, setActivePicker] = useState('start'); // 'start' or 'end'
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarViewDate, setCalendarViewDate] = useState(new Date()); // For month/year navigation

    // Temp states for modal
    const [tempFilterType, setTempFilterType] = useState('today');
    const [tempStartDate, setTempStartDate] = useState(formatDate(new Date()));
    const [tempEndDate, setTempEndDate] = useState(formatDate(new Date()));

    // Withdrawal specific state
    const [processingId, setProcessingId] = useState(null);
    const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
    const [pendingWithdrawAction, setPendingWithdrawAction] = useState({ id: null, status: null, reason: '' });

    const fetchStats = async () => {
        try {
            const res = await apiClient.get('/kyc/admin/dashboard-stats');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats', error);
        }
    };

    const fetchAllData = useCallback(async (overrides = null) => {
        try {
            // Use overrides if provided (for immediate Apply Filter feeedback), otherwise use state
            const currentFilter = overrides ? overrides.filterType : filterType;
            const currentStart = overrides ? overrides.startDate : startDate;
            const currentEnd = overrides ? overrides.endDate : endDate;

            // Only show full-screen loader if we have no existing data
            if (requests.length === 0) setLoading(true);

            // Create parallel requests based on active section
            const promises = [apiClient.get('/kyc/admin/dashboard-stats')];

            if (activeSection === 'withdraw') {
                const params = { filterType: currentFilter };
                if (currentFilter === 'custom') {
                    params.startDate = currentStart;
                    params.endDate = currentEnd;
                }
                promises.push(apiClient.get('/withdraw/admin/requests', { params }));
            } else {
                promises.push(apiClient.get('/kyc/admin/kyc-requests'));
            }

            // Fetch everything at once (Parallel)
            const [statsRes, dataRes] = await Promise.all(promises);

            // ABORT if the user switched sections during the async fetch
            if (activeSection !== activeSectionRef.current) return;

            // 1. Set Stats
            setStats(statsRes.data);

            // 2. Set Main List (Handle filtering for KYC sections)
            if (activeSection === 'withdraw') {
                setRequests(dataRes.data);
            } else {
                const filtered = dataRes.data.filter(item => {
                    const count = item.existing_packages_count || 0;
                    if (activeSection === 'purchase') return count === 0;
                    if (activeSection === 'repurchase') return count >= 1;
                    return true;
                });

                const sorted = [...filtered].sort((a, b) => {
                    const statusA = (a.kyc_status || 'pending').toLowerCase();
                    const statusB = (b.kyc_status || 'pending').toLowerCase();
                    if (statusA === 'pending' && statusB !== 'pending') return -1;
                    if (statusA !== 'pending' && statusB === 'pending') return 1;
                    return 0;
                });
                setRequests(sorted);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeSection, authToken, filterType, startDate, endDate, requests.length]);

    // Auto-refresh: Poll data every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading && !refreshing) {
                fetchAllData();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchAllData, loading, refreshing]);

    const showAlert = (title, message) => {
        if (Platform.OS === 'web') {
            alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAllData();
        }, [fetchAllData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchAllData();
    };

    const handleSectionChange = (id) => {
        if (id === activeSection) return;
        setRequests([]);
        setLoading(true);
        setActiveSection(id);
    };

    const handleWithdrawUpdateStatus = (withdrawId, status) => {
        setPendingWithdrawAction({ id: withdrawId, status, reason: '' });
        setWithdrawModalVisible(true);
    };

    const confirmWithdrawUpdate = async () => {
        const { id: withdrawId, status, reason } = pendingWithdrawAction;

        if (status === 'rejected' && (!reason || reason.trim().length < 3)) {
            showAlert('Required', 'Please provide a reason for rejection (min 3 chars)');
            return;
        }

        setWithdrawModalVisible(false);
        setProcessingId(withdrawId);

        try {
            const res = await apiClient.post('/withdraw/admin/update', {
                withdrawId,
                status,
                reason: status === 'rejected' ? reason : undefined
            });
            showAlert('Success', res.data.msg);
            fetchAllData();
        } catch (e) {
            const msg = e.response?.data?.msg || e.message;
            showAlert('Update Failed', msg);
        } finally {
            setProcessingId(null);
            setPendingWithdrawAction({ id: null, status: null, reason: '' });
        }
    };

    // Calendar Helpers
    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const changeMonth = (offset) => {
        const newDate = new Date(calendarViewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCalendarViewDate(newDate);
    };

    const changeYear = (offset) => {
        const newDate = new Date(calendarViewDate);
        newDate.setFullYear(newDate.getFullYear() + offset);
        setCalendarViewDate(newDate);
    };

    const applyPreset = (type) => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (type === 'today') {
            // default now
        } else if (type === 'week') {
            start.setDate(now.getDate() - 7);
        } else if (type === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (type === 'year') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
        }

        setTempFilterType(type);
        setTempStartDate(formatDate(start));
        setTempEndDate(formatDate(end));
        setCalendarViewDate(start);
    };

    const handleDateSelect = (day) => {
        const d = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);
        const dStr = formatDate(d);
        setTempFilterType('custom');
        if (activePicker === 'start') {
            setTempStartDate(dStr);
            setTempEndDate(dStr);
            setActivePicker('end');
        } else {
            // If selecting an end date that is before start date, swap them or restart
            if (dStr < tempStartDate) {
                setTempStartDate(dStr);
                setTempEndDate(dStr);
                setActivePicker('end');
            } else {
                setTempEndDate(dStr);
                setActivePicker('start');
            }
        }
    };

    const applyUnifiedFilter = () => {
        setFilterType(tempFilterType);
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        setShowCalendar(false);
        setRefreshing(true);
        // Explicitly trigger fetch with new parameters to bypass stale state on 1st click
        fetchAllData({ 
            filterType: tempFilterType, 
            startDate: tempStartDate, 
            endDate: tempEndDate 
        }); 
    };

    const handleExport = async (format) => {
        try {
            setLoading(true);
            const token = authToken;
            let url = `${apiClient.defaults.baseURL}/withdraw/admin/export/${format}?filterType=${filterType}&token=${token}`;
            if (filterType === 'custom') {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }

            const filename = `withdraw-report-${filterType}-${filterType === 'custom' ? `${startDate}-to-${endDate}` : new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

            if (Platform.OS === 'web') {
                window.open(url, '_blank');
            } else {
                const fileUri = `${FileSystem.documentDirectory}${filename}`;
                const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
                    headers: { 'x-auth-token': token }
                });

                if (downloadRes.status === 200) {
                    await Sharing.shareAsync(downloadRes.uri);
                } else {
                    const data = await FileSystem.readAsStringAsync(downloadRes.uri);
                    const error = JSON.parse(data);
                    showAlert('Export Error', error.msg || 'Failed to download report');
                }
            }
        } catch (error) {
            console.error('Export Error:', error);
            showAlert('Error', 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const renderDashboardCard = (id, title, count, Icon, color) => {
        const isActive = activeSection === id;
        return (
            <AnimatedCard
                style={[styles.dashboardCard, isActive && { borderColor: color, borderWidth: 2, backgroundColor: color + '10' }]}
                hoverStyle={{ backgroundColor: color + '20', borderColor: color }}
                onPress={() => handleSectionChange(id)}
            >
                <View style={[styles.cardIconBox, { backgroundColor: color + '20' }]}>
                    <Icon color={color} size={24} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <View style={styles.countRow}>
                        <Text style={styles.cardCount}>{count}</Text>
                        <Text style={styles.pendingLabel}>Pending</Text>
                    </View>
                </View>
            </AnimatedCard>
        );
    };

    const renderKYCItem = ({ item }) => (
        <AnimatedCard
            style={styles.card}
            hoverStyle={styles.hoverCard}
            onPress={() => navigation.navigate('KYCReview', { kycData: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <User color="#fff" size={20} />
                    </View>
                    <View>
                        <Text style={styles.userName}>{item.user_full_name || item.full_name || 'No Name'}</Text>
                        <Text style={styles.userId}>UID: {item.userid || item.username || 'N/A'}</Text>
                        <Text style={styles.userId}>Phone: {item.phone || 'N/A'}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge,
                item.kyc_status?.toLowerCase() === 'approved' ? styles.statusApproved :
                    item.kyc_status?.toLowerCase() === 'rejected' ? styles.statusRejected : styles.statusPending]}>
                    <Text style={[styles.statusText,
                    item.kyc_status?.toLowerCase() === 'approved' ? styles.textApproved :
                        item.kyc_status?.toLowerCase() === 'rejected' ? styles.textRejected : styles.textPending]}>
                        {(item.kyc_status || 'PENDING').toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.packageInfo}>
                <Package size={16} color="#4b5563" />
                <Text style={styles.packageName}>{item.package_name}: <Text style={styles.packagePrice}>₹{item.package_amount}</Text></Text>
            </View>

            {activeSection === 'purchase' && (
                <View style={styles.kycInfoRow}>
                    <FileText size={14} color="#6b7280" />
                    <Text style={styles.kycInfoText}>Includes KYC Verification Documents</Text>
                </View>
            )}

            <View style={styles.cardFooter}>
                <View style={styles.thumbnailContainer}>
                    {item.id && <Image source={{ uri: `${apiClient.defaults.baseURL}/kyc/admin/view-document/payment/${item.id}?token=${authToken}` }} style={styles.thumbnail} />}
                    {(item.existing_packages_count === 0 || !item.existing_packages_count) && (
                        <>
                            {item.id && <Image source={{ uri: `${apiClient.defaults.baseURL}/kyc/admin/view-document/aadhar/${item.id}?token=${authToken}` }} style={styles.thumbnail} />}
                            {item.id && <Image source={{ uri: `${apiClient.defaults.baseURL}/kyc/admin/view-document/pan/${item.id}?token=${authToken}` }} style={styles.thumbnail} />}
                        </>
                    )}
                </View>
                <View style={styles.footerItem}>
                    <Calendar size={14} color="#666" />
                    <Text style={styles.footerText}>
                        {new Date(item.submitted_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </AnimatedCard>
    );

    const renderWithdrawItem = ({ item }) => {
        const isPending = item.status === 'pending';
        return (
            <AnimatedCard style={styles.card} hoverStyle={styles.hoverCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.userName}>{item.user_full_name || item.name || 'No Name'}</Text>
                        <Text style={styles.userId}>User ID: {item.nfb_userid || 'N/A'}</Text>
                    </View>
                    <Text style={styles.amountText}>₹{item.amount}</Text>
                </View>

                <View style={styles.walletStats}>
                    <View style={styles.walletStatItem}>
                        <Text style={styles.walletLabel}>Comm.</Text>
                        <Text style={[styles.walletValue, { color: '#047857' }]}>₹{item.commission_balance}</Text>
                    </View>
                    <View style={styles.walletStatItem}>
                        <Text style={styles.walletLabel}>Coupon</Text>
                        <Text style={[styles.walletValue, { color: '#9d174d' }]}>₹{item.coupon_balance}</Text>
                    </View>
                    <View style={styles.walletStatItem}>
                        <Text style={styles.walletLabel}>Total</Text>
                        <Text style={[styles.walletValue, { color: '#1a531b', fontWeight: '800' }]}>₹{item.amount}</Text>
                    </View>
                </View>

                <View style={styles.transferInfo}>
                    <View style={[styles.infoCol, { paddingRight: 10 }]}>
                        <Text style={styles.infoLabel}>PAN</Text>
                        <Text style={[styles.infoVal, { letterSpacing: 1 }]}>{item.pan_number}</Text>
                    </View>
                    <View style={[styles.infoCol, { flex: 2, paddingRight: 10 }]}>
                        <Text style={styles.infoLabel}>{item.transfer_method === 'upi' ? 'UPI ID' : 'BANK DETAILS'}</Text>
                        <Text style={[styles.infoVal, { color: '#3b82f6' }]}>
                            {item.transfer_method === 'upi'
                                ? (item.upi_id || 'N/A')
                                : `${item.bank_account || 'N/A'} [${item.ifsc_code || 'N/A'}]`}
                        </Text>
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Method</Text>
                        <Text style={styles.infoVal}>{(item.transfer_method || 'BANK').toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.statusGroup}>
                        <Text style={styles.footerText}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</Text>
                        <View style={[styles.statusBadge,
                        item.status === 'approved' ? styles.statusApproved :
                            item.status === 'rejected' ? styles.statusRejected :
                                item.status === 'processing' ? styles.statusProcessing : styles.statusPending
                        ]}>
                            <Text style={styles.statusText}>{(item.status || 'pending').toUpperCase()}</Text>
                        </View>
                    </View>

                    {(isPending || item.status === 'processing') && (
                        <View style={styles.actionRow}>
                            {item.status === 'pending' && (
                                <TouchableOpacity
                                    style={[styles.smallActionBtn, { backgroundColor: '#3b82f6' }]}
                                    onPress={() => handleWithdrawUpdateStatus(item.id, 'processing')}
                                    disabled={processingId === item.id}
                                >
                                    {processingId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Clock color="#fff" size={16} />}
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.smallActionBtn, { backgroundColor: COLORS.success }]}
                                onPress={() => handleWithdrawUpdateStatus(item.id, 'approved')}
                                disabled={processingId === item.id}
                            >
                                <Check color="#fff" size={16} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.smallActionBtn, { backgroundColor: COLORS.error }]}
                                onPress={() => handleWithdrawUpdateStatus(item.id, 'rejected')}
                                disabled={processingId === item.id}
                            >
                                <X color="#fff" size={16} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {item.status === 'rejected' && item.rejection_reason && (
                    <View style={styles.rejectReasonBox}>
                        <Text style={styles.rejectionLabel}>REASON: {item.rejection_reason}</Text>
                    </View>
                )}
            </AnimatedCard>
        );
    };

    const handleLogout = () => {
        const msg = 'Are you sure you want to logout?';
        if (Platform.OS === 'web') {
            if (window.confirm(msg)) logout();
        } else {
            Alert.alert('Logout', msg, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout }
            ]);
        }
    };

    return (
        <ScreenBackground admin>

            <View style={styles.container}>
                <View style={styles.dashboardGrid}>
                    {renderDashboardCard('purchase', 'Package Activation', stats.pending_purchases, Package, '#166534')}
                    {renderDashboardCard('repurchase', 'Package\nRe-Activation', stats.pending_repurchases, RotateCcw, '#1e40af')}
                    {renderDashboardCard('withdraw', 'Withdraw', stats.pending_withdraws, Landmark, '#9a3412')}
                </View>

                {activeSection === 'withdraw' && (
                    <View style={styles.exportSection}>
                        <TouchableOpacity
                            style={styles.unifiedTrigger}
                            onPress={() => {
                                setTempFilterType(filterType);
                                setTempStartDate(startDate);
                                setTempEndDate(endDate);
                                setShowCalendar(true);
                            }}
                        >
                            <View style={styles.unifiedTriggerIcon}>
                                <Calendar size={18} color={COLORS.secondary} />
                            </View>
                            <View style={styles.unifiedTriggerContent}>
                                <Text style={styles.unifiedTriggerLabel}>REPORT PERIOD</Text>
                                <Text style={styles.unifiedTriggerValue}>
                                    {filterType === 'custom'
                                        ? `${startDate}  →  ${endDate}`
                                        : filterType.toUpperCase()}
                                </Text>
                            </View>
                            <ChevronDown size={20} color="#94a3b8" />
                        </TouchableOpacity>
                        <View style={styles.exportActions}>
                            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#166534' }]} onPress={() => handleExport('excel')}>
                                <FileText size={16} color="#fff" />
                                <Text style={styles.exportBtnText}>Excel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#b91c1c' }]} onPress={() => handleExport('pdf')}>
                                <FileText size={16} color="#fff" />
                                <Text style={styles.exportBtnText}>PDF</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {loading && !refreshing ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#1a531b" />
                    </View>
                ) : (
                    <FlatList
                        data={requests}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={activeSection === 'withdraw' ? renderWithdrawItem : renderKYCItem}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <CheckCircle size={60} color="#ccc" />
                                <Text style={styles.emptyText}>No pending {activeSection} requests</Text>
                            </View>
                        }
                    />
                )}

                {/* Withdrawal Action Modal */}
                <Modal transparent visible={withdrawModalVisible} animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <View style={[styles.modalIconBox, { backgroundColor: pendingWithdrawAction.status === 'approved' ? COLORS.success + '20' : pendingWithdrawAction.status === 'processing' ? '#3b82f620' : COLORS.error + '20' }]}>
                                {pendingWithdrawAction.status === 'approved' ? <Check color={COLORS.success} size={32} /> : pendingWithdrawAction.status === 'processing' ? <Clock color="#3b82f6" size={32} /> : <X color={COLORS.error} size={32} />}
                            </View>
                            <Text style={styles.modalTitle}>Confirm {pendingWithdrawAction.status?.toUpperCase()}</Text>
                            <Text style={styles.modalMsg}>Are you sure you want to {pendingWithdrawAction.status} this request?</Text>

                            {pendingWithdrawAction.status === 'rejected' && (
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Rejection Reason"
                                    value={pendingWithdrawAction.reason}
                                    onChangeText={t => setPendingWithdrawAction(prev => ({ ...prev, reason: t }))}
                                    multiline
                                />
                            )}

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalCancel} onPress={() => setWithdrawModalVisible(false)}>
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: pendingWithdrawAction.status === 'approved' ? COLORS.success : pendingWithdrawAction.status === 'processing' ? '#3b82f6' : COLORS.error }]} onPress={confirmWithdrawUpdate}>
                                    <Text style={styles.modalConfirmText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Unified Date/Range Modal */}
                <Modal transparent visible={showCalendar} animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalCard, { padding: 15, maxWidth: 450 }]}>
                            <Text style={styles.modalTitle}>Select Report Period</Text>

                            <View style={styles.presetsRow}>
                                {['today', 'week', 'month', 'year'].map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.presetBtn, tempFilterType === type && styles.presetBtnActive]}
                                        onPress={() => applyPreset(type)}
                                    >
                                        <Text style={[styles.presetBtnText, tempFilterType === type && styles.presetBtnTextActive]}>
                                            {type.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.calendarHeader}>
                                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calNavBtn}>
                                    <ChevronLeft size={20} color={COLORS.secondary} />
                                </TouchableOpacity>
                                <View style={styles.calendarTitleContainer}>
                                    <Text style={styles.calendarMonthName}>
                                        {calendarViewDate.toLocaleString('default', { month: 'long' })} {calendarViewDate.getFullYear()}
                                    </Text>
                                    <View style={styles.yearSelector}>
                                        <TouchableOpacity onPress={() => changeYear(-1)}><ChevronLeft size={16} color="#94a3b8" /></TouchableOpacity>
                                        <Text style={styles.calendarYear}>Year</Text>
                                        <TouchableOpacity onPress={() => changeYear(1)}><ChevronRight size={16} color="#94a3b8" /></TouchableOpacity>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calNavBtn}>
                                    <ChevronRight size={20} color={COLORS.secondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.calendarGrid}>
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, index) => (
                                    <Text key={`weekday-${index}`} style={styles.weekdayLabel}>{d}</Text>
                                ))}
                                {Array(getFirstDayOfMonth(calendarViewDate.getMonth(), calendarViewDate.getFullYear())).fill(0).map((_, i) => (
                                    <View key={`empty-${i}`} style={styles.calendarDayEmpty} />
                                ))}
                                {Array(getDaysInMonth(calendarViewDate.getMonth(), calendarViewDate.getFullYear())).fill(0).map((_, i) => {
                                    const day = i + 1;
                                    const d = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);
                                    const dStr = formatDate(d);
                                    const isSelected = tempStartDate === dStr || tempEndDate === dStr;
                                    const inRange = dStr > tempStartDate && dStr < tempEndDate;

                                    return (
                                        <TouchableOpacity
                                            key={day}
                                            style={[styles.calendarDay, isSelected && styles.calendarDayActive, inRange && { backgroundColor: COLORS.secondary + '15' }]}
                                            onPress={() => handleDateSelect(day)}
                                        >
                                            <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextActive]}>{day}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCalendar(false)}>
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: COLORS.secondary }]} onPress={applyUnifiedFilter}>
                                    <Text style={styles.modalConfirmText}>Apply Filter</Text>
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
    dashboardGrid: { flexDirection: 'row', padding: 15, justifyContent: 'space-between' },
    dashboardCard: { backgroundColor: 'rgba(255, 255, 255, 0.9)', width: '31%', borderRadius: 16, padding: 15, position: 'relative', overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.5)' },
    cardIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    cardInfo: {},
    cardTitle: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
    countRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
    cardCount: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', lineHeight: 28 },
    pendingLabel: { fontSize: 9, color: '#94a3b8', marginBottom: 4, marginLeft: 4, textTransform: 'uppercase' },
    activeIndicator: { height: 4, width: '100%', position: 'absolute', bottom: 0, left: 0 },

    listContent: { padding: 15 },
    card: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.5)' },
    hoverCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.9)',
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a531b', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    userName: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    userId: { fontSize: 14, color: '#6b7280', marginTop: 1 },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusPending: { backgroundColor: '#fff9e6' },
    statusApproved: { backgroundColor: '#f0fdf4' },
    statusRejected: { backgroundColor: '#fef2f2' },
    statusProcessing: { backgroundColor: '#eff6ff' },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    textPending: { color: '#f39c12' },
    textApproved: { color: '#10b981' },
    textRejected: { color: '#ef4444' },

    packageInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.02)', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.05)' },
    packageName: { marginLeft: 8, fontSize: 14, color: '#374151' },
    packagePrice: { fontWeight: 'bold', color: '#1a531b' },

    kycInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
    kycInfoText: { fontSize: 12, color: '#6b7280', marginLeft: 6, fontStyle: 'italic' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    footerItem: { flexDirection: 'row', alignItems: 'center' },
    footerText: { fontSize: 11, color: '#6b7280' },
    thumbnailContainer: { flexDirection: 'row' },
    thumbnail: { width: 32, height: 24, borderRadius: 4, marginRight: 6, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },

    // Withdraw specific styles
    amountText: { fontSize: 22, fontWeight: '800', color: '#1a531b' },
    walletStats: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#f8fafc', padding: 8, borderRadius: 8 },
    walletStatItem: { flex: 1, alignItems: 'center' },
    walletLabel: { fontSize: 12, color: '#64748b', textTransform: 'uppercase' },
    walletValue: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
    transferInfo: { flexDirection: 'row', marginBottom: 12 },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 12, color: '#94a3b8' },
    infoVal: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    statusGroup: { flexDirection: 'row', alignItems: 'center' },
    actionRow: { flexDirection: 'row' },
    smallActionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        ...Platform.select({ web: { outlineStyle: 'none' } })
    },
    rejectReasonBox: { marginTop: 10, padding: 8, backgroundColor: '#fef2f2', borderRadius: 6 },
    rejectionLabel: { fontSize: 10, color: '#ef4444', fontWeight: 'bold' },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, color: '#9ca3af', marginTop: 15 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '100%', maxWidth: 400, alignItems: 'center' },
    modalIconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    modalMsg: { fontSize: 14, color: '#666', textAlign: 'center', marginVertical: 10 },
    modalInput: { width: '100%', backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#eee', marginBottom: 20 },
    modalActions: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    modalCancel: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        ...Platform.select({ web: { outlineStyle: 'none' } })
    },
    modalConfirm: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
        ...Platform.select({ web: { outlineStyle: 'none' } })
    },
    modalCancelText: { color: '#666', fontWeight: 'bold' },
    modalConfirmText: { color: '#fff', fontWeight: 'bold' },

    // Export & Filter UI
    exportSection: { backgroundColor: 'transparent', marginHorizontal: 15, marginBottom: 15, borderRadius: 16, padding: 12, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.5)' },
    unifiedTrigger: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#f8fafc', 
        padding: 12, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#e2e8f0', 
        marginBottom: 12,
        ...Platform.select({ web: { outlineStyle: 'none' } })
    },
    unifiedTriggerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.secondary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    unifiedTriggerContent: { flex: 1 },
    unifiedTriggerLabel: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold', letterSpacing: 0.5 },
    unifiedTriggerValue: { fontSize: 13, fontWeight: '700', color: '#1e293b' },

    presetsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 15, marginTop: 10 },
    presetBtn: { 
        flex: 1, 
        paddingVertical: 8, 
        marginHorizontal: 3, 
        borderRadius: 8, 
        backgroundColor: '#f1f5f9', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#e2e8f0',
        ...Platform.select({ web: { outlineStyle: 'none' } })
    },
    presetBtnActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
    presetBtnText: { fontSize: 10, color: '#64748b', fontWeight: 'bold' },
    presetBtnTextActive: { color: '#fff' },

    modalRangeInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, marginBottom: 15, width: '100%', borderWidth: 1, borderColor: '#e2e8f0' },
    modalRangeBox: { flex: 1, alignItems: 'center', paddingVertical: 5, borderRadius: 6 },
    modalRangeBoxActive: { backgroundColor: '#fff', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    modalRangeLabel: { fontSize: 8, color: '#94a3b8', fontWeight: 'bold' },
    modalRangeValue: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },

    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10, paddingHorizontal: 5 },
    calNavBtn: { 
        padding: 8, 
        backgroundColor: '#f1f5f9', 
        borderRadius: 10,
        ...Platform.select({ web: { outlineStyle: 'none' } })
    },
    calendarTitleContainer: { alignItems: 'center' },
    calendarMonthName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    yearSelector: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
    calendarYear: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginHorizontal: 10 },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', marginBottom: 5 },
    weekdayLabel: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8 },
    calendarDay: { 
        width: `${100 / 7}%`, 
        height: 36, 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: 18, 
        marginBottom: 2,
        ...Platform.select({ web: { outlineStyle: 'none' } })
    },
    calendarDayEmpty: { width: `${100 / 7}%`, height: 36 },
    calendarDayActive: { backgroundColor: COLORS.secondary },
    calendarDayText: { fontSize: 13, color: '#1e293b', fontWeight: '500' },
    calendarDayTextActive: { color: '#fff', fontWeight: 'bold' },

    exportActions: { flexDirection: 'row', justifyContent: 'space-between' },
    exportBtn: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 10, 
        borderRadius: 10, 
        marginHorizontal: 4,
        ...Platform.select({ web: { outlineStyle: 'none' } })
    },
    exportBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
});

export default AdminKYCListScreen;

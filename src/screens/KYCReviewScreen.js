import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckCircle, XCircle, User, FileText, Camera, Package, Hash, Download } from 'lucide-react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { useAuth } from '../store/AuthContext';
import ScreenBackground from '../components/ScreenBackground';

const KYCReviewScreen = ({ route, navigation }) => {
    const { token: authToken } = useAuth();
    const { kycData } = route.params;
    const isRepurchase = (kycData.existing_packages_count || 0) > 0;
    const [loading, setLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const typeLabel = isRepurchase ? 'Package Re-activation' : 'KYC';

    useEffect(() => {
        navigation.setOptions({
            title: `Review ${typeLabel}`
        });
    }, [navigation, typeLabel]);

    const handleAction = async (status, reason = '') => {
        console.log('[handleAction] Payload:', {
            status,
            user_id: kycData.user_id,
            kyc_id: kycData.id,
            remark: reason
        });
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const endpoint = status === 'approved' ? '/kyc/admin/approve-kyc' : '/kyc/admin/reject-kyc';
            await apiClient.post(endpoint, {
                user_id: kycData.user_id,
                kyc_id: kycData.id,
                remark: reason
            }, {
                headers: {
                    'x-auth-token': token
                }
            });
            Alert.alert('Success', `KYC request ${status} successfully`);
            navigation.navigate('AdminHome');
        } catch (error) {
            console.error('Update Error:', error);
            Alert.alert('Error', error.response?.data?.msg || 'Failed to update status');
        } finally {
            setLoading(false);
            setShowRejectModal(false);
        }
    };

    const getBaseUrl = () => apiClient.defaults.baseURL.replace('/api', '');

    const ImageSection = ({ title, type }) => {
        const [imageUri, setImageUri] = useState(null);
        const [imageLoading, setImageLoading] = useState(true);

        const imageUrl = `${apiClient.defaults.baseURL}/kyc/admin/view-document/${type}/${kycData.id}?token=${authToken}`;

        useEffect(() => {
            const fetchImage = async () => {
                try {
                    setImageLoading(true);
                    const response = await apiClient.get(`/kyc/admin/view-document/${type}/${kycData.id}`, {
                        responseType: 'arraybuffer'
                    });
                    
                    const base64 = btoa(
                        new Uint8Array(response.data).reduce(
                            (data, byte) => data + String.fromCharCode(byte),
                            ''
                        )
                    );
                    setImageUri(`data:image/png;base64,${base64}`);
                } catch (e) {
                    console.error(`Failed to fetch ${type} image:`, e);
                } finally {
                    setImageLoading(false);
                }
            };

            if (kycData.id) {
                fetchImage();
            }
        }, [type, kycData.id]);

        const openImage = () => {
            Linking.openURL(imageUrl).catch(err => console.error("Couldn't load page", err));
        };

        const downloadImage = async () => {
            try {
                const fileName = `${type}_${kycData.user_id}.png`;

                if (Platform.OS === 'web') {
                    const response = await apiClient.get(`/kyc/admin/view-document/${type}/${kycData.id}`, {
                        responseType: 'blob'
                    });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', fileName);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                } else {
                    Linking.openURL(imageUrl);
                }
            } catch (err) {
                console.error("Download failed", err);
                Alert.alert('Error', 'Failed to download image.');
            }
        };

        return (
            <View style={styles.section}>
                <View style={styles.imageHeader}>
                    <Text style={styles.imageLabel}>{title}</Text>
                    <TouchableOpacity onPress={downloadImage} style={styles.downloadBtn}>
                        <Download size={18} color="#1a531b" />
                        <Text style={styles.downloadText}>Download</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity 
                    onPress={openImage} 
                    activeOpacity={0.9} 
                    style={imageLoading ? styles.imagePlaceholder : null}
                >
                    {imageLoading ? (
                        <View style={[styles.documentImage, styles.imagePlaceholder]}>
                            <ActivityIndicator color="#1a531b" />
                        </View>
                    ) : imageUri ? (
                        <Image
                            source={{ uri: imageUri }}
                            style={styles.documentImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={[styles.documentImage, styles.imagePlaceholder]}>
                            <Text style={styles.placeholderText}>No {title} available</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <ScreenBackground admin>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <User color="#fff" size={30} />
                </View>
                <Text style={styles.userName}>{kycData.user_full_name || kycData.full_name || 'No Name'}</Text>
                <Text style={styles.userId}>User ID: {kycData.userid || kycData.username}</Text>
                <Text style={styles.userId}>Phone: {kycData.phone || 'N/A'}</Text>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Package size={20} color="#1a531b" />
                    <Text style={styles.sectionTitle}>Package & Payment Info</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Selected Package:</Text>
                    <Text style={styles.detailValue}>{kycData.package_name}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount Paid:</Text>
                    <Text style={styles.detailValue}>₹{kycData.package_amount}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction ID:</Text>
                    <Text style={[styles.detailValue, { color: '#1a531b' }]}>{kycData.transaction_id}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <FileText size={20} color="#1a531b" />
                    <Text style={styles.sectionTitle}>Identity & Bank Details</Text>
                </View>
                {!isRepurchase && (
                    <>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Aadhar Number:</Text>
                            <Text style={styles.detailValue}>{kycData.aadhar_number}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>PAN Number:</Text>
                            <Text style={styles.detailValue}>{kycData.pan_number}</Text>
                        </View>
                    </>
                )}
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank Account:</Text>
                    <Text style={styles.detailValue}>{kycData.bank_account_number || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>IFSC Code:</Text>
                    <Text style={styles.detailValue}>{kycData.ifsc_code || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>UPI ID:</Text>
                    <Text style={styles.detailValue}>{kycData.upi_id || 'N/A'}</Text>
                </View>
            </View>

            <ImageSection title="Payment Screenshot" type="payment" />
            {!isRepurchase && (
                <>
                    <ImageSection title="Aadhar Card" type="aadhar" />
                    <ImageSection title="PAN Card" type="pan" />
                </>
            )}

            {kycData.kyc_status?.toLowerCase() === 'pending' && (
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => handleAction('approved')}
                        disabled={loading}
                    >
                        <CheckCircle size={20} color="#fff" />
                        <Text style={styles.actionText}>{isRepurchase ? 'Approve Re-activation' : 'Approve KYC'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => setShowRejectModal(true)}
                        disabled={loading}
                    >
                        <XCircle size={20} color="#fff" />
                        <Text style={styles.actionText}>{isRepurchase ? 'Reject Re-activation' : 'Reject KYC'}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {kycData.kyc_status?.toLowerCase() !== 'pending' && (
                <View style={[styles.statusBanner, kycData.kyc_status?.toLowerCase() === 'approved' ? styles.bannerApproved : styles.bannerRejected]}>
                    <Text style={styles.bannerText}>This {isRepurchase ? 're-activation' : 'request'} has already been {kycData.kyc_status.toUpperCase()}</Text>
                </View>
            )}

            <Modal visible={showRejectModal} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Enter Rejection Reason</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g., Blurry image, invalid transaction ID"
                            multiline
                            numberOfLines={4}
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalBtnCancel}
                                onPress={() => setShowRejectModal(false)}
                            >
                                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnReject}
                                onPress={() => {
                                    if (!rejectionReason.trim()) {
                                        if (Platform.OS === 'web') alert('Please enter a rejection reason.');
                                        else Alert.alert('Reason Required', 'Please enter a rejection reason.');
                                        return;
                                    }
                                    handleAction('rejected', rejectionReason);
                                }}
                            >
                                <Text style={styles.modalBtnTextReject}>Confirm Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#1a531b" />
                </View>
            )}
        </ScrollView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: { padding: 16, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 20 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1a531b', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    userName: { fontSize: 22, fontWeight: 'bold', color: '#111' },
    userId: { fontSize: 13, color: '#6b7280', marginTop: 4 },
    section: { 
        backgroundColor: 'rgba(255, 255, 255, 0.85)', 
        borderRadius: 16, 
        padding: 16, 
        marginBottom: 16, 
        elevation: 1, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 2, 
        borderWidth: 1, 
        borderColor: 'rgba(255, 255, 255, 0.3)' 
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 8 },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a531b', marginLeft: 10 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    detailLabel: { fontSize: 13, color: '#6b7280' },
    detailValue: { fontSize: 13, fontWeight: 'bold', color: '#111' },
    imageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    imageLabel: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1a531b' },
    downloadText: { fontSize: 12, fontWeight: 'bold', color: '#1a531b', marginLeft: 6 },
    documentImage: { width: '100%', height: 350, borderRadius: 12, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' },
    imagePlaceholder: { justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
    placeholderText: { color: '#9ca3af', fontSize: 13 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
    actionBtn: { flex: 1, marginHorizontal: 4, flexDirection: 'row', height: 64, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2, paddingHorizontal: 8 },
    approveBtn: { backgroundColor: '#10b981' },
    rejectBtn: { backgroundColor: '#ef4444' },
    actionText: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 6, textAlign: 'center', flexShrink: 1 },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 5 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#111' },
    modalInput: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, height: 120, textAlignVertical: 'top', marginBottom: 20, borderWidth: 1, borderColor: '#e5e7eb' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    modalBtnCancel: { paddingHorizontal: 20, paddingVertical: 12 },
    modalBtnReject: { backgroundColor: '#ef4444', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginLeft: 10 },
    modalBtnTextCancel: { color: '#6b7280', fontWeight: '600' },
    modalBtnTextReject: { color: '#fff', fontWeight: 'bold' },
    statusBanner: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    bannerApproved: { backgroundColor: '#ecfdf5' },
    bannerRejected: { backgroundColor: '#fef2f2' },
    bannerText: { fontWeight: 'bold', color: '#111' }
});

export default KYCReviewScreen;

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Platform, Modal, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import { useAuth } from '../store/AuthContext';
import apiClient from '../api/client';
import { User, LogOut, ShieldCheck, Mail, Phone, CreditCard, Eye, EyeOff } from 'lucide-react-native';

const ProfileItem = ({ label, value, icon: Icon, isSensitive, onReveal, revealed }) => {
    const maskValue = (val) => {
        if (!val) return 'N/A';
        if (revealed || !isSensitive) return val;
        // Simple masking: show last 4 digits
        return val.length > 4 ? `XXXX-XXXX-${val.slice(-4)}` : 'XXXX-XXXX';
    };

    return (
        <TouchableOpacity 
            style={styles.item} 
            onPress={isSensitive && !revealed ? onReveal : null}
            activeOpacity={isSensitive && !revealed ? 0.7 : 1}
        >
            <View style={styles.iconBox}>
                <Icon color={COLORS.textSecondary} size={20} />
            </View>
            <View style={styles.info}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{maskValue(value)}</Text>
            </View>
            {isSensitive && (
                <View style={{ marginLeft: 'auto' }}>
                    {revealed ? <Eye color={COLORS.success} size={18} /> : <EyeOff color={COLORS.textSecondary} size={18} />}
                </View>
            )}
        </TouchableOpacity>
    );
};

const ProfileScreen = () => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [revealedData, setRevealedData] = useState({ aadhar: false, pan: false });
    const [passwordModal, setPasswordModal] = useState({ visible: false, type: null, password: '' });
    const [verifying, setVerifying] = useState(false);

    const fetchProfile = async () => {
        try {
            const res = await apiClient.get('/users/profile');
            setProfile(res.data);
        } catch (e) {
            console.error('Profile fetch failed:', e);
            if (e.response && (e.response.status === 401 || e.response.status === 404)) {
                logout();
            }
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleReveal = (type) => {
        setPasswordModal({ visible: true, type, password: '' });
    };

    const confirmReveal = async () => {
        if (!passwordModal.password) return;
        setVerifying(true);
        try {
            const res = await apiClient.post('/users/verify-password', { password: passwordModal.password });
            if (res.data.success) {
                setRevealedData(prev => ({ ...prev, [passwordModal.type]: true }));
                setPasswordModal({ visible: false, type: null, password: '' });
            }
        } catch (e) {
            const msg = e.response?.data?.msg || 'Verification failed';
            if (Platform.OS === 'web') alert(msg); else Alert.alert('Error', msg);
        } finally {
            setVerifying(false);
        }
    };

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to logout?')) {
                logout();
            }
        } else {
            Alert.alert('Logout', 'Are you sure you want to exit?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout }
            ]);
        }
    };

    if (!profile) return null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={isDesktop && styles.contentContainerDesktop}>
            <View style={[styles.header, isDesktop && styles.headerDesktop]}>
                <View style={styles.avatar}>
                    <User color={COLORS.secondary} size={50} />
                </View>
                <Text style={styles.name}>{profile.full_name}</Text>
                <Text style={styles.email}>{profile.email}</Text>
            </View>

            <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
                <Text style={styles.sectionTitle}>Account Information</Text>
                <ProfileItem label="Phone Number" value={profile.phone} icon={Phone} />
                <ProfileItem label="Referral Code" value={profile.referral_code} icon={ShieldCheck} />
                <ProfileItem 
                    label="Active Aadhar" 
                    value={profile.aadhar_number} 
                    icon={CreditCard} 
                    isSensitive 
                    revealed={revealedData.aadhar}
                    onReveal={() => handleReveal('aadhar')}
                />
                <ProfileItem 
                    label="Active PAN" 
                    value={profile.pan_number} 
                    icon={CreditCard} 
                    isSensitive 
                    revealed={revealedData.pan}
                    onReveal={() => handleReveal('pan')}
                />
                <ProfileItem label="Total Referrals" value={profile.total_referral_count} icon={User} />
            </View>

            {/* Password Verification Modal */}
            <Modal
                transparent
                visible={passwordModal.visible}
                animationType="fade"
                onRequestClose={() => setPasswordModal({ ...passwordModal, visible: false })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Verify Identity</Text>
                        <Text style={styles.modalSub}>Enter your password to reveal {passwordModal.type === 'aadhar' ? 'Aadhar' : 'PAN'} number</Text>
                        
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Password"
                            secureTextEntry
                            value={passwordModal.password}
                            onChangeText={(t) => setPasswordModal({ ...passwordModal, password: t })}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelBtn]} 
                                onPress={() => setPasswordModal({ ...passwordModal, visible: false })}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.confirmBtn]} 
                                onPress={confirmReveal}
                                disabled={verifying}
                            >
                                {verifying ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmText}>Verify</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut color={COLORS.error} size={20} />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    contentContainerDesktop: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    header: { padding: SPACING.xl, alignItems: 'center', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerDesktop: {
        width: '100%',
        maxWidth: 700,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.m, borderWidth: 2, borderColor: COLORS.secondary },
    name: { fontSize: SIZES.h2, color: COLORS.text, fontWeight: 'bold' },
    email: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
    section: { padding: SPACING.m, marginTop: SPACING.m },
    sectionDesktop: {
        width: '100%',
        maxWidth: 700,
    },
    sectionTitle: { color: COLORS.textSecondary, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: SPACING.m, marginLeft: 4 },
    item: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SPACING.m, borderRadius: 12, marginBottom: SPACING.s },
    iconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    info: { marginLeft: SPACING.m },
    label: { color: COLORS.textSecondary, fontSize: 14 },
    value: { color: COLORS.text, fontSize: 18, fontWeight: '500' },
    logoutBtn: { flexDirection: 'row', padding: SPACING.xl, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.l },
    logoutText: { color: COLORS.error, fontWeight: 'bold', fontSize: 18, marginLeft: 10 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.l },
    modalContent: { backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING.l, width: '100%', maxWidth: 350 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
    modalSub: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 16 },
    passwordInput: { backgroundColor: COLORS.background, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, marginBottom: 20, fontSize: 16 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
    modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginLeft: 10 },
    cancelBtn: { backgroundColor: 'transparent' },
    confirmBtn: { backgroundColor: COLORS.secondary },
    cancelText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 16 },
    confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default ProfileScreen;

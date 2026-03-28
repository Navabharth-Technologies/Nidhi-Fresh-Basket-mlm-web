import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Platform, Modal, TextInput, ActivityIndicator, useWindowDimensions, Image, LayoutAnimation, UIManager } from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import { useAuth } from '../store/AuthContext';
import apiClient from '../api/client';
import { User, Power, ShieldCheck, Mail, Phone, CreditCard, Eye, EyeOff, Camera, Landmark, Hash, Smartphone, ChevronDown, ChevronUp, CheckCircle, FileText, Shield, HelpCircle, Info, ChevronRight, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import ScreenBackground from '../components/ScreenBackground';
import * as ImagePicker from 'expo-image-picker';
import MainHeader from '../components/MainHeader';
import AnimatedCard from '../components/AnimatedCard';

const ProfileItem = ({ label, value, icon: Icon, isSensitive, onReveal, revealed, iconColor }) => {
    const maskValue = (val) => {
        if (!val) return 'N/A';
        if (revealed || !isSensitive) return val;
        // Simple masking: show last 4 digits
        return val.length > 4 ? `XXXX-XXXX-${val.slice(-4)}` : 'XXXX-XXXX';
    };

    return (
        <AnimatedCard
            style={styles.item}
            onPress={isSensitive && !revealed ? onReveal : null}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                <View style={[styles.iconBox, iconColor && { backgroundColor: iconColor + '10' }]}>
                    <Icon color={iconColor || COLORS.textSecondary} size={20} />
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
            </View>
        </AnimatedCard>
    );
};

const ProfileScreen = ({ navigation }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { logout, user, isAdmin, setProfile: setGlobalProfile } = useAuth();
    const [profile, setProfile] = useState(null);
    const isTrusted = isAdmin || (profile?.kyc_status?.toLowerCase() === 'approved' && profile?.is_active);
    const [revealedData, setRevealedData] = useState({ aadhar: false, pan: false, bank: false, ifsc: false, upi: false });
    const [passwordModal, setPasswordModal] = useState({ visible: false, type: null, password: '' });
    const [verifying, setVerifying] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [updatingImage, setUpdatingImage] = useState(false);
    const [isKYCOpen, setIsKYCOpen] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);

    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const fetchProfile = async () => {
        try {
            const res = await apiClient.get('/users/profile');
            setProfile(res.data);
            setGlobalProfile(res.data);
            if (res.data.profile_image_binary) {
                setProfileImage(`${apiClient.defaults.baseURL}/users/view-profile-image/${res.data.id}?t=${Date.now()}`);
            } else {
                setProfileImage(null);
            }
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

    const pickImageFromWeb = (useCamera = false) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (useCamera) {
            // This signals mobile browsers to open camera instead of files
            input.capture = 'user';
        }
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadImage(null, file);
            }
        };
        input.click();
    };

    const handleProfileImagePress = () => {
        setImageModalVisible(true);
    };

    const openCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permission Denied', 'Camera permissions required');
        let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        if (!result.canceled) uploadImage(result.assets[0].uri);
    };

    const openGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return alert('Gallery permissions required');
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        if (!result.canceled) uploadImage(result.assets[0].uri);
    };

    const uploadImage = async (uri, webFile) => {
        setUpdatingImage(true);
        try {
            const formData = new FormData();

            if (Platform.OS === 'web' && webFile) {
                // Web: append the actual File object directly
                formData.append('profile_image', webFile, webFile.name);
            } else {
                // Native: use { uri, name, type } pattern
                const filename = uri.split('/').pop() || 'profile.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                formData.append('profile_image', { uri, name: filename, type });
            }

            const res = await apiClient.post('/users/profile-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) fetchProfile();
        } catch (e) {
            Alert.alert('Error', 'Failed to upload image');
        } finally {
            setUpdatingImage(false);
        }
    };

    const toggleKYC = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsKYCOpen(!isKYCOpen);
    };

    const removeProfileImage = async () => {
        setUpdatingImage(true);
        try {
            const res = await apiClient.delete('/users/profile-image');
            if (res.data.success) {
                setProfileImage(null);
                fetchProfile();
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to remove image');
        } finally {
            setUpdatingImage(false);
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
        <ScreenBackground>
            <View style={styles.container}>
                <MainHeader title="Profile" navigation={navigation} hideProfile={true} />
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    <View style={[isDesktop && styles.contentContainerDesktop]}>
                        <View style={[styles.header, isDesktop && styles.headerDesktop]}>
                            <TouchableOpacity style={styles.avatarContainer} onPress={handleProfileImagePress} disabled={updatingImage}>
                                <View style={styles.avatar}>
                                    {updatingImage ? (
                                        <ActivityIndicator color={COLORS.secondary} size="large" />
                                    ) : profileImage ? (
                                        <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                                    ) : (
                                        <User color={COLORS.secondary} size={50} />
                                    )}
                                </View>
                                <View style={styles.cameraBadge}>
                                    <Camera color="#fff" size={16} />
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.name}>{profile.full_name}</Text>
                        </View>

                        <View style={[styles.section, isDesktop && styles.sectionDesktop, { marginTop: 15 }]}>
                            <View style={styles.accordionHeader}>
                                <View style={styles.accordionTitleRow}>
                                    <User color={COLORS.secondary} size={20} />
                                    <Text style={styles.accordionTitle}>Account Information</Text>
                                </View>
                            </View>
                            <View style={[styles.card, { marginTop: 5 }]}>
                                <ProfileItem label="Phone Number" value={profile.phone} icon={Phone} iconColor="#3b82f6" />
                                <ProfileItem label="Email ID" value={profile.email} icon={Mail} iconColor="#ef4444" />

                            </View>
                        </View>

                        <View style={[styles.section, isDesktop && styles.sectionDesktop, { marginTop: 15 }]}>
                            <TouchableOpacity
                                style={styles.accordionHeader}
                                onPress={toggleKYC}
                                activeOpacity={0.7}
                            >
                                <View style={styles.accordionTitleRow}>
                                    <ShieldCheck color={COLORS.secondary} size={20} />
                                    <Text style={styles.accordionTitle}>KYC Information</Text>
                                </View>
                                {isKYCOpen ? <ChevronUp color={COLORS.textSecondary} size={20} /> : <ChevronDown color={COLORS.textSecondary} size={20} />}
                            </TouchableOpacity>

                            {isKYCOpen && (
                                <View style={[styles.card, { marginTop: 5 }]}>
                                    <View style={styles.kycRow}>
                                        <View style={styles.kycLeft}>
                                            <View style={[styles.iconBox, { backgroundColor: '#06b6d410' }]}>
                                                <CreditCard color="#06b6d4" size={20} />
                                            </View>
                                            <View style={styles.info}>
                                                <Text style={styles.label}>Aadhar</Text>
                                                <Text style={styles.value}>{revealedData.aadhar ? (profile.aadhar_number || 'N/A') : (profile.aadhar_number ? `XXXX-XXXX-${profile.aadhar_number.slice(-4)}` : 'XXXX-XXXX-XXXX')}</Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                                            <TouchableOpacity 
                                                onPress={() => !revealedData.aadhar && handleReveal('aadhar')}
                                                activeOpacity={0.7}
                                                style={{ marginLeft: 12 }}
                                                disabled={revealedData.aadhar}
                                            >
                                                {revealedData.aadhar ? <Eye color={COLORS.success} size={18} /> : <EyeOff color={COLORS.textSecondary} size={18} />}
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.kycRow}>
                                        <View style={styles.kycLeft}>
                                            <View style={[styles.iconBox, { backgroundColor: '#f9731610' }]}>
                                                <CreditCard color="#f97316" size={20} />
                                            </View>
                                            <View style={styles.info}>
                                                <Text style={styles.label}>PAN</Text>
                                                <Text style={styles.value}>{revealedData.pan ? (profile.pan_number || 'N/A') : (profile.pan_number ? `XXXX-XXXX-${profile.pan_number.slice(-4)}` : 'XXXX-XXXX-XXXX')}</Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                                            <TouchableOpacity 
                                                onPress={() => !revealedData.pan && handleReveal('pan')}
                                                activeOpacity={0.7}
                                                style={{ marginLeft: 12 }}
                                                disabled={revealedData.pan}
                                            >
                                                {revealedData.pan ? <Eye color={COLORS.success} size={18} /> : <EyeOff color={COLORS.textSecondary} size={18} />}
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <ProfileItem
                                        label="Bank Account Number"
                                        value={profile.bank_account_number}
                                        icon={Landmark}
                                        iconColor="#0ea5e9"
                                        isSensitive
                                        revealed={revealedData.bank}
                                        onReveal={() => handleReveal('bank')}
                                    />
                                    <ProfileItem
                                        label="IFSC Code"
                                        value={profile.ifsc_code}
                                        icon={Hash}
                                        iconColor="#6366f1"
                                        isSensitive
                                        revealed={revealedData.ifsc}
                                        onReveal={() => handleReveal('ifsc')}
                                    />
                                    <ProfileItem
                                        label="UPI ID"
                                        value={profile.upi_id}
                                        icon={Smartphone}
                                        iconColor="#14b8a6"
                                        isSensitive
                                        revealed={revealedData.upi}
                                        onReveal={() => handleReveal('upi')}
                                    />
                                </View>
                            )}
                    </View>

                    <View style={[styles.section, isDesktop && styles.sectionDesktop, { marginTop: 15 }]}>
                        <View style={styles.card}>
                            <TouchableOpacity style={styles.navRow} onPress={() => navigation.navigate('TermsAndConditions')}>
                                <View style={styles.navLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: '#6366f110' }]}>
                                        <FileText color="#6366f1" size={20} />
                                    </View>
                                    <Text style={[styles.navText, { fontWeight: 'bold' }]}>Terms & Conditions</Text>
                                </View>
                                <ChevronRight color={COLORS.textSecondary} size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.navRow} onPress={() => navigation.navigate('PrivacyPolicy')}>
                                <View style={styles.navLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: '#10b98110' }]}>
                                        <Shield color="#10b981" size={20} />
                                    </View>
                                    <Text style={[styles.navText, { fontWeight: 'bold' }]}>Privacy Policy</Text>
                                </View>
                                <ChevronRight color={COLORS.textSecondary} size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.navRow, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('HelpSupport')}>
                                <View style={styles.navLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: '#f59e0b10' }]}>
                                        <HelpCircle color="#f59e0b" size={20} />
                                    </View>
                                    <Text style={[styles.navText, { fontWeight: 'bold' }]}>Help & Support</Text>
                                </View>
                                <ChevronRight color={COLORS.textSecondary} size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.section, isDesktop && styles.sectionDesktop, { marginTop: 15 }]}>
                        <TouchableOpacity style={[styles.card, styles.navRow, { paddingHorizontal: 20 }]} onPress={() => navigation.navigate('AboutUs')}>
                            <View style={styles.navLeft}>
                                <View style={[styles.iconBox, { backgroundColor: COLORS.secondary + '10' }]}>
                                    <Info color={COLORS.secondary} size={20} />
                                </View>
                                <Text style={[styles.navText, { fontWeight: 'bold' }]}>About Us</Text>
                            </View>
                            <ChevronRight color={COLORS.textSecondary} size={20} />
                        </TouchableOpacity>
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
                                    <Text style={styles.modalSub}>Enter your password to reveal {
                                        ({ aadhar: 'Aadhar', pan: 'PAN', bank: 'Bank Account', ifsc: 'IFSC Code', upi: 'UPI ID' })[passwordModal.type] || 'data'
                                    }</Text>

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

                        {/* Image Picker Modal */}
                        <Modal
                            transparent
                            visible={imageModalVisible}
                            animationType="slide"
                            onRequestClose={() => setImageModalVisible(false)}
                        >
                            <TouchableOpacity 
                                style={styles.modalOverlay} 
                                activeOpacity={1} 
                                onPress={() => setImageModalVisible(false)}
                            >
                                <View style={styles.actionSheetContent}>
                                    <Text style={styles.actionSheetTitle}>Profile Photo</Text>
                                    
                                    <View style={styles.actionOptions}>
                                        <TouchableOpacity 
                                            style={styles.actionOption} 
                                            onPress={() => {
                                                setImageModalVisible(false);
                                                if (Platform.OS === 'web') pickImageFromWeb(true);
                                                else openCamera();
                                            }}
                                        >
                                            <View style={[styles.actionIconBox, { backgroundColor: '#e0f2fe' }]}>
                                                <Camera color="#0284c7" size={24} />
                                            </View>
                                            <Text style={styles.actionOptionText}>Take Photo</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={styles.actionOption} 
                                            onPress={() => {
                                                setImageModalVisible(false);
                                                if (Platform.OS === 'web') pickImageFromWeb(false);
                                                else openGallery();
                                            }}
                                        >
                                            <View style={[styles.actionIconBox, { backgroundColor: '#f0fdf4' }]}>
                                                <ImageIcon color="#16a34a" size={24} />
                                            </View>
                                            <Text style={styles.actionOptionText}>Choose from Gallery</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={styles.actionOption} 
                                            onPress={() => {
                                                setImageModalVisible(false);
                                                removeProfileImage();
                                            }}
                                        >
                                            <View style={[styles.actionIconBox, { backgroundColor: '#fef2f2' }]}>
                                                <Trash2 color="#dc2626" size={24} />
                                            </View>
                                            <Text style={[styles.actionOptionText, { color: '#dc2626' }]}>Remove Photo</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity 
                                        style={styles.actionCancelBtn} 
                                        onPress={() => setImageModalVisible(false)}
                                    >
                                        <Text style={styles.actionCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        </Modal>

                        <TouchableOpacity style={[styles.logoutBtn, isDesktop && styles.logoutBtnDesktop]} onPress={handleLogout}>
                            <Power color={COLORS.error} size={20} />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    contentContainer: {
        paddingBottom: 40,
    },
    contentContainerDesktop: {
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: 'transparent',
    },
    topNav: {
        paddingHorizontal: SPACING.m,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    topNavDesktop: {
        alignItems: 'center',
        paddingTop: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        width: '100%',
        maxWidth: 700,
    },
    backText: {
        fontSize: 16,
        color: COLORS.secondary,
        fontWeight: '600',
        marginLeft: 4,
    },
    header: { 
        padding: SPACING.xl, 
        alignItems: 'center', 
        backgroundColor: COLORS.glassBg, 
        borderBottomWidth: 1, 
        borderBottomColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        })
    },
    headerDesktop: {
        width: '100%',
        maxWidth: 700,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    avatarContainer: { position: 'relative', marginBottom: SPACING.m },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.secondary, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.secondary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.surface },
    name: { fontSize: SIZES.h2, color: COLORS.text, fontWeight: 'bold' },
    email: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
    section: { paddingHorizontal: 15, paddingBottom: 10, marginTop: 10 },
    sectionDesktop: {
        width: '100%',
        maxWidth: 700,
    },
    sectionTitle: { color: COLORS.textSecondary, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: SPACING.m, marginLeft: 4 },
    item: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', paddingVertical: 12, paddingHorizontal: 4, marginBottom: 8 },
    iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    info: { marginLeft: 15, flex: 1 },
    label: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 2 },
    value: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    card: {
        backgroundColor: COLORS.glassBgDark, // Little transparent for sub-section cards
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        })
    },
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.glassBgDark,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        ...Platform.select({
            web: { backdropFilter: 'blur(8px)' }
        })
    },
    accordionTitleRow: { flexDirection: 'row', alignItems: 'center' },
    accordionTitle: { marginLeft: 12, fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    kycRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        marginBottom: 8
    },
    kycLeft: { flexDirection: 'row', alignItems: 'center' },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#10b98120'
    },
    statusText: { marginLeft: 4, fontSize: 12, fontWeight: 'bold', color: '#10b981' },
    navRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    navLeft: { flexDirection: 'row', alignItems: 'center' },
    navText: { marginLeft: 15, fontSize: 16, color: COLORS.text, fontWeight: 'bold' },
    logoutBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: 'rgba(254, 242, 242, 0.4)', 
        paddingVertical: 15, 
        paddingHorizontal: 20, 
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        marginTop: 30,
        marginBottom: 20,
        marginHorizontal: 15,
        elevation: 1,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        ...Platform.select({
            web: { backdropFilter: 'blur(8px)' }
        })
    },
    logoutBtnDesktop: {
        width: 300,
        alignSelf: 'center',
    },
    logoutText: { color: COLORS.error, fontWeight: 'bold', fontSize: 16, marginLeft: 10 },

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
    confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // Action Sheet Style Modal
    actionSheetContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 450,
        alignSelf: 'flex-end',
        ...Platform.select({
            ios: { paddingBottom: 40 },
            android: { paddingBottom: 24 },
            web: { alignSelf: 'center', borderRadius: 24 }
        })
    },
    actionSheetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 24,
        textAlign: 'center'
    },
    actionOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
    },
    actionOption: {
        alignItems: 'center',
        flex: 1,
    },
    actionIconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionOptionText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textAlign: 'center'
    },
    actionCancelBtn: {
        backgroundColor: '#f5f5f5',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center'
    },
    actionCancelText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text
    }
});

export default ProfileScreen;

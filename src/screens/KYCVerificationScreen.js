import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Platform, ActivityIndicator, Image, useWindowDimensions, RefreshControl, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { useAuth } from '../store/AuthContext';
import { CheckCircle, Upload, ArrowLeft, FileText, Camera, CreditCard, ChevronRight, TrendingUp, RefreshCw, RotateCcw } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

// Framer Motion for Web animations
let motion = { div: View, span: Text };
if (Platform.OS === 'web') {
    try {
        const { motion: fm } = require('framer-motion');
        motion = fm;
    } catch (e) {
        console.warn('Framer Motion not available', e);
    }
}

import MainHeader from '../components/MainHeader';
import ScreenBackground from '../components/ScreenBackground';
import AnimatedCard from '../components/AnimatedCard';

const KYCVerificationScreen = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { token: authToken } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [kycStatus, setKycStatus] = useState(null); // 'Not Submitted', 'pending', 'approved', 'rejected'
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [purchasedPackages, setPurchasedPackages] = useState([]);
    const isRejected = kycStatus?.toLowerCase() === 'rejected';
    const isRepurchaseMode = !!route.params?.jumpToStep; // True when user is repurchasing a package
    const [pickerModal, setPickerModal] = useState({ visible: false, field: null });

    const [form, setForm] = useState({
        package_name: '',
        package_amount: '',
        aadhar_number: '',
        pan_number: '',
        bank_account_number: '',
        ifsc_code: '',
        upi_id: '',
        transaction_id: '',
    });
    const [showSuccessCard, setShowSuccessCard] = useState(true);

    const [images, setImages] = useState({
        payment_screenshot: null,
        aadhar_image: null,
        pan_image: null,
    });
    const webFilesRef = useRef({});
    const [prefilledImages, setPrefilledImages] = useState({
        aadhar_image: null,
        pan_image: null,
    });

    const packages = [
        { name: 'Silver Package', amount: '2500' },
        { name: 'Gold Package', amount: '5000' },
        { name: 'Diamond Package', amount: '10000' }
    ];

    const initialize = async () => {
        setLoading(true);
        await Promise.all([
            fetchKYCStatus(),
            fetchPackages()
        ]);
        const prefilled = await fetchPrefillKYC();
        
        if (route.params?.packageName) {
            setForm(prev => ({
                ...prev,
                package_name: route.params.packageName,
                package_amount: route.params.packageAmount ? String(route.params.packageAmount) : ''
            }));
            
            if (route.params?.jumpToStep) {
                // Only jump if we have the critical data (Bank & IFSC) from prefill
                const hasBank = prefilled && prefilled.bank_account_number && prefilled.ifsc_code;
                
                if (hasBank) {
                    setCurrentStep(route.params.jumpToStep);
                    setShowSuccessCard(false);
                } else {
                    console.log('Prefill incomplete, forcing Step 1 for data entry.');
                    setCurrentStep(1);
                    setShowSuccessCard(false);
                }
            }
        }
        setLoading(false);
        setRefreshing(false);
    };

    const onRefresh = () => {
        setRefreshing(true);
        initialize();
    };

    useEffect(() => {
        initialize();
    }, [route.params?.packageName, route.params?.packageAmount, route.params?.jumpToStep]);

    const fetchPackages = async () => {
        try {
            const res = await apiClient.get('/users/purchased-package');
            setPurchasedPackages(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.log('Fetch Packages Error:', e);
        }
    };

    const fetchPrefillKYC = async () => {
        try {
            const res = await apiClient.get('/kyc/prefill');
            if (res.data.success && res.data.data) {
                const { id, aadhar_number, pan_number, bank_account_number, ifsc_code, upi_id, aadhar_image, pan_image } = res.data.data;
                setForm(prev => ({
                    ...prev,
                    aadhar_number: aadhar_number || '',
                    pan_number: pan_number || '',
                    bank_account_number: bank_account_number || '',
                    ifsc_code: ifsc_code || '',
                    upi_id: upi_id || '',
                }));

                // Use the binary serving endpoint for prefilled images
                const aadharUri = `${apiClient.defaults.baseURL}/kyc/user/view-document/aadhar/${id}?token=${authToken}`;
                const panUri = `${apiClient.defaults.baseURL}/kyc/user/view-document/pan/${id}?token=${authToken}`;

                setImages(prev => ({
                    ...prev,
                    aadhar_image: aadharUri,
                    pan_image: panUri,
                }));

                // Keep track of prefilled metadata
                setPrefilledImages({
                    aadhar_image: aadhar_image,
                    pan_image: pan_image,
                });
                
                return res.data.data; // Return data for coordination
            }
            return null;
        } catch (e) {
            console.log('Prefill Error:', e);
            return null;
        }
    };

    const fetchKYCStatus = async () => {
        try {
            const res = await apiClient.get('/kyc/user/kyc-status');
            const status = res.data.status;
            setKycStatus(status);

            if (status && status.toLowerCase() === 'rejected') {
                setForm({
                    ...form,
                    package_name: res.data.package_name || '',
                    package_amount: String(res.data.package_amount || ''),
                    aadhar_number: res.data.aadhar_number || '',
                    pan_number: res.data.pan_number || '',
                    bank_account_number: res.data.bank_account_number || '',
                    ifsc_code: res.data.ifsc_code || '',
                    upi_id: res.data.upi_id || '',
                    transaction_id: res.data.transaction_id || '',
                    admin_remark: res.data.rejection_reason || '' // Match backend alias
                });
                setCurrentStep(1); // Jump to first page (KYC Form) for resubmission
            }
        } catch (e) {
            console.error('Fetch KYC Status Error:', e);
        }
    };

    const pickImageWeb = (field, mode = 'gallery') => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (mode === 'camera') {
            input.capture = 'environment';
        }
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const uri = URL.createObjectURL(file);
                webFilesRef.current[field] = file;
                setImages(prev => ({ ...prev, [field]: uri }));
            }
        };
        input.click();
    };

    const pickImage = (field) => {
        setPickerModal({ visible: true, field });
    };

    const handlePickSource = async (source) => {
        const field = pickerModal.field;
        setPickerModal({ visible: false, field: null });

        if (Platform.OS === 'web') {
            pickImageWeb(field, source);
        } else {
            if (source === 'camera') {
                await openCamera(field);
            } else {
                await openGallery(field);
            }
        }
    };

    const openCamera = async (field) => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera permissions are required to take photos.');
                return;
            }

            let result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            });

            if (!result.canceled) {
                setImages(prev => ({ ...prev, [field]: result.assets[0].uri }));
            }
        } catch (error) {
            console.error('Camera Error:', error);
            Alert.alert('Error', 'Could not open camera.');
        }
    };

    const openGallery = async (field) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Gallery permissions are required to select photos.');
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            });

            if (!result.canceled) {
                setImages(prev => ({ ...prev, [field]: result.assets[0].uri }));
            }
        } catch (error) {
            console.error('Gallery Error:', error);
            Alert.alert('Error', 'Could not open gallery.');
        }
    };

    const handleNext = () => {
        console.log('handleNext clicked, currentStep:', currentStep);
        if (currentStep === 1) {
            // KYC Form
            const { aadhar_number, pan_number, bank_account_number, ifsc_code, upi_id } = form;
            const { aadhar_image, pan_image } = images;

            if (!aadhar_number || !pan_number || !bank_account_number || !ifsc_code || !aadhar_image || !pan_image) {
                const msg = 'Please fill all KYC fields and upload document images.';
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert('Missing Info', msg);
                return;
            }
            if (aadhar_number.length !== 12 || /^(.)\1{11}$/.test(aadhar_number)) {
                const msg = 'Please enter a valid 12-digit Aadhaar number.';
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert('Invalid Aadhaar', msg);
                return;
            }
            if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_number)) {
                const msg = 'Please enter a valid PAN format (e.g. ABCDE1234F).';
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert('Invalid PAN', msg);
                return;
            }
            if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code)) {
                const msg = 'Please enter a valid 11-character IFSC code (e.g., SBIN0012345). Your input is currently ' + ifsc_code.length + ' characters.';
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert('Invalid IFSC', msg);
                return;
            }
            if (upi_id && !upi_id.includes('@')) {
                const msg = 'Please enter a valid UPI ID (e.g. name@upi).';
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert('Invalid UPI', msg);
                return;
            }
            console.log('Validation passed, moving to step 2');
            setCurrentStep(2);
        } else if (currentStep === 2) {
            // Select Package
            if (!form.package_name) {
                Alert.alert('Selection Required', 'Please select a package to continue.');
                return;
            }
            setCurrentStep(3);
        } else if (currentStep === 3) {
            // QR Code
            setCurrentStep(4);
        }
    };

    const handleSubmit = async () => {
        console.log('handleSubmit called, Step 4');
        const { aadhar_number, pan_number, transaction_id } = form;

        // Helper for consistent alerts
        const showAlert = (title, msg) => {
            if (Platform.OS === 'web') window.alert(`${title}: ${msg}`);
            else Alert.alert(title, msg);
        };

        // Detailed validation for better user feedback
        if (!aadhar_number) return showAlert('Error', 'Aadhar number is missing.');
        if (!pan_number) return showAlert('Error', 'PAN number is missing.');
        if (!form.bank_account_number) return showAlert('Error', 'Bank Account number is missing.');
        if (!form.ifsc_code) return showAlert('Error', 'IFSC code is missing.');
        if (!transaction_id) return showAlert('Error', 'Transaction ID is required for payment verification.');
        if (!images.aadhar_image) return showAlert('Error', 'Please upload Aadhar card image.');
        if (!images.pan_image) return showAlert('Error', 'Please upload PAN card image.');
        if (!isRejected && !images.payment_screenshot) {
            return showAlert('Error', 'Please upload the payment screenshot.');
        }

        console.log('Final validation passed, preparing payload...');
        setSubmitting(true);
        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => {
                if (form[key] !== null && form[key] !== undefined) {
                    formData.append(key, form[key]);
                }
            });

            // Log FormData for debugging
            console.log('--- FORM DATA PREVIEW ---');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }

            const getFileData = async (uri, fieldName) => {
                console.log(`Processing file: ${fieldName}, URI: ${uri}`);
                if (Platform.OS === 'web') {
                    // Use stored File object if available (from our HTML input)
                    if (webFilesRef.current[fieldName]) {
                        return webFilesRef.current[fieldName];
                    }
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    const fileName = uri.split('/').pop().split('?')[0] || `${fieldName}.jpg`;
                    return new File([blob], fileName, { type: blob.type });
                } else {
                    const fileName = uri.split('/').pop();
                    const match = /\.(\w+)$/.exec(fileName);
                    const type = match ? `image/${match[1]}` : `image/jpeg`;
                    return { uri, name: fileName || `${fieldName}.jpg`, type };
                }
            };

            if (images.payment_screenshot) {
                formData.append('payment_screenshot', await getFileData(images.payment_screenshot, 'payment'));
            }

            if (images.aadhar_image) {
                if (images.aadhar_image.startsWith('http')) {
                    formData.append('aadhar_image', prefilledImages.aadhar_image);
                } else {
                    formData.append('aadhar_image', await getFileData(images.aadhar_image, 'aadhar'));
                }
            }

            if (images.pan_image) {
                if (images.pan_image.startsWith('http')) {
                    formData.append('pan_image', prefilledImages.pan_image);
                } else {
                    formData.append('pan_image', await getFileData(images.pan_image, 'pan'));
                }
            }

            const endpoint = kycStatus && kycStatus.toLowerCase() === 'rejected' ? 'user/resubmit-kyc' : 'submit';
            const kycApiUrl = `${apiClient.defaults.baseURL}/kyc`.replace(/\/+$/, '');

            const token = await AsyncStorage.getItem('token');
            console.log('Submitting to:', `${kycApiUrl}/${endpoint}`);

            const response = await fetch(`${kycApiUrl}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'x-auth-token': token || '',
                },
                body: formData
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                showAlert('Success', data.msg || 'KYC Submitted Successfully');
                navigation.goBack();
            } else {
                showAlert('Error', data.msg || 'Failed to submit KYC');
            }
        } catch (e) {
            console.error('Submit Error:', e);
            showAlert('Error', 'Network error or server is down. Check console for details.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1a531b" />
            </View>
        );
    }

    if (kycStatus && kycStatus.toLowerCase() === 'pending') {
        const isRepurchasePending = purchasedPackages.length > 0;
        return (
            <ScreenBackground>
                <View style={styles.container}>
                    <MainHeader title={isRepurchasePending ? "Package Status" : "KYC Status"} navigation={navigation} showBack hideProfile={true} />
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <View style={[styles.statusCard, isDesktop && styles.statusCardDesktop]}>
                        {isRepurchasePending ? (
                            <RotateCcw color="#f59e0b" size={64} style={{ marginBottom: 20 }} />
                        ) : (
                            <CheckCircle color="#f59e0b" size={64} style={{ marginBottom: 20 }} />
                        )}
                        <Text style={styles.statusTitle}>{isRepurchasePending ? "Package Repurchase Pending" : "KYC Pending"}</Text>
                        <Text style={styles.statusDesc}>
                            {isRepurchasePending 
                                ? `Your request for the ${form.package_name || 'new'} package is under review. Your identity is already verified.` 
                                : "Your KYC is currently under review by the admin. This usually takes 24-48 hours."}
                        </Text>
                        <TouchableOpacity 
                            style={styles.backBtnLarge} 
                            onPress={() => navigation.navigate('Main')}
                        >
                            <Text style={styles.backBtnText}>Back to Dashboard</Text>
                        </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScreenBackground>
        );
    }

    if (kycStatus && kycStatus.toLowerCase() === 'approved' && showSuccessCard && !isRepurchaseMode) {
        return (
            <ScreenBackground>
                <View style={styles.container}>
                    <MainHeader title="KYC Status" navigation={navigation} showBack hideProfile={true} />
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <View style={[styles.statusCard, isDesktop && styles.statusCardDesktop]}>
                            <CheckCircle color="#10b981" size={64} style={{ marginBottom: 20 }} />
                            <Text style={styles.statusTitle}>KYC Approved</Text>
                            <Text style={styles.statusDesc}>Your KYC has been verified successfully. You can now enjoy full access to the MLM system.</Text>
                            <TouchableOpacity 
                                style={styles.backBtnLarge} 
                                onPress={() => navigation.navigate('Main')}
                            >
                                <Text style={styles.backBtnText}>Go to Dashboard</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScreenBackground>
        );
    }

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <MainHeader 
                    title={isRejected ? 'KYC Resubmission' : (isRepurchaseMode ? 'Purchase' : 'KYC & Purchase')} 
                    navigation={navigation} 
                    showBack
                    hideProfile={true}
                    onBackPress={() => {
                        if (isRejected || currentStep === 1 || (route.params?.jumpToStep && currentStep === route.params.jumpToStep)) {
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            } else {
                                navigation.navigate('Main');
                            }
                        } else {
                            setCurrentStep(currentStep - 1);
                        }
                    }}
                />
                <ScrollView 
                    contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
                >

            {kycStatus && kycStatus.toLowerCase() === 'rejected' && (
                <View style={styles.rejectAlert}>
                    <Text style={styles.rejectTitle}>KYC Rejected</Text>
                    <Text style={styles.rejectRemark}>Remark: {form.admin_remark || 'Please resubmit with clear documents'}</Text>
                </View>
            )}

            {/* Progress Stepper */}
            {isRepurchaseMode ? (
                // Repurchase: show only 2 steps (QR Payment + Confirmation)
                <View style={styles.stepper}>
                    {[1, 2].map((s) => {
                        const actualStep = s === 1 ? 3 : 4;
                        return (
                            <View key={s} style={styles.stepItem}>
                                <motion.div
                                    animate={currentStep === actualStep ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                    style={StyleSheet.flatten([
                                        styles.stepCircle,
                                        currentStep >= actualStep ? styles.stepActive : styles.stepInactive
                                    ])}
                                >
                                    <Text style={styles.stepNum}>{s}</Text>
                                </motion.div>
                                {s < 2 && (
                                    <View style={[styles.stepLine, styles.lineInactive]}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: currentStep > actualStep ? '100%' : '0%' }}
                                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                                            style={{ backgroundColor: '#852834', height: '100%', borderRadius: 2 }}
                                        />
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            ) : (
                // Normal purchase: show all 4 steps
                <View style={styles.stepper}>
                    {[1, 2, 3, 4].map((s) => (
                        <View key={s} style={styles.stepItem}>
                            <motion.div 
                                animate={currentStep === s ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                                transition={{ duration: 0.4 }}
                                style={StyleSheet.flatten([
                                    styles.stepCircle, 
                                    currentStep >= s ? styles.stepActive : styles.stepInactive
                                ])}
                            >
                                <Text style={styles.stepNum}>{s}</Text>
                            </motion.div>
                            {s < 4 && (
                                <View style={[styles.stepLine, styles.lineInactive]}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: currentStep > s ? '100%' : '0%' }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        style={{
                                            backgroundColor: '#852834',
                                            height: '100%',
                                            borderRadius: 2
                                        }}
                                    />
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            )}

            {currentStep === 1 && (
                <View style={[styles.stepContent, isDesktop && styles.stepContentDesktop]}>
                    <Text style={styles.sectionTitle}>Step 1: KYC Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Aadhar Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="12-digit Aadhar Number"
                            value={form.aadhar_number}
                            onChangeText={(v) => setForm({ ...form, aadhar_number: v.replace(/[^0-9]/g, '') })}
                            keyboardType="numeric"
                            maxLength={12}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>PAN Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Valid PAN (ABCDE1234F)"
                            value={form.pan_number}
                            onChangeText={(v) => setForm({ ...form, pan_number: v.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                            autoCapitalize="characters"
                            maxLength={10}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bank Account Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Bank Account Number"
                            value={form.bank_account_number}
                            onChangeText={(v) => setForm({ ...form, bank_account_number: v.replace(/[^0-9]/g, '') })}
                            keyboardType="numeric"
                            maxLength={20}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>IFSC Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Bank IFSC Code (e.g. SBIN0012345)"
                            value={form.ifsc_code}
                            onChangeText={(v) => setForm({ ...form, ifsc_code: v.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                            autoCapitalize="characters"
                            maxLength={11}
                        />
                    </View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>UPI ID (optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="example@upi"
                            value={form.upi_id}
                            onChangeText={(v) => setForm({ ...form, upi_id: v.toLowerCase().replace(/[^a-z0-9@.\-_]/g, '') })}
                            autoCapitalize="none"
                            maxLength={50}
                        />
                    </View>

                    <Text style={styles.label}>Upload Documents</Text>

                    <View style={styles.docRow}>
                        <AnimatedCard style={[styles.docItem, images.aadhar_image && styles.docDone, { flex: 1, marginHorizontal: 5 }]} onPress={() => pickImage('aadhar_image')}>
                            <View style={{ alignItems: 'center', width: '100%' }}>
                                {images.aadhar_image ? (
                                    <Image source={{ uri: images.aadhar_image }} style={styles.docPreview} />
                                ) : (
                                    <FileText color="#666" size={20} />
                                )}
                                <Text style={styles.docText}>Aadhar Card</Text>
                            </View>
                        </AnimatedCard>
                        <AnimatedCard style={[styles.docItem, images.pan_image && styles.docDone, { flex: 1, marginHorizontal: 5 }]} onPress={() => pickImage('pan_image')}>
                            <View style={{ alignItems: 'center', width: '100%' }}>
                                {images.pan_image ? (
                                    <Image source={{ uri: images.pan_image }} style={styles.docPreview} />
                                ) : (
                                    <FileText color="#666" size={20} />
                                )}
                                <Text style={styles.docText}>PAN Card</Text>
                            </View>
                        </AnimatedCard>
                    </View>

                    <TouchableOpacity 
                        style={styles.nextBtn} 
                        onPress={handleNext}
                    >
                        <Text style={styles.nextBtnText}>Continue to Package</Text>
                    </TouchableOpacity>
                </View>
            )}

            {currentStep === 2 && (
                <View style={[styles.stepContent, isDesktop && styles.stepContentDesktop]}>
                    <Text style={styles.sectionTitle}>Step 2: Select Package</Text>
                    <View style={styles.packageList}>
                        {packages.map((pkg) => (
                            <AnimatedCard
                                key={pkg.name}
                                style={[styles.packageCard, form.package_name === pkg.name && styles.packageActive]}
                                onPress={() => setForm({ ...form, package_name: pkg.name, package_amount: pkg.amount })}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <View>
                                        <Text style={styles.packageName}>{pkg.name}</Text>
                                        <Text style={styles.packageAmount}>₹{pkg.amount}</Text>
                                    </View>
                                    {form.package_name === pkg.name && <CheckCircle color="#1a531b" size={24} />}
                                </View>
                            </AnimatedCard>
                        ))}
                    </View>
                    <TouchableOpacity 
                        style={styles.nextBtn} 
                        onPress={handleNext}
                    >
                        <Text style={styles.nextBtnText}>Select & Pay</Text>
                    </TouchableOpacity>
                </View>
            )}

            {currentStep === 3 && (
                <View style={[styles.stepContent, isDesktop && styles.stepContentDesktop]}>
                    <Text style={styles.sectionTitle}>{isRepurchaseMode ? 'Step 1: QR Code Payment' : 'Step 3: QR Code Payment'}</Text>
                    <View style={styles.qrContainer}>
                        <Image source={require('../assets/qr_code.png')} style={styles.qrImage} />
                        <View style={styles.payDetails}>
                            <Text style={styles.payLabel}>Selected Package: <Text style={styles.payVal}>{form.package_name}</Text></Text>
                            <Text style={styles.payLabel}>Amount to Pay: <Text style={styles.payVal}>₹{form.package_amount}</Text></Text>
                        </View>
                        <Text style={styles.qrInstruction}>"Scan the QR code and pay the exact amount."</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.nextBtn} 
                        onPress={handleNext}
                    >
                        <Text style={styles.nextBtnText}>I Have Paid (Upload Screenshot)</Text>
                    </TouchableOpacity>
                </View>
            )}

            {currentStep === 4 && (
                <View style={[styles.stepContent, isDesktop && styles.stepContentDesktop]}>
                    <Text style={styles.sectionTitle}>{isRepurchaseMode ? 'Step 2: Payment Confirmation' : 'Step 4: Payment Confirmation'}</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Transaction ID</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter UPI Transaction ID from payment"
                            value={form.transaction_id}
                            onChangeText={(v) => setForm({ ...form, transaction_id: v.replace(/[^a-zA-Z0-9]/g, '') })}
                            maxLength={30}
                        />
                    </View>

                    <Text style={styles.label}>Payment Screenshot</Text>
                    <TouchableOpacity
                        style={[styles.uploadBig, images.payment_screenshot && styles.uploadDone]}
                        onPress={() => pickImage('payment_screenshot')}
                    >
                        {images.payment_screenshot ? (
                            <Image source={{ uri: images.payment_screenshot }} style={styles.previewImg} />
                        ) : (
                            <View style={styles.uploadInner}>
                                <Upload color="#666" size={48} />
                                <Text style={styles.uploadTitle}>Upload Payment Proof</Text>
                                <Text style={styles.uploadSub}>Accepted: JPG, JPEG, PNG</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Full Application</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
        {/* Source Picker Modal */}
        <Modal
            visible={pickerModal.visible}
            transparent={true}
            animationType={isDesktop ? "fade" : "slide"}
            onRequestClose={() => setPickerModal({ visible: false, field: null })}
        >
            <TouchableOpacity 
                style={[styles.modalOverlay, isDesktop && { justifyContent: 'center', padding: 20 }]} 
                activeOpacity={1} 
                onPress={() => setPickerModal({ visible: false, field: null })}
            >
                <View style={[
                    styles.pickerContainer,
                    isDesktop && { borderRadius: 24, padding: 32 }
                ]}>
                    <Text style={styles.pickerTitle}>Upload Photo</Text>
                    <Text style={styles.pickerSub}>Choose a source for your document</Text>
                    
                    <View style={styles.pickerOptions}>
                        <TouchableOpacity style={styles.pickerBtn} onPress={() => handlePickSource('camera')}>
                            <View style={[styles.pickerIcon, { backgroundColor: '#f0fdf4' }]}>
                                <Camera color={COLORS.secondary} size={28} />
                            </View>
                            <Text style={styles.pickerBtnText}>Camera</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.pickerBtn} onPress={() => handlePickSource('gallery')}>
                            <View style={[styles.pickerIcon, { backgroundColor: '#eff6ff' }]}>
                                <Upload color="#3b82f6" size={28} />
                            </View>
                            <Text style={styles.pickerBtnText}>Files / Gallery</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={styles.pickerCancel} 
                        onPress={() => setPickerModal({ visible: false, field: null })}
                    >
                        <Text style={styles.pickerCancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
        </View>
    </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20 },
    contentDesktop: {
        alignItems: 'center',
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: Platform.OS === 'ios' ? 40 : 10 },
    headerDesktop: { width: '100%', maxWidth: 800 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: '#111' },

    statusCard: { 
        backgroundColor: COLORS.glassBg, 
        borderRadius: 24, 
        padding: 30, 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(16px)' }
        }),
        elevation: 4, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 12,
        width: '100%',
        marginVertical: 20
    },
    statusCardDesktop: {
        maxWidth: 500,
    },
    statusTitle: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 12, textAlign: 'center' },
    statusDesc: { textAlign: 'center', color: '#666', lineHeight: 22 },
    backBtnLarge: { marginTop: 30, backgroundColor: '#1a531b', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    backBtnText: { color: '#fff', fontWeight: '600' },

    rejectAlert: { backgroundColor: '#fee2e2', borderLeftWidth: 4, borderLeftColor: '#ef4444', padding: 15, borderRadius: 8, marginBottom: 20 },
    rejectTitle: { color: '#b91c1c', fontWeight: 'bold', fontSize: 16 },
    rejectRemark: { color: '#7f1d1d', marginTop: 4 },

    stepper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    stepItem: { flexDirection: 'row', alignItems: 'center' },
    stepCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', display: 'flex' },
    stepActive: { backgroundColor: '#852834' },
    stepInactive: { backgroundColor: '#d1d5db' },
    stepNum: { color: '#fff', fontWeight: 'bold' },
    stepLine: { width: 40, height: 4, marginHorizontal: 5, overflow: 'hidden' },
    lineInactive: { backgroundColor: '#e5e7eb' },


    stepContent: { 
        backgroundColor: COLORS.glassBg, 
        borderRadius: 20, 
        padding: 20, 
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        }),
        elevation: 2, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.08, 
        shadowRadius: 8, 
        width: '100%' 
    },
    stepContentDesktop: {
        maxWidth: 800,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 20 },

    packageList: { marginBottom: 20 },
    packageCard: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 16, 
        borderWidth: 1, 
        borderColor: COLORS.glassBorder, 
        borderRadius: 12, 
        marginBottom: 12,
        backgroundColor: COLORS.glassBgDark // Little transparent for sub-cards
    },
    packageActive: { 
        borderColor: COLORS.primary, 
        backgroundColor: 'rgba(240, 253, 244, 0.6)' 
    },
    packageName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
    packageAmount: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginTop: 4 },

    qrContainer: { alignItems: 'center', marginBottom: 20 },
    qrImage: { width: 200, height: 200, marginBottom: 20 },
    payDetails: { backgroundColor: COLORS.glassBgDark, padding: 15, borderRadius: 12, width: '100%', marginBottom: 15, borderWidth: 1, borderColor: COLORS.glassBorder },
    payLabel: { fontSize: 15, color: '#4b5563', marginBottom: 5 },
    payVal: { fontWeight: 'bold', color: COLORS.text },
    qrInstruction: { color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center' },

    uploadBig: { height: 200, borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: '#f9fafb', overflow: 'hidden' },
    uploadDone: { borderStyle: 'solid', borderColor: '#10b981' },
    previewImg: { width: '100%', height: '100%' },
    uploadInner: { alignItems: 'center' },
    uploadTitle: { marginTop: 10, fontSize: 16, fontWeight: '600', color: '#374151' },
    uploadSub: { fontSize: 12, color: '#9ca3af', marginTop: 4 },

    nextBtn: { backgroundColor: '#1a531b', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: { backgroundColor: COLORS.glassBgDark, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 10, padding: 12, fontSize: 16, color: COLORS.text },

    docRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    docItem: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassBgDark, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 10, padding: 12, marginHorizontal: 4, marginBottom: 12 },
    docDone: { borderColor: COLORS.success, backgroundColor: 'rgba(240, 253, 244, 0.6)' },
    docText: { marginLeft: 8, fontSize: 14, color: '#4b5563' },
    docPreview: { width: 30, height: 30, borderRadius: 4, marginRight: 8 },

    submitBtn: { 
        backgroundColor: COLORS.primary, 
        paddingVertical: 18, 
        borderRadius: 12, 
        alignItems: 'center', 
        marginTop: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },

    // Source Picker Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    pickerContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        width: '100%',
        maxWidth: 500,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        ...Platform.select({
            web: { backdropFilter: 'blur(16px)' }
        })
    },
    pickerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 8,
    },
    pickerSub: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
    },
    pickerOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
        gap: 20
    },
    pickerBtn: {
        alignItems: 'center',
        flex: 1,
    },
    pickerIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    pickerBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
    },
    pickerCancel: {
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    pickerCancelText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#475569',
    },
});

export default KYCVerificationScreen;

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Platform, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { useAuth } from '../store/AuthContext';
import { CheckCircle, Upload, ArrowLeft, FileText, Camera, CreditCard, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const KYCVerificationScreen = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { token: authToken } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [kycStatus, setKycStatus] = useState(null); // 'Not Submitted', 'pending', 'approved', 'rejected'
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessCard, setShowSuccessCard] = useState(true);

    const [form, setForm] = useState({
        package_name: '',
        package_amount: '',
        aadhar_number: '',
        pan_number: '',
        transaction_id: '',
    });

    const [images, setImages] = useState({
        payment_screenshot: null,
        aadhar_image: null,
        pan_image: null,
    });
    const [prefilledImages, setPrefilledImages] = useState({
        aadhar_image: null,
        pan_image: null,
    });

    const packages = [
        { name: 'Silver Package', amount: '2500' },
        { name: 'Gold Package', amount: '5000' },
        { name: 'Diamond Package', amount: '10000' }
    ];

    useEffect(() => {
        fetchKYCStatus();
        fetchPrefillKYC();

        if (route.params?.selectedPackage) {
            setForm(prev => ({
                ...prev,
                package_name: route.params.selectedPackage.name,
                package_amount: route.params.selectedPackage.amount
            }));
            if (route.params?.jumpToStep) {
                setCurrentStep(route.params.jumpToStep);
                setShowSuccessCard(false);
            }
        }
    }, [route.params?.selectedPackage, route.params?.jumpToStep]);

    const fetchPrefillKYC = async () => {
        try {
            const res = await apiClient.get('/kyc/prefill');
            if (res.data.success && res.data.data) {
                const { id, aadhar_number, pan_number, aadhar_image, pan_image } = res.data.data;
                setForm(prev => ({
                    ...prev,
                    aadhar_number: aadhar_number || '',
                    pan_number: pan_number || '',
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
            }
        } catch (e) {
            console.log('Prefill Error:', e);
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
                    transaction_id: res.data.transaction_id || '',
                    admin_remark: res.data.rejection_reason || '' // Match backend alias
                });
                setCurrentStep(1); // Jump to first page (KYC Form) for resubmission
            }
        } catch (e) {
            console.error('Fetch KYC Status Error:', e);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async (field) => {
        if (Platform.OS === 'web') {
            // Standard web picker
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Gallery permissions are required.');
                return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            });
            if (!result.canceled) {
                setImages({ ...images, [field]: result.assets[0].uri });
            }
        } else {
            // Mobile: Show Choice
            Alert.alert(
                'Upload Photo',
                'Select a source for your image',
                [
                    { text: 'Take Photo (Camera)', onPress: () => openCamera(field) },
                    { text: 'Choose from Gallery', onPress: () => openGallery(field) },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
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
                mediaTypes: ['images'],
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
        if (currentStep === 1) {
            // KYC Form
            if (!form.aadhar_number || !form.pan_number || !images.aadhar_image || !images.pan_image) {
                Alert.alert('Missing Info', 'Please fill Aadhar/PAN and upload document images.');
                return;
            }
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
        const { aadhar_number, pan_number, transaction_id } = form;
        const isRejected = kycStatus && kycStatus.toLowerCase() === 'rejected';

        // Detailed validation for better user feedback
        if (!aadhar_number) return Alert.alert('Error', 'Aadhar number is missing.');
        if (!pan_number) return Alert.alert('Error', 'PAN number is missing.');
        if (!transaction_id) return Alert.alert('Error', 'Transaction ID is required for payment verification.');
        if (!images.aadhar_image) return Alert.alert('Error', 'Please upload Aadhar card image.');
        if (!images.pan_image) return Alert.alert('Error', 'Please upload PAN card image.');
        if (!isRejected && !images.payment_screenshot) {
            return Alert.alert('Error', 'Please upload the payment screenshot.');
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => formData.append(key, form[key]));

            const getFileData = async (uri, fieldName) => {
                if (Platform.OS === 'web') {
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

            if (images.payment_screenshot) formData.append('payment_screenshot', await getFileData(images.payment_screenshot, 'payment'));

            if (images.aadhar_image) {
                if (images.aadhar_image.startsWith('http')) {
                    // It's a prefilled image url, don't re-upload file, just send filename
                    formData.append('aadhar_image', prefilledImages.aadhar_image);
                } else {
                    formData.append('aadhar_image', await getFileData(images.aadhar_image, 'aadhar'));
                }
            }

            if (images.pan_image) {
                if (images.pan_image.startsWith('http')) {
                    // It's a prefilled image url, don't re-upload file, just send filename
                    formData.append('pan_image', prefilledImages.pan_image);
                } else {
                    formData.append('pan_image', await getFileData(images.pan_image, 'pan'));
                }
            }

            const endpoint = kycStatus && kycStatus.toLowerCase() === 'rejected' ? 'user/resubmit-kyc' : 'submit';
            const kycApiUrl = `${apiClient.defaults.baseURL}/kyc`.replace(/\/+$/, '');

            // Get token for fetch request
            const token = await AsyncStorage.getItem('token');

            // SENIOR ENGINEER FIX: Use Fetch + FormData + Headers
            const response = await fetch(`${kycApiUrl}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'x-auth-token': token || '',
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', data.msg || 'KYC Submitted Successfully');
                navigation.goBack();
            } else {
                console.error('Submission Failed:', data);
                Alert.alert('Error', data.msg || 'Failed to submit KYC');
            }
        } catch (e) {
            console.error('Submit Error:', e);
            if (e.response && e.response.data) {
                console.error('Server Error Data:', e.response.data);
                Alert.alert('Error', e.response.data.msg || 'Failed to submit KYC');
            } else {
                Alert.alert('Error', 'Network error or server is down');
            }
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
        return (
            <View style={styles.container}>
                <View style={[styles.statusCard, isDesktop && styles.statusCardDesktop]}>
                    <CheckCircle color="#f59e0b" size={64} style={{ marginBottom: 20 }} />
                    <Text style={styles.statusTitle}>KYC Pending</Text>
                    <Text style={styles.statusDesc}>Your KYC is currently under review by the admin. This usually takes 24-48 hours.</Text>
                    <TouchableOpacity style={styles.backBtnLarge} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (kycStatus && kycStatus.toLowerCase() === 'approved' && showSuccessCard) {
        return (
            <View style={styles.container}>
                <View style={[styles.statusCard, isDesktop && styles.statusCardDesktop]}>
                    <CheckCircle color="#10b981" size={64} style={{ marginBottom: 20 }} />
                    <Text style={styles.statusTitle}>KYC Approved</Text>
                    <Text style={styles.statusDesc}>Your KYC has been verified successfully. You can now enjoy full access to the MLM system.</Text>
                    <TouchableOpacity style={styles.backBtnLarge} onPress={() => navigation.goBack()}>
                        <Text style={styles.backBtnText}>Great!</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}>
            <View style={[styles.header, isDesktop && styles.headerDesktop]}>
                <TouchableOpacity onPress={() => {
                    const isRejected = kycStatus && kycStatus.toLowerCase() === 'rejected';
                    if (isRejected || currentStep === 1 || (currentStep === 2 && !showSuccessCard)) {
                        navigation.goBack();
                    } else {
                        setCurrentStep(currentStep - 1);
                    }
                }}>
                    <ArrowLeft color="#333" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {kycStatus?.toLowerCase() === 'rejected' ? 'KYC Resubmission' : 'KYC & Purchase'}
                </Text>
            </View>

            {kycStatus && kycStatus.toLowerCase() === 'rejected' && (
                <View style={styles.rejectAlert}>
                    <Text style={styles.rejectTitle}>KYC Rejected</Text>
                    <Text style={styles.rejectRemark}>Remark: {form.admin_remark || 'Please resubmit with clear documents'}</Text>
                </View>
            )}

            {/* Progress Stepper */}
            <View style={styles.stepper}>
                {[1, 2, 3, 4].map((s) => (
                    <View key={s} style={styles.stepItem}>
                        <View style={[styles.stepCircle, currentStep >= s ? styles.stepActive : styles.stepInactive]}>
                            <Text style={styles.stepNum}>{s}</Text>
                        </View>
                        {s < 4 && <View style={[styles.stepLine, currentStep > s ? styles.lineActive : styles.lineInactive]} />}
                    </View>
                ))}
            </View>

            {currentStep === 1 && (
                <View style={[styles.stepContent, isDesktop && styles.stepContentDesktop]}>
                    <Text style={styles.sectionTitle}>Step 1: KYC Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Aadhar Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="12-digit Aadhar Number"
                            value={form.aadhar_number}
                            onChangeText={(v) => setForm({ ...form, aadhar_number: v })}
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
                            onChangeText={(v) => setForm({ ...form, pan_number: v })}
                            autoCapitalize="characters"
                            maxLength={10}
                        />
                    </View>

                    <Text style={styles.label}>Upload Documents</Text>

                    <View style={styles.docRow}>
                        <TouchableOpacity style={[styles.docItem, images.aadhar_image && styles.docDone]} onPress={() => pickImage('aadhar_image')}>
                            {images.aadhar_image ? (
                                <Image source={{ uri: images.aadhar_image }} style={styles.docPreview} />
                            ) : (
                                <FileText color="#666" size={20} />
                            )}
                            <Text style={styles.docText}>Aadhar Card</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.docItem, images.pan_image && styles.docDone]} onPress={() => pickImage('pan_image')}>
                            {images.pan_image ? (
                                <Image source={{ uri: images.pan_image }} style={styles.docPreview} />
                            ) : (
                                <FileText color="#666" size={20} />
                            )}
                            <Text style={styles.docText}>PAN Card</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                        <Text style={styles.nextBtnText}>Continue to Package</Text>
                    </TouchableOpacity>
                </View>
            )}

            {currentStep === 2 && (
                <View style={[styles.stepContent, isDesktop && styles.stepContentDesktop]}>
                    <Text style={styles.sectionTitle}>Step 2: Select Package</Text>
                    <View style={styles.packageList}>
                        {packages.map((pkg) => (
                            <TouchableOpacity
                                key={pkg.name}
                                style={[styles.packageCard, form.package_name === pkg.name && styles.packageActive]}
                                onPress={() => setForm({ ...form, package_name: pkg.name, package_amount: pkg.amount })}
                            >
                                <View>
                                    <Text style={styles.packageName}>{pkg.name}</Text>
                                    <Text style={styles.packageAmount}>₹{pkg.amount}</Text>
                                </View>
                                {form.package_name === pkg.name && <CheckCircle color="#1a531b" size={24} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                        <Text style={styles.nextBtnText}>Select & Pay</Text>
                    </TouchableOpacity>
                </View>
            )}

            {currentStep === 3 && (
                <View style={[styles.stepContent, isDesktop && styles.stepContentDesktop]}>
                    <Text style={styles.sectionTitle}>Step 3: QR Code Payment</Text>
                    <View style={styles.qrContainer}>
                        <Image source={require('../assets/qr_code.png')} style={styles.qrImage} />
                        <View style={styles.payDetails}>
                            <Text style={styles.payLabel}>Selected Package: <Text style={styles.payVal}>{form.package_name}</Text></Text>
                            <Text style={styles.payLabel}>Amount to Pay: <Text style={styles.payVal}>₹{form.package_amount}</Text></Text>
                        </View>
                        <Text style={styles.qrInstruction}>"Scan the QR code and pay the exact amount."</Text>
                    </View>
                    <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                        <Text style={styles.nextBtnText}>I Have Paid (Upload Screenshot)</Text>
                    </TouchableOpacity>
                </View>
            )}

            {currentStep === 4 && (
                <View style={[styles.stepContent, isDesktop && styles.stepContentDesktop]}>
                    <Text style={styles.sectionTitle}>Step 4: Payment Confirmation</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Transaction ID</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter UPI Transaction ID from payment"
                            value={form.transaction_id}
                            onChangeText={(v) => setForm({ ...form, transaction_id: v })}
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
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20 },
    contentDesktop: {
        alignItems: 'center',
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: Platform.OS === 'ios' ? 40 : 10 },
    headerDesktop: { width: '100%', maxWidth: 800 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: '#111' },

    statusCard: { flex: 1, backgroundColor: '#fff', margin: 40, borderRadius: 24, padding: 30, alignItems: 'center', justifyContent: 'center', elevation: 4 },
    statusCardDesktop: {
        maxWidth: 600,
        alignSelf: 'center',
        maxHeight: 400,
        marginTop: 100,
    },
    statusTitle: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 12 },
    statusDesc: { textAlign: 'center', color: '#666', lineHeight: 22 },
    backBtnLarge: { marginTop: 30, backgroundColor: '#1a531b', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    backBtnText: { color: '#fff', fontWeight: '600' },

    rejectAlert: { backgroundColor: '#fee2e2', borderLeftWidth: 4, borderLeftColor: '#ef4444', padding: 15, borderRadius: 8, marginBottom: 20 },
    rejectTitle: { color: '#b91c1c', fontWeight: 'bold', fontSize: 16 },
    rejectRemark: { color: '#7f1d1d', marginTop: 4 },

    stepper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    stepItem: { flexDirection: 'row', alignItems: 'center' },
    stepCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    stepActive: { backgroundColor: '#1a531b' },
    stepInactive: { backgroundColor: '#d1d5db' },
    stepNum: { color: '#fff', fontWeight: 'bold' },
    stepLine: { width: 40, height: 4, marginHorizontal: 5 },
    lineActive: { backgroundColor: '#1a531b' },
    lineInactive: { backgroundColor: '#d1d5db' },

    stepContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2, width: '100%' },
    stepContentDesktop: {
        maxWidth: 800,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 20 },

    packageList: { marginBottom: 20 },
    packageCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, marginBottom: 12 },
    packageActive: { borderColor: '#1a531b', backgroundColor: '#f0fdf4' },
    packageName: { fontSize: 16, fontWeight: '600' },
    packageAmount: { fontSize: 20, fontWeight: 'bold', color: '#1a531b', marginTop: 4 },

    qrContainer: { alignItems: 'center', marginBottom: 20 },
    qrImage: { width: 200, height: 200, marginBottom: 20 },
    payDetails: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 12, width: '100%', marginBottom: 15 },
    payLabel: { fontSize: 15, color: '#4b5563', marginBottom: 5 },
    payVal: { fontWeight: 'bold', color: '#111' },
    qrInstruction: { color: '#6b7280', fontStyle: 'italic', textAlign: 'center' },

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
    input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 16 },

    docRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    docItem: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginHorizontal: 4, marginBottom: 12 },
    docDone: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
    docText: { marginLeft: 8, fontSize: 14, color: '#4b5563' },
    docPreview: { width: 30, height: 30, borderRadius: 4, marginRight: 8 },

    submitBtn: { backgroundColor: '#1a531b', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default KYCVerificationScreen;

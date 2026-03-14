import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';

const KYCUploadScreen = ({ navigation }) => {
    const [aadhaarNum, setAadhaarNum] = useState('');
    const [panNum, setPanNum] = useState('');
    const [aadhaarImg, setAadhaarImg] = useState(null);
    const [panImg, setPanImg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('not_submitted'); // not_submitted, pending, approved, rejected
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchKYCStatus();
    }, []);

    const fetchKYCStatus = async () => {
        try {
            const res = await apiClient.get('/kyc/status');
            setStatus(res.data.status);
            if (res.data.rejection_reason) setRejectionReason(res.data.rejection_reason);
        } catch (error) {
            console.error('Error fetching KYC status', error);
        }
    };

    const pickImage = async (type) => {
        if (Platform.OS === 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Gallery permissions are required.');
                return;
            }
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            });
            if (!result.canceled) {
                if (type === 'aadhaar') setAadhaarImg(result.assets[0]);
                else setPanImg(result.assets[0]);
            }
        } else {
            Alert.alert(
                'Upload Photo',
                'Select a source for your image',
                [
                    { text: 'Take Photo (Camera)', onPress: () => openCamera(type) },
                    { text: 'Choose from Gallery', onPress: () => openGallery(type) },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        }
    };

    const openCamera = async (type) => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permissions are required.');
            return;
        }
        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!result.canceled) {
            if (type === 'aadhaar') setAadhaarImg(result.assets[0]);
            else setPanImg(result.assets[0]);
        }
    };

    const openGallery = async (type) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery permissions are required.');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!result.canceled) {
            if (type === 'aadhaar') setAadhaarImg(result.assets[0]);
            else setPanImg(result.assets[0]);
        }
    };

    const handleSubmit = async () => {
        if (!aadhaarNum || !panNum || !aadhaarImg || !panImg) {
            Alert.alert('Error', 'Please fill all details and upload both images');
            return;
        }

        if (aadhaarNum.length !== 12) {
            Alert.alert('Error', 'Aadhaar must be 12 digits');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('aadhaar_number', aadhaarNum);
        formData.append('pan_number', panNum);

        formData.append('aadhaar_image', {
            uri: aadhaarImg.uri,
            name: 'aadhaar.jpg',
            type: 'image/jpeg',
        });

        formData.append('pan_image', {
            uri: panImg.uri,
            name: 'pan.jpg',
            type: 'image/jpeg',
        });

        try {
            await apiClient.post('/kyc/submit', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            Alert.alert('Success', 'KYC submitted successfully. Status: Pending Approval', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Submission Failed', error.response?.data?.msg || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'approved') {
        return (
            <View style={styles.centered}>
                <CheckCircle size={80} color={COLORS.success} />
                <Text style={styles.statusTitle}>KYC Approved!</Text>
                <Text style={styles.statusText}>Your account is fully verified. You can now purchase packages and access all features.</Text>
                <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
                    <Text style={styles.buttonText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (status === 'pending') {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.statusTitle}>Verification Pending</Text>
                <Text style={styles.statusText}>We are currently reviewing your documents. This usually takes 24-48 hours. Please check back later.</Text>
                <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
                    <Text style={styles.buttonText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <FileText size={40} color={COLORS.primary} />
                <Text style={styles.title}>KYC Verification</Text>
                <Text style={styles.subtitle}>Upload your documents to unlock full platform features.</Text>
            </View>

            {status === 'rejected' && (
                <View style={styles.errorBox}>
                    <AlertCircle size={20} color={COLORS.error} />
                    <Text style={styles.errorText}>KYC Rejected: {rejectionReason || 'Please upload valid documents.'}</Text>
                </View>
            )}

            <View style={styles.form}>
                <Text style={styles.label}>Aadhaar Card Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012"
                    placeholderTextColor="#999"
                    value={aadhaarNum}
                    onChangeText={setAadhaarNum}
                    keyboardType="numeric"
                    maxLength={12}
                />

                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('aadhaar')}>
                    {aadhaarImg ? (
                        <Image source={{ uri: aadhaarImg.uri }} style={styles.preview} />
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <Camera size={24} color={COLORS.primary} />
                            <Text style={styles.uploadText}>Upload Aadhaar Front</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={{ height: 20 }} />

                <Text style={styles.label}>PAN Card Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="ABCDE1234F"
                    placeholderTextColor="#999"
                    value={panNum}
                    onChangeText={setPanNum}
                    autoCapitalize="characters"
                    maxLength={10}
                />

                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('pan')}>
                    {panImg ? (
                        <Image source={{ uri: panImg.uri }} style={styles.preview} />
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <Upload size={24} color={COLORS.primary} />
                            <Text style={styles.uploadText}>Upload PAN Card Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit for Review</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { padding: 20, paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#fff' },
    header: { alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, marginTop: 10 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10 },
    statusTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 20 },
    statusText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10, lineHeight: 24, marginBottom: 30 },
    errorBox: { flexDirection: 'row', backgroundColor: '#fff0f0', padding: 12, borderRadius: 8, marginBottom: 20, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: COLORS.error },
    errorText: { color: COLORS.error, marginLeft: 10, fontWeight: '600' },
    form: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 4 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#f5f5f5', padding: 14, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
    uploadBtn: { backgroundColor: '#f0f4f0', height: 180, borderRadius: 12, borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.primary, overflow: 'hidden' },
    uploadPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    uploadText: { color: COLORS.primary, marginTop: 10, fontWeight: '600' },
    preview: { width: '100%', height: '100%' },
    submitBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
    submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    button: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 8 },
    buttonText: { color: '#fff', fontWeight: 'bold' }
});

export default KYCUploadScreen;

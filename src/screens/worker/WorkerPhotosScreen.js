import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert, Modal, TextInput, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import api, { getServerUrl } from '../../utils/api';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const WorkerPhotosScreen = () => {
    const { projects } = useApp();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // For Description Modal
    const [descModal, setDescModal] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const [description, setDescription] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            const res = await api.get('/photos');
            console.log('Fetched photos:', res.data?.length);
            setPhotos(res.data);
        } catch (e) {
            console.error('Fetch photos error:', e.response?.data || e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
        if (projects && projects.length > 0) {
            setSelectedProjectId(projects[0]._id || projects[0].id);
        }
    }, [projects]);

    const handleUploadOptions = () => {
        Alert.alert(
            'Upload Photo',
            'How would you like to add a photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Take a Photo', onPress: capturePhoto },
                { text: 'Choose from Gallery', onPress: pickImage }
            ]
        );
    };

    const capturePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera permission is required!');
                return;
            }

            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaType.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setTempImage(result.assets[0].uri);
                setDescription('');
                setDescModal(true);
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', 'There was an issue opening the camera.');
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Gallery permission is required!');
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaType.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setTempImage(result.assets[0].uri);
                setDescription('');
                setDescModal(true);
            }
        } catch (error) {
            console.error('Gallery error:', error);
            Alert.alert('Error', 'There was an issue opening the gallery.');
        }
    };

    const uploadImage = async () => {
        if (!tempImage) return;
        if (!selectedProjectId) {
            Alert.alert('Required', 'Please select a project before uploading.');
            return;
        }

        const localUri = tempImage;
        const note = description || 'Site Progress Photo';

        try {
            setUploading(true);
            setDescModal(false);
            console.log('Starting upload for:', localUri);

            const formData = new FormData();
            formData.append('image', {
                uri: Platform.OS === 'android' ? localUri : localUri.replace('file://', ''),
                name: localUri.split('/').pop() || 'photo.jpg',
                type: 'image/jpeg'
            });
            formData.append('description', note);
            formData.append('projectId', selectedProjectId);

            const res = await api.post('/photos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            console.log('Upload success:', res.data?._id);

            // PREPEND to state immediately so it shows up at the top
            setPhotos(prev => [res.data, ...prev]);

            Alert.alert('Success', 'Photo uploaded successfully!');
        } catch (error) {
            console.error('Image upload error:', error.response?.data || error.message);
            Alert.alert('Upload Failed', 'Backend Error: ' + (error.response?.data?.message || 'Check connection'));
        } finally {
            setUploading(false);
            setTempImage(null);
            setDescription('');
        }
    };

    return (
        <View style={styles.container}>
            <WorkerHeader title="Site Photos & Media" />

            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="camera-outline" size={80} color="#E2E8F0" />
                <Text style={styles.emptyTitle}>Site Photos</Text>
                <Text style={styles.emptySubtitle}>Content is being updated by the Project Manager.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 10 },
    brandingRow: { marginBottom: 16 },
    mainSubtitle: { fontSize: 24, fontWeight: '900', color: '#2563EB', letterSpacing: 1.5, marginTop: 4, textTransform: 'uppercase' },
    list: { padding: 16, paddingBottom: 120 },
    photoCard: {
        width: (width - 48) / 2,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        marginHorizontal: 4
    },
    photoImg: { width: '100%', height: 160, backgroundColor: '#F1F5F9' },
    photoBody: { padding: 12 },
    photoTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
    photoMeta: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, marginTop: 4, textTransform: 'uppercase' },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 12 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
    emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginTop: 16 },
    emptySubtitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 32, padding: 24, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 12 },
    previewImage: { width: '100%', height: 180, borderRadius: 20, marginBottom: 16 },
    modalLabel: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    projectList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20, width: '100%' },
    projectItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    projectItemActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    projectItemText: { fontSize: 11, fontWeight: '700', color: '#475569' },
    projectItemTextActive: { color: '#fff' },
    descInput: { width: '100%', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, fontSize: 13, color: '#1E293B', height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
    cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    cancelBtnText: { color: '#64748B', fontWeight: '800' },
    uploadBtn: { flex: 2, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 16, alignItems: 'center', elevation: 4 },
    uploadBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 }
});

export default WorkerPhotosScreen;

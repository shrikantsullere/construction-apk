import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    Image, Dimensions, ActivityIndicator, Alert, Modal, 
    TextInput, Platform, ScrollView, Animated, SafeAreaView 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import api, { getServerUrl } from '../../utils/api';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const WorkerPhotosScreen = () => {
    const { projects, user } = useApp();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    // Filtering
    const [activeFilter, setActiveFilter] = useState('All');
    const [filteredPhotos, setFilteredPhotos] = useState([]);

    // For Description/Upload Modal
    const [uploadModal, setUploadModal] = useState(false);
    const [previewModal, setPreviewModal] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    
    const [tempImage, setTempImage] = useState(null);
    const [description, setDescription] = useState('');
    const [targetProjectId, setTargetProjectId] = useState(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            const res = await api.get('/photos');
            setPhotos(res.data);
            setFilteredPhotos(res.data);
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        } catch (e) {
            console.error('Fetch photos error:', e.response?.data || e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
        if (projects && projects.length > 0) {
            setTargetProjectId(projects[0]._id || projects[0].id);
        }
    }, [projects]);

    useEffect(() => {
        if (activeFilter === 'All') {
            setFilteredPhotos(photos);
        } else {
            setFilteredPhotos(photos.filter(p => p.projectId?._id === activeFilter || p.projectId === activeFilter));
        }
    }, [activeFilter, photos]);

    const handlePick = async (mode) => {
        try {
            const hasPermission = mode === 'camera' 
                ? (await ImagePicker.requestCameraPermissionsAsync()).status === 'granted'
                : (await ImagePicker.requestMediaLibraryPermissionsAsync()).status === 'granted';

            if (!hasPermission) {
                Alert.alert('Permission Denied', `${mode === 'camera' ? 'Camera' : 'Gallery'} permission is required.`);
                return;
            }

            const result = mode === 'camera' 
                ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 })
                : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });

            if (!result.canceled) {
                setTempImage(result.assets[0].uri);
                setUploadModal(true);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to acquire image');
        }
    };

    const uploadImage = async () => {
        if (!tempImage || !targetProjectId) {
            Alert.alert('Required', 'Please select a project and image');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('image', {
                uri: Platform.OS === 'android' ? tempImage : tempImage.replace('file://', ''),
                name: `site_photo_${Date.now()}.jpg`,
                type: 'image/jpeg'
            });
            formData.append('description', description || 'Site Progress Photo');
            formData.append('projectId', targetProjectId);

            const res = await api.post('/photos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setPhotos(prev => [res.data, ...prev]);
            setUploadModal(false);
            setTempImage(null);
            setDescription('');
            Alert.alert('Success', 'Photo uploaded to site gallery.');
        } catch (error) {
            Alert.alert('Upload Failed', error.response?.data?.message || 'Server connection error');
        } finally {
            setUploading(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerTop}>
            <View style={styles.subHeaderRow}>
                <View style={styles.titleSection}>
                    <Text style={styles.headerTitle}>Site Photos</Text>
                    <Text style={styles.headerLabel}>PROJECT DOCUMENTATION</Text>
                </View>
                <TouchableOpacity 
                    style={styles.pageUploadBtn} 
                    onPress={() => Alert.alert('Upload Media', 'Select source', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Camera', onPress: () => handlePick('camera') },
                        { text: 'Gallery', onPress: () => handlePick('library') },
                    ])}
                >
                    <MaterialCommunityIcons name="plus-circle" size={18} color="#fff" />
                    <Text style={styles.pageUploadBtnText}>Upload New</Text>
                </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
                <TouchableOpacity 
                    style={[styles.filterChip, activeFilter === 'All' && styles.filterChipActive]}
                    onPress={() => setActiveFilter('All')}
                >
                    <Text style={[styles.filterText, activeFilter === 'All' && styles.filterTextActive]}>All Projects</Text>
                </TouchableOpacity>
                {projects.map(p => (
                    <TouchableOpacity 
                        key={p._id || p.id}
                        style={[styles.filterChip, activeFilter === (p._id || p.id) && styles.filterChipActive]}
                        onPress={() => setActiveFilter(p._id || p.id)}
                    >
                        <Text style={[styles.filterText, activeFilter === (p._id || p.id) && styles.filterTextActive]}>{p.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderPhoto = ({ item }) => (
        <TouchableOpacity 
            style={styles.photoCard} 
            activeOpacity={0.9}
            onPress={() => { setSelectedPhoto(item); setPreviewModal(true); }}
        >
            <Image source={{ uri: getServerUrl(item.imageUrl) }} style={styles.photoImg} />
            <View style={styles.photoOverlay}>
                <View style={styles.projectTag}>
                    <Text style={styles.projectTagText} numberOfLines={1}>{item.projectId?.name || 'General'}</Text>
                </View>
            </View>
            <View style={styles.photoInfo}>
                <Text style={styles.photoDesc} numberOfLines={1}>{item.description || 'No description'}</Text>
                <Text style={styles.photoDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <WorkerHeader 
                hideSearch={true} 
                title="Site Photos" 
            />
            
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Synchronizing Media...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredPhotos}
                    keyExtractor={item => item._id || item.id}
                    renderItem={renderPhoto}
                    numColumns={2}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={styles.listContainer}
                    columnWrapperStyle={styles.row}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="image-off-outline" size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>No photos found for this site.</Text>
                        </View>
                    }
                />
            )}

            {/* UPLOAD MODAL */}
            <Modal visible={uploadModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Upload to Site</Text>
                            <TouchableOpacity onPress={() => setUploadModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <Image source={{ uri: tempImage }} style={styles.previewThumb} />

                        <Text style={styles.inputLabel}>SELECT PROJECT</Text>
                        <View style={styles.pickerContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                                {projects.map(p => (
                                    <TouchableOpacity 
                                        key={p._id || p.id}
                                        style={[styles.projChip, targetProjectId === (p._id || p.id) && styles.projChipActive]}
                                        onPress={() => setTargetProjectId(p._id || p.id)}
                                    >
                                        <Text style={[styles.projChipText, targetProjectId === (p._id || p.id) && styles.projChipActiveText]}>{p.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <Text style={styles.inputLabel}>DESCRIPTION / NOTES</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="Add site context..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />

                        <TouchableOpacity 
                            style={[styles.mainUploadBtn, uploading && { opacity: 0.7 }]}
                            onPress={uploadImage}
                            disabled={uploading}
                        >
                            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainUploadBtnText}>CONFIRM UPLOAD</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* PREVIEW MODAL */}
            <Modal visible={previewModal} transparent animationType="fade">
                <View style={styles.fullPreviewOverlay}>
                    <TouchableOpacity style={styles.closeFull} onPress={() => setPreviewModal(false)}>
                        <MaterialCommunityIcons name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                    {selectedPhoto && (
                        <View style={styles.fullContent}>
                            <Image source={{ uri: getServerUrl(selectedPhoto.imageUrl) }} style={styles.fullImage} resizeMode="contain" />
                            <View style={styles.fullFooter}>
                                <Text style={styles.fullProjName}>{selectedPhoto.projectId?.name || 'General Site'}</Text>
                                <Text style={styles.fullDesc}>{selectedPhoto.description}</Text>
                                <Text style={styles.fullMeta}>Uploaded by {selectedPhoto.uploadedBy?.fullName || 'Worker'} on {new Date(selectedPhoto.createdAt).toLocaleDateString()}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { paddingBottom: 100 },
    headerTop: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    subHeader: { marginBottom: 15 },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    headerLabel: { fontSize: 10, fontWeight: '900', color: '#2563EB', letterSpacing: 1.5, marginTop: 2 },
    filterBar: { paddingVertical: 5 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    filterChipActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
    filterText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    filterTextActive: { color: '#fff' },
    row: { justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 16 },
    subHeaderRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15
    },
    titleSection: { flex: 1 },
    pageUploadBtn: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
        ...SHADOWS.small
    },
    pageUploadBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '900',
    },
    photoCard: { width: COLUMN_WIDTH, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', ...SHADOWS.small, borderWidth: 1, borderColor: '#F1F5F9' },
    photoImg: { width: '100%', height: COLUMN_WIDTH, backgroundColor: '#F1F5F9' },
    photoOverlay: { position: 'absolute', top: 10, left: 10 },
    projectTag: { backgroundColor: 'rgba(15, 23, 42, 0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    projectTagText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    photoInfo: { padding: 12 },
    photoDesc: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
    photoDate: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 4 },
    loadingText: { marginTop: 15, fontSize: 13, fontWeight: '700', color: '#64748B' },
    emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyText: { marginTop: 12, fontSize: 14, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, minHeight: '60%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    previewThumb: { width: '100%', height: 180, borderRadius: 20, marginBottom: 20 },
    inputLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginBottom: 10 },
    projChip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F8FAFC', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    projChipActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
    projChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    projChipActiveText: { color: '#2563EB' },
    input: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 15, fontSize: 15, color: '#0F172A', height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 5, marginBottom: 20 },
    mainUploadBtn: { backgroundColor: '#2563EB', paddingVertical: 18, borderRadius: 18, alignItems: 'center', ...SHADOWS.small },
    mainUploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

    // Full Preview
    fullPreviewOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
    closeFull: { position: 'absolute', top: 50, right: 20, zIndex: 100 },
    fullContent: { flex: 1, justifyContent: 'center' },
    fullImage: { width: '100%', height: '70%' },
    fullFooter: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20, borderRadius: 20 },
    fullProjName: { fontSize: 12, fontWeight: '900', color: '#2563EB', textTransform: 'uppercase' },
    fullDesc: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 5 },
    fullMeta: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginTop: 10 }
});

export default WorkerPhotosScreen;

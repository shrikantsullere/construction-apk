import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert, Modal, TextInput, StatusBar, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import api, { getServerUrl } from '../../utils/api';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const ProjectManagerPhotosScreen = () => {
    const { projects } = useApp();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState('all');

    // For Upload Modal
    const [uploadModal, setUploadModal] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const [externalUrl, setExternalUrl] = useState('');
    const [description, setDescription] = useState('');
    const [uploadProjectId, setUploadProjectId] = useState('none');
    const [searchQuery, setSearchQuery] = useState('');

    // Custom Selector State
    const [selVisible, setSelVisible] = useState(false);
    const [selTitle, setSelTitle] = useState('');
    const [selOptions, setSelOptions] = useState([]);
    const [selOnSelect, setSelOnSelect] = useState(() => () => {});

    const selectedProjectLabel = selectedProjectId === 'all' ? 'All Projects' : (projects.find(p => (p._id || p.id) === selectedProjectId)?.name || 'Select Project');

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            const res = await api.get('/photos');
            setPhotos(res.data);
        } catch (e) {
            console.error('Fetch photos error:', e.response?.data || e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, [projects]);

    const filteredPhotos = (photos || []).filter(p => {
        const matchesProject = selectedProjectId === 'all' || (p.projectId?._id || p.projectId) === selectedProjectId;
        const matchesSearch = (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (p.projectId?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesProject && matchesSearch;
    });

    const getPhotoCount = (pid) => {
        if (pid === 'all') return photos.length;
        return photos.filter(p => (p.projectId?._id || p.projectId) === pid).length;
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Gallery permission is required!');
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setTempImage(result.assets[0].uri);
                setExternalUrl(''); // reset external url if local file selected
            }
        } catch (error) {
            console.error('Gallery error:', error);
            Alert.alert('Error', 'There was an issue opening the gallery.');
        }
    };

    const uploadImage = async () => {
        if (!tempImage && !externalUrl) {
            Alert.alert('Required', 'Please select a file or provide an Image URL.');
            return;
        }

        const note = description || 'Site Progress Photo';

        try {
            setUploading(true);
            
            const formData = new FormData();
            if (tempImage) {
                formData.append('image', {
                    uri: Platform.OS === 'android' ? tempImage : tempImage.replace('file://', ''),
                    name: tempImage.split('/').pop() || 'photo.jpg',
                    type: 'image/jpeg'
                });
            } else if (externalUrl) {
                formData.append('imageUrl', externalUrl);
            }

            formData.append('description', note);
            if (uploadProjectId !== 'none') {
                formData.append('projectId', uploadProjectId);
            }

            const res = await api.post('/photos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setPhotos(prev => [res.data, ...prev]);
            Alert.alert('Success', 'Photo uploaded successfully!');
            setUploadModal(false);
        } catch (error) {
            Alert.alert('Upload Failed', 'Check connection or retry');
        } finally {
            setUploading(false);
            setTempImage(null);
            setExternalUrl('');
            setDescription('');
            setUploadProjectId('none');
        }
    };

    const handleExternalUrlChange = (text) => {
        setExternalUrl(text);
        if (text) setTempImage(null); // clear local file if url typed
    };

    const openUploadModal = () => {
        setTempImage(null);
        setExternalUrl('');
        setDescription('');
        setUploadProjectId('none');
        setUploadModal(true);
    };

    const openDropdown = (title, options, onSelect) => {
        setSelTitle(title);
        setSelOptions(options);
        setSelOnSelect(() => (val) => {
            onSelect(val);
            setSelVisible(false);
        });
        setSelVisible(true);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="Site Photos" />

            <View style={styles.pageHeader}>
                <Text style={styles.pageTitle}>Site Photos</Text>
                <Text style={styles.pageSubtitle}>Centralized gallery for all project documentation.</Text>

                <View style={styles.actionRow}>
                    <TouchableOpacity 
                        style={styles.customDropdownBtn}
                        onPress={() => openDropdown('Filter By Project', 
                            [{ label: 'All Projects', value: 'all', icon: 'layers' }, ...projects.map(p => ({ label: p.name, value: p._id || p.id, icon: 'office-building' }))],
                            (opt) => setSelectedProjectId(opt.value)
                        )}
                    >
                        <View style={styles.dropdownLeft}>
                            <MaterialCommunityIcons name="filter-variant" size={14} color="#64748B" />
                            <Text style={styles.dropdownValueText}>{selectedProjectLabel}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-down" size={14} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.uploadBtnNew} onPress={openUploadModal}>
                        <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                        <Text style={styles.uploadBtnText}>Upload New</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} size="large" /> : (
                <FlatList
                    key={`grid`}
                    data={filteredPhotos}
                    numColumns={2}
                    keyExtractor={(item) => item._id || item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={fetchPhotos}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="image-multiple-outline" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No photos found in this gallery.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.photoCardWrapper}>
                            <View style={[styles.photoCard, SHADOWS.small]}>
                                <View style={styles.imageContainer}>
                                    <Image
                                        source={{ uri: getServerUrl(item.imageUrl) || item.imageUrl }}
                                        style={styles.photoImg}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.photoOverlay}>
                                        <View style={styles.photoBadge}>
                                            <Text style={styles.photoBadgeText} numberOfLines={1}>
                                                {item.projectId?.name || 'General'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.photoFooter}>
                                    <Text style={styles.photoDesc} numberOfLines={1}>{item.description || 'Verified Site Update'}</Text>
                                    <View style={styles.metaRow}>
                                        <MaterialCommunityIcons name="calendar" size={10} color="#94A3B8" />
                                        <Text style={styles.metaText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                />
            )}

            <Modal visible={uploadModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalScroll}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>Upload Photo</Text>
                            <TouchableOpacity onPress={() => !uploading && setUploadModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBodyScroll}>
                            <View style={styles.modalBody}>
                            {/* File Dropzone area */}
                            <TouchableOpacity style={styles.dropZone} onPress={pickImage} disabled={uploading}>
                                {tempImage ? (
                                    <Image source={{ uri: tempImage }} style={styles.previewImage} resizeMode="cover" />
                                ) : (
                                    <View style={styles.dropZoneContent}>
                                        <MaterialCommunityIcons name="cloud-upload" size={40} color="#94A3B8" />
                                        <Text style={styles.dropZoneTitle}>No file chosen</Text>
                                        <Text style={styles.dropZoneSubtitle}>Click to upload or drag and drop</Text>
                                        <Text style={styles.dropZoneMeta}>SVG, PNG, JPG or GIF (max. 5MB)</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.fieldLabel}>Or Image URL (External)</Text>
                            <TextInput
                                style={styles.inputField}
                                placeholder="https://images.unsplash.com/..."
                                placeholderTextColor="#94A3B8"
                                value={externalUrl}
                                onChangeText={handleExternalUrlChange}
                                autoCapitalize="none"
                            />

                            <Text style={styles.fieldLabel}>Description</Text>
                            <TextInput
                                style={styles.inputField}
                                placeholder="e.g. Site Visit Day 1"
                                placeholderTextColor="#94A3B8"
                                value={description}
                                onChangeText={setDescription}
                            />

                            <Text style={styles.fieldLabel}>Project</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectScroll}>
                                <TouchableOpacity
                                    style={[styles.projectItem, uploadProjectId === 'none' && styles.projectItemActive]}
                                    onPress={() => setUploadProjectId('none')}
                                >
                                    <Text style={[styles.projectItemText, uploadProjectId === 'none' && styles.projectItemTextActive]}>General / None</Text>
                                </TouchableOpacity>
                                {projects?.map(p => (
                                    <TouchableOpacity
                                        key={p._id || p.id}
                                        style={[styles.projectItem, uploadProjectId === (p._id || p.id) && styles.projectItemActive]}
                                        onPress={() => setUploadProjectId(p._id || p.id)}
                                    >
                                        <Text style={[styles.projectItemText, uploadProjectId === (p._id || p.id) && styles.projectItemTextActive]}>{p.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TouchableOpacity 
                                style={[styles.submitBtn, uploading && { opacity: 0.7 }]} 
                                onPress={uploadImage} 
                                disabled={uploading}
                            >
                                {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Upload Photo</Text>}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* SELECTOR MODAL */}
            <Modal visible={selVisible} transparent animationType="fade">
                <View style={styles.selOverlayModal}>
                    <View style={styles.selBox}>
                        <Text style={styles.selTitle}>{selTitle}</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {selOptions.map((opt, i) => (
                                <TouchableOpacity key={i} style={styles.selItem} onPress={() => selOnSelect(opt)}>
                                    <View style={styles.selIconBox}>
                                        <MaterialCommunityIcons name={opt.icon || 'circle-small'} size={18} color="#3B82F6" />
                                    </View>
                                    <Text style={styles.selLabelText}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.selClose} onPress={() => setSelVisible(false)}>
                            <Text style={styles.selCloseText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    pageHeader: { paddingHorizontal: 20, paddingTop: 16, marginBottom: 20 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 2, marginBottom: 20 },
    
    actionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    customDropdownBtn: { 
        flex: 1,
        height: 40, 
        backgroundColor: '#fff', 
        borderRadius: 10, 
        borderWidth: 1, 
        borderColor: '#E2E8F0', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 12 
    },
    dropdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dropdownValueText: { fontSize: 12, fontWeight: '800', color: '#1E293B' },

    uploadBtnNew: { 
        backgroundColor: '#2563EB', 
        height: 40, 
        borderRadius: 10, 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        gap: 6,
        elevation: 2,
        shadowColor: '#2563EB',
        shadowOpacity: 0.2,
        shadowRadius: 4
    },
    uploadBtnText: { color: '#fff', fontSize: 13, fontWeight: '900' },

    // Selector Styles
    selOverlayModal: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center' },
    selBox: { width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 24, elevation: 20 },
    selTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A', marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
    selItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    selIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    selLabelText: { fontSize: 14, fontWeight: '700', color: '#334155' },
    selClose: { marginTop: 16, alignItems: 'center' },
    selCloseText: { fontSize: 13, fontWeight: '900', color: '#64748B' },

    list: { paddingHorizontal: 12, paddingBottom: 120 },
    photoCardWrapper: { width: '50%', padding: 6 },
    photoCard: { 
        backgroundColor: '#fff', 
        borderRadius: 20, 
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    imageContainer: { width: '100%', height: 150, backgroundColor: '#F1F5F9' },
    photoImg: { width: '100%', height: '100%' },
    photoOverlay: { position: 'absolute', top: 8, left: 8, right: 8 },
    photoBadge: { 
        backgroundColor: 'rgba(15, 23, 42, 0.65)', 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 6,
        alignSelf: 'flex-start'
    },
    photoBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
    photoFooter: { padding: 12 },
    photoDesc: { fontSize: 13, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 10, color: '#94A3B8', fontWeight: '800' },
    
    emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 20 },
    emptyText: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 16, textAlign: 'center' },

    // Modal Styles Update
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', padding: 20 },
    modalScroll: { backgroundColor: '#fff', borderRadius: 24, paddingBottom: 24, width: '100%', maxHeight: '90%', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderColor: '#F1F5F9' },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    modalBodyScroll: { maxHeight: '100%' },
    modalBody: { paddingHorizontal: 24, paddingVertical: 20 },

    dropZone: { width: '100%', height: 250, borderRadius: 20, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 20 },
    dropZoneContent: { alignItems: 'center', padding: 20 },
    dropZoneTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginTop: 12 },
    dropZoneSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '600' },
    dropZoneMeta: { fontSize: 11, color: '#94A3B8', marginTop: 8, fontWeight: '500' },
    previewImage: { width: '100%', height: '100%' },

    fieldLabel: { fontSize: 11, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    inputField: { width: '100%', height: 44, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, color: '#0F172A', fontWeight: '600', marginBottom: 20 },
    
    projectScroll: { flexGrow: 0, marginBottom: 24 },
    projectItem: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8 },
    projectItemActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    projectItemText: { fontSize: 13, fontWeight: '700', color: '#475569' },
    projectItemTextActive: { color: '#ffffff' },

    submitBtn: { width: '100%', height: 52, backgroundColor: '#2563EB', borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' }
});

export default ProjectManagerPhotosScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert, Modal, TextInput, StatusBar, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import api, { getServerUrl } from '../../utils/api';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const ForemanPhotosScreen = () => {
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

    const selectedProjectLabel = selectedProjectId === 'all' ? 'All Sites' : (projects.find(p => (p._id || p.id) === selectedProjectId)?.name || 'Select Site');

    const fetchPhotos = async () => {
        try {
            setLoading(true);
            const res = await api.get('/photos');
            setPhotos(res.data || []);
        } catch (e) {
            console.error('Fetch photos error:', e.message);
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
                setExternalUrl('');
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

        const note = description || 'Site Update';

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
            Alert.alert('Success', 'Photo uploaded to site records.');
            setUploadModal(false);
        } catch (error) {
            Alert.alert('Upload Failed', 'Failed to sync with site records.');
        } finally {
            setUploading(false);
            setTempImage(null);
            setExternalUrl('');
            setDescription('');
            setUploadProjectId('none');
        }
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
                <Text style={styles.pageTitle}>Site Gallery</Text>
                <Text style={styles.pageSubtitle}>Document progress & material deliveries.</Text>

                <View style={styles.actionRow}>
                    <TouchableOpacity 
                        style={styles.customDropdownBtn}
                        onPress={() => openDropdown('Filter By Site', 
                            [{ label: 'All Sites', value: 'all', icon: 'layers' }, ...projects.map(p => ({ label: p.name, value: p._id || p.id, icon: 'office-building' }))],
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
                        <Text style={styles.uploadBtnText}>Add Photo</Text>
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
                            <Text style={styles.emptyText}>No site documentation found.</Text>
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
                                    <Text style={styles.photoDesc} numberOfLines={1}>{item.description || 'Verified Update'}</Text>
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
                            <Text style={styles.modalTitle}>New Site Photo</Text>
                            <TouchableOpacity onPress={() => !uploading && setUploadModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBodyScroll}>
                            <View style={styles.modalBody}>
                                <TouchableOpacity style={styles.dropZone} onPress={pickImage} disabled={uploading}>
                                    {tempImage ? (
                                        <Image source={{ uri: tempImage }} style={styles.previewImage} resizeMode="cover" />
                                    ) : (
                                        <View style={styles.dropZoneContent}>
                                            <MaterialCommunityIcons name="camera-plus" size={40} color="#94A3B8" />
                                            <Text style={styles.dropZoneTitle}>Snap or Choose Photo</Text>
                                            <Text style={styles.dropZoneSubtitle}>Capture site progress instantly</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <Text style={styles.fieldLabel}>Brief Note / Activity</Text>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="e.g. Scaffolding complete"
                                    placeholderTextColor="#94A3B8"
                                    value={description}
                                    onChangeText={setDescription}
                                />

                                <Text style={styles.fieldLabel}>Select Target Site</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectScroll}>
                                    <TouchableOpacity
                                        style={[styles.projectItem, uploadProjectId === 'none' && styles.projectItemActive]}
                                        onPress={() => setUploadProjectId('none')}
                                    >
                                        <Text style={[styles.projectItemText, uploadProjectId === 'none' && styles.projectItemTextActive]}>General</Text>
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
                                    {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>SYNC WITH DASHBOARD</Text>}
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
                                        <MaterialCommunityIcons name={opt.icon || 'circle-small'} size={18} color="#2563EB" />
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
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    pageHeader: { paddingHorizontal: 24, paddingTop: 16, marginBottom: 20 },
    pageTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
    pageSubtitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 4, marginBottom: 24 },
    
    actionRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    customDropdownBtn: { flex: 1, height: 48, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    dropdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dropdownValueText: { fontSize: 13, fontWeight: '800', color: '#1E293B' },

    uploadBtnNew: { backgroundColor: '#10B981', height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8, elevation: 4, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 10 },
    uploadBtnText: { color: '#fff', fontSize: 13, fontWeight: '900' },

    selOverlayModal: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
    selBox: { width: '85%', backgroundColor: '#fff', borderRadius: 32, padding: 24 },
    selTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A', marginBottom: 16, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1.5 },
    selItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    selIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    selLabelText: { fontSize: 15, fontWeight: '700', color: '#334155' },
    selClose: { marginTop: 20, alignItems: 'center', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 16 },
    selCloseText: { fontSize: 14, fontWeight: '900', color: '#64748B' },

    list: { paddingHorizontal: 16, paddingBottom: 120 },
    photoCardWrapper: { width: '50%', padding: 8 },
    photoCard: { backgroundColor: '#fff', borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    imageContainer: { width: '100%', height: 160, backgroundColor: '#F1F5F9' },
    photoImg: { width: '100%', height: '100%' },
    photoOverlay: { position: 'absolute', top: 10, left: 10, right: 10 },
    photoBadge: { backgroundColor: 'rgba(15, 23, 42, 0.8)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
    photoBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    photoFooter: { padding: 16 },
    photoDesc: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 10, color: '#94A3B8', fontWeight: '800' },
    
    emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyText: { fontSize: 16, fontWeight: '800', color: '#CBD5E1', marginTop: 20, textAlign: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'flex-end' },
    modalScroll: { backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40, width: '100%', maxHeight: '92%' },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 28, borderBottomWidth: 1, borderColor: '#F1F5F9' },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
    modalBodyScroll: { maxHeight: '100%' },
    modalBody: { paddingHorizontal: 28, paddingVertical: 24 },

    dropZone: { width: '100%', height: 280, borderRadius: 24, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 28 },
    dropZoneContent: { alignItems: 'center' },
    dropZoneTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginTop: 16 },
    dropZoneSubtitle: { fontSize: 13, color: '#64748B', marginTop: 6, fontWeight: '600' },
    previewImage: { width: '100%', height: '100%' },

    fieldLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
    inputField: { width: '100%', height: 54, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 18, color: '#0F172A', fontWeight: '800', marginBottom: 24 },
    
    projectScroll: { flexGrow: 0, marginBottom: 32 },
    projectItem: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 10 },
    projectItemActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    projectItemText: { fontSize: 13, fontWeight: '800', color: '#64748B' },
    projectItemTextActive: { color: '#ffffff' },

    submitBtn: { width: '100%', height: 60, backgroundColor: '#10B981', borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '1000', letterSpacing: 1 }
});

export default ForemanPhotosScreen;

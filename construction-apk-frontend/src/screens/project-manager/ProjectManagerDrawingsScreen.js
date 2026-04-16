import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Modal, ScrollView, Alert, Animated, TextInput, Dimensions, Share, Linking, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import api, { getServerUrl } from '../../utils/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import WorkerHeader from '../../components/WorkerHeader';

const { width } = Dimensions.get('window');

const DISCIPLINES = [
    { label: 'All Disciplines', value: '', icon: 'layers' },
    { label: 'Architectural', value: 'architectural', icon: 'home-variant-outline' },
    { label: 'Structural', value: 'structural', icon: 'office-building' },
    { label: 'Mechanical', value: 'mechanical', icon: 'cog-outline' },
    { label: 'Electrical', value: 'electrical', icon: 'power' },
    { label: 'Plumbing', value: 'plumbing', icon: 'water-pump' },
    { label: 'Civil', value: 'civil', icon: 'excavator' },
    { label: 'Other', value: 'other', icon: 'dots-horizontal' },
];

const STATUS_OPTIONS = [
    { label: 'Active', value: 'active', icon: 'check-circle-outline' },
    { label: 'Superseded', value: 'superseded', icon: 'history' },
    { label: 'Void', value: 'void', icon: 'close-circle-outline' },
];

const ProjectManagerDrawingsScreen = () => {
    const { projects, refreshData } = useApp();
    const [drawings, setDrawings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedProject, setSelectedProject] = useState({ label: 'All Projects', value: '' });
    const [selectedDiscipline, setSelectedDiscipline] = useState(DISCIPLINES[0]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedDrawing, setSelectedDrawing] = useState(null);
    
    // Upload Form State
    const [isUploadVisible, setIsUploadVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        projectId: '',
        projectLabel: 'Select Project',
        title: '',
        drawingNumber: '',
        category: 'architectural',
        categoryLabel: 'Architectural',
        status: 'active',
        statusLabel: 'Active',
        file: null
    });

    // Stable Custom Selector State
    const [selVisible, setSelVisible] = useState(false);
    const [selTitle, setSelTitle] = useState('');
    const [selOptions, setSelOptions] = useState([]);
    const [selOnSelect, setSelOnSelect] = useState(() => () => {});

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchDrawings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/drawings');
            setDrawings(res.data);
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        } catch (e) {
            console.error('Fetch drawings error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrawings();
    }, []);

    const filteredDrawings = (drawings || []).filter(d => {
        const titleMatch = d.title?.toLowerCase().includes(search.toLowerCase());
        const numberMatch = d.drawingNumber?.toLowerCase().includes(search.toLowerCase());
        const matchesSearch = titleMatch || numberMatch;
        const matchesProject = selectedProject.value ? (d.projectId?._id || d.projectId) === selectedProject.value : true;
        const matchesDiscipline = selectedDiscipline.value ? d.category?.toLowerCase() === selectedDiscipline.value : true;
        
        return matchesSearch && matchesProject && matchesDiscipline;
    });

    const getLatestFileUrl = (item) => {
        if (!item || !item.versions || item.versions.length === 0) return null;
        const ver = item.versions.find(v => v.versionNumber === item.currentVersion) || item.versions[item.versions.length - 1];
        if (!ver?.fileUrl) return null;
        return getServerUrl(ver.fileUrl);
    };

    const handleShare = async (item) => {
        const url = getLatestFileUrl(item);
        if (!url) {
            Alert.alert('File Error', 'Valid file link not found.');
            return;
        }
        try {
            await Share.share({
                message: `Project Drawing: ${item.title}\nProject: ${item.projectId?.name || 'Site'}\nVersion: v${item.currentVersion}\nURL: ${url}`,
                title: item.title,
            });
        } catch (error) {
            console.error(error.message);
        }
    };

    const handleView = (item) => {
        setSelectedDrawing(item);
        setModalVisible(true);
    };

    const openDocument = () => {
        const url = getLatestFileUrl(selectedDrawing);
        if (url) {
            setModalVisible(false);
            Linking.openURL(url);
        }
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

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/vnd.dwg', 'image/x-dwg'],
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                if (file.size > 50 * 1024 * 1024) {
                    Alert.alert('File too large', 'Maximum file size is 50MB.');
                    return;
                }
                setUploadForm(prev => ({ ...prev, file }));
            }
        } catch (err) {
            console.error('Pick document error:', err);
        }
    };

    const submitDrawing = async () => {
        if (!uploadForm.file) return Alert.alert('Error', 'Please select a file.');
        if (!uploadForm.projectId) return Alert.alert('Error', 'Please select a project.');
        if (!uploadForm.title) return Alert.alert('Error', 'Please enter a drawing title.');

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', {
                uri: Platform.OS === 'android' ? uploadForm.file.uri : uploadForm.file.uri.replace('file://', ''),
                name: uploadForm.file.name,
                type: uploadForm.file.mimeType || 'application/pdf'
            });
            formData.append('projectId', uploadForm.projectId);
            formData.append('title', uploadForm.title);
            formData.append('drawingNumber', uploadForm.drawingNumber);
            formData.append('category', uploadForm.category);
            formData.append('status', uploadForm.status);

            await api.post('/drawings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Alert.alert('Success', 'Drawing uploaded successfully!');
            setIsUploadVisible(false);
            setUploadForm({
                projectId: '', projectLabel: 'Select Project', title: '', drawingNumber: '', 
                category: 'architectural', categoryLabel: 'Architectural',
                status: 'active', statusLabel: 'Active', file: null
            });
            fetchDrawings();
        } catch (err) {
            Alert.alert('Error', 'Failed to upload drawing.');
        } finally {
            setUploading(false);
        }
    };

    const renderDrawingItem = ({ item }) => {
        const config = {
            'architectural': { icon: 'home-variant', color: '#3B82F6', bg: '#EFF6FF' },
            'structural': { icon: 'office-building', color: '#10B981', bg: '#ECFDF5' },
            'mechanical': { icon: 'cog', color: '#F59E0B', bg: '#FFFBEB' },
            'electrical': { icon: 'flash', color: '#EF4444', bg: '#FEF2F2' },
        }[item.category?.toLowerCase()] || { icon: 'file-document', color: '#64748B', bg: '#F8FAFC' };

        return (
            <TouchableOpacity 
                style={[styles.compactDrawingRow, SHADOWS.small]} 
                onPress={() => handleView(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.indicatorLine, { backgroundColor: config.color }]} />
                
                <View style={styles.drawingMainInfo}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.drawingTitleText, { fontSize: width < 380 ? 12 : 13 }]} numberOfLines={1} adjustsFontSizeToFit>{item.title}</Text>
                        <View style={[styles.miniStatusBadge, { backgroundColor: config.bg, minWidth: width < 380 ? 40 : 50, alignItems: 'center' }]}>
                            <Text style={[styles.miniStatusText, { color: config.color }]}>{item.drawingNumber || 'UNSET'}</Text>
                        </View>
                    </View>
                    <View style={styles.subInfoRow}>
                        <Text style={styles.projectSiteText}>{item.projectId?.name || '---'}</Text>
                        <Text style={styles.separator}>•</Text>
                        <Text style={styles.categoryText}>{item.category?.toUpperCase() || 'GENERAL'}</Text>
                        <Text style={styles.separator}>•</Text>
                        <Text style={styles.versionText}>v{item.currentVersion}.0</Text>
                    </View>
                </View>

                <View style={styles.drawingActions}>
                    <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleShare(item)}>
                        <MaterialCommunityIcons name="share-variant" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleView(item)}>
                        <MaterialCommunityIcons name="eye" size={16} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <WorkerHeader title="Drawings" />

            <View style={styles.stickyHeader}>
                <View style={[styles.searchRow, { flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
                    <View style={[styles.compactSearchBox, { flex: 1 }]}>
                        <MaterialCommunityIcons name="magnify" size={16} color="#94A3B8" />
                        <TextInput 
                            style={styles.tinySearchInput}
                            placeholder="Sheet # or Title..."
                            placeholderTextColor="#94A3B8"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                    <TouchableOpacity style={styles.uploadBtnCompact} onPress={() => setIsUploadVisible(true)}>
                        <MaterialCommunityIcons name="cloud-upload" size={16} color="#fff" />
                        <Text style={styles.uploadBtnText}>Upload</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.filterToolbar}>
                    <TouchableOpacity 
                        style={styles.tinyFilterTab}
                        onPress={() => openDropdown('Project', 
                            [{ label: 'All Projects', value: '' }, ...projects.map(p => ({ label: p.name, value: p._id || p.id }))],
                            (val) => {
                                const p = projects.find(proj => (proj._id || proj.id) === val);
                                setSelectedProject(p ? { label: p.name, value: val } : { label: 'All Projects', value: '' });
                            }
                        )}
                    >
                        <Text style={styles.filterTabText} numberOfLines={1}>{selectedProject.label}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={12} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.tinyFilterTab}
                        onPress={() => openDropdown('Discipline', DISCIPLINES, (val) => {
                            const d = DISCIPLINES.find(item => item.value === val);
                            setSelectedDiscipline(d);
                        })}
                    >
                        <Text style={styles.filterTabText}>{selectedDiscipline.label}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={12} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={filteredDrawings}
                keyExtractor={item => item._id}
                renderItem={renderDrawingItem}
                contentContainerStyle={styles.scrollList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    loading ? <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 80 }} /> : (
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="floor-plan" size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>No drawings matched your search.</Text>
                        </View>
                    )
                }
            />

            {/* DRAWING DETAILS MODAL */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIndicator} />
                        <View style={styles.modalHeader}>
                            <View style={styles.modalTitleArea}>
                                <Text style={styles.modalMainTitle}>{selectedDrawing?.title}</Text>
                                <Text style={styles.modalMainSubtitle}>Sheet {selectedDrawing?.drawingNumber} • {selectedDrawing?.category?.toUpperCase()}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeCircle}>
                                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>PROJECT SITE</Text>
                                <Text style={styles.detailValue}>{selectedDrawing?.projectId?.name || '---'}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>LATEST VERSION</Text>
                                <Text style={styles.detailValue}>v{selectedDrawing?.currentVersion}.0</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>LAST REVISION</Text>
                                <Text style={styles.detailValue}>{selectedDrawing ? new Date(selectedDrawing.updatedAt).toLocaleDateString() : '---'}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.primaryAction} onPress={openDocument}>
                            <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" />
                            <Text style={styles.primaryActionText}>OPEN FULL BLUEPRINT</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* UPLOAD MODAL */}
            <Modal visible={isUploadVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '90%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalMainTitle}>Upload Revision</Text>
                            <TouchableOpacity onPress={() => setIsUploadVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <TouchableOpacity style={[styles.fileCard, uploadForm.file && styles.fileCardActive]} onPress={pickDocument}>
                                <MaterialCommunityIcons 
                                    name={uploadForm.file ? "file-check" : "cloud-upload-outline"} 
                                    size={32} 
                                    color={uploadForm.file ? "#10B981" : "#3B82F6"} 
                                />
                                <Text style={styles.fileText}>
                                    {uploadForm.file ? uploadForm.file.name : 'Select or drop blueprint file'}
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.label}>Select Project</Text>
                            <TouchableOpacity 
                                style={styles.modalDropdown} 
                                onPress={() => openDropdown('Project', 
                                    projects.map(p => ({ label: p.name, value: p._id || p.id })),
                                    (val) => {
                                        const p = projects.find(proj => (proj._id || proj.id) === val);
                                        setUploadForm(prev => ({ ...prev, projectId: val, projectLabel: p.name }));
                                    }
                                )}
                            >
                                <Text style={styles.dropdownValueText}>{uploadForm.projectLabel}</Text>
                                <MaterialCommunityIcons name="chevron-down" size={20} color="#94A3B8" />
                            </TouchableOpacity>

                            <Text style={styles.label}>Drawing Title</Text>
                            <TextInput 
                                style={styles.modalInput}
                                placeholder="Final Master Plan"
                                value={uploadForm.title}
                                onChangeText={t => setUploadForm(prev => ({ ...prev, title: t }))}
                            />

                            <Text style={styles.label}>Sheet Number</Text>
                            <TextInput 
                                style={styles.modalInput}
                                placeholder="A-101"
                                value={uploadForm.drawingNumber}
                                onChangeText={t => setUploadForm(prev => ({ ...prev, drawingNumber: t }))}
                            />

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Category</Text>
                                    <TouchableOpacity 
                                        style={styles.modalDropdown} 
                                        onPress={() => openDropdown('Category', 
                                            DISCIPLINES.filter(d => d.value !== ''),
                                            (opt) => setUploadForm(prev => ({ ...prev, category: opt.value, categoryLabel: opt.label }))
                                        )}
                                    >
                                        <Text style={styles.dropdownValueText}>{uploadForm.categoryLabel}</Text>
                                        <MaterialCommunityIcons name="chevron-down" size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Status</Text>
                                    <TouchableOpacity 
                                        style={styles.modalDropdown} 
                                        onPress={() => openDropdown('Status', 
                                            STATUS_OPTIONS,
                                            (opt) => setUploadForm(prev => ({ ...prev, status: opt.value, statusLabel: opt.label }))
                                        )}
                                    >
                                        <Text style={styles.dropdownValueText}>{uploadForm.statusLabel}</Text>
                                        <MaterialCommunityIcons name="chevron-down" size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={[styles.primaryAction, { marginTop: 20 }, uploading && { opacity: 0.7 }]} 
                                onPress={submitDrawing}
                                disabled={uploading}
                            >
                                {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryActionText}>SAVE REVISION</Text>}
                            </TouchableOpacity>
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
                                <TouchableOpacity key={i} style={styles.selItem} onPress={() => selOnSelect(opt.value ? opt : opt)}>
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
    stickyHeader: { 
        paddingHorizontal: 16, 
        paddingTop: 8, 
        paddingBottom: 12,
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderBottomColor: '#F1F5F9', 
        zIndex: 10 
    },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    titleSection: { flex: 1 },
    mainTitleCompact: { fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    mainSubtitleCompact: { fontSize: 10, fontWeight: '700', color: '#64748B' },
    
    uploadBtnCompact: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 32, borderRadius: 8, gap: 6 },
    uploadBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },

    searchRow: { marginBottom: 10 },
    compactSearchBox: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#F1F5F9', 
        borderRadius: 10, 
        height: 38, 
        paddingHorizontal: 12 
    },
    tinySearchInput: { flex: 1, marginLeft: 8, fontSize: 13, fontWeight: '600', color: '#1E293B' },

    filterToolbar: { flexDirection: 'row', gap: 8 },
    tinyFilterTab: { 
        flex: 1, 
        height: 30, 
        backgroundColor: '#F8FAFC', 
        borderRadius: 6, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    filterTabText: { fontSize: 9, fontWeight: '800', color: '#64748B', maxWidth: '85%' },

    scrollList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
    
    compactDrawingRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    indicatorLine: { width: 3, height: 36, borderRadius: 2, marginRight: 12 },
    drawingMainInfo: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    drawingTitleText: { fontSize: 13, fontWeight: '900', color: '#1E293B', flex: 1 },
    miniStatusBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
    miniStatusText: { fontSize: 8, fontWeight: '900' },
    
    subInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    projectSiteText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
    separator: { fontSize: 8, color: '#CBD5E1' },
    categoryText: { fontSize: 9, fontWeight: '800', color: '#94A3B8' },
    versionText: { fontSize: 10, fontWeight: '900', color: '#3B82F6' },

    drawingActions: { flexDirection: 'row', gap: 8 },
    actionIconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: '#E2E8F0' },

    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#94A3B8', fontSize: 13, fontWeight: '700', marginTop: 12 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
    modalIndicator: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    modalTitleArea: { flex: 1 },
    modalMainTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    modalMainSubtitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 2 },
    closeCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 32 },
    detailItem: { width: '45%' },
    detailLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginBottom: 4 },
    detailValue: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    
    primaryAction: { backgroundColor: '#2563EB', height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    primaryActionText: { color: '#fff', fontSize: 14, fontWeight: '900' },

    // Form
    label: { fontSize: 9, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6, marginTop: 16 },
    modalInput: { backgroundColor: '#F8FAFC', height: 44, borderRadius: 10, paddingHorizontal: 12, fontSize: 14, fontWeight: '600', color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
    modalDropdown: { backgroundColor: '#F8FAFC', height: 44, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0' },
    dropdownValueText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
    fileCard: { height: 100, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', padding: 16 },
    fileCardActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
    fileText: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 8, textAlign: 'center' },

    // Selector
    selOverlayModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    selBox: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20 },
    selTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A', marginBottom: 16, textAlign: 'center' },
    selItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    selIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    selLabelText: { fontSize: 14, fontWeight: '700', color: '#334155' },
    selClose: { marginTop: 16, alignItems: 'center' },
    selCloseText: { fontSize: 13, fontWeight: '900', color: '#64748B' }
});

export default ProjectManagerDrawingsScreen;

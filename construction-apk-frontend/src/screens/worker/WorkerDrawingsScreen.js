import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    TextInput, Animated, ActivityIndicator, Dimensions, 
    ScrollView, Share, Linking, Modal, Pressable, Alert, SafeAreaView, StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import api, { getServerUrl } from '../../utils/api';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const WorkerDrawingsScreen = () => {
    const { projects } = useApp();
    const [drawings, setDrawings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtering
    const [search, setSearch] = useState('');
    const [activeProject, setActiveProject] = useState('All');
    const [activeCategory, setActiveCategory] = useState('All');
    
    // Details Modal
    const [selectedDrawing, setSelectedDrawing] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const categories = ['All', 'Architecture', 'Structural', 'Plumbing', 'Electrical', 'HVAC'];

    const fetchDrawings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/drawings');
            setDrawings(res.data);
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
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
        const matchesSearch = (d.title || '').toLowerCase().includes(search.toLowerCase()) || 
                             (d.drawingNumber || '').toLowerCase().includes(search.toLowerCase());
        const matchesProject = activeProject === 'All' || d.projectId?._id === activeProject || d.projectId === activeProject;
        const matchesCategory = activeCategory === 'All' || (d.category || '').toLowerCase() === activeCategory.toLowerCase();
        
        return matchesSearch && matchesProject && matchesCategory;
    });

    const getLatestFileUrl = (item) => {
        if (!item || !item.versions || item.versions.length === 0) return null;
        const ver = item.versions.find(v => v.versionNumber === item.currentVersion) || item.versions[item.versions.length - 1];
        if (!ver?.fileUrl) return null;
        return getServerUrl(ver.fileUrl);
    };

    const handleView = (item) => {
        setSelectedDrawing(item);
        setModalVisible(true);
    };

    const handleShare = async (item) => {
        const url = getLatestFileUrl(item);
        if (!url) {
            Alert.alert('Error', 'No file link available for this drawing.');
            return;
        }
        try {
            await Share.share({
                message: `Project Drawing: ${item.title}\nProject: ${item.projectId?.name || 'Site'}\nURL: ${url}`,
                title: item.title,
            });
        } catch (error) {
            console.error(error.message);
        }
    };

    const openDocument = () => {
        const url = getLatestFileUrl(selectedDrawing);
        if (url) {
            Linking.openURL(url);
        } else {
            Alert.alert('Error', 'Document file not found.');
        }
    };

    // Selection Logic
    const [selectorVisible, setSelectorVisible] = useState(false);
    const [selectorType, setSelectorType] = useState(null); // 'project' or 'discipline'

    const openSelector = (type) => {
        setSelectorType(type);
        setSelectorVisible(true);
    };

    const handleSelect = (value) => {
        if (selectorType === 'project') {
            setActiveProject(value);
        } else {
            setActiveCategory(value);
        }
        setSelectorVisible(false);
    };

    const renderHeader = () => (
        <View style={styles.headerArea}>
            <View style={styles.titleInfo}>
                <Text style={styles.mainTitle}>Drawings & Blueprints</Text>
                <Text style={styles.subTitle}>Manage latest revisions and architectural plans.</Text>
            </View>

            <View style={styles.controlPanel}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search drawings..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <View style={styles.filtersRow}>
                    <TouchableOpacity 
                        style={styles.dropdown} 
                        onPress={() => openSelector('project')}
                    >
                        <Text style={styles.dropdownLabel} numberOfLines={1}>
                            {activeProject === 'All' ? 'All Projects' : (projects.find(p => p._id === activeProject || p.id === activeProject)?.name || 'Project')}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={16} color="#475569" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.dropdown} 
                        onPress={() => openSelector('discipline')}
                    >
                        <Text style={styles.dropdownLabel}>{activeCategory === 'All' ? 'All Disciplines' : activeCategory}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={16} color="#475569" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.tableHead}>
                <Text style={[styles.headCol, { flex: 2.5 }]}>DRAWING NAME</Text>
                <Text style={[styles.headCol, { flex: 1.5 }]}>PROJECT</Text>
                <Text style={[styles.headCol, { flex: 1 }]}>VERSION</Text>
                <Text style={[styles.headCol, { flex: 1, textAlign: 'right' }]}>DATE</Text>
            </View>
        </View>
    );

    const renderDrawingItem = ({ item }) => (
        <TouchableOpacity style={styles.tableRow} activeOpacity={0.7} onPress={() => handleView(item)}>
            <View style={{ flex: 2.5 }}>
                <Text style={styles.rowName} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.rowSubName}>{item.drawingNumber || 'A-XX'}</Text>
            </View>
            <View style={{ flex: 1.5 }}>
                <Text style={styles.rowProject} numberOfLines={1}>{item.projectId?.name || '---'}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={styles.vBadge}>
                    <Text style={styles.vText}>v{item.currentVersion}.0</Text>
                </View>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.rowDate}>{new Date(item.updatedAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader hideSearch={true} title="Drawing Management" />
            
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingInfo}>Syncing Blueprints...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredDrawings}
                    keyExtractor={item => item._id || item.id}
                    renderItem={renderDrawingItem}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContent}>
                            <MaterialCommunityIcons name="file-search-outline" size={64} color="#E2E8F0" />
                            <Text style={styles.emptyMainText}>No blueprints found</Text>
                            <Text style={styles.emptySubText}>Try adjusting your search or filters.</Text>
                        </View>
                    }
                />
            )}

            {/* SELECTION MODAL */}
            <Modal transparent visible={selectorVisible} animationType="fade">
                <Pressable style={styles.selectorOverlay} onPress={() => setSelectorVisible(false)}>
                    <View style={styles.selectorContent}>
                        <View style={styles.selectorHeader}>
                            <Text style={styles.selectorTitle}>Select {selectorType === 'project' ? 'Project' : 'Discipline'}</Text>
                            <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <TouchableOpacity 
                                style={[styles.selectorItem, (selectorType === 'project' ? activeProject : activeCategory) === 'All' && styles.selectorItemActive]}
                                onPress={() => handleSelect('All')}
                            >
                                <Text style={[styles.selectorText, (selectorType === 'project' ? activeProject : activeCategory) === 'All' && styles.selectorTextActive]}>
                                    All {selectorType === 'project' ? 'Projects' : 'Disciplines'}
                                </Text>
                            </TouchableOpacity>
                            {(selectorType === 'project' ? projects : categories.slice(1)).map((option) => (
                                <TouchableOpacity 
                                    key={option._id || option.id || option}
                                    style={[styles.selectorItem, (selectorType === 'project' ? activeProject : activeCategory) === (option._id || option.id || option) && styles.selectorItemActive]}
                                    onPress={() => handleSelect(option._id || option.id || option)}
                                >
                                    <Text style={[styles.selectorText, (selectorType === 'project' ? activeProject : activeCategory) === (option._id || option.id || option) && styles.selectorTextActive]}>
                                        {option.name || option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>

            {/* DETAILS MODAL */}
            <Modal transparent visible={modalVisible} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalPanel}>
                        <View style={styles.modalTopRow}>
                            <Text style={styles.modalHeaderTitle}>Blueprint Overview</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {selectedDrawing && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.docBanner}>
                                    <View style={styles.pdfIconBox}>
                                        <MaterialCommunityIcons name="file-pdf-box" size={40} color="#EF4444" />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 15 }}>
                                        <Text style={styles.bannerTitle}>{selectedDrawing.title}</Text>
                                        <Text style={styles.bannerMeta}>{selectedDrawing.drawingNumber} • {selectedDrawing.category?.toUpperCase()}</Text>
                                    </View>
                                </View>

                                <View style={styles.gridContainer}>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>PROJECT SITE</Text>
                                        <Text style={styles.gridValue}>{selectedDrawing.projectId?.name || '---'}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>LATEST VERSION</Text>
                                        <Text style={styles.gridValue}>v{selectedDrawing.currentVersion}.0</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>RELEASE DATE</Text>
                                        <Text style={styles.gridValue}>{new Date(selectedDrawing.updatedAt).toLocaleDateString()}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.gridLabel}>STATUS</Text>
                                        <Text style={[styles.gridValue, { color: '#059669' }]}>{selectedDrawing.status?.toUpperCase() || 'ACTIVE'}</Text>
                                    </View>
                                </View>

                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={styles.btnAlt} onPress={() => handleShare(selectedDrawing)}>
                                        <MaterialCommunityIcons name="share-variant" size={20} color="#1E293B" />
                                        <Text style={styles.btnAltText}>Share</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.btnMain} onPress={() => { setModalVisible(false); Linking.openURL(getLatestFileUrl(selectedDrawing)); }}>
                                        <MaterialCommunityIcons name="eye" size={20} color="#fff" />
                                        <Text style={styles.btnMainText}>Open Blueprint</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingBottom: 100 },

    headerArea: { padding: 20, backgroundColor: '#FFFFFF' },
    titleInfo: { marginBottom: 25 },
    mainTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    subTitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 4 },

    controlPanel: { marginBottom: 20 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', height: 52, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 15 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: '#1E293B' },

    filtersRow: { flexDirection: 'row', gap: 12 },
    dropdown: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', height: 44, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    dropdownLabel: { fontSize: 12, fontWeight: '800', color: '#475569', flex: 1 },

    tableHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginTop: 10 },
    headCol: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5 },

    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', paddingHorizontal: 4 },
    rowName: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
    rowSubName: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginTop: 1 },
    rowProject: { fontSize: 12, fontWeight: '800', color: '#444' },
    vBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    vText: { fontSize: 10, fontWeight: '900', color: '#64748B' },
    rowDate: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },

    loadingInfo: { marginTop: 15, fontSize: 13, fontWeight: '700', color: '#64748B' },
    emptyContent: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyMainText: { marginTop: 16, fontSize: 18, fontWeight: '900', color: '#1E293B' },
    emptySubText: { marginTop: 4, fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'center' },

    // Selection Modal
    selectorOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    selectorContent: { backgroundColor: '#fff', borderRadius: 24, padding: 20, width: '100%', maxHeight: '70%' },
    selectorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    selectorTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
    selectorItem: { paddingVertical: 15, paddingHorizontal: 15, borderRadius: 12, marginBottom: 5 },
    selectorItemActive: { backgroundColor: '#EFF6FF' },
    selectorText: { fontSize: 15, fontWeight: '700', color: '#475569' },
    selectorTextActive: { color: '#2563EB', fontWeight: '900' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end',  },
    modalPanel: { backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 25, minHeight: '55%' },
    modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalHeaderTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    docBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 20, borderRadius: 24, marginBottom: 25 },
    pdfIconBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...SHADOWS.small },
    bannerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
    bannerMeta: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginTop: 4 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 35 },
    gridItem: { width: '46%' },
    gridLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 4 },
    gridValue: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    actionRow: { flexDirection: 'row', gap: 15 },
    btnAlt: { flex: 1, height: 56, borderRadius: 18, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    btnAltText: { fontSize: 15, fontWeight: '900', color: '#1E293B' },
    btnMain: { flex: 2, height: 56, borderRadius: 18, backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...SHADOWS.small },
    btnMainText: { fontSize: 15, fontWeight: '900', color: '#fff' }
});

export default WorkerDrawingsScreen;

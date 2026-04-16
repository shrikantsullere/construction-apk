import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Animated, ActivityIndicator, Dimensions, ScrollView, Share, Linking, Modal, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, SIZES } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import api, { getServerUrl } from '../../utils/api';
import { Card, Badge } from '../../components/shared/CommonUI';

const { width, height } = Dimensions.get('window');

const WorkerDrawingsScreen = () => {
    const [drawings, setDrawings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedDrawing, setSelectedDrawing] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

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

    const filteredDrawings = (drawings || []).filter(d =>
        d.title?.toLowerCase().includes(search.toLowerCase()) ||
        d.projectId?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const getLatestFileUrl = (item) => {
        if (!item || !item.versions || item.versions.length === 0) return null;
        // Find version that matches currentVersion or fallback to last
        const ver = item.versions.find(v => v.versionNumber === item.currentVersion) || item.versions[item.versions.length - 1];
        if (!ver?.fileUrl) return null;
        return getServerUrl(ver.fileUrl);
    };

    const handleShare = async (item) => {
        const url = getLatestFileUrl(item);
        if (!url) {
            Alert.alert('File Error', 'This document does not have a valid file link.');
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

    const handleDownload = (item) => {
        const url = getLatestFileUrl(item);
        if (url) {
            Linking.openURL(url).catch(err => {
                console.error('Link Error:', err);
                Alert.alert('Link Error', 'Cannot open this document URL.');
            });
        } else {
            Alert.alert('File Error', 'No file found for this drawing.');
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

    const renderActionBtn = (icon, color, onPress, label) => (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color + '10', borderColor: color + '20' }]} onPress={onPress}>
            <MaterialCommunityIcons name={icon} size={16} color={color} />
            {label && <Text style={[styles.actionBtnText, { color }]}>{label}</Text>}
        </TouchableOpacity>
    );

    const renderDrawingItem = ({ item }) => (
        <Animated.View style={[styles.drawingRow, { opacity: fadeAnim }]}>
            <View style={styles.cardLayout}>
                <View style={styles.nameSection}>
                    <View style={styles.itemIconBox}>
                        <MaterialCommunityIcons
                            name={item.category === 'structural' ? 'office-building' : 'text-box-outline'}
                            size={18}
                            color="#2563EB"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.title}</Text>
                        <Text style={styles.itemSubName}>{item.category?.toUpperCase() || 'ARCHITECTURAL'} • {item.drawingNumber || 'A-132'}</Text>
                    </View>
                    <View style={[styles.statusTag, { backgroundColor: item.status === 'active' ? '#DCFCE7' : '#F1F5F9' }]}>
                        <Text style={[styles.statusTagText, { color: item.status === 'active' ? '#166534' : '#64748B' }]}>
                            {(item.status || 'ACTIVE').toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>SITE / PROJECT</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>{item.projectId?.name || '---'}</Text>
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>VERSION</Text>
                        <Text style={styles.infoValue}>v{item.currentVersion}.0</Text>
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>REVISION DATE</Text>
                        <Text style={styles.infoValue}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
                    </View>
                </View>

                <View style={styles.actionsBar}>
                    <Text style={styles.actionsLabel}>QUICK COMMANDS</Text>
                    <View style={styles.actionRow}>
                        {renderActionBtn('eye-outline', '#1E293B', () => handleView(item), 'VIEW')}
                        {renderActionBtn('share-variant-outline', '#9333EA', () => handleShare(item), 'SEND')}
                    </View>
                </View>
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <WorkerHeader title="Drawings" />

            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="floor-plan" size={80} color="#E2E8F0" />
                <Text style={styles.emptyTitle}>Site Drawings</Text>
                <Text style={styles.emptySubtitle}>Content is being updated by the Project Manager.</Text>
            </View>

            {/* DRAWING DETAILS MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIcon}>
                                <MaterialCommunityIcons name="file-pdf-box" size={32} color="#EF4444" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={styles.modalTitle}>{selectedDrawing?.title}</Text>
                                <Text style={styles.modalSubtitle}>{selectedDrawing?.drawingNumber} • {selectedDrawing?.category?.toUpperCase()}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>PROJECT</Text>
                                <Text style={styles.detailValue}>{selectedDrawing?.projectId?.name}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>CURRENT REVISION</Text>
                                <Text style={styles.detailValue}>v{selectedDrawing?.currentVersion}.0</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>RELEASED ON</Text>
                                <Text style={styles.detailValue}>{selectedDrawing ? new Date(selectedDrawing.createdAt).toLocaleDateString() : ''}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>STATUS</Text>
                                <Badge label={selectedDrawing?.status?.toUpperCase() || 'ACTIVE'} bg="#DCFCE7" color="#166534" />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.primaryAction} onPress={openDocument}>
                            <MaterialCommunityIcons name="file-search-outline" size={20} color="#fff" />
                            <Text style={styles.primaryActionText}>OPEN DOCUMENT</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { flex: 1, paddingTop: 16 },
    pageHeader: { paddingHorizontal: 24, marginBottom: 20 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 2 },

    filterArea: { paddingHorizontal: 24, marginBottom: 20 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', height: 48, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '600', color: '#1E293B' },

    listContainer: { paddingHorizontal: 24, paddingBottom: 100 },
    drawingRow: { backgroundColor: '#fff', borderRadius: 24, marginBottom: 16, borderLeftWidth: 6, borderLeftColor: '#2563EB', elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10 },
    cardLayout: { padding: 20 },

    nameSection: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 16 },
    itemIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
    itemName: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
    itemSubName: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.5, marginTop: 1 },

    infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 4 },
    infoValue: { fontSize: 12, fontWeight: '800', color: '#334155' },

    statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusTagText: { fontSize: 9, fontWeight: '900' },

    actionsBar: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actionsLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.2 },
    actionRow: { flexDirection: 'row', gap: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 1, minWidth: 60, justifyContent: 'center', gap: 6 },
    actionBtnText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    modalIcon: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    modalSubtitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 2 },

    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 32 },
    detailItem: { width: '45%' },
    detailLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 },
    detailValue: { fontSize: 14, fontWeight: '800', color: '#1E293B' },

    primaryAction: { backgroundColor: '#2563EB', height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 4, shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8 },
    primaryActionText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
    emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginTop: 16 },
    emptySubtitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 },
    emptyText: { marginTop: 16, color: '#94A3B8', fontSize: 14, fontWeight: '700' }
});

export default WorkerDrawingsScreen;

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, ScrollView, SafeAreaView, StatusBar, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, SIZES } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import { useApp } from '../../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getServerUrl } from '../../utils/api';

const { width } = Dimensions.get('window');

const SubcontractorProjectsScreen = ({ navigation }) => {
    const { projects, refreshData, loading } = useApp();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const getProjectImageUri = (project) => {
        const raw = project?.image;
        if (!raw) return null;
        if (typeof raw !== 'string') return null;
        if (raw.startsWith('data:image/')) return raw; // base64 data URL
        return getServerUrl(raw); // absolute URL or server-relative path
    };

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refreshData();
        setIsRefreshing(false);
    }, []);

    const activeSitesCount = (projects || []).filter(p => p.status?.toLowerCase() === 'live site' || p.status?.toLowerCase() === 'active').length;
    const planningSitesCount = (projects || []).filter(p => p.status?.toLowerCase() === 'planning' || p.status?.toLowerCase() === 'pre-construction').length;

    const filteredProjects = (projects || []).filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.client?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || p.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'live site':
            case 'active':
                return '#10B981';
            case 'planning':
            case 'pre-construction':
                return '#F59E0B';
            default:
                return '#64748B';
        }
    };

    const renderProjectCard = ({ item }) => (
        <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => navigation.navigate('Jobs', { projectId: item._id })}
            style={[styles.projectCard, SHADOWS.medium]}
        >
            <View style={styles.cardVisual}>
                <Image
                    source={{
                        uri:
                            getProjectImageUri(item) ||
                            'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=2070&auto=format&fit=crop',
                    }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(15, 23, 42, 0.05)', 'rgba(15, 23, 42, 0.80)']}
                    style={styles.cardGradient}
                />
            </View>

            <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusBadgeText}>{item.status || 'PLANNING'}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Jobs', { projectId: item._id })}>
                    <Text style={styles.viewJobsLink}>View Jobs</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.cardInfo}>
                <Text style={styles.locationSmall}>{item.location?.address || 'Location TBD'}</Text>
                <Text style={styles.projectName}>{item.name}</Text>
                <Text style={styles.pmText}>PM: {item.pmId?.fullName || 'Unassigned'}</Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressPercent}>{item.progress || 0}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${item.progress || 0}%`, backgroundColor: getStatusColor(item.status) }]} />
                </View>
            </View>

            <View style={styles.clientSection}>
                <Text style={styles.clientLabel}>Client</Text>
                <Text style={styles.clientName}>{item.client || 'General'}</Text>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('Drawings', { projectId: item._id })}
                >
                    <MaterialCommunityIcons name="floor-plan" size={18} color="#2563EB" />
                    <Text style={styles.actionBtnText}>Drawings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={() => navigation.navigate('Jobs', { projectId: item._id })}
                >
                    <Text style={styles.actionBtnTextPrimary}>View Jobs</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="Projects" />

            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="briefcase-outline" size={80} color="#E2E8F0" />
                    <Text style={styles.emptyTitle}>Subcontractor Projects</Text>
                    <Text style={styles.emptySubtitle}>Content is being updated by the Project Manager.</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    listContent: { paddingBottom: 100 },
    headerContent: { paddingHorizontal: 20, paddingTop: 20 },

    pageTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '700', marginTop: 4, marginBottom: 24 },

    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    statValue: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
    statLabel: { fontSize: 13, fontWeight: '900', color: '#0F172A', marginTop: 4 },
    statSub: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 2 },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16
    },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#1E293B' },

    filterRow: { flexDirection: 'row', marginBottom: 24 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E2E8F0', marginRight: 8 },
    filterChipActive: { backgroundColor: '#0F172A' },
    filterText: { fontSize: 12, fontWeight: '900', color: '#64748B' },
    filterTextActive: { color: '#fff' },

    projectCard: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    cardVisual: { height: 140, position: 'relative' },
    cardImage: { width: '100%', height: '100%' },
    cardGradient: { ...StyleSheet.absoluteFillObject },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, marginBottom: 12 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    viewJobsLink: { fontSize: 12, fontWeight: '900', color: '#2563EB' },

    cardInfo: { paddingHorizontal: 20, marginBottom: 16 },
    locationSmall: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
    projectName: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginTop: 2 },
    pmText: { fontSize: 12, fontWeight: '800', color: '#64748B', marginTop: 4 },

    progressContainer: { paddingHorizontal: 20, marginBottom: 16 },
    progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    progressLabel: { fontSize: 12, fontWeight: '900', color: '#0F172A' },
    progressPercent: { fontSize: 12, fontWeight: '900', color: '#0F172A' },
    progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },

    clientSection: { paddingHorizontal: 20, marginBottom: 20 },
    clientLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
    clientName: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 2 },

    cardActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 18 },
    actionBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    actionBtnPrimary: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
    actionBtnText: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
    actionBtnTextPrimary: { fontSize: 13, fontWeight: '800', color: '#fff' },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
    emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginTop: 16 },
    emptySubtitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { fontSize: 15, fontWeight: '800', color: '#94A3B8', marginTop: 12 }
});

export default SubcontractorProjectsScreen;

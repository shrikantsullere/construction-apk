import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, ActivityIndicator, SafeAreaView, Modal,
    StatusBar, Platform, ScrollView, Alert, Dimensions, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import api from '../../utils/api';
import WorkerHeader from '../../components/WorkerHeader';
import { COLORS, SHADOWS, SPACING } from '../../constants/theme';

const { width } = Dimensions.get('window');

const CrewClockScreen = ({ navigation }) => {
    const { projects, user } = useApp();
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWorkers, setSelectedWorkers] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);

    // Modal state
    const [projectModalVisible, setProjectModalVisible] = useState(false);
    
    // Stats
    const [stats, setStats] = useState({ onSite: 0, scheduled: 0, total: 0 });

    // Live Ticker for metrics
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // ── Fetch crew data ───────────────────────────────────────────────────
    const fetchCrewData = useCallback(async () => {
        try {
            if (workers.length === 0) setLoading(true);
            
            const [usersRes, logsRes] = await Promise.all([
                api.get('/auth/users', { params: { role: 'WORKER' } }),
                api.get('/timelogs', { params: { clockOut: 'null' } }),
            ]);

            const workerList = usersRes.data || [];
            const enriched = workerList.map(worker => {
                const wId = worker._id || worker.id;
                const activeLog = (logsRes.data || []).find(
                    log => (log.userId?._id || log.userId) === wId && !log.clockOut
                );
                return {
                    ...worker,
                    isClockedIn: !!activeLog,
                    activeLogId: activeLog?._id || activeLog?.id || null,
                    clockInISO: activeLog?.clockIn || null,
                    siteName: activeLog?.projectId?.name || 'Assigned Site',
                };
            });

            setWorkers(enriched);
            setStats({
                onSite: enriched.filter(w => w.isClockedIn).length,
                scheduled: enriched.length, // Matching software logic for "Scheduled Today" placeholder
                total: enriched.length,
            });
        } catch (err) {
            console.error('Crew fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [workers.length]);

    useEffect(() => {
        fetchCrewData();
        if (projects?.length > 0 && !selectedProject) setSelectedProject(projects[0]);
    }, [projects]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCrewData();
    };

    const filteredWorkers = workers.filter(w => {
        const query = searchQuery.toLowerCase();
        return (w.fullName || w.name || '').toLowerCase().includes(query);
    });

    const toggleSelection = (id) => {
        setSelectedWorkers(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkAction = async (action) => {
        if (selectedWorkers.length === 0) return;
        const projId = selectedProject?._id || selectedProject?.id;
        if (action === 'in' && !projId) {
            Alert.alert('Selection Required', 'Please select a jobsite before clocking in.');
            return;
        }

        try {
            setIsProcessing(true);
            const endpoint = action === 'in' ? '/timelogs/clock-in' : '/timelogs/clock-out';
            await Promise.all(selectedWorkers.map(id => api.post(endpoint, {
                userId: id,
                ...(action === 'in' && { projectId: projId, latitude: 0, longitude: 0 })
            })));
            
            setSelectedWorkers([]);
            fetchCrewData();
        } catch (err) {
            Alert.alert('Operation Failed', 'Could not sync clock status with server.');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderWorkerRow = ({ item }) => {
        const isSelected = selectedWorkers.includes(item._id);
        return (
            <TouchableOpacity 
                style={[styles.row, isSelected && styles.selectedRow]}
                onPress={() => toggleSelection(item._id)}
                activeOpacity={0.7}
            >
                {/* Checkbox Col */}
                <View style={styles.checkCol}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                    </View>
                </View>

                {/* Identity Col */}
                <View style={styles.identityCol}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarTxt}>{(item.fullName || 'W').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.workerMeta}>
                        <Text style={styles.workerName}>{item.fullName}</Text>
                        <Text style={styles.workerRole}>WORKER</Text>
                    </View>
                </View>

                {/* Jobsite Col */}
                <View style={styles.siteCol}>
                    <View style={styles.sitePill}>
                         <MaterialCommunityIcons name="office-building-marker" size={14} color="#94A3B8" />
                         <Text style={styles.siteTxt} numberOfLines={1}>{item.siteName}</Text>
                    </View>
                </View>

                {/* Status Col */}
                <View style={styles.statusCol}>
                    <View style={[styles.statusTag, { backgroundColor: item.isClockedIn ? '#ECFDF5' : '#F8FAFC' }]}>
                        <Text style={[styles.statusTagTxt, { color: item.isClockedIn ? '#10B981' : '#94A3B8' }]}>
                            {item.isClockedIn ? 'LIVE ON SITE' : 'OFF DUTY'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const ListHeader = () => (
        <View style={styles.header}>
            <View style={styles.titleSection}>
                <View>
                    <Text style={styles.screenTitle}>Crew Control</Text>
                    <Text style={styles.screenSubtitle}>MANAGE ON-SITE WORKFORCE ATTENDANCE</Text>
                </View>
                <View style={styles.liveIndicator}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.liveTxt}>LIVE: {stats.onSite} WORKERS ACTIVE</Text>
                </View>
            </View>

            {/* Stats Triple Cards */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, SHADOWS.small]}>
                    <View style={styles.statIconBox}><MaterialCommunityIcons name="account-group" size={24} color="#2563EB" /></View>
                    <Text style={styles.statVal}>{stats.total}</Text>
                    <Text style={styles.statLabel}>TOTAL FLEET</Text>
                </View>
                <View style={[styles.statCard, SHADOWS.small]}>
                    <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}><MaterialCommunityIcons name="account-check" size={24} color="#10B981" /></View>
                    <Text style={styles.statVal}>{stats.onSite}</Text>
                    <Text style={styles.statLabel}>CURRENT ON SITE</Text>
                </View>
                <View style={[styles.statCard, SHADOWS.small]}>
                    <View style={[styles.statIconBox, { backgroundColor: '#F8FAFC' }]}><MaterialCommunityIcons name="calendar-clock" size={24} color="#64748B" /></View>
                    <Text style={styles.statVal}>{stats.scheduled}</Text>
                    <Text style={styles.statLabel}>SCHEDULED TODAY</Text>
                </View>
            </View>

            {/* Control Bar */}
            <View style={styles.controlBar}>
                <View style={styles.searchBox}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search crew members..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={styles.siteSelect} onPress={() => setProjectModalVisible(true)}>
                    <MaterialCommunityIcons name="map-marker" size={18} color="#2563EB" />
                    <Text style={styles.siteSelectTxt} numberOfLines={1}>{selectedProject?.name || 'Select Job'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.bulkRow}>
                <TouchableOpacity 
                    style={[styles.bulkBtn, styles.clockInBtn, selectedWorkers.length === 0 && styles.btnDisabled]}
                    onPress={() => handleBulkAction('in')}
                    disabled={selectedWorkers.length === 0}
                >
                    <MaterialCommunityIcons name="play" size={20} color="#fff" />
                    <Text style={styles.btnTxt}>CLOCK IN ({selectedWorkers.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.bulkBtn, styles.clockOutBtn, selectedWorkers.length === 0 && styles.btnDisabled]}
                    onPress={() => handleBulkAction('out')}
                    disabled={selectedWorkers.length === 0}
                >
                    <MaterialCommunityIcons name="stop" size={20} color="#fff" />
                    <Text style={styles.btnTxt}>CLOCK OUT ({selectedWorkers.length})</Text>
                </TouchableOpacity>
            </View>

            {/* Table Header Row */}
            <View style={styles.tableHeader}>
                <View style={styles.checkCol} />
                <Text style={[styles.th, styles.identityCol]}>WORKER IDENTITY</Text>
                <Text style={[styles.th, styles.siteCol]}>ASSIGNED JOBSITE</Text>
                <Text style={[styles.th, styles.statusCol]}>CURRENT STATUS</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="Crew Control" />

            {isProcessing && <View style={styles.loader}><ActivityIndicator color="#2563EB" size="large" /></View>}

            <FlatList
                data={filteredWorkers}
                keyExtractor={item => item._id}
                renderItem={renderWorkerRow}
                ListHeaderComponent={ListHeader}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />

            {/* Job Select Modal */}
            <Modal visible={projectModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Target Jobsite</Text>
                        <FlatList
                            data={projects}
                            keyExtractor={p => p._id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.modalItem}
                                    onPress={() => { setSelectedProject(item); setProjectModalVisible(false); }}
                                >
                                    <Text style={styles.modalItemTxt}>{item.name}</Text>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setProjectModalVisible(false)}>
                            <Text style={styles.closeTxt}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    loader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, justifyContent: 'center', alignItems: 'center' },
    
    header: { backgroundColor: '#fff', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 20 },
    titleSection: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    screenTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
    screenSubtitle: { fontSize: 10, fontWeight: '800', color: '#64748B', marginTop: 4, letterSpacing: 0.5 },
    
    liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#DCFCE7' },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 6 },
    liveTxt: { fontSize: 9, fontWeight: '900', color: '#15803D' },

    statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 14, alignItems: 'center' },
    statIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statVal: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    statLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', marginTop: 2 },

    controlBar: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 25, px: 15, paddingHorizontal: 15, height: 48, borderWidth: 1, borderColor: '#E2E8F0' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 13, fontWeight: '600', color: '#1E293B' },
    siteSelect: { flex: 0.8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 25, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
    siteSelectTxt: { fontSize: 12, fontWeight: '800', color: '#2563EB' },

    bulkRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
    bulkBtn: { flex: 1, height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 4 },
    clockInBtn: { backgroundColor: '#2563EB' },
    clockOutBtn: { backgroundColor: '#64748B' },
    btnDisabled: { opacity: 0.5, elevation: 0 },
    btnTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },

    tableHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    th: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5 },

    row: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
    selectedRow: { backgroundColor: '#EFF6FF' },
    checkCol: { width: 40 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
    checkboxActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    identityCol: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    avatarTxt: { fontSize: 14, fontWeight: '900', color: '#1E293B' },
    workerMeta: { marginLeft: 12 },
    workerName: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
    workerRole: { fontSize: 9, fontWeight: '900', color: '#2563EB', marginTop: 2 },
    siteCol: { flex: 0.8 },
    sitePill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    siteTxt: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    statusCol: { flex: 0.8, alignItems: 'flex-end' },
    statusTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusTagTxt: { fontSize: 9, fontWeight: '900' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 16 },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalItemTxt: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    closeBtn: { marginTop: 20, alignItems: 'center', padding: 12, backgroundColor: '#F1F5F9', borderRadius: 12 },
    closeTxt: { fontWeight: '900', color: '#0F172A' }
});

export default CrewClockScreen;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, ActivityIndicator, SafeAreaView, Modal,
    StatusBar, Platform, ScrollView, Alert, Pressable, Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import api from '../../utils/api';
import * as Location from 'expo-location';
import WorkerHeader from '../../components/WorkerHeader';
import { COLORS, SHADOWS, SPACING } from '../../constants/theme';

const { width } = Dimensions.get('window');

// ─── Toast Component ─────────────────────────────────────────────────────────
const Toast = ({ visible, message, type }) => {
    if (!visible) return null;
    const isSuccess = type === 'success';
    return (
        <View style={[toastStyles.wrap, isSuccess ? toastStyles.success : toastStyles.error]}>
            <MaterialCommunityIcons
                name={isSuccess ? 'check-circle' : 'alert-circle'}
                size={18} color="#fff"
            />
            <Text style={toastStyles.text}>{message}</Text>
        </View>
    );
};

const toastStyles = StyleSheet.create({
    wrap: {
        position: 'absolute', top: Platform.OS === 'ios' ? 120 : 100,
        alignSelf: 'center', zIndex: 9999, flexDirection: 'row',
        alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 12,
        borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 10,
    },
    success: { backgroundColor: '#10B981' },
    error: { backgroundColor: '#EF4444' },
    text: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

const CrewClockScreen = ({ navigation }) => {
    const { projects, user } = useApp();

    const [workers, setWorkers]               = useState([]);
    const [loading, setLoading]               = useState(true);
    const [isProcessing, setIsProcessing]     = useState(false);
    const [searchQuery, setSearchQuery]       = useState('');
    const [selectedWorkers, setSelectedWorkers] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);

    // Modal state
    const [projectModalVisible, setProjectModalVisible] = useState(false);
    
    // Stats
    const [stats, setStats] = useState({ onSite: 0, offDuty: 0, total: 0 });

    // Toast
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    // ── Live 1-second ticker ──────────────────────────────────────────────
    const [now, setNow] = useState(new Date());
    const tickRef = useRef(null);
    useEffect(() => {
        tickRef.current = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(tickRef.current);
    }, []);

    const getElapsed = (clockInISO) => {
        if (!clockInISO) return '--:--';
        const diff = Math.max(0, now.getTime() - new Date(clockInISO).getTime());
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    // ── Auto-select first project ─────────────────────────────────────────
    useEffect(() => {
        if (projects?.length > 0 && !selectedProject) {
            setSelectedProject(projects[0]);
        }
    }, [projects]);

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
                    clockInFormatted: activeLog?.clockIn
                        ? new Date(activeLog.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '--:--',
                    site: activeLog?.projectId?.name || 'Assigned Site',
                };
            });

            setWorkers(enriched);
            setStats({
                onSite: enriched.filter(w => w.isClockedIn).length,
                offDuty: enriched.filter(w => !w.isClockedIn).length,
                total: enriched.length,
            });
        } catch (err) {
            console.error('Crew fetch error:', err);
            showToast('Failed to load crew data', 'error');
        } finally {
            setLoading(false);
        }
    }, [workers.length]);

    useEffect(() => {
        const unsub = navigation.addListener('focus', fetchCrewData);
        fetchCrewData();
        const bgRefresh = setInterval(fetchCrewData, 30000);
        return () => { unsub(); clearInterval(bgRefresh); };
    }, [navigation, fetchCrewData]);

    const filteredWorkers = workers.filter(w => {
        const query = searchQuery.toLowerCase();
        return (w.fullName || w.name || '').toLowerCase().includes(query) ||
               (w.site || '').toLowerCase().includes(query);
    });

    const toggleSelection = (id) => {
        setSelectedWorkers(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedWorkers.length === filteredWorkers.length) {
            setSelectedWorkers([]);
        } else {
            setSelectedWorkers(filteredWorkers.map(w => w._id || w.id).filter(Boolean));
        }
    };

    const handleBulkClockIn = async () => {
        const projId = selectedProject?._id || selectedProject?.id;
        if (!projId) { showToast('Select a site first', 'error'); return; }
        if (selectedWorkers.length === 0) return;

        try {
            setIsProcessing(true);
            await Promise.all(selectedWorkers.map(id => api.post('/timelogs/clock-in', {
                userId: id,
                projectId: projId,
                latitude: 0,
                longitude: 0
            })));
            showToast(`Success: ${selectedWorkers.length} crew checked-in`);
            setSelectedWorkers([]);
            fetchCrewData();
        } catch (err) {
            showToast('Check-in failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkClockOut = async () => {
        if (selectedWorkers.length === 0) return;
        try {
            setIsProcessing(true);
            await Promise.all(selectedWorkers.map(id => api.post('/timelogs/clock-out', { userId: id })));
            showToast(`Success: ${selectedWorkers.length} crew clocked-out`);
            setSelectedWorkers([]);
            fetchCrewData();
        } catch (err) {
            showToast('Clock-out failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderWorkerItem = ({ item }) => (
        <TouchableOpacity 
            style={[styles.workerCard, selectedWorkers.includes(item._id) && styles.selectedCard]}
            onPress={() => toggleSelection(item._id)}
        >
            <View style={styles.cardTop}>
                <View style={styles.avatarBox}>
                    <Text style={styles.avatarTxt}>{(item.fullName || item.name || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{item.fullName || item.name}</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: item.isClockedIn ? '#10B981' : '#F43F5E' }]} />
                        <Text style={[styles.statusTxt, { color: item.isClockedIn ? '#10B981' : '#F43F5E' }]}>
                            {item.isClockedIn ? 'ON SITE' : 'OFF DUTY'}
                        </Text>
                    </View>
                </View>
                {selectedWorkers.includes(item._id) && (
                    <MaterialCommunityIcons name="check-circle" size={24} color="#2563EB" />
                )}
            </View>

            <View style={styles.cardStats}>
                <View style={styles.statLine}>
                    <MaterialCommunityIcons name="map-marker-outline" size={14} color="#94A3B8" />
                    <Text style={styles.statVal} numberOfLines={1}>{item.site}</Text>
                </View>
                <View style={styles.statLine}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#94A3B8" />
                    <Text style={styles.statVal}>{item.clockInFormatted}</Text>
                    {item.isClockedIn && (
                        <View style={styles.elapsedBadge}>
                            <Text style={styles.elapsedText}>{getElapsed(item.clockInISO)}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="Crew Attendance" />
            <Toast visible={toast.visible} message={toast.message} type={toast.type} />

            <View style={styles.topInfo}>
                <View style={styles.statsStrip}>
                    <View style={[styles.statItem, { borderLeftColor: '#3B82F6' }]}>
                        <Text style={styles.statNumb}>{stats.total}</Text>
                        <Text style={styles.statLabel}>CREW</Text>
                    </View>
                    <View style={[styles.statItem, { borderLeftColor: '#10B981' }]}>
                        <Text style={styles.statNumb}>{stats.onSite}</Text>
                        <Text style={styles.statLabel}>ON SITE</Text>
                    </View>
                    <View style={[styles.statItem, { borderLeftColor: '#F43F5E' }]}>
                        <Text style={styles.statNumb}>{stats.offDuty}</Text>
                        <Text style={styles.statLabel}>OFF DUTY</Text>
                    </View>
                </View>

                <View style={styles.searchRow}>
                    <View style={styles.searchBar}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Search crew members..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity style={styles.selectBtn} onPress={selectAll}>
                        <MaterialCommunityIcons 
                            name={selectedWorkers.length === filteredWorkers.length ? "checkbox-marked" : "checkbox-blank-outline"} 
                            size={24} color="#2563EB" 
                        />
                    </TouchableOpacity>
                </View>

                {/* Bulk Actions Header */}
                <View style={styles.actionHeader}>
                    <TouchableOpacity 
                        style={styles.sitePicker}
                        onPress={() => setProjectModalVisible(true)}
                    >
                        <MaterialCommunityIcons name="office-building" size={20} color="#6366F1" />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.pickerHint}>TARGET JOBSITE</Text>
                            <Text style={styles.pickerValue} numberOfLines={1}>{selectedProject?.name || 'Select Site'}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                    <View style={styles.bulkBtns}>
                        <TouchableOpacity 
                            style={[styles.bulkBtn, { backgroundColor: '#10B981' }, (selectedWorkers.length === 0 || isProcessing) && { opacity: 0.5 }]}
                            onPress={handleBulkClockIn}
                            disabled={selectedWorkers.length === 0 || isProcessing}
                        >
                            <MaterialCommunityIcons name="login" size={18} color="#fff" />
                            <Text style={styles.bulkBtnTxt}>IN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.bulkBtn, { backgroundColor: '#F43F5E' }, (selectedWorkers.length === 0 || isProcessing) && { opacity: 0.5 }]}
                            onPress={handleBulkClockOut}
                            disabled={selectedWorkers.length === 0 || isProcessing}
                        >
                            <MaterialCommunityIcons name="logout" size={18} color="#fff" />
                            <Text style={styles.bulkBtnTxt}>OUT</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <FlatList
                data={filteredWorkers}
                keyExtractor={item => item._id}
                renderItem={renderWorkerItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    loading ? (
                        <ActivityIndicator style={{ marginTop: 50 }} color="#2563EB" />
                    ) : (
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="account-search-outline" size={60} color="#E2E8F0" />
                            <Text style={styles.emptyTxt}>No crew members found.</Text>
                        </View>
                    )
                }
            />

            {/* Site Picker Modal */}
            <Modal visible={projectModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Switch Jobsite</Text>
                            <TouchableOpacity onPress={() => setProjectModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#0F172A" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={projects || []}
                            keyExtractor={item => item._id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[styles.modalItem, selectedProject?._id === item._id && styles.modalItemSelected]}
                                    onPress={() => { setSelectedProject(item); setProjectModalVisible(false); }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.modalItemName, selectedProject?._id === item._id && { color: '#fff' }]}>{item.name}</Text>
                                        <Text style={[styles.modalItemLoc, selectedProject?._id === item._id && { color: 'rgba(255,255,255,0.7)' }]}>{item.location || 'Primary Site'}</Text>
                                    </View>
                                    {selectedProject?._id === item._id && <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    topInfo: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    
    statsStrip: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statItem: { flex: 1, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, borderLeftWidth: 4 },
    statNumb: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    statLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginTop: 2 },

    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', height: 48, borderRadius: 12, paddingHorizontal: 15 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 13, fontWeight: '700', color: '#1E293B' },
    selectBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

    actionHeader: { flexDirection: 'row', gap: 10 },
    sitePicker: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 15, borderRadius: 14, height: 50 },
    pickerHint: { fontSize: 7, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5 },
    pickerValue: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
    
    bulkBtns: { flexDirection: 'row', gap: 8 },
    bulkBtn: { width: 60, borderRadius: 14, justifyContent: 'center', alignItems: 'center', gap: 2 },
    bulkBtnTxt: { fontSize: 9, fontWeight: '900', color: '#fff' },

    list: { padding: 20, paddingBottom: 100 },
    workerCard: { backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', ...SHADOWS.small },
    selectedCard: { borderColor: '#2563EB', backgroundColor: '#F0F7FF' },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatarBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    avatarTxt: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
    workerInfo: { flex: 1, marginLeft: 15 },
    workerName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    cardStats: { flexDirection: 'row', gap: 20, borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 12 },
    statLine: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    statVal: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    elapsedBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 'auto' },
    elapsedText: { fontSize: 9, fontWeight: '900', color: '#2563EB' },

    empty: { padding: 50, alignItems: 'center' },
    emptyTxt: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginTop: 15 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '75%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
    modalItem: { padding: 16, borderRadius: 16, backgroundColor: '#F8FAFC', marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    modalItemSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    modalItemName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    modalItemLoc: { fontSize: 11, color: '#94A3B8', marginTop: 2 }
});

export default CrewClockScreen;

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
        position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40,
        alignSelf: 'center', zIndex: 9999, flexDirection: 'row',
        alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 12,
        borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 10,
    },
    success: { backgroundColor: '#10B981' },
    error: { backgroundColor: '#EF4444' },
    text: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
const PMCrewControlScreen = ({ navigation }) => {
    const { projects } = useApp();

    const [workers, setWorkers]               = useState([]);
    const [loading, setLoading]               = useState(true);
    const [isProcessing, setIsProcessing]     = useState(false);
    const [searchQuery, setSearchQuery]       = useState('');
    const [selectedWorkers, setSelectedWorkers] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);

    // Clock-in / Clock-out dropdown visibility
    const [clockInDDOpen, setClockInDDOpen]   = useState(false);
    const [clockOutDDOpen, setClockOutDDOpen] = useState(false);

    // Project picker modal
    const [projectModalVisible, setProjectModalVisible] = useState(false);

    // Manual entry modal
    const [manualModalVisible, setManualModalVisible]     = useState(false);
    const [manualWorker, setManualWorker]                 = useState(null);
    const [isManualClockOut, setIsManualClockOut]         = useState(false);
    const [manualData, setManualData]                     = useState({
        date: new Date().toISOString().split('T')[0],
        clockIn: '',
        clockOut: '',
        reason: '',
        projectId: '',
    });

    // Stats
    const [stats, setStats] = useState({ onSite: 0, offDuty: 0, total: 0 });

    // Toast
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    // ── Live 1-second ticker — drives elapsed time on clocked-in cards ──────
    const [now, setNow] = useState(new Date());
    const tickRef = useRef(null);
    useEffect(() => {
        tickRef.current = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(tickRef.current);
    }, []);

    // ── Helper: elapsed time since clockIn ISO string ──────────────────────
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
            // Only show full loader if we have no data yet
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
                    isManual: activeLog?.isManual || false,
                    activeLogId: activeLog?._id || activeLog?.id || null,
                    // Raw ISO — used by live elapsed timer
                    clockInISO: activeLog?.clockIn || null,
                    // Formatted "In since HH:MM" label
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
    }, []);

    useEffect(() => {
        const unsub = navigation.addListener('focus', fetchCrewData);
        fetchCrewData();
        // Background refresh every 30s (matches web socket update pattern)
        const bgRefresh = setInterval(fetchCrewData, 30000);
        return () => { unsub(); clearInterval(bgRefresh); };
    }, [navigation]);

    // ── Selection ─────────────────────────────────────────────────────────
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

    // ── Bulk Clock In ─────────────────────────────────────────────────────
    const handleBulkClockIn = async () => {
        const projId = selectedProject?._id || selectedProject?.id;
        if (!projId) {
            showToast('Please select a target site first', 'error'); return;
        }
        if (selectedWorkers.length === 0) return;

        try {
            setIsProcessing(true);
            
            let coords = { latitude: 0, longitude: 0, accuracy: 0 };
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, accuracy: loc.coords.accuracy };
                }
            } catch (lex) { console.log('Location fetch error:', lex); }

            await Promise.all(
                selectedWorkers.map(wid => {
                    const worker = workers.find(w => (w._id || w.id) === wid);
                    if (!worker?.isClockedIn) {
                        return api.post('/timelogs/clock-in', {
                            userId: wid, 
                            projectId: projId,
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                            accuracy: coords.accuracy,
                            deviceInfo: `Mobile PM Dashboard: ${Platform.OS}`
                        });
                    }
                    return Promise.resolve();
                })
            );
            await fetchCrewData();
            setSelectedWorkers([]);
            showToast(`${selectedWorkers.length} crew clocked in successfully`);
        } catch (err) {
            console.error('Bulk clock-in error:', err.response?.data || err);
            showToast(err.response?.data?.message || 'Clock in failed', 'error');
        } finally {
            setIsProcessing(false);
            setClockInDDOpen(false);
        }
    };

    // ── Bulk Clock Out ────────────────────────────────────────────────────
    const handleBulkClockOut = async () => {
        if (selectedWorkers.length === 0) return;
        try {
            setIsProcessing(true);

            let coords = { latitude: 0, longitude: 0, accuracy: 0 };
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, accuracy: loc.coords.accuracy };
                }
            } catch (lex) { }

            await Promise.all(
                selectedWorkers.map(wid => {
                    const worker = workers.find(w => (w._id || w.id) === wid);
                    if (worker?.isClockedIn) {
                        return api.post('/timelogs/clock-out', {
                            userId: wid,
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                            accuracy: coords.accuracy,
                            deviceInfo: `Mobile PM Dashboard: ${Platform.OS}`
                        });
                    }
                    return Promise.resolve();
                })
            );
            await fetchCrewData();
            setSelectedWorkers([]);
            showToast(`${selectedWorkers.length} crew clocked out successfully`);
        } catch (err) {
            console.error('Bulk clock-out error:', err.response?.data || err);
            showToast(err.response?.data?.message || 'Clock out failed', 'error');
        } finally {
            setIsProcessing(false);
            setClockOutDDOpen(false);
        }
    };

    // ── Manual Entry Submit ───────────────────────────────────────────────
    const handleManualSubmit = async () => {
        if (!manualWorker || !manualData.clockIn || !manualData.date) {
            showToast('Fill in all required fields', 'error'); return;
        }
        const projId = manualData.projectId || (selectedProject?._id || selectedProject?.id);
        if (!projId) {
            showToast('Select a project first', 'error'); return;
        }

        try {
            setIsProcessing(true);
            const clockIn  = `${manualData.date}T${manualData.clockIn}`;
            const clockOut = manualData.clockOut ? `${manualData.date}T${manualData.clockOut}` : null;

            if (new Date(clockIn) > new Date()) {
                showToast('Cannot enter future clock-in time', 'error'); return;
            }
            if (clockOut && new Date(clockOut) < new Date(clockIn)) {
                showToast('Clock-out must be after clock-in', 'error'); return;
            }

            let coords = { latitude: 0, longitude: 0, accuracy: 0 };
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, accuracy: loc.coords.accuracy };
                }
            } catch (lex) { }

            if (isManualClockOut) {
                await api.post('/timelogs/clock-out', {
                    userId: manualWorker._id || manualWorker.id,
                    isManual: true,
                    clockOut: clockOut || new Date().toISOString(),
                    reason: manualData.reason,
                    latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy,
                });
            } else {
                await api.post('/timelogs/clock-in', {
                    userId: manualWorker._id || manualWorker.id, 
                    projectId: projId,
                    isManual: true, 
                    clockIn, 
                    clockOut,
                    reason: manualData.reason, 
                    latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy,
                });
            }

            await fetchCrewData();
            setManualModalVisible(false);
            setManualWorker(null);
            setIsManualClockOut(false);
            setManualData({ date: new Date().toISOString().split('T')[0], clockIn: '', clockOut: '', reason: '', projectId: '' });
            showToast('Manual entry recorded');
        } catch (err) {
            console.error('Manual entry error:', err.response?.data || err);
            showToast(err.response?.data?.message || 'Manual entry failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Filtered workers ──────────────────────────────────────────────────
    const filteredWorkers = workers.filter(w =>
        (w.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const allSelected = filteredWorkers.length > 0 &&
        filteredWorkers.every(w => selectedWorkers.includes(w._id || w.id));

    // ─── Render Worker Card ───────────────────────────────────────────────
    const renderWorkerCard = ({ item }) => {
        const workerId = item._id || item.id;
        const selected = selectedWorkers.includes(workerId);
        const elapsed  = item.isClockedIn ? getElapsed(item.clockInISO) : null;

        return (
            <TouchableOpacity
                style={[styles.workerCard, selected && styles.workerCardSelected]}
                onPress={() => toggleSelection(workerId)}
                activeOpacity={0.85}
            >
                {/* ── Top row: checkbox + avatar + name + status ── */}
                <View style={styles.cardRow}>
                    <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                        {selected && <MaterialCommunityIcons name="check" size={13} color="#fff" />}
                    </View>

                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarLetter}>
                            {(item.fullName || 'U')[0].toUpperCase()}
                        </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.workerName} numberOfLines={1}>{item.fullName}</Text>
                        <View style={styles.rolePill}>
                            <Text style={styles.rolePillText}>WORKER</Text>
                        </View>
                    </View>

                    {/* ── Current Status badge (exact web match) ── */}
                    <View style={[styles.statusBadge,
                        item.isClockedIn ? styles.statusLive : styles.statusOff
                    ]}>
                        {item.isClockedIn && <View style={styles.pulseDot} />}
                        <Text style={[styles.statusBadgeText,
                            { color: item.isClockedIn ? '#065F46' : '#64748B' }
                        ]}>
                            {item.isClockedIn ? 'Live on Site' : 'OFF DUTY'}
                        </Text>
                    </View>
                </View>

                {/* ── Assigned Jobsite ── */}
                <View style={styles.siteRow}>
                    <View style={styles.siteIconBox}>
                        <MaterialCommunityIcons name="map-marker-outline" size={12} color="#94A3B8" />
                    </View>
                    <Text style={styles.siteText} numberOfLines={1}>{item.site}</Text>
                    {item.isManual && (
                        <View style={styles.manualPill}>
                            <View style={styles.manualDot} />
                            <Text style={styles.manualPillText}>Manual Trace</Text>
                        </View>
                    )}
                </View>

                {/* ── Shift Metrics (exact web column layout) ── */}
                <View style={styles.metricsRow}>
                    {/* Left: Assigned Site label */}
                    <View style={styles.metricsLeft}>
                        <Text style={styles.metricsLabel}>ASSIGNED SITE</Text>
                        <Text style={styles.metricsValue} numberOfLines={1}>{item.site}</Text>
                    </View>

                    {/* Right: LOGGED ACTIVE / --:-- chip + Today's Shift Log */}
                    <View style={styles.metricsRight}>
                        <View style={item.isClockedIn ? styles.loggedActiveChip : styles.offDutyChip}>
                            <MaterialCommunityIcons
                                name="clock-outline"
                                size={13}
                                color={item.isClockedIn ? '#059669' : '#94A3B8'}
                                strokeWidth={3}
                            />
                            <Text style={item.isClockedIn ? styles.loggedActiveText : styles.offDutyText}>
                                {item.isClockedIn ? 'LOGGED ACTIVE' : '--:--'}
                            </Text>
                        </View>

                        {/* Live elapsed time */}
                        {item.isClockedIn && elapsed && (
                            <View style={styles.elapsedRow}>
                                <MaterialCommunityIcons name="timer-outline" size={11} color="#10B981" />
                                <Text style={styles.elapsedText}>
                                    {elapsed} • In since {item.clockInFormatted}
                                </Text>
                            </View>
                        )}

                        {/* Today's Shift Log — always visible (matches web) */}
                        <TouchableOpacity
                            style={styles.shiftLogBtn}
                            onPress={() => navigation.navigate('WorkerLogs', { userId: item._id, workerName: item.fullName })}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={styles.shiftLogText}>Today's Shift Log</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            <Toast {...toast} />

            {/* ── Header ────────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#0F172A" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.pageTitle}>Crew Control</Text>
                    <Text style={styles.pageSubtitle}>Manage on-site workforce attendance</Text>
                </View>
                {loading && workers.length > 0 && (
                    <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 10 }} />
                )}
                <TouchableOpacity onPress={fetchCrewData} disabled={loading}>
                    <MaterialCommunityIcons
                        name="refresh"
                        size={22}
                        color={loading ? '#CBD5E1' : '#2563EB'}
                        style={loading && { opacity: 0.5 }}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Live Status Pill ──────────────────────────── */}
                <View style={styles.livePill}>
                    <View style={styles.pulseDotGreen} />
                    <Text style={styles.livePillText}>
                        Live: {stats.onSite} Workers Active
                    </Text>
                </View>

                {/* Stats Row Removed as per request */}

                {/* ── Search ───────────────────────────────────── */}
                <View style={styles.searchBox}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search crew members by name..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={18} color="#CBD5E1" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Site Selector ─────────────────────────────── */}
                <TouchableOpacity
                    style={styles.siteSelector}
                    onPress={() => setProjectModalVisible(true)}
                >
                    <MaterialCommunityIcons name="map-marker-outline" size={20} color="#2563EB" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.siteSelectorLabel}>TARGET SITE</Text>
                        <Text style={styles.siteSelectorValue} numberOfLines={1}>
                            {selectedProject ? selectedProject.name : 'Select Target Site...'}
                        </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-down" size={20} color="#94A3B8" />
                </TouchableOpacity>

                {/* ── Action Bar ───────────────────────────────── */}
                <View style={styles.actionBar}>
                    {/* ── Clock In Dropdown ── */}
                    <View style={{ flex: 1 }}>
                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                { backgroundColor: selectedWorkers.length > 0 ? '#2563EB' : '#E2E8F0' }
                            ]}
                            onPress={() => {
                                setClockOutDDOpen(false);
                                setClockInDDOpen(prev => !prev);
                            }}
                            disabled={selectedWorkers.length === 0 || isProcessing}
                        >
                            {isProcessing
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <MaterialCommunityIcons name="play" size={14}
                                    color={selectedWorkers.length > 0 ? '#fff' : '#94A3B8'} />
                            }
                            <Text style={[
                                styles.actionBtnText,
                                { color: selectedWorkers.length > 0 ? '#fff' : '#94A3B8' }
                            ]}>
                                Clock In ({selectedWorkers.length})
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={14}
                                color={selectedWorkers.length > 0 ? '#fff' : '#94A3B8'} />
                        </TouchableOpacity>

                        {clockInDDOpen && (
                            <View style={styles.dropdown}>
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={handleBulkClockIn}
                                >
                                    <MaterialCommunityIcons name="refresh" size={14} color="#2563EB" />
                                    <Text style={[styles.dropdownItemText, { color: '#2563EB' }]}>
                                        Auto Clock In
                                    </Text>
                                </TouchableOpacity>
                                <View style={styles.dropdownDivider} />
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        const worker = workers.find(w => w._id === selectedWorkers[0]);
                                        if (worker) {
                                            setManualWorker(worker);
                                            setIsManualClockOut(false);
                                            setClockInDDOpen(false);
                                            setManualModalVisible(true);
                                        }
                                    }}
                                >
                                    <MaterialCommunityIcons name="calendar-edit" size={14} color="#F59E0B" />
                                    <Text style={[styles.dropdownItemText, { color: '#F59E0B' }]}>
                                        Manual Entry
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* ── Clock Out Dropdown ── */}
                    <View style={{ flex: 1 }}>
                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                { backgroundColor: selectedWorkers.length > 0 ? '#EF4444' : '#E2E8F0' }
                            ]}
                            onPress={() => {
                                setClockInDDOpen(false);
                                setClockOutDDOpen(prev => !prev);
                            }}
                            disabled={selectedWorkers.length === 0 || isProcessing}
                        >
                            {isProcessing
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <MaterialCommunityIcons name="stop" size={14}
                                    color={selectedWorkers.length > 0 ? '#fff' : '#94A3B8'} />
                            }
                            <Text style={[
                                styles.actionBtnText,
                                { color: selectedWorkers.length > 0 ? '#fff' : '#94A3B8' }
                            ]}>
                                Clock Out ({selectedWorkers.length})
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={14}
                                color={selectedWorkers.length > 0 ? '#fff' : '#94A3B8'} />
                        </TouchableOpacity>

                        {clockOutDDOpen && (
                            <View style={styles.dropdown}>
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={handleBulkClockOut}
                                >
                                    <MaterialCommunityIcons name="refresh" size={14} color="#EF4444" />
                                    <Text style={[styles.dropdownItemText, { color: '#EF4444' }]}>
                                        Auto Clock Out
                                    </Text>
                                </TouchableOpacity>
                                <View style={styles.dropdownDivider} />
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        const worker = workers.find(w => w._id === selectedWorkers[0]);
                                        if (worker) {
                                            setManualWorker(worker);
                                            setIsManualClockOut(true);
                                            setClockOutDDOpen(false);
                                            setManualModalVisible(true);
                                        }
                                    }}
                                >
                                    <MaterialCommunityIcons name="calendar-edit" size={14} color="#F59E0B" />
                                    <Text style={[styles.dropdownItemText, { color: '#F59E0B' }]}>
                                        Manual Entry
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Crew Table Header ────────────────────────── */}
                <View style={styles.tableHeader}>
                    <TouchableOpacity
                        style={[styles.headerCheckbox, allSelected && styles.headerCheckboxActive]}
                        onPress={selectAll}
                    >
                        {allSelected && <MaterialCommunityIcons name="check" size={12} color="#fff" />}
                    </TouchableOpacity>
                    <Text style={[styles.tableHeaderText, { flex: 1.8 }]}>Worker Identity</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1.2, textAlign: 'center' }]}>Current Status</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Shift Metrics</Text>
                </View>

                {/* ── Worker List ───────────────────────────────── */}
                {loading ? (
                    <View style={styles.loadingView}>
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text style={styles.loadingText}>Synchronizing Crew Data...</Text>
                    </View>
                ) : filteredWorkers.length === 0 ? (
                    <View style={styles.emptyView}>
                        <MaterialCommunityIcons name="account-search-outline" size={52} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No workers found</Text>
                    </View>
                ) : (
                    filteredWorkers.map(item => (
                        <React.Fragment key={item._id}>
                            {renderWorkerCard({ item })}
                        </React.Fragment>
                    ))
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* ── Backdrop to close dropdowns ───────────────────── */}
            {(clockInDDOpen || clockOutDDOpen) && (
                <Pressable
                    style={StyleSheet.absoluteFillObject}
                    onPress={() => { setClockInDDOpen(false); setClockOutDDOpen(false); }}
                />
            )}

            {/* ── Project Picker Modal ──────────────────────────── */}
            <Modal visible={projectModalVisible} transparent animationType="slide" onRequestClose={() => setProjectModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Target Jobsite</Text>
                            <TouchableOpacity onPress={() => setProjectModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#0F172A" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={projects || []}
                            keyExtractor={p => p._id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            renderItem={({ item }) => {
                                const isActive = selectedProject?._id === item._id;
                                return (
                                    <TouchableOpacity
                                        style={[styles.projectItem, isActive && styles.projectItemActive]}
                                        onPress={() => { setSelectedProject(item); setProjectModalVisible(false); }}
                                    >
                                        <View>
                                            <Text style={[styles.projectName, isActive && { color: '#fff' }]}>
                                                {item.name}
                                            </Text>
                                            <Text style={[styles.projectLoc, isActive && { color: 'rgba(255,255,255,0.7)' }]}>
                                                {item.location || 'Site Location'}
                                            </Text>
                                        </View>
                                        {isActive && (
                                            <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                <View style={styles.emptyView}>
                                    <Text style={styles.emptyText}>No projects found</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* ── Manual Entry Modal ────────────────────────────── */}
            <Modal visible={manualModalVisible} transparent animationType="slide" onRequestClose={() => setManualModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={[styles.modalSheet, { paddingBottom: 50 }]}>
                            <View style={styles.modalHandle} />
                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>Manual Time Entry</Text>
                                    <Text style={styles.modalSubtitle}>Recording for {manualWorker?.fullName}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                                    <MaterialCommunityIcons name="close" size={24} color="#0F172A" />
                                </TouchableOpacity>
                            </View>

                            {/* Worker name (readonly) */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>WORKER NAME</Text>
                                <View style={styles.formInputReadonly}>
                                    <MaterialCommunityIcons name="account-outline" size={18} color="#94A3B8" />
                                    <Text style={styles.readonlyText}>{manualWorker?.fullName || ''}</Text>
                                </View>
                            </View>

                            {/* Target Project */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>TARGET PROJECT</Text>
                                <View style={styles.formPickerWrap}>
                                    <MaterialCommunityIcons name="map-marker-outline" size={18} color="#94A3B8" />
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                                        {(projects || []).map(p => (
                                            <TouchableOpacity
                                                key={p._id}
                                                style={[
                                                    styles.projectChip,
                                                    (manualData.projectId || selectedProject?._id) === p._id && styles.projectChipActive
                                                ]}
                                                onPress={() => setManualData({ ...manualData, projectId: p._id })}
                                            >
                                                <Text style={[
                                                    styles.projectChipText,
                                                    (manualData.projectId || selectedProject?._id) === p._id && { color: '#fff' }
                                                ]}>{p.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            {/* Work Date */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>WORK DATE</Text>
                                <View style={styles.formInput}>
                                    <MaterialCommunityIcons name="calendar-outline" size={18} color="#94A3B8" />
                                    <TextInput
                                        style={styles.formInputText}
                                        value={manualData.date}
                                        onChangeText={val => setManualData({ ...manualData, date: val })}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#CBD5E1"
                                    />
                                </View>
                            </View>

                            {/* Clock In / Out times */}
                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.formLabel}>CLOCK IN TIME *</Text>
                                    <View style={styles.formInput}>
                                        <MaterialCommunityIcons name="clock-in" size={18} color="#10B981" />
                                        <TextInput
                                            style={styles.formInputText}
                                            value={manualData.clockIn}
                                            onChangeText={val => setManualData({ ...manualData, clockIn: val })}
                                            placeholder="HH:MM"
                                            placeholderTextColor="#CBD5E1"
                                        />
                                    </View>
                                </View>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={styles.formLabel}>CLOCK OUT (OPT.)</Text>
                                    <View style={styles.formInput}>
                                        <MaterialCommunityIcons name="clock-out" size={18} color="#EF4444" />
                                        <TextInput
                                            style={styles.formInputText}
                                            value={manualData.clockOut}
                                            onChangeText={val => setManualData({ ...manualData, clockOut: val })}
                                            placeholder="HH:MM"
                                            placeholderTextColor="#CBD5E1"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Reason / Note */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>REASON / NOTE</Text>
                                <TextInput
                                    style={styles.formTextarea}
                                    value={manualData.reason}
                                    onChangeText={val => setManualData({ ...manualData, reason: val })}
                                    placeholder="Explain why this entry is manual..."
                                    placeholderTextColor="#CBD5E1"
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Buttons */}
                            <View style={styles.manualBtnRow}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setManualModalVisible(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.submitBtn, isProcessing && { opacity: 0.6 }]}
                                    onPress={handleManualSubmit}
                                    disabled={isProcessing}
                                >
                                    {isProcessing
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
                                    }
                                    <Text style={styles.submitBtnText}>Submit Entry</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, 
        paddingTop: Platform.OS === 'ios' ? 45 : 55, // Further increased top padding
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },
    pageTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 11, fontWeight: '700', color: '#64748B', marginTop: 1 },

    scrollContent: { paddingHorizontal: 16, paddingTop: 36 },

    // Live pill
    livePill: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0',
        marginBottom: 16, gap: 8,
    },
    pulseDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
    livePillText: { fontSize: 11, fontWeight: '900', color: '#1E293B', letterSpacing: 0.5 },

    // Stats
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 14,
        alignItems: 'center', borderTopWidth: 3,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    statNum: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginTop: 6 },
    statLbl: { fontSize: 9, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', marginTop: 2 },

    // Search
    searchBox: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 16, paddingHorizontal: 14, height: 50, gap: 10,
        borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12,
    },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0F172A' },

    // Site selector
    siteSelector: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 16, paddingHorizontal: 14, height: 58,
        borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16,
    },
    siteSelectorLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5 },
    siteSelectorValue: { fontSize: 14, fontWeight: '800', color: '#1E293B' },

    // Action Bar
    actionBar: { flexDirection: 'row', gap: 10, marginBottom: 16, zIndex: 10 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 12, borderRadius: 14,
    },
    actionBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    dropdown: {
        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
        backgroundColor: '#fff', borderRadius: 14, marginTop: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
        borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 14,
    },
    dropdownItemText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
    dropdownDivider: { height: 1, backgroundColor: '#F8FAFC' },

    // Table header
    tableHeader: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F8FAFC', borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 10,
        marginBottom: 10, gap: 10,
    },
    headerCheckbox: {
        width: 22, height: 22, borderRadius: 6, borderWidth: 2,
        borderColor: '#CBD5E1', backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center',
    },
    headerCheckboxActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    tableHeaderText: { fontSize: 9, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },

    // Worker Card
    workerCard: {
        backgroundColor: '#fff', borderRadius: 20, marginBottom: 12,
        borderWidth: 1.5, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, overflow: 'hidden',
    },
    workerCardSelected: { borderColor: '#BFDBFE', backgroundColor: '#F0F7FF' },

    cardRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 14, gap: 10,
    },
    checkbox: {
        width: 22, height: 22, borderRadius: 7, borderWidth: 2,
        borderColor: '#CBD5E1', backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center',
    },
    checkboxActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    avatarCircle: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#BFDBFE',
    },
    avatarLetter: { fontSize: 18, fontWeight: '900', color: '#1D4ED8' },
    workerName: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
    rolePill: {
        backgroundColor: '#EFF6FF', alignSelf: 'flex-start',
        paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, marginTop: 3,
    },
    rolePillText: { fontSize: 8, fontWeight: '900', color: '#2563EB', letterSpacing: 1 },

    // Status badge — matches web exactly
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50,
        borderWidth: 1,
    },
    statusLive: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
    statusOff:  { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
    pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    statusBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

    // Jobsite row
    siteRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 14, paddingBottom: 10,
    },
    siteIconBox: {
        width: 22, height: 22, borderRadius: 6, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },
    siteText: { fontSize: 12, fontWeight: '700', color: '#64748B', flex: 1 },

    // Manual trace pill
    manualPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A',
    },
    manualDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F59E0B' },
    manualPillText: { fontSize: 8, fontWeight: '900', color: '#92400E', letterSpacing: 0.5 },

    // Metrics row (bottom section of each card)
    metricsRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: 14, paddingBottom: 14, gap: 10,
    },
    metricsLeft: { flex: 1 },
    metricsLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase' },
    metricsValue: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 2 },

    metricsRight: { alignItems: 'flex-end', gap: 5 },

    // LOGGED ACTIVE chip — exact web match (emerald bg + border)
    loggedActiveChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0',
    },
    loggedActiveText: { fontSize: 11, fontWeight: '900', color: '#059669' },

    // OFF DUTY chip
    offDutyChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 4, paddingVertical: 4,
    },
    offDutyText: { fontSize: 11, fontWeight: '900', color: '#94A3B8' },

    // Live elapsed timer
    elapsedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    elapsedText: { fontSize: 10, fontWeight: '700', color: '#10B981' },

    // Today's Shift Log link — always visible (exact web match)
    shiftLogBtn: { flexDirection: 'row', alignItems: 'center' },
    shiftLogText: {
        fontSize: 10, fontWeight: '900', color: '#94A3B8',
        letterSpacing: 0.5,
        textDecorationLine: 'underline',
        textDecorationColor: '#E2E8F0',
    },

    loadingView: { paddingVertical: 60, alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
    emptyView: { paddingVertical: 60, alignItems: 'center', gap: 10 },
    emptyText: { fontSize: 13, fontWeight: '800', color: '#CBD5E1' },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        paddingHorizontal: 20, paddingTop: 12, maxHeight: '90%',
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0',
        alignSelf: 'center', marginBottom: 16,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    modalSubtitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 2 },

    projectItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, borderRadius: 16, marginBottom: 10,
        backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    },
    projectItemActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    projectName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    projectLoc: { fontSize: 11, color: '#64748B', marginTop: 2 },

    // Manual Entry Form
    formGroup: { marginBottom: 14 },
    formLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 6 },
    formInput: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14, height: 48,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    formInputText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1E293B' },
    formInputReadonly: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 14, height: 48,
    },
    readonlyText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
    formPickerWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    projectChip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
        backgroundColor: '#E2E8F0', marginRight: 8,
    },
    projectChipActive: { backgroundColor: '#2563EB' },
    projectChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
    formRow: { flexDirection: 'row', gap: 12 },
    formTextarea: {
        backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14,
        paddingTop: 12, paddingBottom: 12, minHeight: 90,
        borderWidth: 1, borderColor: '#E2E8F0',
        fontSize: 14, fontWeight: '600', color: '#1E293B',
    },
    manualBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelBtn: {
        flex: 1, height: 50, justifyContent: 'center', alignItems: 'center',
        borderRadius: 14, backgroundColor: '#F1F5F9',
    },
    cancelBtnText: { fontSize: 13, fontWeight: '900', color: '#64748B' },
    submitBtn: {
        flex: 1.5, height: 50, flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', gap: 8, borderRadius: 14, backgroundColor: '#2563EB',
    },
    submitBtnText: { fontSize: 13, fontWeight: '900', color: '#fff' },
});

export default PMCrewControlScreen;

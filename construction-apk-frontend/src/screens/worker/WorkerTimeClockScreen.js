import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView, StatusBar, Platform, Modal, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import WorkerHeader from '../../components/WorkerHeader';

const { width } = Dimensions.get('window');

const WorkerTimeClockScreen = ({ navigation }) => {
    const { isClockedIn, toggleClock, getWorkDuration, projects, user, timeLogs, tasks, metrics } = useApp();
    const [timer, setTimer] = useState('00:00:00');
    const [selectedSite, setSelectedSite] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showSiteModal, setShowSiteModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        if (!isClockedIn && projects.length === 1 && !selectedSite) {
            setSelectedSite(projects[0]);
        }
    }, [projects, isClockedIn]);

    useEffect(() => {
        if (isClockedIn && timeLogs.length > 0) {
            const activeLog = timeLogs.find(log => !log.clockOut);
            if (activeLog && activeLog.projectId) {
                const project = projects.find(p => (p._id || p.id) === (activeLog.projectId._id || activeLog.projectId));
                if (project) setSelectedSite(project);
            }
        }
    }, [isClockedIn, timeLogs, projects]);

    useEffect(() => {
        let interval;
        if (isClockedIn) {
            interval = setInterval(() => {
                setTimer(getWorkDuration() || '00:00:00');
            }, 1000);
        } else {
            setTimer('00:00:00');
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isClockedIn]);

    const handleSelectOption = (item, type) => {
        if (type === 'project') {
            setSelectedSite(item);
            setSelectedTask(null);
        } else {
            // It's a task. Find the project it belongs to.
            const project = projects.find(p => (p._id || p.id) === (item.projectId?._id || item.projectId));
            setSelectedSite(project || item.projectId);
            setSelectedTask(item);
        }
        setShowSiteModal(false);
    };

    const handleAction = async () => {
        if (!isClockedIn && !selectedSite) {
            setShowSiteModal(true);
            return;
        }

        setLoading(true);
        try {
            await toggleClock(
                selectedSite?._id || selectedSite?.id, 
                selectedTask?._id || selectedTask?.id
            );
        } catch (e) {
            console.error('Clock action error:', e);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (date) => {
        if (!date) return '--:--';
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const sortedLogs = [...timeLogs].sort((a, b) => new Date(b.clockIn) - new Date(a.clockIn)).slice(0, 5);

    // Filter tasks assigned to worker
    const myTasks = tasks.filter(t => t.status !== 'completed');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="My Clock" />
            
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.headerSection}>
                    <Text style={styles.mainTitle}>TIME CLOCK</Text>
                    <Text style={styles.headerDesc}>PRECISION TRACKING FOR YOUR DAY</Text>
                </View>

                {/* MAIN TIMER CARD */}
                <View style={styles.clockCard}>
                    <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, { backgroundColor: isClockedIn ? '#10B981' : '#94A3B8' }]} />
                        <Text style={styles.statusText}>{isClockedIn ? 'ON CLOCK' : 'OFF CLOCK'}</Text>
                    </View>

                    <Text style={styles.timerLarge}>{timer}</Text>

                    <Text style={styles.selectorLabel}>SELECT WORKING SITE / TASK</Text>
                    <TouchableOpacity 
                        style={styles.dropdown} 
                        onPress={() => !isClockedIn && setShowSiteModal(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.dropdownText} numberOfLines={1}>
                            {selectedTask ? `${selectedTask.title} (${selectedSite?.name})` : (selectedSite ? selectedSite.name : '-- Choose Task / Project --')}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
                    </TouchableOpacity>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#94A3B8" />
                            <Text style={styles.metaText}>{selectedSite ? 'Site Selected' : 'No Active Site'}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <MaterialCommunityIcons name="check-circle-outline" size={16} color={selectedSite ? '#2563EB' : '#94A3B8'} />
                            <Text style={[styles.metaText, selectedSite && { color: '#2563EB' }]}>Verified Site</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.actionBtn, isClockedIn ? styles.stopBtn : styles.startBtn]}
                        onPress={handleAction}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name={isClockedIn ? "stop" : "play"} size={22} color="#fff" />
                                <Text style={styles.actionBtnText}>
                                    {isClockedIn ? 'STOP TIMER & CLOCK OUT' : 'START TIMER & CLOCK IN'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.footerNote}>AUTO-SYNCING YOUR GPS LOCATION...</Text>

                    <View style={styles.divider} />

                    <View style={styles.bottomStats}>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>STARTED AT</Text>
                            <Text style={styles.statValue}>{isClockedIn && timeLogs.length > 0 ? formatTime(timeLogs.find(l => !l.clockOut)?.clockIn) : '--:--'}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>SITE ENTRY</Text>
                            <Text style={styles.statValue}>{isClockedIn ? 'Clocked In' : 'Not Clocked In'}</Text>
                        </View>
                    </View>
                </View>

                {/* QUICK ACTIONS */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionBox} onPress={() => navigation.navigate('MainTabs', { screen: 'Photos' })}>
                        <View style={styles.actionIconCircle}>
                            <MaterialCommunityIcons name="camera-outline" size={20} color="#2563EB" />
                        </View>
                        <Text style={styles.actionBoxLabel}>SUBMIT PHOTO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBox} onPress={() => navigation.navigate('WorkerLogs')}>
                        <View style={styles.actionIconCircle}>
                            <MaterialCommunityIcons name="refresh" size={20} color="#F59E0B" />
                        </View>
                        <Text style={styles.actionBoxLabel}>REQUEST CORRECTION</Text>
                    </TouchableOpacity>
                </View>

                {/* HISTORY */}
                <View style={styles.historyContainer}>
                    <View style={styles.historyHeader}>
                        <View style={styles.historyTitleRow}>
                            <MaterialCommunityIcons name="history" size={20} color="#475569" />
                            <Text style={styles.historyTitle}>RECENT HISTORY</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('WorkerLogs')}>
                            <Text style={styles.viewAllText}>VIEW ALL</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.historyList}>
                        {sortedLogs.length > 0 ? sortedLogs.map((log, idx) => (
                            <View key={log._id || idx} style={styles.historyRow}>
                                <View style={styles.historyMain}>
                                    <Text style={styles.historyDate}>{new Date(log.clockIn).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                                    <Text style={styles.historySite}>{log.projectId?.name || '---'}</Text>
                                </View>
                                <View style={styles.historyMeta}>
                                    <Text style={styles.historyTime}>{formatTime(log.clockIn)} - {formatTime(log.clockOut)}</Text>
                                    <Text style={styles.historyDuration}>{log.clockOut ? (Math.floor((new Date(log.clockOut) - new Date(log.clockIn))/3600000) + 'H ' + Math.floor(((new Date(log.clockOut) - new Date(log.clockIn))%3600000)/60000) + 'M') : 'ACTIVE'}</Text>
                                </View>
                            </View>
                        )) : (
                            <Text style={styles.noData}>No recent logs</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            <Modal transparent visible={showSiteModal} animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={() => setShowSiteModal(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Choose Task / Project</Text>
                            <TouchableOpacity onPress={() => setShowSiteModal(false)}>
                                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* MY TASKS SECTION */}
                            <Text style={styles.sectionHeader}>My Tasks</Text>
                            {myTasks.map((t) => (
                                <TouchableOpacity 
                                    key={t._id || t.id} 
                                    style={styles.dropdownOption}
                                    onPress={() => handleSelectOption(t, 'task')}
                                >
                                    <Text style={styles.optionText}>
                                        <Text style={styles.prefixText}>{t.parentTask ? 'Sub: ' : 'Task: '}</Text>
                                        <Text style={styles.mainText}>{t.title} </Text>
                                        <Text style={styles.metaText}>
                                            ({t.parentTask ? 'Subassignment / See Parent Task' : `${t.jobId?.name || 'Job'} / ${t.projectId?.name || 'Project'}`})
                                        </Text>
                                    </Text>
                                    {selectedTask?._id === t._id && <MaterialCommunityIcons name="check" size={16} color="#2563EB" />}
                                </TouchableOpacity>
                            ))}

                            {/* GENERAL ATTENDANCE SECTION */}
                            <Text style={styles.sectionHeader}>General Site Attendance</Text>
                            {projects.map((p) => (
                                <TouchableOpacity 
                                    key={p._id || p.id} 
                                    style={styles.dropdownOption}
                                    onPress={() => handleSelectOption(p, 'project')}
                                >
                                    <Text style={styles.optionText}>
                                        <Text style={styles.prefixText}>Project: </Text>
                                        <Text style={styles.mainText}>{p.name} </Text>
                                        <Text style={styles.metaText}>({p.jobName || 'Demo Project job'})</Text>
                                    </Text>
                                    {selectedSite?._id === p._id && !selectedTask && <MaterialCommunityIcons name="check" size={16} color="#2563EB" />}
                                </TouchableOpacity>
                            ))}

                            {/* OTHER SECTION */}
                            <Text style={styles.sectionHeader}>Other</Text>
                            <TouchableOpacity 
                                style={styles.dropdownOption}
                                onPress={() => { setSelectedSite(null); setSelectedTask(null); setShowSiteModal(false); }}
                            >
                                <Text style={[styles.optionText, { marginLeft: 15 }]}>
                                    <Text style={styles.mainText}>Random Site / Emergency Attendance</Text>
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingBottom: 60 },
    
    headerSection: { alignItems: 'center', marginTop: 20, marginBottom: 15 },
    mainTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    headerDesc: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 2, letterSpacing: 0.5 },

    clockCard: { 
        backgroundColor: '#fff', 
        marginHorizontal: 16, 
        borderRadius: 32, 
        padding: 20, 
        alignItems: 'center',
        ...SHADOWS.small 
    },
    statusBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 9, fontWeight: '900', color: '#64748B', letterSpacing: 0.5 },

    timerLarge: { fontSize: 52, fontWeight: '900', color: '#0F172A', letterSpacing: -1, marginVertical: 8 },

    selectorLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginTop: 10, marginBottom: 8 },
    dropdown: { 
        width: '100%', 
        height: 48, 
        backgroundColor: '#F8FAFC', 
        borderRadius: 14, 
        borderWidth: 1, 
        borderColor: '#E2E8F0', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 14 
    },
    dropdownText: { fontSize: 13, fontWeight: '700', color: '#475569', flex: 1 },

    metaRow: { flexDirection: 'row', gap: 15, marginVertical: 15 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontSize: 11, fontWeight: '800', color: '#94A3B8' },

    actionBtn: { width: '100%', height: 60, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...SHADOWS.small },
    startBtn: { backgroundColor: '#2563EB' },
    stopBtn: { backgroundColor: '#EF4444' },
    actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.3 },

    footerNote: { fontSize: 8.5, fontWeight: '800', color: '#CBD5E1', marginTop: 15, letterSpacing: 0.5 },

    divider: { width: '100%', height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },

    bottomStats: { flexDirection: 'row', width: '100%' },
    statCol: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: '100%', backgroundColor: '#F1F5F9' },
    statLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.8 },
    statValue: { fontSize: 13, fontWeight: '900', color: '#1E293B', marginTop: 4 },

    actionsGrid: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, gap: 10 },
    actionBox: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 15, alignItems: 'center', gap: 8, ...SHADOWS.small },
    actionIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    actionBoxLabel: { fontSize: 9, fontWeight: '900', color: '#475569', letterSpacing: 0.3 },

    historyContainer: { marginHorizontal: 16, marginTop: 20, backgroundColor: '#fff', borderRadius: 24, padding: 20, ...SHADOWS.small },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    historyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    historyTitle: { fontSize: 10, fontWeight: '900', color: '#475569', letterSpacing: 0.8 },
    viewAllText: { fontSize: 10, fontWeight: '900', color: '#2563EB' },

    historyList: { gap: 15 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    historyMain: { flex: 1 },
    historyDate: { fontSize: 13, fontWeight: '900', color: '#1E293B' },
    historySite: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 2, textTransform: 'uppercase' },
    historyMeta: { alignItems: 'flex-end' },
    historyTime: { fontSize: 11, fontWeight: '800', color: '#475569' },
    historyDuration: { fontSize: 10, fontWeight: '900', color: '#94A3B8', marginTop: 2 },
    noData: { textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#CBD5E1', paddingVertical: 10 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 24, width: '100%', padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
    
    sectionHeader: { fontSize: 13, fontWeight: '900', color: '#1E293B', backgroundColor: '#F8FAFC', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginTop: 15, marginBottom: 5 },
    dropdownOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    optionText: { flex: 1, fontSize: 12, lineHeight: 18 },
    prefixText: { fontWeight: '800', color: '#64748B' },
    mainText: { fontWeight: '700', color: '#1E293B' },
    metaText: { fontWeight: '600', color: '#94A3B8' },
});

export default WorkerTimeClockScreen;

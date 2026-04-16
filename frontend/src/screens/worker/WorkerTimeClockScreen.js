import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView, StatusBar, Platform, Modal } from 'react-native';
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
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        // Auto-select if exactly one project is available (common for foremen/workers)
        if (!isClockedIn && projects.length === 1 && !selectedSite) {
            setSelectedSite(projects[0]);
        }
    }, [projects, isClockedIn]);

    // Update selected site if it's already clocked in
    useEffect(() => {
        if (isClockedIn && timeLogs.length > 0) {
            const activeLog = timeLogs.find(log => !log.clockOut);
            if (activeLog && activeLog.projectId) {
                const project = projects.find(p => (p._id || p.id) === (activeLog.projectId._id || activeLog.projectId));
                if (project) setSelectedSite(project);
                if (activeLog.taskId) {
                    const task = tasks.find(t => (t._id || t.id) === (activeLog.taskId._id || activeLog.taskId));
                    if (task) setSelectedTask(task);
                }
            }
        }
    }, [isClockedIn, timeLogs, projects, tasks]);

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

    const handleAction = async () => {
        if (!isClockedIn && !selectedSite) {
            setShowSiteModal(true);
            return;
        }

        setLoading(true);
        try {
            await toggleClock(selectedSite?._id || selectedSite?.id, selectedTask?._id || selectedTask?.id);
        } catch (e) {
            alert(e.message || 'Clock action failed');
        } finally {
            setLoading(false);
        }
    };

    const projectTasks = tasks.filter(t => 
        (t.projectId?._id || t.projectId) === (selectedSite?._id || selectedSite?.id)
    );

    const formatDuration = (start, end) => {
        if (!end) return 'Active';
        const h = Math.floor((new Date(end) - new Date(start)) / 3600000);
        const m = Math.floor(((new Date(end) - new Date(start)) % 3600000) / 60000);
        return `${h}H ${m}M`;
    };

    const formatTimeRange = (start, end) => {
        const s = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        if (!end) return `${s} - ....`;
        const e = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${s} - ${e}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="TIME CLOCK" />

            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="clock-outline" size={80} color="#E2E8F0" />
                <Text style={styles.emptyTitle}>Time Clock</Text>
                <Text style={styles.emptySubtitle}>Content is being updated by the Project Manager.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingBottom: 60 },
    headerSection: { alignItems: 'center', marginTop: 32, marginBottom: 24 },
    subTitle: { fontSize: 24, fontWeight: '900', color: '#64748B', letterSpacing: 1.5, marginTop: 4, textTransform: 'uppercase' },

    timerCard: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 48, padding: 32, alignItems: 'center' },
    statusBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    statusDot: { width: 5, height: 5, borderRadius: 2.5 },
    statusText: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5 },
    timerDisplay: { fontSize: 68, fontWeight: '900', color: '#0F172A', letterSpacing: -1, marginVertical: 12 },

    indicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    indicatorItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    indicatorText: { fontSize: 12, fontWeight: '800', color: '#94A3B8' },
    separatorDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },

    primaryActionBtn: { width: '100%', height: 68, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.2 },
    footerNote: { fontSize: 9, fontWeight: '800', color: '#CBD5E1', marginTop: 18, letterSpacing: 0.8 },

    statRow: { flexDirection: 'row', width: '100%', marginTop: 32, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 24 },
    statCol: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.2 },
    statVal: { fontSize: 15, fontWeight: '900', color: '#1E293B', marginTop: 6 },
    statDivider: { width: 1, height: '100%', backgroundColor: '#F1F5F9' },

    quickActionsGrid: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 12 },
    quickActionBox: { flex: 1, backgroundColor: '#fff', height: 110, borderRadius: 28, justifyContent: 'center', alignItems: 'center', gap: 8 },
    quickActionInner: { marginBottom: 4 },
    quickActionLabel: { fontSize: 10, fontWeight: '900', color: '#475569', letterSpacing: 0.2 },

    historyCard: { marginHorizontal: 20, marginTop: 24, backgroundColor: '#fff', borderRadius: 28, padding: 24 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    sectionHeading: { fontSize: 11, fontWeight: '900', color: '#475569', letterSpacing: 1 },
    viewAllBtn: { fontSize: 10, fontWeight: '900', color: '#2563EB' },
    historyContent: { gap: 18 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    histLeft: { flex: 1 },
    histRight: { alignItems: 'flex-end', gap: 4 },
    histDateTag: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    histSiteName: { fontSize: 10, fontWeight: '900', color: '#94A3B8', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    histTimeRange: { fontSize: 12, fontWeight: '800', color: '#475569' },
    histDurationTag: { fontSize: 11, fontWeight: '900', color: '#94A3B8' },
    noLogsTxt: { fontSize: 10, fontWeight: '900', color: '#CBD5E1', textAlign: 'center', paddingVertical: 20 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 36, padding: 28, maxHeight: '75%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    modalProjectItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalItemText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
    emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginTop: 16 },
    emptySubtitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 },
});

export default WorkerTimeClockScreen;

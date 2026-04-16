import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Animated, StyleSheet, StatusBar, Modal, TouchableOpacity, Text, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import WorkerHeader from '../../components/WorkerHeader';
import SubcontractorDashboard from './SubcontractorDashboard';

const SubcontractorDashboardScreen = ({ navigation }) => {
    const { refreshData, isClockedIn, toggleClock, getWorkDuration, projects } = useApp();
    const [timer, setTimer] = useState('00:00:00');
    const [clockModal, setClockModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshData();
        });
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        return unsubscribe;
    }, [navigation]);

    // Timer Logic for Clock In
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

    const handleClockToggle = async (pId = null) => {
        try {
            if (!isClockedIn && !pId) {
                setClockModal(true);
                return;
            }
            await toggleClock(pId);
            setClockModal(false);
            refreshData();
        } catch (e) {
            const errorMsg = e.response?.data?.message || e.message;
            Alert.alert('Attendance Error', errorMsg || 'Could not sync with server.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <WorkerHeader title="Subcontractor" />

            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="view-dashboard-outline" size={80} color="#E2E8F0" />
                <Text style={styles.emptyTitle}>Subcontractor Dashboard</Text>
                <Text style={styles.emptySubtitle}>Content is being updated by the Project Manager.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scroll: { padding: 16, paddingBottom: 60 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
    modalIndicator: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    modalSub: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
    pSelectRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    pSelectIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    pSelectName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    pSelectLoc: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    cancelBtn: { width: '100%', padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#F1F5F9', marginTop: 20 },
    cancelBtnText: { fontWeight: '900', color: '#64748B', fontSize: 12 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
    emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginTop: 16 },
    emptySubtitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 },
});

export default SubcontractorDashboardScreen;

import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Animated, StatusBar, ActivityIndicator, Modal, TouchableOpacity, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import AppHeader from '../../components/AppHeader';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../utils/api';

// Role-specific imports
import WorkerDashboard from '../worker/WorkerDashboard';
import ForemanDashboard from '../foreman/ForemanDashboard';
import SubcontractorDashboard from '../subcontractor/SubcontractorDashboard';

const DashboardScreen = ({ navigation }) => {
    const { user, loading, isClockedIn, toggleClock, getWorkDuration, refreshData, projects } = useApp();
    const [timer, setTimer] = useState('00:00:00');
    const [saStats, setSaStats] = useState(null);
    const [coStats, setCoStats] = useState(null);
    const [saLoading, setSaLoading] = useState(false);
    const [clockModal, setClockModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshData();
        });
        return unsubscribe;
    }, [navigation, user]);


    const fadeAnims = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    useEffect(() => {
        Animated.stagger(100, fadeAnims.map(anim => Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 50 }))).start();
    }, []);

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

    if (loading) {
        return (
            <View style={styles.container}>
                <AppHeader />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading Dashboard...</Text>
                </View>
            </View>
        );
    }

    const role = user?.role || 'WORKER';
    const isWorker = role === 'WORKER' || role === 'FOREMAN' || role === 'SUBCONTRACTOR';

    const getTheme = () => {
        return { colors: ['#7C3AED', '#8B5CF6'], icon: 'account-hard-hat', label: 'My Workspace' };
    };
    const theme = getTheme();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" transparent backgroundColor="transparent" />
            <AppHeader />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Banner */}
                {!isWorker && (
                    <Animated.View style={[styles.bannerWrapper, { opacity: fadeAnims[0] }]}>
                        <LinearGradient colors={theme.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
                            <View style={styles.bannerInfo}>
                                <Text style={styles.bannerGreet}>{theme.label}</Text>
                                <Text style={styles.bannerLabel}>{user?.fullName || user?.name || 'User'}</Text>
                                <View style={styles.roleChip}>
                                    <Text style={styles.roleText}>{role.replace('_', ' ')}</Text>
                                </View>
                            </View>
                            <MaterialCommunityIcons name={theme.icon} size={80} color="rgba(255,255,255,0.12)" style={styles.bannerIcon} />
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* Dashboard Router */}
                {role === 'FOREMAN' && <ForemanDashboard navigation={navigation} />}
                {role === 'WORKER' && (
                    <WorkerDashboard
                        navigation={navigation}
                        timer={timer}
                        isClockedIn={isClockedIn}
                        handleClockToggle={handleClockToggle}
                        setClockModal={setClockModal}
                        selectedProject={selectedProject}
                    />
                )}
                {role === 'SUBCONTRACTOR' && (
                    <SubcontractorDashboard
                        navigation={navigation}
                        timer={timer}
                        isClockedIn={isClockedIn}
                        handleClockToggle={handleClockToggle}
                        setClockModal={setClockModal}
                        selectedProject={selectedProject}
                    />
                )}

                {/* Project Selection Modal for Clock-in */}
                <Modal visible={clockModal} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalIndicator} />
                            <Text style={styles.modalTitle}>Select Construction Site</Text>
                            <Text style={styles.modalSub}>WHERE ARE YOU WORKING TODAY?</Text>
                            <ScrollView style={{ marginTop: 20 }}>
                                {projects.map(p => (
                                    <TouchableOpacity
                                        key={p._id || p.id}
                                        style={styles.pSelectRow}
                                        onPress={() => {
                                            setSelectedProject(p);
                                            setClockModal(false);
                                            handleClockToggle(p._id || p.id);
                                        }}
                                    >
                                        <View style={styles.pSelectIcon}>
                                            <MaterialCommunityIcons name="office-building" size={20} color={COLORS.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.pSelectName}>{p.name}</Text>
                                            <Text style={styles.pSelectLoc}>{p.location?.address || 'Site Address TBD'}</Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setClockModal(false)}>
                                <Text style={styles.cancelBtnText}>CANCEL</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 13, fontWeight: '800', color: '#64748B' },
    scroll: { padding: 16, paddingTop: 60 },
    bannerWrapper: { borderRadius: 28, overflow: 'hidden', marginBottom: 20 },
    banner: { padding: 24, paddingVertical: 32, flexDirection: 'row', alignItems: 'center', position: 'relative' },
    bannerInfo: { flex: 1, zIndex: 2 },
    bannerGreet: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },
    bannerLabel: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 2 },
    roleChip: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 12, alignSelf: 'flex-start' },
    roleText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    bannerIcon: { position: 'absolute', right: -5, bottom: -10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
    modalIndicator: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    modalSub: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 1 },
    pSelectRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    pSelectIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    pSelectName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    pSelectLoc: { fontSize: 11, color: '#64748B', marginTop: 2 },
    cancelBtn: { width: '100%', padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#F1F5F9', marginTop: 20 },
    cancelBtnText: { fontWeight: '800', color: '#64748B' }
});

export default DashboardScreen;

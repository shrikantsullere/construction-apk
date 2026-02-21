import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, StatusBar, Dimensions, ActivityIndicator, Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, SIZES } from '../../theme/theme';
import { useApp } from '../../context/AppContext';
import AppHeader from '../../components/AppHeader';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ── Shared Stat Card Component ──────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, light, anim, subtext }) => (
    <Animated.View style={[styles.statCard, SHADOWS.small, { opacity: anim, transform: [{ scale: anim }] }]}>
        <View style={[styles.statIconWrap, { backgroundColor: light }]}>
            <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
    </Animated.View>
);

// ── Main Dashboard Screen ───────────────────────────────────────────────────
const DashboardScreen = ({ navigation }) => {
    const { user, metrics, activities, loading, isClockedIn, toggleClock, getWorkDuration } = useApp();
    const [timer, setTimer] = useState('00:00:00');

    const fadeAnims = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.stagger(100, [
            ...fadeAnims.map(anim => Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 50 })),
            Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true })
        ]).start();
    }, []);

    // Timer logic for Workers
    useEffect(() => {
        let interval;
        if (isClockedIn) {
            interval = setInterval(() => {
                const dur = getWorkDuration() || '00:00:00';
                setTimer(dur);
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
                    <Text style={styles.loadingText}>Loading your Panel...</Text>
                </View>
            </View>
        );
    }

    const role = user?.role || 'WORKER';
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const isAdmin = role === 'COMPANY_OWNER';
    const isPM = role === 'PM';
    const isForeman = role === 'FOREMAN' || role === 'SUBCONTRACTOR';
    const isWorker = role === 'WORKER';
    const isClient = role === 'CLIENT';

    // Role-specific theme colors
    const getTheme = () => {
        if (isSuperAdmin) return { colors: ['#0F172A', '#1E293B'], icon: 'shield-crown', label: 'Platform Command' };
        if (isAdmin) return { colors: ['#1E3A8A', '#1D4ED8'], icon: 'crown', label: 'Admin Dashboard' };
        if (isPM) return { colors: ['#2563EB', '#3B82F6'], icon: 'briefcase-check', label: 'Project Panel' };
        if (isForeman) return { colors: ['#059669', '#10B981'], icon: 'hard-hat', label: 'Site Operations' };
        if (isWorker) return { colors: ['#7C3AED', '#8B5CF6'], icon: 'account-hard-hat', label: 'My Workspace' };
        if (isClient) return { colors: ['#EA580C', '#F97316'], icon: 'office-building', label: 'Client Portal' };
        return { colors: [COLORS.primary, COLORS.primaryAccent], icon: 'account', label: 'Staff Panel' };
    };

    const theme = getTheme();

    const renderSummary = () => {
        if (isSuperAdmin) {
            return (
                <View style={styles.statsRow}>
                    <StatCard label="Total Companies" value="24" icon="office-building" color="#1D4ED8" light="#EFF6FF" anim={fadeAnims[1]} />
                    <StatCard label="Platform Users" value="1.2k" icon="account-group" color="#7C3AED" light="#F5F3FF" anim={fadeAnims[2]} />
                </View>
            );
        }
        if (isAdmin || isPM) {
            return (
                <View style={styles.statsRow}>
                    <StatCard label="Active Jobs" value={metrics?.activeJobs || '5'} icon="crane" color="#1D4ED8" light="#EFF6FF" anim={fadeAnims[1]} />
                    <StatCard label="Crew On Site" value={metrics?.crewOnSiteCount || '12'} icon="account-group" color="#059669" light="#ECFDF5" anim={fadeAnims[2]} />
                </View>
            );
        }
        if (isForeman) {
            return (
                <View style={styles.statsRow}>
                    <StatCard label="Crew Present" value="8" icon="account-multiple-check" color="#1D4ED8" light="#EFF6FF" anim={fadeAnims[1]} />
                    <StatCard label="Open Issues" value="3" icon="alert-circle" color="#EA580C" light="#FFF7ED" anim={fadeAnims[2]} />
                </View>
            );
        }
        if (isClient) {
            return (
                <View style={styles.statsRow}>
                    <StatCard label="Budget Portfolio" value="$1.2M" icon="currency-usd" color="#1D4ED8" light="#EFF6FF" anim={fadeAnims[1]} />
                    <StatCard label="Avg Completion" value="65%" icon="target" color="#059669" light="#ECFDF5" anim={fadeAnims[2]} />
                </View>
            );
        }
        // Worker / Subcontractor
        return (
            <View style={styles.statsRow}>
                <StatCard label="Today's Hours" value={timer} icon="clock-outline" color="#1D4ED8" light="#EFF6FF" anim={fadeAnims[1]} />
                <StatCard label="Weekly Target" value="40h" icon="calendar-check" color="#7C3AED" light="#F5F3FF" anim={fadeAnims[2]} subtext="24h done" />
            </View>
        );
    };

    const getModules = () => {
        const all = [
            { id: 'm1', label: 'Projects', icon: 'briefcase', route: 'Jobs', color: '#1D4ED8', bg: '#EFF6FF', roles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'PM', 'FOREMAN', 'SUBCONTRACTOR', 'CLIENT'] },
            { id: 'm2', label: 'Tasks', icon: 'checkbox-marked-circle', route: 'Execution', color: '#7C3AED', bg: '#F5F3FF', roles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'PM', 'FOREMAN', 'WORKER', 'SUBCONTRACTOR'] },
            { id: 'm3', label: 'Upload', icon: 'camera', route: 'Execution', color: '#EA580C', bg: '#FFF7ED', roles: ['COMPANY_OWNER', 'PM', 'FOREMAN', 'WORKER'] },
            { id: 'm4', label: 'Fleet', icon: 'truck-cargo-container', route: 'Equipment', color: '#059669', bg: '#ECFDF5', roles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'PM', 'FOREMAN'] },
            { id: 'm5', label: 'Reports', icon: 'chart-box', route: 'Reports', color: '#111827', bg: '#F3F4F6', roles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'PM'] },
            { id: 'm6', label: 'Invoices', icon: 'file-document', route: 'Invoices', color: '#F59E0B', bg: '#FFFBEB', roles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'CLIENT'] },
            { id: 'm7', label: 'Team', icon: 'account-group', route: 'TeamManagement', color: '#6366F1', bg: '#EEF2FF', roles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'PM'] },
        ];
        return all.filter(m => m.roles.includes(role));
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <AppHeader />

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[]}
            >
                {/* 🎨 ROLE-SPECIFIC BANNER */}
                <Animated.View style={[styles.bannerWrapper, { opacity: fadeAnims[0] }]}>
                    <LinearGradient
                        colors={theme.colors}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.banner}
                    >
                        <View style={styles.bannerInfo}>
                            <Text style={styles.bannerGreet}>Welcome Back,</Text>
                            <Text style={styles.bannerLabel}>{user?.name || 'User Name'}</Text>
                            <View style={styles.roleChip}>
                                <Text style={styles.roleText}>{role.replace('_', ' ')} | {theme.label}</Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name={theme.icon} size={80} color="rgba(255,255,255,0.12)" style={styles.bannerIcon} />
                    </LinearGradient>
                </Animated.View>

                {/* ⏱️ WORKER CLOCK WIDGET */}
                {(isWorker || isForeman) && (
                    <Animated.View style={[styles.clockCard, SHADOWS.medium, { opacity: fadeAnims[1], transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.clockHeader}>
                            <View style={[styles.statusDot, { backgroundColor: isClockedIn ? '#10B981' : '#94A3B8' }]} />
                            <Text style={styles.clockStatus}>{isClockedIn ? 'ON DUTY' : 'READY TO WORK'}</Text>
                        </View>
                        <View style={styles.clockBody}>
                            <View>
                                <Text style={styles.clockTime}>{timer}</Text>
                                <View style={styles.locationRow}>
                                    <MaterialCommunityIcons name="map-marker" size={12} color="#64748B" />
                                    <Text style={styles.locationText}>{isClockedIn ? 'Skyline Residence Site' : 'No Site Selected'}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[styles.clockBtn, { backgroundColor: isClockedIn ? '#EF4444' : '#2563EB' }]}
                                onPress={toggleClock}
                            >
                                <MaterialCommunityIcons name={isClockedIn ? "stop" : "play"} size={22} color="#fff" />
                                <Text style={styles.clockBtnText}>{isClockedIn ? 'STOP' : 'START'}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}

                {/* 📊 SUMMARY SECTION */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Performance Overview</Text>
                    <TouchableOpacity><Text style={styles.seeAll}>Analytics</Text></TouchableOpacity>
                </View>
                {renderSummary()}

                {/* 📱 MODULES GRID */}
                <Text style={styles.sectionTitle}>Main Modules</Text>
                <View style={styles.moduleGrid}>
                    {getModules().map((m) => (
                        <TouchableOpacity
                            key={m.id}
                            style={[styles.moduleItem, { backgroundColor: m.bg }]}
                            onPress={() => navigation.navigate(m.route)}
                        >
                            <View style={[styles.moduleIcon, { backgroundColor: m.color }]}>
                                <MaterialCommunityIcons name={m.icon} size={20} color="#fff" />
                            </View>
                            <Text style={styles.moduleLabel}>{m.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 🔔 ACTIVITY FEED */}
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <Animated.View style={[styles.activityList, SHADOWS.card, { opacity: fadeAnims[4] }]}>
                    {(activities?.length > 0 ? activities : [
                        { id: '1', title: 'Work Log Submission', desc: 'Daily site log for Skyline Res.', time: '14m ago', icon: 'file-check', color: '#1D4ED8' },
                        { id: '2', title: 'Safety Audit Alert', desc: 'Check gear for Zone B team', time: '1h ago', icon: 'shield-alert', color: '#EA580C' },
                        { id: '3', title: 'Payment Confirmed', desc: 'Invoice #842 cleared', time: '3h ago', icon: 'cash-check', color: '#059669' },
                    ]).map((act, i, arr) => (
                        <View key={act.id || act._id || `act-${i}`}>
                            <TouchableOpacity style={styles.actRow}>
                                <View style={[styles.actIconWrap, { backgroundColor: (act.color || '#1D4ED8') + '10' }]}>
                                    <MaterialCommunityIcons name={act.icon || 'bell'} size={18} color={act.color || '#1D4ED8'} />
                                </View>
                                <View style={styles.actMain}>
                                    <Text style={styles.actTitle}>{act.title || act.action}</Text>
                                    <Text style={styles.actDesc}>{act.desc || act.target}</Text>
                                </View>
                                <Text style={styles.actTime}>{act.time}</Text>
                            </TouchableOpacity>
                            {i < arr.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </Animated.View>

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 13, fontWeight: '800', color: '#64748B', letterSpacing: 1 },
    scroll: { padding: 16, paddingTop: 60 },

    // Banner
    bannerWrapper: { borderRadius: 28, overflow: 'hidden', marginBottom: 20 },
    banner: { padding: 24, paddingVertical: 32, flexDirection: 'row', alignItems: 'center', position: 'relative' },
    bannerInfo: { flex: 1, zIndex: 2 },
    bannerGreet: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },
    bannerLabel: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 2, letterSpacing: -0.5 },
    roleChip: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 12, alignSelf: 'flex-start' },
    roleText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    bannerIcon: { position: 'absolute', right: -5, bottom: -10 },

    // Clock Card
    clockCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9' },
    clockHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    clockStatus: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 1 },
    clockBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    clockTime: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    locationText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    clockBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    clockBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

    // Sections
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: '#64748B', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
    seeAll: { fontSize: 12, fontWeight: '800', color: '#2563EB' },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },

    // Stat Card
    statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
    statIconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
    statLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', marginTop: 2 },
    statSubtext: { fontSize: 9, fontWeight: '600', color: '#94A3B8', marginTop: 4 },

    // Modules
    moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    moduleItem: { width: (width - 32 - 12) / 2 - 6, padding: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    moduleIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    moduleLabel: { fontSize: 13, fontWeight: '800', color: '#1E293B' },

    // Activity
    activityList: { backgroundColor: '#fff', borderRadius: 28, padding: 8, borderWidth: 1, borderColor: '#F1F5F9' },
    actRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    actIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    actMain: { flex: 1 },
    actTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
    actDesc: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 },
    actTime: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 72 },
});

export default DashboardScreen;

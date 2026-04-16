import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import WorkerHeader from '../../components/WorkerHeader';

const ProjectManagerProfileScreen = ({ navigation }) => {
    const { user, logout } = useApp();

    const handleLogout = () => {
        Alert.alert(
            "Logout Session",
            "Are you sure you want to exit your project manager shift?",
            [
                { text: "STAY", style: "cancel" },
                { text: "EXIT", style: "destructive", onPress: logout }
            ]
        );
    };

    const stats = [
        { label: 'PROJECTS', value: '12', icon: 'office-building', color: '#3B82F6' },
        { label: 'CREW', value: '45', icon: 'account-group', color: '#10B981' },
        { label: 'EFFICIENCY', value: '94%', icon: 'trending-up', color: '#F59E0B' }
    ];

    return (
        <View style={styles.container}>
            <WorkerHeader title="PM Account" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={[styles.profileCard, SHADOWS.large]}>
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarGlow}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{(user?.fullName || 'PM')[0]}</Text>
                            </View>
                        </View>
                        <Text style={styles.fullName}>{user?.fullName || 'Project Manager'}</Text>
                        <View style={styles.roleBadge}>
                            <MaterialCommunityIcons name="shield-crown" size={14} color="#fff" />
                            <Text style={styles.roleText}>SITE SUPERVISOR</Text>
                        </View>
                        <Text style={styles.email}>{user?.email || 'manager@kaal.ca'}</Text>
                    </View>

                    <View style={styles.statsRow}>
                        {stats.map((s, i) => (
                            <View key={i} style={styles.statBox}>
                                <MaterialCommunityIcons name={s.icon} size={20} color={s.color} />
                                <Text style={styles.statValue}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>SITE ACTIONS</Text>
                </View>

                <View style={styles.actionList}>
                    {[
                        { icon: 'account-edit-outline', label: 'Modify Site Profile', sub: 'Update your professional details', route: 'Profile' },
                        { icon: 'shield-lock-outline', label: 'Security & Access', sub: 'Reset and manage passwords', route: 'Settings' },
                        { icon: 'history', label: 'My Performance Logs', sub: 'Review past project milestones', route: 'Reports' }
                    ].map((item, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.actionItem}
                            onPress={() => item.route && navigation.navigate(item.route)}
                        >
                            <View style={styles.actionIcon}>
                                <MaterialCommunityIcons name={item.icon} size={24} color="#475569" />
                            </View>
                            <View style={styles.actionBody}>
                                <Text style={styles.actionLabel}>{item.label}</Text>
                                <Text style={styles.actionSub}>{item.sub}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout-variant" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>TERMINATE SESSION</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scroll: { padding: 20 },
    profileCard: { backgroundColor: '#fff', borderRadius: 32, padding: 24, marginBottom: 24 },
    avatarSection: { alignItems: 'center', marginBottom: 24 },
    avatarGlow: { padding: 4, borderRadius: 50, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 32, fontWeight: '900', color: '#fff' },
    fullName: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginTop: 16, letterSpacing: -0.5 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8, gap: 6 },
    roleText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    email: { fontSize: 14, color: '#64748B', marginTop: 8, fontWeight: '600' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 24 },
    statBox: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginTop: 4 },
    statLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginTop: 2 },
    sectionHeader: { marginBottom: 16, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5 },
    actionList: { gap: 12, marginBottom: 30 },
    actionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    actionIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    actionBody: { flex: 1, marginLeft: 16 },
    actionLabel: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    actionSub: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
    logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 20, backgroundColor: '#FEF2F2', borderRadius: 20, borderWidth: 1, borderColor: '#FEE2E2' },
    logoutText: { color: '#EF4444', fontSize: 13, fontWeight: '900', letterSpacing: 1 }
});

export default ProjectManagerProfileScreen;

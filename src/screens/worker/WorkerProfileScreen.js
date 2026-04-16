import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/shared/CommonUI';

const WorkerProfileScreen = () => {
    const { user, logout } = useApp();
    const [notifications, setNotifications] = useState(true);

    const ProfileRow = ({ icon, label, sub, color, bg }) => (
        <Card style={styles.card}>
            <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: bg }]}>
                    <MaterialCommunityIcons name={icon} size={22} color={color} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.label}>{label}</Text>
                    {sub && <Text style={styles.subText}>{sub}</Text>}
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <AppHeader title="My Workspace Profile" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                <View style={styles.profileBox}>
                    <View style={[styles.avatar, SHADOWS.card]}>
                        <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || user?.name?.charAt(0)}</Text>
                        <View style={styles.statusDot} />
                    </View>
                    <Text style={styles.userName}>{user?.fullName || user?.name || 'Worker Master'}</Text>
                    <View style={styles.roleChip}>
                        <Text style={styles.roleText}>{user?.role?.replace('_', ' ')}</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNum}>124h</Text>
                        <Text style={styles.statLabel}>Month Hours</Text>
                    </View>
                    <View style={styles.dividerV} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNum}>12</Text>
                        <Text style={styles.statLabel}>Jobs Done</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>MY ACCOUNT</Text>
                <ProfileRow icon="account-details-outline" label="Account Information" sub="Manage your details" color={COLORS.primary} bg={COLORS.primary + '10'} />
                <ProfileRow icon="shield-lock-outline" label="Security" sub="Password & PIN" color="#7C3AED" bg="#F5F3FF" />

                <Card style={styles.card}>
                    <View style={styles.row}>
                        <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '10' }]}>
                            <MaterialCommunityIcons name="bell-ring-outline" size={22} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={styles.label}>Show Notifications</Text>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: '#E2E8F0', true: COLORS.primary }}
                            thumbColor="#fff"
                        />
                    </View>
                </Card>

                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <MaterialCommunityIcons name="logout-variant" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>LOGOUT</Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>KAAL ERP • BUILD RELEASE 4.2.0 • ASIA</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: 16 },
    profileBox: { alignItems: 'center', marginVertical: 24 },
    avatar: { width: 100, height: 100, borderRadius: 36, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 40, fontWeight: '900', color: '#fff' },
    statusDot: { position: 'absolute', bottom: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: '#10B981', borderWidth: 4, borderColor: COLORS.background },
    userName: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, marginTop: 16 },
    roleChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
    roleText: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
    statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9' },
    statItem: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
    statLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, marginTop: 4 },
    dividerV: { width: 1, backgroundColor: '#F1F5F9' },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
    card: { marginBottom: 12, padding: 16 },
    row: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    label: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
    subText: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FFF1F2', padding: 20, borderRadius: 24, marginTop: 24, borderWidth: 1, borderColor: '#FECACA' },
    logoutText: { color: '#EF4444', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
    footerText: { textAlign: 'center', fontSize: 10, color: COLORS.textMuted, fontWeight: '800', marginTop: 40, marginBottom: 60 }
});

export default WorkerProfileScreen;

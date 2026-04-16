import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Animated, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, SIZES } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/shared/CommonUI';

const { width } = Dimensions.get('window');

const WorkerJobsScreen = ({ navigation }) => {
    const { jobs, projects, refreshData } = useApp();
    const [search, setSearch] = useState('');
    const [activeStatus, setActiveStatus] = useState('ALL');
    const [loading, setLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshData();
        });
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        return unsubscribe;
    }, [navigation]);

    const filteredJobs = (jobs || []).filter(job => {
        const matchesSearch = job.name?.toLowerCase().includes(search.toLowerCase()) ||
            job.project?.name?.toLowerCase().includes(search.toLowerCase());

        const statusMap = {
            'PENDING': 'planning',
            'IN PROGRESS': 'active',
            'COMPLETE': 'completed'
        };

        const matchesStatus = activeStatus === 'ALL' || job.status === statusMap[activeStatus];
        return matchesSearch && matchesStatus;
    });

    const renderJobItem = ({ item }) => {
        const progress = item.status === 'completed' ? 100 : (item.status === 'active' ? 50 : 0);

        return (
            <Card style={styles.jobCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.briefcaseIcon}>
                        <MaterialCommunityIcons name="briefcase-variant" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.projectBadgeArea}>
                        <Text style={styles.projectPrefix}>PROJECT</Text>
                        <View style={styles.projectBadge}>
                            <Text style={styles.projectBadgeText} numberOfLines={1}>
                                {item.project?.name || 'General Site'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.jobBody}>
                    <Text style={styles.jobTitle}>{item.name}</Text>
                    <View style={styles.locationRow}>
                        <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.textMuted} />
                        <Text style={styles.locationText}>{item.project?.location || 'Main Site Site'}</Text>
                    </View>

                    <View style={styles.progressArea}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>PROGRESS</Text>
                            <Text style={styles.progressPercent}>{progress}%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: progress === 100 ? COLORS.success : COLORS.primary }]} />
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.viewTasksBtn, SHADOWS.small]}
                    onPress={() => navigation.navigate('JobTasks', { jobId: item._id })}
                >
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color="#fff" />
                    <Text style={styles.viewTasksText}>VIEW TASKS</Text>
                </TouchableOpacity>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <WorkerHeader title="Jobs" />

            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="office-building-outline" size={80} color="#E2E8F0" />
                <Text style={styles.emptyTitle}>Worker Jobs</Text>
                <Text style={styles.emptySubtitle}>Content is being updated by the Project Manager.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { flex: 1 },
    headerSection: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 12
    },
    subtitle: { fontSize: 24, fontWeight: '900', color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' },

    filterSection: {
        paddingHorizontal: 24,
        marginBottom: 20
    },
    statusToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 5,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'space-between'
    },
    statusChip: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: 'center'
    },
    statusChipActive: {
        backgroundColor: '#FF6B00', // Premium Safety Orange
        elevation: 4,
        shadowColor: '#FF6B00',
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    statusChipText: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5 },
    statusChipTextActive: { color: '#fff' },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 24,
        height: 54,
        borderRadius: 20,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1E293B', fontWeight: '600' },
    list: { paddingHorizontal: 24, paddingBottom: 100 },
    jobCard: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 4,
        shadowColor: '#0F172A',
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    briefcaseIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center'
    },
    projectBadgeArea: { alignItems: 'flex-end' },
    projectPrefix: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginBottom: 2 },
    projectBadge: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    projectBadgeText: { fontSize: 11, fontWeight: '900', color: '#475569' },
    jobBody: { marginBottom: 20 },
    jobTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
    locationText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    progressArea: { marginTop: 16 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
    progressPercent: { fontSize: 10, fontWeight: '900', color: '#0F172A' },
    progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    viewTasksBtn: {
        width: '100%',
        height: 52,
        backgroundColor: '#0055FF', // New Vibrant Construction Blue
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        elevation: 6,
        shadowColor: '#0055FF',
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    viewTasksText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
    emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginTop: 16 },
    emptySubtitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 },
    emptyText: { marginTop: 12, color: '#94A3B8', fontSize: 14, fontWeight: '700' }
});

export default WorkerJobsScreen;

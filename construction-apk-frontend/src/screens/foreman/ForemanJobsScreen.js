import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Animated, StatusBar, ActivityIndicator, Dimensions, RefreshControl, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const ForemanJobsScreen = ({ navigation }) => {
    const { jobs, refreshData, loading: appLoading } = useApp();
    const [search, setSearch] = useState('');
    const [activeStatus, setActiveStatus] = useState('ALL');
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshData();
        });
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        return unsubscribe;
    }, [navigation]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    const stats = {
        active: (jobs || []).filter(j => j.status === 'active' || j.status === 'in_progress').length,
        planning: (jobs || []).filter(j => j.status === 'planning' || j.status === 'todo').length
    };

    const filteredJobs = (jobs || []).filter(j => {
        const matchesSearch = (j.name || j.title || '').toLowerCase().includes(search.toLowerCase()) ||
            (j.location || j.projectId?.name || '').toLowerCase().includes(search.toLowerCase());

        const statusMap = {
            'PLANNING': ['planning', 'todo', 'pending'],
            'ACTIVE': ['active', 'in_progress'],
            'COMPLETE': ['completed', 'done'],
            'ON HOLD': ['on-hold']
        };

        const matchesStatus = activeStatus === 'ALL' || statusMap[activeStatus]?.includes(j.status);
        return matchesSearch && matchesStatus;
    });

    const renderJobItem = ({ item }) => {
        return (
            <View style={[styles.jobCard, SHADOWS.medium]}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconBox}>
                        <MaterialCommunityIcons name="briefcase-variant-outline" size={24} color="#2563EB" />
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.manageLabel}>MANAGE STATUS</Text>
                        <TouchableOpacity style={styles.statusPill}>
                            <Text style={styles.statusPillText}>{(item.status || 'PLANNING').toUpperCase().replace('_', ' ')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <Text style={styles.jobTitle}>{item.name || item.title || 'Untitled Job'}</Text>
                    <View style={styles.locationRow}>
                        <MaterialCommunityIcons name="map-marker" size={16} color="#94A3B8" />
                        <Text style={styles.locationText}>{item.location || 'Indore Site'}</Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressLabelRow}>
                            <Text style={styles.progressLabel}>PROGRESS</Text>
                            <Text style={styles.progressValue}>{item.progress || 0}%</Text>
                        </View>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${item.progress || 0}%` }]} />
                        </View>
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.viewTasksBtn}
                    onPress={() => navigation.navigate('ForemanJobDetail', { jobId: item._id })}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
                    <Text style={styles.viewTasksText}>VIEW TASKS</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const ListHeader = () => (
        <View>
            {/* Title Section */}
            <View style={styles.titleSection}>
                <Text style={styles.screenTitle}>My Job Assignments</Text>
                <View style={styles.subtitleRow}>
                    <MaterialCommunityIcons name="earth" size={16} color="#2563EB" />
                    <Text style={styles.screenSubtitle}>VIEW YOUR ASSIGNED JOBS AND THEIR TASKS</Text>
                </View>
            </View>

            {/* Stats Section */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, SHADOWS.small]}>
                    <View style={styles.statIconBox}>
                        <MaterialCommunityIcons name="trending-up" size={24} color="#2563EB" />
                    </View>
                    <View style={styles.statContent}>
                        <Text style={styles.statLabel}>ACTIVE SITES</Text>
                        <Text style={styles.statValue}>{stats.active}</Text>
                        <Text style={styles.statSub}>currently operational</Text>
                    </View>
                </View>
                <View style={[styles.statCard, SHADOWS.small]}>
                    <View style={[styles.statIconBox, { backgroundColor: '#FFF7ED' }]}>
                        <MaterialCommunityIcons name="calendar-month" size={24} color="#F97316" />
                    </View>
                    <View style={styles.statContent}>
                        <Text style={styles.statLabel}>PRE-CONSTRUCTION</Text>
                        <Text style={styles.statValue}>{stats.planning}</Text>
                        <Text style={styles.statSub}>in planning phase</Text>
                    </View>
                </View>
            </View>

            {/* Sticky-like Filter Bar */}
            <View style={[styles.filterBar, SHADOWS.small]}>
                <View style={styles.searchContainer}>
                    <MaterialCommunityIcons name="magnify" size={22} color="#94A3B8" />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search projects..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <TouchableOpacity style={styles.filterMenu}>
                    <Text style={styles.filterMenuText}>
                        {activeStatus === 'ALL' ? 'All Statuses' : activeStatus}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color="#64748B" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="Job Center" showBranding={true} />

            <FlatList
                data={filteredJobs}
                keyExtractor={item => item._id || item.id}
                renderItem={renderJobItem}
                ListHeaderComponent={ListHeader}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyView}>
                        <MaterialCommunityIcons name="office-building-marker" size={60} color="#E2E8F0" />
                        <Text style={styles.emptyTitle}>No Job Assignments</Text>
                        <Text style={styles.emptySub}>You don't have any jobs assigned to you at this moment.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    scrollContent: { paddingBottom: 100 },
    
    titleSection: { padding: 24, paddingBottom: 16 },
    screenTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    screenSubtitle: { fontSize: 11, fontWeight: '800', color: '#64748B', marginLeft: 6, letterSpacing: 0.5 },

    statsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center' },
    statIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    statContent: { marginLeft: 12, flex: 1 },
    statLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5 },
    statValue: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginVertical: 2 },
    statSub: { fontSize: 9, fontWeight: '700', color: '#94A3B8', fontStyle: 'italic' },

    filterBar: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 20, padding: 8, alignItems: 'center', marginBottom: 24 },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: '#F1F5F9' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#1E293B' },
    filterMenu: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
    filterMenuText: { fontSize: 12, fontWeight: '800', color: '#1E293B' },

    jobCard: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 28, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#fff' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    headerRight: { alignItems: 'flex-end' },
    manageLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', marginBottom: 6 },
    statusPill: { backgroundColor: '#0F172A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    statusPillText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    cardBody: { marginTop: 16, marginBottom: 20 },
    jobTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
    locationText: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },

    progressContainer: { marginTop: 20 },
    progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 1 },
    progressValue: { fontSize: 11, fontWeight: '900', color: '#0F172A' },
    progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 3 },

    viewTasksBtn: { height: 56, backgroundColor: '#2563EB', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    viewTasksText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

    emptyView: { padding: 60, alignItems: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginTop: 16 },
    emptySub: { fontSize: 13, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 }
});

export default ForemanJobsScreen;

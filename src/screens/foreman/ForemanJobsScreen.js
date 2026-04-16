import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Animated, StatusBar, ActivityIndicator, Dimensions, RefreshControl, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/shared/CommonUI';

const { width } = Dimensions.get('window');

const ForemanJobsScreen = ({ navigation }) => {
    const { projects, refreshData } = useApp();
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

    const filteredJobs = (projects || []).filter(proj => {
        const matchesSearch = proj.name?.toLowerCase().includes(search.toLowerCase()) ||
            proj.location?.toLowerCase().includes(search.toLowerCase());

        const statusMap = {
            'PLANNING': 'planning',
            'ACTIVE': 'active',
            'COMPLETE': 'completed',
            'ON HOLD': 'on-hold'
        };

        const matchesStatus = activeStatus === 'ALL' || proj.status === statusMap[activeStatus];
        return matchesSearch && matchesStatus;
    });

    const renderJobItem = ({ item }) => {
        const statusConfig = {
            'planning': { label: 'Planning', color: '#F97316', bg: '#FFF7ED' },
            'active': { label: 'In Progress', color: '#3B82F6', bg: '#EFF6FF' },
            'completed': { label: 'Completed', color: '#10B981', bg: '#ECFDF5' },
            'on-hold': { label: 'On Hold', color: '#EF4444', bg: '#FEF2F2' }
        };
        const config = statusConfig[item.status] || { label: 'Active', color: '#3B82F6', bg: '#EFF6FF' };

        return (
            <Card style={styles.jobCard}>
                {/* Header: Status + Manage Button */}
                <View style={styles.cardTop}>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.color + '20' }]}>
                        <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                    </View>
                    <TouchableOpacity style={styles.manageBtn}>
                        <Text style={styles.manageBtnText}>Manage Status</Text>
                        <MaterialCommunityIcons name="chevron-down" size={12} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {/* Body: Title + Location */}
                <View style={styles.cardBody}>
                    <Text style={styles.jobTitle}>{item.name}</Text>
                    <View style={styles.locationContainer}>
                        <MaterialCommunityIcons name="map-marker-outline" size={14} color="#94A3B8" />
                        <Text style={styles.locationText}>{item.location || 'Indore Site'}</Text>
                    </View>
                </View>

                {/* Progress Area */}
                <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={styles.progressVal}>{item.progress || 0}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${item.progress || 0}%`, backgroundColor: config.color }]} />
                    </View>
                </View>

                {/* Actions */}
                <TouchableOpacity 
                    style={styles.viewTasksBtn}
                    onPress={() => navigation.navigate('ForemanTasks', { projectId: item._id })}
                >
                    <Text style={styles.viewTasksText}>View Tasks</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                </TouchableOpacity>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="Site Management" />

            {/* Search & Filter Header */}
            <View style={styles.stickyHeader}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search projects..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterBar}
                >
                    {['ALL', 'ACTIVE', 'PLANNING', 'ON HOLD', 'COMPLETE'].map(status => (
                        <TouchableOpacity 
                            key={status}
                            style={[styles.filterChip, activeStatus === status && styles.filterChipActive]}
                            onPress={() => setActiveStatus(status)}
                        >
                            <Text style={[styles.filterText, activeStatus === status && styles.filterTextActive]}>
                                {status === 'ALL' ? 'All Statuses' : status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <Animated.FlatList
                data={filteredJobs}
                keyExtractor={item => item._id || item.id}
                renderItem={renderJobItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyView}>
                        <MaterialCommunityIcons name="office-building-marker-outline" size={64} color="#E2E8F0" />
                        <Text style={styles.emptyTitle}>No Sites Found</Text>
                        <Text style={styles.emptySub}>No projects match your current filters.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    stickyHeader: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', height: 50, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1E293B', fontWeight: '700' },
    filterBar: { flexDirection: 'row', marginTop: 16, gap: 8 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    filterChipActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
    filterText: { fontSize: 11, fontWeight: '900', color: '#64748B' },
    filterTextActive: { color: '#fff' },

    list: { padding: 20, paddingBottom: 100 },
    jobCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: '900' },
    manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    manageBtnText: { fontSize: 11, fontWeight: '800', color: '#64748B' },

    cardBody: { marginBottom: 20 },
    jobTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
    locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { fontSize: 13, color: '#94A3B8', fontWeight: '700' },

    progressSection: { marginBottom: 24 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressLabel: { fontSize: 11, fontWeight: '900', color: '#475569', letterSpacing: 0.5 },
    progressVal: { fontSize: 11, fontWeight: '900', color: '#0F172A' },
    progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },

    viewTasksBtn: { 
        height: 54, 
        backgroundColor: '#2563EB', 
        borderRadius: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 12,
        elevation: 4,
        shadowColor: '#2563EB',
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    viewTasksText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },

    emptyView: { padding: 40, alignItems: 'center', marginTop: 50 },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginTop: 20 },
    emptySub: { fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 }
});

export default ForemanJobsScreen;

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Animated, StatusBar, ActivityIndicator, Dimensions, RefreshControl, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const ForemanJobDetailScreen = ({ navigation, route }) => {
    const { jobId } = route.params || {};
    const { jobs, tasks, refreshData, user } = useApp();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('TASKS');
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const job = (jobs || []).find(j => j._id === jobId) || {};
    const jobTasks = (tasks || []).filter(t => t.jobId?._id === jobId || t.jobId === jobId || t.projectId === job.projectId?._id);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    const stats = {
        progress: job.progress || 0,
        completedTasks: jobTasks.filter(t => t.status === 'completed' || t.status === 'done').length,
        totalTasks: jobTasks.length,
    };

    const renderTaskRow = ({ item }) => (
        <View style={styles.taskRow}>
            {/* Status Icon */}
            <View style={styles.statusCol}>
                <View style={[styles.checkbox, (item.status === 'completed' || item.status === 'done') && styles.checkboxChecked]}>
                    {(item.status === 'completed' || item.status === 'done') && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                </View>
            </View>

            {/* Task Info */}
            <View style={styles.detailsCol}>
                <View style={styles.titleLine}>
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#CBD5E1" style={{ marginRight: 4 }} />
                    <Text style={styles.taskTitle}>{item.title}</Text>
                </View>
                {item.description ? <Text style={styles.taskSub} numberOfLines={1}>{item.description}</Text> : null}
            </View>

            {/* Assignee */}
            <View style={styles.assignedCol}>
                <View style={styles.userCircle}>
                    <Text style={styles.userInitial}>
                        {item.assignedTo?.[0]?.fullName?.[0] || '?'}
                    </Text>
                </View>
                <Text style={styles.assignedName} numberOfLines={1}>
                    {item.assignedTo?.[0]?.fullName?.split(' ')[0] || 'Unassigned'}
                </Text>
            </View>

            {/* Priority */}
            <View style={styles.priorityCol}>
                <View style={[styles.priorityTag, { backgroundColor: item.priority === 'high' ? '#FEF2F2' : '#F1F5F9' }]}>
                    <Text style={[styles.priorityText, { color: item.priority === 'high' ? '#EF4444' : '#64748B' }]}>
                        {(item.priority || 'MEDIUM').toUpperCase()}
                    </Text>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actionCol}>
                <TouchableOpacity style={styles.iconBtn}><MaterialCommunityIcons name="square-edit-outline" size={18} color="#94A3B8" /></TouchableOpacity>
            </View>
        </View>
    );

    const ListHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity 
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
            >
                <MaterialCommunityIcons name="arrow-left" size={20} color="#2563EB" />
                <Text style={styles.backTxt}>BACK TO MY JOBS</Text>
            </TouchableOpacity>

            <View style={styles.jobHeading}>
                <View style={styles.titleRow}>
                    <Text style={styles.jobName}>{job.name || 'Job Details'}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{(job.status || 'PLANNING').toUpperCase()}</Text>
                    </View>
                </View>
                <View style={styles.metaLine}>
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="map-marker-outline" size={14} color="#64748B" />
                        <Text style={styles.metaText}>{job.location || 'Indore'}</Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="chart-donut" size={14} color="#2563EB" />
                        <Text style={[styles.metaText, { color: '#2563EB' }]}>{stats.progress}% Progress</Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="format-list-checks" size={14} color="#059669" />
                        <Text style={[styles.metaText, { color: '#059669' }]}>{stats.completedTasks}/{stats.totalTasks} Done</Text>
                    </View>
                </View>
            </View>

            <View style={styles.tabContainer}>
                {['TASKS', 'HISTORY', 'NOTES'].map(tab => (
                    <TouchableOpacity 
                        key={tab} 
                        onPress={() => setActiveTab(tab)}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                    >
                        <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.actionRow}>
                <View style={styles.searchBox}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                    <TextInput 
                        style={styles.input}
                        placeholder="Search tasks..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <TouchableOpacity style={styles.filterBtn}>
                    <MaterialCommunityIcons name="tune-variant" size={20} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.importBtn}>
                    <MaterialCommunityIcons name="database-import-outline" size={20} color="#fff" />
                    <Text style={styles.importTxt}>IMPORT</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 0.12 }]}>STATUS</Text>
                <Text style={[styles.th, { flex: 0.43 }]}>TASK DETAILS</Text>
                <Text style={[styles.th, { flex: 0.25 }]}>ASSIGNED</Text>
                <Text style={[styles.th, { flex: 0.20 }]}>PRIORITY</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="Site Tasks" />

            <FlatList
                data={jobTasks}
                keyExtractor={item => item._id}
                renderItem={renderTaskRow}
                ListHeaderComponent={ListHeader}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={50} color="#CBD5E1" />
                        <Text style={styles.emptyTxt}>No tasks found for this site.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { paddingBottom: 10 },
    
    backBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 12, gap: 8 },
    backTxt: { fontSize: 12, fontWeight: '900', color: '#2563EB' },

    jobHeading: { px: 16, paddingHorizontal: 20, marginBottom: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    jobName: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
    badge: { backgroundColor: '#F1F5F9', px: 10, py: 4, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: 8.5, fontWeight: '900', color: '#64748B' },
    metaLine: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
    separator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' },

    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingHorizontal: 20, gap: 24 },
    tab: { paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: '#2563EB' },
    tabLabel: { fontSize: 13, fontWeight: '900', color: '#94A3B8' },
    tabLabelActive: { color: '#2563EB' },

    actionRow: { flexDirection: 'row', padding: 16, alignItems: 'center', gap: 10 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, height: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    input: { flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#1E293B' },
    filterBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
    importBtn: { height: 44, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', gap: 8 },
    importTxt: { color: '#fff', fontSize: 11, fontWeight: '900' },

    tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    th: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5 },

    taskRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', alignItems: 'center' },
    statusCol: { flex: 0.12 },
    checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
    checkboxChecked: { backgroundColor: '#059669', borderColor: '#059669' },
    detailsCol: { flex: 0.43, paddingRight: 4 },
    titleLine: { flexDirection: 'row', alignItems: 'center' },
    taskTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    taskSub: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2, marginLeft: 20 },
    assignedCol: { flex: 0.25, flexDirection: 'row', alignItems: 'center', gap: 6 },
    userCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    userInitial: { fontSize: 10, fontWeight: '900', color: '#64748B' },
    assignedName: { fontSize: 11, fontWeight: '700', color: '#475569' },
    priorityCol: { flex: 0.20 },
    priorityTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    priorityText: { fontSize: 8.5, fontWeight: '900' },
    actionCol: { position: 'absolute', right: 20, top: '50%', marginTop: -9 },
    iconBtn: { padding: 4 },

    empty: { padding: 60, alignItems: 'center' },
    emptyTxt: { fontSize: 14, fontWeight: '700', color: '#94A3B8', marginTop: 12 }
});

export default ForemanJobDetailScreen;

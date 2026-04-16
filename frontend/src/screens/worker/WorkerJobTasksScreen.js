import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Animated, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, SIZES } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import { useApp } from '../../context/AppContext';
import { Card, Badge } from '../../components/shared/CommonUI';

const { width } = Dimensions.get('window');

const WorkerJobTasksScreen = ({ navigation, route }) => {
    const { jobId } = route.params || {};
    const { tasks, jobs, updateTask, refreshData, user } = useApp();
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const currentJob = jobs.find(j => (j._id || j.id) === jobId) || {};

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshData();
        });
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        return unsubscribe;
    }, [navigation]);

    const jobTasks = (tasks || []).filter(t => {
        const isAssigned = (Array.isArray(t.assignedTo) && t.assignedTo.some(a => (a._id || a) === user?._id)) ||
            (t.assignedTo === user?._id || t.assignedTo === user?.fullName);
        const matchesJob = !jobId || (t.projectId?._id || t.projectId) === (currentJob.projectId?._id || currentJob.projectId);
        const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase());
        return isAssigned && matchesJob && matchesSearch;
    });

    const completedCount = jobTasks.filter(t => t.status === 'completed').length;
    const totalCount = jobTasks.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const renderSummaryCard = (icon, title, value, color) => (
        <Card style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: color + '10' }]}>
                {title === 'GLOBAL PROGRESS' ? (
                    <View style={styles.progressCircleSmall}>
                        <Text style={[styles.progressCircleText, { color }]}>{progress}%</Text>
                    </View>
                ) : (
                    <MaterialCommunityIcons name={icon} size={22} color={color} />
                )}
            </View>
            <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>{title}</Text>
                <Text style={styles.summaryValue}>{value}</Text>
            </View>
        </Card>
    );

    const renderTaskItem = ({ item }) => (
        <View style={styles.taskRow}>
            <View style={styles.statusCol}>
                <TouchableOpacity
                    onPress={() => toggleStatus(item)}
                    style={[styles.statusCheck, item.status === 'completed' && styles.statusCheckActive]}
                >
                    {item.status === 'completed' && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                </TouchableOpacity>
            </View>

            <View style={styles.detailsCol}>
                <Text style={[styles.itemTitle, item.status === 'completed' && styles.strike]}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{currentJob.name || 'General Site'}</Text>
            </View>

            <View style={styles.assigneeCol}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>W</Text>
                </View>
                <Text style={styles.assigneeName}>Worker</Text>
            </View>

            <View style={styles.priorityCol}>
                <View style={[styles.pBadge, { backgroundColor: item.priority === 'High' ? '#FEE2E2' : '#F1F5F9' }]}>
                    <Text style={[styles.pBadgeText, { color: item.priority === 'High' ? '#EF4444' : '#64748B' }]}>
                        {(item.priority || 'LOW').toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.dateCol}>
                <Text style={styles.dateText}>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Soon'}</Text>
            </View>
        </View>
    );

    const toggleStatus = async (task) => {
        const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
        setLoading(true);
        await updateTask(task._id || task.id, { ...task, status: nextStatus });
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <AppHeader title="Job Tasks" />

            <View style={styles.content}>
                <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={16} color="#64748B" />
                    <Text style={styles.backLinkText}>BACK TO MY JOBS</Text>
                </TouchableOpacity>

                <View style={styles.jobIdentity}>
                    <View style={styles.identityTop}>
                        <Text style={styles.jobName}>{currentJob.name || 'Site Task'}</Text>
                        <View style={styles.jobStatusBadge}>
                            <Text style={styles.jobStatusText}>{(currentJob.status || 'PLANNING').toUpperCase()}</Text>
                        </View>
                    </View>
                    <View style={styles.jobLocationRow}>
                        <MaterialCommunityIcons name="map-marker-outline" size={14} color="#64748B" />
                        <Text style={styles.jobLocationText}>{currentJob.project?.location || 'Indore'}</Text>
                    </View>
                </View>

                <View style={styles.summaryRow}>
                    {renderSummaryCard('circle-slice-8', 'GLOBAL PROGRESS', `${progress}% Complete`, '#2563EB')}
                    {renderSummaryCard('check-circle-outline', 'TASKS OVERVIEW', `${completedCount} / ${totalCount} Completed`, '#F97316')}
                    {renderSummaryCard('account-group-outline', 'TEAM ASSIGNED', `${currentJob.assignedWorkers?.length || 0} Workers`, '#10B981')}
                </View>

                <View style={styles.tabsSection}>
                    <View style={styles.tabItem}>
                        <MaterialCommunityIcons name="check-circle-outline" size={16} color="#2563EB" />
                        <Text style={styles.tabText}>TASKS</Text>
                    </View>
                </View>

                <View style={styles.filterArea}>
                    <View style={styles.taskSearch}>
                        <MaterialCommunityIcons name="magnify" size={18} color="#94A3B8" />
                        <TextInput
                            style={styles.taskInput}
                            placeholder="Search tasks..."
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                <View style={styles.listHeader}>
                    <Text style={[styles.colLabel, { width: 40 }]}>STATUS</Text>
                    <Text style={[styles.colLabel, { flex: 1.5 }]}>TASK DETAILS</Text>
                    <Text style={[styles.colLabel, { flex: 1 }]}>ASSIGNED TO</Text>
                    <Text style={[styles.colLabel, { width: 70 }]}>PRIORITY</Text>
                    <Text style={[styles.colLabel, { width: 60 }]}>DUE DATE</Text>
                </View>

                <Animated.FlatList
                    data={jobTasks}
                    keyExtractor={item => item._id || item.id}
                    renderItem={renderTaskItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="clipboard-check-outline" size={60} color="#E2E8F0" />
                            <Text style={styles.emptyText}>No tasks found for this job</Text>
                        </View>
                    }
                />
            </View>

            {loading && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { flex: 1, paddingTop: 16 },
    backLink: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 6, marginBottom: 12 },
    backLinkText: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 0.5 },
    jobIdentity: { paddingHorizontal: 24, marginBottom: 24 },
    identityTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    jobName: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    jobStatusBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    jobStatusText: { fontSize: 9, fontWeight: '900', color: '#475569' },
    jobLocationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    jobLocationText: { fontSize: 12, fontWeight: '600', color: '#64748B' },

    summaryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
    summaryCard: { flex: 1, padding: 12, borderRadius: 20, backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
    summaryIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    progressCircleSmall: { width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
    progressCircleText: { fontSize: 8, fontWeight: '900' },
    summaryTitle: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 2 },
    summaryValue: { fontSize: 13, fontWeight: '900', color: '#0F172A' },

    tabsSection: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 24, marginBottom: 20 },
    tabItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#2563EB', width: 80 },
    tabText: { fontSize: 11, fontWeight: '900', color: '#2563EB' },

    filterArea: { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 20, alignItems: 'center' },
    taskSearch: { flex: 1, height: 44, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
    taskInput: { flex: 1, marginLeft: 8, fontSize: 13, color: '#1E293B', fontWeight: '600' },

    listHeader: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 16 },
    colLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5 },

    listContainer: { paddingHorizontal: 24, paddingBottom: 100 },
    taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    statusCol: { width: 40 },
    statusCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    statusCheckActive: { backgroundColor: '#10B981', borderColor: '#10B981' },

    detailsCol: { flex: 1.5, paddingRight: 12 },
    itemTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
    itemSubtitle: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
    strike: { textDecorationLine: 'line-through', color: '#94A3B8' },

    assigneeCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    avatarText: { fontSize: 9, fontWeight: '900', color: '#64748B' },
    assigneeName: { fontSize: 12, fontWeight: '700', color: '#475569' },

    priorityCol: { width: 70 },
    pBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    pBadgeText: { fontSize: 9, fontWeight: '900' },

    dateCol: { width: 60 },
    dateText: { fontSize: 12, fontWeight: '700', color: '#475569' },

    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { marginTop: 12, color: '#94A3B8', fontSize: 14, fontWeight: '700' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }
});

export default WorkerJobTasksScreen;

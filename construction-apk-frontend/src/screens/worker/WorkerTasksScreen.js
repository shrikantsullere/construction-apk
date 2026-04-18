import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    TextInput, Animated, ActivityIndicator, Dimensions, 
    SafeAreaView, StatusBar 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/shared/CommonUI';
import WorkerHeader from '../../components/WorkerHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WorkerTasksScreen = ({ navigation }) => {
    const { tasks, metrics, refreshData, user, updateTask } = useApp();
    const [search, setSearch] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const workerMetrics = metrics?.workerMetrics || {};
    // Software's 'Task Command Center' for workers displays their assigned tasks
    const assignedTasks = workerMetrics.assignedTasks || [];

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshData();
        });
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        return unsubscribe;
    }, [navigation]);

    const displayTasks = (assignedTasks.length > 0 ? assignedTasks : (tasks || [])).filter(t => {
        // Only show if user is assigned (fallback if assignedTasks is empty)
        const isAssignedToMe = (Array.isArray(t.assignedTo) && t.assignedTo.some(a => (a._id || a) === user?._id)) ||
            (t.assignedTo === user?._id || (typeof t.assignedTo === 'string' && t.assignedTo === user?.fullName));
        
        if (assignedTasks.length === 0 && !isAssignedToMe) return false;

        const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase()) || 
                             t.projectId?.name?.toLowerCase().includes(search.toLowerCase());
        
        return matchesSearch;
    });

    // Stats as per software screenshot
    const overdueCount = displayTasks.filter(t => {
        if (!t.dueDate || t.status === 'completed' || t.status === 'done') return false;
        return new Date(t.dueDate) < new Date();
    }).length;
    const activeCount = displayTasks.filter(t => t.status === 'active' || t.status === 'in_progress').length;
    const doneCount = displayTasks.filter(t => t.status === 'completed' || t.status === 'done').length;

    const renderTaskItem = ({ item }) => {
        // Robust ID Discovery: Support both flat task objects and nested metric/assignment objects
        const realTaskId = item.taskId?._id || (typeof item.taskId === 'string' ? item.taskId : null) || item._id || item.id;
        
        const isCompleted = ['completed', 'complete', 'done'].includes((item.status || '').toLowerCase());
        const progress = item.progress !== undefined ? item.progress : (isCompleted ? 100 : (item.status === 'active' || item.status === 'in_progress' ? 40 : 0));
        const priority = (item.priority || 'Medium').toLowerCase();
        const priorityColor = priority === 'high' ? '#EF4444' : (priority === 'medium' ? '#F97316' : '#2563EB');
        const projectTitle = item.projectId?.name || item.projectName || 'Main Site';
        const role = item.assignedRoleType || 'Worker';

        return (
            <Card style={styles.taskCard} onPress={() => navigation.navigate('TaskDetail', { taskId: realTaskId })}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.taskTitle}>{item.title}</Text>
                        <View style={styles.inlineProgressContainer}>
                            <View style={styles.inlineProgressBarBg}>
                                <View style={[styles.inlineProgressBarFill, { width: `${progress}%` }]} />
                            </View>
                            <Text style={styles.inlineProgressText}>{progress}%</Text>
                        </View>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: isCompleted ? '#ECFDF5' : '#EFF6FF' }]}>
                        <Text style={[styles.statusBadgeText, { color: isCompleted ? '#10B981' : '#2563EB' }]}>
                            {(item.status || 'TODO').toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>PROJECT</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>{projectTitle}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>ROLE</Text>
                            <Text style={styles.detailValue}>{role}</Text>
                        </View>
                    </View>

                    <View style={[styles.detailRow, { marginTop: 12 }]}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>PRIORITY</Text>
                            <Text style={[styles.detailValue, { color: priorityColor, fontWeight: '900' }]}>
                                {priority.toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>TIMELINE</Text>
                            <Text style={styles.detailValue}>
                                {item.startDate ? new Date(item.startDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : 'ASAP'} - {item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : 'ASAP'}
                            </Text>
                        </View>
                    </View>
                </View>
                
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('TaskDetail', { taskId: realTaskId })}>
                    <MaterialCommunityIcons name="eye-outline" size={16} color="#64748B" />
                    <Text style={styles.actionBtnText}>VIEW DETAILS</Text>
                </TouchableOpacity>
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <WorkerHeader showBranding={true} title="Tasks" />

            <View style={styles.content}>
                <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>Task Command Center</Text>
                    <View style={styles.subtitleRow}>
                        <MaterialCommunityIcons name="earth" size={12} color="#2563EB" />
                        <Text style={styles.subtitleText}>TASK TRACKING & ASSIGNMENT</Text>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBadge, { backgroundColor: '#FEF2F2' }]}>
                        <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
                        <Text style={[styles.statText, { color: '#EF4444' }]}>{overdueCount} OVERDUE</Text>
                    </View>
                    <View style={[styles.statBadge, { backgroundColor: '#EFF6FF' }]}>
                        <View style={[styles.statDot, { backgroundColor: '#2563EB' }]} />
                        <Text style={[styles.statText, { color: '#2563EB' }]}>{activeCount} ACTIVE</Text>
                    </View>
                    <View style={[styles.statBadge, { backgroundColor: '#ECFDF5' }]}>
                        <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
                        <Text style={[styles.statText, { color: '#10B981' }]}>{doneCount} DONE</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchSection}>
                    <View style={styles.searchBox}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search tasks, projects..."
                            value={search}
                            onChangeText={setSearch}
                            placeholderTextColor="#94A3B8"
                        />
                    </View>
                </View>

                <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                    <FlatList
                        data={displayTasks}
                        keyExtractor={item => item._id || item.id}
                        renderItem={renderTaskItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#E2E8F0" />
                                <Text style={styles.emptyText}>No tasks found</Text>
                            </View>
                        }
                    />
                </Animated.View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { flex: 1 },
    titleSection: {
        paddingHorizontal: 20,
        paddingTop: 15,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    subtitleText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 8,
    },
    statBadge: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 4,
        justifyContent: 'center',
    },
    statDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statText: {
        fontSize: 9,
        fontWeight: '900',
    },
    searchSection: {
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        height: 48,
        borderRadius: 14,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    taskCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...SHADOWS.small,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
    },
    inlineProgressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    inlineProgressBarBg: {
        flex: 1,
        maxWidth: 120,
        height: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 2,
        overflow: 'hidden',
    },
    inlineProgressBarFill: {
        height: '100%',
        backgroundColor: '#2563EB',
    },
    inlineProgressText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '900',
    },
    cardDetails: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        marginTop: 4,
    },
    actionBtnText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { marginTop: 12, color: '#94A3B8', fontSize: 14, fontWeight: '700' },
});

export default WorkerTasksScreen;

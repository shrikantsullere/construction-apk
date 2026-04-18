import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    StatusBar, Dimensions, Animated, ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TaskDetailScreen = ({ navigation, route }) => {
    const { taskId } = route.params || {};
    const { tasks, metrics, updateTask, refreshData } = useApp();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    
    // Find task in local stores (Global tasks OR Worker Metrics)
    const workerTasks = metrics?.workerMetrics?.assignedTasks || [];
    const task = (tasks || []).find(t => (t.taskId?._id || t.taskId || t._id || t.id) === taskId) || 
                 workerTasks.find(t => (t.taskId?._id || t.taskId || t._id || t.id) === taskId);

    // CRITICAL: Get the verified actual task ID for the backend update
    const finalTaskId = task?.taskId?._id || (typeof task?.taskId === 'string' ? task.taskId : null) || task?._id || task?.id;

    if (!task || !task.title || !finalTaskId) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#94A3B8" />
                <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '700' }}>Task data missing</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: '#3B82F6', fontWeight: '900' }}>GO BACK</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    const isCompleted = ['completed', 'complete', 'done'].includes((task.status || '').toLowerCase());
    const progress = task.progress !== undefined ? task.progress : (isCompleted ? 100 : (task.status === 'active' || task.status === 'in_progress' ? 40 : 0));
    const priority = (task.priority || 'Medium').toLowerCase();
    const priorityColor = priority === 'high' ? '#EF4444' : (priority === 'medium' ? '#F97316' : '#3B82F6');

    const handleToggleStatus = async () => {
        const nextStatus = isCompleted ? 'todo' : 'completed';
        setLoading(true);
        await updateTask(finalTaskId, { ...task, status: nextStatus });
        setLoading(false);
    };

    const renderInfoRow = (icon, label, value, color = '#64748B') => (
        <View style={styles.infoRow}>
            <View style={[styles.iconContainer, { backgroundColor: color + '10' }]}>
                <MaterialCommunityIcons name={icon} size={20} color={color} />
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || 'Not specified'}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* Custom Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Task Details</Text>
                <TouchableOpacity style={styles.shareBtn}>
                    <MaterialCommunityIcons name="dots-vertical" size={24} color="#0F172A" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '15' }]}>
                        <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                        <Text style={[styles.priorityText, { color: priorityColor }]}>{priority.toUpperCase()} PRIORITY</Text>
                    </View>
                    <Text style={styles.mainTitle}>{task.title}</Text>
                    <View style={styles.projectIdRow}>
                        <MaterialCommunityIcons name="tag-outline" size={14} color="#94A3B8" />
                        <Text style={styles.projectIdText}>ID: {task._id ? task._id.slice(-6).toUpperCase() : 'N/A'}</Text>
                        <View style={styles.dot} />
                        <Text style={styles.projectIdText}>{task.category || 'TASK'}</Text>
                    </View>
                </View>

                {/* Progress Section */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Current Progress</Text>
                        <Text style={styles.progressPercent}>{progress}%</Text>
                    </View>
                    <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progress === 100 ? '#10B981' : '#3B82F6' }]} />
                    </View>
                    <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Overall Status</Text>
                        <View style={[styles.statusPill, { backgroundColor: isCompleted ? '#ECFDF5' : '#EFF6FF' }]}>
                            <Text style={[styles.statusPillText, { color: isCompleted ? '#10B981' : '#3B82F6' }]}>
                                {(task.status || 'todo').toUpperCase().replace('_', ' ')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Project Details */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Project Context</Text>
                    {renderInfoRow('office-building', 'Project Name', task.projectId?.name || task.projectName, '#3B82F6')}
                    {renderInfoRow('account-tie', 'Assigned Role', task.assignedRoleType || 'Worker', '#10B981')}
                    {renderInfoRow('calendar-range', 'Timeline', `${task.startDate ? new Date(task.startDate).toLocaleDateString() : 'ASAP'} — ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'ASAP'}`, '#F59E0B')}
                </View>

                {/* Description */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Description</Text>
                    <Text style={styles.descriptionText}>
                        {task.description || "No detailed description provided for this task. Please coordinate with your foreman for specific instructions."}
                    </Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity 
                    style={[styles.mainActionBtn, isCompleted && styles.completedActionBtn]} 
                    onPress={handleToggleStatus}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name={isCompleted ? "close-circle-outline" : "check-circle-outline"} size={22} color="#fff" />
                            <Text style={styles.mainActionText}>
                                {isCompleted ? "MARK AS INCOMPLETE" : "MARK AS COMPLETED"}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingBottom: 16, 
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
    shareBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20 },
    titleSection: { marginBottom: 24 },
    priorityBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        alignSelf: 'flex-start',
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 8,
        marginBottom: 12,
        gap: 6
    },
    priorityDot: { width: 6, height: 6, borderRadius: 3 },
    priorityText: { fontSize: 9, fontWeight: '900' },
    mainTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.8 },
    projectIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    projectIdText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
    card: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 24, 
        padding: 20, 
        marginBottom: 20, 
        borderWidth: 1, 
        borderColor: '#F1F5F9',
        ...SHADOWS.small 
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
    cardTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A', marginBottom: 16 },
    progressPercent: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
    progressBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
    statusLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusPillText: { fontSize: 10, fontWeight: '900' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    infoTextContainer: { flex: 1 },
    infoLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
    infoValue: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 1 },
    descriptionText: { fontSize: 14, lineHeight: 22, color: '#475569', fontWeight: '600' },
    mainActionBtn: { 
        backgroundColor: '#3B82F6', 
        height: 60, 
        borderRadius: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 12,
        ...SHADOWS.medium 
    },
    completedActionBtn: { backgroundColor: '#64748B' },
    mainActionText: { color: '#ffffff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }
});

export default TaskDetailScreen;

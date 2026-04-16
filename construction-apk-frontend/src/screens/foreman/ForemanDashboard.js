import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator, StatusBar, SafeAreaView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import WorkerHeader from '../../components/WorkerHeader';

const { width } = Dimensions.get('window');

const ForemanDashboard = ({ navigation }) => {
    const { user, tasks, metrics, refreshData, loading } = useApp();
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            refreshData();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    // Filter tasks assigned to the foreman (matching the logic used in TasksScreen)
    const pendingTasks = (tasks || []).filter(t => {
        const myId = user?._id ? String(user._id) : null;
        if (!myId) return false;
        
        const isCompleted = t.status === 'completed';
        if (isCompleted) return false;

        const assigned = t?.assignedTo;
        if (Array.isArray(assigned)) {
            return assigned.some(a => {
                const id = a && typeof a === 'object' ? (a._id || a.id) : a;
                return id ? String(id) === myId : false;
            });
        }
        if (assigned && typeof assigned === 'object') {
            const id = assigned._id || assigned.id;
            return id ? String(id) === myId : false;
        }
        return String(assigned) === myId;
    });

    const quickActions = [
        { id: '1', label: 'Clock In Crew', icon: 'account-clock', color: '#6366F1', bg: '#EEF2FF', screen: 'CrewClock' },
        { id: '2', label: 'Add Daily Log', icon: 'file-document-edit', color: '#F59E0B', bg: '#FFFBEB', screen: 'DailyLogs' },
        { id: '3', label: 'Upload Site Photo', icon: 'camera-plus', color: '#10B981', bg: '#ECFDF5', screen: 'Photos' },
        { id: '4', label: 'Create PO', icon: 'cart-plus', color: '#EF4444', bg: '#FEF2F2', screen: 'PurchaseOrders' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader showBranding={true} />
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
                {/* Header Title & Subtitle */}
                <View style={styles.headerSubtitleWrap}>
                    <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Foreman Dashboard</Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1} adjustsFontSizeToFit>OWN YOUR TIME. CONTROL YOUR SITE.</Text>
                </View>

                {/* Quick Actions GRID */}
                <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
                <View style={styles.actionGrid}>
                    {quickActions.map(action => (
                        <TouchableOpacity 
                            key={action.id} 
                            style={[styles.actionCard, { borderLeftColor: action.color }]}
                            onPress={() => action.screen && navigation.navigate(action.screen)}
                        >
                            <View style={[styles.actionIconWrap, { backgroundColor: '#F8FAFC' }]}>
                                <MaterialCommunityIcons name={action.icon} size={14} color={action.color} />
                            </View>
                            <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit>{action.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Assigned Tasks Section */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>ASSIGNED TASKS</Text>
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>{pendingTasks.length} Pending Tasks</Text>
                    </View>
                </View>

                <View style={[styles.tasksPremiumCard, SHADOWS.medium]}>
                    {pendingTasks.length > 0 ? (
                        pendingTasks.slice(0, 3).map((task, index) => (
                            <TouchableOpacity 
                                key={task._id || index} 
                                style={[styles.taskItem, index === 0 && { borderTopWidth: 0 }]}
                                onPress={() => navigation.navigate('ForemanTasks')}
                            >
                                <View style={styles.taskLeft}>
                                    <View style={[styles.taskStatusDot, { backgroundColor: task.priority === 'High' ? '#EF4444' : '#3B82F6' }]} />
                                    <View>
                                        <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                                        <Text style={styles.taskProject} numberOfLines={1}>{task.projectId?.name || 'Site Task'}</Text>
                                    </View>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyTasksView}>
                            <MaterialCommunityIcons name="check-decagram" size={48} color="#10B981" />
                            <Text style={styles.emptyTasksTitle}>All caught up!</Text>
                            <Text style={styles.emptyTasksSub}>No tasks assigned to your crew today.</Text>
                        </View>
                    )}
                    {pendingTasks.length > 3 && (
                        <TouchableOpacity 
                            style={styles.viewMoreBtn}
                            onPress={() => navigation.navigate('ForemanTasks')}
                        >
                            <Text style={styles.viewMoreText}>View all {pendingTasks.length} tasks</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Site Activity Summary */}
                <Text style={styles.sectionTitle}>SITE ACTIVITY</Text>
                <View style={styles.activityCard}>
                    <View style={styles.activityRow}>
                        <MaterialCommunityIcons name="calendar-multiselect" size={20} color="#64748B" />
                        <Text style={styles.activityText}>Daily Site Log: {metrics?.metrics?.logsSubmittedToday > 0 ? 'Submitted' : 'Pending'}</Text>
                        <MaterialCommunityIcons 
                            name={metrics?.metrics?.logsSubmittedToday > 0 ? "check-circle" : "alert-circle-outline"} 
                            size={18} 
                            color={metrics?.metrics?.logsSubmittedToday > 0 ? "#10B981" : "#F59E0B"} 
                        />
                    </View>
                    <View style={styles.activityRow}>
                        <MaterialCommunityIcons name="camera-outline" size={20} color="#64748B" />
                        <Text style={styles.activityText}>Photos Uploaded Today: {metrics?.metrics?.photosUploadedToday || 0}</Text>
                        <MaterialCommunityIcons name="arrow-right" size={18} color="#CBD5E1" />
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { padding: 14, paddingTop: 10, paddingBottom: 60 },

    headerSubtitleWrap: { marginBottom: 6, paddingLeft: 2 },
    headerTitle: { fontSize: width < 380 ? 28 : 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
    headerSubtitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginTop: 1 },

    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#0F172A', letterSpacing: 1.5, marginBottom: 10, marginTop: 4, paddingLeft: 2 },
    
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
    actionCard: { 
        width: '48.5%', 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        paddingVertical: 8, 
        paddingHorizontal: 10, 
        marginBottom: 8, 
        borderLeftWidth: 3, 
        flexDirection: 'row', 
        alignItems: 'center',
        elevation: 2, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 2
    },
    actionIconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    actionLabel: { fontSize: 13, fontWeight: '800', color: '#1E293B', flex: 1 },

    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 10 },
    pendingBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    pendingBadgeText: { fontSize: 9, fontWeight: '900', color: '#EF4444' },

    tasksPremiumCard: { backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 20 },
    taskItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
    taskLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    taskStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
    taskTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    taskProject: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
    
    emptyTasksView: { padding: 40, alignItems: 'center' },
    emptyTasksTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginTop: 16 },
    emptyTasksSub: { fontSize: 13, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 },

    viewMoreBtn: { padding: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F8FAFC', backgroundColor: '#FBFDFF' },
    viewMoreText: { fontSize: 11, fontWeight: '900', color: '#2563EB' },

    activityCard: { backgroundColor: '#fff', borderRadius: 20, padding: 4, borderWidth: 1, borderColor: '#F1F5F9' },
    activityRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
    activityText: { fontSize: 13, fontWeight: '800', color: '#475569', flex: 1 },
});

export default ForemanDashboard;

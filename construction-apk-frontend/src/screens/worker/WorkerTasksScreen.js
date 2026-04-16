import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Animated, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, SIZES } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import { useApp } from '../../context/AppContext';
import { Card, Badge } from '../../components/shared/CommonUI';

const { width } = Dimensions.get('window');

const WorkerTasksScreen = ({ navigation }) => {
    const { tasks, updateTask, refreshData, user } = useApp();
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshData();
        });
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        return unsubscribe;
    }, [navigation]);

    const isManagerial = ['PM', 'FOREMAN', 'OWNER', 'COMPANY_OWNER'].includes(user?.role);

    const filteredTasks = (tasks || []).filter(t => {
        const isAssignedToMe = (Array.isArray(t.assignedTo) && t.assignedTo.some(a => (a._id || a) === user?._id)) ||
            (t.assignedTo === user?._id || t.assignedTo === user?.fullName);
        
        const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase()) || 
                             t.projectId?.name?.toLowerCase().includes(search.toLowerCase());
        
        // Managers see everything, Workers see only their assignments
        const canSee = isManagerial || isAssignedToMe;
        
        return canSee && matchesSearch;
    });

    const completedCount = filteredTasks.filter(t => t.status === 'completed').length;
    const totalCount = filteredTasks.length;

    const toggleStatus = async (task) => {
        const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
        setLoading(true);
        await updateTask(task._id || task.id, { ...task, status: nextStatus });
        setLoading(false);
    };

    const renderTaskCard = ({ item }) => (
        <Card style={styles.taskCard}>
            <View style={styles.cardContent}>
                <TouchableOpacity
                    onPress={() => toggleStatus(item)}
                    style={[styles.checkbox, item.status === 'completed' && styles.checkboxActive]}
                >
                    {item.status === 'completed' && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                </TouchableOpacity>

                <View style={styles.textContainer}>
                    <Text style={[styles.taskTitle, item.status === 'completed' && styles.strike]}>{item.title}</Text>
                    <View style={styles.metaRow}>
                        <MaterialCommunityIcons name="office-building" size={12} color="#64748B" />
                        <Text style={styles.projectText}>{item.projectId?.name || 'Main Site'}</Text>
                        
                        {isManagerial && (
                            <>
                                <View style={styles.dot} />
                                <MaterialCommunityIcons name="account" size={12} color="#64748B" />
                                <Text style={styles.projectText} numberOfLines={1}>
                                    {item.assignedTo?.fullName || (Array.isArray(item.assignedTo) ? item.assignedTo[0]?.fullName : 'Unassigned')}
                                </Text>
                            </>
                        )}

                        <View style={styles.dot} />
                        <MaterialCommunityIcons name="calendar-clock" size={12} color="#64748B" />
                        <Text style={styles.dateText}>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No Due Date'}</Text>
                    </View>
                </View>

                <View style={[styles.pBadge, { backgroundColor: item.priority === 'High' ? '#FEE2E2' : '#EFF6FF' }]}>
                    <Text style={[styles.pBadgeText, { color: item.priority === 'High' ? '#EF4444' : '#2563EB' }]}>
                        {(item.priority || 'LOW').toUpperCase()}
                    </Text>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <WorkerHeader title="Tasks" />

            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="calendar-check-outline" size={80} color="#E2E8F0" />
                <Text style={styles.emptyTitle}>Worker Tasks</Text>
                <Text style={styles.emptySubtitle}>Content is being updated by the Project Manager.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { flex: 1, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 24 },
    title: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginTop: 4 },
    progressCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 4, borderColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
    progressText: { fontSize: 10, fontWeight: '900', color: '#2563EB' },

    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, height: 48, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
    input: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#1E293B' },

    list: { paddingBottom: 100 },
    taskCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#2563EB', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
    cardContent: { flexDirection: 'row', alignItems: 'center' },
    checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: '#10B981', borderColor: '#10B981' },

    textContainer: { flex: 1, marginLeft: 16 },
    taskTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    strike: { textDecorationLine: 'line-through', color: '#94A3B8' },

    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
    projectText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
    dateText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1', marginHorizontal: 4 },

    pBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    pBadgeText: { fontSize: 10, fontWeight: '900' },

    empty: { alignItems: 'center', marginTop: 100 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
    emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginTop: 16 },
    emptySubtitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 },
    emptyLabel: { marginTop: 16, fontSize: 14, fontWeight: '700', color: '#94A3B8' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }
});

export default WorkerTasksScreen;

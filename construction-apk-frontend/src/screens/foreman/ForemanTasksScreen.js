import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Animated, ActivityIndicator, Dimensions, ScrollView, RefreshControl, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const ForemanTasksScreen = ({ navigation }) => {
    const { tasks, updateTask, refreshData, user } = useApp();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
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

    const filteredTasks = (tasks || []).filter(t => {
        const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase()) ||
            t.projectId?.name?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const pendingTasks = filteredTasks.filter(t => t.status !== 'completed');
    const completedTasks = filteredTasks.filter(t => t.status === 'completed');

    const toggleStatus = async (task) => {
        const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
        setLoading(true);
        await updateTask(task._id || task.id, { ...task, status: nextStatus });
        setLoading(false);
    };

    const renderTaskCard = ({ item }) => (
        <View style={[styles.taskCard, SHADOWS.small]}>
            <View style={styles.cardMain}>
                <TouchableOpacity
                    onPress={() => toggleStatus(item)}
                    style={[styles.checkbox, item.status === 'completed' && styles.checkboxActive]}
                >
                    {item.status === 'completed' && <MaterialCommunityIcons name="check-bold" size={14} color="#fff" />}
                </TouchableOpacity>

                <View style={styles.contentWrap}>
                    <Text style={[styles.taskTitle, item.status === 'completed' && styles.strike]}>{item.title}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <MaterialCommunityIcons name="office-building" size={12} color="#64748B" />
                            <Text style={styles.metaText}>{item.projectId?.name || 'Main Site'}</Text>
                        </View>
                        <View style={styles.dot} />
                        <View style={styles.metaItem}>
                            <MaterialCommunityIcons name="clock-outline" size={12} color="#64748B" />
                            <Text style={styles.metaText}>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No date'}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.priorityBadge, { backgroundColor: item.priority === 'High' ? '#FEE2E2' : '#EFF6FF' }]}>
                    <Text style={[styles.priorityText, { color: item.priority === 'High' ? '#EF4444' : '#2563EB' }]}>
                        {item.priority || 'MED'}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="Site Tasks" />

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search site tasks..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <Animated.FlatList
                data={filteredTasks}
                keyExtractor={item => item._id || item.id}
                renderItem={renderTaskCard}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyView}>
                        <MaterialCommunityIcons name="calendar-search" size={60} color="#E2E8F0" />
                        <Text style={styles.emptyTitle}>No Tasks Found</Text>
                        <Text style={styles.emptySub}>We couldn't find any tasks matching your criteria.</Text>
                    </View>
                }
            />

            {loading && <View style={styles.loaderOverlay}><ActivityIndicator color="#2563EB" size="large" /></View>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    searchContainer: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', height: 52, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#1E293B' },
    listContent: { paddingHorizontal: 24, paddingBottom: 100 },
    taskCard: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    cardMain: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    checkbox: { width: 28, height: 28, borderRadius: 10, borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    contentWrap: { flex: 1, marginLeft: 16, marginRight: 8 },
    taskTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    strike: { textDecorationLine: 'line-through', color: '#94A3B8' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1' },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    priorityText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    emptyView: { padding: 40, alignItems: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginTop: 20 },
    emptySub: { fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 },
    loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 99 }
});

export default ForemanTasksScreen;

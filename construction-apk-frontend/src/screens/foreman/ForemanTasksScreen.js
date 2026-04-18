import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, ActivityIndicator, Dimensions, ScrollView, RefreshControl, StatusBar, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import { useApp } from '../../context/AppContext';

import { Calendar } from 'react-native-calendars';

const { width } = Dimensions.get('window');

const ForemanTasksScreen = ({ navigation }) => {
    const { tasks, addTask, refreshData, projects, teamMembers, jobs, user } = useApp();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('ALL TASKS');
    const [showModal, setShowModal] = useState(false);
    
    // Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateTarget, setDateTarget] = useState('startDate'); // 'startDate' or 'dueDate'

    // Form State - ALL FIELDS INCLUDED
    const [form, setForm] = useState({
        title: '',
        projectId: '',
        jobId: '',
        assignedRoleType: 'FOREMAN',
        assignedTo: [],
        category: 'task',
        priority: 'medium',
        status: 'todo',
        startDate: '',
        dueDate: '',
        description: ''
    });

    const onDateSelect = (day) => {
        setForm({ ...form, [dateTarget]: day.dateString });
        setShowDatePicker(false);
    };

    const openDatePicker = (target) => {
        setDateTarget(target);
        setShowDatePicker(true);
    };

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
        overdue: (tasks || []).filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()).length,
        active: (tasks || []).filter(t => (t.status || '').toLowerCase().includes('progress')).length,
        done: (tasks || []).filter(t => (t.status || '').toLowerCase().includes('completed') || (t.status || '').toLowerCase() === 'done').length
    };

    const filteredTasks = (tasks || []).filter(t => {
        const q = search.toLowerCase();
        const matchesSearch = t.title?.toLowerCase().includes(q) || 
                             t.projectId?.name?.toLowerCase().includes(q) ||
                             t.projectName?.toLowerCase().includes(q);
        
        if (activeTab === 'MY TASKS') {
            const myId = user?._id || user?.id;
            const isAssignedToMe = Array.isArray(t.assignedTo) 
                ? t.assignedTo.some(a => (a?._id || a?.id || a) === myId)
                : (t.assignedTo?._id || t.assignedTo?.id || t.assignedTo) === myId;
            return matchesSearch && isAssignedToMe;
        }
        
        return matchesSearch;
    });

    // Sub-modal for selection
    const [selectConfig, setSelectConfig] = useState({ visible: false, title: '', options: [], field: '' });

    const openSelector = (title, field, options) => {
        setSelectConfig({ visible: true, title, field, options });
    };

    const handleSelectAction = (val) => {
        if (selectConfig.field === 'assignedTo') {
            setForm({ ...form, assignedTo: [val] });
        } else {
            setForm({ ...form, [selectConfig.field]: val });
        }
        setSelectConfig({ visible: false, title: '', options: [], field: '' });
    };

    const handleCreateTask = async () => {
        if (!form.title) { alert('Task Title is required'); return; }
        if (!form.projectId) { alert('Please select a Project'); return; }

        setLoading(true);
        try {
            const success = await addTask(form);
            if (success) {
                setShowModal(false);
                setForm({
                    title: '', projectId: '', jobId: '', assignedRoleType: 'FOREMAN',
                    assignedTo: [], category: 'Task', priority: 'Medium', status: 'todo',
                    startDate: '', dueDate: '', description: ''
                });
                refreshData();
            } else {
                alert('Backend Error: Failed to create task.');
            }
        } catch (e) {
            alert('Network Error: Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('todo')) return { bg: '#F1F5F9', text: '#64748B' };
        if (s.includes('progress')) return { bg: '#EFF6FF', text: '#2563EB' };
        if (s.includes('review')) return { bg: '#FEF3C7', text: '#D97706' };
        if (s.includes('completed') || s.includes('done')) return { bg: '#ECFDF5', text: '#10B981' };
        return { bg: '#F1F5F9', text: '#64748B' };
    };

    const getPriorityColor = (priority) => {
        const p = (priority || '').toLowerCase();
        if (p === 'high') return { bg: '#FEE2E2', text: '#EF4444' };
        if (p === 'medium') return { bg: '#FFEDD5', text: '#F59E0B' };
        if (p === 'low') return { bg: '#ECFDF5', text: '#10B981' };
        return { bg: '#F1F5F9', text: '#64748B' };
    };

    const renderTaskCard = ({ item }) => {
        const statusStyle = getStatusColor(item.status);
        const priorityStyle = getPriorityColor(item.priority);
        
        return (
            <TouchableOpacity 
                style={[styles.taskCard, SHADOWS.small]}
                onPress={() => navigation.navigate('TaskDetail', { task: item })}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.taskTitle}>{item.title}</Text>
                        <Text style={styles.projectSubtitle}>{item.projectId?.name || item.projectName || 'General Project'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{(item.status || 'TODO').replace('_', ' ').toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>ASSIGNED TO</Text>
                            <View style={styles.assigneeWrap}>
                                <View style={styles.avatarMini}>
                                    <Text style={styles.avatarTxt}>
                                        {(item.assignedTo?.[0]?.fullName || item.assignedTo?.fullName || 'U').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.infoVal} numberOfLines={1}>
                                    {item.assignedTo?.[0]?.fullName || item.assignedTo?.fullName || 'Unassigned'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>PRIORITY</Text>
                            <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
                                <Text style={[styles.priorityText, { color: priorityStyle.text }]}>{(item.priority || 'MEDIUM').toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="Task" showBranding={true} />

            <ScrollView 
                stickyHeaderIndices={[2]} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.headerTitleSection}>
                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.screenTitle}>Task Center</Text>
                            <View style={styles.breadcrumbRow}>
                                <MaterialCommunityIcons name="layers-triple" size={12} color="#2563EB" />
                                <Text style={styles.breadcrumbText}>FOREMAN • OPS</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.newTaskBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
                            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                            <Text style={styles.newTaskBtnText}>NEW TASK</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.statsBar}>
                    <View style={[styles.statItem, { backgroundColor: '#FEF2F2' }]}>
                        <Text style={[styles.statNum, { color: '#EF4444' }]}>{stats.overdue}</Text>
                        <Text style={[styles.statLabel, { color: '#EF4444' }]}>OVERDUE</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: '#EFF6FF' }]}>
                        <Text style={[styles.statNum, { color: '#2563EB' }]}>{stats.active}</Text>
                        <Text style={[styles.statLabel, { color: '#2563EB' }]}>ACTIVE</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={[styles.statNum, { color: '#10B981' }]}>{stats.done}</Text>
                        <Text style={[styles.statLabel, { color: '#10B981' }]}>DONE</Text>
                    </View>
                </View>

                <View style={styles.stickyActionArea}>
                    <View style={styles.searchBar}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search tasks..."
                            placeholderTextColor="#94A3B8"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    <View style={styles.tabsContainer}>
                        <TouchableOpacity style={[styles.tab, activeTab === 'MY TASKS' && styles.tabActive]} onPress={() => setActiveTab('MY TASKS')}>
                            <Text style={[styles.tabText, activeTab === 'MY TASKS' && styles.tabTextActive]}>MY TASKS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.tab, activeTab === 'ALL TASKS' && styles.tabActive]} onPress={() => setActiveTab('ALL TASKS')}>
                            <Text style={[styles.tabText, activeTab === 'ALL TASKS' && styles.tabTextActive]}>ALL TASKS</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.listContainer}>
                    {(filteredTasks || []).length > 0 ? (
                        filteredTasks.map((task, i) => (
                            <View key={task._id || task.id || i}>
                                {renderTaskCard({ item: task })}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyView}>
                            <MaterialCommunityIcons name="calendar-search" size={60} color="#E2E8F0" />
                            <Text style={styles.emptyTitle}>Empty Queue</Text>
                            <Text style={styles.emptySub}>No tasks found matching your criteria.</Text>
                        </View>
                    )}
                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Create New Task Modal - ALL 11 FIELDS INCLUDED */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalHeaderTitle}>Create New Task</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={{ padding: 10 }}>
                                <MaterialCommunityIcons name="close" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>TASK TITLE</Text>
                                <TextInput 
                                    style={styles.textInput}
                                    placeholder="Task Title..."
                                    value={form.title}
                                    onChangeText={(val) => setForm({...form, title: val})}
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>

                            <View style={styles.rowInputs}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.inputLabel}>PROJECT</Text>
                                    <TouchableOpacity 
                                        style={styles.selectInput} 
                                        onPress={() => openSelector('Select Project', 'projectId', (projects || []).map(p => ({ label: p.name, value: p._id || p.id })))}
                                    >
                                        <Text style={[styles.selectTxt, !form.projectId && {color: '#94A3B8'}]} numberOfLines={1}>
                                            {projects?.find(p => (p?._id || p?.id) === form.projectId)?.name || 'Select Project'}
                                        </Text>
                                        <MaterialCommunityIcons name="chevron-down" size={18} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                    <Text style={styles.inputLabel}>JOB</Text>
                                    <TouchableOpacity 
                                        style={styles.selectInput}
                                        onPress={() => openSelector('Select Job', 'jobId', (jobs || []).map(j => ({ label: j.name || j.title, value: j._id || j.id })))}
                                    >
                                        <Text style={[styles.selectTxt, !form.jobId && {color: '#94A3B8'}]} numberOfLines={1}>
                                            {jobs?.find(j => (j?._id || j?.id) === form.jobId)?.name || 'Select Job'}
                                        </Text>
                                        <MaterialCommunityIcons name="chevron-down" size={18} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.rowInputs}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.inputLabel}>ASSIGN ROLE</Text>
                                    <TouchableOpacity 
                                        style={styles.selectInput}
                                        onPress={() => openSelector('Select Role', 'assignedRoleType', [
                                            { label: 'Worker', value: 'WORKER' },
                                            { label: 'Foreman', value: 'FOREMAN' },
                                            { label: 'PM', value: 'PM' },
                                            { label: 'Subcontractor', value: 'SUBCONTRACTOR' }
                                        ])}
                                    >
                                        <Text style={styles.selectTxt}>{form.assignedRoleType}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                    <Text style={styles.inputLabel}>ASSIGN TO</Text>
                                    <TouchableOpacity 
                                        style={styles.selectInput}
                                        onPress={() => openSelector('Assign To', 'assignedTo', (teamMembers || [])
                                            .filter(m => (m.role || '').toUpperCase() === 'WORKER')
                                            .map(m => ({ label: m.fullName || m.name, value: m._id || m.id }))
                                        )}
                                    >
                                        <Text style={[styles.selectTxt, form.assignedTo.length === 0 && {color: '#94A3B8'}]} numberOfLines={1}>
                                            {teamMembers?.find(m => (m?._id || m?.id) === (Array.isArray(form.assignedTo) ? form.assignedTo[0] : form.assignedTo))?.fullName || 'Unassigned'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.rowInputs}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.inputLabel}>CATEGORY</Text>
                                    <TouchableOpacity 
                                        style={styles.selectInput}
                                        onPress={() => openSelector('Select Category', 'category', [{ label: 'Task', value: 'task' }, { label: 'Todo', value: 'todo' }])}
                                    >
                                        <Text style={styles.selectTxt}>{form.category?.charAt(0).toUpperCase() + form.category?.slice(1)}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                    <Text style={styles.inputLabel}>PRIORITY</Text>
                                    <TouchableOpacity 
                                        style={styles.selectInput}
                                        onPress={() => openSelector('Select Priority', 'priority', [
                                            { label: 'High', value: 'high' },
                                            { label: 'Medium', value: 'medium' },
                                            { label: 'Low', value: 'low' }
                                        ])}
                                    >
                                        <Text style={styles.selectTxt}>{form.priority?.charAt(0).toUpperCase() + form.priority?.slice(1)}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>STATUS</Text>
                                <TouchableOpacity 
                                    style={styles.selectInput}
                                    onPress={() => openSelector('Select Status', 'status', [
                                        { label: 'To Do', value: 'todo' },
                                        { label: 'In Progress', value: 'in_progress' },
                                        { label: 'Review', value: 'review' },
                                        { label: 'Completed', value: 'completed' }
                                    ])}
                                >
                                    <Text style={styles.selectTxt}>{(form.status || 'TODO').replace('_', ' ').toUpperCase()}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.rowInputs}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                    <View style={styles.inputLabelRow}>
                                        <MaterialCommunityIcons name="calendar-start" size={14} color="#3B82F6" />
                                        <Text style={styles.inputLabel}>START DATE</Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.selectInput} 
                                        onPress={() => openDatePicker('startDate')}
                                    >
                                        <Text style={[styles.selectTxt, !form.startDate && {color: '#94A3B8'}]} numberOfLines={1}>
                                            {form.startDate || 'YYYY-MM-DD'}
                                        </Text>
                                        <MaterialCommunityIcons name="calendar-outline" size={18} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                    <View style={styles.inputLabelRow}>
                                        <MaterialCommunityIcons name="calendar-clock" size={14} color="#3B82F6" />
                                        <Text style={styles.inputLabel}>DUE DATE</Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.selectInput} 
                                        onPress={() => openDatePicker('dueDate')}
                                    >
                                        <Text style={[styles.selectTxt, !form.dueDate && {color: '#94A3B8'}]} numberOfLines={1}>
                                            {form.dueDate || 'YYYY-MM-DD'}
                                        </Text>
                                        <MaterialCommunityIcons name="calendar-outline" size={18} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>DESCRIPTION</Text>
                                <TextInput 
                                    style={[styles.textInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                                    placeholder="Description..."
                                    multiline
                                    value={form.description}
                                    onChangeText={(val) => setForm({...form, description: val})}
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                            <View style={{ height: 100 }} />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelLink} onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelLinkText}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.createTaskBtn} onPress={handleCreateTask} activeOpacity={0.8}>
                                <Text style={styles.createTaskBtnText}>CREATE TASK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Selection Sub-Modal */}
            <Modal visible={selectConfig.visible} transparent animationType="fade">
                <TouchableOpacity style={styles.selectorOverlay} activeOpacity={1} onPress={() => setSelectConfig({ ...selectConfig, visible: false })}>
                    <View style={styles.selectorContent}>
                        <Text style={styles.selectorTitle}>{selectConfig.title}</Text>
                        <ScrollView style={{ maxHeight: 350 }}>
                            {selectConfig.options.map((opt, i) => (
                                <TouchableOpacity key={i} style={styles.selectorItem} onPress={() => handleSelectAction(opt.value)}>
                                    <Text style={[styles.selectorItemText, (form[selectConfig.field] === opt.value) && { color: '#2563EB', fontWeight: '900' }]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {loading && <View style={styles.loaderOverlay}><ActivityIndicator color="#2563EB" size="large" /></View>}

            {/* Calendar Modal Picker */}
            <Modal visible={showDatePicker} transparent animationType="fade">
                <View style={styles.selectorOverlay}>
                    <View style={[styles.selectorContent, { padding: 10 }]}>
                        <View style={styles.selectorHeader}>
                             <Text style={styles.selectorTitle}>{dateTarget === 'startDate' ? 'Select Start Date' : 'Select Due Date'}</Text>
                             <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <Calendar
                            onDayPress={onDateSelect}
                            markedDates={{
                                [form[dateTarget]]: { selected: true, selectedColor: '#2563EB' }
                            }}
                            theme={{
                                selectedDayBackgroundColor: '#2563EB',
                                todayTextColor: '#2563EB',
                                arrowColor: '#2563EB',
                                textDayFontWeight: '800',
                                textMonthFontWeight: '900',
                                textDayHeaderFontWeight: '900',
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerTitleSection: { padding: 20 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    screenTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
    breadcrumbRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    breadcrumbText: { fontSize: 10, fontWeight: '800', color: '#64748B', marginLeft: 4 },
    newTaskBtn: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    newTaskBtnText: { color: '#fff', fontSize: 12, fontWeight: '900', marginLeft: 6 },
    statsBar: { flexDirection: 'row', paddingHorizontal: 20, justifyContent: 'space-between' },
    statItem: { width: '31%', padding: 12, borderRadius: 16, alignItems: 'center' },
    statNum: { fontSize: 18, fontWeight: '900' },
    statLabel: { fontSize: 9, fontWeight: '900', marginTop: 2 },
    stickyActionArea: { backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingVertical: 12 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', height: 44, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1E293B' },
    tabsContainer: { flexDirection: 'row', marginTop: 12, backgroundColor: '#EDF2F7', padding: 4, borderRadius: 12 },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
    tabActive: { backgroundColor: '#fff', elevation: 2 },
    tabText: { fontSize: 11, fontWeight: '800', color: '#94A3B8' },
    tabTextActive: { color: '#1E293B' },
    listContainer: { paddingHorizontal: 20 },
    taskCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    taskTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    projectSubtitle: { fontSize: 11, color: '#64748B', marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 9, fontWeight: '900' },
    cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    cardBody: { paddingHorizontal: 0 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', marginBottom: 4 },
    infoVal: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
    assigneeWrap: { flexDirection: 'row', alignItems: 'center' },
    avatarMini: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
    avatarTxt: { fontSize: 9, fontWeight: '900', color: '#4338CA' },
    priorityBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    priorityText: { fontSize: 9, fontWeight: '900' },
    emptyView: { padding: 40, alignItems: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 16 },
    emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 4 },
    loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    modalForm: { flex: 1, padding: 20 },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', marginBottom: 8 },
    textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, height: 46, fontSize: 14, color: '#1E293B' },
    rowInputs: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, height: 46 },
    selectTxt: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
    modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center', justifyContent: 'space-between' },
    cancelLink: { padding: 10 },
    cancelLinkText: { fontSize: 14, fontWeight: '900', color: '#64748B' },
    createTaskBtn: { backgroundColor: '#2563EB', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flex: 1, marginLeft: 20 },
    createTaskBtnText: { fontSize: 14, fontWeight: '900', color: '#fff' },
    selectorOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 40 },
    selectorContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
    selectorTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 12, textAlign: 'center' },
    selectorItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    selectorItemText: { fontSize: 14, color: '#334155', textAlign: 'center' }
});

export default ForemanTasksScreen;

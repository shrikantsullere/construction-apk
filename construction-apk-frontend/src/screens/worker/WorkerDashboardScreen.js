import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Dimensions, Modal, ScrollView, Alert, StatusBar, Platform, FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import WorkerHeader from '../../components/WorkerHeader';
import api from '../../utils/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmall = SCREEN_WIDTH < 380;

const WorkerDashboardScreen = ({ navigation }) => {
    const {
        user, isClockedIn, toggleClock, getWorkDuration, refreshData,
        projects, metrics, clockInTime, tasks, activities, todos,
        addTodo, toggleTodo, deleteTodo, jobs
    } = useApp();

    const [timer, setTimer] = useState('00:00:00');
    const [clockModal, setClockModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null); // { type: 'task'|'project', id, name, projectId, jobId, taskType }
    const [todoText, setTodoText] = useState('');
    const [showTodoFilter, setShowTodoFilter] = useState(false);
    const [todoFilter, setTodoFilter] = useState('all'); // all, pending, completed

    // Worker metrics from backend /reports/stats
    const workerMetrics = metrics?.workerMetrics || {};
    const myHoursToday = workerMetrics.myHoursToday || '0.0h';
    const currentJob = workerMetrics.currentJob || 'Not Clocked In';
    const assignedJobs = workerMetrics.assignedProjects?.length || 0;

    // All tasks assigned to current user
    const myTasks = (workerMetrics.assignedTasks || []).length > 0
        ? workerMetrics.assignedTasks
        : (tasks || []).filter(t => {
            const isAssigned = (Array.isArray(t.assignedTo) && t.assignedTo.some(a => (a._id || a) === user?._id)) ||
                (t.assignedTo === user?._id || t.assignedTo === user?.fullName);
            return isAssigned;
        });

    const pendingTasks = myTasks.filter(t => {
        const status = (t.status || '').toLowerCase();
        return status !== 'completed' && status !== 'cancelled';
    });

    // Todos
    const myTodos = (todos || []).filter(t => {
        if (todoFilter === 'pending') return t.status !== 'completed';
        if (todoFilter === 'completed') return t.status === 'completed';
        return true;
    });
    const todayTodos = myTodos.filter(t => {
        const created = new Date(t.createdAt);
        const now = new Date();
        return created.toDateString() === now.toDateString();
    });
    const displayTodos = todayTodos.length > 0 ? todayTodos : myTodos.slice(0, 5);
    const pendingTodoCount = (todos || []).filter(t => t.status !== 'completed').length;

    // Recent Activity from backend
    const myRecentActivity = (metrics?.myRecentActivity || activities || []).slice(0, 5);

    // Data for clock-in selector - same as software's workerMetrics
    const assignedTasks = workerMetrics.assignedTasks || [];
    const assignedProjects = workerMetrics.assignedProjects || [];
    const hasAssignments = assignedTasks.length > 0 || assignedProjects.length > 0;

    // Timer
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => { refreshData(); });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        let interval;
        if (isClockedIn) {
            interval = setInterval(() => {
                setTimer(getWorkDuration() || '00:00:00');
            }, 1000);
        } else {
            setTimer('00:00:00');
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isClockedIn]);

    const handleClockToggle = async (assignment = null) => {
        try {
            if (!isClockedIn && !assignment) {
                setClockModal(true);
                return;
            }
            // Extract projectId from assignment (matching software logic)
            let pId = null;
            if (assignment) {
                if (assignment.type === 'task') {
                    pId = assignment.projectId;
                } else if (assignment.type === 'project') {
                    pId = assignment._id || assignment.id;
                } else {
                    pId = assignment;
                }
            }
            await toggleClock(pId);
            setClockModal(false);
            refreshData();
        } catch (e) {
            const errorMsg = e.response?.data?.message || e.message;
            Alert.alert('Attendance Error', errorMsg || 'Could not sync with server.');
        }
    };

    const handleAddTodo = async () => {
        if (!todoText.trim()) return;
        const result = await addTodo({ description: todoText.trim() });
        if (result) {
            setTodoText('');
        }
    };

    // Calculate sizes based on screen
    const cardWidth = (SCREEN_WIDTH - 48) / 4; // 4 cards with spacing
    const statCardMinWidth = isSmall ? 72 : 80;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <WorkerHeader showBranding={true} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* ═══ DASHBOARD TITLE ═══ */}
                <View style={styles.dashboardHeader}>
                    <View style={styles.dashTitleRow}>
                        <Text style={styles.dashTitle}>Dashboard</Text>
                    </View>
                    <Text style={styles.dashSubtitle}>
                        <MaterialCommunityIcons name="clock-outline" size={11} color="#64748B" />
                        {' '}OWN YOUR TIME. CONTROL YOUR SITE.
                    </Text>
                </View>

                {/* ═══ CLOCK IN/OUT CARD ═══ */}
                <View style={[styles.clockCard, SHADOWS.card]}>
                    {/* Status badge */}
                    <View style={styles.clockStatusRow}>
                        <View style={[styles.clockStatusBadge, { backgroundColor: isClockedIn ? '#DCFCE7' : '#FFF7ED' }]}>
                            <View style={[styles.clockStatusDot, { backgroundColor: isClockedIn ? '#16A34A' : '#F59E0B' }]} />
                            <Text style={[styles.clockStatusText, { color: isClockedIn ? '#16A34A' : '#D97706' }]}>
                                {isClockedIn ? 'CURRENTLY ON CLOCK' : 'READY TO START'}
                            </Text>
                        </View>
                    </View>

                    {/* Timer display */}
                    <View style={styles.timerSection}>
                        <Text style={styles.timerText}>{isClockedIn ? timer : '00:00:00'}</Text>
                        {/* Clock icon floating */}
                        <View style={styles.clockIconFloat}>
                            <MaterialCommunityIcons name="clock-outline" size={64} color="#F1F5F9" />
                        </View>
                    </View>

                    {/* Site selector */}
                    <Text style={styles.siteLabel}>SELECT SITE FOR CLOCK IN</Text>
                    <TouchableOpacity
                        style={styles.siteSelector}
                        onPress={() => !isClockedIn && setClockModal(true)}
                        disabled={isClockedIn}
                    >
                        <Text style={styles.siteSelectorText}>
                            {isClockedIn ? (currentJob !== 'Not Clocked In' ? currentJob : 'Active Site') :
                                (selectedAssignment ? selectedAssignment.displayName : '-- Choose Task / Project --')}
                        </Text>
                        {!isClockedIn && <MaterialCommunityIcons name="chevron-down" size={18} color="#94A3B8" />}
                    </TouchableOpacity>

                    {/* Not Active indicator */}
                    {!isClockedIn && (
                        <View style={styles.notActiveRow}>
                            <View style={[styles.notActiveDot, { backgroundColor: '#94A3B8' }]} />
                            <Text style={styles.notActiveText}>Not Active</Text>
                        </View>
                    )}

                    {/* Clock button */}
                    <TouchableOpacity
                        style={[styles.clockBtn, { backgroundColor: isClockedIn ? '#EF4444' : '#2563EB' }]}
                        onPress={() => handleClockToggle(selectedAssignment)}
                    >
                        <MaterialCommunityIcons
                            name={isClockedIn ? "stop-circle" : "play-circle"}
                            size={20}
                            color="#fff"
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.clockBtnText}>
                            {isClockedIn ? 'STOP CLOCK OUT' : 'START CLOCK IN'}
                        </Text>
                    </TouchableOpacity>
                </View>



                {/* ═══ DAILY QUICK TO-DO ═══ */}
                <View style={[styles.todoSection]}>
                    <LinearGradient
                        colors={['#1E3A8A', '#2563EB']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.todoGradient}
                    >
                        <Text style={styles.todoTitle}>Daily Quick To-Do</Text>
                        <Text style={styles.todoSubLabel}>TASK DESCRIPTION</Text>
                        <View style={styles.todoInputRow}>
                            <TextInput
                                style={styles.todoInput}
                                placeholder="e.g. Pick up supplies, call site manager..."
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={todoText}
                                onChangeText={setTodoText}
                                onSubmitEditing={handleAddTodo}
                            />
                            <TouchableOpacity style={styles.todoAddBtn} onPress={handleAddTodo}>
                                <Text style={styles.todoAddBtnText}>ADD MY TODO</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* ═══ MY DAILY TODOS LIST ═══ */}
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleWrap}>
                        <Text style={styles.sectionTitle}>MY DAILY TODOS</Text>
                        <View style={styles.todoBadge}>
                            <Text style={styles.todoBadgeText}>{pendingTodoCount}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => setShowTodoFilter(!showTodoFilter)}>
                        <MaterialCommunityIcons name="filter-variant" size={18} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {showTodoFilter && (
                    <View style={styles.filterRow}>
                        {['all', 'pending', 'completed'].map(f => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.filterChip, todoFilter === f && styles.filterChipActive]}
                                onPress={() => { setTodoFilter(f); setShowTodoFilter(false); }}
                            >
                                <Text style={[styles.filterChipText, todoFilter === f && styles.filterChipTextActive]}>
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={[styles.todosContainer, SHADOWS.small]}>
                    {displayTodos.length === 0 ? (
                        <Text style={styles.emptyText}>No todos yet. Add one above!</Text>
                    ) : displayTodos.map((todo, idx) => (
                        <TouchableOpacity
                            key={todo._id || idx}
                            style={styles.todoRow}
                            onPress={() => toggleTodo(todo._id)}
                        >
                            <View style={[styles.todoCheckbox, todo.status === 'completed' && styles.todoChecked]}>
                                {todo.status === 'completed' && (
                                    <MaterialCommunityIcons name="check" size={12} color="#fff" />
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.todoItemText, todo.status === 'completed' && styles.todoItemDone]}>
                                    {todo.description || todo.title || 'Todo'}
                                </Text>
                                {todo.assignedBy && (
                                    <Text style={styles.todoAssignedBy}>
                                        ASSIGNED BY: {typeof todo.assignedBy === 'object' ? (todo.assignedBy.fullName || 'Admin') : todo.assignedBy}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => deleteTodo(todo._id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <MaterialCommunityIcons name="close" size={16} color="#CBD5E1" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ═══ ASSIGNED TASKS ═══ */}
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleWrap}>
                        <MaterialCommunityIcons name="checkbox-marked-circle" size={18} color="#16A34A" />
                        <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>Assigned Tasks</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Jobs')}>
                        <Text style={styles.viewJobsLink}>VIEW JOBS</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.pendingCountText}>{pendingTasks.length} PENDING TASKS</Text>

                <View style={[styles.tasksContainer, SHADOWS.small]}>
                    {pendingTasks.length === 0 ? (
                        <Text style={styles.emptyText}>No pending tasks assigned.</Text>
                    ) : pendingTasks.slice(0, 5).map((task, idx) => (
                        <View key={task._id || idx} style={styles.taskRow}>
                            <View style={{ flex: 1 }}>
                                <View style={styles.taskTitleRow}>
                                    <Text style={styles.taskTitle} numberOfLines={1}>
                                        {task.title}
                                        {task.jobName ? ` in ${task.jobName}` : ''}
                                    </Text>
                                    {(task.status || '').toLowerCase() === 'todo' && (
                                        <View style={styles.globalBadge}>
                                            <Text style={styles.globalBadgeText}>Global</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.taskSubInfo}>
                                    <MaterialCommunityIcons name="briefcase-outline" size={10} color="#94A3B8" />
                                    {' '}{task.projectName || task.projectId?.name || 'General'}
                                    {'  '}
                                    <MaterialCommunityIcons name="calendar" size={10} color="#94A3B8" />
                                    {' '}{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                </Text>
                            </View>
                            <View style={styles.taskActionsRow}>
                                <View style={[styles.taskPriorityPill, {
                                    backgroundColor: (task.priority || '').toLowerCase() === 'high' ? '#FEF2F2' :
                                        (task.priority || '').toLowerCase() === 'medium' ? '#FFF7ED' : '#F8FAFC',
                                    borderColor: (task.priority || '').toLowerCase() === 'high' ? '#FECACA' :
                                        (task.priority || '').toLowerCase() === 'medium' ? '#FED7AA' : '#E2E8F0'
                                }]}>
                                    <Text style={[styles.taskPriorityText, {
                                        color: (task.priority || '').toLowerCase() === 'high' ? '#DC2626' :
                                            (task.priority || '').toLowerCase() === 'medium' ? '#EA580C' : '#64748B'
                                    }]}>
                                        {(task.priority || 'LOW').toUpperCase()}
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.taskActionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <MaterialCommunityIcons name="close" size={15} color="#94A3B8" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.taskActionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <MaterialCommunityIcons name="delete-outline" size={15} color="#94A3B8" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.taskActionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => navigation.navigate('Jobs')}>
                                    <MaterialCommunityIcons name="open-in-new" size={15} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* ═══ MY RECENT ACTIVITY ═══ */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { fontSize: 14, fontWeight: '800' }]}>My Recent Activity</Text>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={() => navigation.navigate('WorkerLogs')}>
                        <Text style={styles.viewHistoryLink}>VIEW FULL HISTORY</Text>
                        <MaterialCommunityIcons name="arrow-right" size={14} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                <View style={[styles.activityContainer, SHADOWS.small]}>
                    {myRecentActivity.length === 0 ? (
                        <Text style={styles.emptyText}>No recent activity.</Text>
                    ) : myRecentActivity.map((act, idx) => (
                        <View key={act.id || idx} style={styles.activityRow}>
                            <View style={styles.activityIconWrap}>
                                <MaterialCommunityIcons
                                    name={act.action === 'Clocked Out' || act.type === 'clock_out' ? 'clock-remove-outline' : 'clock-check-outline'}
                                    size={18}
                                    color="#64748B"
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.activityTitle}>
                                    {act.action || (act.type === 'clock_out' ? 'Clocked Out' : 'Clocked In')}
                                </Text>
                                <Text style={styles.activityJob}>
                                    {act.job || act.projectId?.name || 'Project Site'}
                                </Text>
                            </View>
                            <View style={styles.activityTimeWrap}>
                                <Text style={styles.activityTime}>{act.time || '---'}</Text>
                                <Text style={styles.activityDate}>
                                    {act.date || (act.createdAt ? new Date(act.createdAt).toLocaleDateString() : '')}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Bottom spacer for tab bar */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ═══ CLOCK-IN SELECTOR MODAL — matches software exactly ═══ */}
            <Modal visible={clockModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, SHADOWS.large]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Work Site</Text>
                            <TouchableOpacity onPress={() => setClockModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                            {!hasAssignments ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="briefcase-off-outline" size={48} color="#E2E8F0" />
                                    <Text style={{ marginTop: 12, color: '#94A3B8', fontWeight: '700' }}>
                                        No assignments available
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    {/* ── MY TASKS section (same as software optgroup) ── */}
                                    {assignedTasks.length > 0 && (
                                        <>
                                            <View style={styles.modalSectionLabel}>
                                                <MaterialCommunityIcons name="clipboard-check-outline" size={14} color="#94A3B8" />
                                                <Text style={styles.modalSectionText}>MY TASKS</Text>
                                            </View>
                                            {assignedTasks.map((t) => {
                                                const prefix = t.type === 'SubTask' ? 'Sub: ' : t.type === 'Task' ? 'Global: ' : 'Task: ';
                                                const displayName = `${prefix}${t.title}`;
                                                const subText = `${t.jobName || 'Job'} / ${t.projectName || 'Project'}`;
                                                return (
                                                    <TouchableOpacity
                                                        key={`task_${t._id}`}
                                                        style={[
                                                            styles.projectItem,
                                                            selectedAssignment?.id === t._id && styles.projectItemSelected
                                                        ]}
                                                        onPress={() => {
                                                            const assignment = {
                                                                type: 'task',
                                                                id: t._id,
                                                                displayName: displayName,
                                                                projectId: t.projectId,
                                                                jobId: t.jobId,
                                                                taskType: t.type || 'JobTask'
                                                            };
                                                            setSelectedAssignment(assignment);
                                                            handleClockToggle(assignment);
                                                        }}
                                                    >
                                                        <View style={[styles.projectDot, { backgroundColor: '#3B82F6' }]} />
                                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                                            <Text style={styles.projectName} numberOfLines={1}>{displayName}</Text>
                                                            <Text style={styles.projectLocation}>{subText}</Text>
                                                        </View>
                                                        <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </>
                                    )}

                                    {/* ── GENERAL SITE ATTENDANCE section ── */}
                                    {assignedProjects.length > 0 && (
                                        <>
                                            <View style={styles.modalSectionLabel}>
                                                <MaterialCommunityIcons name="office-building-outline" size={14} color="#94A3B8" />
                                                <Text style={styles.modalSectionText}>GENERAL SITE ATTENDANCE</Text>
                                            </View>
                                            {assignedProjects.map((p) => {
                                                const displayName = `Project: ${p.name} (${p.jobName || 'Site'})`;
                                                return (
                                                    <TouchableOpacity
                                                        key={`project_${p._id}`}
                                                        style={[
                                                            styles.projectItem,
                                                            selectedAssignment?.id === p._id && styles.projectItemSelected
                                                        ]}
                                                        onPress={() => {
                                                            const assignment = {
                                                                type: 'project',
                                                                _id: p._id,
                                                                id: p._id,
                                                                displayName: `${p.name} (${p.jobName || 'Site'})`,
                                                                jobId: p.jobId
                                                            };
                                                            setSelectedAssignment(assignment);
                                                            handleClockToggle(assignment);
                                                        }}
                                                    >
                                                        <View style={[styles.projectDot, { backgroundColor: '#22C55E' }]} />
                                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                                            <Text style={styles.projectName} numberOfLines={1}>{p.name}</Text>
                                                            <Text style={styles.projectLocation}>{p.jobName || 'General Attendance'}</Text>
                                                        </View>
                                                        <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </>
                                    )}
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 14,
        paddingTop: 4,
    },

    // ── Dashboard Header ──
    dashboardHeader: {
        marginBottom: 12,
    },
    dashTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dashTitle: {
        fontSize: isSmall ? 20 : 22,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    dashSubtitle: {
        fontSize: 9,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.8,
        marginTop: 2,
    },

    // ── Clock Card ──
    clockCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    clockStatusRow: {
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    clockStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 5,
    },
    clockStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    clockStatusText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    timerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    timerText: {
        fontSize: isSmall ? 32 : 38,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1,
        fontVariant: ['tabular-nums'],
    },
    clockIconFloat: {
        opacity: 0.4,
    },
    siteLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 4,
    },
    siteSelector: {
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    siteSelectorText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
    },
    notActiveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    notActiveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    notActiveText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
    },
    clockBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        borderRadius: 12,
    },
    clockBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.5,
    },

    // ── Stat Cards ──
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: isSmall ? 8 : 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'flex-start',
    },
    statIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    statLabel: {
        fontSize: 7,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.4,
        marginBottom: 2,
    },
    statValue: {
        fontSize: isSmall ? 12 : 14,
        fontWeight: '900',
        color: '#0F172A',
    },

    // ── Daily Quick To-Do ──
    todoSection: {
        marginBottom: 14,
        borderRadius: 14,
        overflow: 'hidden',
    },
    todoGradient: {
        padding: 16,
        borderRadius: 14,
    },
    todoTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    todoSubLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 1,
        marginBottom: 6,
    },
    todoInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    todoInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    todoAddBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    todoAddBtnText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },

    // ── Section Headers ──
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    todoBadge: {
        backgroundColor: '#2563EB',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    todoBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    pendingCountText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: -4,
    },
    viewJobsLink: {
        fontSize: 11,
        fontWeight: '900',
        color: '#2563EB',
        letterSpacing: 0.5,
    },
    viewHistoryLink: {
        fontSize: 10,
        fontWeight: '900',
        color: '#2563EB',
        letterSpacing: 0.3,
    },

    // ── Filter ──
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterChipActive: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    filterChipText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },

    // ── Todos List ──
    todosContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    todoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    todoCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    todoChecked: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },
    todoItemText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    todoItemDone: {
        textDecorationLine: 'line-through',
        color: '#94A3B8',
    },
    todoAssignedBy: {
        fontSize: 9,
        fontWeight: '800',
        color: '#2563EB',
        marginTop: 2,
        letterSpacing: 0.3,
    },

    // ── Tasks ──
    tasksContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    taskCheckbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    taskTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    taskTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1E293B',
        flexShrink: 1,
    },
    globalBadge: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    globalBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#2563EB',
    },
    taskSubInfo: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 2,
    },
    taskActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 8,
    },
    taskPriorityPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
    },
    taskPriorityText: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    taskActionBtn: {
        padding: 4,
    },

    // ── Recent Activity ──
    activityContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    activityIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1E293B',
    },
    activityJob: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 1,
    },
    activityTimeWrap: {
        alignItems: 'flex-end',
    },
    activityTime: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0F172A',
    },
    activityDate: {
        fontSize: 9,
        fontWeight: '700',
        color: '#2563EB',
        marginTop: 1,
    },

    // ── Empty State ──
    emptyText: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '600',
        paddingVertical: 20,
    },

    // ── Modal ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    projectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    projectItemSelected: {
        backgroundColor: '#EFF6FF',
        borderRadius: 10,
    },
    projectDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#22C55E',
    },
    projectName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
    },
    projectLocation: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 2,
    },
    modalSectionLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
        marginTop: 8,
    },
    modalSectionText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
});

export default WorkerDashboardScreen;

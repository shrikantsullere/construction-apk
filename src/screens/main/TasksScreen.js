import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Modal, ScrollView, Alert, Animated } from 'react-native';
import { COLORS, SPACING, SIZES, SHADOWS } from '../../theme/theme';
import { useApp } from '../../context/AppContext';
import AppHeader from '../../components/AppHeader';
import TaskCard from '../../components/TaskCard';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TasksScreen = () => {
    const { tasks, addTask, updateTask, deleteTask, projects, user } = useApp();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [form, setForm] = useState({
        title: '',
        project: projects[0]?.name || '',
        dueDate: '',
        assignedTo: '',
        priority: 'Medium',
        status: 'Pending'
    });
    const [loading, setLoading] = useState(false);

    // Animation
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleOpenModal = (task = null) => {
        if (task) {
            setEditingTask(task);
            setForm({
                title: task.title,
                project: task.project,
                dueDate: task.dueDate || '',
                assignedTo: task.assignedTo || '',
                priority: task.priority || 'Medium',
                status: task.status || 'Pending'
            });
        } else {
            setEditingTask(null);
            setForm({
                title: '',
                project: projects[0]?.name || '',
                dueDate: '',
                assignedTo: '',
                priority: 'Medium',
                status: 'Pending'
            });
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.title) {
            Alert.alert('Error', 'Task title is required');
            return;
        }
        setLoading(true);
        let success;
        if (editingTask) {
            success = await updateTask(editingTask._id || editingTask.id, form);
        } else {
            success = await addTask(form);
        }
        setLoading(false);

        if (success) {
            setModalVisible(false);
            Alert.alert('Success', editingTask ? 'Task updated!' : 'Task created!');
        } else {
            Alert.alert('Error', 'Operation failed');
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Delete Task', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    setLoading(true);
                    await deleteTask(id);
                    setLoading(false);
                    setModalVisible(false);
                }
            }
        ]);
    };

    const canManage = user?.role === 'COMPANY_OWNER' || user?.role === 'PM' || user?.role === 'FOREMAN';

    return (
        <View style={styles.container}>
            <AppHeader title="Tasks" />

            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                <FlatList
                    data={tasks}
                    keyExtractor={(item, index) => item._id || item.id || index.toString()}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item, index }) => (
                        <TaskCard
                            task={item}
                            onEdit={canManage ? () => handleOpenModal(item) : null}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="clipboard-check-outline" size={64} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No tasks found.</Text>
                        </View>
                    }
                />
            </Animated.View>

            {canManage && (
                <FAB
                    icon="plus"
                    style={[styles.fab, SHADOWS.medium]}
                    color="#fff"
                    onPress={() => handleOpenModal()}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'New Task'}</Text>
                            {editingTask && (
                                <TouchableOpacity onPress={() => handleDelete(editingTask._id || editingTask.id)}>
                                    <MaterialCommunityIcons name="delete" size={24} color={COLORS.danger} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <CustomInput
                                label="Title"
                                value={form.title}
                                onChangeText={t => setForm({ ...form, title: t })}
                            />

                            <CustomInput
                                label="Assigned To"
                                value={form.assignedTo}
                                onChangeText={t => setForm({ ...form, assignedTo: t })}
                            />

                            <Text style={styles.label}>Status</Text>
                            <View style={styles.row}>
                                {['Pending', 'In Progress', 'Done'].map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.btn, form.status === s && styles.btnActive]}
                                        onPress={() => setForm({ ...form, status: s })}
                                    >
                                        <Text style={[styles.btnText, form.status === s && styles.btnTextActive]}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Priority</Text>
                            <View style={styles.row}>
                                {['Low', 'Medium', 'High'].map(p => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[styles.btn, form.priority === p && styles.btnActive]}
                                        onPress={() => setForm({ ...form, priority: p })}
                                    >
                                        <Text style={[styles.btnText, form.priority === p && styles.btnTextActive]}>{p}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.modalButtons}>
                                <CustomButton title="CANCEL" type="outline" style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
                                <View style={{ width: 12 }} />
                                <CustomButton title="SAVE" style={{ flex: 1 }} onPress={handleSave} loading={loading} />
                            </View>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    listContent: { padding: SPACING.m, paddingBottom: 100 },
    fab: { position: 'absolute', margin: 20, right: 0, bottom: 20, backgroundColor: COLORS.primaryAccent, borderRadius: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary },
    label: { color: COLORS.textMuted, fontSize: 11, fontWeight: '900', marginBottom: 8, marginTop: 12, textTransform: 'uppercase' },
    row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    btn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
    btnActive: { backgroundColor: COLORS.primaryAccent, borderColor: COLORS.primaryAccent },
    btnText: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary },
    btnTextActive: { color: '#fff' },
    modalButtons: { flexDirection: 'row', marginTop: 20 },
    empty: { alignItems: 'center', marginTop: 140 },
    emptyText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '700' }
});

export default TasksScreen;

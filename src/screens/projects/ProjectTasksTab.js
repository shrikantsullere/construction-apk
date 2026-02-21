import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../theme/theme';
import { useApp } from '../../context/AppContext';
import TaskCard from '../../components/TaskCard';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

export const ProjectTasksTab = ({ project }) => {
    const { tasks, addTask, user } = useApp();
    const [modalVisible, setModalVisible] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const projectTasks = tasks.filter(t => t.project === project.name);

    const visibleTasks = user?.role === 'Worker'
        ? projectTasks.filter(t => t.assignedTo === user.name)
        : projectTasks;

    const canAddTask = user?.role === 'Owner' || user?.role === 'Project Manager';

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;
        addTask({ title: newTaskTitle, project: project.name });
        setNewTaskTitle('');
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.count}>{visibleTasks.length} Tasks assigned</Text>
                {canAddTask && (
                    <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                        <MaterialCommunityIcons name="plus" size={20} color={COLORS.black} />
                        <Text style={styles.addButtonText}>Add Task</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={visibleTasks}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => <TaskCard task={item} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No tasks for this project yet.</Text>
                    </View>
                }
            />

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Task for {project.name}</Text>
                        <CustomInput
                            label="Task Title"
                            placeholder="e.g. Install HVAC vents"
                            value={newTaskTitle}
                            onChangeText={setNewTaskTitle}
                        />
                        <View style={styles.modalButtons}>
                            <CustomButton title="Cancel" type="outline" style={styles.flex1} onPress={() => setModalVisible(false)} />
                            <View style={{ width: SPACING.m }} />
                            <CustomButton title="Add Task" style={styles.flex1} onPress={handleAddTask} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
    },
    count: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '700',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    addButtonText: {
        color: COLORS.black,
        fontWeight: '900',
        fontSize: 12,
        marginLeft: 4,
    },
    list: {
        padding: SPACING.m,
    },
    empty: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: COLORS.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: SPACING.l,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.textPrimary,
        marginBottom: SPACING.l,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        marginTop: SPACING.xl,
    },
    flex1: {
        flex: 1,
    },
});

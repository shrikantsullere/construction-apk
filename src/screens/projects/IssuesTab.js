import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import IssueCard from '../../components/IssueCard';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

export const IssuesTab = ({ project }) => {
    const { issues, addIssue, user } = useApp();
    const [modalVisible, setModalVisible] = useState(false);
    const [newIssue, setNewIssue] = useState({ title: '', priority: 'Medium' });

    const projectIssues = issues.filter(i => i.projectId === project.id);

    const handleAddIssue = () => {
        if (!newIssue.title) return;
        addIssue({ ...newIssue, projectId: project.id, date: 'Today' });
        setNewIssue({ title: '', priority: 'Medium' });
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.count}>{projectIssues.length} Active Issues</Text>
                {user?.role !== 'Worker' && (
                    <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                        <MaterialCommunityIcons name="alert-plus" size={20} color={COLORS.black} />
                        <Text style={styles.addButtonText}>Report Issue</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={projectIssues}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => <IssueCard issue={item} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="check-decagram" size={60} color={COLORS.success} />
                        <Text style={styles.emptyText}>Zero critical issues found.</Text>
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
                        <Text style={styles.modalTitle}>Report Site Issue</Text>

                        <CustomInput
                            label="Issue Title"
                            placeholder="e.g. Material shortage in Block 4"
                            value={newIssue.title}
                            onChangeText={(text) => setNewIssue({ ...newIssue, title: text })}
                        />

                        <View style={{ height: SPACING.m }} />

                        <Text style={styles.label}>Severity Level</Text>
                        <View style={styles.priorityGrid}>
                            {['Low', 'Medium', 'High'].map(p => (
                                <TouchableOpacity
                                    key={p}
                                    onPress={() => setNewIssue({ ...newIssue, priority: p })}
                                    style={[styles.priorityBtn, newIssue.priority === p && styles.priorityBtnActive]}
                                >
                                    <Text style={[styles.priorityText, newIssue.priority === p && styles.priorityTextActive]}>{p}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <CustomButton title="Cancel" type="outline" style={styles.flex1} onPress={() => setModalVisible(false)} />
                            <View style={{ width: SPACING.m }} />
                            <CustomButton title="Flag Issue" style={styles.flex1} onPress={handleAddIssue} />
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
        marginTop: 80,
        opacity: 0.8,
    },
    emptyText: {
        color: COLORS.success,
        marginTop: 12,
        fontSize: 16,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: SPACING.l,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: COLORS.textPrimary,
        marginBottom: SPACING.l,
        textAlign: 'center',
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    priorityGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xl,
    },
    priorityBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    priorityBtnActive: {
        backgroundColor: COLORS.primary + '20',
        borderColor: COLORS.primary,
    },
    priorityText: {
        color: COLORS.textSecondary,
        fontWeight: '700',
    },
    priorityTextActive: {
        color: COLORS.primary,
    },
    modalButtons: {
        flexDirection: 'row',
    },
    flex1: {
        flex: 1,
    },
});

import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Modal, Text, ScrollView, TextInput, Alert } from 'react-native';
import { FAB } from 'react-native-paper';
import { COLORS, SPACING, SIZES, SHADOWS } from '../../theme/theme';
import { useApp } from '../../context/AppContext';
import AppHeader from '../../components/AppHeader';
import ProjectCard from '../../components/ProjectCard';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

const ProjectsScreen = ({ navigation }) => {
    const { projects, addProject, updateProject, deleteProject, user } = useApp();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [form, setForm] = useState({
        name: '',
        client: '',
        location: '',
        budget: '',
        manager: '',
        type: 'Commercial',
        status: 'Active'
    });
    const [loading, setLoading] = useState(false);

    const isAdmin = user?.role === 'COMPANY_OWNER' || user?.role === 'PM';

    const handleOpenModal = (project = null) => {
        if (project) {
            setEditingProject(project);
            setForm({
                name: project.name,
                client: project.client,
                location: project.location || '',
                budget: project.budget || '',
                manager: project.manager || '',
                type: project.type || 'Commercial',
                status: project.status || 'Active'
            });
        } else {
            setEditingProject(null);
            setForm({
                name: '',
                client: '',
                location: '',
                budget: '',
                manager: '',
                type: 'Commercial',
                status: 'Active'
            });
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.client) {
            Alert.alert('Error', 'Project Name and Client are required');
            return;
        }
        setLoading(true);
        let success;
        if (editingProject) {
            success = await updateProject(editingProject._id, form);
        } else {
            success = await addProject(form);
        }
        setLoading(false);

        if (success) {
            setModalVisible(false);
            Alert.alert('Success', editingProject ? 'Project updated!' : 'Project created!');
        } else {
            Alert.alert('Error', 'Action failed');
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Project',
            'This action is permanent. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        setLoading(true);
                        await deleteProject(id);
                        setLoading(false);
                        setModalVisible(false);
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <AppHeader title="Projects" showBack />

            <FlatList
                data={projects}
                keyExtractor={(item, index) => item._id || index.toString()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <ProjectCard
                        project={item}
                        index={index}
                        onEdit={isAdmin ? () => handleOpenModal(item) : null}
                        onPress={() => navigation.navigate('ProjectDetails', { project: item })}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>No projects found.</Text>
                    </View>
                }
            />

            {isAdmin && (
                <FAB
                    icon="plus"
                    style={styles.fab}
                    color={COLORS.white}
                    onPress={() => handleOpenModal()}
                />
            )}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIndicator} />
                            <View style={styles.titleRow}>
                                <Text style={styles.modalTitle}>{editingProject ? 'Edit Project' : 'New Project'}</Text>
                                {editingProject && (
                                    <TouchableOpacity onPress={() => handleDelete(editingProject._id)}>
                                        <Text style={{ color: COLORS.danger, fontWeight: '800' }}>DELETE</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            <CustomInput
                                label="Project Name"
                                placeholder="e.g. Skyline Residence"
                                value={form.name}
                                onChangeText={(text) => setForm({ ...form, name: text })}
                            />

                            <CustomInput
                                label="Client Name"
                                placeholder="e.g. Apex Realty Group"
                                value={form.client}
                                onChangeText={(text) => setForm({ ...form, client: text })}
                            />

                            <CustomInput
                                label="Site Location"
                                placeholder="e.g. 123 Construction Way"
                                value={form.location}
                                onChangeText={(text) => setForm({ ...form, location: text })}
                            />

                            <CustomInput
                                label="Project Budget"
                                placeholder="e.g. $2.5M"
                                value={form.budget}
                                onChangeText={(text) => setForm({ ...form, budget: text })}
                            />

                            <CustomInput
                                label="Project Manager"
                                value={form.manager}
                                onChangeText={(text) => setForm({ ...form, manager: text })}
                            />

                            <View style={styles.modalButtons}>
                                <CustomButton
                                    title="CANCEL"
                                    type="outline"
                                    style={styles.flex1}
                                    onPress={() => setModalVisible(false)}
                                />
                                <View style={{ width: SPACING.m }} />
                                <CustomButton
                                    title={editingProject ? "SAVE" : "CREATE"}
                                    style={styles.flex1}
                                    onPress={handleSave}
                                    loading={loading}
                                />
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
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 20, backgroundColor: COLORS.primary, borderRadius: 30 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: SPACING.l, maxHeight: '90%' },
    modalHeader: { alignItems: 'center', marginBottom: SPACING.l },
    modalIndicator: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginBottom: 16 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 10 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary },
    modalScroll: { paddingTop: SPACING.m },
    modalButtons: { flexDirection: 'row', marginTop: SPACING.l },
    flex1: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '700' },
});

export default ProjectsScreen;

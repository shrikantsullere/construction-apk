import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, SHADOWS } from '../../theme/theme';
import { useApp } from '../../context/AppContext';
import AppHeader from '../../components/AppHeader';
import { LinearGradient } from 'expo-linear-gradient';

const TeamManagementScreen = ({ navigation }) => {
    const { teamMembers, fetchTeamMembers, inviteMember, updateTeamMember, deleteTeamMember, user } = useApp();
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        role: 'WORKER',
        status: 'Active',
        password: ''
    });

    useEffect(() => {
        setLoading(true);
        fetchTeamMembers().finally(() => setLoading(false));
    }, []);

    const handleOpenModal = (member = null) => {
        if (member) {
            setEditingMember(member);
            setFormData({
                fullName: member.fullName || member.name,
                email: member.email,
                phone: member.phone || '',
                role: member.role,
                status: member.status || 'Active',
                password: ''
            });
        } else {
            setEditingMember(null);
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                role: 'WORKER',
                status: 'Active',
                password: ''
            });
        }
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        if (!formData.fullName || !formData.email || (!editingMember && !formData.password)) {
            Alert.alert('Error', 'Full Name, Email and Password (for new users) are required.');
            return;
        }

        setLoading(true);
        let res;
        if (editingMember) {
            res = await updateTeamMember(editingMember._id, formData);
        } else {
            res = await inviteMember(formData);
        }
        setLoading(false);

        if (res.success) {
            Alert.alert('Success', editingMember ? 'Member updated!' : 'Member invited!');
            setModalVisible(false);
        } else {
            Alert.alert('Error', res.message);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to remove this member?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        setLoading(true);
                        const res = await deleteTeamMember(id);
                        setLoading(false);
                        if (!res.success) Alert.alert('Error', res.message);
                    }
                }
            ]
        );
    };

    const renderMember = ({ item }) => (
        <TouchableOpacity
            style={[styles.memberCard, SHADOWS.small]}
            onPress={() => handleOpenModal(item)}
            activeOpacity={0.7}
        >
            <View style={styles.memberLeft}>
                <View style={[styles.avatar, { backgroundColor: COLORS.primary + '15' }]}>
                    <Text style={styles.avatarText}>{(item.fullName || item.name || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.fullName || item.name}</Text>
                    <Text style={styles.memberRole}>{item.role.replace('_', ' ')}</Text>
                </View>
            </View>
            <View style={styles.memberRight}>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'Active' ? COLORS.success + '15' : '#CBD5E1' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'Active' ? COLORS.success : '#64748B' }]}>
                        {item.status || 'Offline'}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <AppHeader title="Team Management" showBack />

            {loading && !modalVisible ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={teamMembers.filter(m => m.role !== 'COMPANY_OWNER' && m._id !== user?._id)}
                    keyExtractor={item => item._id}
                    renderItem={renderMember}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="account-group-outline" size={48} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No team members found.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={[styles.fab, SHADOWS.medium]} onPress={() => handleOpenModal()}>
                <MaterialCommunityIcons name="plus" size={28} color="#fff" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingMember ? 'Edit Member' : 'Add New Member'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.fullName}
                                onChangeText={t => setFormData({ ...formData, fullName: t })}
                                placeholder="e.g. John Doe"
                            />

                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.email}
                                onChangeText={t => setFormData({ ...formData, email: t })}
                                keyboardType="email-address"
                                placeholder="john@kaalerp.com"
                            />

                            {!editingMember && (
                                <>
                                    <Text style={styles.label}>Temporary Password</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.password}
                                        onChangeText={t => setFormData({ ...formData, password: t })}
                                        secureTextEntry
                                        placeholder="Min 6 characters"
                                    />
                                </>
                            )}

                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.phone}
                                onChangeText={t => setFormData({ ...formData, phone: t })}
                                keyboardType="phone-pad"
                                placeholder="+91..."
                            />

                            <Text style={styles.label}>Role</Text>
                            <View style={styles.roleGrid}>
                                {['PM', 'FOREMAN', 'WORKER', 'CLIENT'].map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.roleOption, formData.role === r && styles.roleSelected]}
                                        onPress={() => setFormData({ ...formData, role: r })}
                                    >
                                        <Text style={[styles.roleOptionText, formData.role === r && styles.roleSelectedText]}>{r}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, SHADOWS.small]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : (
                                    <Text style={styles.submitBtnText}>{editingMember ? 'SAVE CHANGES' : 'SEND INVITATION'}</Text>
                                )}
                            </TouchableOpacity>
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
    list: { padding: SPACING.m, paddingBottom: 100 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    memberLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
    memberInfo: { marginLeft: 12 },
    memberName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
    memberRole: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted, textTransform: 'uppercase', marginTop: 2 },
    memberRight: { flexDirection: 'row', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 12 },
    statusText: { fontSize: 10, fontWeight: '900' },
    deleteBtn: { padding: 8 },
    fab: {
        position: 'absolute', bottom: 30, right: 20,
        backgroundColor: COLORS.primary, width: 60, height: 60,
        borderRadius: 30, justifyContent: 'center', alignItems: 'center'
    },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: COLORS.textMuted, marginTop: 12, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary },
    label: { fontSize: 12, fontWeight: '900', color: COLORS.textMuted, marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
    input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, fontSize: 16, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
    roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
    roleOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    roleSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    roleOptionText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
    roleSelectedText: { color: '#fff' },
    submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 30 },
    submitBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 }
});

export default TeamManagementScreen;

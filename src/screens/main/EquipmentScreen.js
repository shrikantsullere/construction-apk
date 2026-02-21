import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, SHADOWS } from '../../theme/theme';
import AppHeader from '../../components/AppHeader';
import { useApp } from '../../context/AppContext';
import api from '../../utils/api';

const EquipmentScreen = () => {
    const { user, updateEquipment, deleteEquipment } = useApp();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState({
        name: '',
        status: 'Idle',
        site: '',
        fuel: ''
    });

    const canManage = user?.role === 'COMPANY_OWNER' || user?.role === 'PM';

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/equipment');
            setData(res.data);
        } catch (e) {
            setData([
                { id: '1', _id: '1', name: 'Excavator CAT 320', status: 'In Use', site: 'Skyline Residence', fuel: '78%' },
                { id: '2', _id: '2', name: 'Concrete Mixer Truck', status: 'Idle', site: 'Main Storage', fuel: '45%' },
                { id: '3', _id: '3', name: 'Mobile Crane LTM 1050', status: 'Maintenance', site: 'Hangar A', fuel: '10%' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setForm({
                name: item.name,
                status: item.status || 'Idle',
                site: item.site || '',
                fuel: item.fuel || ''
            });
        } else {
            setEditingItem(null);
            setForm({ name: '', status: 'Idle', site: '', fuel: '' });
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.name) return;
        setLoading(true);
        const success = await updateEquipment(editingItem?._id || editingItem?.id, form);
        if (success) {
            setModalVisible(false);
            fetchData();
            Alert.alert('Success', 'Equipment updated!');
        } else {
            Alert.alert('Error', 'Update failed');
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Remove Equipment', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    const success = await deleteEquipment(id);
                    if (success) fetchData();
                }
            }
        ]);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'in use': return COLORS.success;
            case 'idle': return COLORS.primaryAccent;
            case 'maintenance': return COLORS.danger;
            default: return COLORS.textSecondary;
        }
    };

    return (
        <View style={styles.container}>
            <AppHeader title="Fleet Management" rightIcon="refresh" onRightPress={fetchData} />

            {loading && !modalVisible ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primaryAccent} />
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item, index) => item._id || item.id || index.toString()}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.card, SHADOWS.small]}
                            onPress={() => canManage && handleOpenModal(item)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.iconBox}>
                                    <MaterialCommunityIcons
                                        name={item.name.toLowerCase().includes('crane') ? 'crane' : 'truck-cargo-container'}
                                        size={24} color={COLORS.primaryAccent}
                                    />
                                </View>
                                <View style={styles.headerText}>
                                    <Text style={styles.title}>{item.name}</Text>
                                    <View style={styles.siteRow}>
                                        <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.textMuted} />
                                        <Text style={styles.siteText}>{item.site || 'Unassigned'}</Text>
                                    </View>
                                </View>
                                {canManage && (
                                    <TouchableOpacity onPress={() => handleDelete(item._id || item.id)}>
                                        <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.danger} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.cardFooter}>
                                <View style={styles.statusPill}>
                                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                                </View>
                                <View style={styles.fuelRow}>
                                    <MaterialCommunityIcons name="gas-station-outline" size={14} color={COLORS.textMuted} />
                                    <Text style={styles.fuelText}>{item.fuel || 'N/A'}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Equipment</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text style={styles.label}>Name</Text>
                            <TextInput style={styles.input} value={form.name} onChangeText={t => setForm({ ...form, name: t })} />

                            <Text style={styles.label}>Assigned Site</Text>
                            <TextInput style={styles.input} value={form.site} onChangeText={t => setForm({ ...form, site: t })} />

                            <Text style={styles.label}>Operational Status</Text>
                            <View style={styles.row}>
                                {['In Use', 'Idle', 'Maintenance'].map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.btn, form.status === s && styles.btnActive]}
                                        onPress={() => setForm({ ...form, status: s })}
                                    >
                                        <Text style={[styles.btnText, form.status === s && styles.btnTextActive]}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Fuel Level (%)</Text>
                            <TextInput style={styles.input} value={form.fuel} onChangeText={t => setForm({ ...form, fuel: t })} keyboardType="numeric" />

                            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={loading}>
                                <Text style={styles.submitBtnText}>SAVE CHANGES</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: SPACING.m, paddingBottom: 40 },
    card: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, marginBottom: 16, padding: SPACING.m, borderWidth: 1, borderColor: COLORS.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.primaryAccent + '15', justifyContent: 'center', alignItems: 'center' },
    headerText: { marginLeft: 14, flex: 1 },
    title: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary },
    siteRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    siteText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    fuelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    fuelText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
    label: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    row: { flexDirection: 'row', gap: 8 },
    btn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
    btnActive: { backgroundColor: COLORS.primaryAccent, borderColor: COLORS.primaryAccent },
    btnText: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary },
    btnTextActive: { color: '#fff' },
    submitBtn: { backgroundColor: COLORS.primaryAccent, padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 30, marginBottom: 20 },
    submitBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 }
});

export default EquipmentScreen;

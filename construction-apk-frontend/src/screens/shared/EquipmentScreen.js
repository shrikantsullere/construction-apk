import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, ScrollView, Dimensions, StatusBar, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import { useApp } from '../../context/AppContext';
import api from '../../utils/api';

const { width } = Dimensions.get('window');

const EquipmentScreen = ({ navigation }) => {
    const { user } = useApp();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    
    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '',
        category: 'Heavy Equipment',
        type: '',
        serialNumber: '',
        status: 'idle',
        location: 'Warehouse',
        costPerHour: '0'
    });

    const canManage = user?.role === 'COMPANY_OWNER' || user?.role === 'PM';

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/equipment');
            setData(res.data || []);
        } catch (e) {
            console.error('Fetch equipment error:', e);
            Alert.alert('Error', 'Failed to load fleet data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const stats = useMemo(() => {
        return {
            heavy: data.filter(e => e.category === 'Heavy Equipment').length,
            tools: data.filter(e => e.category === 'Small Tools').length,
            assigned: data.filter(e => e.assignedJob !== null).length,
            alerts: data.filter(e => e.status === 'maintenance').length
        };
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                item.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                item.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [data, searchQuery, selectedCategory, selectedStatus]);

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setForm({
                name: item.name,
                category: item.category || 'Heavy Equipment',
                type: item.type || '',
                serialNumber: item.serialNumber || '',
                status: item.status || 'idle',
                location: item.location || 'Warehouse',
                costPerHour: (item.costPerHour || 0).toString()
            });
        } else {
            setEditingItem(null);
            setForm({
                name: '',
                category: 'Heavy Equipment',
                type: '',
                serialNumber: '',
                status: 'idle',
                location: 'Warehouse',
                costPerHour: '0'
            });
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.category) {
            Alert.alert('Required', 'Please fill in Name and Category');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...form,
                costPerHour: parseFloat(form.costPerHour) || 0
            };

            if (editingItem) {
                await api.patch(`/equipment/${editingItem._id || editingItem.id}`, payload);
            } else {
                await api.post('/equipment', payload);
            }
            
            setModalVisible(false);
            fetchData();
            Alert.alert('Success', `Asset ${editingItem ? 'updated' : 'added'} successfully`);
        } catch (e) {
            Alert.alert('Error', 'Failed to save asset details');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Decommission Asset', 'Are you sure you want to remove this equipment from fleet? This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Decommission', style: 'destructive', onPress: async () => {
                    try {
                        await api.delete(`/equipment/${id}`);
                        fetchData();
                    } catch (e) {
                        Alert.alert('Error', 'Deletion failed');
                    }
                }
            }
        ]);
    };

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'operational': 
            case 'active':
                return { bg: '#F0FDF4', text: '#10B981', dot: '#10B981', label: 'In Use' };
            case 'maintenance': 
            case 'out_of_service':
                return { bg: '#FEF2F2', text: '#EF4444', dot: '#EF4444', label: 'Maintenance' };
            case 'idle': 
                return { bg: '#F8FAFC', text: '#64748B', dot: '#64748B', label: 'Idle' };
            default: 
                return { bg: '#F1F5F9', text: '#94A3B8', dot: '#94A3B8', label: status || 'Unknown' };
        }
    };

    const StatCard = ({ label, value, sub, icon, color, bg }) => (
        <View style={[styles.statCard, SHADOWS.small]}>
            <View style={[styles.statIcon, { backgroundColor: bg }]}>
                <MaterialCommunityIcons name={icon} size={20} color={color} />
            </View>
            <View style={styles.statContent}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
                {sub && <Text style={styles.statSub}>{sub}</Text>}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="Inventory & Fleet" showBranding={true} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Header Branding */}
                <View style={styles.pageHeader}>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.mainTitle}>Inventory & Fleet</Text>
                        <Text style={styles.mainSubtitle}>Equipment tracking</Text>
                    </View>
                    {canManage && (
                        <TouchableOpacity style={styles.addBtn} onPress={() => handleOpenModal()}>
                            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                            <Text style={styles.addBtnText}>Add Item</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard label="Heavy Assets" value={stats.heavy} sub="Large units" icon="crane" color="#2563EB" bg="#EFF6FF" />
                    <StatCard label="Small Tools" value={stats.tools} sub="Power & Hand tools" icon="toolbox-outline" color="#F97316" bg="#FFF7ED" />
                    <StatCard label="Assigned" value={stats.assigned} sub="Currently on site" icon="account-hard-hat" color="#10B981" bg="#F0FDF4" />
                    <StatCard label="Alerts" value={stats.alerts} sub="Pending Return" icon="alert-circle-outline" color="#EF4444" bg="#FEF2F2" />
                </View>

                {/* Filters Section */}
                <View style={styles.filterSection}>
                    <View style={styles.searchBar}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                        <TextInput 
                            placeholder="Search by name, type, or serial..."
                            placeholderTextColor="#94A3B8"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                        {['All', 'Heavy Equipment', 'Small Tools'].map(cat => (
                            <TouchableOpacity 
                                key={cat} 
                                style={[styles.catBtn, selectedCategory === cat && styles.catBtnActive]}
                                onPress={() => setSelectedCategory(cat)}
                            >
                                <Text style={[styles.catBtnText, selectedCategory === cat && styles.catBtnTextActive]}>
                                    {cat === 'All' ? 'All Assets' : cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Asset List */}
                <View style={styles.listContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 40 }} />
                    ) : filteredData.length === 0 ? (
                        <View style={styles.emptyView}>
                            <MaterialCommunityIcons name="truck-outline" size={64} color="#E2E8F0" />
                            <Text style={styles.emptyText}>No equipment found matching criteria</Text>
                        </View>
                    ) : (
                        filteredData.map((item, index) => {
                            const st = getStatusStyles(item.status);
                            return (
                                <TouchableOpacity 
                                    key={item._id || index} 
                                    style={[styles.assetCard, SHADOWS.small]}
                                    onPress={() => canManage && handleOpenModal(item)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.assetHeader}>
                                        <View style={styles.assetMain}>
                                            <Text style={styles.assetName}>{item.name}</Text>
                                            <View style={styles.assetTypeRow}>
                                                <Text style={styles.assetType}>{item.type || 'Standard Unit'}</Text>
                                                <Text style={styles.assetDivider}>•</Text>
                                                <Text style={styles.assetId}>#{item.serialNumber || 'SN-NA'}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                                            <View style={[styles.statusDot, { backgroundColor: st.dot }]} />
                                            <Text style={[styles.statusLabel, { color: st.text }]}>{st.label}</Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.assetDividerLine} />
                                    
                                    <View style={styles.assetInfoGrid}>
                                        <View style={styles.infoBox}>
                                            <Text style={styles.infoLabel}>LOCATION</Text>
                                            <Text style={styles.infoValue} numberOfLines={1}>{item.location || 'Warehouse'}</Text>
                                        </View>
                                        <View style={styles.infoBox}>
                                            <Text style={styles.infoLabel}>ASSIGNED JOB</Text>
                                            <Text style={[styles.infoValue, item.assignedJob ? { color: '#2563EB' } : { color: '#94A3B8' }]} numberOfLines={1}>
                                                {item.assignedJob?.name || 'Idle / Not Set'}
                                            </Text>
                                        </View>
                                        <View style={styles.infoBox}>
                                            <Text style={styles.infoLabel}>HOURLY RATE</Text>
                                            <Text style={styles.infoValue}>${item.costPerHour || 0}/h</Text>
                                        </View>
                                    </View>

                                    {canManage && (
                                        <TouchableOpacity 
                                            style={styles.deleteAction} 
                                            onPress={() => handleDelete(item._id)}
                                        >
                                            <MaterialCommunityIcons name="delete-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* NEW/EDIT MODAL */}
            <Modal visible={modalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, SHADOWS.large]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingItem ? 'Edit Equipment' : 'Add New Item'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                            <Text style={styles.inputLabel}>Asset Name</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="e.g. Caterpillar D9" 
                                value={form.name} 
                                onChangeText={t => setForm({...form, name: t})} 
                            />

                            <View style={styles.inputRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Category</Text>
                                    <View style={styles.selectorRow}>
                                        {['Heavy Equipment', 'Small Tools'].map(c => (
                                            <TouchableOpacity 
                                                key={c} 
                                                style={[styles.miniBtn, form.category === c && styles.miniBtnActive]}
                                                onPress={() => setForm({...form, category: c})}
                                            >
                                                <Text style={[styles.miniBtnText, form.category === c && styles.miniBtnTextActive]}>{c.split(' ')[0]}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.inputLabel}>Hourly Rate ($)</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        placeholder="0" 
                                        keyboardType="numeric" 
                                        value={form.costPerHour} 
                                        onChangeText={t => setForm({...form, costPerHour: t})} 
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Asset Type / Model</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="e.g. Hydraulic Excavator" 
                                value={form.type} 
                                onChangeText={t => setForm({...form, type: t})} 
                            />

                            <Text style={styles.inputLabel}>Serial Number / Tag ID</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="#SN-XXXXX" 
                                value={form.serialNumber} 
                                onChangeText={t => setForm({...form, serialNumber: t})} 
                            />

                            <Text style={styles.inputLabel}>Current Location</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="e.g. Warehouse A" 
                                value={form.location} 
                                onChangeText={t => setForm({...form, location: t})} 
                            />

                            <Text style={styles.inputLabel}>Asset Status</Text>
                            <View style={styles.selectorRow}>
                                {['operational', 'idle', 'maintenance'].map(s => (
                                    <TouchableOpacity 
                                        key={s} 
                                        style={[styles.miniBtn, form.status === s && styles.miniBtnActive]}
                                        onPress={() => setForm({...form, status: s})}
                                    >
                                        <Text style={[styles.miniBtnText, form.status === s && styles.miniBtnTextActive]}>{s.toUpperCase()}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity 
                                style={[styles.saveBtn, submitting && { opacity: 0.7 }]} 
                                onPress={handleSave}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator color="#fff" /> : (
                                    <Text style={styles.saveBtnText}>SAVE ASSET DETAILS</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scroll: { paddingTop: 20 },
    pageHeader: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 4 },
    headerTextContainer: { flex: 1, marginRight: 12 },
    mainTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
    mainSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '800', marginTop: 4 },
    addBtn: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
    addBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 32 },
    statCard: { width: (width - 52) / 2, backgroundColor: '#fff', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statContent: {},
    statValue: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
    statLabel: { fontSize: 13, fontWeight: '900', color: '#1E293B', marginTop: 2 },
    statSub: { fontSize: 10, color: '#94A3B8', fontWeight: '800', marginTop: 2 },

    filterSection: { paddingHorizontal: 20, marginBottom: 24 },
    searchBar: { height: 52, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '800', color: '#1E293B' },
    categoryRow: { gap: 10 },
    catBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    catBtnActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
    catBtnText: { fontSize: 12, fontWeight: '900', color: '#64748B' },
    catBtnTextActive: { color: '#fff' },

    listContainer: { paddingHorizontal: 20 },
    assetCard: { backgroundColor: '#fff', borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', position: 'relative' },
    assetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    assetMain: { flex: 1 },
    assetName: { fontSize: 17, fontWeight: '900', color: '#0F172A' },
    assetTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    assetType: { fontSize: 11, fontWeight: '900', color: '#2563EB', textTransform: 'uppercase' },
    assetDivider: { color: '#CBD5E1' },
    assetId: { fontSize: 11, fontWeight: '800', color: '#94A3B8' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    assetDividerLine: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
    assetInfoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    infoBox: { flex: 1 },
    infoLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 },
    infoValue: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
    deleteAction: { position: 'absolute', top: 20, right: 10 },
    
    emptyView: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 14, fontWeight: '800', color: '#94A3B8', marginTop: 16, textAlign: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', padding: 20 },
    modalCard: { backgroundColor: '#fff', borderRadius: 36, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    modalScroll: { paddingBottom: 20 },
    inputLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 16 },
    input: { height: 50, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, fontSize: 15, fontWeight: '800', color: '#1E293B' },
    inputRow: { flexDirection: 'row' },
    selectorRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    miniBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    miniBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    miniBtnText: { fontSize: 11, fontWeight: '900', color: '#64748B' },
    miniBtnTextActive: { color: '#fff' },
    saveBtn: { height: 60, backgroundColor: '#2563EB', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 32, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 }
});

export default EquipmentScreen;

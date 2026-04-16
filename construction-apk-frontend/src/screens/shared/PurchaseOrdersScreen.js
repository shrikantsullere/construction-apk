import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    TextInput,
    SafeAreaView,
    StatusBar,
    Modal,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, SIZES } from '../../constants/theme';
import api from '../../utils/api';
import { useApp } from '../../context/AppContext';
import WorkerHeader from '../../components/WorkerHeader';

const { width } = Dimensions.get('window');

const PurchaseOrdersScreen = ({ navigation }) => {
    const { projects } = useApp();
    const [pos, setPos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Create PO State
    const [createVisible, setCreateVisible] = useState(false);
    const [formProject, setFormProject] = useState(null);
    const [formVendor, setFormVendor] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [items, setItems] = useState([{ id: Date.now(), itemName: '', description: '', quantity: '1', unitPrice: '0' }]);
    const [submitting, setSubmitting] = useState(false);
    const [selProjectVisible, setSelProjectVisible] = useState(false);

    const fetchPOs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/purchase-orders');
            setPos(res.data || []);
        } catch (e) {
            console.error('Fetch PO error:', e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPOs();
    }, []);

    // Summary Calculations
    const poSummary = useMemo(() => {
        const subtotal = items.reduce((acc, it) => acc + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0);
        const tax = subtotal * 0.15;
        const total = subtotal + tax;
        return { subtotal, tax, total };
    }, [items]);

    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), itemName: '', description: '', quantity: '1', unitPrice: '0' }]);
    };

    const handleUpdateItem = (id, field, val) => {
        setItems(items.map(it => it.id === id ? { ...it, [field]: val } : it));
    };

    const handleRemoveItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(it => it.id !== id));
        }
    };

    const handleCreatePO = async () => {
        if (!formProject || !formVendor || !formEmail || items.some(it => !it.itemName)) {
            Alert.alert('Required Fields', 'Please fill in Project, Vendor details and at least one item name.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                projectId: formProject._id || formProject.id,
                vendorName: formVendor,
                vendorEmail: formEmail,
                items: items.map(it => ({
                    itemName: it.itemName,
                    description: it.description,
                    quantity: parseInt(it.quantity) || 0,
                    unitPrice: parseFloat(it.unitPrice) || 0
                })),
                notes: formNotes,
                poNumber: `PO-${Math.floor(100000 + Math.random() * 900000)}`,
                status: 'Pending Approval',
                expectedDeliveryDate: new Date()
            };

            await api.post('/purchase-orders', payload);
            setCreateVisible(false);
            resetForm();
            fetchPOs();
            Alert.alert('Success', 'Purchase Order requisition submitted successfully.');
        } catch (e) {
            Alert.alert('Submission Error', e.response?.data?.message || 'Failed to submit PO');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormProject(null);
        setFormVendor('');
        setFormEmail('');
        setFormNotes('');
        setItems([{ id: Date.now(), itemName: '', description: '', quantity: '1', unitPrice: '0' }]);
    };

    const filteredPOs = pos.filter(po => 
        (po.poNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (po.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        activeVolume: pos.length,
        pendingApproval: pos.filter(p => p.status === 'Pending Approval' || p.status === 'Pending').reduce((acc, p) => acc + (p.totalAmount || 0), 0),
        committedBudget: pos.filter(p => p.status === 'Approved').reduce((acc, p) => acc + (p.totalAmount || 0), 0)
    };

    const renderPOItem = ({ item }) => {
        const isApproved = item.status === 'Approved';
        const statusColor = isApproved ? '#2563EB' : '#EA580C';
        const statusBg = isApproved ? '#EFF6FF' : '#FFF7ED';

        return (
            <TouchableOpacity style={[styles.poCard, SHADOWS.medium]} activeOpacity={0.9}>
                {/* Status Accent Bar */}
                <View style={[styles.statusAccent, { backgroundColor: statusColor }]} />
                
                <View style={styles.poCardInfo}>
                    <View style={styles.poCardTop}>
                        <View style={styles.poNumWrap}>
                            <View style={[styles.hashBox, { backgroundColor: statusBg }]}>
                                <MaterialCommunityIcons name="pound" size={14} color={statusColor} />
                            </View>
                            <View>
                                <Text style={styles.poNumberTxt}>{item.poNumber || 'PO-000000'}</Text>
                                <Text style={styles.poProjectTxt} numberOfLines={1}>{item.projectId?.name || 'GEN SITE'}</Text>
                                <Text style={styles.poProjectSub}>CONSTRUCTION SITE</Text>
                            </View>
                        </View>
                        <View style={styles.vendorWrap}>
                            <View style={[styles.vendorAvatar, { backgroundColor: '#F8FAFC', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' }]}>
                                <Text style={styles.vendorAvatarTxt}>{item.vendorName?.charAt(0) || 'V'}</Text>
                            </View>
                            <Text style={styles.vendorNameTxt}>{item.vendorName || 'Unknown'}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.poCardBottom}>
                        <View style={styles.poAmountWrap}>
                            <Text style={styles.poAmountLabel}>TOTAL REQUISITION</Text>
                            <Text style={[styles.poAmountVal, { color: statusColor }]}>${item.totalAmount?.toLocaleString() || '0'}</Text>
                        </View>
                        <View style={styles.poStatusWrap}>
                            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                <Text style={[styles.statusText, { color: statusColor }]}>
                                    {item.status?.toUpperCase() || 'PENDING'}
                                </Text>
                            </View>
                            <Text style={styles.poDateTxt}>{new Date(item.createdAt || Date.now()).toLocaleDateString()}</Text>
                        </View>
                        <TouchableOpacity style={styles.detailsBtn}>
                            <MaterialCommunityIcons name="chevron-right-circle-outline" size={24} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="Purchase Orders" showBranding={true} />
            
            <View style={styles.pageHeader}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.mainTitle}>Purchase Orders</Text>
                    <Text style={styles.mainSubtitle}>Procurement Management</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setCreateVisible(true)}>
                    <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Raise PO</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsSection}>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                            <MaterialCommunityIcons name="file-document-multiple-outline" size={20} color="#2563EB" />
                        </View>
                        <View>
                            <Text style={styles.statLabel}>ACTIVE VOLUME</Text>
                            <Text style={styles.statValue}>{stats.activeVolume}</Text>
                            <Text style={styles.statDesc}>TOTAL SYSTEM POS</Text>
                        </View>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
                            <MaterialCommunityIcons name="clock-fast" size={20} color="#EA580C" />
                        </View>
                        <View>
                            <Text style={styles.statLabel}>AWAITING</Text>
                            <Text style={styles.statValue}>${stats.pendingApproval.toLocaleString()}</Text>
                            <Text style={styles.statDesc}>PENDING SPEND</Text>
                        </View>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
                            <MaterialCommunityIcons name="shield-check-outline" size={20} color="#10B981" />
                        </View>
                        <View>
                            <Text style={styles.statLabel}>BUDGET</Text>
                            <Text style={styles.statValue}>${stats.committedBudget.toLocaleString()}</Text>
                            <Text style={styles.statDesc}>APPROVED COSTS</Text>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.filterSection}>
                    <View style={styles.searchBox}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                        <TextInput 
                            placeholder="Search PO #, Vendor..."
                            placeholderTextColor="#94A3B8"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolsRow}>
                        <TouchableOpacity style={styles.toolBtn}>
                            <Text style={styles.toolBtnTxt}>ALL PROJECTS</Text>
                            <MaterialCommunityIcons name="chevron-down" size={16} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolBtn}>
                            <Text style={styles.toolBtnTxt}>ALL STATUS</Text>
                            <MaterialCommunityIcons name="chevron-down" size={16} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolBtnIcon}>
                            <MaterialCommunityIcons name="filter-variant" size={18} color="#64748B" />
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={filteredPOs}
                    keyExtractor={p => p._id || p.id}
                    renderItem={renderPOItem}
                    contentContainerStyle={styles.listArea}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FULL SCREEN CREATE PO MODAL */}
            <Modal visible={createVisible} animationType="slide" transparent={false}>
                <SafeAreaView style={styles.createMain}>
                    <View style={styles.createHeader}>
                        <TouchableOpacity onPress={() => setCreateVisible(false)} style={styles.backBtnModal}>
                            <MaterialCommunityIcons name="chevron-left" size={30} color="#0F172A" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.createTitle}>Create Purchase Order</Text>
                            <View style={styles.createSubWrap}>
                                <MaterialCommunityIcons name="info" size={14} color="#3B82F6" />
                                <Text style={styles.createSub}>SUBMITTING REQUISITION</Text>
                            </View>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.createScroll}>
                        {/* BASIC DETAILS */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>BASIC DETAILS</Text>
                            <View style={styles.formGrid}>
                                <View style={styles.formItem}>
                                    <View style={styles.labelGrp}>
                                        <MaterialCommunityIcons name="office-building" size={14} color="#3B82F6" />
                                        <Text style={styles.formLabel}>PROJECT</Text>
                                    </View>
                                    <TouchableOpacity style={styles.modalSelector} onPress={() => setSelProjectVisible(true)}>
                                        <Text style={[styles.selText, !formProject && { color: '#94A3B8' }]}>
                                            {formProject?.name || 'Select Project'}
                                        </Text>
                                        <MaterialCommunityIcons name="chevron-down" size={18} color="#0F172A" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.formGrid}>
                                <View style={styles.formItem}>
                                    <View style={styles.labelGrp}>
                                        <MaterialCommunityIcons name="account-outline" size={14} color="#3B82F6" />
                                        <Text style={styles.formLabel}>VENDOR NAME</Text>
                                    </View>
                                    <TextInput 
                                        style={styles.formInp}
                                        placeholder="Enter Vendor Name"
                                        value={formVendor}
                                        onChangeText={setFormVendor}
                                    />
                                </View>
                                <View style={styles.formItem}>
                                    <View style={styles.labelGrp}>
                                        <MaterialCommunityIcons name="email-outline" size={14} color="#3B82F6" />
                                        <Text style={styles.formLabel}>VENDOR EMAIL</Text>
                                    </View>
                                    <TextInput 
                                        style={styles.formInp}
                                        placeholder="Enter Vendor Email"
                                        value={formEmail}
                                        onChangeText={setFormEmail}
                                        keyboardType="email-address"
                                    />
                                </View>
                            </View>

                            <View style={styles.formGrid}>
                                <View style={styles.formItem}>
                                    <View style={styles.labelGrp}>
                                        <MaterialCommunityIcons name="calendar-outline" size={14} color="#3B82F6" />
                                        <Text style={styles.formLabel}>DATE</Text>
                                    </View>
                                    <View style={styles.formInpBox}>
                                        <Text style={styles.inpValTxt}>{new Date().toLocaleDateString()}</Text>
                                        <MaterialCommunityIcons name="calendar-check" size={20} color="#0F172A" />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* LINE ITEMS */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>LINE ITEMS</Text>
                                <TouchableOpacity style={styles.btnAddItem} onPress={handleAddItem}>
                                    <MaterialCommunityIcons name="plus-circle-outline" size={16} color="#3B82F6" />
                                    <Text style={styles.btnAddItemTxt}>ADD ITEM</Text>
                                </TouchableOpacity>
                            </View>

                            {items.map((it, idx) => (
                                <View key={it.id} style={styles.lineItemBox}>
                                    <View style={styles.lineItemHeader}>
                                        <TextInput 
                                            style={styles.lineItemNameInp}
                                            placeholder="Item Name"
                                            value={it.itemName}
                                            onChangeText={v => handleUpdateItem(it.id, 'itemName', v)}
                                        />
                                        <TouchableOpacity onPress={() => handleRemoveItem(it.id)}>
                                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                    <TextInput 
                                        style={styles.lineItemDescInp}
                                        placeholder="Description"
                                        value={it.description}
                                        onChangeText={v => handleUpdateItem(it.id, 'description', v)}
                                    />
                                    <View style={styles.lineItemCalcRow}>
                                        <View style={styles.calcBox}>
                                            <Text style={styles.calcLab}>QTY</Text>
                                            <TextInput 
                                                keyboardType="numeric"
                                                style={styles.calcInp}
                                                value={it.quantity}
                                                onChangeText={v => handleUpdateItem(it.id, 'quantity', v)}
                                            />
                                        </View>
                                        <View style={styles.calcBox}>
                                            <Text style={styles.calcLab}>PRICE</Text>
                                            <TextInput 
                                                keyboardType="numeric"
                                                style={styles.calcInp}
                                                value={it.unitPrice}
                                                onChangeText={v => handleUpdateItem(it.id, 'unitPrice', v)}
                                            />
                                        </View>
                                        <View style={[styles.calcBox, { alignItems: 'flex-end', borderRightWidth: 0 }]}>
                                            <Text style={styles.calcLab}>ITEM TOTAL</Text>
                                            <Text style={styles.calcTotalText}>
                                                ${((parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0)).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* SUMMARY & NOTES */}
                        <View style={styles.sidebarSection}>
                            <View style={[styles.summaryCard, SHADOWS.large]}>
                                <Text style={styles.summaryTitle}>REQUISITION SUMMARY</Text>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLab}>Subtotal</Text>
                                    <Text style={styles.summaryVal}>${poSummary.subtotal.toFixed(2)}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLab}>Tax (15%)</Text>
                                    <Text style={styles.summaryVal}>${poSummary.tax.toFixed(2)}</Text>
                                </View>
                                <View style={[styles.summaryRow, { marginTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15 }]}>
                                    <Text style={styles.totalLab}>ESTIMATED TOTAL</Text>
                                    <Text style={styles.totalVal}>${poSummary.total.toFixed(2)}</Text>
                                </View>

                                <Text style={[styles.summaryTitle, { marginTop: 30 }]}>QUICK NOTES</Text>
                                <TextInput 
                                    style={styles.notesInp}
                                    placeholder="Notes for procurement team..."
                                    placeholderTextColor="#475569"
                                    multiline
                                    value={formNotes}
                                    onChangeText={setFormNotes}
                                />

                                <TouchableOpacity style={styles.btnSubmitFinal} onPress={handleCreatePO} disabled={submitting}>
                                    {submitting ? <ActivityIndicator color="#fff" /> : (
                                        <>
                                            <MaterialCommunityIcons name="check-decagram" size={20} color="#fff" />
                                            <Text style={styles.btnSubmitFinalTxt}>SUBMIT REQUISITION</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => setCreateVisible(false)}>
                                    <Text style={styles.discardTxt}>DISCARD CHANGES</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>

                {/* Project Select Nested Modal */}
                <Modal visible={selProjectVisible} transparent animationType="fade">
                    <View style={styles.selBack}>
                        <View style={styles.selCard}>
                             <Text style={styles.selTitle}>Selection</Text>
                             <FlatList 
                                data={projects}
                                keyExtractor={p => p._id || p.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.selItem} onPress={() => { setFormProject(item); setSelProjectVisible(false); }}>
                                        <Text style={styles.selItemTxt}>{item.name}</Text>
                                        <MaterialCommunityIcons name="check-circle" size={20} color="#2563EB" />
                                    </TouchableOpacity>
                                )}
                             />
                             <TouchableOpacity onPress={() => setSelProjectVisible(false)} style={styles.selClose}>
                                <Text style={styles.selCloseTxt}>CANCEL</Text>
                             </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    pageHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTextContainer: { flex: 1, marginRight: 12 },
    mainTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
    mainSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '800', marginTop: 4 },
    addBtn: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
    addBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },

    statsSection: { marginBottom: 12 },
    statsRow: { gap: 8, paddingHorizontal: 20, marginBottom: 20 },
    statCard: { width: 140, backgroundColor: '#fff', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
    statIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    statLabel: { fontSize: 8, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5 },
    statValue: { fontSize: 16, fontWeight: '1000', color: '#0F172A', marginTop: 1 },
    statDesc: { fontSize: 7, fontWeight: '800', color: '#CBD5E1', marginTop: 2 },
    
    filterSection: { paddingHorizontal: 20, marginBottom: 12, gap: 12 },
    searchBox: { height: 52, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 13, fontWeight: '700', color: '#1E293B' },
    toolsRow: { gap: 10, paddingRight: 20 },
    toolBtn: { height: 40, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 8 },
    toolBtnTxt: { fontSize: 10, fontWeight: '900', color: '#64748B' },
    toolBtnIcon: { width: 40, height: 40, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
    listArea: { padding: 16, paddingBottom: 100 },
    poCard: { backgroundColor: '#fff', borderRadius: 28, marginBottom: 16, overflow: 'hidden', flexDirection: 'row' },
    statusAccent: { width: 6 },
    poCardInfo: { flex: 1, padding: 20 },
    poCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    poNumWrap: { flexDirection: 'row', gap: 12 },
    hashBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    poNumberTxt: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
    poProjectTxt: { fontSize: 12, fontWeight: '800', color: '#64748B', marginTop: 2, width: 140 },
    poProjectSub: { fontSize: 8, fontWeight: '900', color: '#CBD5E1', letterSpacing: 0.5 },
    vendorWrap: { alignItems: 'flex-end', gap: 6 },
    vendorAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    vendorAvatarTxt: { fontSize: 12, fontWeight: '900', color: '#2563EB' },
    vendorNameTxt: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
    poCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
    poAmountWrap: { flex: 1 },
    poAmountLabel: { fontSize: 8, fontWeight: '900', color: '#CBD5E1', letterSpacing: 0.5 },
    poAmountVal: { fontSize: 18, fontWeight: '900' },
    poStatusWrap: { alignItems: 'flex-end', gap: 6 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 9, fontWeight: '900' },
    poDateTxt: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
    detailsBtn: { padding: 4, marginLeft: 15 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Modal Create PO
    createMain: { flex: 1, backgroundColor: '#FAFBFD' },
    createHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backBtnModal: { marginRight: 15 },
    createTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    createSubWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    createSub: { fontSize: 10, fontWeight: '900', color: '#3B82F6', letterSpacing: 1 },
    createScroll: { padding: 20, paddingBottom: 60 },
    sectionCard: { backgroundColor: '#fff', borderRadius: 28, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginBottom: 20 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    formGrid: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    formItem: { flex: 1 },
    labelGrp: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    formLabel: { fontSize: 9, fontWeight: '900', color: '#64748B' },
    modalSelector: { height: 50, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    selText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    formInp: { height: 50, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 15, fontSize: 14, fontWeight: '700', color: '#1E293B' },
    formInpBox: { height: 50, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    inpValTxt: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    btnAddItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    btnAddItemTxt: { fontSize: 11, fontWeight: '900', color: '#2563EB' },
    lineItemBox: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    lineItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    lineItemNameInp: { fontSize: 15, fontWeight: '900', color: '#0F172A', flex: 1 },
    lineItemDescInp: { fontSize: 11, color: '#64748B', marginBottom: 15, fontWeight: '600' },
    lineItemCalcRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 15 },
    calcBox: { flex: 1, borderRightWidth: 1, borderRightColor: '#E2E8F0', paddingRight: 10 },
    calcLab: { fontSize: 8, fontWeight: '900', color: '#94A3B8', marginBottom: 6 },
    calcInp: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
    calcTotalText: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
    sidebarSection: { marginBottom: 30 },
    summaryCard: { backgroundColor: '#0F172A', borderRadius: 36, padding: 32 },
    summaryTitle: { fontSize: 10, fontWeight: '900', color: '#64748B', letterSpacing: 1.5, marginBottom: 25 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    summaryLab: { fontSize: 15, color: '#fff', fontWeight: '500' },
    summaryVal: { fontSize: 15, color: '#fff', fontWeight: '800' },
    totalLab: { fontSize: 11, fontWeight: '900', color: '#3B82F6', letterSpacing: 1 },
    totalVal: { fontSize: 26, fontWeight: '900', color: '#3B82F6' },
    notesInp: { backgroundColor: '#1E293B', borderRadius: 24, padding: 20, minHeight: 120, fontSize: 14, color: '#fff', marginTop: 10, marginBottom: 30, textAlignVertical: 'top' },
    btnSubmitFinal: { backgroundColor: '#2563EB', height: 64, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    btnSubmitFinalTxt: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
    discardTxt: { color: '#64748B', fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 25, letterSpacing: 1 },
    selBack: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 25 },
    selCard: { backgroundColor: '#fff', borderRadius: 32, padding: 25, maxHeight: '60%' },
    selTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 20 },
    selItem: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selItemTxt: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    selClose: { marginTop: 20, alignItems: 'center', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 16 },
    selCloseTxt: { color: '#64748B', fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});

export default PurchaseOrdersScreen;

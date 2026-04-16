import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
    Modal,
    Alert,
    Dimensions,
    TextInput,
    SafeAreaView,
    StatusBar,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, SPACING, SIZES } from '../../constants/theme';
import api from '../../utils/api';
import { useApp } from '../../context/AppContext';
import WorkerHeader from '../../components/WorkerHeader';

const { width } = Dimensions.get('window');

const DailyLogsScreen = ({ navigation }) => {
    const { user, projects, refreshData } = useApp();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilterProject, setSelectedFilterProject] = useState(null);
    
    // Form States
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [weather, setWeather] = useState({ status: 'Sunny', temperature: '70' });
    const [manpowerCount, setManpowerCount] = useState('1');
    const [manpowerHrs, setManpowerHrs] = useState('8');
    const [workPerformed, setWorkPerformed] = useState('');
    const [projectModalVisible, setProjectModalVisible] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/dailylogs');
            setLogs(res.data || []);
        } catch (e) {
            console.error('Fetch logs error:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLogs();
        refreshData();
    }, []);

    const handleSubmit = async () => {
        if (!selectedProject || !workPerformed) {
            Alert.alert('Required Fields', 'Please select a project and describe the work performed.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                projectId: selectedProject._id || selectedProject.id,
                date: new Date(date),
                weather: { 
                    status: weather.status, 
                    temperature: parseInt(weather.temperature) || 0 
                },
                manpower: [{
                    role: 'General',
                    count: parseInt(manpowerCount) || 0,
                    hours: parseFloat(manpowerHrs) || 0
                }],
                workPerformed
            };
            await api.post('/dailylogs', payload);
            setModalVisible(false);
            resetForm();
            fetchLogs();
            Alert.alert('Success', 'Daily site log successfully submitted.');
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to submit log');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedProject(null);
        setWorkPerformed('');
        setManpowerCount('1');
        setManpowerHrs('8');
        setWeather({ status: 'Sunny', temperature: '70' });
        setDate(new Date().toISOString().split('T')[0]);
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.workPerformed?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             log.projectId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProject = !selectedFilterProject || log.projectId?._id === selectedFilterProject._id;
        return matchesSearch && matchesProject;
    });

    const renderLogItem = ({ item }) => {
        const totalManpower = item.manpower?.reduce((acc, m) => acc + (m.count || 0), 0) || 0;
        const totalHours = item.manpower?.reduce((acc, m) => acc + ((m.hours || 0) * (m.count || 1)), 0) || 0;
        const logDate = new Date(item.date);

        return (
            <TouchableOpacity 
                style={styles.tableRow} 
                activeOpacity={0.7}
                onPress={() => {/* Navigate to detail if needed */}}
            >
                {/* Column: Date & Reporter */}
                <View style={[styles.column, { width: width < 380 ? 60 : 70 }]}>
                    <Text style={styles.cellMainText}>{logDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</Text>
                    <Text style={styles.cellSubText} numberOfLines={1}>{item.reportedBy?.fullName?.split(' ')[0] || 'Jay'}</Text>
                </View>

                {/* Column: Project & Work Snippet */}
                <View style={[styles.column, { flex: 1, paddingHorizontal: 4 }]}>
                    <Text style={styles.cellProjectText} numberOfLines={1} adjustsFontSizeToFit>{item.projectId?.name || 'Unassigned'}</Text>
                    <Text style={styles.cellWorkText} numberOfLines={1}>{item.workPerformed}</Text>
                </View>

                {/* Column: Stats */}
                <View style={[styles.column, { width: width < 380 ? 55 : 65, alignItems: 'flex-end' }]}>
                    <View style={styles.statusChip}>
                        <Text style={styles.statusChipText}>{totalManpower} Men</Text>
                    </View>
                    <View style={styles.weatherMiniTag}>
                        <MaterialCommunityIcons name="thermometer" size={ width < 380 ? 8 : 10} color="#EA580C" />
                        <Text style={styles.weatherMiniText}>{item.weather?.temperature || '0'}°</Text>
                    </View>
                </View>

                {/* Arrow */}
                <View style={{ width: 16, alignItems: 'flex-end', marginLeft: 4 }}>
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#CBD5E1" />
                </View>
            </TouchableOpacity>
        );
    };

    const TableHeader = () => (
        <View style={styles.tableHeader}>
            <Text style={[styles.headerLabel, { width: width < 380 ? 60 : 70 }]}>DATE/BY</Text>
            <Text style={[styles.headerLabel, { flex: 1, paddingHorizontal: 4 }]}>PROJECT & ACTIVITY</Text>
            <Text style={[styles.headerLabel, { width: width < 380 ? 55 : 65, textAlign: 'right' }]}>STATS</Text>
            <View style={{ width: 16, marginLeft: 4 }} />
        </View>
    );

    if (user?.role !== 'PM' && user?.role !== 'FOREMAN') {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <WorkerHeader showBranding={true} />
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="file-document-outline" size={80} color="#E2E8F0" />
                    <Text style={styles.emptyTitle}>Daily Site Logs</Text>
                    <Text style={styles.emptySubtitle}>Content is being updated by the Project Manager.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader showBranding={true} />
            
            <View style={styles.content}>
                <View style={styles.topHeader}>
                    <View>
                        <Text style={styles.title}>Daily Site Logs</Text>
                        <Text style={styles.subtitle}>Consolidated site operations record</Text>
                    </View>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setModalVisible(true)}>
                        <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>New Log</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.filterArea}>
                    <View style={styles.searchContainer}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Search by keywords..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <View style={styles.toolsRow}>
                        <TouchableOpacity 
                            style={styles.toolBtn}
                            onPress={() => setFilterModalVisible(true)}
                        >
                            <MaterialCommunityIcons name="filter-variant" size={16} color="#64748B" style={{marginRight: 6}} />
                            <Text style={styles.toolBtnText} numberOfLines={1}>{selectedFilterProject?.name || 'All Projects'}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.toolBtn}>
                            <MaterialCommunityIcons name="calendar-range" size={16} color="#64748B" />
                            <Text style={[styles.toolBtnText, { marginLeft: 6 }]}>Range</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TableHeader />

                {loading && !refreshing ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color="#2563EB" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredLogs}
                        renderItem={renderLogItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="file-document-outline" size={64} color="#CBD5E1" />
                                <Text style={styles.emptyText}>No site logs found</Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* NEW LOG MODAL */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Daily Site Record</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                    <MaterialCommunityIcons name="close" size={24} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Project</Text>
                                    <TouchableOpacity 
                                        style={styles.selectBtn} 
                                        onPress={() => setProjectModalVisible(true)}
                                    >
                                        <Text style={[styles.selectBtnText, !selectedProject && { color: '#94A3B8' }]}>
                                            {selectedProject?.name || 'Select Project...'}
                                        </Text>
                                        <MaterialCommunityIcons name="chevron-down" size={20} color="#0F172A" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, { flex: 1.2 }]}>
                                        <Text style={styles.label}>Date</Text>
                                        <View style={styles.fieldValue}>
                                            <MaterialCommunityIcons name="calendar" size={18} color="#64748B" />
                                            <Text style={styles.fieldValueText}>{date}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 0.8 }]}>
                                        <Text style={styles.label}>Temp (°F)</Text>
                                        <TextInput 
                                            style={styles.textInput}
                                            value={weather.temperature}
                                            onChangeText={v => setWeather({ ...weather, temperature: v })}
                                            keyboardType="numeric"
                                            placeholder="70"
                                        />
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>Total Crew</Text>
                                        <TextInput 
                                            style={styles.textInput}
                                            value={manpowerCount}
                                            onChangeText={setManpowerCount}
                                            keyboardType="numeric"
                                            placeholder="Count"
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>Hours/Person</Text>
                                        <TextInput 
                                            style={styles.textInput}
                                            value={manpowerHrs}
                                            onChangeText={setManpowerHrs}
                                            keyboardType="numeric"
                                            placeholder="Hrs"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Work Done & Notes</Text>
                                    <TextInput 
                                        style={styles.textArea}
                                        value={workPerformed}
                                        onChangeText={setWorkPerformed}
                                        multiline
                                        numberOfLines={5}
                                        placeholder="Detailed log of activities..."
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>

                                <TouchableOpacity 
                                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                                    onPress={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitBtnText}>Submit Record</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* PROJECT SELECTION MODAL */}
            <Modal visible={projectModalVisible || filterModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.selectorCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{filterModalVisible ? 'Filter' : 'Select Project'}</Text>
                            <TouchableOpacity onPress={() => { setProjectModalVisible(false); setFilterModalVisible(false); }}>
                                <MaterialCommunityIcons name="close" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={filterModalVisible ? [{ _id: null, name: 'All Projects' }, ...projects] : projects}
                            keyExtractor={(item, index) => item._id || index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.selectorItem}
                                    onPress={() => {
                                        if (filterModalVisible) {
                                            setSelectedFilterProject(item._id ? item : null);
                                            setFilterModalVisible(false);
                                        } else {
                                            setSelectedProject(item);
                                            setProjectModalVisible(false);
                                        }
                                    }}
                                >
                                    <Text style={styles.selectorText}>{item.name}</Text>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { flex: 1, paddingHorizontal: 16 },
    topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: '#64748B', fontWeight: '600', marginTop: 2 },
    actionBtn: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 6 },
    actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
    
    filterArea: { marginBottom: 16, gap: 10 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', height: 44, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#1E293B' },
    toolsRow: { flexDirection: 'row', gap: 8 },
    toolBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10 },
    toolBtnText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
    
    tableHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: '#E2E8F0', paddingHorizontal: 4 },
    headerLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
    
    listContainer: { paddingBottom: 100 },
    tableRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    column: { justifyContent: 'center' },
    cellMainText: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
    cellSubText: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
    cellProjectText: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
    cellWorkText: { fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 2 },
    
    statusChip: { backgroundColor: '#F0F9FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#BAE6FD' },
    statusChipText: { fontSize: 10, fontWeight: '900', color: '#0369A1' },
    weatherMiniTag: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
    weatherMiniText: { fontSize: 10, fontWeight: '800', color: '#EA580C' },
    
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
    emptyText: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#94A3B8', marginTop: 16 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    closeBtn: { padding: 4 },
    modalBody: { marginBottom: 20 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 11, fontWeight: '900', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    selectBtn: { height: 48, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, justifyContent: 'space-between' },
    selectBtnText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    row: { flexDirection: 'row', gap: 10 },
    fieldValue: { height: 48, backgroundColor: '#F1F5F9', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
    fieldValueText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
    textInput: { height: 48, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, fontSize: 14, fontWeight: '700', color: '#0F172A' },
    textArea: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, fontSize: 14, fontWeight: '600', color: '#334155', textAlignVertical: 'top' },
    submitBtn: { backgroundColor: '#2563EB', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    
    selectorCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 100 },
    selectorItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    selectorText: { fontSize: 15, fontWeight: '700', color: '#1E2937' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
    emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginTop: 16 },
    emptySubtitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 },
});

export default DailyLogsScreen;

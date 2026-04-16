import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import { useApp } from '../../context/AppContext';
import api from '../../utils/api';
import { Card, Badge } from '../../components/shared/CommonUI';

const WorkerLogsScreen = () => {
    const { user, projects, refreshData } = useApp();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState({ projectId: '', workPerformed: '', hours: '8' });

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/dailylogs/user');
            setLogs(res.data);
        } catch (e) {
            // Mock data if API fails
            setLogs([
                { _id: '1', date: '2026-03-07', project: { name: 'Skyline Residence' }, isVerified: false, workPerformed: 'Drywall installation' },
                { _id: '2', date: '2026-03-06', project: { name: 'Skyline Residence' }, isVerified: true, workPerformed: 'Material transport' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const handleSubmit = async () => {
        if (!form.projectId || !form.workPerformed) {
            Alert.alert('Error', 'Please fill required fields.');
            return;
        }
        try {
            setLoading(true);
            await api.post('/dailylogs', { ...form, date: new Date() });
            setModalVisible(false);
            setForm({ projectId: '', workPerformed: '', hours: '8' });
            fetchLogs();
            Alert.alert('Success', 'Daily log submitted!');
        } catch (e) { Alert.alert('Error', 'Submission failed.'); }
        finally { setLoading(false); }
    };

    return (
        <View style={styles.container}>
            <AppHeader title="Time & Attendance" />
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="clock-check-outline" size={80} color="#E2E8F0" />
                <Text style={styles.emptyTitle}>Time & Attendance</Text>
                <Text style={styles.emptySubtitle}>Content is being updated by the Project Manager.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    summaryCard: { margin: 16, backgroundColor: COLORS.primaryDark, borderRadius: 24, padding: 24, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    summaryBox: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: 28, fontWeight: '900', color: '#fff' },
    summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '900', textTransform: 'uppercase', marginTop: 4, letterSpacing: 1 },
    dividerV: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10, marginBottom: 12 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1.5 },
    list: { paddingHorizontal: 16, paddingBottom: 100 },
    logCard: { marginBottom: 12, padding: 14 },
    logRow: { flexDirection: 'row', alignItems: 'center' },
    dateBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
    dateNum: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
    dateMonth: { fontSize: 8, fontWeight: '900', color: COLORS.primary, marginTop: -2 },
    logProject: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
    logWork: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    fab: { position: 'absolute', right: 20, bottom: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
    modalIndicator: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 20 },
    label: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 8, marginTop: 16 },
    chipRow: { gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', borderHeight: 1, borderColor: '#E2E8F0' },
    chipActive: { backgroundColor: COLORS.primary },
    chipText: { fontSize: 13, fontWeight: '700', color: '#475569' },
    chipTextActive: { color: '#fff' },
    input: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: '#E2E8F0' },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 32, marginBottom: 40 },
    cancelBtn: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center', backgroundColor: '#F1F5F9' },
    cancelText: { fontWeight: '900', color: '#64748B' },
    submitBtn: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center', backgroundColor: COLORS.primary },
    submitText: { fontWeight: '900', color: '#fff' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 100 },
    emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginTop: 16 },
    emptySubtitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', textAlign: 'center', marginTop: 8 },
});

export default WorkerLogsScreen;

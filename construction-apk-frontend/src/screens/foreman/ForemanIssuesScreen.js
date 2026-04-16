import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    TouchableOpacity, Modal, TextInput, Alert, ScrollView,
    Dimensions, StatusBar, SafeAreaView, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING } from '../../constants/theme';
import WorkerHeader from '../../components/WorkerHeader';
import { useApp } from '../../context/AppContext';
import api from '../../utils/api';

const { width } = Dimensions.get('window');

const ForemanIssuesScreen = ({ navigation }) => {
    const { issues, projects, addIssue, refreshData } = useApp();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    
    // Create Issue State
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        projectId: null,
        location: ''
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    const filteredIssues = useMemo(() => {
        return (issues || []).filter(issue => {
            const matchesSearch = (issue.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 (issue.description || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = selectedStatus === 'All' || issue.status === selectedStatus;
            return matchesSearch && matchesStatus;
        });
    }, [issues, searchQuery, selectedStatus]);

    const handleCreateIssue = async () => {
        if (!form.title || !form.projectId) {
            Alert.alert('Required', 'Please provide a title and select a project.');
            return;
        }

        try {
            setSubmitting(true);
            const res = await addIssue({
                ...form,
                status: 'Open',
                date: new Date().toISOString()
            });

            if (res.success) {
                setModalVisible(false);
                setForm({ title: '', description: '', priority: 'Medium', projectId: null, location: '' });
                Alert.alert('Success', 'Snag reported successfully');
            } else {
                Alert.alert('Error', res.message);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to submit snag');
        } finally {
            setSubmitting(false);
        }
    };

    const getPriorityColor = (p) => {
        switch (p?.toLowerCase()) {
            case 'high': return '#EF4444';
            case 'medium': return '#F59E0B';
            case 'low': return '#10B981';
            default: return '#64748B';
        }
    };

    const renderIssueItem = ({ item }) => (
        <TouchableOpacity style={[styles.issueCard, SHADOWS.small]} activeOpacity={0.9}>
            <View style={[styles.priorityTab, { backgroundColor: getPriorityColor(item.priority) }]} />
            <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                    <Text style={styles.issueTitle}>{item.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'Resolved' ? '#F0FDF4' : '#FFF7ED' }]}>
                        <Text style={[styles.statusText, { color: item.status === 'Resolved' ? '#10B981' : '#EA580C' }]}>
                            {item.status?.toUpperCase() || 'OPEN'}
                        </Text>
                    </View>
                </View>
                
                <Text style={styles.issueDesc} numberOfLines={2}>{item.description || 'No additional details provided.'}</Text>
                
                <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                        <MaterialCommunityIcons name="office-building" size={14} color="#94A3B8" />
                        <Text style={styles.footerText}>{item.projectId?.name || 'Project Site'}</Text>
                    </View>
                    <View style={styles.footerItem}>
                        <MaterialCommunityIcons name="calendar" size={14} color="#94A3B8" />
                        <Text style={styles.footerText}>{new Date(item.date || Date.now()).toLocaleDateString()}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <WorkerHeader title="Snag List" />

            <View style={styles.content}>
                <View style={styles.pageHeader}>
                    <View>
                        <Text style={styles.mainTitle}>Field Snags</Text>
                        <Text style={styles.mainSubtitle}>Report & track site issues</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <MaterialCommunityIcons name="alert-plus" size={18} color="#fff" />
                        <Text style={styles.addBtnText}>Log Snag</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.filterBar}>
                    <View style={styles.searchBox}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                        <TextInput 
                            placeholder="Search snags..."
                            placeholderTextColor="#94A3B8"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                <FlatList
                    data={filteredIssues}
                    keyExtractor={item => item._id || item.id}
                    renderItem={renderIssueItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialCommunityIcons name="check-decagram-outline" size={64} color="#E2E8F0" />
                            <Text style={styles.emptyTxt}>No active snags found.</Text>
                        </View>
                    }
                />
            </View>

            {/* CREATE ISSUE MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Report Site Issue</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#1E293B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>ISSUE TITLE</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="e.g. Broken pipe in lobby"
                                value={form.title}
                                onChangeText={t => setForm({...form, title: t})}
                            />

                            <Text style={styles.label}>SELECT PROJECT</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectRow}>
                                {projects.map(p => (
                                    <TouchableOpacity 
                                        key={p._id} 
                                        style={[styles.projChip, form.projectId === p._id && styles.projChipActive]}
                                        onPress={() => setForm({...form, projectId: p._id})}
                                    >
                                        <Text style={[styles.projChipText, form.projectId === p._id && { color: '#fff' }]}>{p.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.label}>SEVERITY LEVEL</Text>
                            <View style={styles.priorityRow}>
                                {['Low', 'Medium', 'High'].map(p => (
                                    <TouchableOpacity 
                                        key={p} 
                                        style={[styles.prioBtn, form.priority === p && { backgroundColor: getPriorityColor(p), borderColor: getPriorityColor(p) }]}
                                        onPress={() => setForm({...form, priority: p})}
                                    >
                                        <Text style={[styles.prioBtnText, form.priority === p && { color: '#fff' }]}>{p}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>DETAILED DESCRIPTION</Text>
                            <TextInput 
                                style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                                placeholder="Describe the issue in detail..."
                                multiline
                                value={form.description}
                                onChangeText={t => setForm({...form, description: t})}
                            />

                            <TouchableOpacity 
                                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                                onPress={handleCreateIssue}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator color="#fff" /> : (
                                    <Text style={styles.submitBtnText}>SUBMIT SNAG REPORT</Text>
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
    content: { flex: 1, paddingHorizontal: 20 },
    pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20 },
    mainTitle: { fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
    mainSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '800', marginTop: 4 },
    addBtn: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 6 },
    addBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },

    filterBar: { marginBottom: 20 },
    searchBox: { height: 50, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1E293B' },

    list: { paddingBottom: 100 },
    issueCard: { backgroundColor: '#fff', borderRadius: 24, marginBottom: 16, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    priorityTab: { width: 6 },
    cardInfo: { flex: 1, padding: 20 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    issueTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', flex: 1, marginRight: 10 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 9, fontWeight: '900' },
    issueDesc: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 15, lineHeight: 18 },
    cardFooter: { flexDirection: 'row', gap: 15, borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 12 },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },

    empty: { padding: 60, alignItems: 'center' },
    emptyTxt: { fontSize: 14, fontWeight: '700', color: '#CBD5E1', marginTop: 15 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
    label: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
    input: { height: 50, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, fontSize: 15, fontWeight: '700', color: '#1E293B' },
    projectRow: { flexDirection: 'row', marginTop: 4 },
    projChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    projChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
    projChipText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
    priorityRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    prioBtn: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    prioBtnText: { fontSize: 12, fontWeight: '900', color: '#64748B' },
    submitBtn: { height: 56, backgroundColor: '#0F172A', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 32, marginBottom: 20 },
    submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 }
});

export default ForemanIssuesScreen;

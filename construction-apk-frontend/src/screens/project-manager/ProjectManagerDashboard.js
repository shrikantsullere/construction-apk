import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, ActivityIndicator, Alert, ScrollView, Modal, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import api from '../../utils/api';

const { width, height } = Dimensions.get('window');

const ProjectManagerDashboard = ({ navigation }) => {
    const { refreshData, teamMembers, user, todos } = useApp();
    const [todo, setTodo] = useState('');
    const [assignedTo, setAssignedTo] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUserSelectorVisible, setIsUserSelectorVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            await refreshData();
        } catch (err) {
            console.error('Error refreshing dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchDashboardData);
        fetchDashboardData();
        return unsubscribe;
    }, [navigation]);

    const handleAddTodo = async () => {
        if (!todo.trim()) return;
        try {
            setSubmitting(true);
            await api.post('/todos', {
                title: todo.trim(),
                assignedTo: assignedTo?._id || undefined,
                priority: 'Medium'
            });
            setTodo('');
            setAssignedTo(null);
            setSearchTerm('');
            refreshData();
        } catch (err) {
            Alert.alert('Error', 'Failed to create task');
        } finally {
            setSubmitting(false);
        }
    };

    const myDailyTodos = (todos || []).filter(t => t.assignedTo?._id === user?._id || !t.assignedTo);
    const assignedByMe = (todos || []).filter(t => t.assignedBy?._id === user?._id && t.assignedTo?._id !== user?._id);

    return (
        <View style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { fontSize: width < 380 ? 28 : 32 }]}>Dashboard</Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1} adjustsFontSizeToFit>Own Your Time. Control Your Site.</Text>
                </View>

                {/* Quick Actions Grid */}
                <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
                <View style={styles.grid}>
                    <TouchableOpacity style={[styles.card, { borderLeftColor: '#6366F1' }]} onPress={() => navigation.navigate('CrewClock')}>
                        <View style={styles.cardIconBox}><MaterialCommunityIcons name="account-clock" size={16} color="#6366F1" /></View>
                        <Text style={styles.cardLabel} numberOfLines={1} adjustsFontSizeToFit>Clock In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.card, { borderLeftColor: '#F59E0B' }]} onPress={() => navigation.navigate('DailyLogs')}>
                        <View style={styles.cardIconBox}><MaterialCommunityIcons name="clipboard-text" size={16} color="#F59E0B" /></View>
                        <Text style={styles.cardLabel} numberOfLines={1} adjustsFontSizeToFit>Add Log</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.card, { borderLeftColor: '#10B981' }]} onPress={() => navigation.navigate('Photos')}>
                        <View style={styles.cardIconBox}><MaterialCommunityIcons name="camera" size={16} color="#10B981" /></View>
                        <Text style={styles.cardLabel} numberOfLines={1} adjustsFontSizeToFit>Photos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.card, { borderLeftColor: '#3B82F6' }]} onPress={() => navigation.navigate('Drawings')}>
                        <View style={styles.cardIconBox}><MaterialCommunityIcons name="drawing" size={16} color="#3B82F6" /></View>
                        <Text style={styles.cardLabel} numberOfLines={1} adjustsFontSizeToFit>Drawings</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.card, { borderLeftColor: '#10B981' }]} onPress={() => navigation.navigate('Tasks')}>
                        <View style={styles.cardIconBox}><MaterialCommunityIcons name="calendar-check" size={16} color="#10B981" /></View>
                        <Text style={styles.cardLabel} numberOfLines={1} adjustsFontSizeToFit>Tasks</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.card, { borderLeftColor: '#EF4444' }]} onPress={() => navigation.navigate('PurchaseOrders')}>
                        <View style={styles.cardIconBox}><MaterialCommunityIcons name="receipt" size={16} color="#EF4444" /></View>
                        <Text style={styles.cardLabel} numberOfLines={1} adjustsFontSizeToFit>Orders</Text>
                    </TouchableOpacity>
                </View>

                {/* DAILY QUICK TO-DO */}
                <View style={styles.premiumWidget}>
                    <View style={styles.widgetHeaderRow}>
                        <View style={styles.widgetTitleWrap}>
                            <View style={styles.iconCircle}><MaterialCommunityIcons name="lightning-bolt" size={16} color="#4F46E5" /></View>
                            <Text style={styles.widgetTitle}>Daily Quick To-Do</Text>
                        </View>
                        <MaterialCommunityIcons name="dots-vertical" size={20} color="#94A3B8" />
                    </View>

                    <View style={styles.widgetContent}>
                        <View style={styles.inputFieldWrap}>
                            <Text style={styles.fieldLabel}>Task Description</Text>
                            <View style={styles.textInputBox}>
                                <TextInput 
                                    style={styles.mainInput}
                                    placeholder="e.g. Pick up supplies from the warehouse and deliver to main site..."
                                    placeholderTextColor="#94A3B8"
                                    value={todo}
                                    onChangeText={setTodo}
                                    multiline={true}
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        <View style={styles.inputFieldWrap}>
                            <Text style={styles.fieldLabel}>Assign To User</Text>
                            <TouchableOpacity 
                                style={[styles.selectorBox, isUserSelectorVisible && styles.selectorBoxActive]} 
                                onPress={() => setIsUserSelectorVisible(true)}
                            >
                                <View style={styles.selectorLeft}>
                                    <View style={[styles.tinyAvatar, !assignedTo && { backgroundColor: '#F1F5F9' }]}>
                                        {assignedTo ? (
                                            <Text style={styles.tinyAvatarTxt}>{assignedTo.fullName[0]}</Text>
                                        ) : (
                                            <MaterialCommunityIcons name="account-plus" size={14} color="#94A3B8" />
                                        )}
                                    </View>
                                    <Text style={[styles.selectorValue, !assignedTo && { color: '#94A3B8' }]}>
                                        {assignedTo ? assignedTo.fullName : 'Search user...'}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-down" size={20} color="#6366F1" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={[styles.launchBtn, (!todo.trim()) && styles.launchBtnDisabled]} 
                            onPress={handleAddTodo}
                            disabled={submitting || !todo.trim()}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.launchBtnText}>Assign Item</Text>
                                    <MaterialCommunityIcons name="send" size={16} color="#fff" style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* My Daily Todos */}
                <View style={[styles.listHeader, { marginTop: 10 }]}>
                    <Text style={styles.listTitleText}>My Daily Todos</Text>
                    <View style={styles.countBadge}><Text style={styles.countText}>{myDailyTodos.length}</Text></View>
                </View>
                {myDailyTodos.length === 0 ? (
                    <View style={styles.emptyState}><Text style={styles.emptyText}>No pending todos</Text></View>
                ) : (
                    <View style={styles.grid}>
                        {myDailyTodos.map(item => (
                            <View key={item._id} style={[styles.miniCard, { borderLeftColor: '#10B981' }]}>
                                <View style={[styles.miniIconBox, { backgroundColor: '#ECFDF5' }]}>
                                    <MaterialCommunityIcons name="check-circle-outline" size={14} color="#10B981" />
                                </View>
                                <Text style={styles.miniText} numberOfLines={1}>{item.title}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Assigned By Me */}
                <View style={[styles.listHeader, { marginTop: 15 }]}>
                    <Text style={styles.listTitleText}>Assigned By Me</Text>
                    <View style={[styles.countBadge, { backgroundColor: '#EEF2FF' }]}><Text style={[styles.countText, { color: '#4F46E5' }]}>{assignedByMe.length}</Text></View>
                </View>
                {assignedByMe.length === 0 ? (
                    <View style={styles.emptyState}><Text style={styles.emptyText}>Nothing assigned</Text></View>
                ) : (
                    <View style={styles.grid}>
                        {assignedByMe.map(item => (
                            <View key={item._id} style={[styles.miniCard, { flexDirection: 'column', alignItems: 'flex-start', gap: 6, borderLeftColor: '#4F46E5' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={[styles.miniIconBox, { backgroundColor: '#EEF2FF', width: 24, height: 24, borderRadius: 6 }]}>
                                        <MaterialCommunityIcons name="account-arrow-right-outline" size={12} color="#4F46E5" />
                                    </View>
                                    <Text style={styles.miniLabel} numberOfLines={1}>{item.assignedTo?.fullName || 'Operator'}</Text>
                                </View>
                                <Text style={styles.miniTitle} numberOfLines={1}>{item.title}</Text>
                            </View>
                        ))}
                    </View>
                )}


            </ScrollView>

            {/* FULL SCREEN MODAL FOR USER SELECTION - Fixes all overlapping issues */}
            <Modal
                visible={isUserSelectorVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsUserSelectorVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <SafeAreaView style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setIsUserSelectorVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#0F172A" />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Assign To Team Member</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <View style={styles.modalSearchBox}>
                            <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                            <TextInput 
                                style={styles.modalSearchInput}
                                placeholder="Search by name or role..."
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                                autoFocus
                            />
                        </View>

                        <ScrollView style={styles.modalList} keyboardShouldPersistTaps="always">
                            {(teamMembers || [])
                                .filter(u => 
                                    (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(u => (
                                    <TouchableOpacity 
                                        key={u._id} 
                                        style={styles.modalItem} 
                                        onPress={() => {
                                            setAssignedTo(u);
                                            setIsUserSelectorVisible(false);
                                            setSearchTerm('');
                                        }}
                                    >
                                        <View style={styles.modalItemLeft}>
                                            <View style={styles.modalAvatar}><Text style={styles.modalAvatarTxt}>{u.fullName[0]}</Text></View>
                                            <View>
                                                <Text style={styles.modalUserTxt}>{u.fullName}</Text>
                                                <Text style={styles.modalRoleTxt}>{u.role}</Text>
                                            </View>
                                        </View>
                                        {assignedTo?._id === u._id && (
                                            <MaterialCommunityIcons name="check-circle" size={22} color="#10B981" />
                                        )}
                                    </TouchableOpacity>
                                ))
                            }
                            {(teamMembers || []).filter(u => u.fullName.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                <View style={styles.emptyModalView}>
                                    <MaterialCommunityIcons name="account-search" size={48} color="#E2E8F0" />
                                    <Text style={styles.emptyModalTxt}>No team members found</Text>
                                </View>
                            )}
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingHorizontal: 0, paddingBottom: 10, paddingTop: 10 },

    header: { marginBottom: 6, paddingLeft: 2 },
    headerTitle: { fontSize: width < 380 ? 28 : 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
    headerSubtitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginTop: 1 },

    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#0F172A', letterSpacing: 1.5, marginBottom: 10, marginTop: 4, paddingLeft: 2 },
    
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
    card: { 
        width: '48.5%', 
        backgroundColor: '#FFFFFF', 
        borderRadius: 12, 
        paddingVertical: 8, 
        paddingHorizontal: 10, 
        marginBottom: 8, 
        borderLeftWidth: 3, 
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 2
    },
    cardIconBox: { 
        width: 28, 
        height: 28, 
        backgroundColor: '#F8FAFC', 
        borderRadius: 8, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 8 
    },
    cardLabel: { 
        flex: 1,
        fontSize: width < 380 ? 10 : 11, 
        fontWeight: '900', 
        color: '#1E293B', 
        letterSpacing: -0.2 
    },

    premiumWidget: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 16, 
        padding: 14, 
        marginBottom: 16, 
        borderLeftWidth: 4, 
        borderLeftColor: '#4F46E5',
        elevation: 4, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.08, 
        shadowRadius: 3 
    },
    widgetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    widgetTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    widgetTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
    
    widgetContent: { gap: 10 },
    inputFieldWrap: { gap: 4 },
    fieldLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
    textInputBox: { minHeight: 80, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 10 },
    mainInput: { fontSize: 13, fontWeight: '700', color: '#1E293B', flex: 1 },
    
    selectorBox: { height: 44, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    selectorBoxActive: { borderColor: '#4F46E5', backgroundColor: '#F5F7FF' },
    selectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    tinyAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center' },
    tinyAvatarTxt: { fontSize: 11, fontWeight: '900', color: '#4F46E5' },
    selectorValue: { fontSize: 13, fontWeight: '700', color: '#1E293B', flex: 1 },

    launchBtn: { height: 50, backgroundColor: '#0F172A', borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    launchBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
    launchBtnDisabled: { opacity: 0.4 },

    // MODAL STYLES - FULL SCREEN FOR BETTER UX
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)' },
    modalContent: { flex: 1, backgroundColor: '#FFFFFF', marginTop: 100, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
    modalSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 15, paddingHorizontal: 15, height: 50, marginBottom: 15 },
    modalSearchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '700', color: '#1E293B' },
    modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    modalAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
    modalAvatarTxt: { fontSize: 16, fontWeight: '900', color: '#4F46E5' },
    modalUserTxt: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    modalRoleTxt: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginTop: 2 },
    emptyModalView: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
    emptyModalTxt: { fontSize: 14, fontWeight: '800', color: '#94A3B8', marginTop: 10 },

    listHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingLeft: 2, marginTop: 15 },
    listTitleText: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
    countBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 1, borderRadius: 8 },
    countText: { fontSize: 11, fontWeight: '900', color: '#64748B' },
    emptyState: { padding: 15, backgroundColor: '#F8FAFC', borderRadius: 12, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', width: '100%' },
    emptyText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },

    miniIconBox: { width: 30, height: 30, backgroundColor: '#F8FAFC', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    miniCard: { 
        width: '48.5%', 
        backgroundColor: '#FFFFFF', 
        borderRadius: 14, 
        padding: 10, 
        marginBottom: 12, 
        borderLeftWidth: 4, 
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 10
    },
    miniText: { flex: 1, fontSize: 11, fontWeight: '700', color: '#334155' },
    miniLabel: { fontSize: 8, fontWeight: '900', color: '#4F46E5', textTransform: 'uppercase', marginBottom: 2 },
    miniTitle: { fontSize: 12, fontWeight: '800', color: '#1E293B', lineHeight: 16 },


});

export default ProjectManagerDashboard;

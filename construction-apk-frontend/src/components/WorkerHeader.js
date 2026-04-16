import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Modal, ScrollView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useNavigation, DrawerActions } from '@react-navigation/native';

const WorkerHeader = ({ title, hideSearch = false, showBack = false, showBranding = true, showRight = true }) => {
    const { user, projects, notifications, markNotificationAsRead, unreadChatCount } = useApp();
    const navigation = useNavigation();
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNotifying, setIsNotifying] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    // Mirror web logic: only show active + planning projects
    const activeProjects = projects.filter(p =>
        ['active', 'planning', 'in_progress', 'on_hold'].includes((p.status || '').toLowerCase())
    );

    const filteredProjects = activeProjects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const unreadCount = (notifications || []).filter(n => !n.isRead).length;

    const getStatusColor = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'active': return '#22C55E';
            case 'planning': return '#F59E0B';
            case 'in_progress': return '#3B82F6';
            case 'on_hold': return '#EF4444';
            default: return '#94A3B8';
        }
    };

    const getStatusLabel = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'active': return 'Active';
            case 'planning': return 'Planning';
            case 'in_progress': return 'In Progress';
            case 'on_hold': return 'On Hold';
            default: return status || 'Unknown';
        }
    };

    const getRoleName = (role) => {
        switch(role?.toUpperCase()) {
            case 'PM': return 'Organization';
            case 'FOREMAN': return 'Foreman';
            case 'CLIENT': return 'Client';
            case 'WORKER': return 'Worker';
            case 'SUBCONTRACTOR': return 'Subcontractor';
            default: return 'Project Command';
        }
    };

    return (
        <View style={styles.headerContainer}>
            {/* TOP ROW */}
            <View style={styles.topRow}>
                <View style={styles.leftSection}>
                    {showBack ? (
                        <View style={styles.backWrapper}>
                            <TouchableOpacity
                                style={styles.menuBtn}
                                onPress={() => navigation.goBack()}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                            {title && (
                                <View style={styles.headerAvatarMini}>
                                    <Text style={styles.headerAvatarText}>{title.charAt(0)}</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        (user?.role === 'FOREMAN' || user?.role === 'PM' || user?.role === 'CLIENT' || user?.role === 'SUBCONTRACTOR' || user?.role === 'WORKER') && (
                            <TouchableOpacity
                                style={styles.menuBtn}
                                onPress={() => {
                                    try {
                                        navigation.dispatch(DrawerActions.openDrawer());
                                    } catch (e) {
                                        navigation.navigate('MainTabs');
                                    }
                                }}
                            >
                                <MaterialCommunityIcons name="menu" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        )
                    )}
                </View>

                {showBranding && (
                    <View style={styles.centerBranding}>
                        {title ? (
                            <Text style={styles.brandTitle} numberOfLines={1}>{title}</Text>
                        ) : (
                            <Text style={styles.orgLabel}>Organization</Text>
                        )}
                    </View>
                )}

                {showRight && (
                    <View style={styles.iconSection}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Chatboard')}>
                            <View style={styles.notificationWrapper}>
                                <MaterialCommunityIcons name="chat-outline" size={24} color="#64748B" />
                                {unreadChatCount > 0 && (
                                    <View style={[styles.badge, { backgroundColor: '#3B82F6' }]}>
                                        <Text style={styles.badgeText}>{unreadChatCount}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconBtn} onPress={() => setIsNotifying(true)}>
                            <View style={styles.notificationWrapper}>
                                <MaterialCommunityIcons name="bell-outline" size={24} color="#64748B" />
                                {unreadCount > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{unreadCount}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <View style={styles.avatarInner}>
                                <Text style={styles.avatarText}>
                                    {(user?.fullName || user?.name || user?.role || 'U')[0].toUpperCase()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* BOTTOM ROW: Quick Select Job */}
            {!hideSearch && (
                <View style={styles.bottomRow}>
                    <TouchableOpacity
                        style={styles.searchBar}
                        onPress={() => setIsSearching(true)}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="magnify" size={18} color="#94A3B8" />
                        <Text style={[styles.searchPlaceholder, selectedProject && { color: '#0F172A', fontWeight: '800' }]} numberOfLines={1}>
                            {selectedProject ? selectedProject.name : 'Quick Select Job'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                </View>
            )}

            {/* NOTIFICATION MODAL */}
            <Modal visible={isNotifying} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '80%', marginTop: 60 }]}>
                        <View style={styles.modalSearchHeader}>
                            <Text style={styles.modalTitle}>Notifications</Text>
                            <TouchableOpacity onPress={() => setIsNotifying(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.resultsList}>
                            {notifications.length === 0 ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="bell-off-outline" size={48} color="#E2E8F0" />
                                    <Text style={{ marginTop: 10, color: '#94A3B8', fontWeight: '700' }}>All caught up!</Text>
                                </View>
                            ) : (
                                notifications.map((n, idx) => (
                                    <TouchableOpacity
                                        key={n._id || idx}
                                        style={[styles.resultItem, !n.isRead && { backgroundColor: '#F0F9FF' }]}
                                        onPress={() => {
                                            markNotificationAsRead(n._id);
                                            setIsNotifying(false); // Close notification modal
                                            
                                            // Dynamic Navigation based on notification type/content
                                            const type = (n.type || '').toLowerCase();
                                            const title = (n.title || '').toLowerCase();
                                            const msg = (n.message || '').toLowerCase();

                                            if (type === 'rfi' || title.includes('rfi') || msg.includes('rfi')) {
                                                navigation.navigate('RFI');
                                            } else if (type === 'task' || title.includes('task') || msg.includes('task')) {
                                                // Try navigating to Tasks. Works if screen is in stack or tab.
                                                navigation.navigate('Tasks');
                                            } else if (type === 'chat' || title.includes('message') || msg.includes('message')) {
                                                navigation.navigate('Chatboard');
                                            } else if (type === 'photo' || title.includes('photo') || msg.includes('photo')) {
                                                navigation.navigate('Photos');
                                            }
                                        }}
                                    >
                                        <View style={[styles.notifIcon, { backgroundColor: n.type === 'alert' ? '#FEF2F2' : '#EFF6FF' }]}>
                                            <MaterialCommunityIcons
                                                name={n.type === 'alert' ? 'alert-circle' : 'information'}
                                                size={18}
                                                color={n.type === 'alert' ? '#EF4444' : '#3B82F6'}
                                            />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.resultTitle, !n.isRead && { fontWeight: '900' }]}>{n.title}</Text>
                                            <Text style={styles.resultSubtitle} numberOfLines={2}>{n.message}</Text>
                                            <Text style={styles.notifTime}>{new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                        </View>
                                        {!n.isRead && <View style={styles.unreadDot} />}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* QUICK SELECT JOB MODAL — matches web exactly */}
            <Modal visible={isSearching} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { marginTop: 80 }]}>
                        {/* Search Input */}
                        <View style={styles.modalSearchHeader}>
                            <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Search Job / Site..."
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Section Label — matches web */}
                        <View style={styles.sectionLabel}>
                            <Text style={styles.sectionLabelText}>ACTIVE PROJECTS</Text>
                        </View>

                        <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
                            {filteredProjects.length > 0 ? (
                                filteredProjects.map((p) => (
                                    <TouchableOpacity
                                        key={p._id || p.id}
                                        style={[
                                            styles.projectItem,
                                            selectedProject?._id === (p._id || p.id) && styles.projectItemSelected
                                        ]}
                                        onPress={() => {
                                            setSelectedProject(p);
                                            setIsSearching(false);
                                            setSearchQuery('');
                                        }}
                                    >
                                        {/* Status dot — matches web colored dot */}
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(p.status) }]} />

                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.projectName} numberOfLines={1}>{p.name}</Text>
                                            {p.location ? (
                                                <Text style={styles.projectLocation} numberOfLines={1}>{p.location}</Text>
                                            ) : null}
                                        </View>

                                        {/* Status badge — matches web pill */}
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(p.status) + '18', borderColor: getStatusColor(p.status) + '40' }]}>
                                            <Text style={[styles.statusBadgeText, { color: getStatusColor(p.status) }]}>
                                                {getStatusLabel(p.status)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={{ padding: 32, alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="briefcase-off-outline" size={40} color="#E2E8F0" />
                                    <Text style={{ marginTop: 12, color: '#94A3B8', fontWeight: '700', fontSize: 13 }}>
                                        {searchQuery ? 'No matching projects' : 'No active projects'}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* View All button — matches web */}
                        <TouchableOpacity
                            style={styles.viewAllBtn}
                            onPress={() => {
                                setIsSearching(false);
                                setSearchQuery('');
                                // Navigate to Jobs tab (Foreman's project list) inside MainTabs
                                try {
                                    navigation.navigate('MainTabs', { screen: 'Jobs' });
                                } catch (e) {
                                    console.warn('Navigation to Jobs failed:', e.message);
                                }
                            }}
                        >
                            <Text style={styles.viewAllBtnText}>VIEW ALL PROJECTS</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'ios' ? 44 : 32,
        paddingBottom: 8,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        zIndex: 100,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    leftSection: {
        width: 44,
        justifyContent: 'center',
    },
    centerBranding: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandTitle: {
        fontSize: Dimensions.get('window').width < 360 ? 14 : 16,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    orgLabel: {
        fontSize: Dimensions.get('window').width < 360 ? 12 : 14,
        fontWeight: '900',
        color: '#2563EB',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    menuBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
        overflow: 'hidden',
        elevation: 4,
    },
    backWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatarMini: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    headerAvatarText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    avatarContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#F1F5F9',
        padding: 2,
    },
    avatarInner: {
        flex: 1,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#2563EB'
    },
    nameBox: {
        justifyContent: 'center',
    },
    userName: {
        fontSize: 15,
        fontWeight: '900',
        color: '#0F172A',
    },
    roleText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981', // Clean green as in screenshot
        marginTop: -3,
        letterSpacing: 0.5
    },
    iconSection: {
        flexDirection: 'row',
        gap: Platform.OS === 'ios' ? 8 : 4,
        alignItems: 'center',
        width: Platform.OS === 'ios' ? 110 : (Dimensions.get('window').width < 360 ? 90 : 105),
        justifyContent: 'flex-end',
    },
    iconBtn: {
        padding: 4,
    },
    notificationWrapper: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#F97316',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '900',
    },
    bottomRow: {
        width: '100%',
    },
    searchBar: {
        height: 44,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    searchPlaceholder: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        paddingTop: 100,
    },
    modalContent: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 20,
        maxHeight: '70%',
        ...SHADOWS.large,
    },
    modalSearchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    resultsList: {
        marginTop: 15,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    resultTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    resultSubtitle: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 2,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    notifIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifTime: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '700',
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3B82F6',
        marginLeft: 10,
    },

    // ── Quick Select Job: new styles ─────────────────────
    sectionLabel: {
        paddingHorizontal: 4,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
        marginBottom: 4,
    },
    sectionLabelText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    projectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    projectItemSelected: {
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        paddingHorizontal: 10,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        flexShrink: 0,
    },
    projectName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
    },
    projectLocation: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        borderWidth: 1,
        marginLeft: 8,
        flexShrink: 0,
    },
    statusBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    viewAllBtn: {
        marginTop: 12,
        width: '100%',
        paddingVertical: 14,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        alignItems: 'center',
    },
    viewAllBtnText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

export default WorkerHeader;

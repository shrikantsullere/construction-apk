import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, FlatList,
    ActivityIndicator, TouchableOpacity, Switch, Alert, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, SIZES } from '../../theme/theme';
import AppHeader from '../../components/AppHeader';
import api from '../../utils/api';
import { useApp } from '../../context/AppContext';

// ─── Shared Card ─────────────────────────────────────────────────────────────
const Card = ({ children }) => (
    <View style={[styles.card, SHADOWS.card]}>{children}</View>
);

const Badge = ({ label, color, bg }) => (
    <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
);

// ─── DAILY LOGS ──────────────────────────────────────────────────────────────
export const DailyLogsScreen = () => {
    const { user } = useApp();
    const [logs, setLogs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const fetchData = () => {
        setLoading(true);
        api.get('/daily-logs')
            .then(r => setLogs(r.data))
            .catch(() => setLogs([
                { _id: '1', date: '2026-02-21', project: 'Skyline Residence', supervisor: 'John Foreman', status: 'Submitted' },
                { _id: '2', date: '2026-02-20', project: 'Commercial Plaza', supervisor: 'Mike Anderson', status: 'Pending' },
            ]))
            .finally(() => setLoading(false));
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateStatus = (id, currentStatus) => {
        if (user.role !== 'COMPANY_OWNER' && user.role !== 'PM') return;

        const next = currentStatus === 'Pending' ? 'Submitted' : 'Pending';
        Alert.alert('Change Status', `Set log status to ${next}?`, [
            { text: 'Cancel' },
            {
                text: 'Update', onPress: async () => {
                    try {
                        await api.patch(`/daily-logs/${id}`, { status: next });
                        fetchData();
                    } catch (e) { Alert.alert('Error', 'Update failed'); }
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <AppHeader title="Daily Logs" showBack />
            {loading ? <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View> : (
                <FlatList
                    data={logs}
                    keyExtractor={(i, idx) => i._id || i.id || idx.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No logs found</Text>}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleUpdateStatus(item._id || item.id, item.status)}>
                            <Card>
                                <View style={styles.cardRow}>
                                    <View style={styles.iconBox}>
                                        <MaterialCommunityIcons name="file-document-edit-outline" size={20} color={COLORS.primary} />
                                    </View>
                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardTitle}>Log — {item.date}</Text>
                                        <Text style={styles.cardSub}>{item.project}</Text>
                                        <Text style={styles.cardMeta}>Supervisor: {item.supervisor}</Text>
                                    </View>
                                    <Badge
                                        label={item.status}
                                        color={item.status === 'Submitted' ? COLORS.success : COLORS.warning}
                                        bg={item.status === 'Submitted' ? COLORS.successLight : COLORS.warningLight}
                                    />
                                </View>
                            </Card>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

// ─── RFI ─────────────────────────────────────────────────────────────────────
export const RFIScreen = () => {
    const { user } = useApp();
    const [rfis, setRfis] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const fetchData = () => {
        setLoading(true);
        api.get('/rfis')
            .then(r => setRfis(r.data))
            .catch(() => setRfis([
                { _id: '1', title: 'Window Specification Clarification', project: 'Skyline Residence', from: 'Mike Foreman', status: 'Open', priority: 'High' },
                { _id: '2', title: 'Foundation Rebar Change', project: 'Commercial Plaza', from: 'Steve PM', status: 'Closed', priority: 'Medium' },
            ]))
            .finally(() => setLoading(false));
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateRFI = (id, currentStatus) => {
        if (user.role !== 'COMPANY_OWNER' && user.role !== 'PM') return;

        const next = currentStatus === 'Open' ? 'Closed' : 'Open';
        Alert.alert('RFI Status', `Mark this RFI as ${next}?`, [
            { text: 'Cancel' },
            {
                text: 'Yes', onPress: async () => {
                    try {
                        await api.patch(`/rfis/${id}`, { status: next });
                        fetchData();
                    } catch (e) { Alert.alert('Error', 'Update failed'); }
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <AppHeader title="RFI Management" showBack />
            {loading ? <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View> : (
                <FlatList
                    data={rfis}
                    keyExtractor={(i, idx) => i._id || i.id || idx.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No RFIs</Text>}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleUpdateRFI(item._id || item.id, item.status)}>
                            <Card>
                                <View style={styles.cardRow}>
                                    <View style={[styles.iconBox, { backgroundColor: COLORS.infoLight }]}>
                                        <MaterialCommunityIcons name="help-circle-outline" size={20} color={COLORS.info} />
                                    </View>
                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        <Text style={styles.cardSub}>{item.project}</Text>
                                        <Text style={styles.cardMeta}>From: {item.from} · {item.priority} Priority</Text>
                                    </View>
                                    <Badge
                                        label={item.status}
                                        color={item.status === 'Open' ? COLORS.warning : COLORS.success}
                                        bg={item.status === 'Open' ? COLORS.warningLight : COLORS.successLight}
                                    />
                                </View>
                            </Card>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

// ─── CHAT ─────────────────────────────────────────────────────────────────────
export const ChatScreen = () => {
    const [chats, setChats] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        api.get('/chats')
            .then(r => setChats(r.data))
            .catch(() => setChats([
                { id: '1', name: 'Project Managers Group', lastMessage: 'Foundation is ready ✅', time: '10:45 AM', unread: 2 },
                { id: '2', name: 'Mike Foreman', lastMessage: 'Need more rebar on site.', time: 'Yesterday', unread: 0 },
                { id: '3', name: 'Site Safety', lastMessage: 'Audit scheduled for Monday.', time: 'Mon', unread: 1 },
            ]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <View style={styles.container}>
            <AppHeader title="Company Chat" showBack />
            {loading ? <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View> : (
                <FlatList
                    data={chats}
                    keyExtractor={(i, idx) => i.id || i._id || idx.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No active chats</Text>}
                    renderItem={({ item }) => (
                        <Card>
                            <View style={styles.cardRow}>
                                <View style={[styles.avatarCircle, { backgroundColor: COLORS.primaryLight }]}>
                                    <Text style={[styles.avatarInitial, { color: COLORS.primary }]}>{item.name.charAt(0)}</Text>
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{item.name}</Text>
                                    <Text style={styles.cardMeta} numberOfLines={1}>{item.lastMessage}</Text>
                                </View>
                                <View style={styles.chatMeta}>
                                    <Text style={styles.chatTime}>{item.time}</Text>
                                    {item.unread > 0 && (
                                        <View style={styles.unreadBadge}>
                                            <Text style={styles.unreadText}>{item.unread}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </Card>
                    )}
                />
            )}
        </View>
    );
};

// ─── PURCHASE ORDERS ──────────────────────────────────────────────────────────
export const PurchaseOrdersScreen = () => {
    const [pos, setPos] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        api.get('/purchase-orders')
            .then(r => setPos(r.data))
            .catch(() => setPos([
                { id: '1', poNumber: 'PO-2026-001', vendor: 'Cement Co.', amount: '$2,500', status: 'Approved' },
                { id: '2', poNumber: 'PO-2026-002', vendor: 'Steel Works Ltd.', amount: '$5,800', status: 'Pending' },
            ]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <View style={styles.container}>
            <AppHeader title="Purchase Orders" showBack />
            {loading ? <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View> : (
                <FlatList
                    data={pos}
                    keyExtractor={(i, idx) => i.id || i._id || idx.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No purchase orders</Text>}
                    renderItem={({ item }) => (
                        <Card>
                            <View style={styles.cardRow}>
                                <View style={[styles.iconBox, { backgroundColor: COLORS.primaryLight }]}>
                                    <MaterialCommunityIcons name="clipboard-list-outline" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{item.poNumber}</Text>
                                    <Text style={styles.cardSub}>{item.vendor}</Text>
                                    <Text style={[styles.cardMeta, { color: COLORS.primary, fontWeight: '800' }]}>{item.amount}</Text>
                                </View>
                                <Badge
                                    label={item.status}
                                    color={item.status === 'Approved' ? COLORS.success : COLORS.warning}
                                    bg={item.status === 'Approved' ? COLORS.successLight : COLORS.warningLight}
                                />
                            </View>
                        </Card>
                    )}
                />
            )}
        </View>
    );
};

// ─── INVOICES ────────────────────────────────────────────────────────────────
export const InvoicesScreen = () => {
    const { user } = useApp();
    const [invoices, setInvoices] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const fetchData = () => {
        setLoading(true);
        api.get('/invoices')
            .then(r => setInvoices(r.data))
            .catch(() => setInvoices([
                { _id: '1', invoiceNumber: 'INV-001', client: 'Skyline Corp', amount: '$12,000', status: 'Paid' },
                { _id: '2', invoiceNumber: 'INV-002', client: 'City Dev Ltd.', amount: '$8,500', status: 'Unpaid' },
            ]))
            .finally(() => setLoading(false));
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const togglePayment = (id, current) => {
        if (user.role !== 'COMPANY_OWNER' && user.role !== 'SUPER_ADMIN') return;
        const next = current === 'Paid' ? 'Unpaid' : 'Paid';
        Alert.alert('Update Invoice', `Mark as ${next}?`, [
            { text: 'Cancel' },
            {
                text: 'Update', onPress: async () => {
                    try {
                        await api.patch(`/invoices/${id}`, { status: next });
                        fetchData();
                    } catch (e) { Alert.alert('Error', 'Update failed'); }
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <AppHeader title="Invoices" showBack />
            {loading ? <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View> : (
                <FlatList
                    data={invoices}
                    keyExtractor={(i, idx) => i._id || i.id || idx.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No invoices found</Text>}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => togglePayment(item._id || item.id, item.status)}>
                            <Card>
                                <View style={styles.cardRow}>
                                    <View style={[styles.iconBox, { backgroundColor: COLORS.successLight }]}>
                                        <MaterialCommunityIcons name="receipt" size={20} color={COLORS.success} />
                                    </View>
                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardTitle}>{item.invoiceNumber}</Text>
                                        <Text style={styles.cardSub}>{item.client}</Text>
                                        <Text style={[styles.cardMeta, { color: COLORS.primary, fontWeight: '800' }]}>{item.amount}</Text>
                                    </View>
                                    <Badge
                                        label={item.status}
                                        color={item.status === 'Paid' ? COLORS.success : COLORS.danger}
                                        bg={item.status === 'Paid' ? COLORS.successLight : COLORS.dangerLight}
                                    />
                                </View>
                            </Card>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

// ─── PAYROLL ─────────────────────────────────────────────────────────────────
export const PayrollScreen = () => {
    const [payroll, setPayroll] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        api.get('/payroll')
            .then(r => setPayroll(r.data))
            .catch(() => setPayroll([
                { id: '1', period: 'Feb 1 - Feb 15', status: 'Approved', totalAmount: '$4,200', employees: 5 },
                { id: '2', period: 'Jan 16 - Jan 31', status: 'Paid', totalAmount: '$3,800', employees: 4 },
            ]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <View style={styles.container}>
            <AppHeader title="Payroll" showBack />
            {loading ? <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View> : (
                <FlatList
                    data={payroll}
                    keyExtractor={(i, idx) => i.id || i._id || idx.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No payroll data</Text>}
                    renderItem={({ item }) => (
                        <Card>
                            <View style={styles.cardRow}>
                                <View style={[styles.iconBox, { backgroundColor: COLORS.successLight }]}>
                                    <MaterialCommunityIcons name="cash-multiple" size={20} color={COLORS.success} />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{item.period}</Text>
                                    <Text style={styles.cardSub}>{item.employees} employees</Text>
                                    <Text style={[styles.cardMeta, { color: COLORS.primary, fontWeight: '800' }]}>{item.totalAmount}</Text>
                                </View>
                                <Badge
                                    label={item.status}
                                    color={item.status === 'Paid' ? COLORS.success : COLORS.info}
                                    bg={item.status === 'Paid' ? COLORS.successLight : COLORS.infoLight}
                                />
                            </View>
                        </Card>
                    )}
                />
            )}
        </View>
    );
};

// ─── REPORTS ─────────────────────────────────────────────────────────────────
export const ReportsScreen = () => {
    const [reports, setReports] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        setTimeout(() => {
            setReports([
                { id: '1', name: 'Budget vs Actual Q1', type: 'Financial', date: '2026-02-15' },
                { id: '2', name: 'Site Safety Audit', type: 'Compliance', date: '2026-02-10' },
                { id: '3', name: 'Equipment Utilization', type: 'Operational', date: '2026-02-05' },
            ]);
            setLoading(false);
        }, 500);
    }, []);

    return (
        <View style={styles.container}>
            <AppHeader title="Business Reports" showBack />
            {loading ? <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View> : (
                <FlatList
                    data={reports}
                    keyExtractor={(i, idx) => i.id || i._id || idx.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No reports available</Text>}
                    renderItem={({ item }) => (
                        <Card>
                            <View style={styles.cardRow}>
                                <View style={[styles.iconBox, { backgroundColor: COLORS.dangerLight }]}>
                                    <MaterialCommunityIcons name="file-chart-outline" size={20} color={COLORS.danger} />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{item.name}</Text>
                                    <Text style={styles.cardSub}>{item.type}</Text>
                                    <Text style={styles.cardMeta}>Generated: {item.date}</Text>
                                </View>
                                <MaterialCommunityIcons name="download-outline" size={22} color={COLORS.primary} />
                            </View>
                        </Card>
                    )}
                />
            )}
        </View>
    );
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export const SettingsScreen = () => {
    const [notifications, setNotifications] = React.useState(true);
    const [biometrics, setBiometrics] = React.useState(false);
    const [darkMode, setDarkMode] = React.useState(false);

    const SettingRow = ({ icon, label, value, onValueChange, iconColor = COLORS.primary, iconBg = COLORS.primaryLight }) => (
        <Card>
            <View style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
                    <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
                </View>
                <Text style={styles.settingLabel}>{label}</Text>
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                    thumbColor="#fff"
                />
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <AppHeader title="Settings" showBack />
            <ScrollView contentContainerStyle={styles.list}>
                <Text style={styles.settingSection}>PREFERENCES</Text>
                <SettingRow icon="bell-outline" label="Push Notifications" value={notifications} onValueChange={setNotifications} />
                <SettingRow icon="fingerprint" label="Biometric Login" value={biometrics} onValueChange={setBiometrics} iconColor="#7C3AED" iconBg="#F5F3FF" />
                <SettingRow icon="theme-light-dark" label="Dark Mode" value={darkMode} onValueChange={setDarkMode} iconColor="#374151" iconBg="#F3F4F6" />

                <Text style={styles.settingSection}>SYSTEM</Text>
                {[
                    { icon: 'cloud-sync-outline', label: 'Sync Data', color: COLORS.success, bg: COLORS.successLight, gid: 's1' },
                    { icon: 'shield-check-outline', label: 'Privacy Policy', color: COLORS.info, bg: COLORS.infoLight, gid: 's2' },
                    { icon: 'help-circle-outline', label: 'Help & Support', color: COLORS.warning, bg: COLORS.warningLight, gid: 's3' },
                ].map((item) => (
                    <TouchableOpacity key={item.gid}>
                        <Card>
                            <View style={styles.settingRow}>
                                <View style={[styles.settingIcon, { backgroundColor: item.bg }]}>
                                    <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
                                </View>
                                <Text style={styles.settingLabel}>{item.label}</Text>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                            </View>
                        </Card>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

// ─── Shared Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: SPACING.m, paddingBottom: 60 },
    empty: { textAlign: 'center', marginTop: 60, color: COLORS.textSecondary, fontWeight: '600', fontSize: 15 },

    card: {
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radius,
        padding: SPACING.m,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center', alignItems: 'center',
    },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
    cardSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
    cardMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },

    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 10, fontWeight: '900' },

    avatarCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { fontSize: 18, fontWeight: '900' },

    chatMeta: { alignItems: 'flex-end', gap: 6 },
    chatTime: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
    unreadBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    unreadText: { color: '#fff', fontSize: 10, fontWeight: '900' },

    settingSection: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 1.5, marginTop: SPACING.m, marginBottom: SPACING.s },
    settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    settingIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    settingLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
});

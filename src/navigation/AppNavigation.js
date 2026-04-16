import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Added for premium look
import { COLORS } from '../constants/theme';
import { View, Platform, ActivityIndicator, Text, TouchableOpacity, Image } from 'react-native';
import { useApp } from '../context/AppContext';

// ── MODERN TAB BAR CONFIGURATION ──────────────────────────
const MODERN_TAB_BAR_STYLE = {
    backgroundColor: '#0F172A',
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 110 : 90,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    paddingTop: 0,
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
};

const MODERN_TAB_SCREEN_OPTIONS = {
    headerShown: false,
    tabBarActiveTintColor: '#3B82F6', // Vibrant Sky Blue
    tabBarInactiveTintColor: '#64748B', // Slate Muted
    tabBarStyle: MODERN_TAB_BAR_STYLE,
    tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 0,
    },
    tabBarHideOnKeyboard: true,
    tabBarBackground: () => (
        <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={{ flex: 1 }}
        />
    ),
};

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Main Screens
import DashboardScreen from '../screens/shared/DashboardScreen';
import ProjectDetailsScreen from '../screens/shared/ProjectDetailsScreen';
import TasksScreen from '../screens/shared/TasksScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import EquipmentScreen from '../screens/shared/EquipmentScreen';
import RFIScreen from '../screens/shared/RFIScreen';
import RFIListScreen from '../screens/shared/RFIListScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import PurchaseOrdersScreen from '../screens/shared/PurchaseOrdersScreen';
import ReportsScreen from '../screens/shared/ReportsScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import DailyLogsScreen from '../screens/shared/DailyLogsScreen';
import ProjectChatScreen from '../screens/shared/ProjectChatScreen';

// Worker Specific Screens
import WorkerDashboardScreen from '../screens/worker/WorkerDashboardScreen';
import WorkerJobsScreen from '../screens/worker/WorkerJobsScreen';
import WorkerTasksScreen from '../screens/worker/WorkerTasksScreen';
import WorkerDrawingsScreen from '../screens/worker/WorkerDrawingsScreen';
import WorkerPhotosScreen from '../screens/worker/WorkerPhotosScreen';
import WorkerChatboard from '../screens/worker/WorkerChatboard';
import WorkerLogsScreen from '../screens/worker/WorkerLogsScreen';
import WorkerChatScreen from '../screens/worker/WorkerChatScreen';
import WorkerProfileScreen from '../screens/worker/WorkerProfileScreen';
import WorkerJobTasksScreen from '../screens/worker/WorkerJobTasksScreen';
import WorkerTimeClockScreen from '../screens/worker/WorkerTimeClockScreen';


// Foreman Specific Screens
import ForemanDashboard from '../screens/foreman/ForemanDashboard';
import TradeManagementScreen from '../screens/foreman/TradeManagementScreen';
import CrewClockScreen from '../screens/foreman/CrewClockScreen';
import ForemanPhotosScreen from '../screens/foreman/ForemanPhotosScreen';
import ForemanTasksScreen from '../screens/foreman/ForemanTasksScreen';
import RFIDashboardScreen from '../screens/foreman/RFIDashboardScreen';
import ForemanRFIListScreen from '../screens/foreman/RFIListScreen';
import ForemanIssuesScreen from '../screens/foreman/ForemanIssuesScreen';
import ForemanEquipmentScreen from '../screens/foreman/ForemanEquipmentScreen';
import ForemanJobsScreen from '../screens/foreman/ForemanJobsScreen';

// Client Specific Screens
import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import ClientJobsScreen from '../screens/client/ClientJobsScreen';
import ClientInvoicesScreen from '../screens/client/ClientInvoicesScreen';
import ClientRFIScreen from '../screens/client/ClientRFIScreen';
import ClientPhotosScreen from '../screens/client/ClientPhotosScreen';
import ClientDrawingsScreen from '../screens/client/ClientDrawingsScreen';
import ClientProjectsScreen from '../screens/client/ClientProjectsScreen';

// Subcontractor Specific Screens
import SubcontractorDashboardScreen from '../screens/subcontractor/SubcontractorDashboardScreen';
import SubcontractorProjectsScreen from '../screens/subcontractor/SubcontractorProjectsScreen';

// PM Specific Screens
import ProjectManagerDashboardScreen from '../screens/project-manager/ProjectManagerDashboardScreen';
import ProjectManagerJobsScreen from '../screens/project-manager/ProjectManagerJobsScreen';
import ProjectManagerProfileScreen from '../screens/project-manager/ProjectManagerProfileScreen';
import ProjectManagerDrawingsScreen from '../screens/project-manager/ProjectManagerDrawingsScreen';
import ProjectManagerPhotosScreen from '../screens/project-manager/ProjectManagerPhotosScreen';
import PMCrewControlScreen from '../screens/project-manager/PMCrewControlScreen';
import PMProjectDetailScreen from '../screens/project-manager/PMProjectDetailScreen';



const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const ProjectStack = createStackNavigator();

// Projects Stack
const ProjectsStack = () => (
    <ProjectStack.Navigator screenOptions={{ headerShown: false }}>
        <ProjectStack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
    </ProjectStack.Navigator>
);

// Worker Dedicated Tabs
const WorkerTabs = () => (
    <Tab.Navigator
        sceneContainerStyle={{ backgroundColor: '#0F172A' }}
        screenOptions={MODERN_TAB_SCREEN_OPTIONS}
    >
        <Tab.Screen
            name="Dashboard"
            component={WorkerDashboardScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "view-dashboard" : "view-dashboard-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Jobs"
            component={WorkerJobsScreen}
            options={{
                tabBarLabel: 'Jobs',
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "office-building" : "office-building-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Tasks"
            component={WorkerTasksScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "calendar-check" : "calendar-check-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Drawings"
            component={WorkerDrawingsScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "floor-plan" : "floor-plan"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Photos"
            component={WorkerPhotosScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "camera-iris" : "camera-outline"} color={color} size={24} />
            }}
        />
    </Tab.Navigator>
);

// High-Fidelity Custom Drawer Content for Worker
const WorkerDrawerContent = (props) => {
    const { logout, user } = useApp();
    return (
        <DrawerContentScrollView {...props} style={{ backgroundColor: '#fff' }}>
            <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 12 }}>
                <Image 
                    source={require('../../assets/logo.webp')} 
                    style={{ width: 40, height: 40 }} 
                    resizeMode="contain" 
                />
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>WORKER PANEL</Text>
                <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '900', marginTop: 2, letterSpacing: 1 }}>{user?.fullName || 'VERIFIED FIELD STAFF'}</Text>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
                <DrawerItem
                    label="Home Dashboard"
                    icon={({ color }) => <MaterialCommunityIcons name="view-dashboard" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('MainTabs')}
                    labelStyle={{ fontWeight: '800', fontSize: 13 }}
                />
                
                <DrawerItem
                    label="Site Check-In (My Clock)"
                    icon={({ color }) => <MaterialCommunityIcons name="clock-check" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('TimeClock')}
                    labelStyle={{ fontWeight: '800', fontSize: 13 }}
                />

                <DrawerItem
                    label="Site Discussions"
                    icon={({ color }) => <MaterialCommunityIcons name="message-text" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('Chatboard')}
                    labelStyle={{ fontWeight: '800', fontSize: 13 }}
                />

                <View style={{ height: 20 }} />
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16, marginBottom: 30 }}
                    onPress={logout}
                >
                    <MaterialCommunityIcons name="logout-variant" size={22} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: '900', marginLeft: 12 }}>LOGOUT</Text>
                </TouchableOpacity>
            </View>
        </DrawerContentScrollView>
    );
};

const WorkerDrawer = () => (
    <Drawer.Navigator
        drawerContent={(props) => <WorkerDrawerContent {...props} />}
        screenOptions={{
            headerShown: false,
            drawerActiveBackgroundColor: '#EFF6FF',
            drawerActiveTintColor: '#2563EB',
            drawerInactiveTintColor: '#64748B',
            drawerLabelStyle: { fontWeight: '800', fontSize: 13, marginLeft: -10 }
        }}
    >
        <Drawer.Screen name="MainTabs" component={WorkerTabs} />
        <Drawer.Screen name="TimeClock" component={WorkerTimeClockScreen} />
        <Drawer.Screen name="WorkerLogs" component={WorkerLogsScreen} options={{ title: 'Time & Attendance' }} />
        <Drawer.Screen name="RFI" component={RFIScreen} />
        <Drawer.Screen name="Profile" component={ProfileScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
        <Drawer.Screen name="Chatboard" component={WorkerChatboard} />
    </Drawer.Navigator>
);

// Foreman Dedicated Tabs
const ForemanTabs = () => (
    <Tab.Navigator
        sceneContainerStyle={{ backgroundColor: '#0F172A' }}
        screenOptions={MODERN_TAB_SCREEN_OPTIONS}
    >
        <Tab.Screen
            name="Dashboard"
            component={ForemanDashboard}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "view-dashboard" : "view-dashboard-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Tasks"
            component={ForemanTasksScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "calendar-check" : "calendar-check-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Jobs"
            component={ForemanJobsScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "office-building" : "office-building-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Drawings"
            component={WorkerDrawingsScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "floor-plan" : "floor-plan"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Photos"
            component={ForemanPhotosScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "camera-iris" : "camera-outline"} color={color} size={24} />
            }}
        />
    </Tab.Navigator>
);

// High-Fidelity Custom Drawer Content for Foreman
const ForemanDrawerContent = (props) => {
    const { logout } = useApp();
    return (
        <DrawerContentScrollView {...props} style={{ backgroundColor: '#fff' }}>
            <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 12 }}>
                <Image 
                    source={require('../../assets/logo.webp')} 
                    style={{ width: 40, height: 40 }} 
                    resizeMode="contain" 
                />
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>FOREMAN CONTROL</Text>
                <Text style={{ fontSize: 10, color: '#3B82F6', fontWeight: '900', marginTop: 2, letterSpacing: 1 }}>SITE OPERATIONS HUB</Text>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginVertical: 12, marginLeft: 16 }}>FIELD OPERATIONS</Text>
                <DrawerItem
                    label="Home Dashboard"
                    icon={({ color }) => <MaterialCommunityIcons name="view-dashboard" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('MainTabs')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="Clock In Crew"
                    icon={({ color }) => <MaterialCommunityIcons name="account-group" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('CrewClock')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="Daily Logs"
                    icon={({ color }) => <MaterialCommunityIcons name="file-document-edit" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('DailyLogs')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="Issues / Snags"
                    icon={({ color }) => <MaterialCommunityIcons name="alert-circle" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('ForemanIssues')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="Equipment Tracking"
                    icon={({ color }) => <MaterialCommunityIcons name="hammer-wrench" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('Equipment')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="Site Photos"
                    icon={({ color }) => <MaterialCommunityIcons name="camera-image" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('Photos')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="Purchase Orders"
                    icon={({ color }) => <MaterialCommunityIcons name="receipt" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('PurchaseOrders')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="Site Discussions"
                    icon={({ color }) => <MaterialCommunityIcons name="message-text" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('Chatboard')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />

                <View style={{ height: 20 }} />
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16, marginBottom: 30 }}
                    onPress={logout}
                >
                    <MaterialCommunityIcons name="logout-variant" size={22} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: '900', marginLeft: 12 }}>LOGOUT</Text>
                </TouchableOpacity>
            </View>
        </DrawerContentScrollView>
    );
};

const ForemanDrawer = () => (
    <Drawer.Navigator
        drawerContent={(props) => <ForemanDrawerContent {...props} />}
        screenOptions={{
            headerShown: false,
            drawerActiveBackgroundColor: '#EFF6FF',
            drawerActiveTintColor: '#2563EB',
            drawerInactiveTintColor: '#64748B',
            drawerLabelStyle: { fontWeight: '800', fontSize: 13, marginLeft: -10 }
        }}
    >
        <Drawer.Screen name="MainTabs" component={ForemanTabs} />
        <Drawer.Screen name="TimeClock" component={WorkerTimeClockScreen} />
        <Drawer.Screen name="CrewClock" component={CrewClockScreen} />
        <Drawer.Screen name="DailyLogs" component={DailyLogsScreen} />
        <Drawer.Screen name="TradeManagement" component={TradeManagementScreen} />
        <Drawer.Screen name="Tasks" component={TasksScreen} />
        <Drawer.Screen name="ForemanTasks" component={ForemanTasksScreen} />
        <Drawer.Screen name="RFIDashboard" component={RFIDashboardScreen} />
        <Drawer.Screen name="RFIList" component={ForemanRFIListScreen} />
        <Drawer.Screen name="ForemanIssues" component={ForemanIssuesScreen} />
        <Drawer.Screen name="Photos" component={ForemanPhotosScreen} />
        <Drawer.Screen name="Equipment" component={EquipmentScreen} />
        <Drawer.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
        <Drawer.Screen name="Chatboard" component={WorkerChatboard} />
    </Drawer.Navigator>
);

// High-Fidelity Custom Drawer Content for Client
const ClientDrawerContent = (props) => {
    const { logout, user } = useApp();
    return (
        <DrawerContentScrollView {...props} style={{ backgroundColor: '#fff' }}>
            <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 12 }}>
                <Image 
                    source={require('../../assets/logo.webp')} 
                    style={{ width: 40, height: 40 }} 
                    resizeMode="contain" 
                />
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>CLIENT HUB</Text>
                <Text style={{ fontSize: 10, color: '#6366F1', fontWeight: '900', marginTop: 2, letterSpacing: 1 }}>{user?.companyName || 'PREMIUM ACCESS'}</Text>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginVertical: 12, marginLeft: 16 }}>PORTFOLIO CONTROL</Text>
                <DrawerItem
                    label="Home Dashboard"
                    icon={({ color }) => <MaterialCommunityIcons name="view-dashboard" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('MainTabs')}
                    labelStyle={{ fontWeight: '800', fontSize: 13 }}
                />

                <Text style={{ fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginVertical: 12, marginLeft: 16 }}>FINANCIALS & RFIS</Text>
                <DrawerItem
                    label="Project Invoices"
                    icon={({ color }) => <MaterialCommunityIcons name="file-document-outline" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('ClientInvoices')}
                    labelStyle={{ fontWeight: '800', fontSize: 13 }}
                />
                <DrawerItem
                    label="RFI Center"
                    icon={({ color }) => <MaterialCommunityIcons name="frequently-asked-questions" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('ClientRFI')}
                    labelStyle={{ fontWeight: '800', fontSize: 13 }}
                />
                <DrawerItem
                    label="Site Discussions"
                    icon={({ color }) => <MaterialCommunityIcons name="message-text" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('Chatboard')}
                    labelStyle={{ fontWeight: '800', fontSize: 13 }}
                />

                <Text style={{ fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginVertical: 12, marginLeft: 16 }}>ACCOUNT</Text>
                <DrawerItem
                    label="Settings"
                    icon={({ color }) => <MaterialCommunityIcons name="cog" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('Settings')}
                    labelStyle={{ fontWeight: '800', fontSize: 13 }}
                />

                <View style={{ height: 40 }} />
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16, marginBottom: 30 }}
                    onPress={logout}
                >
                    <MaterialCommunityIcons name="logout-variant" size={22} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: '900', marginLeft: 12 }}>LOGOUT</Text>
                </TouchableOpacity>
            </View>
        </DrawerContentScrollView>
    );
};

// Client Dedicated Tabs
const ClientTabs = () => (
    <Tab.Navigator
        sceneContainerStyle={{ backgroundColor: '#0F172A' }}
        screenOptions={MODERN_TAB_SCREEN_OPTIONS}
    >
        <Tab.Screen
            name="Dashboard"
            component={ClientDashboardScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "view-dashboard" : "view-dashboard-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Projects"
            component={ClientProjectsScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "briefcase" : "briefcase-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Photos"
            component={ClientPhotosScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "camera-iris" : "camera-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Drawings"
            component={ClientDrawingsScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "floor-plan" : "floor-plan"} color={color} size={24} />
            }}
        />
    </Tab.Navigator>
);

const ClientDrawer = () => (
    <Drawer.Navigator
        drawerContent={(props) => <ClientDrawerContent {...props} />}
        screenOptions={{
            headerShown: false,
            drawerActiveBackgroundColor: '#EFF6FF',
            drawerActiveTintColor: '#2563EB',
            drawerInactiveTintColor: '#64748B',
            drawerLabelStyle: { fontWeight: '800', fontSize: 13, marginLeft: -10 }
        }}
    >
        <Drawer.Screen name="MainTabs" component={ClientTabs} />
        <Drawer.Screen name="ClientInvoices" component={ClientInvoicesScreen} />
        <Drawer.Screen name="ClientRFI" component={ClientRFIScreen} />
        <Drawer.Screen name="Chatboard" component={WorkerChatboard} />
    </Drawer.Navigator>
);

// High-Fidelity Custom Drawer Content for Project Manager
const ProjectManagerDrawerContent = (props) => {
    const { logout } = useApp();
    return (
        <DrawerContentScrollView {...props} style={{ backgroundColor: '#fff' }}>
            <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 12 }}>
                <Image 
                    source={require('../../assets/logo.webp')} 
                    style={{ width: 40, height: 40 }} 
                    resizeMode="contain" 
                />
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>KAAL CONTROL</Text>
                <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '900', marginTop: 2, letterSpacing: 1 }}>PROJECT MANAGEMENT OPS</Text>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginVertical: 12, marginLeft: 16 }}>DASHBOARD OVERVIEW</Text>
                <DrawerItem
                    label="Home Dashboard"
                    icon={({ color }) => <MaterialCommunityIcons name="view-dashboard" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('MainTabs')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />

                <Text style={{ fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginVertical: 12, marginLeft: 16 }}>FIELD OPERATIONS</Text>
                <DrawerItem
                    label="Clock In Crew"
                    icon={({ color }) => <MaterialCommunityIcons name="account-group" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('CrewClock')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="Daily Logs"
                    icon={({ color }) => <MaterialCommunityIcons name="file-document-edit" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('DailyLogs')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="Foreman Management"
                    icon={({ color }) => <MaterialCommunityIcons name="hard-hat" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('ForemanDashboard')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="Issues"
                    icon={({ color }) => <MaterialCommunityIcons name="alert-circle" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('ForemanIssues')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="GPS Tracking"
                    icon={({ color }) => <MaterialCommunityIcons name="crosshairs-gps" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('MainTabs')} // Placeholder route
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
<View style={{ height: 1 }} />

                <Text style={{ fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginVertical: 12, marginLeft: 16 }}>SITE DOCUMENTATION</Text>
                <DrawerItem
                    label="Equipment"
                    icon={({ color }) => <MaterialCommunityIcons name="hammer-wrench" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('Equipment')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="Purchase Orders"
                    icon={({ color }) => <MaterialCommunityIcons name="receipt" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('PurchaseOrders')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />

                <Text style={{ fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginVertical: 12, marginLeft: 16 }}>COMMUNICATIONS</Text>
                <DrawerItem
                    label="RFI Center"
                    icon={({ color }) => <MaterialCommunityIcons name="frequently-asked-questions" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('RFI')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="Report Logs"
                    icon={({ color }) => <MaterialCommunityIcons name="chart-box" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('Reports')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />
                <DrawerItem
                    label="Site Discussions"
                    icon={({ color }) => <MaterialCommunityIcons name="message-text" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('Chatboard')}
                    labelStyle={{ fontWeight: '800', fontSize: 14 }}
                />

                <View style={{ height: 40 }} />
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16, marginBottom: 30 }}
                    onPress={logout}
                >
                    <MaterialCommunityIcons name="logout-variant" size={22} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: '900', marginLeft: 12 }}>LOGOUT</Text>
                </TouchableOpacity>
            </View>
        </DrawerContentScrollView>
    );
};


// Project Manager Dedicated Tabs (5 Items as requested)
const ProjectManagerTabs = () => (
    <Tab.Navigator
        sceneContainerStyle={{ backgroundColor: '#0F172A' }}
        screenOptions={MODERN_TAB_SCREEN_OPTIONS}
    >
        <Tab.Screen
            name="ProjectManagerHome"
            component={ProjectManagerDashboardScreen}
            options={{
                tabBarLabel: 'Dashboard',
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "view-dashboard" : "view-dashboard-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Jobs"
            component={ProjectManagerJobsScreen}
            options={{
                tabBarLabel: 'Jobs',
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "office-building" : "office-building-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Tasks"
            component={TasksScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "calendar-check" : "calendar-check-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Drawings"
            component={ProjectManagerDrawingsScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "floor-plan" : "floor-plan"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Photos"
            component={ProjectManagerPhotosScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "camera-iris" : "camera-outline"} color={color} size={24} />
            }}
        />
    </Tab.Navigator>
);

const ProjectManagerDrawer = () => (
    <Drawer.Navigator
        drawerContent={(props) => <ProjectManagerDrawerContent {...props} />}
        screenOptions={{
            headerShown: false,
            drawerActiveBackgroundColor: '#EFF6FF',
            drawerActiveTintColor: '#2563EB',
            drawerInactiveTintColor: '#64748B',
            drawerLabelStyle: { fontWeight: '800', fontSize: 13, marginLeft: -10 },
            drawerType: 'front'
        }}
    >
        <Drawer.Screen name="MainTabs" component={ProjectManagerTabs} />
        <Drawer.Screen name="TimeClock" component={WorkerTimeClockScreen} />
        <Drawer.Screen name="CrewClock" component={PMCrewControlScreen} />
        <Drawer.Screen name="DailyLogs" component={DailyLogsScreen} />
        <Drawer.Screen name="RFI" component={RFIScreen} />
        <Drawer.Screen name="RFIList" component={RFIListScreen} />
        <Drawer.Screen name="Reports" component={ReportsScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
        <Drawer.Screen name="Chatboard" component={WorkerChatboard} />
        <Drawer.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
        <Drawer.Screen name="Equipment" component={EquipmentScreen} />
        <Drawer.Screen name="TradeManagement" component={TradeManagementScreen} />
        <Drawer.Screen name="ForemanIssues" component={ForemanIssuesScreen} />
        <Drawer.Screen name="WorkerLogs" component={WorkerLogsScreen} />
        <Drawer.Screen name="ProjectManagerDrawings" component={WorkerDrawingsScreen} />
        <Drawer.Screen name="ProjectManagerPhotos" component={ProjectManagerPhotosScreen} />
        <Drawer.Screen name="ProjectManagerProfile" component={ProjectManagerProfileScreen} />
        <Drawer.Screen name="PMProjectDetail" component={PMProjectDetailScreen} />
        <Drawer.Screen name="ForemanDashboard" component={ForemanDashboardScreen} />
    </Drawer.Navigator>
);

// High-Fidelity Custom Drawer Content for Subcontractor
const SubcontractorDrawerContent = (props) => {
    const { logout, user } = useApp();
    return (
        <DrawerContentScrollView {...props} style={{ backgroundColor: '#fff' }}>
            <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 12 }}>
                <Image 
                    source={require('../../assets/logo.webp')} 
                    style={{ width: 40, height: 40 }} 
                    resizeMode="contain" 
                />
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>CONTRACTOR PORTAL</Text>
                <Text style={{ fontSize: 10, color: COLORS.primary, fontWeight: '900', marginTop: 2, letterSpacing: 1 }}>{user?.fullName || 'VERIFIED PARTNER'}</Text>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
                <DrawerItem
                    label="Home Dashboard"
                    icon={({ color }) => <MaterialCommunityIcons name="view-dashboard" size={22} color={color} />}
                    onPress={() => props.navigation.navigate('MainTabs')}
                    labelStyle={{ fontWeight: '800', fontSize: 13 }}
                />

                <View style={{ height: 40 }} />
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16, marginBottom: 30 }}
                    onPress={logout}
                >
                    <MaterialCommunityIcons name="logout-variant" size={22} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: '900', marginLeft: 12 }}>LOGOUT</Text>
                </TouchableOpacity>
            </View>
        </DrawerContentScrollView>
    );
};

// Subcontractor Dedicated Tabs
const SubcontractorTabs = () => (
    <Tab.Navigator
        sceneContainerStyle={{ backgroundColor: '#0F172A' }}
        screenOptions={MODERN_TAB_SCREEN_OPTIONS}
    >
        <Tab.Screen
            name="Dashboard"
            component={SubcontractorDashboardScreen}
            options={{
                tabBarLabel: 'Dashboard',
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "view-dashboard" : "view-dashboard-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Jobs"
            component={SubcontractorProjectsScreen}
            options={{
                tabBarLabel: 'Projects',
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "briefcase-check" : "briefcase-check-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Tasks"
            component={WorkerTasksScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "calendar-check" : "calendar-check-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="Photos"
            component={ForemanPhotosScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "camera" : "camera-outline"} color={color} size={24} />
            }}
        />
        <Tab.Screen
            name="RFI"
            component={RFIScreen}
            options={{
                tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? "file-document-alert" : "file-document-alert-outline"} color={color} size={24} />
            }}
        />
    </Tab.Navigator>
);

const SubcontractorDrawer = () => (
    <Drawer.Navigator
        drawerContent={(props) => <SubcontractorDrawerContent {...props} />}
        screenOptions={{
            headerShown: false,
            drawerActiveBackgroundColor: '#EFF6FF',
            drawerActiveTintColor: COLORS.primary,
            drawerInactiveTintColor: '#64748B',
            drawerLabelStyle: { fontWeight: '800', fontSize: 13, marginLeft: -10 }
        }}
    >
        <Drawer.Screen name="MainTabs" component={SubcontractorTabs} />
    </Drawer.Navigator>
);


// Main Bottom Tabs
const MainTabs = () => {
    const { user } = useApp();
    const role = user?.role || 'WORKER';

    if (role === 'WORKER') return <WorkerDrawer />;
    if (role === 'FOREMAN') return <ForemanDrawer />;
    if (role === 'PM') return <ProjectManagerDrawer />;
    if (role === 'CLIENT') return <ClientDrawer />;
    if (role === 'SUBCONTRACTOR') return <SubcontractorDrawer />;


    return (
        <Tab.Navigator
            key={role}
            sceneContainerStyle={{ backgroundColor: '#0F172A' }}
            screenOptions={MODERN_TAB_SCREEN_OPTIONS}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{
                    tabBarLabel: role === 'SUBCONTRACTOR' ? 'Subcontractor' : 'Dashboard',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons
                            name={focused ? 'view-dashboard' : 'view-dashboard'}
                            color={color}
                            size={24}
                        />
                    )
                }}
            />

            {(role === 'PM' || role === 'FOREMAN' || role === 'SUBCONTRACTOR' || role === 'CLIENT') && (
                <Tab.Screen
                    name="Projects"
                    component={ProjectsStack}
                    options={{
                        tabBarLabel: role === 'CLIENT' ? 'My Projects' : 'Projects',
                        tabBarIcon: ({ color, focused }) => (
                            <MaterialCommunityIcons
                                name={focused ? 'briefcase' : 'briefcase-outline'}
                                color={color}
                                size={24}
                            />
                        )
                    }}
                />
            )}

            {(role !== 'CLIENT' && role !== 'WORKER') && (
                <Tab.Screen
                    name="Execution"
                    component={TasksScreen}
                    options={{
                        tabBarLabel: 'Jobs',
                        tabBarIcon: ({ color, focused }) => (
                            <MaterialCommunityIcons
                                name={focused ? 'checkbox-marked-circle' : 'checkbox-marked-circle-outline'}
                                color={color}
                                size={24}
                            />
                        )
                    }}
                />
            )}

            {(role === 'PM' || role === 'FOREMAN' || role === 'SUBCONTRACTOR') && (
                <Tab.Screen
                    name="Timesheets"
                    component={DailyLogsScreen}
                    options={{
                        tabBarLabel: 'Daily Log',
                        tabBarIcon: ({ color, focused }) => (
                            <MaterialCommunityIcons
                                name={focused ? 'clock-time-five' : 'clock-time-five-outline'}
                                color={color}
                                size={24}
                            />
                        )
                    }}
                />
            )}

            <Tab.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    tabBarLabel: 'Chat',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons
                            name={focused ? 'message-text' : 'message-text-outline'}
                            color={color}
                            size={24}
                        />
                    )
                }}
            />
        </Tab.Navigator>
    );
};


// Root Navigator
const AppNavigation = () => {
    const { user, loading } = useApp();

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.primaryDark, justifyContent: 'center', alignItems: 'center' }}>
                <Image 
                    source={require('../../assets/logo.webp')} 
                    style={{ width: 80, height: 80, marginBottom: 24 }} 
                    resizeMode="contain" 
                />
                <ActivityIndicator size="large" color={COLORS.primaryAccent} />
                <View style={{ marginTop: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1.5, opacity: 0.8 }}>
                        SECURING YOUR SESSION
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', marginTop: 4 }}>
                        KAAL ERP PRO • ASIA PACIFIC
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen name="Equipment" component={EquipmentScreen} />
                        <Stack.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
                        <Stack.Screen name="Invoices" component={ClientInvoicesScreen} />
                        <Stack.Screen name="Reports" component={ReportsScreen} />
                        <Stack.Screen name="RFI" component={RFIScreen} />
                        <Stack.Screen name="RFIList" component={RFIListScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="ProjectChat" component={ProjectChatScreen} />
                        <Stack.Screen name="WorkerChat" component={WorkerChatScreen} />
                        <Stack.Screen name="Chatboard" component={WorkerChatboard} />
                        <Stack.Screen name="JobTasks" component={WorkerJobTasksScreen} />
                        <Stack.Screen name="ClientJobs" component={ClientJobsScreen} />
                        <Stack.Screen name="Drawings" component={WorkerDrawingsScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigation;

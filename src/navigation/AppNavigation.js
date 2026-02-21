import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';
import { View, Platform, ActivityIndicator, Text } from 'react-native';
import { useApp } from '../context/AppContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterCompanyScreen from '../screens/auth/RegisterCompanyScreen';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import ProjectsScreen from '../screens/main/ProjectsScreen';
import ProjectDetailsScreen from '../screens/main/ProjectDetailsScreen';
import TasksScreen from '../screens/main/TasksScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import EquipmentScreen from '../screens/main/EquipmentScreen';
import {
    DailyLogsScreen,
    RFIScreen,
    ChatScreen,
    PurchaseOrdersScreen,
    InvoicesScreen,
    PayrollScreen,
    ReportsScreen,
    SettingsScreen,
    TeamManagementScreen
} from '../screens/main/MenuScreens';
import TeamScreen from '../screens/main/TeamManagementScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const ProjectStack = createStackNavigator();

// Projects Stack
const ProjectsStack = () => (
    <ProjectStack.Navigator screenOptions={{ headerShown: false }}>
        <ProjectStack.Screen name="ProjectList" component={ProjectsScreen} />
        <ProjectStack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
    </ProjectStack.Navigator>
);

// Main Bottom Tabs
const MainTabs = () => {
    const { user } = useApp();
    const role = user?.role || 'WORKER';

    return (
        <Tab.Navigator
            key={role}
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarStyle: {
                    backgroundColor: COLORS.card,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.border,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
                    paddingTop: 8,
                    elevation: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '800',
                    marginTop: -2,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Dashboard',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons
                            name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
                            color={color}
                            size={24}
                        />
                    )
                }}
            />

            {(role === 'SUPER_ADMIN' || role === 'COMPANY_OWNER' || role === 'PM' || role === 'FOREMAN' || role === 'SUBCONTRACTOR' || role === 'CLIENT') && (
                <Tab.Screen
                    name="Jobs"
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

            {(role !== 'CLIENT') && (
                <Tab.Screen
                    name="Execution"
                    component={TasksScreen}
                    options={{
                        tabBarLabel: 'Tasks',
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

            {(role === 'SUPER_ADMIN' || role === 'COMPANY_OWNER' || role === 'PM') && (
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
                <View style={{
                    width: 100, height: 100, borderRadius: 25,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    justifyContent: 'center', alignItems: 'center',
                    marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
                }}>
                    <MaterialCommunityIcons name="crane" size={48} color="#fff" />
                </View>
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
                        <Stack.Screen name="RegisterCompany" component={RegisterCompanyScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen name="Equipment" component={EquipmentScreen} />
                        <Stack.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
                        <Stack.Screen name="Invoices" component={InvoicesScreen} />
                        <Stack.Screen name="Payroll" component={PayrollScreen} />
                        <Stack.Screen name="Reports" component={ReportsScreen} />
                        <Stack.Screen name="RFI" component={RFIScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="TeamManagement" component={TeamScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigation;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { COLORS } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';

import { OverviewTab } from '../projects/OverviewTab';
import { ProjectTasksTab } from '../projects/ProjectTasksTab';
import { PhotosTab } from '../projects/PhotosTab';
import { IssuesTab } from '../projects/IssuesTab';
import { ChatTab } from '../projects/ChatTab';

const Tab = createMaterialTopTabNavigator();

import { useApp } from '../../context/AppContext';

const ProjectDetailsScreen = ({ route, navigation }) => {
    const { project } = route.params;
    const { user, refreshData } = useApp();
    const isWorker = user?.role === 'WORKER';

    React.useEffect(() => {
        refreshData();
    }, []);

    return (
        <View style={styles.container}>
            <AppHeader
                title={project.name}
                showBack
                onBack={() => navigation.goBack()}
                rightIcon="dots-vertical"
            />
            <Tab.Navigator
                screenOptions={{
                    tabBarScrollEnabled: true,
                    tabBarActiveTintColor: COLORS.primary,
                    tabBarInactiveTintColor: COLORS.textSecondary,
                    tabBarIndicatorStyle: { backgroundColor: COLORS.primary, height: 3 },
                    tabBarStyle: { backgroundColor: COLORS.background },
                    tabBarItemStyle: { width: 100 },
                    tabBarLabelStyle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
                }}
            >
                <Tab.Screen name="Overview">
                    {() => <OverviewTab project={project} />}
                </Tab.Screen>
                <Tab.Screen name="Jobs">
                    {() => <ProjectTasksTab project={project} />}
                </Tab.Screen>
                <Tab.Screen name="Photos">
                    {() => <PhotosTab project={project} />}
                </Tab.Screen>
                <Tab.Screen name="Issues">
                    {() => <IssuesTab project={project} />}
                </Tab.Screen>
                <Tab.Screen name="Chat">
                    {() => <ChatTab project={project} />}
                </Tab.Screen>
            </Tab.Navigator>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
});

export default ProjectDetailsScreen;

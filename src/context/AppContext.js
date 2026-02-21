import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_ISSUES, MOCK_MESSAGES, MOCK_USER, MOCK_ACTIVITY } from '../mock/data';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [issues, setIssues] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [clockInTime, setClockInTime] = useState(null);
    const [clockOutTime, setClockOutTime] = useState(null);
    const [activities, setActivities] = useState([]);
    const [metrics, setMetrics] = useState({});
    const [uploadNotes, setUploadNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Persist login state
    useEffect(() => {
        checkToken();
    }, []);

    const checkToken = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const savedUser = await AsyncStorage.getItem('user');
            if (token && savedUser) {
                setUser(JSON.parse(savedUser));
                fetchInitialData();
            }
        } catch (e) {
            console.error('Auth check error', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            const [projRes, actsRes] = await Promise.all([
                api.get('/projects').catch(e => ({ data: MOCK_PROJECTS })),
                api.get('/reports/stats').catch(e => ({ data: { metrics: { activeJobs: 5, crewOnSiteCount: 12 } } }))
            ]);

            if (projRes?.data) setProjects(Array.isArray(projRes.data) ? projRes.data : MOCK_PROJECTS);
            if (actsRes?.data?.metrics) setMetrics(actsRes.data.metrics);
            if (actsRes?.data?.myRecentActivity) setActivities(actsRes.data.myRecentActivity);
            else if (!activities.length) setActivities(MOCK_ACTIVITY);

        } catch (e) {
            console.error('Data fetch error', e);
            setProjects(MOCK_PROJECTS);
            setActivities(MOCK_ACTIVITY);
            setMetrics({ activeJobs: 5, crewOnSiteCount: 12, hoursToday: 48, pendingApprovals: 3 });
        }
    };

    const login = async (email, password) => {
        try {
            console.log('--- API LOGIN START ---', { email, url: api.defaults.baseURL });
            const res = await api.post('/auth/login',
                { email, password },
                { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } }
            );

            const { token } = res.data;
            const userData = res.data; // In this API, the root object is the user data

            console.log('User Data received:', { role: userData?.role, hasToken: !!token });

            if (token) await AsyncStorage.setItem('token', token);
            if (userData && userData.role) {
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                console.log('User state updated, navigating...');
            } else {
                console.warn('Login success but userData/role missing:', res.data);
                throw new Error('Invalid user data received from server');
            }

            fetchInitialData();
            return { success: true };
        } catch (error) {
            console.log('--- API LOGIN ERROR ---', error.response?.status || error.message);
            console.error('Full Error:', error.response?.data || error);

            // KAAL Backend Fallback for testing UI when backend is 401/500
            const kaalRoles = {
                'super@admin.com': { id: 's1', name: 'SUPER ADMIN', role: 'SUPER_ADMIN' },
                'jay@gmail.com': { id: 'c1', name: 'JAY (ADMIN)', role: 'COMPANY_OWNER' },
                'pm@kaal.ca': { id: 'p1', name: 'PM MANAGER', role: 'PM' },
                'foreman@kaal.ca': { id: 'f1', name: 'FOREMAN', role: 'FOREMAN' },
                'worker@kaal.ca': { id: 'w1', name: 'WORKER', role: 'WORKER' },
                'subcontractor@kaal.ca': { id: 'sb1', name: 'SUBCONTRACTOR', role: 'SUBCONTRACTOR' },
                'client@kaal.ca': { id: 'cl1', name: 'CLIENT PORTAL', role: 'CLIENT' },
            };

            if (kaalRoles[email]) {
                console.log('--- USING FALLBACK MOCK LOGIN ---', email);
                const mockUser = { ...kaalRoles[email], email };
                await AsyncStorage.setItem('token', 'demo-token-12345');
                await AsyncStorage.setItem('user', JSON.stringify(mockUser));
                setUser(mockUser);
                fetchInitialData();
                return { success: true };
            }

            return { success: false, message: error.response?.data?.message || 'Unauthorized: Check credentials' };
        }
    };

    const registerCompany = async (companyData) => {
        try {
            const res = await api.post('/auth/register-company', companyData);
            const { token, user: userData } = res.data;

            if (token) await AsyncStorage.setItem('token', token);
            if (userData) {
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
            }
            fetchInitialData();
            return { success: true };
        } catch (error) {
            console.error('Registration error', error);
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const fetchEquipment = async () => {
        try {
            const res = await api.get('/equipment');
            return res.data;
        } catch (e) {
            return [];
        }
    };

    const updateEquipment = async (id, data) => {
        try {
            await api.patch(`/equipment/${id}`, data);
            return true;
        } catch (e) {
            console.error('Update equipment error', e);
            return false;
        }
    };

    const deleteEquipment = async (id) => {
        try {
            await api.delete(`/equipment/${id}`);
            return true;
        } catch (e) {
            console.error('Delete equipment error', e);
            return false;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.multiRemove(['token', 'user']);
            setUser(null);
            setProjects([]);
        } catch (e) { }
    };

    const addTask = async (newTask) => {
        try {
            const res = await api.post('/tasks', newTask);
            setTasks([res.data, ...tasks]);
            return true;
        } catch (e) {
            console.error('Add task error', e);
            return false;
        }
    };

    const updateTask = async (id, taskData) => {
        try {
            const res = await api.patch(`/tasks/${id}`, taskData);
            setTasks(tasks.map(t => t._id === id ? res.data : t));
            return true;
        } catch (e) {
            console.error('Update task error', e);
            return false;
        }
    };

    const deleteTask = async (id) => {
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(tasks.filter(t => t._id !== id));
            return true;
        } catch (e) {
            console.error('Delete task error', e);
            return false;
        }
    };

    const addProject = async (newProject) => {
        try {
            const res = await api.post('/projects', newProject);
            setProjects([res.data, ...projects]);
            return true;
        } catch (e) {
            console.error('Create project error', e);
            return false;
        }
    };

    const updateProject = async (id, projectData) => {
        try {
            const res = await api.patch(`/projects/${id}`, projectData);
            setProjects(projects.map(p => p._id === id ? res.data : p));
            return true;
        } catch (e) {
            console.error('Update project error', e);
            return false;
        }
    };

    const deleteProject = async (id) => {
        try {
            await api.delete(`/projects/${id}`);
            setProjects(projects.filter(p => p._id !== id));
            return true;
        } catch (e) {
            console.error('Delete project error', e);
            return false;
        }
    };

    const toggleClock = async (projectId) => {
        const now = new Date();
        try {
            if (!isClockedIn) {
                const res = await api.post('/timelogs/clock-in', { projectId });
                setIsClockedIn(true);
                setClockInTime(now);
                return res.data;
            } else {
                const res = await api.post('/timelogs/clock-out');
                setIsClockedIn(false);
                setClockOutTime(now);
                return res.data;
            }
        } catch (e) {
            console.error('Clock toggle error', e);
            // UI fallback
            setIsClockedIn(!isClockedIn);
        }
    };

    const getWorkDuration = () => {
        if (!clockInTime) return null;
        const endTime = clockOutTime || new Date();
        const diff = endTime - clockInTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const updateProfile = async (profileData) => {
        try {
            const res = await api.patch('/auth/profile', profileData);
            const updatedUser = { ...user, ...res.data };
            setUser(updatedUser);
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            return { success: true };
        } catch (error) {
            console.error('Update profile error', error);
            return { success: false, message: error.response?.data?.message || 'Update failed' };
        }
    };

    const updatePassword = async (passwordData) => {
        try {
            await api.patch('/auth/updatepassword', passwordData);
            return { success: true };
        } catch (error) {
            console.error('Update password error', error);
            return { success: false, message: error.response?.data?.message || 'Password update failed' };
        }
    };

    const [teamMembers, setTeamMembers] = useState([]);

    const fetchTeamMembers = async () => {
        try {
            const res = await api.get('/auth/users');
            setTeamMembers(res.data);
            return res.data;
        } catch (error) {
            console.error('Fetch team error', error);
            return [];
        }
    };

    const inviteMember = async (memberData) => {
        try {
            await api.post('/auth/register', {
                ...memberData,
                companyId: user?.companyId
            });
            await fetchTeamMembers();
            return { success: true };
        } catch (error) {
            console.error('Invite error', error);
            return { success: false, message: error.response?.data?.message || 'Failed to invite' };
        }
    };

    const updateTeamMember = async (id, memberData) => {
        try {
            await api.patch(`/auth/users/${id}`, memberData);
            await fetchTeamMembers();
            return { success: true };
        } catch (error) {
            console.error('Update team member error', error);
            return { success: false, message: error.response?.data?.message || 'Update failed' };
        }
    };

    const deleteTeamMember = async (id) => {
        try {
            await api.delete(`/auth/users/${id}`);
            await fetchTeamMembers();
            return { success: true };
        } catch (error) {
            console.error('Delete team member error', error);
            return { success: false, message: error.response?.data?.message || 'Delete failed' };
        }
    };

    return (
        <AppContext.Provider value={{
            user, login, logout, registerCompany,
            updateProfile, updatePassword,
            teamMembers, fetchTeamMembers, inviteMember, updateTeamMember, deleteTeamMember,
            projects, addProject, updateProject, deleteProject,
            tasks, addTask, updateTask, deleteTask, setTasks,
            updateEquipment, deleteEquipment,
            issues, setIssues,
            messages, setMessages,
            isClockedIn, toggleClock,
            clockInTime, clockOutTime, getWorkDuration,
            activities,
            metrics,
            uploadNotes, setUploadNotes,
            addUploadNote: (note) => setUploadNotes([note, ...uploadNotes]),
            loading
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);


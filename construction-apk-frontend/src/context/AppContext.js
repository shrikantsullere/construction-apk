import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import api, { setAuthToken } from '../utils/api';
import { useAudioPlayer } from 'expo-audio';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_ISSUES, MOCK_MESSAGES, MOCK_USER, MOCK_ACTIVITY } from '../mock/data';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [issues, setIssues] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [clockInTime, setClockInTime] = useState(null);
    const [clockOutTime, setClockOutTime] = useState(null);
    const [activities, setActivities] = useState([]);
    const [metrics, setMetrics] = useState({});
    const [uploadNotes, setUploadNotes] = useState([]);
    const [timeLogs, setTimeLogs] = useState([]);
    const [chatRooms, setChatRooms] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [rfis, setRFIs] = useState([]);
    const [rfiStats, setRfiStats] = useState(null);
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastNotifCount, setLastNotifCount] = useState(0);
    const [lastUnreadCount, setLastUnreadCount] = useState(0);

    // Audio setup - using modern expo-audio API
    const notificationPlayer = useAudioPlayer('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    
    const playNotificationSound = () => {
        try {
            if (notificationPlayer) {
                notificationPlayer.play();
            }
        } catch (error) {
            console.log('--- SOUND PLAY ERROR ---', error.message);
        }
    };

    // Persist login state
    useEffect(() => {
        checkToken();
    }, []);

    const checkToken = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const savedUser = await AsyncStorage.getItem('user');

            if (token && savedUser) {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                console.log('--- SESSION RESTORED ---', { role: parsedUser.role });
                fetchInitialData(parsedUser);
            } else {
                // No artificial delay needed
            }
        } catch (e) {
            console.error('Auth check error', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchInitialData = async (restoredUser = null) => {
        try {
            const currentUser = restoredUser || user;
            console.log('--- FETCH INITIAL DATA START ---', { role: currentUser?.role });

            const fetchData = async (url, setter, label, retryCount = 1) => {
                try {
                    const res = await api.get(url);
                    console.log(`[Fetch Success] ${label} (${url})`);
                    if (setter) {
                        const data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.projects || res.data.tasks || res.data);
                        setter(data);
                    }
                    return res;
                } catch (err) {
                    // Optimized Retry Logic: If it's a network error or 5xx, retry once after 1s
                    if (retryCount > 0 && (!err.response || err.response.status >= 500)) {
                        console.warn(`[Retrying] ${label} (${url})...`);
                        await new Promise(r => setTimeout(r, 1000));
                        return fetchData(url, setter, label, retryCount - 1);
                    }
                    console.error(`[Fetch Failed] ${label} (${url}):`, err.response?.status, err.response?.data || err.message);
                    return null;
                }
            };

            // SEQUENTIAL FETCH for stability on mobile devices
            const projRes = await fetchData('/projects', setProjects, 'Projects');
            await new Promise(r => setTimeout(r, 100)); // Minor jitter
            const taskRes = await fetchData('/tasks', setTasks, 'Tasks');
            const jobRes = await fetchData('/jobs', setJobs, 'Jobs');
            const actsRes = await fetchData('/reports/stats', null, 'Stats');
            const chatRes = await fetchData('/chat/rooms', setChatRooms, 'ChatRooms');
            const notifRes = await fetchData('/notifications', setNotifications, 'Notifications');
            const teamRes = await fetchData('/auth/users', setTeamMembers, 'Team');
            const rfiRes = await fetchData('/rfis', setRFIs, 'RFIs');
            const rfiStatsRes = await fetchData('/rfis/stats', setRfiStats, 'RFIStats');
            const todoRes = await fetchData('/todos', setTodos, 'Todos');
            const issueRes = await fetchData('/issues', setIssues, 'Issues');

            if (actsRes?.data) {
                setMetrics(actsRes.data);
                if (actsRes.data.myRecentActivity) setActivities(actsRes.data.myRecentActivity);
                else if (actsRes.data.crewActivity) setActivities(actsRes.data.crewActivity);
            }

            // Sync Clock Status & Logs
            const activeUser = currentUser || user;
            if (activeUser?._id) {
                try {
                    const logsRes = await api.get(`/timelogs?userId=${activeUser._id}`);
                    setTimeLogs(logsRes.data);
                    const active = logsRes.data.find(l => !l.clockOut);
                    setIsClockedIn(!!active);
                    if (active) setClockInTime(new Date(active.clockIn));
                } catch (err) {
                    console.error('[Fetch Failed] Clock Sync:', err.response?.status, err.response?.data || err.message);
                }
            }

        } catch (e) {
            console.error('Data fetch error overall:', e.message);
        } finally {
            setLoading(false);
        }
    };

    // --- NEW: Polling & Sound Management ---
    useEffect(() => {
        if (!loading && notifications.length > lastNotifCount) {
            const hasUnread = notifications.some(n => !n.isRead);
            if (hasUnread) playNotificationSound();
        }
        setLastNotifCount(notifications.length);
    }, [notifications.length]);

    useEffect(() => {
        const currentUnread = (chatRooms || []).reduce((acc, r) => acc + (r.unreadCount || 0), 0);
        if (!loading && currentUnread > lastUnreadCount) {
            playNotificationSound();
        }
        setLastUnreadCount(currentUnread);
    }, [chatRooms]);

    useEffect(() => {
        let interval;
        if (user) {
            interval = setInterval(() => {
                refreshBackgroundData();
            }, 30000); // 30s background check
        }
        return () => clearInterval(interval);
    }, [user]);

    const refreshBackgroundData = async () => {
        try {
            const notifRes = await api.get('/notifications');
            setNotifications(notifRes.data);
            
            const chatRes = await api.get('/chat/rooms');
            setChatRooms(chatRes.data);
        } catch (e) {}
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

            if (token) {
                setAuthToken(token);
                await AsyncStorage.setItem('token', token);
            }
            if (userData && userData.role) {
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                console.log('User state updated, navigating...');
            } else {
                console.warn('Login success but userData/role missing:', res.data);
                throw new Error('Invalid user data received from server');
            }
 
            // Load data in background, don't block navigation
            fetchInitialData(userData);
            return { success: true };
        } catch (error) {
            console.log('--- API LOGIN ERROR ---', error.response?.status || error.message);
            console.error('Full Error:', error.response?.data || error);

            const errorMsg = error.response?.data?.message || 'Login failed. Check server connection.';
            return { success: false, message: errorMsg };
        }
    };

    const registerCompany = async (companyData) => {
        try {
            const res = await api.post('/auth/register-company', companyData);
            const { token, user: userData } = res.data;

            if (token) {
                setAuthToken(token);
                await AsyncStorage.setItem('token', token);
            }
            if (userData) {
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
            }
            await fetchInitialData(userData);
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
            // Map status to backend enum: 'todo', 'in_progress', 'review', 'completed'
            const statusMap = {
                'Pending': 'todo',
                'In Progress': 'in_progress',
                'Done': 'completed',
                'pending': 'todo',
                'in-progress': 'in_progress',
                'completed': 'completed'
            };

            const payload = {
                ...newTask,
                status: statusMap[newTask.status] || 'todo',
                priority: newTask.priority || 'Medium',
                // If assignedTo is a member name, we should ideally find their ID
                // For now, let's just make sure we don't crash and try to send what's there
                assignedTo: Array.isArray(newTask.assignedTo) ? newTask.assignedTo : []
            };

            const res = await api.post('/tasks', payload);
            setTasks([res.data, ...tasks]);
            return true;
        } catch (e) {
            console.error('Add task error', e.response?.data || e);
            return false;
        }
    };

    const updateTask = async (rawId, taskData) => {
        const id = String(rawId || '').trim();
        if (!id || id === 'undefined' || id === 'null') {
            console.error('--- [AppContext] REJECTING UPDATE: INVALID ID ---', { rawId });
            return false;
        }

        try {
            const statusMap = {
                'Pending': 'todo', 'In Progress': 'in_progress', 'Done': 'completed',
                'pending': 'todo', 'in-progress': 'in_progress', 'completed': 'completed'
            };

            const updateableFields = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedTo', 'projectId', 'companyId', 'category', 'startDate', 'assignedRoleType'];
            const payload = {};

            updateableFields.forEach(field => {
                if (taskData[field] !== undefined) payload[field] = taskData[field];
            });

            if (payload.status) payload.status = statusMap[payload.status] || payload.status;

            if (payload.projectId && typeof payload.projectId === 'object') {
                payload.projectId = payload.projectId._id || payload.projectId.id;
            }
            if (payload.companyId && typeof payload.companyId === 'object') {
                payload.companyId = payload.companyId._id || payload.companyId.id;
            }
            if (Array.isArray(payload.assignedTo)) {
                payload.assignedTo = payload.assignedTo.map(a => (typeof a === 'object' ? (a._id || a.id) : a)).filter(v => !!v);
            }

            if (!payload.projectId) delete payload.projectId;
            if (!payload.companyId) delete payload.companyId;

            console.log(`--- [AppContext] PATCH /tasks/${id} ---`, payload);

            const res = await api.patch(`/tasks/${id}`, payload);
            const updated = res.data;

            setTasks(prev => prev.map(t => (String(t._id || t.id) === id) ? { ...t, ...updated } : t));
            return true;
        } catch (e) {
            console.error('Update task error', e.response?.data || e.message);
            return false;
        }
    };

    const deleteTask = async (id) => {
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(tasks.filter(t => t._id !== id && t.id !== id));
            return true;
        } catch (e) {
            console.error('Delete task error', e);
            return false;
        }
    };

    const updateJob = async (id, status) => {
        try {
            const res = await api.patch(`/jobs/${id}`, { status });
            setJobs(prev => prev.map(j => (j._id === id || j.id === id) ? res.data : j));
            return true;
        } catch (e) {
            console.error('Update job error', e);
            return false;
        }
    };

    const addJob = async (jobData) => {
        try {
            const res = await api.post('/jobs', jobData);
            setJobs([res.data, ...jobs]);
            return { success: true, data: res.data };
        } catch (e) {
            console.error('Add job error', e.response?.data || e.message);
            return { success: false, message: e.response?.data?.message || 'Failed to create job' };
        }
    };

    const addRFI = async (rfiData) => {
        try {
            const res = await api.post('/rfis', rfiData);
            setRFIs([res.data, ...rfis]);
            fetchInitialData(); // Refresh stats
            return true;
        } catch (e) {
            console.error('Add RFI error', e);
            return false;
        }
    };

    const addIssue = async (issueData) => {
        try {
            const res = await api.post('/issues', issueData);
            setIssues([res.data, ...issues]);
            return { success: true, data: res.data };
        } catch (e) {
            console.error('Add Issue error', e);
            return { success: false, message: e.response?.data?.message || 'Failed to file snag' };
        }
    };

    const addProject = async (newProject) => {
        try {
            // Sanitize budget (strip $ and ,)
            const cleanBudget = typeof newProject.budget === 'string'
                ? newProject.budget.replace(/[^0-9.]/g, '')
                : newProject.budget;

            const payload = {
                ...newProject,
                budget: parseFloat(cleanBudget) || 0,
                status: newProject.status === 'on-hold' ? 'on_hold' : (newProject.status || 'active').toLowerCase(),
                progress: parseInt(newProject.progress) || 0,
                pmId: newProject.pmId || null,
                clientId: newProject.clientId || null,
                projectManager: newProject.pmName || 'Unassigned'
            };
            const res = await api.post('/projects', payload);
            setProjects([res.data, ...projects]);
            return true;
        } catch (e) {
            console.error('Create project error', e.response?.data || e);
            return false;
        }
    };

    const updateProject = async (id, projectData) => {
        try {
            const cleanBudget = typeof projectData.budget === 'string'
                ? projectData.budget.replace(/[^0-9.]/g, '')
                : projectData.budget;

            const payload = {
                ...projectData,
                budget: parseFloat(cleanBudget) || 0,
                status: projectData.status === 'on-hold' ? 'on_hold' : (projectData.status || 'active').toLowerCase(),
                progress: parseInt(projectData.progress) || 0,
                pmId: projectData.pmId || null,
                clientId: projectData.clientId || null,
                projectManager: projectData.pmName || projectData.projectManager
            };
            const res = await api.patch(`/projects/${id}`, payload);
            const updated = res.data;
            setProjects(projects.map(p => (p._id === id || p.id === id) ? updated : p));
            return true;
        } catch (e) {
            console.error('Update project error', e.response?.data || e);
            return false;
        }
    };

    const deleteProject = async (id) => {
        try {
            await api.delete(`/projects/${id}`);
            setProjects(projects.filter(p => p._id !== id && p.id !== id));
            return true;
        } catch (e) {
            console.error('Delete project error', e);
            return false;
        }
    };

    const toggleClock = async (projectId, taskId = null) => {
        const now = new Date();
        const pId = typeof projectId === 'string' ? projectId : null;
        const tId = typeof taskId === 'string' ? taskId : null;

        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Permission to access location was denied. GPS is required for Site Check-In.');
            }

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            };

            if (!isClockedIn) {
                if (!pId) {
                    throw new Error('Project selection required for clock-in');
                }
                console.log('--- ATTEMPTING CLOCK-IN TO ---', { projectId: pId, taskId: tId });
                const res = await api.post('/timelogs/clock-in', {
                    projectId: pId,
                    taskId: tId,
                    latitude: coords.latitude,
                    longitude: coords.longitude
                });
                setIsClockedIn(true);
                setClockInTime(now);
                return res.data;
            } else {
                console.log('--- ATTEMPTING CLOCK-OUT ---');
                const res = await api.post('/timelogs/clock-out', {
                    latitude: coords.latitude,
                    longitude: coords.longitude
                });
                setIsClockedIn(false);
                setClockOutTime(now);
                return res.data;
            }
        } catch (e) {
            const errorMsg = e.response?.data?.message || e.message;
            console.error('Clock toggle error', errorMsg);

            // SYNC FIX for Railway Live Backend:
            // If the server says "User not clocked in", it means our local UI is out of sync.
            // We must force-reset the local state so the user can "Clock In" again.
            if (errorMsg === 'User not clocked in') {
                console.warn('Syncing local state: User was already clocked out on server.');
                setIsClockedIn(false);
                setClockInTime(null);
            }
            throw e;
        }
    };

    const getWorkDuration = () => {
        if (!clockInTime || isNaN(clockInTime.getTime())) return '00:00:00';
        const now = new Date();
        const diff = Math.max(0, now.getTime() - clockInTime.getTime());

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

    const fetchMessages = async (roomId) => {
        try {
            if (!roomId) return [];
            console.log(`[Fetching Messages] Room ID: ${roomId}`);

            // Backend endpoint is /api/chat/:roomId
            const res = await api.get(`/chat/${roomId}`);
            const newMsgs = res.data;
            console.log(`[Fetch Success] Messages count: ${newMsgs.length}`);

            setMessages(prev => {
                const combined = [...prev, ...newMsgs];
                const uniqueMap = new Map();
                combined.forEach(m => {
                    const id = m._id || m.id;
                    if (id) uniqueMap.set(id.toString(), m);
                });
                return Array.from(uniqueMap.values());
            });
            return newMsgs;
        } catch (e) {
            console.error('Fetch messages error', e.response?.data || e.message);
            return [];
        }
    };


    const sendMessage = async (text, projectId = null, receiverId = null, roomId = null, attachments = []) => {
        try {
            console.log('--- SENDING MESSAGE ---', { text, projectId, receiverId, roomId, attachments });
            const payload = { 
                message: text,
                attachments: attachments 
            };

            // Backend /chat requires either projectId, receiverId, OR a generic roomId
            // Usually, roomId IS the projectId or receiverId.
            if (projectId) {
                payload.projectId = projectId;
                payload.roomId = projectId;
            }
            if (receiverId) {
                payload.receiverId = receiverId;
                payload.roomId = receiverId;
            }
            if (roomId) {
                payload.roomId = roomId;
                if (!payload.projectId && !payload.receiverId) {
                    // Default to projectId if we only have roomId
                    payload.projectId = roomId;
                }
            }

            if (!payload.projectId && !payload.receiverId && !payload.roomId) {
                console.warn('CRITICAL: Message payload missing destination identifiers');
            }

            const res = await api.post('/chat', payload);
            const savedMsg = res.data;

            setMessages(prev => {
                // Ensure consistency for filtering: map _id to id if needed, and ensure roomId/projectId are present
                const normalizedMsg = {
                    ...savedMsg,
                    id: savedMsg._id || savedMsg.id,
                    roomId: savedMsg.roomId || payload.roomId,
                    projectId: savedMsg.projectId || payload.projectId,
                    receiverId: savedMsg.receiverId || payload.receiverId
                };
                
                if (prev.find(m => (m._id || m.id) === normalizedMsg.id)) return prev;
                return [...prev, normalizedMsg];
            });
            return true;
        } catch (e) {
            console.error('Send message error', e.response?.data || e);
            return false;
        }
    };

    const uploadFile = async (fileUri, fileName, fileType = 'image/jpeg') => {
        try {
            const formData = new FormData();
            formData.append('image', {
                uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
                name: fileName || 'upload.jpg',
                type: fileType
            });

            console.log('--- UPLOADING FILE ---', { uri: fileUri, type: fileType });
            const res = await api.post('/photos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            return {
                url: res.data.imageUrl,
                name: fileName || 'attachment',
                fileType: fileType
            };
        } catch (error) {
            console.error('File upload error:', error.response?.data || error.message);
            throw error;
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

    const addTodo = async (todoData) => {
        try {
            const res = await api.post('/todos', todoData);
            setTodos([res.data, ...todos]);
            return res.data;
        } catch (error) {
            console.error('Add todo error', error);
            return null;
        }
    };

    const toggleTodo = async (id) => {
        try {
            const todo = todos.find(t => t._id === id);
            const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
            const res = await api.patch(`/todos/${id}`, { status: newStatus });
            setTodos(prev => prev.map(t => t._id === id ? res.data : t));
            return true;
        } catch (error) {
            console.error('Toggle todo error', error);
            return false;
        }
    };

    const deleteTodo = async (id) => {
        try {
            await api.delete(`/todos/${id}`);
            setTodos(prev => prev.filter(t => t._id !== id));
            return true;
        } catch (error) {
            console.error('Delete todo error', error);
            return false;
        }
    };

    return (
        <AppContext.Provider value={{
            user, login, logout, registerCompany,
            updateProfile, updatePassword,
            teamMembers, fetchTeamMembers, inviteMember, updateTeamMember, deleteTeamMember,
            projects, addProject, updateProject, deleteProject,
            tasks, addTask, updateTask, deleteTask, setTasks,
            jobs, addJob, updateJob,
            updateEquipment, deleteEquipment,
            issues, setIssues, addIssue,
            messages, setMessages, sendMessage, fetchMessages, uploadFile,
            rfis, rfiStats, addRFI,
            isClockedIn, toggleClock,
            clockInTime, clockOutTime, getWorkDuration,
            activities,
            timeLogs,
            chatRooms,
            notifications,
            metrics,
            todos, addTodo, toggleTodo, deleteTodo,
            unreadChatCount: (chatRooms || []).reduce((acc, room) => acc + (room.unreadCount || 0), 0),
            uploadNotes, setUploadNotes,
            addUploadNote: (note) => setUploadNotes([note, ...uploadNotes]),
            refreshData: fetchInitialData,
            markNotificationAsRead: async (id) => {
                try {
                    await api.patch(`/notifications/${id}/read`);
                    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
                } catch (e) {
                    console.error('Mark read error', e);
                }
            },
            loading
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);


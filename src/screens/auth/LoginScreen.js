import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
    ActivityIndicator, Platform, ScrollView, Animated, Keyboard,
    KeyboardAvoidingView, Dimensions, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { COLORS, SHADOWS, SPACING } from '../../constants/theme';

const { width } = Dimensions.get('window');

// ── Role Credentials from KAAL Backend ──────────────────────────────────────
const ROLES = [
    {
        id: 'PM', label: 'Project Manager', icon: 'briefcase-account', color: '#1D4ED8', bg: '#EFF6FF',
        email: 'pm@kaal.ca', pass: '123456'
    },
    {
        id: 'FOREMAN', label: 'Foreman', icon: 'hard-hat', color: '#16A34A', bg: '#F0FDF4',
        email: 'foreman@kaal.ca', pass: '123456'
    },
    {
        id: 'WORKER', label: 'Worker', icon: 'account-hard-hat', color: '#6366F1', bg: '#EEF2FF',
        email: 'worker@kaal.ca', pass: '123456'
    },
    {
        id: 'SUBCONTRACTOR', label: 'Sub', icon: 'wrench-cog', color: '#DB2777', bg: '#FDF2F8',
        email: 'subcontractor@kaal.ca', pass: '123456'
    },
    {
        id: 'CLIENT', label: 'Client', icon: 'account-tie', color: '#8B5CF6', bg: '#F5F3FF',
        email: 'client@kaal.ca', pass: '123456'
    }
];

export default function LoginScreen({ navigation }) {
    const { login, logout } = useApp();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [focusedField, setFocusedField] = useState(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        try { logout(); } catch (e) { }
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

        // Auto-select Foreman by default as per the guide
        handleSelectRole(ROLES[0]);
    }, []);

    const handleSelectRole = (role) => {
        setSelectedRole(role.id);
        setEmail(role.email);
        setPassword(role.pass);
    };

    const doLogin = async () => {
        Keyboard.dismiss();
        if (!email.trim() || !password.trim()) {
            alert('Enter valid credentials');
            return;
        }
        setLoading(true);
        try {
            console.log('Attempting login for:', email);
            const res = await login(email.trim(), password);
            console.log('Login result:', res?.success ? 'SUCCESS' : 'FAILED');

            if (!res?.success) {
                alert(res?.message || 'Login failed. Please check credentials.');
                setLoading(false);
            }
            // IMPORTANT: No manual navigation here. 
            // AppNavigation.js will automatically swap the screens when 'user' state updates.
        } catch (err) {
            console.error('Login action error:', err);
            alert('Login error. Check your server connection.');
            setLoading(false);
        }
    };

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <LinearGradient
                colors={['#2E3647', '#1E293B']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.top}
            >
                <View style={[s.bubble, { top: -60, right: -60, width: 220, height: 220, opacity: 0.1 }]} />
                <View style={[s.bubble, { bottom: -30, left: -30, width: 140, height: 140, opacity: 0.08 }]} />
                <View style={[s.bubble, { top: 40, left: -40, width: 100, height: 100, opacity: 0.05 }]} />
                <View style={[s.bubble, { bottom: 60, right: 20, width: 60, height: 60, opacity: 0.07 }]} />

                <Animated.View style={[s.headerContent, { opacity: fadeAnim }]}>
                    <Image 
                        source={require('../../../assets/logo.webp')} 
                        style={s.loginLogo} 
                        resizeMode="contain" 
                    />
                    <Text style={s.brand}>KAAL<Text style={{ color: '#93C5FD' }}> ERP</Text></Text>
                    <Text style={s.tagline}>Build Smarter. Manage Better.</Text>
                </Animated.View>
                <View style={s.curve} />
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : null}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={s.scroll}
                    contentContainerStyle={s.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[s.card, SHADOWS.large || { elevation: 12 }, { opacity: fadeAnim }]}>
                        <View style={s.guideHeader}>
                            <MaterialCommunityIcons name="lock-open-outline" size={16} color="#3B82F6" />
                            <Text style={s.guideTitle}>DEMO ACCESS GUIDE</Text>
                        </View>

                        <Text style={s.label}>Tap Role to Auto-fill</Text>
                        <View style={s.roleGrid}>
                            {ROLES.map(role => {
                                const active = selectedRole === role.id;
                                return (
                                    <TouchableOpacity
                                        key={`role-${role.id}`}
                                        onPress={() => handleSelectRole(role)}
                                        style={[s.chip, { backgroundColor: active ? role.bg : '#F8FAFC', borderColor: active ? role.color : '#E2E8F0' }]}
                                    >
                                        <MaterialCommunityIcons name={role.icon} size={14} color={active ? role.color : '#94A3B8'} />
                                        <Text style={[s.chipText, { color: active ? role.color : '#64748B' }]}>{role.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Input Fields */}
                        <View style={[s.inputWrap, focusedField === 'email' && s.inputActive]}>
                            <MaterialCommunityIcons name="email-outline" size={20} color={focusedField === 'email' ? '#3B82F6' : '#94A3B8'} />
                            <TextInput
                                style={s.input}
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Email Address"
                                placeholderTextColor="#94A3B8"
                                autoCapitalize="none"
                                underlineColorAndroid="transparent"
                            />
                        </View>

                        <View style={[s.inputWrap, focusedField === 'pass' && s.inputActive]}>
                            <MaterialCommunityIcons name="lock-outline" size={20} color={focusedField === 'pass' ? '#3B82F6' : '#94A3B8'} />
                            <TextInput
                                style={s.input}
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setFocusedField('pass')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Password"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry={!showPass}
                                underlineColorAndroid="transparent"
                            />
                            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                                <MaterialCommunityIcons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[s.btn, loading && { opacity: 0.8 }]}
                            onPress={doLogin}
                            disabled={loading}
                        >
                            <LinearGradient colors={['#1E293B', '#334155']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGrad}>
                                {loading ? <ActivityIndicator color="#fff" /> : (
                                    <>
                                        <Text style={s.btnText}>SIGN IN TO DASHBOARD</Text>
                                        <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={s.footerNote}>Backend version v4.0.2 Stable</Text>
                    </Animated.View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F1F5F9' },
    top: {
        height: 240,
        paddingTop: 50,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    bubble: { position: 'absolute', backgroundColor: '#fff', borderRadius: 999 },
    headerContent: { alignItems: 'center', zIndex: 10 },
    loginLogo: {
        width: 80,
        height: 80,
        marginBottom: 10,
    },
    brand: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
    tagline: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', marginTop: 4 },
    curve: {
        position: 'absolute', bottom: -1, width: '100%', height: 40,
        backgroundColor: '#F1F5F9', borderTopLeftRadius: 40, borderTopRightRadius: 40,
    },
    scroll: { flex: 1, marginTop: -30 },
    scrollContent: { paddingHorizontal: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    guideHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    guideTitle: { fontSize: 12, fontWeight: '900', color: '#3B82F6', letterSpacing: 1 },
    label: { fontSize: 11, fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center', height: 56,
        backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0',
        paddingHorizontal: 16, marginBottom: 16,
    },
    inputActive: { borderColor: '#3B82F6', backgroundColor: '#fff' },
    input: { flex: 1, height: '100%', fontSize: 15, color: '#0F172A', fontWeight: '700', marginLeft: 12 },
    roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 24 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10, borderWidth: 1.2 },
    chipText: { fontSize: 11, fontWeight: '800' },
    btn: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
    btnGrad: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
    footerNote: { textAlign: 'center', color: '#94A3B8', fontSize: 10, fontWeight: '700', marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
});

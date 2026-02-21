import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const AppHeader = ({ title, showBack = false }) => {
    const { user, logout } = useApp();
    const navigation = useNavigation();

    const handleLogout = async () => {
        await logout();
        // No need for navigation.reset or navigation.navigate.
        // AppNavigation.js will automatically swap to Login screen 
        // because the 'user' state becomes null.
    };

    return (
        <View style={styles.safeArea}>
            <LinearGradient
                colors={['#1E3A8A', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerContainer}
            >
                <View style={styles.leftSection}>
                    {showBack ? (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.logoBox}>
                            <MaterialCommunityIcons name="crane" size={20} color="#fff" />
                        </View>
                    )}
                    <View style={styles.titleBox}>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {title || 'KAAL ERP'}
                        </Text>
                        {!showBack && (
                            <Text style={styles.userRoleText}>
                                {user?.role?.replace('_', ' ') || 'ENTERPRISE'}
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.rightSection}>
                    {/* Logout Button directly in header for convenience */}
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={[styles.logoutIconBtn, SHADOWS.small]}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="logout-variant" size={20} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Profile')}
                        style={styles.avatarBtn}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarLetter}>
                                {user?.name?.charAt(0) || 'U'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#1E3A8A',
        paddingTop: Platform.OS === 'ios' ? 44 : 36,
    },
    headerContainer: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    logoBox: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    iconBtn: {
        padding: 8,
        marginRight: 4,
    },
    titleBox: {
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    userRoleText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoutIconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginRight: 4,
    },
    avatarBtn: {
        padding: 2,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    avatarLetter: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
});

export default AppHeader;

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SPACING, SHADOWS } from '../theme/theme';
import StatusBadge from './StatusBadge';

const ProjectCard = ({ project, onPress, onEdit, index = 0 }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                delay: index * 100,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, [index]);

    const velocity = project.progress ? Math.round(project.progress * 100) : 0;
    const velocityColor = velocity >= 75 ? COLORS.success : velocity >= 40 ? COLORS.primaryAccent : COLORS.warning;

    return (
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, SHADOWS.small]}>
                <View style={styles.header}>
                    <View style={styles.titleSection}>
                        <Text style={styles.name} numberOfLines={1}>{project.name}</Text>
                        <View style={styles.clientRow}>
                            <MaterialCommunityIcons name="office-building-marker-outline" size={14} color={COLORS.textSecondary} />
                            <Text style={styles.client} numberOfLines={1}>{project.client}</Text>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <StatusBadge status={project.status || 'Active'} />
                        {onEdit && (
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onEdit(project); }}>
                                <MaterialCommunityIcons name="pencil" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.progressSection}>
                    <View style={styles.progressInfo}>
                        <Text style={styles.progressLabel}>COMPLETION</Text>
                        <Text style={[styles.progressVal, { color: velocityColor }]}>{velocity}%</Text>
                    </View>
                    <ProgressBar progress={velocity / 100} color={velocityColor} style={styles.progressBar} />
                </View>

                <View style={styles.footer}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: COLORS.badgeBlue + '15' }]}>
                                <MaterialCommunityIcons name="calendar-check" size={14} color={COLORS.badgeBlue} />
                            </View>
                            <Text style={styles.statCount}>{project.stats?.tasks || 0}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: COLORS.badgeRed + '15' }]}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={14} color={COLORS.badgeRed} />
                            </View>
                            <Text style={styles.statCount}>{project.stats?.issues || 0}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: COLORS.badgeTeal + '15' }]}>
                                <MaterialCommunityIcons name="account-group-outline" size={14} color={COLORS.badgeTeal} />
                            </View>
                            <Text style={styles.statCount}>{project.team?.length || 0}</Text>
                        </View>
                    </View>
                    <View style={styles.arrowBox}>
                        <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.primaryAccent} />
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radius,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.m,
    },
    titleSection: {
        flex: 1,
        marginRight: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.textPrimary,
        letterSpacing: -0.4,
    },
    clientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    client: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginLeft: 4,
        fontWeight: '600',
    },
    progressSection: {
        marginBottom: SPACING.m,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.textMuted,
        letterSpacing: 0.5,
    },
    progressVal: {
        fontSize: 12,
        fontWeight: '900',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.border,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: COLORS.border + '50',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statIcon: {
        width: 24,
        height: 24,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statCount: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    arrowBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ProjectCard;

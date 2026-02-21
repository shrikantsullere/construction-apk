import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SPACING, SHADOWS } from '../theme/theme';
import StatusBadge from './StatusBadge';

const TaskCard = ({ task, onEdit }) => {
    const isCompleted = task.status === 'Completed' || task.status === 'Done';

    return (
        <View style={[styles.card, SHADOWS.small]}>
            <TouchableOpacity
                style={[styles.checkArea, isCompleted && styles.checkAreaCompleted]}
                activeOpacity={0.7}
            >
                <View style={[
                    styles.checkbox,
                    isCompleted && styles.checkboxChecked
                ]}>
                    {isCompleted && (
                        <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                    )}
                </View>
            </TouchableOpacity>

            <View style={styles.content}>
                <Text style={[
                    styles.title,
                    isCompleted && styles.textDone
                ]} numberOfLines={2}>
                    {task.title}
                </Text>
                <View style={styles.footer}>
                    <View style={styles.meta}>
                        <MaterialCommunityIcons name="briefcase-outline" size={12} color={COLORS.textMuted} />
                        <Text style={styles.metaText}>{task.project}</Text>
                    </View>
                    {task.dueDate && (
                        <View style={styles.meta}>
                            <MaterialCommunityIcons name="clock-outline" size={12} color={COLORS.textMuted} />
                            <Text style={styles.metaText}>{task.dueDate}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.badgeWrapper}>
                <StatusBadge status={task.status} />
                {onEdit && (
                    <TouchableOpacity onPress={() => onEdit(task)} style={{ marginTop: 8, alignSelf: 'center' }}>
                        <MaterialCommunityIcons name="pencil" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radius,
        padding: SPACING.m,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    checkArea: {
        width: 28,
        height: 28,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        backgroundColor: COLORS.background,
    },
    checkAreaCompleted: {
        borderColor: COLORS.success,
        backgroundColor: COLORS.success + '10',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.success,
    },
    content: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: -0.2,
    },
    textDone: {
        textDecorationLine: 'line-through',
        color: COLORS.textMuted,
    },
    footer: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 12,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    badgeWrapper: {
        alignSelf: 'center',
    },
});

export default TaskCard;

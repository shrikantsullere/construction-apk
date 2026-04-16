import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SPACING } from '../constants/theme';

const IssueCard = ({ issue }) => {
    const getPriorityColor = () => {
        switch (issue.priority.toLowerCase()) {
            case 'high': return COLORS.danger;
            case 'medium': return COLORS.primary;
            default: return COLORS.info;
        }
    };

    const priorityColor = getPriorityColor();

    return (
        <View style={styles.card}>
            <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>{issue.title}</Text>
                    <View style={[styles.badge, { backgroundColor: priorityColor + '15' }]}>
                        <Text style={[styles.badgeText, { color: priorityColor }]}>{issue.priority}</Text>
                    </View>
                </View>
                <View style={styles.footer}>
                    <View style={styles.meta}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.metaText}>{issue.date}</Text>
                    </View>
                    <View style={styles.meta}>
                        <MaterialCommunityIcons name="tag-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.metaText}>ID: #{issue.id}</Text>
                    </View>
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.border} />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: SIZES.radius,
        marginBottom: SPACING.s,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    priorityIndicator: {
        width: 4,
        height: '100%',
    },
    content: {
        flex: 1,
        padding: SPACING.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textPrimary,
        flex: 1,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    metaText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginLeft: 4,
        fontWeight: '600',
    },
});

export default IssueCard;

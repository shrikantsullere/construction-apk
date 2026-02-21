import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES } from '../../theme/theme';

export const OverviewTab = ({ project }) => {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <View style={styles.typeHeader}>
                    <Text style={styles.typeText}>{project.type || 'Commercial'}</Text>
                </View>
                <Text style={styles.sectionTitle}>Execution Progress</Text>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressPercent}>{Math.round(project.progress * 100)}% Complete</Text>
                    <Text style={styles.daysLeft}>14 Days Remaining</Text>
                </View>
                <ProgressBar progress={project.progress} color={COLORS.primary} style={styles.progressBar} />

                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Tasks Done</Text>
                        <Text style={styles.statValue}>{project.stats.tasks}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Open Issues</Text>
                        <Text style={[styles.statValue, { color: COLORS.danger }]}>{project.stats.issues}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Project Leader</Text>
                        <Text style={[styles.statValue, { color: COLORS.primary }]}>{project.manager || 'Unassigned'}</Text>
                    </View>
                </View>
                <View style={[styles.statsGrid, { borderTopWidth: 0, paddingTop: 12 }]}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Budget</Text>
                        <Text style={[styles.statValue, { color: COLORS.success }]}>{project.budget || 'Pending'}</Text>
                    </View>
                </View>
            </View>


            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Project Team</Text>
                {project.team.map((member, index) => (
                    <View key={index} style={styles.teamMember}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{member.role.charAt(0)}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                            <Text style={styles.memberName}>{member.name}</Text>
                            <Text style={styles.memberRole}>{member.role}</Text>
                        </View>
                        <TouchableOpacity style={styles.contactBtn}>
                            <MaterialCommunityIcons name="message-outline" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                ))}
                {project.team.length === 0 && (
                    <Text style={styles.emptyText}>No team members assigned yet.</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Site Location</Text>
                <View style={styles.locationCard}>
                    <MaterialCommunityIcons name="map-marker-radius" size={24} color={COLORS.primary} />
                    <View style={styles.locationInfo}>
                        <Text style={styles.address}>{project.location || 'Location not specified'}</Text>
                        <Text style={styles.coordinates}>{project.location ? 'GPS Synchronized' : 'Awaiting GPS data'}</Text>
                    </View>
                </View>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SPACING.m,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    typeHeader: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderBottomLeftRadius: 16,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 16,
        letterSpacing: 1,
        marginLeft: 4,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    progressPercent: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.textPrimary,
    },
    daysLeft: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '800',
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.background,
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 16,
    },
    statBox: {
        flex: 1,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '700',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.textPrimary,
    },
    teamMember: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    avatarText: {
        color: COLORS.primary,
        fontWeight: '900',
        fontSize: 18,
    },
    memberInfo: {
        flex: 1,
        marginLeft: 12,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    memberRole: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    contactBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    locationInfo: {
        marginLeft: 12,
    },
    address: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    coordinates: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
    },
});

export default OverviewTab;

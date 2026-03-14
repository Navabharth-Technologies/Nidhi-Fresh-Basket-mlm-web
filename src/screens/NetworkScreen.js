import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, FlatList, TouchableOpacity,
    ActivityIndicator, ScrollView, RefreshControl
} from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { Users, UserPlus, UserCheck, Clock } from 'lucide-react-native';

const MemberCard = ({ member }) => {
    const isApproved = member.kyc_status?.toLowerCase() === 'approved';
    const isPending = member.kyc_status?.toLowerCase() === 'pending';

    return (
        <View style={styles.memberCard}>
            <View style={[styles.memberAvatar, { backgroundColor: isApproved ? COLORS.success + '20' : COLORS.warning + '20' }]}>
                {isApproved
                    ? <UserCheck color={COLORS.success} size={20} />
                    : <UserPlus color={COLORS.warning} size={20} />
                }
            </View>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName} numberOfLines={1}>{member.full_name}</Text>
                <Text style={styles.memberId}>{member.userid}</Text>
            </View>
            <View style={[styles.statusBadge, isApproved ? styles.badgeApproved : isPending ? styles.badgePending : styles.badgeNone]}>
                <Text style={[styles.statusText, isApproved ? styles.textApproved : isPending ? styles.textPending : styles.textNone]}>
                    {member.kyc_status || 'No KYC'}
                </Text>
            </View>
        </View>
    );
};

const NetworkScreen = () => {
    const [levels, setLevels] = useState(Array.from({ length: 15 }, (_, i) => ({ level: i + 1, count: 0 })));
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState(1);
    const [allMembers, setAllMembers] = useState({});

    const fetchNetwork = async () => {
        try {
            const res = await apiClient.get('/users/network');
            if (res.data) {
                setLevels(res.data.levels || []);
                setAllMembers(res.data.members || {});
            }
        } catch (e) {
            console.error('Network fetch failed:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNetwork();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNetwork();
    };

    const currentMembers = allMembers[selectedLevel] || [];
    const totalDownline = levels.reduce((sum, l) => sum + l.count, 0);

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator color={COLORS.secondary} size="large" />
            <Text style={styles.loadingText}>Loading your network...</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Users color={COLORS.secondary} size={32} />
                <Text style={styles.title}>Your Downline</Text>
                <Text style={styles.subtitle}>Track your 15-level network growth</Text>
                <View style={styles.totalBadge}>
                    <Text style={styles.totalText}>{totalDownline} Total Members</Text>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
            >
                {/* Level Tab Bar */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.levelList}
                    style={styles.levelBar}
                >
                    {levels.map(item => (
                        <TouchableOpacity
                            key={item.level.toString()}
                            style={[styles.levelItem, selectedLevel === item.level && styles.selectedLevel]}
                            onPress={() => setSelectedLevel(item.level)}
                        >
                            <Text style={[styles.levelText, selectedLevel === item.level && styles.selectedLevelText]}>
                                Level {item.level}
                            </Text>
                            <View style={[styles.countBadge, item.count > 0 && selectedLevel !== item.level && styles.countBadgeActive]}>
                                <Text style={[styles.countText, item.count > 0 && selectedLevel !== item.level && styles.countTextActive]}>
                                    {item.count}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Member List */}
                <View style={styles.memberSection}>
                    <Text style={styles.memberTitle}>
                        Level {selectedLevel} Partners
                        <Text style={styles.memberCount}> ({currentMembers.length})</Text>
                    </Text>

                    {currentMembers.length > 0 ? (
                        currentMembers.map(member => (
                            <MemberCard key={member.id.toString()} member={member} />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <UserPlus color={COLORS.textSecondary} size={48} />
                            <Text style={styles.emptyTitle}>No members at Level {selectedLevel}</Text>
                            <Text style={styles.emptyText}>Share your referral code to grow this level!</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loadingText: { color: COLORS.textSecondary, marginTop: 12, fontSize: 14 },

    header: {
        padding: SPACING.l,
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: SPACING.m
    },
    title: { fontSize: 22, color: COLORS.text, fontWeight: 'bold', marginTop: SPACING.s },
    subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
    totalBadge: {
        marginTop: SPACING.s,
        backgroundColor: COLORS.secondary + '18',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.secondary + '30'
    },
    totalText: { color: COLORS.secondary, fontWeight: '700', fontSize: 13 },

    levelBar: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    levelList: { paddingHorizontal: SPACING.m, paddingVertical: SPACING.s },
    levelItem: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    selectedLevel: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
    levelText: { color: COLORS.text, fontWeight: '600', marginRight: 6, fontSize: 13 },
    selectedLevelText: { color: '#fff' },
    countBadge: {
        backgroundColor: COLORS.background,
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 2,
        minWidth: 22,
        alignItems: 'center'
    },
    countBadgeActive: { backgroundColor: COLORS.secondary + '20' },
    countText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: 'bold' },
    countTextActive: { color: COLORS.secondary },

    memberSection: { padding: SPACING.m, paddingBottom: 40 },
    memberTitle: { color: COLORS.text, fontSize: 17, fontWeight: 'bold', marginBottom: SPACING.m },
    memberCount: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '400' },

    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: 12,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    memberAvatar: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
        marginRight: SPACING.m
    },
    memberInfo: { flex: 1 },
    memberName: { color: COLORS.text, fontWeight: '600', fontSize: 14 },
    memberId: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },

    statusBadge: {
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 12, borderWidth: 1
    },
    badgeApproved: { backgroundColor: COLORS.success + '15', borderColor: COLORS.success + '40' },
    badgePending: { backgroundColor: '#FFA50015', borderColor: '#FFA50040' },
    badgeNone: { backgroundColor: COLORS.border + '30', borderColor: COLORS.border },
    statusText: { fontSize: 11, fontWeight: '600' },
    textApproved: { color: COLORS.success },
    textPending: { color: '#FFA500' },
    textNone: { color: COLORS.textSecondary },

    emptyState: { alignItems: 'center', paddingVertical: 50, opacity: 0.6 },
    emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '600', marginTop: 16 },
    emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, maxWidth: '70%', fontSize: 13 },
});

export default NetworkScreen;

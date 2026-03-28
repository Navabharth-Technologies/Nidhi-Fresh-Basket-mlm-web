import React, { useState, useEffect } from 'react';
import {
    StyleSheet, Text, View, FlatList, TouchableOpacity,
    ActivityIndicator, ScrollView, RefreshControl, Platform, TextInput, Share
} from 'react-native';
import { COLORS, SPACING, SIZES } from '../theme/theme';
import apiClient from '../api/client';
import { Users, UserPlus, UserCheck, Clock, Search, ChevronRight, Share2, Award, TrendingUp, Filter, AlertCircle, Phone, Mail, Calendar, User } from 'lucide-react-native';
import ScreenBackground from '../components/ScreenBackground';
import MainHeader from '../components/MainHeader';
import AnimatedCard from '../components/AnimatedCard';

const GenealogyNode = ({ member, depth = 0, isLastChild = false }) => {
    const [isExpanded, setIsExpanded] = useState(depth < 1); // Auto-expand level 1
    const hasChildren = member.children && member.children.length > 0;
    const isApproved = member.kyc_status?.toLowerCase() === 'approved';

    return (
        <View style={styles.horizontalNodeRow}>
            {/* The Node Card */}
            <View style={styles.nodeContainer}>
                {/* Visual Connector from Parent */}
                {depth > 0 && <View style={styles.horizontalLineFromParent} />}

                <AnimatedCard
                    onPress={() => hasChildren && setIsExpanded(!isExpanded)}
                    style={[
                        styles.horizontalNodeCard,
                        isExpanded && styles.horizontalNodeCardExpanded,
                        !isApproved && { borderLeftColor: COLORS.warning }
                    ]}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                        <View style={[styles.horizontalNodeAvatar, { backgroundColor: isApproved ? COLORS.success + '15' : COLORS.warning + '15' }]}>
                            {isApproved ? <UserCheck size={14} color={COLORS.success} /> : <UserPlus size={14} color={COLORS.warning} />}
                        </View>

                        <View style={styles.nodeMainInfo}>
                            <Text style={styles.nodeName} numberOfLines={1}>{member.full_name}</Text>
                            <Text style={styles.nodeId}>{member.userid}</Text>
                        </View>

                        <View style={styles.nodeLevelBadge}>
                            <Text style={styles.nodeLevelText}>L{member.level || depth + 1}</Text>
                        </View>

                        {hasChildren && (
                            <View style={[styles.expandIndicator, isExpanded && styles.expandIndicatorActive]}>
                                <ChevronRight
                                    size={12}
                                    color={isExpanded ? '#fff' : COLORS.textSecondary}
                                    style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                                />
                            </View>
                        )}
                    </View>
                </AnimatedCard>

                {/* Connector to children (if expanded and has children) */}
                {isExpanded && hasChildren && <View style={styles.horizontalLineToChildren} />}
            </View>

            {/* The Children (Next Column) */}
            {isExpanded && hasChildren && (
                <View style={styles.childrenColumn}>
                    <View style={styles.childrenVerticalStem} />
                    {member.children.map((child, index) => (
                        <GenealogyNode
                            key={child.id}
                            member={child}
                            depth={depth + 1}
                            isLastChild={index === member.children.length - 1}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const NetworkScreen = ({ navigation }) => {
    const [levels, setLevels] = useState(Array.from({ length: 15 }, (_, i) => ({ level: i + 1, count: 0 })));
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState(1);
    const [allMembers, setAllMembers] = useState({});
    const [profile, setProfile] = useState(null);

    // New states for the updated UI
    const [stats, setStats] = useState({ total_team: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'inactive'
    const isDesktop = Platform.OS === 'web'; // Example for desktop detection

    const fetchNetwork = async () => {
        try {
            const [networkRes, profileRes] = await Promise.all([
                apiClient.get('/users/network'),
                apiClient.get('/users/profile')
            ]);

            if (networkRes.data) {
                setLevels(networkRes.data.levels || []);
                setAllMembers(networkRes.data.members || {});
                setStats({ total_team: networkRes.data.total_downline_members || 0 }); // Assuming total_downline_members is available
            }
            if (profileRes.data) {
                setProfile(profileRes.data);
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

    const hierarchy = React.useMemo(() => {
        if (!profile || !allMembers[1]) return [];

        const allFlatMembers = Object.values(allMembers).flat();
        const memberMap = {};
        allFlatMembers.forEach(m => {
            memberMap[m.id] = { ...m, children: [] };
        });

        const roots = [];
        allFlatMembers.forEach(m => {
            if (m.sponsor_id === profile.id) {
                roots.push(memberMap[m.id]);
            } else if (memberMap[m.sponsor_id]) {
                memberMap[m.sponsor_id].children.push(memberMap[m.id]);
            }
        });
        return roots;
    }, [allMembers, profile]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNetwork();
    };

    const currentMembers = allMembers[selectedLevel] || [];
    const totalDownline = levels.reduce((sum, l) => sum + l.count, 0);

    // Filtering logic for the new UI
    const filteredMembers = currentMembers.filter(member => {
        const matchesSearch = member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.userid.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesTab = true;
        if (activeTab === 'active') {
            matchesTab = member.kyc_status?.toLowerCase() === 'approved';
        } else if (activeTab === 'inactive') {
            matchesTab = member.kyc_status?.toLowerCase() !== 'approved';
        }
        return matchesSearch && matchesTab;
    });

    const BASE_URL = 'https://nidhifreshbasket.in';

    const handleCopyLink = () => {
        const referralUrl = `${BASE_URL}/register?ref=${profile?.referral_code || ''}`;

        if (Platform.OS === 'web') {
            navigator.clipboard.writeText(referralUrl)
                .then(() => alert('Referral link copied to clipboard!'))
                .catch(err => console.error('Failed to copy link:', err));
        } else {
            Share.share({
                message: `Join me on Nidhi Fresh Basket: ${referralUrl}`,
                url: referralUrl
            });
        }
    };

    const handleCopyCode = () => {
        const code = profile?.referral_code || '';
        if (Platform.OS === 'web') {
            navigator.clipboard.writeText(code)
                .then(() => alert('Referral code copied!'))
                .catch(err => console.error('Failed to copy code:', err));
        } else {
            Share.share({ message: `My referral code: ${code}` });
        }
    };

    const handleShareLink = async () => {
        const referralUrl = `${BASE_URL}/register?ref=${profile?.referral_code || ''}`;

        try {
            await Share.share({
                title: 'Nidhi Fresh Basket Referral',
                message: `Join me on Nidhi Fresh Basket and grow your network! Register here: ${referralUrl}`,
                url: referralUrl
            });
        } catch (error) {
            console.log('Share error:', error.message);
        }
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator color={COLORS.secondary} size="large" />
            <Text style={styles.loadingText}>Loading your network...</Text>
        </View>
    );

    const referralUrl = `${BASE_URL}/register?ref=${profile?.referral_code || ''}`;

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <MainHeader title="Level Management" navigation={navigation} hideProfile={true} />
                {/* Header Section */}
                <View style={[styles.header, isDesktop && styles.headerDesktop]}>
                    <View style={styles.headerTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>Total Partners: {totalDownline}</Text>
                        </View>
                    </View>

                </View>

                {/* Referral Link Section (Fixed at top) */}
                <View style={[styles.referralSection, isDesktop && { paddingHorizontal: SPACING.xl }]}>
                    <Text style={styles.referralLabel}>Invite Partners & Grow Network</Text>
                    <View style={styles.referralCodeRow}>
                        <Text style={styles.referralCodeLabel}>Your Referral Code:</Text>
                        <AnimatedCard style={styles.referralCodeBadge} onPress={handleCopyCode}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.referralCodeText}>{profile?.referral_code || '—'}</Text>
                                <View style={styles.copyBadge}>
                                    <Text style={styles.copyBadgeText}>Copy</Text>
                                </View>
                            </View>
                        </AnimatedCard>
                    </View>
                    <View style={[styles.referralBox, isDesktop && styles.referralBoxDesktop]}>
                        <Text style={styles.referralLink} numberOfLines={1}>{referralUrl}</Text>
                        <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
                            <Text style={styles.copyButtonText}>Copy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.copyButton, styles.shareButton]} onPress={handleShareLink}>
                            <Share2 size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Hierarchy Tree Area (Scrollable Only) */}
                <ScrollView
                    style={styles.treeScroll}
                    contentContainerStyle={styles.treeScrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />
                    }
                >
                    <View style={styles.treeHeading}>
                        <TrendingUp size={18} color={COLORS.secondary} />
                        <Text style={styles.treeHeadingText}>Horizontal Genealogy Chart</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
                        <View style={styles.horizontalTreeContainer}>
                            {hierarchy.length > 0 ? (
                                hierarchy.map((root, index) => (
                                    <GenealogyNode key={root.id} member={root} depth={0} isLastChild={index === hierarchy.length - 1} />
                                ))
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Users size={40} color="#CBD5E1" />
                                    <Text style={styles.emptyText}>No Network Found</Text>
                                    <Text style={styles.emptySub}>Share your referral link to build your tree!</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </ScrollView>
            </View>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loadingText: { color: COLORS.textSecondary, marginTop: 12, fontSize: 14 },

    header: {
        backgroundColor: 'transparent',
        padding: SPACING.l,
        alignItems: 'flex-start',
        paddingBottom: 0
    },
    headerDesktop: {
        width: '100%',
        paddingHorizontal: SPACING.l,
        paddingTop: SPACING.xl,
        paddingBottom: 0,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: SPACING.m,
    },
    headerTitle: {
        fontSize: SIZES.h3,
        color: 'darkgreen',
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: SIZES.font,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    statsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5', // Light green background
        paddingHorizontal: SPACING.s,
        paddingVertical: SPACING.xs,
        borderRadius: SIZES.radius,
    },
    statsBadgeText: {
        marginLeft: SPACING.xs,
        color: '#166534', // Dark green text
        fontWeight: '600',
        fontSize: SIZES.font,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.glassBg,
        borderRadius: SIZES.radius,
        paddingHorizontal: SPACING.s,
        paddingVertical: SPACING.xs,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        width: '100%',
        marginBottom: SPACING.m,
        ...Platform.select({
            web: { backdropFilter: 'blur(8px)' }
        })
    },
    searchInput: {
        flex: 1,
        marginLeft: SPACING.s,
        color: COLORS.text,
        fontSize: SIZES.font,
        paddingVertical: Platform.OS === 'web' ? 8 : 0, // Adjust for web input padding
        outlineStyle: 'none', // Remove inner black border on web
    },
    filterTabs: {
        width: '100%',
        marginBottom: SPACING.s,
    },
    filterTab: {
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: SIZES.radius,
        marginRight: SPACING.s,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    activeFilterTab: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterTabText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
        fontSize: SIZES.font,
    },
    activeFilterTabText: {
        color: COLORS.white,
    },
    listContent: {
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.xl * 2, // Ensure enough space at the bottom
    },
    listContentDesktop: {
        paddingHorizontal: SPACING.xl,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING.xl * 2,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        color: COLORS.text,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        maxWidth: '80%',
    },

    // Horizontal Tree Styles
    treeHeading: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        marginTop: 20, // Add space from referral section
        marginBottom: 15,
        gap: 10,
    },
    treeHeadingText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        letterSpacing: 0.5,
    },
    horizontalScroll: {
        flex: 1,
        paddingVertical: 10,
    },
    horizontalTreeContainer: {
        paddingHorizontal: SPACING.m,
        alignItems: 'flex-start',
        paddingRight: 100, // Extra space for deep trees
    },
    horizontalNodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nodeContainer: {
        position: 'relative',
        paddingVertical: 4,
        height: 80, // Row height
        justifyContent: 'center',
    },
    horizontalNodeCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Solid white as per image 2
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 16,
        alignItems: 'center',
        width: 220, // Wider horizontal look
        height: 70, // Fixed height for consistency
        borderWidth: 2, // Highlighted border
        borderColor: COLORS.glassBorder,
        borderLeftWidth: 6,
        borderLeftColor: COLORS.secondary,
        marginVertical: 10, // More space between cards
        marginLeft: 40,
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        }),
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    horizontalNodeCardExpanded: {
        backgroundColor: '#fff',
        borderColor: COLORS.secondary + '40',
        shadowOpacity: 0.15,
        elevation: 5,
    },
    horizontalNodeAvatar: {
        width: 44, // Larger as per image 2
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    nodeMainInfo: {
        flex: 1,
    },
    nodeName: {
        fontSize: 15, // Larger for readability
        fontWeight: 'bold',
        color: COLORS.text,
    },
    nodeId: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    nodeLevelBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 10,
    },
    nodeLevelText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748b',
    },
    expandIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    expandIndicatorActive: {
        backgroundColor: COLORS.secondary,
        borderColor: COLORS.secondary,
    },
    childrenColumn: {
        flexDirection: 'column',
        position: 'relative',
        paddingLeft: 40, // Increased from 20 for more space between levels
    },
    // Connectors
    horizontalLineFromParent: {
        position: 'absolute',
        left: 0,
        top: 40,
        width: 40, // Increased from 20
        height: 1,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        borderStyle: 'dashed',
    },
    horizontalLineToChildren: {
        position: 'absolute',
        right: -40, // Increased from -20
        top: 40,
        width: 40, // Increased from 20
        height: 1,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        borderStyle: 'dashed',
        zIndex: -1,
    },
    childrenVerticalStem: {
        position: 'absolute',
        left: 0,
        top: 40,
        bottom: 40,
        width: 1,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
        borderStyle: 'dashed',
    },

    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        marginHorizontal: SPACING.m,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        width: 180,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },

    referralSection: {
        marginHorizontal: 15,
        marginTop: 5,
        marginBottom: 15,
        padding: 15,
        backgroundColor: COLORS.glassBg,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.glassBorder,
        width: '98%',
        alignSelf: 'center',
        ...Platform.select({
            web: { backdropFilter: 'blur(12px)' }
        })
    },
    referralLabel: {
        fontSize: 20,
        color: 'black',
        marginBottom: 8,
        fontWeight: '600',
    },
    referralBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        width: '100%',
    },
    referralBoxDesktop: {
        width: '100%',
        alignSelf: 'stretch',
    },
    referralLink: {
        flex: 1,
        color: COLORS.text,
        fontSize: 13,
        marginRight: 10,
    },
    referralCodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    referralCodeLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '600',
        marginRight: 10,
    },
    referralCodeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: COLORS.secondary,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 5,
        gap: 8,
    },
    referralCodeText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.secondary,
        letterSpacing: 1,
    },
    copyBadge: {
        backgroundColor: COLORS.secondary + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    copyBadgeText: {
        fontSize: 10,
        color: COLORS.secondary,
        fontWeight: 'bold',
    },
    copyButton: {
        backgroundColor: '#852834',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    copyButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    shareButton: {
        backgroundColor: '#7b8c24',
        marginLeft: 8,
    },
});

export default NetworkScreen;

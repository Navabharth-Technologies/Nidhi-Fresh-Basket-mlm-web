import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Menu, User, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../store/AuthContext';
import apiClient from '../api/client';
import { COLORS } from '../theme/theme';

const MainHeader = ({ title, navigation, onProfilePress, showBack, hideProfile }) => {
    const { profile } = useAuth();
    return (
        <View style={styles.header}>
            <View style={styles.leftSection}>
                {showBack ? (
                    <TouchableOpacity 
                        style={styles.menuBtn} 
                        onPress={() => {
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            } else if (navigation.getParent()?.openDrawer) {
                                navigation.getParent().openDrawer();
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft color={COLORS.primary} size={28} strokeWidth={2} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={styles.menuBtn} 
                        onPress={() => navigation.openDrawer()}
                        activeOpacity={0.7}
                    >
                        <Menu color={COLORS.primary} size={24} strokeWidth={1.8} />
                    </TouchableOpacity>
                )}
                <Text style={styles.title}>{title}</Text>
            </View>
            {!hideProfile ? (
                <TouchableOpacity 
                    style={styles.profileBtn} 
                    onPress={onProfilePress || (() => navigation.navigate('Main', { screen: 'Profile' }))}
                    activeOpacity={0.7}
                >
                    <View style={styles.headerAvatar}>
                        {profile?.profile_image_binary ? (
                            <Image 
                                source={{ uri: `${apiClient.defaults.baseURL}/users/view-profile-image/${profile.id}?t=${Date.now()}` }} 
                                style={styles.avatarImage} 
                            />
                        ) : (
                            <User color={COLORS.primary} size={24} strokeWidth={1.8} />
                        )}
                    </View>
                </TouchableOpacity>
            ) : (
                <View style={styles.profileBtn} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        zIndex: 100,
        height: 60,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuBtn: {
        width: 44, // Ensures 44x44 touch area
        height: 44,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginLeft: 4, // Offset slightly to account for menuBtn's internal alignment to get 12px total gap
    },
    profileBtn: {
        width: 44,
        height: 44,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    headerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.primary + '20',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    }
});

export default MainHeader;

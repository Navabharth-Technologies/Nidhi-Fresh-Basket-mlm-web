import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SIZES } from '../theme/theme';

const PlaceholderScreen = ({ name }) => (
    <View style={styles.container}>
        <Text style={styles.title}>{name} Screen</Text>
        <Text style={styles.subtitle}>Coming Soon...</Text>
    </View>
);

export const DashboardScreen = () => <PlaceholderScreen name="Dashboard" />;
export const WalletScreen = () => <PlaceholderScreen name="Wallet" />;
export const NetworkScreen = () => <PlaceholderScreen name="Network" />;
export const PackageScreen = () => <PlaceholderScreen name="Package" />;
export const ProfileScreen = () => <PlaceholderScreen name="Profile" />;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: SIZES.h2, color: COLORS.secondary, fontWeight: 'bold' },
    subtitle: { fontSize: SIZES.font, color: COLORS.textSecondary, marginTop: 10 }
});

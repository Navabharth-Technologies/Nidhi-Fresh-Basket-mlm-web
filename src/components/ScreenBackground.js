import React from 'react';
import { StyleSheet, ImageBackground, View, Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const ScreenBackground = ({ children, subtle = false, admin = false }) => {
    const bgImage = admin 
        ? require('../../assets/user_garden_bg.jpg')
        : require('../../assets/internal_pages_bg.jpg');

    return (
        <ImageBackground
            source={bgImage}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={[styles.overlay, admin && styles.adminOverlay]}>
                {children}
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        minHeight: Platform.OS === 'web' ? '100vh' : '100%',
        ...Platform.select({
            web: { height: 'auto' }
        })
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.5)', 
        minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    },
    adminOverlay: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)', 
    }
});

export default ScreenBackground;

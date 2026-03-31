import React, { useState } from 'react';
import { Animated, Pressable, Platform } from 'react-native';

const AnimatedCard = ({ children, style, onPress, hoverStyle, disableHover = false }) => {
    const [scale] = useState(new Animated.Value(1));
    const [isHovered, setIsHovered] = useState(false);
    
    const animateScale = (toValue) => {
        Animated.spring(scale, {
            toValue,
            useNativeDriver: Platform.OS !== 'web',
            friction: 7,
            tension: 60
        }).start();
    };

    const showHover = !disableHover && Platform.OS === 'web';

    return (
        <Animated.View style={[
            style, 
            { transform: [{ scale }] },
            (isHovered && !disableHover) && hoverStyle
        ]}>
            <Pressable 
                onPressIn={() => animateScale(0.98)} 
                onPressOut={() => animateScale(1)}
                onHoverIn={() => {
                    if (!disableHover) {
                        setIsHovered(true);
                        animateScale(1.02);
                    }
                }}
                onHoverOut={() => {
                    if (!disableHover) {
                        setIsHovered(false);
                        animateScale(1);
                    }
                }}
                onPress={onPress}
                style={[{ width: '100%', flex: 1 }, Platform.OS === 'web' && { height: '100%', outlineStyle: 'none' }]}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};

export default AnimatedCard;

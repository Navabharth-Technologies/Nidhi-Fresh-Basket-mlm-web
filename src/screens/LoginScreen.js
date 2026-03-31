import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ImageBackground, Image, useWindowDimensions, Linking, Animated, Pressable, ActivityIndicator, PanResponder } from 'react-native';
import { useAuth } from '../store/AuthContext';
import apiClient from '../api/client';
import { LogIn, UserPlus, Facebook, Instagram, Eye, EyeOff, User, Lock, ArrowRight, Leaf, Apple, Citrus, Grape, Strawberry, MessageCircle, AtSign } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const OrbitingFruit = ({ type, radiusX = 100, radiusY = 50, duration = 10000, delay = 0, isLarge = true }) => {
    const orbitAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(orbitAnim, {
                toValue: 1,
                duration: duration,
                delay: delay,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const translateX = orbitAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.PI * 2],
    }).interpolate({
        inputRange: [0, Math.PI * 2],
        outputRange: [-radiusX, radiusX], // Basic interpolation won't do sine directly, we'll use a trick
    });

    // In React Native, for true orbits we need a custom listener or many steps.
    // Instead we'll use a 4-point approximation with spring or sequence for a smooth feel
    // or just use the OrganicParticle but with a wider 'drift' logic if circular is hard.
    // Let's use two animations for X and Y with phase shift:
    const animX = useRef(new Animated.Value(0)).current;
    const animY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createLoop = (anim, d, startVal) => {
            anim.setValue(startVal);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: 1, duration: d / 4, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0, duration: d / 4, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: -1, duration: d / 4, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0, duration: d / 4, useNativeDriver: true }),
                ])
            ).start();
        };

        createLoop(animX, duration, 0);
        setTimeout(() => createLoop(animY, duration, 0), duration / 4);
    }, []);

    const x = animX.interpolate({ inputRange: [-1, 1], outputRange: [-radiusX, radiusX] });
    const y = animY.interpolate({ inputRange: [-1, 1], outputRange: [-radiusY, radiusY] });
    const rotate = animX.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] });

    const renderIcon = () => {
        const props = { size: isLarge ? 32 : 24, color: '#4caf50' };
        if (type === 'apple') return <Apple {...props} color="#ef5350" />;
        if (type === 'citrus') return <Citrus {...props} color="#ffb74d" />;
        return <Leaf {...props} color="#81c784" />;
    };

    return (
        <Animated.View style={[
            styles.orbitContainer,
            { transform: [{ translateX: x }, { translateY: y }, { rotate }] }
        ]}>
            <View style={styles.juiceGlow} />
            {renderIcon()}
        </Animated.View>
    );
};

const FocusAura = ({ active }) => {
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (active) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
                    Animated.timing(pulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulse.setValue(0);
        }
    }, [active]);

    const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] });
    const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] });

    return (
        <Animated.View style={[styles.focusAura, { transform: [{ scale }], opacity }]} />
    );
};

const VineElement = ({ style, delay }) => {
    const grow = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(grow, { toValue: 1, duration: 2000, delay, useNativeDriver: true }).start();
    }, []);
    return (
        <Animated.View style={[style, { transform: [{ scale: grow }], opacity: grow }]}>
            <Leaf size={40} color="rgba(46, 125, 50, 0.15)" />
        </Animated.View>
    );
};

const OrganicParticle = ({ type, style, delay = 0, isLarge = false, mousePos, focusActive }) => {
    const { width, height } = useWindowDimensions();
    const floatAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const entranceAnim = useRef(new Animated.Value(0)).current;
    const driftAnim = useRef(new Animated.Value(0)).current;
    const focusAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance: Slice reveal effect (scale + slide)
        Animated.spring(entranceAnim, {
            toValue: 1,
            friction: 4,
            tension: 20,
            delay: delay,
            useNativeDriver: true,
        }).start();

        // Constant floating loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 6000 + Math.random() * 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 6000 + Math.random() * 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Drift (horizontal/diagonal)
        Animated.loop(
            Animated.sequence([
                Animated.timing(driftAnim, {
                    toValue: 1,
                    duration: 18000 + Math.random() * 5000,
                    useNativeDriver: true,
                }),
                Animated.timing(driftAnim, {
                    toValue: 0,
                    duration: 18000 + Math.random() * 5000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Slow rotation loop
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 30000 + Math.random() * 10000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    useEffect(() => {
        if (focusActive) {
            Animated.spring(focusAnim, {
                toValue: 1,
                friction: 4,
                tension: 30,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(focusAnim, {
                toValue: 0,
                friction: 4,
                tension: 30,
                useNativeDriver: true,
            }).start();
        }
    }, [focusActive]);

    const translateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -25],
    });

    const driftX = driftAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 50],
    });

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const entranceScale = entranceAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const finalOpacity = entranceAnim.interpolate({
        inputRange: [0, 1],
        outputRange: isLarge ? [0, 0.45] : [0, 0.25],
    });

    // Parallax logic for Web
    const parallaxX = mousePos ? mousePos.x.interpolate({
        inputRange: [0, width],
        outputRange: isLarge ? [8, -8] : [15, -15],
    }) : 0;

    const parallaxY = mousePos ? mousePos.y.interpolate({
        inputRange: [0, height],
        outputRange: isLarge ? [8, -8] : [15, -15],
    }) : 0;

    const focusScale = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.2],
    });

    const renderIcon = () => {
        const props = { size: isLarge ? 34 : 20, color: '#2e7d32' };
        let IconComp;
        switch (type) {
            case 'apple': IconComp = Apple; break;
            case 'leaf': IconComp = Leaf; break;
            case 'citrus': IconComp = Citrus; break;
            case 'strawberry': IconComp = Strawberry; break;
            case 'grape': IconComp = Grape; break;
            default: IconComp = Leaf;
        }
        const FinalIcon = IconComp || Leaf;

        let color = props.color;
        if (type === 'leaf') color = "#81c784";
        if (type === 'citrus') color = "#fb8c00";
        if (type === 'strawberry') color = "#ef5350";
        if (type === 'grape') color = "#9575cd";

        return <FinalIcon {...props} color={color} />;
    };

    return (
        <Animated.View style={[
            style,
            {
                transform: [
                    { scale: entranceScale },
                    { translateY: translateY },
                    { translateX: driftX },
                    { translateX: parallaxX },
                    { translateY: parallaxY },
                    { rotate: rotate },
                    { scale: focusScale }
                ],
                opacity: finalOpacity
            }
        ]}>
            <View style={styles.juiceGlow} />
            {renderIcon()}
        </Animated.View>
    );
};

const LightSweep = () => {
    const sweepAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(sweepAnim, {
                    toValue: 1,
                    duration: 4000,
                    delay: 8000,
                    useNativeDriver: true,
                }),
                Animated.timing(sweepAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const translateX = sweepAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-500, 1500],
    });

    return (
        <Animated.View style={[styles.sweepContainer, { transform: [{ translateX }, { rotate: '15deg' }] }]}>
            <LinearGradient
                colors={['transparent', 'rgba(255, 255, 180, 0.2)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
            />
        </Animated.View>
    );
};

const BurstParticle = ({ x, y, type, onComplete }) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.sequence([
            Animated.spring(anim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 4,
                tension: 40
            }),
            Animated.timing(anim, {
                toValue: 2,
                duration: 600,
                useNativeDriver: true
            })
        ]).start(() => onComplete());
    }, []);

    const scale = anim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [0, 1.2, 1.4]
    });
    const opacity = anim.interpolate({
        inputRange: [0, 1, 1.5, 2],
        outputRange: [0, 0.8, 0.5, 0]
    });

    const typesMap = { apple: Apple, citrus: Citrus, leaf: Leaf, grape: Grape, strawberry: Strawberry };
    const Icon = typesMap[type] || Leaf;

    const colorsMap = { apple: '#ef5350', citrus: '#fb8c00', leaf: '#81c784', grape: '#9575cd', strawberry: '#ef5350' };
    const color = colorsMap[type] || '#2e7d32';

    return (
        <Animated.View pointerEvents="none" style={{
            position: 'absolute',
            left: x - 20, // offset by radius
            top: y - 24, // offset by radius
            transform: [{ scale }],
            opacity,
            zIndex: 9999
        }}>
            <Icon color={color} size={40} strokeWidth={1} />
        </Animated.View>
    );
};

const FloatingParticle = ({ style, delay = 0 }) => {
    // Kept generic for tiny dots / pollen-like particles as well
    const moveAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(moveAnim, {
                    toValue: 1,
                    duration: 4000 + Math.random() * 2000,
                    delay: delay,
                    useNativeDriver: true,
                }),
                Animated.timing(moveAnim, {
                    toValue: 0,
                    duration: 4000 + Math.random() * 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);
    const translateY = moveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -20],
    });
    const opacity = moveAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.05, 0.15, 0.05],
    });
    return <Animated.View style={[style, { transform: [{ translateY }], opacity }]} />;
};

const HoverableSocialIcon = ({ icon: Icon, color, hoverColor, onPress, style }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <TouchableOpacity
            style={[style, isHovered && { backgroundColor: hoverColor + '20', borderColor: hoverColor }]}
            onPress={onPress}
            {...(Platform.OS === 'web' ? {
                onMouseEnter: () => setIsHovered(true),
                onMouseLeave: () => setIsHovered(false)
            } : {})}
        >
            <Icon color={isHovered ? hoverColor : color} size={18} />
        </TouchableOpacity>
    );
};

const AnimatedCard = ({ children, style, loading }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 1.02,
            useNativeDriver: true,
            friction: 4,
            tension: 50
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 4,
            tension: 50
        }).start();
    };

    const translateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -8],
    });

    const inverseTranslateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 8],
    });

    return (
        <View style={style}>
            {/* The actual moving background card */}
            <Animated.View style={[
                StyleSheet.absoluteFill,
                styles.cardBackground,
                { transform: [{ scale }, { translateY }] }
            ]} />

            {/* Static Content container */}
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading}
                style={{ flex: 1 }}
            >
                {/* Apply inverse translation to the children to keep them 'still' on screen while BG moves */}
                {/* Actually, if the user doesn't want the text to move, we just keep the background moving and children static */}
                <View style={{ width: '100%', padding: 20 }}>
                    {children}
                </View>
            </Pressable>
        </View>
    );
};

const LoginScreen = ({ navigation }) => {
    const { width, height } = useWindowDimensions();
    const isDesktop = width >= 768;

    const showAlert = (title, message) => {
        if (Platform.OS === 'web') {
            alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const [particles, setParticles] = useState([]);

    const handleTouch = (e) => {
        const { pageX, pageY } = e.nativeEvent;
        // Basic sanity check to avoid massive spam
        if (particles.length > 15) return;

        const types = ['apple', 'citrus', 'leaf', 'grape', 'strawberry'];
        const type = types[Math.floor(Math.random() * types.length)];
        const id = Date.now() + Math.random();

        setParticles(prev => [...prev, { id, x: pageX, y: pageY, type }]);
    };

    const removeParticle = (id) => {
        setParticles(prev => prev.filter(p => p.id !== id));
    };

    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [isLoginIdFocused, setIsLoginIdFocused] = useState(false);
    const { login } = useAuth();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const logoFloatAnim = useRef(new Animated.Value(0)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;
    const breathingAnim = useRef(new Animated.Value(0)).current;

    const mousePos = useRef(new Animated.ValueXY({ x: width / 2, y: height / 2 })).current;
    const isFormFocused = isLoginIdFocused || isPasswordFocused;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
                mousePos.setValue({ x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY });
            },
        })
    ).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideUpAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(breathingAnim, { toValue: 1, duration: 8000, useNativeDriver: true }),
                    Animated.timing(breathingAnim, { toValue: 0, duration: 8000, useNativeDriver: true }),
                ])
            ),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(logoFloatAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
                    Animated.timing(logoFloatAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
                ])
            )
        ]).start();
    }, []);

    const backgroundScale = breathingAnim.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.05] });

    const logoTranslateY = logoFloatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -10],
    });

    const handleLogin = async () => {
        if (!loginId || !password) return showAlert('Error', 'Please fill all fields');
        setLoading(true);
        try {
            const res = await apiClient.post('/users/login', { loginId, password });
            if (res.data && res.data.user) {
                await login(res.data.token, 'user', res.data.user.is_active);
            } else {
                showAlert('Login Failed', 'Invalid response from server.');
            }
        } catch (userError) {
            // If user login fails, see if it is valid for an admin.
            try {
                const adminRes = await apiClient.post('/admin/login', { username: loginId, password });
                if (adminRes.data && adminRes.data.token) {
                    await login(adminRes.data.token, 'admin', true);
                } else {
                    showAlert('Login Failed', 'Invalid response from server.');
                }
            } catch (adminError) {
                const errorMsg = userError.response?.data?.msg || adminError.response?.data?.msg || 'Invalid credentials';
                showAlert('Login Failed', errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            onStartShouldSetResponder={() => true}
            onResponderStart={handleTouch}
        >
            <View style={StyleSheet.absoluteFill}>
                <ImageBackground
                    source={require('../../assets/login_hero_fruits_v2.png')}
                    style={[styles.fullScreenBackground, { transform: [{ scale: backgroundScale }] }]}
                    resizeMode="cover"
                    {...(Platform.OS === 'web' ? panResponder.panHandlers : {})}
                >
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.7)', 'rgba(232, 245, 233, 0.3)', 'rgba(255, 255, 255, 0.8)']}
                        style={StyleSheet.absoluteFillObject}
                    />

                    {/* LightSweep removed as per request */}

                    {/* Freshness Sparks (Pollen/Seeds as generic dots) */}
                    <FloatingParticle style={{ position: 'absolute', top: '10%', left: '30%', width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff9c4' }} delay={100} />
                    <FloatingParticle style={{ position: 'absolute', bottom: '20%', right: '40%', width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#e8f5e9' }} delay={400} />

                    {/* Vine Growth decorations at corners */}
                    <VineElement style={{ position: 'absolute', top: 10, left: 10 }} delay={200} />
                    <VineElement style={{ position: 'absolute', bottom: 10, right: 10, transform: [{ rotate: '180deg' }] }} delay={500} />

                    <OrganicParticle type="apple" style={{ position: 'absolute', top: '25%', left: '8%' }} delay={300} isLarge={true} mousePos={mousePos} focusActive={isFormFocused} />
                    <OrganicParticle type="strawberry" style={{ position: 'absolute', bottom: '25%', right: '12%' }} delay={600} isLarge={true} mousePos={mousePos} focusActive={isFormFocused} />

                    {/* Additional Organic Elements for Lush Garden Feel */}
                    <OrganicParticle type="citrus" style={{ position: 'absolute', top: '15%', right: '15%' }} delay={450} isLarge={true} mousePos={mousePos} focusActive={isFormFocused} />
                    <OrganicParticle type="grape" style={{ position: 'absolute', bottom: '15%', left: '15%' }} delay={750} isLarge={true} mousePos={mousePos} focusActive={isFormFocused} />
                    <OrganicParticle type="leaf" style={{ position: 'absolute', top: '45%', right: '5%' }} delay={150} isLarge={false} mousePos={mousePos} focusActive={isFormFocused} />
                    <OrganicParticle type="apple" style={{ position: 'absolute', bottom: '45%', left: '4%' }} delay={200} isLarge={false} mousePos={mousePos} focusActive={isFormFocused} />
                    <OrganicParticle type="leaf" style={{ position: 'absolute', top: '5%', left: '50%' }} delay={900} isLarge={false} mousePos={mousePos} focusActive={isFormFocused} />

                    {/* Garden Burst Particles */}
                    {particles.map(p => (
                        <BurstParticle
                            key={p.id}
                            x={p.x}
                            y={p.y}
                            type={p.type}
                            onComplete={() => removeParticle(p.id)}
                        />
                    ))}

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={true}
                        alwaysBounceVertical={true}
                    >
                        <Animated.View style={[
                            styles.heroContent,
                            isDesktop && styles.heroContentDesktop,
                            { opacity: fadeAnim }
                        ]}>
                            <View style={[styles.headerBar, isDesktop && styles.headerBarDesktop, { zIndex: 100 }]}>
                                <Image
                                    source={require('../../assets/nidhi_logo.png')}
                                    style={[styles.headerLogo, isDesktop && styles.headerLogoDesktop]}
                                    resizeMode="contain"
                                />
                            </View>

                            <View style={[styles.heroTextWrapper, isDesktop && styles.heroTextWrapperDesktop]}>
                                <Text style={[styles.heroMainTitle, isDesktop && styles.heroMainTitleDesktop]}>
                                    Earn Rewards{"\n"}While Shopping Fresh
                                </Text>
                                <Text style={[styles.heroSubtext, isDesktop && styles.heroSubtextDesktop]}>Fresh Groceries. Smart Savings.</Text>
                            </View>

                            <View style={[styles.cardsWrapper, isDesktop && styles.cardsWrapperDesktop]}>
                                <FocusAura active={isFormFocused} />
                                <OrbitingFruit type="apple" radiusX={isDesktop ? 220 : 180} radiusY={isDesktop ? 120 : 100} duration={12000} delay={0} />
                                <OrbitingFruit type="citrus" radiusX={isDesktop ? 240 : 200} radiusY={isDesktop ? 140 : 110} duration={15000} delay={2000} />

                                <AnimatedCard style={[styles.card, isDesktop && styles.cardDesktop]} loading={loading}>
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
                                            <LogIn color="#2e7d32" size={20} />
                                        </View>
                                        <Text style={styles.cardTitle}>Login</Text>
                                    </View>
                                    <Text style={styles.cardSubtitle}>
                                        Sign in to access tools, training, and shopping.
                                    </Text>


                                    <View style={[styles.inputContainer, isLoginIdFocused && styles.inputFocused]}>
                                        <View style={styles.inputIconWrapper}>
                                            <User size={18} color={isLoginIdFocused ? "#2e7d32" : "#999"} />
                                        </View>
                                        <TextInput
                                            style={styles.inputWithIcon}
                                            placeholder="User ID"
                                            placeholderTextColor="#777"
                                            value={loginId}
                                            onChangeText={(v) => {
                                                const cleanVal = v.replace(/[^A-Z0-9\-]/gi, '').toUpperCase();
                                                setLoginId(cleanVal);
                                            }}
                                            autoCapitalize="characters"
                                            autoComplete="username"
                                            textContentType="username"
                                            nativeID="unified_userid"
                                            onFocus={() => setIsLoginIdFocused(true)}
                                            onBlur={() => setIsLoginIdFocused(false)}
                                        />
                                    </View>

                                    <View style={[styles.passwordContainer, isPasswordFocused && styles.passwordContainerFocused]}>
                                        <View style={styles.inputIconWrapper}>
                                            <Lock size={18} color={isPasswordFocused ? "#2e7d32" : "#999"} />
                                        </View>
                                        <TextInput
                                            style={styles.passwordInput}
                                            placeholder="Password"
                                            placeholderTextColor="#777"
                                            value={password}
                                            onChangeText={(v) => setPassword(v.replace(/\s/g, ''))}
                                            secureTextEntry={!showPassword}
                                            autoComplete="current-password"
                                            textContentType="password"
                                            nativeID="unified_password"
                                            onFocus={() => setIsPasswordFocused(true)}
                                            onBlur={() => setIsPasswordFocused(false)}
                                        />
                                        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <Eye size={18} color="#666" /> : <EyeOff size={18} color="#666" />}
                                        </TouchableOpacity>
                                    </View>

                                    <Pressable
                                        onPressIn={() => Animated.spring(buttonScale, { toValue: 1.05, useNativeDriver: true }).start()}
                                        onPressOut={() => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start()}
                                        onPress={handleLogin}
                                        disabled={loading}
                                    >
                                        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                                            <LinearGradient
                                                colors={['#1b5e20', '#2e7d32', '#43a047']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.signInGradientButton}
                                            >
                                                {loading ? (
                                                    <ActivityIndicator color="#fff" size="small" />
                                                ) : (
                                                    <View style={styles.buttonContent}>
                                                        <Text style={styles.signInText}>Sign In</Text>
                                                        <ArrowRight color="#fff" size={18} style={{ marginLeft: 8 }} />
                                                    </View>
                                                )}
                                            </LinearGradient>
                                        </Animated.View>
                                    </Pressable>

                                    <TouchableOpacity
                                        style={styles.forgotPasswordLink}
                                        onPress={() => navigation.navigate('ForgotPassword')}
                                    >
                                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.signUpButton}
                                        onPress={() => navigation.navigate('Register')}
                                    >
                                        <Text style={styles.signUpText}>New here? Register</Text>
                                    </TouchableOpacity>
                                </AnimatedCard>
                            </View>

                            {/* Secure Login Text under cards */}
                            <View style={styles.secureLoginBottom}>
                                <View style={styles.secureBadge}>
                                    <Lock size={12} color="#2e7d32" />
                                </View>
                                <Text style={styles.secureLoginText}>Secure SSL Encryption • Privacy Guaranteed</Text>
                            </View>

                            {/* Integrated Links and Socials */}
                            <View style={styles.footerContent}>
                                <View style={styles.footerLinksCentered}>
                                    <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                                        <Text style={styles.link}>Privacy Policy</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.linkDivider}>•</Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('TermsAndConditions')}>
                                        <Text style={styles.link}>Terms of Use</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.socialLinksContainer}>
                                    <HoverableSocialIcon
                                        style={styles.socialIcon}
                                        icon={Facebook}
                                        color="#2e7d32"
                                        hoverColor="#1877F2"
                                        onPress={() => Linking.openURL('https://www.facebook.com/share/18BK7Pbqi8/')}
                                    />
                                    <HoverableSocialIcon
                                        style={styles.socialIcon}
                                        icon={Instagram}
                                        color="#2e7d32"
                                        hoverColor="#E4405F"
                                        onPress={() => Linking.openURL('https://www.instagram.com/nidhifreshbasket?igsh=bDJ1MHZoeWpsY3hs')}
                                    />
                                    <HoverableSocialIcon
                                        style={styles.socialIcon}
                                        icon={MessageCircle}
                                        color="#2e7d32"
                                        hoverColor="#25D366"
                                        onPress={() => Linking.openURL('https://whatsapp.com/channel/0029VbCIh6GHgZWlCBeUmc08')}
                                    />
                                    <HoverableSocialIcon
                                        style={styles.socialIcon}
                                        icon={AtSign}
                                        color="#2e7d32"
                                        hoverColor="#000000"
                                        onPress={() => Linking.openURL('https://www.threads.com/@nidhifreshbasket')}
                                    />
                                </View>

                                <Text style={styles.copyright}>
                                    © 2026 Nidhi Fresh Basket. Version 2.0
                                </Text>
                                <TouchableOpacity onPress={() => Linking.openURL('https://www.navabharathtechnologies.com/')}>
                                    <Text style={styles.poweredBy}>Powered by Navabharath Technologies</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </ImageBackground>
            </View>
        </KeyboardAvoidingView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    fullScreenBackground: {
        flex: 1,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    sweepContainer: {
        position: 'absolute',
        top: 0,
        height: '100%',
        width: 300,
        zIndex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 0,
        backgroundColor: 'transparent',
        minHeight: 0,
        width: '100%',
    },
    orbitContainer: {
        position: 'absolute',
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    juiceGlow: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 10,
    },
    focusAura: {
        position: 'absolute',
        width: 450,
        height: 450,
        borderRadius: 225,
        backgroundColor: 'rgba(232, 245, 233, 0.2)',
        alignSelf: 'center',
        zIndex: -1,
    },
    headerBarDesktop: {
        paddingHorizontal: 0,
        paddingVertical: 0,
    },
    headerLogo: {
        width: 180,
        height: 170,
        marginTop: -35,
        marginBottom: -14,
    },
    headerLogoDesktop: {
        width: 480,
        height: 180,
        marginBottom: -20,
    },
    cardBackground: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        ...Platform.select({
            web: { backdropFilter: 'blur(20px)' }
        })
    },
    heroContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
    },
    heroContentDesktop: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: '5%',
        transform: [{ translateY: -40 }],
        marginTop: 70,
    },
    heroTextWrapper: {
        width: '100%',
        marginTop: 20, // Replaces previous absolute offset
        alignItems: 'center',
    },
    heroTextWrapperDesktop: {
        width: '100%',
        marginTop: 0,
        marginBottom: 40,
        alignItems: 'center',
    },
    heroMainTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: '#1b5e20',
        lineHeight: 44,
        textAlign: 'center',
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 3 },
        textShadowRadius: 6,
        marginTop: -50,
    },
    heroSubtext: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
        fontWeight: '500',
    },
    heroSubtextDesktop: {
        marginTop: 20,
        marginBottom: -10,
    },
    heroMainTitleDesktop: {
        fontSize: 48, // Adjusted from 64 slightly for better fit with subtext
        lineHeight: 64,
        marginTop: -5,
    },
    cardsWrapper: {
        width: '90%',
        maxWidth: 380,
        alignSelf: 'center',
        gap: 12,
        marginTop: 24,
    },
    cardsWrapperDesktop: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    cardDesktop: {
        width: '100%',
    },
    card: {
        borderRadius: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    iconCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 12,
        marginBottom: 8,
        height: 48,
        paddingHorizontal: 12,
        width: '100%',
        overflow: 'hidden',
    },
    inputWithIcon: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%',
        ...Platform.select({
            web: { outlineStyle: 'none' }
        })
    },
    inputFocused: {
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#2e7d32',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    inputIconWrapper: {
        width: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 12,
        marginBottom: 12,
        height: 52,
        paddingLeft: 12,
        paddingRight: 4, 
        width: '100%',
        overflow: 'hidden',
    },
    passwordContainerFocused: {
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#2e7d32',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    passwordInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%',
        minWidth: 0,
        flexShrink: 1,
        ...Platform.select({
            web: { outlineStyle: 'none' }
        })
    },
    eyeIcon: {
        width: 44,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
        ...Platform.select({
            web: { cursor: 'pointer' }
        })
    },
    signInGradientButton: {
        borderRadius: 8,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    signInText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    forgotPasswordLink: {
        alignItems: 'center',
        marginBottom: 15,
    },
    forgotPasswordText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    signUpButton: {
        borderWidth: 1.5,
        borderColor: '#2e7d32',
        borderRadius: 8,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    signUpText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#2e7d32',
    },
    secureBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e8f5e9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    secureLoginBottom: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        backgroundColor: 'rgba(232, 245, 233, 0.5)',
        paddingVertical: 6,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    secureLoginText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '600',
    },
    adminLink: {
        marginTop: 15,
        alignItems: 'center',
    },
    adminLinkText: {
        color: '#fff',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    footerWrap: {
        width: '100%',
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        paddingHorizontal: 20,
        overflow: 'hidden',
    },
    footerContent: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 30, // Extra space at bottom of integrated content
        gap: 12,
    },
    footerLogoSmall: {
        width: 160,
        height: 80,
        marginBottom: 5,
    },
    footerLinksCentered: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 0,
    },
    socialLinksContainer: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 0,
    },
    socialIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    link: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    linkDivider: {
        color: '#ccc',
        fontSize: 16,
        marginHorizontal: 0,
    },
    copyright: {
        fontSize: 14,
        color: 'black',
        textAlign: 'center',
        marginTop: 5,
    },
    poweredBy: {
        fontSize: 15,
        color: '#1a531b',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 2,
    }
});

export default LoginScreen;

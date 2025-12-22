import React, { useState, useEffect } from 'react';
import { StyleSheet, Switch, View, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { apiProvider } from '@/services/apiProvider';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function SettingsScreen() {
    const [isMockMode, setIsMockMode] = useState(true);
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];

    useEffect(() => {
        const loadSettings = async () => {
            const mode = await apiProvider.isMockMode();
            setIsMockMode(mode);
        };
        loadSettings();
    }, []);

    const toggleMockMode = async (value: boolean) => {
        setIsMockMode(value);
        await apiProvider.setMockMode(value);

        Alert.alert(
            'Mode Switched',
            `App is now in ${value ? 'Mock (Simulation)' : 'Real Firebase'} mode.`,
            [{ text: 'OK' }]
        );
    };

    return (
        <ThemedView style={styles.container}>
            <BlurView intensity={80} tint={colorScheme} style={styles.header}>
                <ThemedText type="title" style={styles.headerTitle}>Settings</ThemedText>
            </BlurView>

            <View style={styles.content}>
                <View style={[styles.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <View style={[styles.iconContainer, { backgroundColor: isMockMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                                <Ionicons
                                    name={isMockMode ? "flask" : "cloud-done"}
                                    size={24}
                                    color={isMockMode ? themeColors.tint : "#10b981"}
                                />
                            </View>
                            <View>
                                <ThemedText type="defaultSemiBold">Mock Mode</ThemedText>
                                <ThemedText style={styles.settingSubtitle}>
                                    {isMockMode
                                        ? "Using simulated data (No internet required)"
                                        : "Connecting to real Firebase backend"}
                                </ThemedText>
                            </View>
                        </View>
                        <Switch
                            value={isMockMode}
                            onValueChange={toggleMockMode}
                            trackColor={{ false: '#767577', true: themeColors.tint }}
                            thumbColor="#f4f3f4"
                        />
                    </View>
                </View>

                <ThemedText style={styles.helpText}>
                    {isMockMode
                        ? "Toggle this off when you are ready to test with your actual Firebase project and Gemini API."
                        : "If the app fails to connect, ensure your .env file is correct and Firebase Functions are deployed."}
                </ThemedText>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color={themeColors.icon} />
                    <ThemedText style={styles.infoText}>
                        Requires app restart or page refresh to fully apply in some cases.
                    </ThemedText>
                </View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
    },
    content: {
        padding: 20,
    },
    section: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 4,
        marginBottom: 16,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingSubtitle: {
        fontSize: 12,
        opacity: 0.6,
        marginTop: 2,
    },
    helpText: {
        fontSize: 14,
        opacity: 0.7,
        paddingHorizontal: 12,
        lineHeight: 20,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 12,
    },
    infoText: {
        fontSize: 13,
        marginLeft: 10,
        opacity: 0.5,
        flex: 1,
    },
});

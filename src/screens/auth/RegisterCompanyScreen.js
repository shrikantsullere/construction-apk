import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, SIZES } from '../../theme/theme';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { LinearGradient } from 'expo-linear-gradient';

import { useApp } from '../../context/AppContext';

const RegisterCompanyScreen = ({ navigation }) => {
    const { registerCompany } = useApp();
    const [formData, setFormData] = useState({
        companyName: '',
        adminName: '',
        email: '',
        phone: '',
        password: 'password123' // Default for registration in this simple flow
    });
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!formData.companyName || !formData.email) {
            alert('Please fill in required fields');
            return;
        }
        setLoading(true);
        const res = await registerCompany(formData);
        setLoading(false);

        if (res.success) {
            navigation.replace('Main');
        } else {
            alert(res.message);
        }
    };

    return (
        <LinearGradient colors={COLORS.headerGradient} style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Text style={styles.backText}>← Back to Login</Text>
                        </TouchableOpacity>

                        <Text style={styles.title}>Register Workspace</Text>
                        <Text style={styles.subtitle}>Create a new BuildMaster enterprise account</Text>

                        <View style={styles.form}>
                            <CustomInput
                                label="Company Name"
                                placeholder="e.g. BuildMaster Partners"
                                value={formData.companyName}
                                onChangeText={(text) => setFormData({ ...formData, companyName: text })}
                            />
                            <View style={{ height: SPACING.m }} />
                            <CustomInput
                                label="Primary Administrator"
                                placeholder="Full Name"
                                value={formData.adminName}
                                onChangeText={(text) => setFormData({ ...formData, adminName: text })}
                            />
                            <View style={{ height: SPACING.m }} />
                            <CustomInput
                                label="Work Email"
                                placeholder="name@company.com"
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                keyboardType="email-address"
                            />
                            <View style={{ height: SPACING.m }} />
                            <CustomInput
                                label="Contact Number"
                                placeholder="+1 (555) 000-0000"
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                keyboardType="phone-pad"
                            />

                            <CustomButton
                                title="Create Workspace"
                                onPress={handleRegister}
                                loading={loading}
                                style={styles.button}
                            />

                            <Text style={styles.terms}>
                                By creating a workspace, you agree to our <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Enterprise Agreement</Text>.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SPACING.m,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 24,
        padding: SPACING.l,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    backBtn: {
        marginBottom: SPACING.l,
    },
    backText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 14,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
        fontWeight: '600',
        marginBottom: SPACING.xl,
    },
    form: {
        marginTop: SPACING.s,
    },
    button: {
        marginTop: SPACING.xl,
    },
    terms: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.l,
        lineHeight: 18,
    },
    link: {
        color: COLORS.primary,
        fontWeight: '700',
    },
});

export default RegisterCompanyScreen;

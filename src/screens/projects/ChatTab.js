import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES } from '../../theme/theme';
import { useApp } from '../../context/AppContext';

export const ChatTab = ({ project }) => {
    const { messages, sendMessage } = useApp();
    const [text, setText] = useState('');
    const flatListRef = useRef();

    const projectMessages = messages.filter(m => m.projectId === project.id);

    const handleSend = () => {
        if (!text.trim()) return;
        sendMessage(text, project.id);
        setText('');
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={projectMessages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={[styles.messageWrapper, item.isMe ? styles.myMessage : styles.theirMessage]}>
                        {!item.isMe && <Text style={styles.sender}>{item.sender}</Text>}
                        <View style={[styles.bubble, item.isMe ? styles.myBubble : styles.theirBubble]}>
                            <Text style={[styles.messageText, item.isMe ? styles.myText : styles.theirText]}>
                                {item.text}
                            </Text>
                        </View>
                        <Text style={styles.time}>{item.time}</Text>
                    </View>
                )}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a group message..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={text}
                    onChangeText={setText}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!text.trim()}
                >
                    <MaterialCommunityIcons name="send" size={24} color={COLORS.black} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    list: {
        padding: SPACING.m,
    },
    messageWrapper: {
        marginBottom: 16,
        maxWidth: '80%',
    },
    myMessage: {
        alignSelf: 'flex-end',
    },
    theirMessage: {
        alignSelf: 'flex-start',
    },
    sender: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.primary,
        marginBottom: 4,
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
    },
    myBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: COLORS.card,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myText: {
        color: COLORS.black,
        fontWeight: '600',
    },
    theirText: {
        color: COLORS.textPrimary,
    },
    time: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 4,
        marginHorizontal: 4,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.card,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: COLORS.textPrimary,
        maxHeight: 100,
        fontSize: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { realtimeManager, Message } from '../lib/realtime';

interface LiveMessagingProps {
  friendId: string;
  friendName: string;
  onBack: () => void;
}

export default function LiveMessaging({ friendId, friendName, onBack }: LiveMessagingProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load conversation history
  useEffect(() => {
    loadConversation();
  }, [friendId]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = realtimeManager.onMessage((message) => {
      // Only add messages from this conversation
      if (
        (message.sender_id === friendId && message.receiver_id === user.id) ||
        (message.sender_id === user.id && message.receiver_id === friendId)
      ) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
        
        // Mark message as read if it's from the friend
        if (message.sender_id === friendId) {
          realtimeManager.markMessagesAsRead(friendId);
        }
      }
    });

    return unsubscribe;
  }, [user?.id, friendId]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const conversation = await realtimeManager.getConversation(friendId);
      setMessages(conversation);
      
      // Mark messages as read
      await realtimeManager.markMessagesAsRead(friendId);
    } catch (error) {
      console.error('Error loading conversation:', error);
      Alert.alert('Error', 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !user?.id) return;

    try {
      setSending(true);
      await realtimeManager.sendMessage(friendId, newMessage.trim());
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 24 * 60) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const renderMessage = (message: Message, index: number) => {
    const isFromUser = message.sender_id === user?.id;
    const isLastMessage = index === messages.length - 1;
    
    return (
      <View key={message.id} style={[styles.messageContainer, isFromUser ? styles.userMessage : styles.friendMessage]}>
        <View style={[styles.messageBubble, isFromUser ? styles.userBubble : styles.friendBubble]}>
          <Text style={[styles.messageText, isFromUser ? styles.userMessageText : styles.friendMessageText]}>
            {message.content}
          </Text>
          <Text style={[styles.messageTime, isFromUser ? styles.userMessageTime : styles.friendMessageTime]}>
            {formatTime(message.created_at)}
            {isFromUser && message.read_at && ' • read'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.friendName}>{friendName}</Text>
          <Text style={styles.onlineStatus}>online</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Start your conversation with {friendName}!</Text>
            <Text style={styles.emptySubtext}>Send a message to connect and motivate each other</Text>
          </View>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder={`Message ${friendName}...`}
            placeholderTextColor="#666"
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            editable={!sending}
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            disabled={!newMessage.trim() || sending}
          >
            <Text style={[styles.sendButtonText, (!newMessage.trim() || sending) && styles.sendButtonTextDisabled]}>
              {sending ? '...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  friendName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineStatus: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 60,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  friendMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#FF4444',
    borderBottomRightRadius: 4,
  },
  friendBubble: {
    backgroundColor: '#333333',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  friendMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  friendMessageTime: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    minHeight: 20,
  },
  sendButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#666666',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    color: '#999999',
  },
});
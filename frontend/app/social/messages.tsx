import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import ChatList from '../../components/ChatList';
import LiveMessaging from '../../components/LiveMessaging';

/**
 * Messages Screen - Live Chat & Messaging System
 * Manages the chat interface and conversation flows
 */
export default function MessagesScreen() {
  const [selectedChat, setSelectedChat] = useState<{
    friendId: string;
    friendName: string;
  } | null>(null);

  const handleChatSelect = (friendId: string, friendName: string) => {
    setSelectedChat({ friendId, friendName });
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  const handleBackToSocial = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000000', '#1a1a1a', '#2d2d2d']} style={styles.container}>
        {selectedChat ? (
          <LiveMessaging
            friendId={selectedChat.friendId}
            friendName={selectedChat.friendName}
            onBack={handleBackToList}
          />
        ) : (
          <ChatList
            onChatSelect={handleChatSelect}
            onBack={handleBackToSocial}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
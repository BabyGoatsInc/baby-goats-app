import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';

interface ChatConversation {
  id: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url?: string;
    sport?: string;
  };
  content: string;
  created_at: string;
  unread_count: number;
  message_type: 'text' | 'image' | 'achievement' | 'challenge';
  sender_id: string;
  receiver_id: string;
}

interface ChatListProps {
  onChatSelect: (friendId: string, friendName: string) => void;
  onBack?: () => void;
}

export default function ChatList({ onChatSelect, onBack }: ChatListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load conversations
  const loadConversations = useCallback(async (showLoading = true) => {
    if (!user?.id) return;

    try {
      if (showLoading) setLoading(true);

      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/messages?user_id=${user.id}&limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      
      if (data.success) {
        setConversations(data.conversations || []);
      } else {
        throw new Error(data.error || 'Failed to load conversations');
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins < 1 ? 'now' : `${diffMins}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  const getMessagePreview = (conversation: ChatConversation) => {
    const isFromUser = conversation.sender_id === user?.id;
    const prefix = isFromUser ? 'You: ' : '';
    
    switch (conversation.message_type) {
      case 'image':
        return `${prefix}📷 Photo`;
      case 'achievement':
        return `${prefix}🏆 Achievement shared`;
      case 'challenge':
        return `${prefix}💪 Challenge update`;
      default:
        return `${prefix}${conversation.content}`;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    searchQuery.length === 0 ||
    conv.other_user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.other_user.sport?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }: { item: ChatConversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onChatSelect(item.other_user.id, item.other_user.full_name)}
      activeOpacity={0.7}
    >
      <Avatar 
        uri={item.other_user.avatar_url} 
        size={56} 
        name={item.other_user.full_name}
      />
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.other_user.full_name}
          </Text>
          <Text style={styles.timestamp}>
            {formatTime(item.created_at)}
          </Text>
        </View>
        
        <View style={styles.messageRow}>
          <Text 
            style={[
              styles.messagePreview,
              item.unread_count > 0 && styles.unreadMessage
            ]} 
            numberOfLines={1}
          >
            {getMessagePreview(item)}
          </Text>
          
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unread_count > 99 ? '99+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>
        
        {item.other_user.sport && (
          <Text style={styles.userSport}>
            {item.other_user.sport}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>💬</Text>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptyDescription}>
        Start chatting with your friends to see conversations here.
      </Text>
      <Text style={styles.emptyHint}>
        Visit the Friends tab to connect with other athletes!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          filteredConversations.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={['#EC1616']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Quick Stats */}
      {conversations.length > 0 && (
        <View style={styles.statsFooter}>
          <Text style={styles.statsText}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} • {' '}
            {conversations.reduce((sum, conv) => sum + conv.unread_count, 0)} unread
          </Text>
        </View>
      )}
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 80,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  emptyListContainer: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    color: '#999999',
    fontSize: 12,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messagePreview: {
    color: '#CCCCCC',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#EC1616',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userSport: {
    color: '#999999',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  emptyHint: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsText: {
    color: '#999999',
    fontSize: 12,
    textAlign: 'center',
  },
});
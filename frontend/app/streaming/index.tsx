import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
  Platform,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { streamingManager, LiveStream } from '../../lib/streaming';

const { width: screenWidth } = Dimensions.get('window');

interface StreamingIndexProps {
  onBack?: () => void;
}

export default function StreamingIndex({ onBack }: StreamingIndexProps) {
  const { user } = useAuth();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [myStreams, setMyStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my_streams'>('discover');

  useEffect(() => {
    if (user) {
      initializeStreaming();
      loadStreams();
    }
  }, [user]);

  const initializeStreaming = async () => {
    try {
      await streamingManager.initialize(user?.id || '');
    } catch (error) {
      console.error('Failed to initialize streaming:', error);
    }
  };

  const loadStreams = async () => {
    try {
      setLoading(true);

      // Load live streams for discovery
      const liveResult = await streamingManager.getStreams({
        status: 'live',
        limit: 20
      });
      setLiveStreams(liveResult.streams);

      // Load user's streams
      if (user?.id) {
        const myResult = await streamingManager.getStreams({
          userId: user.id,
          limit: 10
        });
        setMyStreams(myResult.streams);
      }
    } catch (error) {
      console.error('Failed to load streams:', error);
      Alert.alert('Error', 'Failed to load streams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStreams();
    setRefreshing(false);
  };

  const handleCreateStream = () => {
    Alert.alert(
      'Create Live Stream',
      'Ready to start broadcasting?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create Stream', onPress: () => navigateToCreateStream() }
      ]
    );
  };

  const navigateToCreateStream = () => {
    // This would navigate to the stream creation flow
    console.log('Navigate to create stream');
  };

  const handleJoinStream = (stream: LiveStream) => {
    Alert.alert(
      'Join Live Stream',
      `Watch "${stream.title}" by ${stream.streamer?.full_name || 'Unknown'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join Stream', onPress: () => joinStream(stream) }
      ]
    );
  };

  const joinStream = async (stream: LiveStream) => {
    try {
      await streamingManager.joinStream(stream.id);
      // Navigate to viewer screen
      console.log('Joined stream:', stream.id);
    } catch (error) {
      console.error('Failed to join stream:', error);
      Alert.alert('Error', 'Failed to join stream. Please try again.');
    }
  };

  const renderStreamCard = (stream: LiveStream, isMyStream: boolean = false) => (
    <TouchableOpacity
      key={stream.id}
      style={styles.streamCard}
      onPress={() => isMyStream ? handleMyStreamPress(stream) : handleJoinStream(stream)}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.streamCardGradient}
      >
        <View style={styles.streamHeader}>
          <View style={styles.streamInfo}>
            <Text style={styles.streamTitle} numberOfLines={1}>
              {stream.title}
            </Text>
            <Text style={styles.streamStreamer}>
              {stream.streamer?.full_name || 'Unknown Streamer'}
            </Text>
          </View>
          <View style={styles.streamStatus}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(stream.status) }]} />
            <Text style={styles.statusText}>{stream.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.streamDescription} numberOfLines={2}>
          {stream.description || 'No description available'}
        </Text>

        <View style={styles.streamFooter}>
          <View style={styles.streamMeta}>
            <Text style={styles.categoryTag}>
              {getCategoryEmoji(stream.category)} {stream.category}
            </Text>
            <Text style={styles.viewerCount}>
              👥 {stream.viewer_count} {stream.viewer_count === 1 ? 'viewer' : 'viewers'}
            </Text>
          </View>
          
          {stream.status === 'live' && (
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={() => isMyStream ? handleMyStreamPress(stream) : handleJoinStream(stream)}
            >
              <Text style={styles.joinButtonText}>
                {isMyStream ? 'MANAGE' : 'JOIN'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const handleMyStreamPress = (stream: LiveStream) => {
    const options = [
      { text: 'Cancel', style: 'cancel' as const },
    ];

    if (stream.status === 'live') {
      options.push({ text: 'End Stream', onPress: () => endStream(stream.id) });
      options.push({ text: 'Manage Stream', onPress: () => manageStream(stream) });
    } else if (stream.status === 'created') {
      options.push({ text: 'Start Stream', onPress: () => startStream(stream.id) });
      options.push({ text: 'Delete Stream', onPress: () => deleteStream(stream.id) });
    }

    Alert.alert('Stream Options', `"${stream.title}"`, options);
  };

  const startStream = async (streamId: string) => {
    try {
      await streamingManager.updateStream(streamId, { status: 'live' });
      await loadStreams();
      Alert.alert('Success', 'Stream started successfully!');
    } catch (error) {
      console.error('Failed to start stream:', error);
      Alert.alert('Error', 'Failed to start stream. Please try again.');
    }
  };

  const endStream = async (streamId: string) => {
    try {
      await streamingManager.updateStream(streamId, { status: 'ended' });
      await loadStreams();
      Alert.alert('Success', 'Stream ended successfully!');
    } catch (error) {
      console.error('Failed to end stream:', error);
      Alert.alert('Error', 'Failed to end stream. Please try again.');
    }
  };

  const deleteStream = async (streamId: string) => {
    Alert.alert(
      'Delete Stream',
      'Are you sure you want to delete this stream? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await streamingManager.deleteStream(streamId);
              await loadStreams();
              Alert.alert('Success', 'Stream deleted successfully!');
            } catch (error) {
              console.error('Failed to delete stream:', error);
              Alert.alert('Error', 'Failed to delete stream. Please try again.');
            }
          }
        }
      ]
    );
  };

  const manageStream = (stream: LiveStream) => {
    // Navigate to stream management/broadcaster view
    console.log('Manage stream:', stream.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#EC1616';
      case 'ended': return '#666666';
      case 'scheduled': return '#FFA500';
      default: return '#CCCCCC';
    }
  };

  const getCategoryEmoji = (category: string) => {
    const categories = streamingManager.getStreamCategories();
    const cat = categories.find(c => c.id === category);
    return cat?.emoji || '📺';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading streams...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#000000', '#1a1a1a', '#2d2d2d']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>🎥 LIVE STREAMING</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateStream}>
            <Text style={styles.createButtonText}>+ CREATE</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
            onPress={() => setActiveTab('discover')}
          >
            <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
              🌟 DISCOVER
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my_streams' && styles.activeTab]}
            onPress={() => setActiveTab('my_streams')}
          >
            <Text style={[styles.tabText, activeTab === 'my_streams' && styles.activeTabText]}>
              📺 MY STREAMS
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'discover' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔴 LIVE NOW</Text>
              {liveStreams.length > 0 ? (
                liveStreams.map(stream => renderStreamCard(stream))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateEmoji}>📺</Text>
                  <Text style={styles.emptyStateTitle}>No Live Streams</Text>
                  <Text style={styles.emptyStateText}>
                    No champions are streaming right now. Be the first to go live!
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📺 MY STREAMS</Text>
              {myStreams.length > 0 ? (
                myStreams.map(stream => renderStreamCard(stream, true))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateEmoji}>🎥</Text>
                  <Text style={styles.emptyStateTitle}>No Streams Yet</Text>
                  <Text style={styles.emptyStateText}>
                    Create your first live stream to connect with other champions!
                  </Text>
                  <TouchableOpacity style={styles.emptyStateButton} onPress={handleCreateStream}>
                    <Text style={styles.emptyStateButtonText}>CREATE STREAM</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
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
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  createButton: {
    backgroundColor: '#EC1616',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(236, 22, 22, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(236, 22, 22, 0.5)',
  },
  tabText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#EC1616',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 0.5,
  },

  // Stream Cards
  streamCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  streamCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  streamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  streamInfo: {
    flex: 1,
    marginRight: 12,
  },
  streamTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  streamStreamer: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  streamStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '600',
  },
  streamDescription: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  streamFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streamMeta: {
    flex: 1,
  },
  categoryTag: {
    color: '#EC1616',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  viewerCount: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  joinButton: {
    backgroundColor: '#EC1616',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#EC1616',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
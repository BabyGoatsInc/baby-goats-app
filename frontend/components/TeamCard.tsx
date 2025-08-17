import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from './Avatar';

interface TeamMember {
  id: string;
  full_name: string;
  avatar_url?: string;
  sport?: string;
  role: 'captain' | 'co_captain' | 'member' | 'pending';
}

interface TeamStatistics {
  total_members: number;
  active_members: number;
  total_points: number;
  challenges_completed?: number;
  competitions_won?: number;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  sport?: string;
  team_type: 'school' | 'club' | 'recreational' | 'competitive';
  team_image_url?: string;
  team_color?: string;
  region?: string;
  school_name?: string;
  captain: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  statistics?: TeamStatistics;
  members?: TeamMember[];
}

interface TeamCardProps {
  team: Team;
  onPress?: (team: Team) => void;
  showJoinButton?: boolean;
  onJoin?: (team: Team) => void;
  compact?: boolean;
}

export default function TeamCard({ 
  team, 
  onPress, 
  showJoinButton = false, 
  onJoin,
  compact = false 
}: TeamCardProps) {
  
  const getTeamTypeIcon = (type: string) => {
    switch (type) {
      case 'school': return '🏫';
      case 'club': return '⭐';
      case 'competitive': return '🏆';
      case 'recreational': return '🎯';
      default: return '👥';
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'basketball': return '🏀';
      case 'soccer': return '⚽';
      case 'baseball': return '⚾';
      case 'tennis': return '🎾';
      case 'track': return '🏃‍♂️';
      case 'swimming': return '🏊‍♂️';
      case 'volleyball': return '🏐';
      default: return '🏃‍♂️';
    }
  };

  const teamColor = team.team_color || '#EC1616';

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer}
        onPress={() => onPress?.(team)}
        activeOpacity={0.8}
      >
        <View style={[styles.compactColorBar, { backgroundColor: teamColor }]} />
        
        <View style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <Text style={styles.compactName} numberOfLines={1}>
              {team.name}
            </Text>
            <Text style={styles.compactType}>
              {getTeamTypeIcon(team.team_type)} {team.team_type}
            </Text>
          </View>
          
          <View style={styles.compactStats}>
            <Text style={styles.compactStat}>
              {team.statistics?.active_members || 0} members
            </Text>
            {team.sport && (
              <Text style={styles.compactStat}>
                {getSportIcon(team.sport)} {team.sport}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress?.(team)}
      activeOpacity={0.8}
    >
      <LinearGradient 
        colors={[`${teamColor}20`, 'rgba(0, 0, 0, 0.05)']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.teamInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.teamName} numberOfLines={1}>
                {team.name}
              </Text>
              <View style={styles.teamBadges}>
                <Text style={styles.typeIcon}>
                  {getTeamTypeIcon(team.team_type)}
                </Text>
                {team.sport && (
                  <Text style={styles.sportIcon}>
                    {getSportIcon(team.sport)}
                  </Text>
                )}
              </View>
            </View>
            
            <Text style={styles.teamType}>
              {team.team_type.toUpperCase()}
            </Text>
          </View>
          
          <View style={[styles.colorIndicator, { backgroundColor: teamColor }]} />
        </View>

        {/* Description */}
        {team.description && (
          <Text style={styles.description} numberOfLines={2}>
            {team.description}
          </Text>
        )}

        {/* Captain */}
        <View style={styles.captainSection}>
          <Avatar 
            uri={team.captain.avatar_url} 
            size={32} 
            name={team.captain.full_name}
          />
          <View style={styles.captainInfo}>
            <Text style={styles.captainLabel}>Captain</Text>
            <Text style={styles.captainName} numberOfLines={1}>
              {team.captain.full_name}
            </Text>
          </View>
        </View>

        {/* Statistics */}
        {team.statistics && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {team.statistics.active_members}
              </Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {team.statistics.total_points || 0}
              </Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            
            {team.statistics.challenges_completed !== undefined && (
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {team.statistics.challenges_completed}
                </Text>
                <Text style={styles.statLabel}>Challenges</Text>
              </View>
            )}
          </View>
        )}

        {/* Location Info */}
        {(team.school_name || team.region) && (
          <View style={styles.locationContainer}>
            {team.school_name && (
              <Text style={styles.schoolName} numberOfLines={1}>
                🏫 {team.school_name}
              </Text>
            )}
            {team.region && (
              <Text style={styles.region}>
                📍 {team.region}
              </Text>
            )}
          </View>
        )}

        {/* Join Button */}
        {showJoinButton && (
          <TouchableOpacity
            style={[styles.joinButton, { borderColor: teamColor }]}
            onPress={() => onJoin?.(team)}
            activeOpacity={0.7}
          >
            <Text style={[styles.joinButtonText, { color: teamColor }]}>
              Join Team
            </Text>
          </TouchableOpacity>
        )}

        {/* Team Members Preview */}
        {team.members && team.members.length > 0 && (
          <View style={styles.membersPreview}>
            <Text style={styles.membersLabel}>Team Members</Text>
            <View style={styles.membersContainer}>
              {team.members.slice(0, 5).map((member, index) => (
                <View key={member.id} style={[styles.memberAvatar, { marginLeft: index * -8 }]}>
                  <Avatar 
                    uri={member.avatar_url} 
                    size={24} 
                    name={member.full_name}
                  />
                </View>
              ))}
              {team.members.length > 5 && (
                <View style={styles.moreMembers}>
                  <Text style={styles.moreMembersText}>
                    +{team.members.length - 5}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  teamInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  teamName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  teamBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  sportIcon: {
    fontSize: 16,
  },
  teamType: {
    color: '#EC1616',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  colorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  description: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  captainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  captainInfo: {
    marginLeft: 8,
    flex: 1,
  },
  captainLabel: {
    color: '#999999',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  captainName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#999999',
    fontSize: 11,
    marginTop: 2,
  },
  locationContainer: {
    marginBottom: 12,
  },
  schoolName: {
    color: '#CCCCCC',
    fontSize: 13,
    marginBottom: 2,
  },
  region: {
    color: '#999999',
    fontSize: 12,
  },
  joinButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  membersPreview: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  membersLabel: {
    color: '#999999',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 12,
  },
  moreMembers: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  moreMembersText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    overflow: 'hidden',
  },
  compactColorBar: {
    width: 4,
  },
  compactContent: {
    flex: 1,
    padding: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  compactType: {
    color: '#999999',
    fontSize: 12,
  },
  compactStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactStat: {
    color: '#CCCCCC',
    fontSize: 12,
    marginRight: 12,
  },
});
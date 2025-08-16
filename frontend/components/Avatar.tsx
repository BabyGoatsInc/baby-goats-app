import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface AvatarProps {
  imageUrl?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  onPress?: () => void;
  showEditIcon?: boolean;
}

export default function Avatar({ 
  imageUrl, 
  name, 
  size = 'medium', 
  onPress,
  showEditIcon = false 
}: AvatarProps) {
  const dimensions = {
    small: 32,
    medium: 56,
    large: 80,
    xlarge: 120,
  };

  const iconSizes = {
    small: 12,
    medium: 16,
    large: 20,
    xlarge: 24,
  };

  const avatarSize = dimensions[size];
  const iconSize = iconSizes[size];

  // Generate initials from name if no image
  const getInitials = (fullName?: string): string => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    const firstInitial = names[0]?.[0]?.toUpperCase() || '';
    const lastInitial = names[1]?.[0]?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  const containerStyle = [
    styles.container,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    }
  ];

  const imageStyle = [
    styles.image,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    }
  ];

  const initialsStyle = [
    styles.initials,
    {
      fontSize: avatarSize * 0.35, // Scale font size with avatar size
    }
  ];

  const editIconStyle = [
    styles.editIcon,
    {
      width: iconSize + 4,
      height: iconSize + 4,
      borderRadius: (iconSize + 4) / 2,
      bottom: -2,
      right: -2,
    }
  ];

  const content = (
    <View style={containerStyle}>
      {imageUrl ? (
        <Image 
          source={{ uri: imageUrl }} 
          style={imageStyle}
          defaultSource={require('../assets/default-avatar.png')}
        />
      ) : (
        <View style={[styles.placeholderContainer, imageStyle]}>
          <Text style={initialsStyle}>{getInitials(name)}</Text>
        </View>
      )}
      
      {showEditIcon && (
        <View style={editIconStyle}>
          <Text style={[styles.editIconText, { fontSize: iconSize * 0.6 }]}>✏️</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholderContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  editIcon: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  editIconText: {
    textAlign: 'center',
  },
});
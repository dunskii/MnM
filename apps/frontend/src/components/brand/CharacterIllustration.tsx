// ===========================================
// CharacterIllustration Component
// ===========================================
// Age-appropriate character mascots (Alice, Steve, Liam, Floyd)
// Based on Music 'n Me brand guidelines

import React from 'react';
import { Box, Typography, Avatar, Tooltip } from '@mui/material';
import {
  Face as FaceIcon,
  Face2 as Face2Icon,
  Face3 as Face3Icon,
  Face4 as Face4Icon,
} from '@mui/icons-material';

// ===========================================
// TYPES
// ===========================================

export type AgeGroup = 'PRESCHOOL' | 'KIDS' | 'TEENS' | 'ADULT';

export interface CharacterIllustrationProps {
  ageGroup: AgeGroup;
  size?: 'small' | 'medium' | 'large';
  withName?: boolean;
  withLabel?: boolean;
  showTooltip?: boolean;
}

// Character configurations from brand guidelines
const characterConfig: Record<
  AgeGroup,
  {
    name: string;
    label: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  PRESCHOOL: {
    name: 'Alice',
    label: 'Pre-school',
    color: '#d6336c', // Darker pink for contrast
    bgColor: '#FFB6C1', // Pink
    icon: <FaceIcon />,
    description: 'Sweet and day-dreaming',
  },
  KIDS: {
    name: 'Steve',
    label: 'Kids',
    color: '#E6B800', // Dark yellow for contrast
    bgColor: '#FFCE00', // Yellow
    icon: <Face2Icon />,
    description: 'Curious with perfect pitch',
  },
  TEENS: {
    name: 'Liam',
    label: 'Teens',
    color: '#ffffff', // White for contrast on blue
    bgColor: '#4580E4', // Blue
    icon: <Face3Icon />,
    description: 'Rock enthusiast',
  },
  ADULT: {
    name: 'Floyd',
    label: 'Adult',
    color: '#2d6a5e', // Dark mint for contrast
    bgColor: '#96DAC9', // Mint
    icon: <Face4Icon />,
    description: 'Career-focused late bloomer',
  },
};

// Size configurations
const sizeConfig = {
  small: { avatar: 32, fontSize: 20 },
  medium: { avatar: 48, fontSize: 28 },
  large: { avatar: 72, fontSize: 42 },
};

// ===========================================
// COMPONENT
// ===========================================

export function CharacterIllustration({
  ageGroup,
  size = 'medium',
  withName = false,
  withLabel = false,
  showTooltip = true,
}: CharacterIllustrationProps) {
  const character = characterConfig[ageGroup];
  const dimensions = sizeConfig[size];

  const avatarContent = (
    <Avatar
      sx={{
        width: dimensions.avatar,
        height: dimensions.avatar,
        bgcolor: character.bgColor,
        color: character.color,
        fontSize: dimensions.fontSize,
        border: `2px solid ${character.color}20`,
      }}
    >
      {React.cloneElement(character.icon as React.ReactElement, {
        sx: { fontSize: dimensions.fontSize },
      })}
    </Avatar>
  );

  const content = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {avatarContent}
      {(withName || withLabel) && (
        <Box>
          {withName && (
            <Typography
              variant={size === 'large' ? 'subtitle1' : 'body2'}
              fontWeight={600}
              color="text.primary"
            >
              {character.name}
            </Typography>
          )}
          {withLabel && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block' }}
            >
              {character.label}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );

  if (showTooltip && !withName) {
    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {character.name}
            </Typography>
            <Typography variant="caption">{character.label}</Typography>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
              {character.description}
            </Typography>
          </Box>
        }
        arrow
      >
        {content}
      </Tooltip>
    );
  }

  return content;
}

// ===========================================
// HELPER FUNCTION
// ===========================================

/**
 * Get age group from birth date
 */
export function getAgeGroupFromBirthDate(birthDate: Date | string): AgeGroup {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < 6) return 'PRESCHOOL';
  if (age < 12) return 'KIDS';
  if (age < 18) return 'TEENS';
  return 'ADULT';
}

/**
 * Get character color for an age group
 */
export function getCharacterColor(ageGroup: AgeGroup): string {
  return characterConfig[ageGroup].bgColor;
}

/**
 * Get character name for an age group
 */
export function getCharacterName(ageGroup: AgeGroup): string {
  return characterConfig[ageGroup].name;
}

export default CharacterIllustration;

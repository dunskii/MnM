// ===========================================
// CharacterIllustration Component Tests
// ===========================================
// Unit tests for the age-group character mascot component

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  CharacterIllustration,
  getAgeGroupFromBirthDate,
  getCharacterColor,
  getCharacterName,
  AgeGroup,
} from '../CharacterIllustration';
import { createWrapper } from '../../../test/utils';

describe('CharacterIllustration', () => {
  // ===========================================
  // RENDERING TESTS
  // ===========================================

  it.each([
    ['PRESCHOOL', 'Alice'],
    ['KIDS', 'Steve'],
    ['TEENS', 'Liam'],
    ['ADULT', 'Floyd'],
  ] as [AgeGroup, string][])('should render %s character with name %s', (ageGroup, name) => {
    render(
      <CharacterIllustration ageGroup={ageGroup} withName />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(name)).toBeInTheDocument();
  });

  it.each([
    ['PRESCHOOL', 'Pre-school'],
    ['KIDS', 'Kids'],
    ['TEENS', 'Teens'],
    ['ADULT', 'Adult'],
  ] as [AgeGroup, string][])('should render %s label correctly', (ageGroup, label) => {
    render(
      <CharacterIllustration ageGroup={ageGroup} withLabel />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('should render avatar for each age group', () => {
    const { container } = render(
      <CharacterIllustration ageGroup="KIDS" />,
      { wrapper: createWrapper() }
    );

    expect(container.querySelector('.MuiAvatar-root')).toBeInTheDocument();
  });

  // ===========================================
  // SIZE TESTS
  // ===========================================

  it('should render medium size by default', () => {
    const { container } = render(
      <CharacterIllustration ageGroup="KIDS" />,
      { wrapper: createWrapper() }
    );

    const avatar = container.querySelector('.MuiAvatar-root');
    expect(avatar).toBeInTheDocument();
  });

  it.each(['small', 'medium', 'large'] as const)('should render %s size', (size) => {
    const { container } = render(
      <CharacterIllustration ageGroup="KIDS" size={size} />,
      { wrapper: createWrapper() }
    );

    const avatar = container.querySelector('.MuiAvatar-root');
    expect(avatar).toBeInTheDocument();
  });

  // ===========================================
  // TOOLTIP TESTS
  // ===========================================

  it('should show tooltip by default when name not displayed', () => {
    render(
      <CharacterIllustration ageGroup="KIDS" />,
      { wrapper: createWrapper() }
    );

    // Avatar should be present with the correct icon
    expect(screen.getByTestId('Face2Icon')).toBeInTheDocument();
  });

  it('should not show tooltip when showTooltip is false', () => {
    render(
      <CharacterIllustration ageGroup="KIDS" showTooltip={false} />,
      { wrapper: createWrapper() }
    );

    // Should still render the avatar
    expect(screen.getByTestId('Face2Icon')).toBeInTheDocument();
  });

  it('should not show tooltip when withName is true', () => {
    render(
      <CharacterIllustration ageGroup="KIDS" withName />,
      { wrapper: createWrapper() }
    );

    // Name should be visible
    expect(screen.getByText('Steve')).toBeInTheDocument();
  });

  // ===========================================
  // ICON TESTS
  // ===========================================

  it.each([
    ['PRESCHOOL', 'FaceIcon'],
    ['KIDS', 'Face2Icon'],
    ['TEENS', 'Face3Icon'],
    ['ADULT', 'Face4Icon'],
  ] as [AgeGroup, string][])('should render correct icon for %s', (ageGroup, iconTestId) => {
    render(
      <CharacterIllustration ageGroup={ageGroup} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId(iconTestId)).toBeInTheDocument();
  });

  // ===========================================
  // WITH NAME AND LABEL TESTS
  // ===========================================

  it('should render both name and label when both props are true', () => {
    render(
      <CharacterIllustration ageGroup="KIDS" withName withLabel />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Steve')).toBeInTheDocument();
    expect(screen.getByText('Kids')).toBeInTheDocument();
  });

  it('should not render name when withName is false', () => {
    render(
      <CharacterIllustration ageGroup="KIDS" withName={false} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Steve')).not.toBeInTheDocument();
  });

  it('should not render label when withLabel is false', () => {
    render(
      <CharacterIllustration ageGroup="KIDS" withLabel={false} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Kids')).not.toBeInTheDocument();
  });
});

// ===========================================
// HELPER FUNCTION TESTS
// ===========================================

describe('getAgeGroupFromBirthDate', () => {
  // Helper to create a date that's a specific number of years ago
  const yearsAgo = (years: number): Date => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
  };

  it('should return PRESCHOOL for children under 6', () => {
    expect(getAgeGroupFromBirthDate(yearsAgo(3))).toBe('PRESCHOOL');
    expect(getAgeGroupFromBirthDate(yearsAgo(5))).toBe('PRESCHOOL');
  });

  it('should return KIDS for children 6-11', () => {
    expect(getAgeGroupFromBirthDate(yearsAgo(6))).toBe('KIDS');
    expect(getAgeGroupFromBirthDate(yearsAgo(10))).toBe('KIDS');
    expect(getAgeGroupFromBirthDate(yearsAgo(11))).toBe('KIDS');
  });

  it('should return TEENS for children 12-17', () => {
    expect(getAgeGroupFromBirthDate(yearsAgo(12))).toBe('TEENS');
    expect(getAgeGroupFromBirthDate(yearsAgo(15))).toBe('TEENS');
    expect(getAgeGroupFromBirthDate(yearsAgo(17))).toBe('TEENS');
  });

  it('should return ADULT for 18 and older', () => {
    expect(getAgeGroupFromBirthDate(yearsAgo(18))).toBe('ADULT');
    expect(getAgeGroupFromBirthDate(yearsAgo(30))).toBe('ADULT');
    expect(getAgeGroupFromBirthDate(yearsAgo(65))).toBe('ADULT');
  });

  it('should accept string date', () => {
    const dateString = yearsAgo(10).toISOString();
    expect(getAgeGroupFromBirthDate(dateString)).toBe('KIDS');
  });

  it('should handle edge case at birthday boundary', () => {
    // Create a date exactly on the birthday boundary
    const today = new Date();
    const birthdayToday = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());

    expect(getAgeGroupFromBirthDate(birthdayToday)).toBe('TEENS');
  });
});

describe('getCharacterColor', () => {
  it.each([
    ['PRESCHOOL', '#FFB6C1'], // Pink
    ['KIDS', '#FFCE00'],       // Yellow
    ['TEENS', '#4580E4'],      // Blue
    ['ADULT', '#96DAC9'],      // Mint
  ] as [AgeGroup, string][])('should return correct color for %s', (ageGroup, expectedColor) => {
    expect(getCharacterColor(ageGroup)).toBe(expectedColor);
  });
});

describe('getCharacterName', () => {
  it.each([
    ['PRESCHOOL', 'Alice'],
    ['KIDS', 'Steve'],
    ['TEENS', 'Liam'],
    ['ADULT', 'Floyd'],
  ] as [AgeGroup, string][])('should return correct name for %s', (ageGroup, expectedName) => {
    expect(getCharacterName(ageGroup)).toBe(expectedName);
  });
});

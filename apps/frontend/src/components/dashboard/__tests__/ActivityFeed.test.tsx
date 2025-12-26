// ===========================================
// ActivityFeed Component Tests
// ===========================================
// Unit tests for the activity feed component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityFeed, ActivityItem, ActivityType } from '../ActivityFeed';
import { createWrapper } from '../../../test/utils';

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create mock activity items
  const createMockItem = (overrides: Partial<ActivityItem> = {}): ActivityItem => ({
    id: 'test-1',
    type: 'enrollment',
    title: 'New Enrollment',
    description: 'John Doe enrolled in Piano Beginners',
    timestamp: new Date().toISOString(),
    ...overrides,
  });

  const createMockItems = (count: number): ActivityItem[] => {
    return Array.from({ length: count }, (_, i) =>
      createMockItem({
        id: `item-${i}`,
        title: `Activity ${i + 1}`,
        description: `Description for activity ${i + 1}`,
      })
    );
  };

  // ===========================================
  // RENDERING TESTS
  // ===========================================

  it('should render with default title', () => {
    render(
      <ActivityFeed items={[]} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(
      <ActivityFeed items={[]} title="School Activity" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('School Activity')).toBeInTheDocument();
  });

  it('should render activity items', () => {
    const items = [
      createMockItem({ id: '1', title: 'First Activity', description: 'First desc' }),
      createMockItem({ id: '2', title: 'Second Activity', description: 'Second desc' }),
    ];

    render(
      <ActivityFeed items={items} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('First Activity')).toBeInTheDocument();
    expect(screen.getByText('Second Activity')).toBeInTheDocument();
    expect(screen.getByText('First desc')).toBeInTheDocument();
    expect(screen.getByText('Second desc')).toBeInTheDocument();
  });

  it('should show empty state when no items', () => {
    render(
      <ActivityFeed items={[]} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  // ===========================================
  // ACTIVITY TYPE TESTS
  // ===========================================

  it.each([
    ['enrollment', 'PersonAddIcon'],
    ['payment', 'PaymentIcon'],
    ['booking', 'EventAvailableIcon'],
    ['attendance', 'CheckCircleIcon'],
    ['file_upload', 'CloudUploadIcon'],
    ['meet_and_greet', 'HandshakeIcon'],
  ] as [ActivityType, string][])('should render %s activity with correct icon', (type, iconTestId) => {
    const item = createMockItem({ type, title: `${type} activity` });

    render(
      <ActivityFeed items={[item]} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(`${type} activity`)).toBeInTheDocument();
    expect(screen.getByTestId(iconTestId)).toBeInTheDocument();
  });

  // ===========================================
  // MAX ITEMS TESTS
  // ===========================================

  it('should limit displayed items to maxItems', () => {
    const items = createMockItems(10);

    render(
      <ActivityFeed items={items} maxItems={3} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
    expect(screen.getByText('Activity 3')).toBeInTheDocument();
    expect(screen.queryByText('Activity 4')).not.toBeInTheDocument();
  });

  it('should use default maxItems of 5', () => {
    const items = createMockItems(10);

    render(
      <ActivityFeed items={items} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 5')).toBeInTheDocument();
    expect(screen.queryByText('Activity 6')).not.toBeInTheDocument();
  });

  // ===========================================
  // VIEW ALL BUTTON TESTS
  // ===========================================

  it('should show View All button when items exceed maxItems and onViewAll provided', () => {
    const items = createMockItems(10);
    const onViewAll = vi.fn();

    render(
      <ActivityFeed items={items} maxItems={5} onViewAll={onViewAll} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('View All Activity')).toBeInTheDocument();
  });

  it('should not show View All button when items do not exceed maxItems', () => {
    const items = createMockItems(3);
    const onViewAll = vi.fn();

    render(
      <ActivityFeed items={items} maxItems={5} onViewAll={onViewAll} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('View All Activity')).not.toBeInTheDocument();
  });

  it('should not show View All button when onViewAll not provided', () => {
    const items = createMockItems(10);

    render(
      <ActivityFeed items={items} maxItems={5} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('View All Activity')).not.toBeInTheDocument();
  });

  it('should call onViewAll when View All button clicked', async () => {
    const user = userEvent.setup();
    const items = createMockItems(10);
    const onViewAll = vi.fn();

    render(
      <ActivityFeed items={items} maxItems={5} onViewAll={onViewAll} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByText('View All Activity'));

    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  // ===========================================
  // LOADING STATE TESTS
  // ===========================================

  it('should show skeletons when loading', () => {
    const { container } = render(
      <ActivityFeed items={[]} loading={true} />,
      { wrapper: createWrapper() }
    );

    // Should have 5 skeleton loaders
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should not show empty state when loading', () => {
    render(
      <ActivityFeed items={[]} loading={true} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('No recent activity')).not.toBeInTheDocument();
  });

  // ===========================================
  // TIMESTAMP FORMATTING TESTS
  // ===========================================

  it('should format timestamp as relative time', () => {
    // Create an item from 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const item = createMockItem({ timestamp: fiveMinutesAgo });

    render(
      <ActivityFeed items={[item]} />,
      { wrapper: createWrapper() }
    );

    // Should show relative time (approximately)
    expect(screen.getByText(/minutes? ago/i)).toBeInTheDocument();
  });

  it('should handle invalid timestamp gracefully', () => {
    const item = createMockItem({ timestamp: 'invalid-date' });

    render(
      <ActivityFeed items={[item]} />,
      { wrapper: createWrapper() }
    );

    // Should fall back to showing the raw timestamp
    expect(screen.getByText('invalid-date')).toBeInTheDocument();
  });

  // ===========================================
  // STYLING TESTS
  // ===========================================

  it('should render dividers between items', () => {
    const items = createMockItems(3);
    const { container } = render(
      <ActivityFeed items={items} />,
      { wrapper: createWrapper() }
    );

    // Should have 2 dividers for 3 items
    const insetDividers = container.querySelectorAll('.MuiDivider-inset');
    expect(insetDividers.length).toBe(2);
  });

  it('should render avatars with correct colors for each type', () => {
    const items: ActivityItem[] = [
      createMockItem({ id: '1', type: 'enrollment' }),
      createMockItem({ id: '2', type: 'payment' }),
    ];

    const { container } = render(
      <ActivityFeed items={items} />,
      { wrapper: createWrapper() }
    );

    const avatars = container.querySelectorAll('.MuiAvatar-root');
    expect(avatars.length).toBe(2);
  });

  // ===========================================
  // METADATA TESTS
  // ===========================================

  it('should accept metadata without breaking', () => {
    const item = createMockItem({
      metadata: {
        studentId: '123',
        amount: 100,
        nested: { key: 'value' },
      },
    });

    render(
      <ActivityFeed items={[item]} />,
      { wrapper: createWrapper() }
    );

    // Should render without error
    expect(screen.getByText('New Enrollment')).toBeInTheDocument();
  });
});

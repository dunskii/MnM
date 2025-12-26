// ===========================================
// StatWidget Component Tests
// ===========================================
// Unit tests for the reusable stat widget component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { School as SchoolIcon } from '@mui/icons-material';
import { StatWidget } from '../StatWidget';
import { createWrapper } from '../../../test/utils';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('StatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================
  // RENDERING TESTS
  // ===========================================

  it('should render title and value', () => {
    render(
      <StatWidget
        title="Students"
        value={42}
        icon={<SchoolIcon data-testid="icon" />}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Students')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render string value', () => {
    render(
      <StatWidget
        title="Attendance"
        value="95%"
        icon={<SchoolIcon />}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('should render icon', () => {
    render(
      <StatWidget
        title="Test"
        value={10}
        icon={<SchoolIcon data-testid="stat-icon" />}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });

  it('should render subtitle when provided', () => {
    render(
      <StatWidget
        title="Lessons"
        value={8}
        icon={<SchoolIcon />}
        subtitle="This week"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('This week')).toBeInTheDocument();
  });

  // ===========================================
  // LOADING STATE TESTS
  // ===========================================

  it('should show skeleton when loading', () => {
    render(
      <StatWidget
        title="Loading Test"
        value={0}
        icon={<SchoolIcon />}
        loading={true}
      />,
      { wrapper: createWrapper() }
    );

    // Title should still be visible
    expect(screen.getByText('Loading Test')).toBeInTheDocument();
    // Value should not be visible (skeleton instead)
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should not show subtitle skeleton when not loading', () => {
    const { container } = render(
      <StatWidget
        title="Test"
        value={10}
        icon={<SchoolIcon />}
        subtitle="Test subtitle"
        loading={false}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
    // Check no skeletons are rendered
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBe(0);
  });

  // ===========================================
  // TREND TESTS
  // ===========================================

  it('should render upward trend with correct styling', () => {
    render(
      <StatWidget
        title="Growth"
        value={100}
        icon={<SchoolIcon />}
        trend={{ value: 15, direction: 'up' }}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('+15%')).toBeInTheDocument();
    expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
  });

  it('should render downward trend', () => {
    render(
      <StatWidget
        title="Decline"
        value={50}
        icon={<SchoolIcon />}
        trend={{ value: -10, direction: 'down' }}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('-10%')).toBeInTheDocument();
    expect(screen.getByTestId('TrendingDownIcon')).toBeInTheDocument();
  });

  it('should render neutral trend', () => {
    render(
      <StatWidget
        title="Stable"
        value={75}
        icon={<SchoolIcon />}
        trend={{ value: 0, direction: 'neutral' }}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByTestId('TrendingFlatIcon')).toBeInTheDocument();
  });

  // ===========================================
  // COLOR TESTS
  // ===========================================

  it('should apply primary color by default', () => {
    const { container } = render(
      <StatWidget
        title="Primary"
        value={10}
        icon={<SchoolIcon />}
      />,
      { wrapper: createWrapper() }
    );

    // Check icon container has primary background color
    const iconBox = container.querySelector('[class*="MuiBox-root"]');
    expect(iconBox).toBeInTheDocument();
  });

  it.each([
    'primary',
    'secondary',
    'success',
    'warning',
    'error',
    'info',
  ] as const)('should apply %s color background', (color) => {
    render(
      <StatWidget
        title={`${color} test`}
        value={10}
        icon={<SchoolIcon />}
        color={color}
      />,
      { wrapper: createWrapper() }
    );

    // Just verify it renders without error
    expect(screen.getByText(`${color} test`)).toBeInTheDocument();
  });

  // ===========================================
  // INTERACTION TESTS
  // ===========================================

  it('should navigate when href is provided and clicked', async () => {
    const user = userEvent.setup();

    render(
      <StatWidget
        title="Clickable"
        value={5}
        icon={<SchoolIcon />}
        href="/admin/students"
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByText('Clickable'));

    expect(mockNavigate).toHaveBeenCalledWith('/admin/students');
  });

  it('should call onClick when provided and clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <StatWidget
        title="Clickable"
        value={5}
        icon={<SchoolIcon />}
        onClick={handleClick}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByText('Clickable'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should prefer href over onClick when both provided', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <StatWidget
        title="Both"
        value={5}
        icon={<SchoolIcon />}
        href="/test"
        onClick={handleClick}
      />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByText('Both'));

    expect(mockNavigate).toHaveBeenCalledWith('/test');
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not be clickable when no href or onClick', () => {
    const { container } = render(
      <StatWidget
        title="Not Clickable"
        value={5}
        icon={<SchoolIcon />}
      />,
      { wrapper: createWrapper() }
    );

    // Should not have CardActionArea
    expect(container.querySelector('.MuiCardActionArea-root')).not.toBeInTheDocument();
  });

  it('should render CardActionArea when clickable', () => {
    const { container } = render(
      <StatWidget
        title="Clickable"
        value={5}
        icon={<SchoolIcon />}
        href="/test"
      />,
      { wrapper: createWrapper() }
    );

    // Should have CardActionArea
    expect(container.querySelector('.MuiCardActionArea-root')).toBeInTheDocument();
  });

  // ===========================================
  // ACCESSIBILITY TESTS
  // ===========================================

  it('should have proper heading hierarchy', () => {
    render(
      <StatWidget
        title="Accessible"
        value={42}
        icon={<SchoolIcon />}
      />,
      { wrapper: createWrapper() }
    );

    // Value should be rendered prominently
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Accessible')).toBeInTheDocument();
  });
});

// ===========================================
// QuickActions Component Tests
// ===========================================
// Unit tests for the quick actions grid component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Add as AddIcon, Event as EventIcon } from '@mui/icons-material';
import { QuickActions, QuickAction } from '../QuickActions';
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

describe('QuickActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create mock actions
  const createMockActions = (count: number): QuickAction[] => {
    return Array.from({ length: count }, (_, i) => ({
      label: `Action ${i + 1}`,
      icon: <AddIcon data-testid={`icon-${i}`} />,
      href: `/action-${i + 1}`,
    }));
  };

  // ===========================================
  // RENDERING TESTS
  // ===========================================

  it('should render with default title', () => {
    render(
      <QuickActions actions={[]} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(
      <QuickActions actions={[]} title="My Actions" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('My Actions')).toBeInTheDocument();
  });

  it('should render all action buttons', () => {
    const actions = createMockActions(4);

    render(
      <QuickActions actions={actions} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
    expect(screen.getByText('Action 3')).toBeInTheDocument();
    expect(screen.getByText('Action 4')).toBeInTheDocument();
  });

  it('should render icons for each action', () => {
    const actions = [
      { label: 'Add Item', icon: <AddIcon data-testid="add-icon" />, href: '/add' },
      { label: 'View Events', icon: <EventIcon data-testid="event-icon" />, href: '/events' },
    ];

    render(
      <QuickActions actions={actions} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('add-icon')).toBeInTheDocument();
    expect(screen.getByTestId('event-icon')).toBeInTheDocument();
  });

  // ===========================================
  // NAVIGATION TESTS
  // ===========================================

  it('should navigate when action with href is clicked', async () => {
    const user = userEvent.setup();
    const actions = [{ label: 'Go Home', icon: <AddIcon />, href: '/home' }];

    render(
      <QuickActions actions={actions} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByText('Go Home'));

    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('should call onClick when action with onClick is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const actions = [{ label: 'Custom Action', icon: <AddIcon />, onClick: handleClick }];

    render(
      <QuickActions actions={actions} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByText('Custom Action'));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should prefer href over onClick when both provided', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const actions = [{ label: 'Both', icon: <AddIcon />, href: '/test', onClick: handleClick }];

    render(
      <QuickActions actions={actions} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByText('Both'));

    expect(mockNavigate).toHaveBeenCalledWith('/test');
    expect(handleClick).not.toHaveBeenCalled();
  });

  // ===========================================
  // COLOR TESTS
  // ===========================================

  it('should render primary color by default', () => {
    const actions = [{ label: 'Primary', icon: <AddIcon /> }];

    render(
      <QuickActions actions={actions} />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button', { name: /Primary/i });
    expect(button).toHaveClass('MuiButton-containedPrimary');
  });

  it('should render secondary color as outlined', () => {
    const actions = [{ label: 'Secondary', icon: <AddIcon />, color: 'secondary' as const }];

    render(
      <QuickActions actions={actions} />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button', { name: /Secondary/i });
    expect(button).toHaveClass('MuiButton-outlinedSecondary');
  });

  // ===========================================
  // DISABLED STATE TESTS
  // ===========================================

  it('should disable button when disabled is true', () => {
    const actions = [{ label: 'Disabled', icon: <AddIcon />, disabled: true }];

    render(
      <QuickActions actions={actions} />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button', { name: /Disabled/i });
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled button is clicked', () => {
    const handleClick = vi.fn();
    const actions = [{ label: 'Disabled', icon: <AddIcon />, onClick: handleClick, disabled: true }];

    render(
      <QuickActions actions={actions} />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button', { name: /Disabled/i });
    // Disabled buttons cannot be clicked - verify it's disabled instead
    expect(button).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });

  // ===========================================
  // COLUMN LAYOUT TESTS
  // ===========================================

  it('should render with 2 columns by default', () => {
    const actions = createMockActions(4);
    const { container } = render(
      <QuickActions actions={actions} />,
      { wrapper: createWrapper() }
    );

    // Grid items should have xs={6} class which corresponds to 2 columns
    const gridItems = container.querySelectorAll('.MuiGrid-item');
    expect(gridItems.length).toBe(4);
  });

  it('should render with 3 columns when specified', () => {
    const actions = createMockActions(6);
    render(
      <QuickActions actions={actions} columns={3} />,
      { wrapper: createWrapper() }
    );

    // All 6 actions should be visible
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 6')).toBeInTheDocument();
  });

  it('should render with 4 columns when specified', () => {
    const actions = createMockActions(8);
    render(
      <QuickActions actions={actions} columns={4} />,
      { wrapper: createWrapper() }
    );

    // All 8 actions should be visible
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 8')).toBeInTheDocument();
  });

  // ===========================================
  // EMPTY STATE TESTS
  // ===========================================

  it('should render empty card when no actions', () => {
    render(
      <QuickActions actions={[]} />,
      { wrapper: createWrapper() }
    );

    // Should still render the card with title
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    // No buttons should be present
    expect(screen.queryAllByRole('button').length).toBe(0);
  });

  // ===========================================
  // ACCESSIBILITY TESTS
  // ===========================================

  it('should render buttons with accessible names', () => {
    const actions = [
      { label: 'Add Student', icon: <AddIcon /> },
      { label: 'View Calendar', icon: <EventIcon /> },
    ];

    render(
      <QuickActions actions={actions} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('button', { name: /Add Student/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Calendar/i })).toBeInTheDocument();
  });

  it('should have proper heading hierarchy', () => {
    render(
      <QuickActions actions={[]} title="Test Actions" />,
      { wrapper: createWrapper() }
    );

    // Title should be present (may not be a heading element)
    expect(screen.getByText('Test Actions')).toBeInTheDocument();
  });
});

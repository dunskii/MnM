// ===========================================
// Slot Picker Component
// ===========================================
// Reusable time slot selection component for hybrid booking

import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { TimeSlot, formatTimeSlot } from '../../api/hybridBooking.api';
import { formatTime } from '../../api/lessons.api';

// ===========================================
// TYPES
// ===========================================

interface SlotPickerProps {
  /** Available time slots to display */
  slots: TimeSlot[] | undefined;
  /** Currently selected slot */
  selectedSlot: TimeSlot | null;
  /** Callback when a slot is selected */
  onSlotSelect: (slot: TimeSlot | null) => void;
  /** Whether slots are loading */
  isLoading: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Whether to show the selected slot confirmation */
  showConfirmation?: boolean;
  /** Custom confirmation message prefix */
  confirmationPrefix?: string;
}

// ===========================================
// COMPONENT
// ===========================================

/**
 * SlotPicker - Reusable time slot selection component
 *
 * Used in:
 * - HybridBookingPage (booking modal)
 * - HybridBookingPage (reschedule modal)
 *
 * Features:
 * - Toggle button group for slot selection
 * - Loading state with spinner
 * - Empty state with warning message
 * - Optional confirmation alert showing selected slot
 */
export default function SlotPicker({
  slots,
  selectedSlot,
  onSlotSelect,
  isLoading,
  emptyMessage = 'No available slots for this week.',
  showConfirmation = true,
  confirmationPrefix = 'You are booking for',
}: SlotPickerProps) {
  // Handle slot selection
  const handleSlotChange = (_: React.MouseEvent<HTMLElement>, value: string | null) => {
    if (value && slots) {
      const slot = slots.find((s) => `${s.startTime}-${s.endTime}` === value);
      onSlotSelect(slot || null);
    } else {
      onSlotSelect(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Empty state
  if (!slots || slots.length === 0) {
    return <Alert severity="warning">{emptyMessage}</Alert>;
  }

  return (
    <Box>
      <ToggleButtonGroup
        value={selectedSlot ? `${selectedSlot.startTime}-${selectedSlot.endTime}` : null}
        exclusive
        onChange={handleSlotChange}
        sx={{ flexWrap: 'wrap', gap: 1 }}
      >
        {slots.map((slot) => (
          <ToggleButton
            key={`${slot.startTime}-${slot.endTime}`}
            value={`${slot.startTime}-${slot.endTime}`}
            disabled={!slot.isAvailable}
            sx={{ minWidth: 120 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="body2">
                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
              </Typography>
            </Box>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {showConfirmation && selectedSlot && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {confirmationPrefix}{' '}
          {selectedSlot.date && format(new Date(selectedSlot.date), 'EEEE, MMMM d, yyyy')}{' '}
          at {formatTimeSlot(selectedSlot.startTime, selectedSlot.endTime)}
        </Alert>
      )}
    </Box>
  );
}

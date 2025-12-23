// ===========================================
// Attendance Marker Component
// ===========================================
// Component for marking attendance for students in a lesson

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  EventBusy as EventBusyIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  AttendanceStatus,
  SingleAttendanceInput,
  getAttendanceStatusColor,
  getAttendanceStatusLabel,
  requiresAbsenceReason,
} from '../../api/attendance.api';
import {
  useEnrolledStudentsForAttendance,
  useBatchMarkAttendance,
} from '../../hooks/useAttendance';
import { useLessonNoteCompletion } from '../../hooks/useNotes';
import { getNoteStatusColor, getNoteStatusLabel } from '../../api/notes.api';

// ===========================================
// TYPES
// ===========================================

interface AttendanceMarkerProps {
  lessonId: string;
  lessonName: string;
  date: Date;
  onClose?: () => void;
  onSaved?: () => void;
}

interface StudentAttendanceState {
  studentId: string;
  status: AttendanceStatus;
  absenceReason: string;
}

// ===========================================
// STATUS ICON COMPONENT
// ===========================================

function StatusIcon({ status }: { status: AttendanceStatus }) {
  switch (status) {
    case 'PRESENT':
      return <CheckIcon sx={{ color: 'success.main' }} />;
    case 'ABSENT':
      return <CloseIcon sx={{ color: 'error.main' }} />;
    case 'LATE':
      return <ScheduleIcon sx={{ color: 'warning.main' }} />;
    case 'EXCUSED':
      return <EventBusyIcon sx={{ color: 'info.main' }} />;
    case 'CANCELLED':
      return <CancelIcon sx={{ color: 'grey.500' }} />;
    default:
      return null;
  }
}

// ===========================================
// COMPONENT
// ===========================================

export default function AttendanceMarker({
  lessonId,
  lessonName,
  date,
  onClose,
  onSaved,
}: AttendanceMarkerProps) {
  const dateString = format(date, 'yyyy-MM-dd');

  // State for attendance entries
  const [attendanceState, setAttendanceState] = useState<Record<string, StudentAttendanceState>>({});

  // Queries
  const { data: enrolledData, isLoading: isLoadingStudents } = useEnrolledStudentsForAttendance(
    lessonId,
    dateString
  );
  const { data: noteCompletion, isLoading: isLoadingNotes } = useLessonNoteCompletion(
    lessonId,
    dateString
  );

  // Mutation
  const batchMarkMutation = useBatchMarkAttendance();

  // Initialize attendance state when data loads
  useEffect(() => {
    if (enrolledData?.students) {
      const initialState: Record<string, StudentAttendanceState> = {};
      enrolledData.students.forEach((student) => {
        initialState[student.id] = {
          studentId: student.id,
          status: student.attendance?.status || 'PRESENT',
          absenceReason: student.attendance?.absenceReason || '',
        };
      });
      setAttendanceState(initialState);
    }
  }, [enrolledData?.students]);

  // Handle status change for a student
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        // Clear reason if not required
        absenceReason: requiresAbsenceReason(status) ? prev[studentId]?.absenceReason || '' : '',
      },
    }));
  };

  // Handle reason change for a student
  const handleReasonChange = (studentId: string, reason: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        absenceReason: reason,
      },
    }));
  };

  // Quick mark all as present
  const handleMarkAllPresent = () => {
    const newState: Record<string, StudentAttendanceState> = {};
    Object.keys(attendanceState).forEach((studentId) => {
      newState[studentId] = {
        ...attendanceState[studentId],
        status: 'PRESENT',
        absenceReason: '',
      };
    });
    setAttendanceState(newState);
  };

  // Save all attendance
  const handleSave = async () => {
    // Validate that all ABSENT/EXCUSED have reasons
    const missingReasons = Object.values(attendanceState).filter(
      (s) => requiresAbsenceReason(s.status) && !s.absenceReason.trim()
    );

    if (missingReasons.length > 0) {
      return; // Form validation will show errors
    }

    const attendances: SingleAttendanceInput[] = Object.values(attendanceState).map((s) => ({
      studentId: s.studentId,
      status: s.status,
      absenceReason: s.absenceReason || undefined,
    }));

    await batchMarkMutation.mutateAsync({
      lessonId,
      date: dateString,
      attendances,
    });

    onSaved?.();
  };

  // Check if form has validation errors
  const hasErrors = Object.values(attendanceState).some(
    (s) => requiresAbsenceReason(s.status) && !s.absenceReason.trim()
  );

  if (isLoadingStudents) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const students = enrolledData?.students || [];

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Mark Attendance
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {lessonName} - {format(date, 'EEEE, MMMM d, yyyy')}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Note Completion Warning */}
      {!isLoadingNotes && noteCompletion && noteCompletion.status !== 'COMPLETE' && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Chip
              label={getNoteStatusLabel(noteCompletion.status)}
              color={getNoteStatusColor(noteCompletion.status)}
              size="small"
            />
          }
        >
          Notes are incomplete for this lesson. You can still save attendance.
        </Alert>
      )}

      {/* Quick Actions */}
      <Box sx={{ mb: 3 }}>
        <Button variant="outlined" size="small" onClick={handleMarkAllPresent}>
          Mark All Present
        </Button>
      </Box>

      {/* Student List */}
      {students.length === 0 ? (
        <Alert severity="info">No students enrolled in this lesson.</Alert>
      ) : (
        <Stack spacing={2}>
          {students.map((student) => {
            const state = attendanceState[student.id];
            const needsReason = state && requiresAbsenceReason(state.status);
            const reasonError = needsReason && !state.absenceReason.trim();

            return (
              <Paper key={student.id} variant="outlined" sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Student Name */}
                  <Box sx={{ flex: '1 1 200px', minWidth: 150 }}>
                    <Typography variant="subtitle1">
                      {student.firstName} {student.lastName}
                    </Typography>
                    {student.attendance && (
                      <Chip
                        icon={<StatusIcon status={student.attendance.status} />}
                        label={getAttendanceStatusLabel(student.attendance.status)}
                        size="small"
                        color={getAttendanceStatusColor(student.attendance.status)}
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>

                  {/* Status Selector */}
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={state?.status || 'PRESENT'}
                      onChange={(e: SelectChangeEvent) =>
                        handleStatusChange(student.id, e.target.value as AttendanceStatus)
                      }
                    >
                      <MenuItem value="PRESENT">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckIcon sx={{ color: 'success.main', fontSize: 18 }} />
                          Present
                        </Box>
                      </MenuItem>
                      <MenuItem value="ABSENT">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CloseIcon sx={{ color: 'error.main', fontSize: 18 }} />
                          Absent
                        </Box>
                      </MenuItem>
                      <MenuItem value="LATE">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon sx={{ color: 'warning.main', fontSize: 18 }} />
                          Late
                        </Box>
                      </MenuItem>
                      <MenuItem value="EXCUSED">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventBusyIcon sx={{ color: 'info.main', fontSize: 18 }} />
                          Excused
                        </Box>
                      </MenuItem>
                      <MenuItem value="CANCELLED">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CancelIcon sx={{ color: 'grey.500', fontSize: 18 }} />
                          Cancelled
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {/* Reason Input (when required) */}
                  {needsReason && (
                    <TextField
                      size="small"
                      label="Reason"
                      placeholder="e.g., Sick, Family event"
                      value={state?.absenceReason || ''}
                      onChange={(e) => handleReasonChange(student.id, e.target.value)}
                      error={reasonError}
                      helperText={reasonError ? 'Reason is required' : ''}
                      sx={{ flex: '1 1 200px', minWidth: 200 }}
                    />
                  )}
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {onClose && (
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={batchMarkMutation.isPending || hasErrors || students.length === 0}
        >
          {batchMarkMutation.isPending ? 'Saving...' : 'Save Attendance'}
        </Button>
      </Box>
    </Paper>
  );
}

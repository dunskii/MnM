// ===========================================
// Lessons Management Page
// ===========================================
// CRUD interface for managing lessons and enrollments

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Divider,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  useTerms,
  useLocations,
  useRooms,
  useInstruments,
  useLessonTypes,
  useLessonDurations,
} from '../../hooks/useAdmin';
import { useTeachers } from '../../hooks/useUsers';
import {
  useLessons,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
} from '../../hooks/useLessons';
import {
  Lesson,
  LessonFilters,
  CreateLessonInput,
  getShortDayName,
  formatTime,
  getLessonTypeColor,
  calculateEndTime,
} from '../../api/lessons.api';

// ===========================================
// CONSTANTS
// ===========================================

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

// Form data type for lesson creation/editing
interface LessonFormData {
  name: string;
  description: string;
  lessonTypeId: string;
  termId: string;
  teacherId: string;
  locationId: string;
  roomId: string;
  instrumentId: string;
  dayOfWeek: number;
  startTime: string;
  durationMins: number;
  maxStudents: number;
  isRecurring: boolean;
  patternType: 'ALTERNATING' | 'CUSTOM';
  groupWeeks: number[];
  individualWeeks: number[];
  individualSlotDuration: number;
  bookingDeadlineHours: number;
}

const DEFAULT_FORM_DATA: LessonFormData = {
  name: '',
  description: '',
  lessonTypeId: '',
  termId: '',
  teacherId: '',
  locationId: '',
  roomId: '',
  instrumentId: '',
  dayOfWeek: 1, // Monday default
  startTime: '09:00',
  durationMins: 45,
  maxStudents: 1,
  isRecurring: true,
  // Hybrid pattern
  patternType: 'ALTERNATING',
  groupWeeks: [],
  individualWeeks: [],
  individualSlotDuration: 30,
  bookingDeadlineHours: 24,
};

// ===========================================
// COMPONENT
// ===========================================

export default function LessonsPage() {
  const navigate = useNavigate();

  // Filters state
  const [filters, setFilters] = useState<LessonFilters>({});

  // Data queries
  const { data: lessonsData, isLoading, error } = useLessons(filters);
  const { data: termsData } = useTerms();
  const { data: locationsData } = useLocations();
  const { data: instrumentsData } = useInstruments();
  const { data: lessonTypesData } = useLessonTypes();
  const { data: durationsData } = useLessonDurations();
  const { data: teachersData } = useTeachers();

  const lessons = lessonsData ?? [];
  const terms = termsData ?? [];
  const locations = locationsData ?? [];
  const instruments = instrumentsData ?? [];
  const lessonTypes = lessonTypesData ?? [];
  const durations = durationsData ?? [];
  const teachers = teachersData ?? [];

  // Get rooms based on selected location
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const { data: roomsData } = useRooms(selectedLocationId || undefined);
  const rooms = roomsData ?? [];

  // Mutations
  const createMutation = useCreateLesson();
  const updateMutation = useUpdateLesson();
  const deleteMutation = useDeleteLesson();

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState<LessonFormData>(DEFAULT_FORM_DATA);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);

  // Get selected lesson type
  const selectedLessonType = useMemo(
    () => lessonTypes.find((lt) => lt.id === formData.lessonTypeId),
    [lessonTypes, formData.lessonTypeId]
  );

  // Update duration when lesson type changes
  useEffect(() => {
    if (selectedLessonType && !editingLesson) {
      setFormData((prev) => ({
        ...prev,
        durationMins: selectedLessonType.defaultDuration,
        maxStudents: selectedLessonType.type === 'INDIVIDUAL' ? 1 : prev.maxStudents,
      }));
    }
  }, [selectedLessonType, editingLesson]);

  // Update rooms when location changes
  useEffect(() => {
    if (formData.locationId !== selectedLocationId) {
      setSelectedLocationId(formData.locationId);
      if (formData.locationId !== selectedLocationId) {
        setFormData((prev) => ({ ...prev, roomId: '' }));
      }
    }
  }, [formData.locationId, selectedLocationId]);

  // Calculate end time
  const endTime = useMemo(
    () => calculateEndTime(formData.startTime, formData.durationMins),
    [formData.startTime, formData.durationMins]
  );

  // Table columns
  const columns: Column<Lesson>[] = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 150,
    },
    {
      id: 'lessonType.type',
      label: 'Type',
      minWidth: 100,
      format: (_, row) => (
        <Chip
          label={row.lessonType.type}
          size="small"
          color={getLessonTypeColor(row.lessonType.type)}
        />
      ),
    },
    {
      id: 'dayOfWeek',
      label: 'Day/Time',
      minWidth: 150,
      format: (_, row) => (
        <Box>
          <Typography variant="body2">{getShortDayName(row.dayOfWeek)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(row.startTime)} - {formatTime(row.endTime)}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'teacher',
      label: 'Teacher',
      minWidth: 150,
      format: (_, row) =>
        `${row.teacher.user.firstName} ${row.teacher.user.lastName}`,
    },
    {
      id: 'room',
      label: 'Room',
      minWidth: 150,
      format: (_, row) => (
        <Box>
          <Typography variant="body2">{row.room.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.room.location.name}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'enrollments',
      label: 'Enrolled',
      minWidth: 100,
      format: (_, row) => (
        <Chip
          label={`${row._count.enrollments}/${row.maxStudents}`}
          size="small"
          color={
            row._count.enrollments >= row.maxStudents
              ? 'error'
              : row._count.enrollments > 0
              ? 'success'
              : 'default'
          }
          variant="outlined"
        />
      ),
    },
    {
      id: 'isActive',
      label: 'Status',
      minWidth: 100,
      format: (value) =>
        value ? (
          <Chip label="Active" size="small" color="success" />
        ) : (
          <Chip label="Inactive" size="small" color="default" />
        ),
    },
  ];

  // Handlers
  const handleAdd = () => {
    setEditingLesson(null);
    setFormData({
      ...DEFAULT_FORM_DATA,
      termId: terms.find((t) => t.isActive)?.id || '',
    });
    setModalOpen(true);
  };

  const handleView = (lesson: Lesson) => {
    navigate(`/admin/lessons/${lesson.id}`);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setSelectedLocationId(lesson.room.location.id);
    setFormData({
      name: lesson.name,
      description: lesson.description || '',
      lessonTypeId: lesson.lessonTypeId,
      termId: lesson.termId,
      teacherId: lesson.teacherId,
      locationId: lesson.room.location.id,
      roomId: lesson.roomId,
      instrumentId: lesson.instrumentId || '',
      dayOfWeek: lesson.dayOfWeek,
      startTime: lesson.startTime,
      durationMins: lesson.durationMins,
      maxStudents: lesson.maxStudents,
      isRecurring: lesson.isRecurring,
      // Hybrid pattern
      patternType: lesson.hybridPattern?.patternType || 'ALTERNATING',
      groupWeeks: (lesson.hybridPattern?.groupWeeks as number[]) || [],
      individualWeeks: (lesson.hybridPattern?.individualWeeks as number[]) || [],
      individualSlotDuration: lesson.hybridPattern?.individualSlotDuration || 30,
      bookingDeadlineHours: lesson.hybridPattern?.bookingDeadlineHours || 24,
    });
    setModalOpen(true);
  };

  const handleDelete = (lesson: Lesson) => {
    setLessonToDelete(lesson);
    setDeleteDialogOpen(true);
  };

  // Type-safe select change handlers
  type StringFields = 'lessonTypeId' | 'termId' | 'teacherId' | 'locationId' | 'roomId' | 'instrumentId' | 'patternType';
  type NumberFields = 'dayOfWeek' | 'durationMins';
  type NumberArrayFields = 'groupWeeks' | 'individualWeeks';

  const handleSelectChange = <K extends StringFields | NumberFields>(field: K) =>
    (event: SelectChangeEvent<LessonFormData[K]>) => {
      setFormData({ ...formData, [field]: event.target.value });
    };

  const handleMultiSelectChange = <K extends NumberArrayFields>(field: K) =>
    (event: SelectChangeEvent<number[]>) => {
      const value = event.target.value;
      setFormData({
        ...formData,
        [field]: typeof value === 'string' ? value.split(',').map(Number) : value,
      });
    };

  const handleSubmit = async () => {
    try {
      const lessonData: CreateLessonInput = {
        name: formData.name,
        description: formData.description || undefined,
        lessonTypeId: formData.lessonTypeId,
        termId: formData.termId,
        teacherId: formData.teacherId,
        roomId: formData.roomId,
        instrumentId: formData.instrumentId || undefined,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: endTime,
        durationMins: formData.durationMins,
        maxStudents: formData.maxStudents,
        isRecurring: formData.isRecurring,
      };

      // Add hybrid pattern for HYBRID type
      if (selectedLessonType?.type === 'HYBRID') {
        lessonData.hybridPattern = {
          patternType: formData.patternType,
          groupWeeks: formData.groupWeeks,
          individualWeeks: formData.individualWeeks,
          individualSlotDuration: formData.individualSlotDuration,
          bookingDeadlineHours: formData.bookingDeadlineHours,
        };
      }

      if (editingLesson) {
        await updateMutation.mutateAsync({
          id: editingLesson.id,
          data: lessonData,
        });
      } else {
        await createMutation.mutateAsync(lessonData);
      }
      setModalOpen(false);
    } catch {
      // Error is handled by mutation
    }
  };

  const handleConfirmDelete = async () => {
    if (lessonToDelete) {
      try {
        await deleteMutation.mutateAsync(lessonToDelete.id);
        setDeleteDialogOpen(false);
        setLessonToDelete(null);
      } catch {
        // Error is handled by mutation
      }
    }
  };

  const isFormLoading = createMutation.isPending || updateMutation.isPending;
  const isDeleteLoading = deleteMutation.isPending;

  // Generate week numbers 1-10 for hybrid pattern selection
  const weekNumbers = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <Box>
      <PageHeader
        title="Lessons"
        subtitle="Manage lessons and student enrollments"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Lessons' },
        ]}
        actionLabel="Add Lesson"
        onAction={handleAdd}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load lessons. Please try again.
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Term</InputLabel>
          <Select
            value={filters.termId || ''}
            label="Term"
            onChange={(e) =>
              setFilters({ ...filters, termId: e.target.value || undefined })
            }
          >
            <MenuItem value="">All Terms</MenuItem>
            {terms.map((term) => (
              <MenuItem key={term.id} value={term.id}>
                {term.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filters.lessonTypeId || ''}
            label="Type"
            onChange={(e) =>
              setFilters({ ...filters, lessonTypeId: e.target.value || undefined })
            }
          >
            <MenuItem value="">All Types</MenuItem>
            {lessonTypes.map((lt) => (
              <MenuItem key={lt.id} value={lt.id}>
                {lt.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Day</InputLabel>
          <Select
            value={filters.dayOfWeek ?? ''}
            label="Day"
            onChange={(e) =>
              setFilters({
                ...filters,
                dayOfWeek: e.target.value === '' ? undefined : Number(e.target.value),
              })
            }
          >
            <MenuItem value="">All Days</MenuItem>
            {DAYS_OF_WEEK.map((day) => (
              <MenuItem key={day.value} value={day.value}>
                {day.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Teacher</InputLabel>
          <Select
            value={filters.teacherId || ''}
            label="Teacher"
            onChange={(e) =>
              setFilters({ ...filters, teacherId: e.target.value || undefined })
            }
          >
            <MenuItem value="">All Teachers</MenuItem>
            {teachers.map((teacher) => (
              <MenuItem key={teacher.id} value={teacher.id}>
                {teacher.user.firstName} {teacher.user.lastName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <DataTable
        columns={columns}
        data={lessons}
        loading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No lessons found. Click 'Add Lesson' to create one."
        searchPlaceholder="Search lessons..."
      />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editingLesson ? 'Edit Lesson' : 'Add Lesson'}
        submitLabel={editingLesson ? 'Update' : 'Create'}
        loading={isFormLoading}
        maxWidth="md"
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      >
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            {/* Basic Info */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Lesson Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                placeholder="e.g., Monday Piano Group"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Lesson Type</InputLabel>
                <Select
                  value={formData.lessonTypeId}
                  label="Lesson Type"
                  onChange={handleSelectChange('lessonTypeId')}
                >
                  {lessonTypes.map((lt) => (
                    <MenuItem key={lt.id} value={lt.id}>
                      {lt.name} ({lt.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Term</InputLabel>
                <Select
                  value={formData.termId}
                  label="Term"
                  onChange={handleSelectChange('termId')}
                >
                  {terms.map((term) => (
                    <MenuItem key={term.id} value={term.id}>
                      {term.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Instrument</InputLabel>
                <Select
                  value={formData.instrumentId}
                  label="Instrument"
                  onChange={handleSelectChange('instrumentId')}
                >
                  <MenuItem value="">None</MenuItem>
                  {instruments.map((inst) => (
                    <MenuItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Teacher & Location
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Teacher</InputLabel>
                <Select
                  value={formData.teacherId}
                  label="Teacher"
                  onChange={handleSelectChange('teacherId')}
                >
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.user.firstName} {teacher.user.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Location</InputLabel>
                <Select
                  value={formData.locationId}
                  label="Location"
                  onChange={handleSelectChange('locationId')}
                >
                  {locations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={!formData.locationId}>
                <InputLabel>Room</InputLabel>
                <Select
                  value={formData.roomId}
                  label="Room"
                  onChange={handleSelectChange('roomId')}
                >
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.name} (Cap: {room.capacity})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Schedule
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  value={formData.dayOfWeek}
                  label="Day of Week"
                  onChange={handleSelectChange('dayOfWeek')}
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      {day.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Duration</InputLabel>
                <Select
                  value={formData.durationMins}
                  label="Duration"
                  onChange={handleSelectChange('durationMins')}
                >
                  {durations.map((d) => (
                    <MenuItem key={d.id} value={d.minutes}>
                      {d.minutes} mins
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="End Time"
                value={formatTime(endTime)}
                disabled
                fullWidth
                helperText="Calculated from duration"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Max Students"
                type="number"
                value={formData.maxStudents}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxStudents: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                required
                fullWidth
                inputProps={{ min: 1, max: 30 }}
                disabled={selectedLessonType?.type === 'INDIVIDUAL'}
              />
            </Grid>

            {/* Hybrid Pattern Section */}
            {selectedLessonType?.type === 'HYBRID' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Hybrid Pattern Configuration
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Configure which weeks are group sessions vs individual sessions
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Pattern Type</InputLabel>
                    <Select
                      value={formData.patternType}
                      label="Pattern Type"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          patternType: e.target.value as 'ALTERNATING' | 'CUSTOM',
                        })
                      }
                    >
                      <MenuItem value="ALTERNATING">Alternating (every other week)</MenuItem>
                      <MenuItem value="CUSTOM">Custom Pattern</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Individual Slot Duration"
                    type="number"
                    value={formData.individualSlotDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        individualSlotDuration: parseInt(e.target.value) || 30,
                      })
                    }
                    fullWidth
                    inputProps={{ min: 15, max: 60, step: 15 }}
                    helperText="Duration of each individual slot (mins)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Group Weeks</InputLabel>
                    <Select
                      multiple
                      value={formData.groupWeeks}
                      label="Group Weeks"
                      onChange={handleMultiSelectChange('groupWeeks')}
                      renderValue={(selected) => selected.join(', ')}
                    >
                      {weekNumbers.map((week) => (
                        <MenuItem
                          key={week}
                          value={week}
                          disabled={formData.individualWeeks.includes(week)}
                        >
                          Week {week}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Individual Weeks</InputLabel>
                    <Select
                      multiple
                      value={formData.individualWeeks}
                      label="Individual Weeks"
                      onChange={handleMultiSelectChange('individualWeeks')}
                      renderValue={(selected) => selected.join(', ')}
                    >
                      {weekNumbers.map((week) => (
                        <MenuItem
                          key={week}
                          value={week}
                          disabled={formData.groupWeeks.includes(week)}
                        >
                          Week {week}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Booking Deadline"
                    type="number"
                    value={formData.bookingDeadlineHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bookingDeadlineHours: parseInt(e.target.value) || 24,
                      })
                    }
                    fullWidth
                    inputProps={{ min: 0, max: 168 }}
                    helperText="Hours before lesson that booking closes"
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                placeholder="Optional notes about this lesson..."
              />
            </Grid>
          </Grid>
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Deactivate Lesson"
        message={`Are you sure you want to deactivate "${lessonToDelete?.name}"? Students will be unenrolled and this lesson will no longer appear in schedules.`}
        confirmLabel="Deactivate"
        confirmColor="error"
        loading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}

// ===========================================
// Note Editor Component
// ===========================================
// Component for creating/editing class and student notes

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  getNoteStatusColor,
  getNoteStatusLabel,
  isClassNote,
} from '../../api/notes.api';
import {
  useNotesByLesson,
  useLessonNoteCompletion,
  useCreateNote,
  useUpdateNote,
} from '../../hooks/useNotes';
import { useEnrolledStudentsForAttendance } from '../../hooks/useAttendance';

// ===========================================
// TYPES
// ===========================================

interface NoteEditorProps {
  lessonId: string;
  lessonName: string;
  date: Date;
  onClose?: () => void;
  onSaved?: () => void;
}

type NoteType = 'class' | 'student';

// ===========================================
// COMPONENT
// ===========================================

export default function NoteEditor({
  lessonId,
  lessonName,
  date,
  onClose,
  onSaved,
}: NoteEditorProps) {
  const dateString = format(date, 'yyyy-MM-dd');

  // State
  const [noteType, setNoteType] = useState<NoteType>('class');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Queries
  const { data: notes, isLoading: isLoadingNotes } = useNotesByLesson(lessonId, {
    date: dateString,
  });
  const { data: completion, isLoading: isLoadingCompletion } = useLessonNoteCompletion(
    lessonId,
    dateString
  );
  const { data: enrolledData, isLoading: isLoadingStudents } = useEnrolledStudentsForAttendance(
    lessonId,
    dateString
  );

  // Mutations
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();

  // Get class note and student notes
  const classNote = notes?.find((n) => isClassNote(n));
  const studentNotes = notes?.filter((n) => n.studentId) || [];
  const students = enrolledData?.students || [];

  // Load note content when switching tabs or selecting student
  useEffect(() => {
    if (noteType === 'class' && classNote) {
      setContent(classNote.content);
      setIsPrivate(classNote.isPrivate);
      setEditingNoteId(classNote.id);
    } else if (noteType === 'student' && selectedStudentId) {
      const studentNote = studentNotes.find((n) => n.studentId === selectedStudentId);
      if (studentNote) {
        setContent(studentNote.content);
        setIsPrivate(studentNote.isPrivate);
        setEditingNoteId(studentNote.id);
      } else {
        setContent('');
        setIsPrivate(false);
        setEditingNoteId(null);
      }
    } else {
      setContent('');
      setIsPrivate(false);
      setEditingNoteId(null);
    }
  }, [noteType, selectedStudentId, classNote, studentNotes]);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: NoteType) => {
    setNoteType(newValue);
    if (newValue === 'class') {
      setSelectedStudentId('');
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  };

  // Handle student selection
  const handleStudentChange = (event: SelectChangeEvent) => {
    setSelectedStudentId(event.target.value);
  };

  // Check if student has a note
  const hasStudentNote = (studentId: string) => {
    return studentNotes.some((n) => n.studentId === studentId);
  };

  // Handle save
  const handleSave = async () => {
    if (!content.trim()) return;

    const noteData = {
      lessonId,
      studentId: noteType === 'student' ? selectedStudentId : undefined,
      date: dateString,
      content: content.trim(),
      isPrivate,
    };

    if (editingNoteId) {
      await updateNoteMutation.mutateAsync({
        id: editingNoteId,
        data: { content: content.trim(), isPrivate },
      });
    } else {
      await createNoteMutation.mutateAsync(noteData);
    }

    onSaved?.();
  };

  const isLoading = isLoadingNotes || isLoadingCompletion || isLoadingStudents;
  const isSaving = createNoteMutation.isPending || updateNoteMutation.isPending;
  const canSave = content.trim().length > 0 && (noteType === 'class' || selectedStudentId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Teacher Notes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {lessonName} - {format(date, 'EEEE, MMMM d, yyyy')}
        </Typography>
      </Box>

      {/* Completion Status */}
      {completion && (
        <Alert
          severity={completion.status === 'COMPLETE' ? 'success' : 'warning'}
          sx={{ mb: 3 }}
          action={
            <Chip
              label={getNoteStatusLabel(completion.status)}
              color={getNoteStatusColor(completion.status)}
              size="small"
            />
          }
        >
          {completion.status === 'COMPLETE' ? (
            'All notes complete!'
          ) : (
            <>
              {!completion.classNoteComplete && 'Class note required. '}
              {completion.missingStudentNotes.length > 0 &&
                `${completion.missingStudentNotes.length} student note(s) missing.`}
            </>
          )}
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Note Type Tabs */}
      <Tabs value={noteType} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab
          icon={<SchoolIcon />}
          iconPosition="start"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Class Note
              {classNote && <Chip label="Added" size="small" color="success" />}
            </Box>
          }
          value="class"
        />
        <Tab
          icon={<PersonIcon />}
          iconPosition="start"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Student Notes
              <Chip
                label={`${studentNotes.length}/${students.length}`}
                size="small"
                color={studentNotes.length === students.length ? 'success' : 'warning'}
              />
            </Box>
          }
          value="student"
        />
      </Tabs>

      {/* Student Selector (for student notes) */}
      {noteType === 'student' && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Student</InputLabel>
          <Select
            value={selectedStudentId}
            onChange={handleStudentChange}
            label="Select Student"
          >
            {students.map((student) => (
              <MenuItem key={student.id} value={student.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography>
                    {student.firstName} {student.lastName}
                  </Typography>
                  {hasStudentNote(student.id) ? (
                    <Chip label="Note Added" size="small" color="success" sx={{ ml: 'auto' }} />
                  ) : (
                    <Chip label="No Note" size="small" color="warning" sx={{ ml: 'auto' }} />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Note Content */}
      <TextField
        multiline
        rows={6}
        fullWidth
        label={noteType === 'class' ? 'Class Notes' : 'Student Notes'}
        placeholder={
          noteType === 'class'
            ? 'Enter class notes (topics covered, lesson summary, etc.)'
            : 'Enter notes for this student (progress, behavior, homework, etc.)'
        }
        value={content}
        onChange={(e) => setContent(e.target.value)}
        helperText={`${content.length}/5000 characters`}
        inputProps={{ maxLength: 5000 }}
        sx={{ mb: 2 }}
      />

      {/* Privacy Toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            icon={<LockOpenIcon />}
            checkedIcon={<LockIcon />}
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              {isPrivate ? 'Teachers Only' : 'Visible to Parents'}
            </Typography>
            <Chip
              label={isPrivate ? 'Private' : 'Public'}
              size="small"
              color={isPrivate ? 'error' : 'success'}
            />
          </Box>
        }
      />

      <Divider sx={{ my: 3 }} />

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {onClose && (
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!canSave || isSaving}
        >
          {isSaving ? 'Saving...' : editingNoteId ? 'Update Note' : 'Save Note'}
        </Button>
      </Box>
    </Paper>
  );
}

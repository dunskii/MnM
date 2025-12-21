// ===========================================
// Students Management Page
// ===========================================
// CRUD interface for managing students

import { useState } from 'react';
import {
  Box,
  TextField,
  Alert,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  useStudents,
  useFamilies,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
} from '../../hooks/useUsers';
import { Student } from '../../api/users.api';

// ===========================================
// TYPES
// ===========================================

type AgeGroup = 'PRESCHOOL' | 'KIDS' | 'TEENS' | 'ADULT';

const ageGroupOptions: { value: AgeGroup; label: string; color: string }[] = [
  { value: 'PRESCHOOL', label: 'Pre-school', color: '#FFAE9E' }, // Coral (Alice)
  { value: 'KIDS', label: 'Kids', color: '#FFCE00' }, // Yellow (Steve)
  { value: 'TEENS', label: 'Teens', color: '#4580E4' }, // Blue (Liam)
  { value: 'ADULT', label: 'Adult', color: '#96DAC9' }, // Mint (Floyd)
];

// ===========================================
// COMPONENT
// ===========================================

export default function StudentsPage() {
  const { data: students, isLoading, error } = useStudents();
  const { data: families } = useFamilies();
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    familyId: '',
    notes: '',
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Table columns
  const columns: Column<Student>[] = [
    {
      id: 'firstName',
      label: 'Name',
      minWidth: 150,
      format: (_, row) => `${row.firstName} ${row.lastName}`,
    },
    {
      id: 'birthDate',
      label: 'Birth Date',
      minWidth: 120,
      format: (value) =>
        value ? new Date(value as string).toLocaleDateString() : '-',
    },
    {
      id: 'ageGroup',
      label: 'Age Group',
      minWidth: 120,
      format: (value) => {
        const ageValue = value as AgeGroup;
        const group = ageGroupOptions.find((g) => g.value === ageValue);
        return (
          <Chip
            label={group?.label ?? String(value)}
            size="small"
            sx={{
              bgcolor: group?.color ?? '#ccc',
              color: ageValue === 'KIDS' ? '#000' : '#fff',
            }}
          />
        );
      },
    },
    {
      id: 'family.name',
      label: 'Family',
      minWidth: 150,
      format: (_, row) => row.family?.name || '-',
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
    setEditingStudent(null);
    setFormData({
      firstName: '',
      lastName: '',
      birthDate: '',
      familyId: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      birthDate: student.birthDate ? student.birthDate.split('T')[0] : '',
      familyId: student.familyId || '',
      notes: student.notes || '',
    });
    setModalOpen(true);
  };

  const handleDelete = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingStudent) {
        await updateMutation.mutateAsync({
          id: editingStudent.id,
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            birthDate: formData.birthDate || null,
            notes: formData.notes || null,
          },
        });
      } else {
        await createMutation.mutateAsync({
          firstName: formData.firstName,
          lastName: formData.lastName,
          birthDate: formData.birthDate || undefined,
          familyId: formData.familyId || undefined,
          notes: formData.notes || undefined,
        });
      }
      setModalOpen(false);
    } catch {
      // Error is handled by mutation
    }
  };

  const handleConfirmDelete = async () => {
    if (studentToDelete) {
      try {
        await deleteMutation.mutateAsync(studentToDelete.id);
        setDeleteDialogOpen(false);
        setStudentToDelete(null);
      } catch {
        // Error is handled by mutation
      }
    }
  };

  const isFormLoading = createMutation.isPending || updateMutation.isPending;
  const isDeleteLoading = deleteMutation.isPending;

  return (
    <Box>
      <PageHeader
        title="Students"
        subtitle="Manage student records and family assignments"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Students' },
        ]}
        actionLabel="Add Student"
        onAction={handleAdd}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load students. Please try again.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={students ?? []}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No students found. Click 'Add Student' to create one."
        searchPlaceholder="Search students..."
      />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editingStudent ? 'Edit Student' : 'Add Student'}
        submitLabel={editingStudent ? 'Update' : 'Create'}
        loading={isFormLoading}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              fullWidth
            />
          </Stack>
          <TextField
            label="Birth Date"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Age group will be calculated automatically"
          />
          {!editingStudent && (
            <FormControl fullWidth>
              <InputLabel>Family</InputLabel>
              <Select
                value={formData.familyId}
                onChange={(e) => setFormData({ ...formData, familyId: e.target.value })}
                label="Family"
              >
                <MenuItem value="">
                  <em>No family</em>
                </MenuItem>
                {families?.map((family) => (
                  <MenuItem key={family.id} value={family.id}>
                    {family.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            label="Notes"
            placeholder="Any additional notes about this student..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Deactivate Student"
        message={`Are you sure you want to deactivate ${studentToDelete?.firstName} ${studentToDelete?.lastName}?`}
        confirmLabel="Deactivate"
        confirmColor="error"
        loading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}

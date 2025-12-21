// ===========================================
// Teachers Management Page
// ===========================================
// CRUD interface for managing teachers

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
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useInstruments } from '../../hooks/useAdmin';
import {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
} from '../../hooks/useUsers';
import { Teacher } from '../../api/users.api';

// ===========================================
// COMPONENT
// ===========================================

export default function TeachersPage() {
  const { data: teachers, isLoading, error } = useTeachers();
  const { data: instruments } = useInstruments();
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const deleteMutation = useDeleteTeacher();

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    instrumentIds: [] as string[],
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  // Table columns
  const columns: Column<Teacher>[] = [
    {
      id: 'user.firstName',
      label: 'Name',
      minWidth: 150,
      format: (_, row) => `${row.user.firstName} ${row.user.lastName}`,
    },
    {
      id: 'user.email',
      label: 'Email',
      minWidth: 200,
    },
    {
      id: 'user.phone',
      label: 'Phone',
      minWidth: 120,
      format: (value) => (value as string) || '-',
    },
    {
      id: 'instruments',
      label: 'Instruments',
      minWidth: 200,
      sortable: false,
      format: (_, row) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {row.instruments.map((ti) => (
            <Chip
              key={ti.id}
              label={ti.instrument.name}
              size="small"
              color={ti.isPrimary ? 'primary' : 'default'}
              variant={ti.isPrimary ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
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
    setEditingTeacher(null);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      bio: '',
      instrumentIds: [],
    });
    setModalOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      email: teacher.user.email,
      firstName: teacher.user.firstName,
      lastName: teacher.user.lastName,
      phone: teacher.user.phone || '',
      bio: teacher.bio || '',
      instrumentIds: teacher.instruments.map((ti) => ti.instrument.id),
    });
    setModalOpen(true);
  };

  const handleDelete = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setDeleteDialogOpen(true);
  };

  const handleInstrumentChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      instrumentIds: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingTeacher) {
        await updateMutation.mutateAsync({
          id: editingTeacher.id,
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone || undefined,
            bio: formData.bio || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          bio: formData.bio || undefined,
          instrumentIds: formData.instrumentIds,
        });
      }
      setModalOpen(false);
    } catch {
      // Error is handled by mutation
    }
  };

  const handleConfirmDelete = async () => {
    if (teacherToDelete) {
      try {
        await deleteMutation.mutateAsync(teacherToDelete.id);
        setDeleteDialogOpen(false);
        setTeacherToDelete(null);
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
        title="Teachers"
        subtitle="Manage teacher accounts and instrument assignments"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Teachers' },
        ]}
        actionLabel="Add Teacher"
        onAction={handleAdd}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load teachers. Please try again.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={teachers ?? []}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No teachers found. Click 'Add Teacher' to create one."
        searchPlaceholder="Search teachers..."
      />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
        submitLabel={editingTeacher ? 'Update' : 'Create'}
        loading={isFormLoading}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {!editingTeacher && (
            <TextField
              label="Email"
              type="email"
              placeholder="teacher@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
              helperText="A temporary password will be generated and emailed"
            />
          )}
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
            label="Phone"
            placeholder="(02) 1234 5678"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            fullWidth
          />
          {!editingTeacher && (
            <FormControl fullWidth>
              <InputLabel>Instruments</InputLabel>
              <Select
                multiple
                value={formData.instrumentIds}
                onChange={handleInstrumentChange}
                input={<OutlinedInput label="Instruments" />}
                renderValue={(selected) =>
                  instruments
                    ?.filter((i: { id: string; name: string }) => selected.includes(i.id))
                    .map((i: { id: string; name: string }) => i.name)
                    .join(', ')
                }
              >
                {instruments?.map((instrument: { id: string; name: string }) => (
                  <MenuItem key={instrument.id} value={instrument.id}>
                    <Checkbox checked={formData.instrumentIds.includes(instrument.id)} />
                    <ListItemText primary={instrument.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            label="Bio"
            placeholder="Brief description of the teacher..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Deactivate Teacher"
        message={`Are you sure you want to deactivate ${teacherToDelete?.user.firstName} ${teacherToDelete?.user.lastName}? They will no longer be able to log in.`}
        confirmLabel="Deactivate"
        confirmColor="error"
        loading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}

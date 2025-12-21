// ===========================================
// Lesson Durations Management Page
// ===========================================
// CRUD interface for managing lesson durations

import { useState } from 'react';
import { Box, TextField, Alert, Chip } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  useLessonDurations,
  useCreateLessonDuration,
  useUpdateLessonDuration,
  useDeleteLessonDuration,
} from '../../hooks/useAdmin';
import { LessonDuration } from '../../api/admin.api';

// ===========================================
// COMPONENT
// ===========================================

export default function DurationsPage() {
  const { data: durations, isLoading, error } = useLessonDurations();
  const createMutation = useCreateLessonDuration();
  const updateMutation = useUpdateLessonDuration();
  const deleteMutation = useDeleteLessonDuration();

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDuration, setEditingDuration] = useState<LessonDuration | null>(null);
  const [formData, setFormData] = useState({
    minutes: '',
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [durationToDelete, setDurationToDelete] = useState<LessonDuration | null>(null);

  // Table columns
  const columns: Column<LessonDuration>[] = [
    {
      id: 'minutes',
      label: 'Duration',
      minWidth: 200,
      format: (value) => `${value} minutes`,
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
    setEditingDuration(null);
    setFormData({ minutes: '' });
    setModalOpen(true);
  };

  const handleEdit = (duration: LessonDuration) => {
    setEditingDuration(duration);
    setFormData({
      minutes: duration.minutes.toString(),
    });
    setModalOpen(true);
  };

  const handleDelete = (duration: LessonDuration) => {
    setDurationToDelete(duration);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        minutes: parseInt(formData.minutes, 10),
      };

      if (editingDuration) {
        await updateMutation.mutateAsync({
          id: editingDuration.id,
          data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      setModalOpen(false);
    } catch {
      // Error is handled by mutation
    }
  };

  const handleConfirmDelete = async () => {
    if (durationToDelete) {
      try {
        await deleteMutation.mutateAsync(durationToDelete.id);
        setDeleteDialogOpen(false);
        setDurationToDelete(null);
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
        title="Lesson Durations"
        subtitle="Manage available lesson lengths"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Durations' },
        ]}
        actionLabel="Add Duration"
        onAction={handleAdd}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load durations. Please try again.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={durations ?? []}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No durations configured. Click 'Add Duration' to create one."
        searchPlaceholder="Search durations..."
      />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editingDuration ? 'Edit Duration' : 'Add Duration'}
        submitLabel={editingDuration ? 'Update' : 'Create'}
        loading={isFormLoading}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Duration (minutes)"
            type="number"
            placeholder="e.g., 45"
            value={formData.minutes}
            onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
            required
            fullWidth
            inputProps={{ min: 15, step: 15 }}
            helperText="Enter duration in minutes (e.g., 30, 45, 60)"
          />
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Duration"
        message={`Are you sure you want to delete the ${durationToDelete?.minutes} minute duration? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}

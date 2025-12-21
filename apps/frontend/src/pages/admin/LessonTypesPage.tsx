// ===========================================
// Lesson Types Management Page
// ===========================================
// CRUD interface for managing lesson types

import { useState } from 'react';
import {
  Box,
  TextField,
  Alert,
  Chip,
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
  useLessonTypes,
  useCreateLessonType,
  useUpdateLessonType,
  useDeleteLessonType,
} from '../../hooks/useAdmin';
import { LessonType } from '../../api/admin.api';

// ===========================================
// TYPES
// ===========================================

type LessonTypeCategory = 'INDIVIDUAL' | 'GROUP' | 'BAND' | 'HYBRID';

const lessonTypeOptions: { value: LessonTypeCategory; label: string; color: string }[] = [
  { value: 'INDIVIDUAL', label: 'Individual', color: '#4580E4' },
  { value: 'GROUP', label: 'Group', color: '#96DAC9' },
  { value: 'BAND', label: 'Band', color: '#FFAE9E' },
  { value: 'HYBRID', label: 'Hybrid', color: '#FFCE00' },
];

// ===========================================
// COMPONENT
// ===========================================

export default function LessonTypesPage() {
  const { data: lessonTypes, isLoading, error } = useLessonTypes();
  const createMutation = useCreateLessonType();
  const updateMutation = useUpdateLessonType();
  const deleteMutation = useDeleteLessonType();

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLessonType, setEditingLessonType] = useState<LessonType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'INDIVIDUAL' as LessonTypeCategory,
    defaultDuration: '45',
    description: '',
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonTypeToDelete, setLessonTypeToDelete] = useState<LessonType | null>(null);

  // Table columns
  const columns: Column<LessonType>[] = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 150,
    },
    {
      id: 'type',
      label: 'Type',
      minWidth: 120,
      format: (value) => {
        const typeValue = value as LessonTypeCategory;
        const typeInfo = lessonTypeOptions.find((t) => t.value === typeValue);
        return (
          <Chip
            label={typeInfo?.label ?? String(value)}
            size="small"
            sx={{
              bgcolor: typeInfo?.color ?? '#ccc',
              color: typeValue === 'HYBRID' ? '#000' : '#fff',
            }}
          />
        );
      },
    },
    {
      id: 'defaultDuration',
      label: 'Duration',
      minWidth: 100,
      format: (value) => `${value} min`,
    },
    {
      id: 'description',
      label: 'Description',
      minWidth: 200,
      format: (value) => (value as string) || '-',
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
    setEditingLessonType(null);
    setFormData({
      name: '',
      type: 'INDIVIDUAL',
      defaultDuration: '45',
      description: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (lessonType: LessonType) => {
    setEditingLessonType(lessonType);
    setFormData({
      name: lessonType.name,
      type: lessonType.type,
      defaultDuration: lessonType.defaultDuration.toString(),
      description: lessonType.description || '',
    });
    setModalOpen(true);
  };

  const handleDelete = (lessonType: LessonType) => {
    setLessonTypeToDelete(lessonType);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        name: formData.name,
        type: formData.type,
        defaultDuration: parseInt(formData.defaultDuration, 10),
        description: formData.description || undefined,
      };

      if (editingLessonType) {
        await updateMutation.mutateAsync({
          id: editingLessonType.id,
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
    if (lessonTypeToDelete) {
      try {
        await deleteMutation.mutateAsync(lessonTypeToDelete.id);
        setDeleteDialogOpen(false);
        setLessonTypeToDelete(null);
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
        title="Lesson Types"
        subtitle="Manage available lesson types and their configurations"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Lesson Types' },
        ]}
        actionLabel="Add Lesson Type"
        onAction={handleAdd}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load lesson types. Please try again.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={lessonTypes ?? []}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No lesson types configured. Click 'Add Lesson Type' to create one."
        searchPlaceholder="Search lesson types..."
      />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editingLessonType ? 'Edit Lesson Type' : 'Add Lesson Type'}
        submitLabel={editingLessonType ? 'Update' : 'Create'}
        loading={isFormLoading}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            placeholder="e.g., Piano Individual"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          <FormControl fullWidth required>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as LessonTypeCategory })
              }
              label="Type"
            >
              {lessonTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Default Duration (minutes)"
            type="number"
            value={formData.defaultDuration}
            onChange={(e) => setFormData({ ...formData, defaultDuration: e.target.value })}
            required
            fullWidth
            inputProps={{ min: 15, step: 15 }}
          />
          <TextField
            label="Description"
            placeholder="Describe this lesson type..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Lesson Type"
        message={`Are you sure you want to delete "${lessonTypeToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}

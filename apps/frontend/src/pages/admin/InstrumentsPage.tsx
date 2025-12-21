// ===========================================
// Instruments Management Page
// ===========================================
// CRUD interface for managing instruments

import { useState } from 'react';
import { Box, TextField, Alert, Chip } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  useInstruments,
  useCreateInstrument,
  useUpdateInstrument,
  useDeleteInstrument,
} from '../../hooks/useAdmin';
import { Instrument } from '../../api/admin.api';

// ===========================================
// COMPONENT
// ===========================================

export default function InstrumentsPage() {
  const { data: instruments, isLoading, error } = useInstruments();
  const createMutation = useCreateInstrument();
  const updateMutation = useUpdateInstrument();
  const deleteMutation = useDeleteInstrument();

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sortOrder: '',
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instrumentToDelete, setInstrumentToDelete] = useState<Instrument | null>(null);

  // Table columns
  const columns: Column<Instrument>[] = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 200,
    },
    {
      id: 'sortOrder',
      label: 'Sort Order',
      minWidth: 100,
      align: 'center',
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
    setEditingInstrument(null);
    setFormData({ name: '', sortOrder: '' });
    setModalOpen(true);
  };

  const handleEdit = (instrument: Instrument) => {
    setEditingInstrument(instrument);
    setFormData({
      name: instrument.name,
      sortOrder: instrument.sortOrder.toString(),
    });
    setModalOpen(true);
  };

  const handleDelete = (instrument: Instrument) => {
    setInstrumentToDelete(instrument);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        name: formData.name,
        sortOrder: formData.sortOrder ? parseInt(formData.sortOrder, 10) : undefined,
      };

      if (editingInstrument) {
        await updateMutation.mutateAsync({
          id: editingInstrument.id,
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
    if (instrumentToDelete) {
      try {
        await deleteMutation.mutateAsync(instrumentToDelete.id);
        setDeleteDialogOpen(false);
        setInstrumentToDelete(null);
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
        title="Instruments"
        subtitle="Manage available instruments for lessons"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Instruments' },
        ]}
        actionLabel="Add Instrument"
        onAction={handleAdd}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load instruments. Please try again.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={instruments ?? []}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No instruments configured. Click 'Add Instrument' to create one."
        searchPlaceholder="Search instruments..."
      />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editingInstrument ? 'Edit Instrument' : 'Add Instrument'}
        submitLabel={editingInstrument ? 'Update' : 'Create'}
        loading={isFormLoading}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Instrument Name"
            placeholder="e.g., Piano"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Sort Order"
            type="number"
            placeholder="e.g., 1"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
            fullWidth
            inputProps={{ min: 0 }}
            helperText="Lower numbers appear first in lists"
          />
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Instrument"
        message={`Are you sure you want to delete "${instrumentToDelete?.name}"? Teachers assigned to this instrument will need to be reassigned.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}

// ===========================================
// Terms Management Page
// ===========================================
// CRUD interface for managing school terms

import { useState } from 'react';
import { Box, TextField, Alert, Chip } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  useTerms,
  useCreateTerm,
  useUpdateTerm,
  useDeleteTerm,
} from '../../hooks/useAdmin';
import { Term } from '../../api/admin.api';

// ===========================================
// COMPONENT
// ===========================================

export default function TermsPage() {
  const { data: terms, isLoading, error } = useTerms();
  const createMutation = useCreateTerm();
  const updateMutation = useUpdateTerm();
  const deleteMutation = useDeleteTerm();

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState<Term | null>(null);

  // Table columns
  const columns: Column<Term>[] = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 150,
    },
    {
      id: 'startDate',
      label: 'Start Date',
      minWidth: 120,
      format: (value) => new Date(value as string).toLocaleDateString(),
    },
    {
      id: 'endDate',
      label: 'End Date',
      minWidth: 120,
      format: (value) => new Date(value as string).toLocaleDateString(),
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
    {
      id: '_count.lessons',
      label: 'Lessons',
      minWidth: 80,
      align: 'center',
      format: (value) => (value as number) ?? 0,
    },
  ];

  // Handlers
  const handleAdd = () => {
    setEditingTerm(null);
    setFormData({ name: '', startDate: '', endDate: '' });
    setModalOpen(true);
  };

  const handleEdit = (term: Term) => {
    setEditingTerm(term);
    setFormData({
      name: term.name,
      startDate: term.startDate.split('T')[0],
      endDate: term.endDate.split('T')[0],
    });
    setModalOpen(true);
  };

  const handleDelete = (term: Term) => {
    setTermToDelete(term);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingTerm) {
        await updateMutation.mutateAsync({
          id: editingTerm.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setModalOpen(false);
    } catch {
      // Error is handled by mutation
    }
  };

  const handleConfirmDelete = async () => {
    if (termToDelete) {
      try {
        await deleteMutation.mutateAsync(termToDelete.id);
        setDeleteDialogOpen(false);
        setTermToDelete(null);
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
        title="Terms"
        subtitle="Manage school terms and academic periods"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Terms' },
        ]}
        actionLabel="Add Term"
        onAction={handleAdd}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load terms. Please try again.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={terms ?? []}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No terms configured. Click 'Add Term' to create one."
        searchPlaceholder="Search terms..."
      />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editingTerm ? 'Edit Term' : 'Add Term'}
        submitLabel={editingTerm ? 'Update' : 'Create'}
        loading={isFormLoading}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Term Name"
            placeholder="e.g., Term 1 2025"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Term"
        message={`Are you sure you want to delete "${termToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}

// ===========================================
// Locations Management Page
// ===========================================
// CRUD interface for managing school locations

import { useState } from 'react';
import { Box, TextField, Alert, Chip } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '../../hooks/useAdmin';
import { Location } from '../../api/admin.api';

// ===========================================
// COMPONENT
// ===========================================

export default function LocationsPage() {
  const { data: locations, isLoading, error } = useLocations();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  // Table columns
  const columns: Column<Location>[] = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 150,
    },
    {
      id: 'address',
      label: 'Address',
      minWidth: 200,
      format: (value) => (value as string) || '-',
    },
    {
      id: 'phone',
      label: 'Phone',
      minWidth: 120,
      format: (value) => (value as string) || '-',
    },
    {
      id: '_count.rooms',
      label: 'Rooms',
      minWidth: 80,
      align: 'center',
      format: (value) => (value as number) ?? 0,
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
    setEditingLocation(null);
    setFormData({ name: '', address: '', phone: '' });
    setModalOpen(true);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address || '',
      phone: location.phone || '',
    });
    setModalOpen(true);
  };

  const handleDelete = (location: Location) => {
    setLocationToDelete(location);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        name: formData.name,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
      };

      if (editingLocation) {
        await updateMutation.mutateAsync({
          id: editingLocation.id,
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
    if (locationToDelete) {
      try {
        await deleteMutation.mutateAsync(locationToDelete.id);
        setDeleteDialogOpen(false);
        setLocationToDelete(null);
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
        title="Locations"
        subtitle="Manage school locations and addresses"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Locations' },
        ]}
        actionLabel="Add Location"
        onAction={handleAdd}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load locations. Please try again.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={locations ?? []}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No locations configured. Click 'Add Location' to create one."
        searchPlaceholder="Search locations..."
      />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editingLocation ? 'Edit Location' : 'Add Location'}
        submitLabel={editingLocation ? 'Update' : 'Create'}
        loading={isFormLoading}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Location Name"
            placeholder="e.g., Main Campus"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Address"
            placeholder="123 Music Street, Sydney NSW 2000"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="Phone"
            placeholder="(02) 1234 5678"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            fullWidth
          />
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Location"
        message={`Are you sure you want to delete "${locationToDelete?.name}"? This will also delete all rooms at this location.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}

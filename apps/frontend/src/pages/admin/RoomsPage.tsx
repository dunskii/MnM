// ===========================================
// Rooms Management Page
// ===========================================
// CRUD interface for managing rooms within locations

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
  useRooms,
  useLocations,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
} from '../../hooks/useAdmin';
import { Room } from '../../api/admin.api';

// ===========================================
// COMPONENT
// ===========================================

export default function RoomsPage() {
  const { data: rooms, isLoading, error } = useRooms();
  const { data: locations } = useLocations();
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  const deleteMutation = useDeleteRoom();

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    locationId: '',
    name: '',
    capacity: '',
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // Table columns
  const columns: Column<Room>[] = [
    {
      id: 'name',
      label: 'Room Name',
      minWidth: 150,
    },
    {
      id: 'location.name',
      label: 'Location',
      minWidth: 150,
      format: (_, row) => row.location?.name ?? '-',
    },
    {
      id: 'capacity',
      label: 'Capacity',
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
    setEditingRoom(null);
    setFormData({ locationId: '', name: '', capacity: '' });
    setModalOpen(true);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      locationId: room.locationId,
      name: room.name,
      capacity: room.capacity.toString(),
    });
    setModalOpen(true);
  };

  const handleDelete = (room: Room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        locationId: formData.locationId,
        name: formData.name,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
      };

      if (editingRoom) {
        await updateMutation.mutateAsync({
          id: editingRoom.id,
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
    if (roomToDelete) {
      try {
        await deleteMutation.mutateAsync(roomToDelete.id);
        setDeleteDialogOpen(false);
        setRoomToDelete(null);
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
        title="Rooms"
        subtitle="Manage rooms within your locations"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Rooms' },
        ]}
        actionLabel="Add Room"
        onAction={handleAdd}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load rooms. Please try again.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={rooms ?? []}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No rooms configured. Click 'Add Room' to create one."
        searchPlaceholder="Search rooms..."
      />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editingRoom ? 'Edit Room' : 'Add Room'}
        submitLabel={editingRoom ? 'Update' : 'Create'}
        loading={isFormLoading}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl fullWidth required>
            <InputLabel>Location</InputLabel>
            <Select
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              label="Location"
            >
              {locations?.map((location: { id: string; name: string }) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Room Name"
            placeholder="e.g., Studio A"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label="Capacity"
            type="number"
            placeholder="e.g., 10"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            fullWidth
            inputProps={{ min: 1 }}
          />
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Room"
        message={`Are you sure you want to delete "${roomToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}

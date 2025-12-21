// ===========================================
// Families Management Page
// ===========================================
// CRUD interface for managing families

import { useState } from 'react';
import {
  Box,
  TextField,
  Alert,
  Chip,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  useFamilies,
  useFamily,
  useCreateFamily,
  useUpdateFamily,
  useDeleteFamily,
} from '../../hooks/useUsers';
import { Family } from '../../api/users.api';

// ===========================================
// COMPONENT
// ===========================================

export default function FamiliesPage() {
  const { data: families, isLoading, error } = useFamilies();
  const createMutation = useCreateFamily();
  const updateMutation = useUpdateFamily();
  const deleteMutation = useDeleteFamily();

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });

  // View state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingFamilyId, setViewingFamilyId] = useState<string | null>(null);
  const { data: viewingFamily } = useFamily(viewingFamilyId ?? '');

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [familyToDelete, setFamilyToDelete] = useState<Family | null>(null);

  // Table columns
  const columns: Column<Family>[] = [
    {
      id: 'name',
      label: 'Family Name',
      minWidth: 200,
    },
    {
      id: '_count.parents',
      label: 'Parents',
      minWidth: 100,
      align: 'center',
      format: (value) => (value as number) ?? 0,
    },
    {
      id: '_count.students',
      label: 'Students',
      minWidth: 100,
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
    setEditingFamily(null);
    setFormData({ name: '' });
    setModalOpen(true);
  };

  const handleEdit = (family: Family) => {
    setEditingFamily(family);
    setFormData({ name: family.name });
    setModalOpen(true);
  };

  const handleView = (family: Family) => {
    setViewingFamilyId(family.id);
    setViewModalOpen(true);
  };

  const handleDelete = (family: Family) => {
    setFamilyToDelete(family);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingFamily) {
        await updateMutation.mutateAsync({
          id: editingFamily.id,
          data: { name: formData.name },
        });
      } else {
        await createMutation.mutateAsync({ name: formData.name });
      }
      setModalOpen(false);
    } catch {
      // Error is handled by mutation
    }
  };

  const handleConfirmDelete = async () => {
    if (familyToDelete) {
      try {
        await deleteMutation.mutateAsync(familyToDelete.id);
        setDeleteDialogOpen(false);
        setFamilyToDelete(null);
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
        title="Families"
        subtitle="Manage family groups and their members"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Families' },
        ]}
        actionLabel="Add Family"
        onAction={handleAdd}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load families. Please try again.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={families ?? []}
        loading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No families found. Click 'Add Family' to create one."
        searchPlaceholder="Search families..."
      />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editingFamily ? 'Edit Family' : 'Add Family'}
        submitLabel={editingFamily ? 'Update' : 'Create'}
        loading={isFormLoading}
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Family Name"
            placeholder="e.g., Smith Family"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
        </Box>
      </FormModal>

      {/* View Modal */}
      <FormModal
        open={viewModalOpen}
        title={`${viewingFamily?.name ?? 'Family'} Details`}
        submitLabel="Close"
        onSubmit={() => setViewModalOpen(false)}
        onClose={() => setViewModalOpen(false)}
      >
        <Box sx={{ pt: 1 }}>
          {/* Parents */}
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Parents
          </Typography>
          {viewingFamily?.parents && viewingFamily.parents.length > 0 ? (
            <List dense disablePadding>
              {viewingFamily.parents.map((parent) => (
                <ListItem key={parent.id} disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${parent.user.firstName} ${parent.user.lastName}`}
                    secondary={parent.user.email}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No parents assigned
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Students */}
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Students
          </Typography>
          {viewingFamily?.students && viewingFamily.students.length > 0 ? (
            <List dense disablePadding>
              {viewingFamily.students.map((student) => (
                <ListItem key={student.id} disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <SchoolIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${student.firstName} ${student.lastName}`}
                    secondary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={student.ageGroup} size="small" />
                        {student.birthDate && (
                          <Typography variant="caption">
                            Born: {new Date(student.birthDate).toLocaleDateString()}
                          </Typography>
                        )}
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No students assigned
            </Typography>
          )}
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Deactivate Family"
        message={`Are you sure you want to deactivate "${familyToDelete?.name}"? This will not delete the family members.`}
        confirmLabel="Deactivate"
        confirmColor="error"
        loading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}

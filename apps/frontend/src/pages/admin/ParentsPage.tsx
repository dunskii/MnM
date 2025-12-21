// ===========================================
// Parents Management Page
// ===========================================
// CRUD interface for managing parents

import { useState } from 'react';
import {
  Box,
  TextField,
  Alert,
  Chip,
  Stack,
  Typography,
  Divider,
} from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import DataTable, { Column } from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  useParents,
  useCreateParent,
  useUpdateParent,
  useDeleteParent,
} from '../../hooks/useUsers';
import { Parent, Contact } from '../../api/users.api';

// ===========================================
// COMPONENT
// ===========================================

const emptyContact: Contact = {
  name: '',
  relationship: '',
  phone: '',
  email: '',
};

export default function ParentsPage() {
  const { data: parents, isLoading, error } = useParents();
  const createMutation = useCreateParent();
  const updateMutation = useUpdateParent();
  const deleteMutation = useDeleteParent();

  // Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    familyName: '',
    contact1: { ...emptyContact },
    contact2: { ...emptyContact },
    emergencyContact: { ...emptyContact },
  });

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);

  // Table columns
  const columns: Column<Parent>[] = [
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
      id: 'contact1.phone',
      label: 'Phone',
      minWidth: 120,
      format: (_, row) => row.contact1?.phone || row.user.phone || '-',
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
    setEditingParent(null);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      familyName: '',
      contact1: { ...emptyContact },
      contact2: { ...emptyContact },
      emergencyContact: { ...emptyContact },
    });
    setModalOpen(true);
  };

  const handleEdit = (parent: Parent) => {
    setEditingParent(parent);
    setFormData({
      email: parent.user.email,
      firstName: parent.user.firstName,
      lastName: parent.user.lastName,
      phone: parent.user.phone || '',
      familyName: parent.family?.name || '',
      contact1: parent.contact1 || { ...emptyContact },
      contact2: parent.contact2 || { ...emptyContact },
      emergencyContact: parent.emergencyContact || { ...emptyContact },
    });
    setModalOpen(true);
  };

  const handleDelete = (parent: Parent) => {
    setParentToDelete(parent);
    setDeleteDialogOpen(true);
  };

  const updateContact = (
    contactType: 'contact1' | 'contact2' | 'emergencyContact',
    field: keyof Contact,
    value: string
  ) => {
    setFormData({
      ...formData,
      [contactType]: {
        ...formData[contactType],
        [field]: value,
      },
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingParent) {
        await updateMutation.mutateAsync({
          id: editingParent.id,
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone || undefined,
            contact1: formData.contact1,
            contact2: formData.contact2.name ? formData.contact2 : null,
            emergencyContact: formData.emergencyContact,
          },
        });
      } else {
        await createMutation.mutateAsync({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          familyName: formData.familyName || undefined,
          contact1: formData.contact1,
          contact2: formData.contact2.name ? formData.contact2 : undefined,
          emergencyContact: formData.emergencyContact,
        });
      }
      setModalOpen(false);
    } catch {
      // Error is handled by mutation
    }
  };

  const handleConfirmDelete = async () => {
    if (parentToDelete) {
      try {
        await deleteMutation.mutateAsync(parentToDelete.id);
        setDeleteDialogOpen(false);
        setParentToDelete(null);
      } catch {
        // Error is handled by mutation
      }
    }
  };

  const isFormLoading = createMutation.isPending || updateMutation.isPending;
  const isDeleteLoading = deleteMutation.isPending;

  // Contact form section
  const ContactFields = ({
    label,
    contact,
    contactType,
    required = false,
  }: {
    label: string;
    contact: Contact;
    contactType: 'contact1' | 'contact2' | 'emergencyContact';
    required?: boolean;
  }) => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {label} {required && '*'}
      </Typography>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Name"
            size="small"
            value={contact.name}
            onChange={(e) => updateContact(contactType, 'name', e.target.value)}
            required={required}
            fullWidth
          />
          <TextField
            label="Relationship"
            size="small"
            placeholder="e.g., Mother, Father"
            value={contact.relationship}
            onChange={(e) => updateContact(contactType, 'relationship', e.target.value)}
            required={required}
            fullWidth
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Phone"
            size="small"
            value={contact.phone}
            onChange={(e) => updateContact(contactType, 'phone', e.target.value)}
            required={required}
            fullWidth
          />
          <TextField
            label="Email"
            size="small"
            type="email"
            value={contact.email || ''}
            onChange={(e) => updateContact(contactType, 'email', e.target.value)}
            fullWidth
          />
        </Stack>
      </Stack>
    </Box>
  );

  return (
    <Box>
      <PageHeader
        title="Parents"
        subtitle="Manage parent accounts and contact information"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Parents' },
        ]}
        actionLabel="Add Parent"
        onAction={handleAdd}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load parents. Please try again.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={parents ?? []}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No parents found. Click 'Add Parent' to create one."
        searchPlaceholder="Search parents..."
      />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        title={editingParent ? 'Edit Parent' : 'Add Parent'}
        submitLabel={editingParent ? 'Update' : 'Create'}
        loading={isFormLoading}
        maxWidth="md"
        onSubmit={handleSubmit}
        onClose={() => setModalOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {/* Account Info */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Account Information
            </Typography>
            <Stack spacing={2}>
              {!editingParent && (
                <TextField
                  label="Email"
                  type="email"
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
              {!editingParent && (
                <TextField
                  label="Family Name"
                  placeholder="e.g., Smith Family"
                  value={formData.familyName}
                  onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                  fullWidth
                  helperText="A family will be created if not provided"
                />
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Primary Contact */}
          <ContactFields
            label="Primary Contact"
            contact={formData.contact1}
            contactType="contact1"
            required
          />

          <Divider />

          {/* Secondary Contact */}
          <ContactFields
            label="Secondary Contact (Optional)"
            contact={formData.contact2}
            contactType="contact2"
          />

          <Divider />

          {/* Emergency Contact */}
          <ContactFields
            label="Emergency Contact"
            contact={formData.emergencyContact}
            contactType="emergencyContact"
            required
          />
        </Box>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Deactivate Parent"
        message={`Are you sure you want to deactivate ${parentToDelete?.user.firstName} ${parentToDelete?.user.lastName}? They will no longer be able to log in.`}
        confirmLabel="Deactivate"
        confirmColor="error"
        loading={isDeleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
}

// ===========================================
// Data Table Component
// ===========================================
// Reusable table component with sorting, filtering, and actions

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  IconButton,
  Tooltip,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Typography,
  Skeleton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

// ===========================================
// TYPES
// ===========================================

export interface Column<T> {
  id: keyof T | string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  format?: (value: unknown, row: T) => React.ReactNode;
}

export interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  emptyMessage?: string;
}

type Order = 'asc' | 'desc';

// ===========================================
// COMPONENT
// ===========================================

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search...',
  onEdit,
  onDelete,
  onView,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle sort
  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Get nested value from object
  const getNestedValue = (obj: T, path: string): unknown => {
    return path.split('.').reduce((acc: unknown, part) => {
      if (acc && typeof acc === 'object' && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const value = getNestedValue(row, col.id as string);
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Sort
    if (orderBy) {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, orderBy);
        const bValue = getNestedValue(b, orderBy);

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          comparison = aValue === bValue ? 0 : aValue ? -1 : 1;
        }

        return order === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, searchQuery, orderBy, order, columns]);

  // Check if there are actions
  const hasActions = onEdit || onDelete || onView;

  // Render loading skeleton
  if (loading) {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {searchable && (
          <Box sx={{ p: 2 }}>
            <Skeleton variant="rectangular" height={40} />
          </Box>
        )}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.id as string}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell>
                    <Skeleton variant="text" />
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.id as string}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell>
                      <Skeleton variant="rectangular" width={80} height={30} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Search Bar */}
      {searchable && (
        <Box sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
        </Box>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id as string}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id as string)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {hasActions && (
                <TableCell align="right" style={{ minWidth: 120 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {processedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography color="text.secondary">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((row) => (
                <TableRow hover key={row.id}>
                  {columns.map((column) => {
                    const value = getNestedValue(row, column.id as string);
                    return (
                      <TableCell key={column.id as string} align={column.align || 'left'}>
                        {column.format
                          ? column.format(value, row)
                          : typeof value === 'boolean'
                          ? value ? (
                              <Chip label="Active" size="small" color="success" />
                            ) : (
                              <Chip label="Inactive" size="small" color="default" />
                            )
                          : (value as React.ReactNode) ?? '-'}
                      </TableCell>
                    );
                  })}
                  {hasActions && (
                    <TableCell align="right">
                      {onView && (
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => onView(row)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onEdit && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => onEdit(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => onDelete(row)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

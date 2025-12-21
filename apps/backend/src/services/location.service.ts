// ===========================================
// Location & Room Service
// ===========================================
// Manages school locations and rooms

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Location, Room } from '@prisma/client';

// ===========================================
// TYPES
// ===========================================

export interface CreateLocationInput {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateLocationInput {
  name?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export interface CreateRoomInput {
  locationId: string;
  name: string;
  capacity?: number;
}

export interface UpdateRoomInput {
  name?: string;
  capacity?: number;
  isActive?: boolean;
}

export interface LocationWithRooms extends Location {
  rooms: Room[];
  _count?: {
    rooms: number;
  };
}

export interface RoomWithLocation extends Room {
  location: Location;
}

// ===========================================
// LOCATION FUNCTIONS
// ===========================================

/**
 * Get all locations for a school
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getLocations(schoolId: string): Promise<LocationWithRooms[]> {
  return prisma.location.findMany({
    where: { schoolId },
    include: {
      rooms: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
      _count: {
        select: { rooms: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get a single location by ID
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getLocation(
  schoolId: string,
  locationId: string
): Promise<LocationWithRooms | null> {
  return prisma.location.findFirst({
    where: {
      id: locationId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      rooms: {
        orderBy: { name: 'asc' },
      },
      _count: {
        select: { rooms: true },
      },
    },
  });
}

/**
 * Create a new location
 * SECURITY: schoolId is REQUIRED for multi-tenancy
 */
export async function createLocation(
  schoolId: string,
  data: CreateLocationInput
): Promise<Location> {
  const { name, address, phone } = data;

  // Check for duplicate name
  const existing = await prisma.location.findFirst({
    where: {
      schoolId,
      name,
    },
  });

  if (existing) {
    throw new AppError('A location with this name already exists.', 409);
  }

  return prisma.location.create({
    data: {
      schoolId,
      name,
      address,
      phone,
    },
  });
}

/**
 * Update a location
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function updateLocation(
  schoolId: string,
  locationId: string,
  data: UpdateLocationInput
): Promise<Location> {
  // First verify location belongs to school
  const existing = await prisma.location.findFirst({
    where: {
      id: locationId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!existing) {
    throw new AppError('Location not found.', 404);
  }

  // Check for duplicate name (if name is being updated)
  if (data.name && data.name !== existing.name) {
    const duplicateName = await prisma.location.findFirst({
      where: {
        schoolId,
        name: data.name,
        id: { not: locationId },
      },
    });

    if (duplicateName) {
      throw new AppError('A location with this name already exists.', 409);
    }
  }

  return prisma.location.update({
    where: { id: locationId },
    data: {
      name: data.name,
      address: data.address,
      phone: data.phone,
      isActive: data.isActive,
    },
  });
}

/**
 * Delete a location (soft delete by setting isActive = false, or hard delete if no rooms)
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function deleteLocation(
  schoolId: string,
  locationId: string
): Promise<void> {
  // First verify location belongs to school
  const existing = await prisma.location.findFirst({
    where: {
      id: locationId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
    include: {
      _count: {
        select: { rooms: true },
      },
    },
  });

  if (!existing) {
    throw new AppError('Location not found.', 404);
  }

  // If location has rooms, soft delete by deactivating
  if (existing._count.rooms > 0) {
    await prisma.location.update({
      where: { id: locationId },
      data: { isActive: false },
    });
  } else {
    // No rooms, safe to hard delete
    await prisma.location.delete({
      where: { id: locationId },
    });
  }
}

// ===========================================
// ROOM FUNCTIONS
// ===========================================

/**
 * Get all rooms for a school (optionally filtered by location)
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy
 */
export async function getRooms(
  schoolId: string,
  locationId?: string
): Promise<RoomWithLocation[]> {
  return prisma.room.findMany({
    where: {
      location: {
        schoolId, // CRITICAL: Multi-tenancy filter via relation
      },
      ...(locationId && { locationId }),
    },
    include: {
      location: true,
    },
    orderBy: [
      { location: { name: 'asc' } },
      { name: 'asc' },
    ],
  });
}

/**
 * Get a single room by ID
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy (via location)
 */
export async function getRoom(
  schoolId: string,
  roomId: string
): Promise<RoomWithLocation | null> {
  return prisma.room.findFirst({
    where: {
      id: roomId,
      location: {
        schoolId, // CRITICAL: Multi-tenancy filter via relation
      },
    },
    include: {
      location: true,
    },
  });
}

/**
 * Create a new room
 * SECURITY: Verifies locationId belongs to school
 */
export async function createRoom(
  schoolId: string,
  data: CreateRoomInput
): Promise<Room> {
  const { locationId, name, capacity } = data;

  // Verify location belongs to school
  const location = await prisma.location.findFirst({
    where: {
      id: locationId,
      schoolId, // CRITICAL: Multi-tenancy filter
    },
  });

  if (!location) {
    throw new AppError('Location not found.', 404);
  }

  // Check for duplicate name within location
  const existing = await prisma.room.findFirst({
    where: {
      locationId,
      name,
    },
  });

  if (existing) {
    throw new AppError('A room with this name already exists in this location.', 409);
  }

  return prisma.room.create({
    data: {
      locationId,
      name,
      capacity: capacity ?? 10,
    },
  });
}

/**
 * Update a room
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy (via location)
 */
export async function updateRoom(
  schoolId: string,
  roomId: string,
  data: UpdateRoomInput
): Promise<Room> {
  // First verify room belongs to school
  const existing = await prisma.room.findFirst({
    where: {
      id: roomId,
      location: {
        schoolId, // CRITICAL: Multi-tenancy filter via relation
      },
    },
    include: {
      location: true,
    },
  });

  if (!existing) {
    throw new AppError('Room not found.', 404);
  }

  // Check for duplicate name within location (if name is being updated)
  if (data.name && data.name !== existing.name) {
    const duplicateName = await prisma.room.findFirst({
      where: {
        locationId: existing.locationId,
        name: data.name,
        id: { not: roomId },
      },
    });

    if (duplicateName) {
      throw new AppError('A room with this name already exists in this location.', 409);
    }
  }

  return prisma.room.update({
    where: { id: roomId },
    data: {
      name: data.name,
      capacity: data.capacity,
      isActive: data.isActive,
    },
  });
}

/**
 * Delete a room
 * SECURITY: schoolId filter is REQUIRED for multi-tenancy (via location)
 */
export async function deleteRoom(
  schoolId: string,
  roomId: string
): Promise<void> {
  // First verify room belongs to school
  const existing = await prisma.room.findFirst({
    where: {
      id: roomId,
      location: {
        schoolId, // CRITICAL: Multi-tenancy filter via relation
      },
    },
    include: {
      _count: {
        select: { lessons: true },
      },
    },
  });

  if (!existing) {
    throw new AppError('Room not found.', 404);
  }

  // If room has lessons, soft delete by deactivating
  if (existing._count.lessons > 0) {
    await prisma.room.update({
      where: { id: roomId },
      data: { isActive: false },
    });
  } else {
    // No lessons, safe to hard delete
    await prisma.room.delete({
      where: { id: roomId },
    });
  }
}

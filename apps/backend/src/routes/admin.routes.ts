// ===========================================
// Admin Routes
// ===========================================
// Routes for school configuration (admin only)

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { adminOnly } from '../middleware/authorize';
import * as schoolService from '../services/school.service';
import * as termService from '../services/term.service';
import * as locationService from '../services/location.service';
import * as configService from '../services/config.service';
import {
  validateUpdateSchoolSettings,
  validateCreateTerm,
  validateUpdateTerm,
  validateCreateLocation,
  validateUpdateLocation,
  validateCreateRoom,
  validateUpdateRoom,
  validateCreateInstrument,
  validateUpdateInstrument,
  validateCreateLessonType,
  validateUpdateLessonType,
  validateCreateLessonDuration,
  validateUpdateLessonDuration,
  CreateTermInput,
  UpdateTermInput,
  CreateLocationInput,
  UpdateLocationInput,
  CreateRoomInput,
  UpdateRoomInput,
  CreateInstrumentInput,
  UpdateInstrumentInput,
  CreateLessonTypeInput,
  UpdateLessonTypeInput,
  CreateLessonDurationInput,
  UpdateLessonDurationInput,
} from '../validators/admin.validators';

const router = Router();

// All routes require authentication + admin role
router.use(authenticate);
router.use(adminOnly);

// ===========================================
// SCHOOL SETTINGS
// ===========================================

/**
 * GET /admin/school/settings
 * Get school settings
 */
router.get(
  '/school/settings',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await schoolService.getSchoolSettings(req.user!.schoolId);
      res.json({ status: 'success', data: settings });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /admin/school/settings
 * Update school settings
 */
router.patch(
  '/school/settings',
  validateUpdateSchoolSettings,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await schoolService.updateSchoolSettings(
        req.user!.schoolId,
        req.body
      );
      res.json({ status: 'success', data: settings });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// TERMS
// ===========================================

/**
 * GET /admin/terms
 * Get all terms
 */
router.get(
  '/terms',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const terms = await termService.getTerms(req.user!.schoolId);
      res.json({ status: 'success', data: terms });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/terms/:id
 * Get a single term
 */
router.get(
  '/terms/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const term = await termService.getTerm(req.user!.schoolId, req.params.id);
      if (!term) {
        res.status(404).json({ status: 'error', message: 'Term not found' });
        return;
      }
      res.json({ status: 'success', data: term });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/terms
 * Create a new term
 */
router.post(
  '/terms',
  validateCreateTerm,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const term = await termService.createTerm(
        req.user!.schoolId,
        req.body as CreateTermInput
      );
      res.status(201).json({ status: 'success', data: term });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /admin/terms/:id
 * Update a term
 */
router.patch(
  '/terms/:id',
  validateUpdateTerm,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const term = await termService.updateTerm(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateTermInput
      );
      res.json({ status: 'success', data: term });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /admin/terms/:id
 * Delete a term
 */
router.delete(
  '/terms/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await termService.deleteTerm(req.user!.schoolId, req.params.id);
      res.json({ status: 'success', message: 'Term deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// LOCATIONS
// ===========================================

/**
 * GET /admin/locations
 * Get all locations (with rooms)
 */
router.get(
  '/locations',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const locations = await locationService.getLocations(req.user!.schoolId);
      res.json({ status: 'success', data: locations });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/locations/:id
 * Get a single location
 */
router.get(
  '/locations/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const location = await locationService.getLocation(
        req.user!.schoolId,
        req.params.id
      );
      if (!location) {
        res.status(404).json({ status: 'error', message: 'Location not found' });
        return;
      }
      res.json({ status: 'success', data: location });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/locations
 * Create a new location
 */
router.post(
  '/locations',
  validateCreateLocation,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const location = await locationService.createLocation(
        req.user!.schoolId,
        req.body as CreateLocationInput
      );
      res.status(201).json({ status: 'success', data: location });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /admin/locations/:id
 * Update a location
 */
router.patch(
  '/locations/:id',
  validateUpdateLocation,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const location = await locationService.updateLocation(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateLocationInput
      );
      res.json({ status: 'success', data: location });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /admin/locations/:id
 * Delete a location
 */
router.delete(
  '/locations/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await locationService.deleteLocation(req.user!.schoolId, req.params.id);
      res.json({ status: 'success', message: 'Location deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// ROOMS
// ===========================================

/**
 * GET /admin/rooms
 * Get all rooms (optionally filtered by location)
 */
router.get(
  '/rooms',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const locationId = req.query.locationId as string | undefined;
      const rooms = await locationService.getRooms(req.user!.schoolId, locationId);
      res.json({ status: 'success', data: rooms });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/rooms/:id
 * Get a single room
 */
router.get(
  '/rooms/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const room = await locationService.getRoom(req.user!.schoolId, req.params.id);
      if (!room) {
        res.status(404).json({ status: 'error', message: 'Room not found' });
        return;
      }
      res.json({ status: 'success', data: room });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/rooms
 * Create a new room
 */
router.post(
  '/rooms',
  validateCreateRoom,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const room = await locationService.createRoom(
        req.user!.schoolId,
        req.body as CreateRoomInput
      );
      res.status(201).json({ status: 'success', data: room });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /admin/rooms/:id
 * Update a room
 */
router.patch(
  '/rooms/:id',
  validateUpdateRoom,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const room = await locationService.updateRoom(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateRoomInput
      );
      res.json({ status: 'success', data: room });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /admin/rooms/:id
 * Delete a room
 */
router.delete(
  '/rooms/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await locationService.deleteRoom(req.user!.schoolId, req.params.id);
      res.json({ status: 'success', message: 'Room deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// INSTRUMENTS
// ===========================================

/**
 * GET /admin/instruments
 * Get all instruments
 */
router.get(
  '/instruments',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const instruments = await configService.getInstruments(req.user!.schoolId);
      res.json({ status: 'success', data: instruments });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/instruments
 * Create a new instrument
 */
router.post(
  '/instruments',
  validateCreateInstrument,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const instrument = await configService.createInstrument(
        req.user!.schoolId,
        req.body as CreateInstrumentInput
      );
      res.status(201).json({ status: 'success', data: instrument });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /admin/instruments/:id
 * Update an instrument
 */
router.patch(
  '/instruments/:id',
  validateUpdateInstrument,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const instrument = await configService.updateInstrument(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateInstrumentInput
      );
      res.json({ status: 'success', data: instrument });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /admin/instruments/:id
 * Delete an instrument
 */
router.delete(
  '/instruments/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await configService.deleteInstrument(req.user!.schoolId, req.params.id);
      res.json({ status: 'success', message: 'Instrument deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// LESSON TYPES
// ===========================================

/**
 * GET /admin/lesson-types
 * Get all lesson types
 */
router.get(
  '/lesson-types',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lessonTypes = await configService.getLessonTypes(req.user!.schoolId);
      res.json({ status: 'success', data: lessonTypes });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/lesson-types
 * Create a new lesson type
 */
router.post(
  '/lesson-types',
  validateCreateLessonType,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lessonType = await configService.createLessonType(
        req.user!.schoolId,
        req.body as CreateLessonTypeInput
      );
      res.status(201).json({ status: 'success', data: lessonType });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /admin/lesson-types/:id
 * Update a lesson type
 */
router.patch(
  '/lesson-types/:id',
  validateUpdateLessonType,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lessonType = await configService.updateLessonType(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateLessonTypeInput
      );
      res.json({ status: 'success', data: lessonType });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /admin/lesson-types/:id
 * Delete a lesson type
 */
router.delete(
  '/lesson-types/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await configService.deleteLessonType(req.user!.schoolId, req.params.id);
      res.json({ status: 'success', message: 'Lesson type deleted' });
    } catch (error) {
      next(error);
    }
  }
);

// ===========================================
// LESSON DURATIONS
// ===========================================

/**
 * GET /admin/lesson-durations
 * Get all lesson durations
 */
router.get(
  '/lesson-durations',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const durations = await configService.getLessonDurations(req.user!.schoolId);
      res.json({ status: 'success', data: durations });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /admin/lesson-durations
 * Create a new lesson duration
 */
router.post(
  '/lesson-durations',
  validateCreateLessonDuration,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const duration = await configService.createLessonDuration(
        req.user!.schoolId,
        req.body as CreateLessonDurationInput
      );
      res.status(201).json({ status: 'success', data: duration });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /admin/lesson-durations/:id
 * Update a lesson duration
 */
router.patch(
  '/lesson-durations/:id',
  validateUpdateLessonDuration,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const duration = await configService.updateLessonDuration(
        req.user!.schoolId,
        req.params.id,
        req.body as UpdateLessonDurationInput
      );
      res.json({ status: 'success', data: duration });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /admin/lesson-durations/:id
 * Delete a lesson duration
 */
router.delete(
  '/lesson-durations/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await configService.deleteLessonDuration(req.user!.schoolId, req.params.id);
      res.json({ status: 'success', message: 'Lesson duration deleted' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

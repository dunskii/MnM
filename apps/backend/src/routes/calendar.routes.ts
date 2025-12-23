// ===========================================
// Calendar Routes
// ===========================================
// Routes for calendar event retrieval
// - Provides lesson events, hybrid placeholders, and individual bookings
// - Supports filtering by term, teacher, and date range

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { teacherOrAdmin, parentOrAbove } from '../middleware/authorize';
import { prisma } from '../config/database';
import * as hybridBookingService from '../services/hybridBooking.service';
import {
  validateCalendarEventsFilter,
  CalendarEventsFilter,
} from '../validators/hybridBooking.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===========================================
// CALENDAR ENDPOINTS
// ===========================================

/**
 * GET /calendar/events
 * Get calendar events for lessons and hybrid bookings (paginated)
 * Query: termId?, teacherId?, startDate?, endDate?, page?, limit?
 * Access: Admin, Teacher
 *
 * @returns { events: CalendarEvent[], pagination: { page, limit, total, totalPages, hasMore } }
 */
router.get(
  '/events',
  teacherOrAdmin,
  validateCalendarEventsFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as CalendarEventsFilter;
      const result = await hybridBookingService.getCalendarEvents(
        req.user!.schoolId,
        filters
      );
      res.json({
        status: 'success',
        data: result.events,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /calendar/my-events
 * Get calendar events for a parent's children
 * Query: startDate?, endDate?
 * Access: Parent
 */
router.get(
  '/my-events',
  parentOrAbove,
  validateCalendarEventsFilter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get parent and their children's lessons
      const parent = await prisma.parent.findFirst({
        where: { userId: req.user!.userId, schoolId: req.user!.schoolId },
        include: {
          family: {
            include: {
              students: {
                where: { schoolId: req.user!.schoolId },
                include: {
                  enrollments: {
                    where: { isActive: true },
                    include: {
                      lesson: {
                        include: {
                          lessonType: true,
                          hybridPattern: true,
                          term: true,
                          teacher: {
                            include: {
                              user: { select: { firstName: true, lastName: true } },
                            },
                          },
                          room: {
                            include: {
                              location: { select: { name: true } },
                            },
                          },
                          instrument: { select: { name: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!parent || !parent.family) {
        res.json({ status: 'success', data: [] });
        return;
      }

      const filters = req.query as unknown as CalendarEventsFilter;
      const startDate = filters.startDate || new Date();
      const endDate = filters.endDate || new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);

      const events: hybridBookingService.CalendarEvent[] = [];

      // Process each student's lessons
      for (const student of parent.family.students) {
        for (const enrollment of student.enrollments) {
          const lesson = enrollment.lesson;
          const teacherName = `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`;
          const roomName = lesson.room.name;
          const locationName = lesson.room.location.name;

          // Calculate weeks within the term that fall in our date range
          const termStart = new Date(lesson.term.startDate);
          const termEnd = new Date(lesson.term.endDate);

          // Iterate through each week of the term
          let currentDate = new Date(termStart);
          let weekNumber = 1;

          while (currentDate <= termEnd && currentDate <= endDate) {
            // Find the lesson day in this week
            const lessonDate = hybridBookingService.getDateForWeek(termStart, weekNumber, lesson.dayOfWeek);

            if (lessonDate >= startDate && lessonDate <= endDate && lessonDate >= termStart && lessonDate <= termEnd) {
              const [startHour, startMin] = lesson.startTime.split(':').map(Number);
              const [endHour, endMin] = lesson.endTime.split(':').map(Number);

              const eventStart = new Date(lessonDate);
              eventStart.setHours(startHour, startMin, 0, 0);

              const eventEnd = new Date(lessonDate);
              eventEnd.setHours(endHour, endMin, 0, 0);

              const lessonTypeName = lesson.lessonType.type;
              const isHybrid = lessonTypeName === 'HYBRID';

              if (isHybrid && lesson.hybridPattern) {
                const groupWeeks = lesson.hybridPattern.groupWeeks as number[];
                const individualWeeks = lesson.hybridPattern.individualWeeks as number[];

                if (groupWeeks.includes(weekNumber)) {
                  // Group week
                  events.push({
                    id: `${lesson.id}-week-${weekNumber}-${student.id}`,
                    title: `${lesson.name} (Group) - ${student.firstName}`,
                    start: eventStart,
                    end: eventEnd,
                    allDay: false,
                    resource: {
                      type: 'HYBRID_GROUP',
                      lessonId: lesson.id,
                      lessonName: lesson.name,
                      teacherName,
                      roomName,
                      locationName,
                      weekNumber,
                      studentName: `${student.firstName} ${student.lastName}`,
                    },
                  });
                } else if (individualWeeks.includes(weekNumber)) {
                  // Individual week - check if student has a booking
                  events.push({
                    id: `${lesson.id}-week-${weekNumber}-${student.id}-placeholder`,
                    title: `${lesson.name} (Book Individual Session) - ${student.firstName}`,
                    start: eventStart,
                    end: eventEnd,
                    allDay: false,
                    resource: {
                      type: 'HYBRID_PLACEHOLDER',
                      lessonId: lesson.id,
                      lessonName: lesson.name,
                      teacherName,
                      roomName,
                      locationName,
                      weekNumber,
                      bookingsOpen: lesson.hybridPattern.bookingsOpen,
                      studentName: `${student.firstName} ${student.lastName}`,
                    },
                  });
                }
              } else {
                // Regular lesson
                const eventType = lessonTypeName as 'INDIVIDUAL' | 'GROUP' | 'BAND';
                events.push({
                  id: `${lesson.id}-week-${weekNumber}-${student.id}`,
                  title: `${lesson.name} - ${student.firstName}`,
                  start: eventStart,
                  end: eventEnd,
                  allDay: false,
                  resource: {
                    type: eventType,
                    lessonId: lesson.id,
                    lessonName: lesson.name,
                    teacherName,
                    roomName,
                    locationName,
                    weekNumber,
                    studentName: `${student.firstName} ${student.lastName}`,
                  },
                });
              }
            }

            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7);
            weekNumber++;
          }
        }
      }

      // Get parent's hybrid bookings and add them
      const hybridBookings = await prisma.hybridBooking.findMany({
        where: {
          parentId: parent.id,
          lesson: { schoolId: req.user!.schoolId },
          status: { notIn: ['CANCELLED'] },
          scheduledDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          lesson: {
            include: {
              teacher: {
                include: {
                  user: { select: { firstName: true, lastName: true } },
                },
              },
              room: {
                include: {
                  location: { select: { name: true } },
                },
              },
            },
          },
          student: true,
        },
      });

      for (const booking of hybridBookings) {
        const [startHour, startMin] = booking.startTime.split(':').map(Number);
        const [endHour, endMin] = booking.endTime.split(':').map(Number);

        const eventStart = new Date(booking.scheduledDate);
        eventStart.setHours(startHour, startMin, 0, 0);

        const eventEnd = new Date(booking.scheduledDate);
        eventEnd.setHours(endHour, endMin, 0, 0);

        const teacherName = `${booking.lesson.teacher.user.firstName} ${booking.lesson.teacher.user.lastName}`;

        events.push({
          id: `booking-${booking.id}`,
          title: `${booking.lesson.name} - ${booking.student.firstName} (Booked)`,
          start: eventStart,
          end: eventEnd,
          allDay: false,
          resource: {
            type: 'HYBRID_INDIVIDUAL',
            lessonId: booking.lessonId,
            lessonName: booking.lesson.name,
            teacherName,
            roomName: booking.lesson.room.name,
            locationName: booking.lesson.room.location.name,
            isBooking: true,
            studentName: `${booking.student.firstName} ${booking.student.lastName}`,
            bookingId: booking.id,
            weekNumber: booking.weekNumber,
          },
        });
      }

      // Sort events by start time
      events.sort((a, b) => a.start.getTime() - b.start.getTime());

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 100;
      const total = events.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedEvents = events.slice(startIndex, endIndex);

      res.json({
        status: 'success',
        data: paginatedEvents,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

// ===========================================
// Invoice Service - Overdue Invoice Tests
// ===========================================
// Tests for multi-tenancy compliant overdue invoice handling (Issue 5)

// Create mock for Prisma client
const mockPrisma = {
  school: {
    findMany: jest.fn(),
  },
  invoice: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
};

// Mock the prisma client
jest.mock('../../../src/config/database', () => ({
  prisma: mockPrisma,
}));

describe('Invoice Service - Overdue Invoice Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('updateOverdueInvoicesForSchool', () => {
    it('should only update invoices for the specified school', async () => {
      const schoolId = 'school-123';
      const overdueInvoices = [
        { id: 'inv-1', invoiceNumber: 'INV-001' },
        { id: 'inv-2', invoiceNumber: 'INV-002' },
      ];

      mockPrisma.invoice.findMany.mockResolvedValue(overdueInvoices as any);
      mockPrisma.invoice.updateMany.mockResolvedValue({ count: 2 });

      const { updateOverdueInvoicesForSchool } = require('../../../src/services/invoice.service');
      const result = await updateOverdueInvoicesForSchool(schoolId);

      expect(result.count).toBe(2);
      expect(result.invoiceIds).toEqual(['inv-1', 'inv-2']);

      // Verify schoolId was included in the query
      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId,
          }),
        })
      );

      // Verify updateMany also includes schoolId (defense in depth)
      expect(mockPrisma.invoice.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId,
          }),
        })
      );
    });

    it('should return empty result when no overdue invoices', async () => {
      const schoolId = 'school-no-overdue';

      mockPrisma.invoice.findMany.mockResolvedValue([]);

      const { updateOverdueInvoicesForSchool } = require('../../../src/services/invoice.service');
      const result = await updateOverdueInvoicesForSchool(schoolId);

      expect(result.count).toBe(0);
      expect(result.invoiceIds).toEqual([]);
      expect(mockPrisma.invoice.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('updateAllOverdueInvoices', () => {
    it('should process each active school independently', async () => {
      const schools = [
        { id: 'school-1', name: 'School One' },
        { id: 'school-2', name: 'School Two' },
      ];

      mockPrisma.school.findMany.mockResolvedValue(schools as any);

      // Mock different results for each school
      mockPrisma.invoice.findMany
        .mockResolvedValueOnce([{ id: 'inv-1', invoiceNumber: 'INV-001' }] as any)
        .mockResolvedValueOnce([
          { id: 'inv-2', invoiceNumber: 'INV-002' },
          { id: 'inv-3', invoiceNumber: 'INV-003' },
        ] as any);

      mockPrisma.invoice.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 2 });

      const { updateAllOverdueInvoices } = require('../../../src/services/invoice.service');
      const result = await updateAllOverdueInvoices();

      expect(result.totalCount).toBe(3);
      expect(result.bySchool['School One']).toBe(1);
      expect(result.bySchool['School Two']).toBe(2);

      // Verify each school was processed separately
      expect(mockPrisma.invoice.findMany).toHaveBeenCalledTimes(2);
    });

    it('should continue processing other schools if one fails', async () => {
      const schools = [
        { id: 'school-1', name: 'School One' },
        { id: 'school-2', name: 'School Two' },
      ];

      mockPrisma.school.findMany.mockResolvedValue(schools as any);

      // First school throws error
      mockPrisma.invoice.findMany
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce([{ id: 'inv-1', invoiceNumber: 'INV-001' }] as any);

      mockPrisma.invoice.updateMany.mockResolvedValue({ count: 1 });

      const { updateAllOverdueInvoices } = require('../../../src/services/invoice.service');
      const result = await updateAllOverdueInvoices();

      // Should still process second school
      expect(result.totalCount).toBe(1);
      expect(result.bySchool['School Two']).toBe(1);
    });
  });

  describe('updateOverdueInvoices (deprecated)', () => {
    it('should call updateAllOverdueInvoices and return total count', async () => {
      const schools = [{ id: 'school-1', name: 'School One' }];

      mockPrisma.school.findMany.mockResolvedValue(schools as any);
      mockPrisma.invoice.findMany.mockResolvedValue([
        { id: 'inv-1', invoiceNumber: 'INV-001' },
      ] as any);
      mockPrisma.invoice.updateMany.mockResolvedValue({ count: 1 });

      // Spy on console.warn to verify deprecation warning
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { updateOverdueInvoices } = require('../../../src/services/invoice.service');
      const result = await updateOverdueInvoices();

      expect(result).toBe(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATED')
      );

      warnSpy.mockRestore();
    });
  });
});

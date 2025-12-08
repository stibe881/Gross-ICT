import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { invoices, customers } from '../drizzle/schema_accounting';
import { eq, and, gte, sql } from 'drizzle-orm';
import * as XLSX from 'xlsx';

/**
 * Export Router
 * Provides endpoints for exporting financial data to Excel/PDF
 */

// Staff procedure (admin, support, accounting)
const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'support' && ctx.user.role !== 'accounting') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Staff access required' });
  }
  return next({ ctx });
});

export const exportRouter = router({
  /**
   * Export cashflow data to Excel
   */
  exportCashflowExcel: staffProcedure
    .input(z.object({
      months: z.number().min(1).max(12).default(6),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - input.months);

      // Get paid invoices grouped by month
      const paidInvoices = await db
        .select({
          month: sql<string>`DATE_FORMAT(${invoices.paidDate}, '%Y-%m')`,
          totalIncome: sql<number>`SUM(${invoices.totalAmount})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.status, 'paid'),
            gte(invoices.paidDate, monthsAgo)
          )
        )
        .groupBy(sql`DATE_FORMAT(${invoices.paidDate}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${invoices.paidDate}, '%Y-%m')`);

      // Prepare data for Excel
      const excelData = paidInvoices.map(item => ({
        'Monat': item.month,
        'Einnahmen (CHF)': parseFloat(String(item.totalIncome)).toFixed(2),
        'Anzahl Rechnungen': item.count,
      }));

      // Calculate summary
      const totalIncome = paidInvoices.reduce((sum, item) => sum + parseFloat(String(item.totalIncome)), 0);
      const averageIncome = paidInvoices.length > 0 ? totalIncome / paidInvoices.length : 0;

      excelData.push({
        'Monat': '',
        'Einnahmen (CHF)': '' as any,
        'Anzahl Rechnungen': '' as any,
      });
      excelData.push({
        'Monat': 'Gesamt',
        'Einnahmen (CHF)': totalIncome.toFixed(2),
        'Anzahl Rechnungen': paidInvoices.reduce((sum, item) => sum + item.count, 0),
      });
      excelData.push({
        'Monat': 'Durchschnitt',
        'Einnahmen (CHF)': averageIncome.toFixed(2),
        'Anzahl Rechnungen': '' as any,
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Cashflow');

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return {
        data: buffer.toString('base64'),
        filename: `cashflow_${new Date().toISOString().split('T')[0]}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }),

  /**
   * Export revenue forecast to Excel
   */
  exportRevenueForecastExcel: staffProcedure
    .input(z.object({
      months: z.number().min(1).max(12).default(3),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Get historical data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const historicalData = await db
        .select({
          month: sql<string>`DATE_FORMAT(${invoices.paidDate}, '%Y-%m')`,
          revenue: sql<number>`SUM(${invoices.totalAmount})`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.status, 'paid'),
            gte(invoices.paidDate, sixMonthsAgo)
          )
        )
        .groupBy(sql`DATE_FORMAT(${invoices.paidDate}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${invoices.paidDate}, '%Y-%m')`);

      // Calculate average monthly revenue
      const avgRevenue = historicalData.length > 0
        ? historicalData.reduce((sum, item) => sum + parseFloat(String(item.revenue)), 0) / historicalData.length
        : 0;

      // Generate forecast
      const forecast = [];
      const today = new Date();
      
      for (let i = 0; i < input.months; i++) {
        const forecastDate = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);
        forecast.push({
          'Monat': forecastDate.toISOString().substring(0, 7),
          'Prognostizierter Umsatz (CHF)': avgRevenue.toFixed(2),
          'Basis': 'Durchschnitt letzte 6 Monate',
        });
      }

      // Create workbook with two sheets
      const wb = XLSX.utils.book_new();

      // Historical data sheet
      const historicalSheet = XLSX.utils.json_to_sheet(
        historicalData.map(item => ({
          'Monat': item.month,
          'Umsatz (CHF)': parseFloat(String(item.revenue)).toFixed(2),
        }))
      );
      historicalSheet['!cols'] = [{ wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, historicalSheet, 'Historische Daten');

      // Forecast sheet
      const forecastSheet = XLSX.utils.json_to_sheet(forecast);
      forecastSheet['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, forecastSheet, 'Prognose');

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return {
        data: buffer.toString('base64'),
        filename: `umsatzprognose_${new Date().toISOString().split('T')[0]}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }),

  /**
   * Export outstanding invoices to Excel
   */
  exportOutstandingInvoicesExcel: staffProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Get all unpaid invoices with customer details
      const unpaidInvoices = await db
        .select({
          invoiceNumber: invoices.invoiceNumber,
          customerName: customers.name,
          invoiceDate: invoices.invoiceDate,
          dueDate: invoices.dueDate,
          totalAmount: invoices.totalAmount,
          status: invoices.status,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(
          sql`${invoices.status} IN ('sent', 'overdue')`
        )
        .orderBy(invoices.dueDate);

      const today = new Date();

      // Prepare data for Excel
      const excelData = unpaidInvoices.map(invoice => {
        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          'Rechnungsnummer': invoice.invoiceNumber,
          'Kunde': invoice.customerName || 'Unbekannt',
          'Rechnungsdatum': new Date(invoice.invoiceDate).toLocaleDateString('de-CH'),
          'Fälligkeitsdatum': dueDate.toLocaleDateString('de-CH'),
          'Betrag (CHF)': parseFloat(invoice.totalAmount).toFixed(2),
          'Status': invoice.status === 'overdue' ? 'Überfällig' : 'Gesendet',
          'Tage überfällig': daysOverdue > 0 ? daysOverdue : 0,
        };
      });

      // Add summary
      const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
      const overdueCount = unpaidInvoices.filter(inv => new Date(inv.dueDate) < today).length;

      excelData.push({
        'Rechnungsnummer': '',
        'Kunde': '',
        'Rechnungsdatum': '',
        'Fälligkeitsdatum': '',
        'Betrag (CHF)': '' as any,
        'Status': '',
        'Tage überfällig': '' as any,
      });
      excelData.push({
        'Rechnungsnummer': 'Gesamt offen',
        'Kunde': '',
        'Rechnungsdatum': '',
        'Fälligkeitsdatum': '',
        'Betrag (CHF)': totalOutstanding.toFixed(2),
        'Status': `${unpaidInvoices.length} Rechnungen`,
        'Tage überfällig': `${overdueCount} überfällig` as any,
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 18 },
        { wch: 25 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
        { wch: 12 },
        { wch: 18 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Offene Rechnungen');

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return {
        data: buffer.toString('base64'),
        filename: `offene_rechnungen_${new Date().toISOString().split('T')[0]}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }),
});

import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, sendPaginated, getPagination } from '../utils/response';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from '../utils/date';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const [
      totalAnimals,
      healthyAnimals,
      sickAnimals,
      employees,
      visitorsToday,
      ticketsToday,
      todayRevenue,
      monthlyRevenue,
      foodItems,
      maintenanceCount,
      totalExpenses,
    ] = await Promise.all([
      prisma.animal.aggregate({ _sum: { quantity: true } }),
      prisma.animal.aggregate({ where: { healthStatus: 'HEALTHY' }, _sum: { quantity: true } }),
      prisma.animal.aggregate({
        where: { healthStatus: { in: ['SICK', 'CRITICAL', 'RECOVERING'] } },
        _sum: { quantity: true },
      }),
      prisma.employee.count({ where: { isActive: true } }),
      prisma.ticket.count({ where: { visitDate: { gte: todayStart, lte: todayEnd } } }),
      prisma.ticket.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
      prisma.payment.aggregate({
        where: { paymentDate: { gte: todayStart, lte: todayEnd }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { paymentDate: { gte: monthStart, lte: monthEnd }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.foodInventory.count(),
      prisma.maintenance.count({ where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);

    const lowStockResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::int as count FROM food_inventory WHERE quantity <= min_stock_level
    `;
    const lowStockCount = Number(lowStockResult[0]?.count ?? 0);

    sendSuccess(res, {
      totalAnimals: totalAnimals._sum.quantity || 0,
      healthyAnimals: healthyAnimals._sum.quantity || 0,
      sickAnimals: sickAnimals._sum.quantity || 0,
      employees,
      visitorsToday,
      ticketsSoldToday: ticketsToday,
      todayRevenue: todayRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      foodInventory: foodItems,
      lowStockFoods: lowStockCount,
      maintenanceCount,
      totalExpenses: totalExpenses._sum.amount || 0,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardCharts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const months = 6;
    const monthlyVisitors = [];
    const monthlyRevenue = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const label = date.toLocaleString('default', { month: 'short', year: '2-digit' });

      const [visitors, revenue] = await Promise.all([
        prisma.ticket.count({ where: { visitDate: { gte: start, lte: end } } }),
        prisma.payment.aggregate({
          where: { paymentDate: { gte: start, lte: end }, status: 'COMPLETED' },
          _sum: { amount: true },
        }),
      ]);

      monthlyVisitors.push({ month: label, visitors });
      monthlyRevenue.push({ month: label, revenue: revenue._sum.amount || 0 });
    }

    const animalCategories = await prisma.animal.groupBy({
      by: ['speciesId'],
      _sum: { quantity: true },
    });

    const speciesIds = animalCategories.map((a) => a.speciesId);
    const speciesList = await prisma.species.findMany({ where: { id: { in: speciesIds } } });
    const speciesMap = Object.fromEntries(speciesList.map((s) => [s.id, s.name]));

    const animalHealth = await prisma.animal.groupBy({
      by: ['healthStatus'],
      _sum: { quantity: true },
    });

    const foodConsumption = await prisma.feedingSchedule.groupBy({
      by: ['foodId'],
      _sum: { quantity: true },
      where: { isCompleted: true },
    });

    const foodIds = foodConsumption.map((f) => f.foodId);
    const foods = await prisma.foodInventory.findMany({ where: { id: { in: foodIds } } });
    const foodMap = Object.fromEntries(foods.map((f) => [f.id, f.name]));

    const ticketSales = await prisma.ticket.groupBy({
      by: ['ticketTypeId'],
      _count: { id: true },
    });

    const ticketTypeIds = ticketSales.map((t) => t.ticketTypeId);
    const ticketTypes = await prisma.ticketType.findMany({ where: { id: { in: ticketTypeIds } } });
    const ticketTypeMap = Object.fromEntries(ticketTypes.map((t) => [t.id, t.name]));

    sendSuccess(res, {
      monthlyVisitors,
      monthlyRevenue,
      animalCategories: animalCategories.map((a) => ({
        name: speciesMap[a.speciesId] || 'Unknown',
        count: a._sum.quantity || 0,
      })),
      animalHealth: animalHealth.map((h) => ({
        status: h.healthStatus,
        count: h._sum.quantity || 0,
      })),
      foodConsumption: foodConsumption.map((f) => ({
        name: foodMap[f.foodId] || 'Unknown',
        quantity: f._sum.quantity || 0,
      })),
      ticketSales: ticketSales.map((t) => ({
        name: ticketTypeMap[t.ticketTypeId] || 'Unknown',
        count: t._count.id,
      })),
    });
  } catch (error) {
    next(error);
  }
};

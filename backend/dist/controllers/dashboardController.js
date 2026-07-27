"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardCharts = exports.getDashboardStats = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const response_1 = require("../utils/response");
const date_1 = require("../utils/date");
const getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        const todayStart = (0, date_1.startOfDay)(today);
        const todayEnd = (0, date_1.endOfDay)(today);
        const monthStart = (0, date_1.startOfMonth)(today);
        const monthEnd = (0, date_1.endOfMonth)(today);
        const [totalAnimals, healthyAnimals, sickAnimals, employees, visitorsToday, ticketsToday, todayRevenue, monthlyRevenue, foodItems, maintenanceCount, totalExpenses,] = await Promise.all([
            prisma_1.default.animal.aggregate({ _sum: { quantity: true } }),
            prisma_1.default.animal.aggregate({ where: { healthStatus: 'HEALTHY' }, _sum: { quantity: true } }),
            prisma_1.default.animal.aggregate({
                where: { healthStatus: { in: ['SICK', 'CRITICAL', 'RECOVERING'] } },
                _sum: { quantity: true },
            }),
            prisma_1.default.employee.count({ where: { isActive: true } }),
            prisma_1.default.ticket.count({ where: { visitDate: { gte: todayStart, lte: todayEnd } } }),
            prisma_1.default.ticket.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
            prisma_1.default.payment.aggregate({
                where: { paymentDate: { gte: todayStart, lte: todayEnd }, status: 'COMPLETED' },
                _sum: { amount: true },
            }),
            prisma_1.default.payment.aggregate({
                where: { paymentDate: { gte: monthStart, lte: monthEnd }, status: 'COMPLETED' },
                _sum: { amount: true },
            }),
            prisma_1.default.foodInventory.count(),
            prisma_1.default.maintenance.count({ where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } } }),
            prisma_1.default.expense.aggregate({ _sum: { amount: true } }),
        ]);
        const lowStockResult = await prisma_1.default.$queryRaw `
      SELECT COUNT(*)::int as count FROM food_inventory WHERE quantity <= min_stock_level
    `;
        const lowStockCount = Number(lowStockResult[0]?.count ?? 0);
        (0, response_1.sendSuccess)(res, {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
const getDashboardCharts = async (req, res, next) => {
    try {
        const months = 6;
        const monthlyVisitors = [];
        const monthlyRevenue = [];
        const now = new Date();
        for (let i = months - 1; i >= 0; i--) {
            const date = (0, date_1.subMonths)(now, i);
            const start = (0, date_1.startOfMonth)(date);
            const end = (0, date_1.endOfMonth)(date);
            const label = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            const [visitors, revenue] = await Promise.all([
                prisma_1.default.ticket.count({ where: { visitDate: { gte: start, lte: end } } }),
                prisma_1.default.payment.aggregate({
                    where: { paymentDate: { gte: start, lte: end }, status: 'COMPLETED' },
                    _sum: { amount: true },
                }),
            ]);
            monthlyVisitors.push({ month: label, visitors });
            monthlyRevenue.push({ month: label, revenue: revenue._sum.amount || 0 });
        }
        const animalCategories = await prisma_1.default.animal.groupBy({
            by: ['speciesId'],
            _sum: { quantity: true },
        });
        const speciesIds = animalCategories.map((a) => a.speciesId);
        const speciesList = await prisma_1.default.species.findMany({ where: { id: { in: speciesIds } } });
        const speciesMap = Object.fromEntries(speciesList.map((s) => [s.id, s.name]));
        const animalHealth = await prisma_1.default.animal.groupBy({
            by: ['healthStatus'],
            _sum: { quantity: true },
        });
        const foodConsumption = await prisma_1.default.feedingSchedule.groupBy({
            by: ['foodId'],
            _sum: { quantity: true },
            where: { isCompleted: true },
        });
        const foodIds = foodConsumption.map((f) => f.foodId);
        const foods = await prisma_1.default.foodInventory.findMany({ where: { id: { in: foodIds } } });
        const foodMap = Object.fromEntries(foods.map((f) => [f.id, f.name]));
        const ticketSales = await prisma_1.default.ticket.groupBy({
            by: ['ticketTypeId'],
            _count: { id: true },
        });
        const ticketTypeIds = ticketSales.map((t) => t.ticketTypeId);
        const ticketTypes = await prisma_1.default.ticketType.findMany({ where: { id: { in: ticketTypeIds } } });
        const ticketTypeMap = Object.fromEntries(ticketTypes.map((t) => [t.id, t.name]));
        (0, response_1.sendSuccess)(res, {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardCharts = getDashboardCharts;
//# sourceMappingURL=dashboardController.js.map
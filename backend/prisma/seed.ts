import { PrismaClient, UserRole, HealthStatus, Gender, MaintenanceStatus, PaymentMethod, ExpenseCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding WARRAN-CADDE Zoo database...');

  const password = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@warrancadde.zoo' },
    update: {},
    create: {
      email: 'admin@warrancadde.zoo',
      password,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@warrancadde.zoo' },
    update: {},
    create: {
      email: 'manager@warrancadde.zoo',
      password,
      firstName: 'Ahmed',
      lastName: 'Hassan',
      role: UserRole.MANAGER,
    },
  });

  const vet = await prisma.user.upsert({
    where: { email: 'vet@warrancadde.zoo' },
    update: {},
    create: {
      email: 'vet@warrancadde.zoo',
      password,
      firstName: 'Dr. Fatima',
      lastName: 'Ali',
      role: UserRole.VETERINARIAN,
    },
  });

  const keeper = await prisma.user.upsert({
    where: { email: 'keeper@warrancadde.zoo' },
    update: {},
    create: {
      email: 'keeper@warrancadde.zoo',
      password,
      firstName: 'Omar',
      lastName: 'Mohamed',
      role: UserRole.KEEPER,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@warrancadde.zoo' },
    update: {},
    create: {
      email: 'cashier@warrancadde.zoo',
      password,
      firstName: 'Amina',
      lastName: 'Yusuf',
      role: UserRole.CASHIER,
    },
  });

  await prisma.zooSettings.findFirst().then(async (existing) => {
    if (!existing) {
      await prisma.zooSettings.create({
        data: {
          zooName: 'WARRAN-CADDE ZOO',
          address: 'Jijiga, Somali Region, Ethiopia',
          phone: '+251-911-000-000',
          email: 'info@warrancadde.zoo',
          openingTime: '08:00',
          closingTime: '18:00',
          description: 'Premier wildlife conservation and education center in the Somali Region.',
        },
      });
    }
  });

  const speciesData = [
    { name: 'African Lion', scientificName: 'Panthera leo', habitat: 'Savanna', conservationStatus: 'Vulnerable' },
    { name: 'Reticulated Giraffe', scientificName: 'Giraffa reticulata', habitat: 'Grassland', conservationStatus: 'Endangered' },
    { name: 'African Elephant', scientificName: 'Loxodonta africana', habitat: 'Savanna', conservationStatus: 'Endangered' },
    { name: 'Somali Ostrich', scientificName: 'Struthio molybdophanes', habitat: 'Semi-arid', conservationStatus: 'Vulnerable' },
    { name: 'Grant Zebra', scientificName: 'Equus quagga boehmi', habitat: 'Grassland', conservationStatus: 'Near Threatened' },
    { name: 'Spotted Hyena', scientificName: 'Crocuta crocuta', habitat: 'Savanna', conservationStatus: 'Least Concern' },
  ];

  const species = await Promise.all(
    speciesData.map((s) =>
      prisma.species.upsert({
        where: { name: s.name },
        update: {},
        create: s,
      })
    )
  );

  const enclosureData = [
    { name: 'Lion Den A', location: 'Zone 1 - North', capacity: 4, temperature: 28, maintenanceStatus: MaintenanceStatus.OPERATIONAL },
    { name: 'Giraffe Plains', location: 'Zone 2 - East', capacity: 6, temperature: 26, maintenanceStatus: MaintenanceStatus.OPERATIONAL },
    { name: 'Elephant Sanctuary', location: 'Zone 3 - West', capacity: 3, temperature: 27, maintenanceStatus: MaintenanceStatus.OPERATIONAL },
    { name: 'Aviary Complex', location: 'Zone 4 - South', capacity: 20, temperature: 24, maintenanceStatus: MaintenanceStatus.OPERATIONAL },
    { name: 'Zebra Range', location: 'Zone 2 - East', capacity: 8, temperature: 25, maintenanceStatus: MaintenanceStatus.OPERATIONAL },
    { name: 'Hyena Habitat', location: 'Zone 1 - North', capacity: 5, temperature: 26, maintenanceStatus: MaintenanceStatus.UNDER_MAINTENANCE },
  ];

  const enclosures = await Promise.all(
    enclosureData.map((e) =>
      prisma.enclosure.upsert({
        where: { name: e.name },
        update: {},
        create: e,
      })
    )
  );

  const animalsData = [
    { name: 'Simba', speciesId: species[0].id, enclosureId: enclosures[0].id, gender: Gender.MALE, healthStatus: HealthStatus.HEALTHY, weight: 190 },
    { name: 'Nala', speciesId: species[0].id, enclosureId: enclosures[0].id, gender: Gender.FEMALE, healthStatus: HealthStatus.HEALTHY, weight: 130 },
    { name: 'Jengo', speciesId: species[1].id, enclosureId: enclosures[1].id, gender: Gender.MALE, healthStatus: HealthStatus.HEALTHY, weight: 1200 },
    { name: 'Tembo', speciesId: species[2].id, enclosureId: enclosures[2].id, gender: Gender.MALE, healthStatus: HealthStatus.RECOVERING, weight: 4500 },
    { name: 'Zuri', speciesId: species[4].id, enclosureId: enclosures[4].id, gender: Gender.FEMALE, healthStatus: HealthStatus.HEALTHY, weight: 350 },
    { name: 'Kito', speciesId: species[3].id, enclosureId: enclosures[3].id, gender: Gender.MALE, healthStatus: HealthStatus.HEALTHY, weight: 120 },
    { name: 'Shujaa', speciesId: species[5].id, enclosureId: enclosures[5].id, gender: Gender.FEMALE, healthStatus: HealthStatus.SICK, weight: 65 },
  ];

  for (const animal of animalsData) {
    const existing = await prisma.animal.findFirst({ where: { name: animal.name } });
    if (!existing) {
      await prisma.animal.create({ data: animal });
    }
  }

  const employeesData = [
    { userId: manager.id, firstName: 'Ahmed', lastName: 'Hassan', email: 'manager@warrancadde.zoo', position: 'Zoo Manager', salary: 45000 },
    { userId: vet.id, firstName: 'Dr. Fatima', lastName: 'Ali', email: 'vet@warrancadde.zoo', position: 'Head Veterinarian', salary: 38000 },
    { userId: keeper.id, firstName: 'Omar', lastName: 'Mohamed', email: 'keeper@warrancadde.zoo', position: 'Senior Keeper', salary: 22000 },
    { userId: cashier.id, firstName: 'Amina', lastName: 'Yusuf', email: 'cashier@warrancadde.zoo', position: 'Ticket Cashier', salary: 18000 },
    { firstName: 'Hassan', lastName: 'Ibrahim', email: 'hassan@warrancadde.zoo', position: 'Groundskeeper', salary: 15000 },
  ];

  for (const emp of employeesData) {
    await prisma.employee.upsert({
      where: { email: emp.email },
      update: {},
      create: emp,
    });
  }

  const supplier = await prisma.supplier.upsert({
    where: { name: 'East Africa Feed Co.' },
    update: {},
    create: {
      name: 'East Africa Feed Co.',
      contactPerson: 'Mohamed Abdi',
      email: 'orders@eafeed.co',
      phone: '+251-922-111-222',
      address: 'Addis Ababa, Ethiopia',
    },
  });

  const foods = [
    { name: 'Raw Meat (Lion)', category: 'Carnivore', quantity: 500, unit: 'kg', minStockLevel: 100, supplierId: supplier.id },
    { name: 'Hay & Grass Mix', category: 'Herbivore', quantity: 2000, unit: 'kg', minStockLevel: 500, supplierId: supplier.id },
    { name: 'Elephant Feed Pellets', category: 'Herbivore', quantity: 800, unit: 'kg', minStockLevel: 200, supplierId: supplier.id },
    { name: 'Bird Seed Mix', category: 'Avian', quantity: 150, unit: 'kg', minStockLevel: 50, supplierId: supplier.id },
    { name: 'Fruit & Vegetable Mix', category: 'General', quantity: 80, unit: 'kg', minStockLevel: 100, supplierId: supplier.id },
  ];

  for (const food of foods) {
    await prisma.foodInventory.upsert({
      where: { name: food.name },
      update: {},
      create: food,
    });
  }

  const ticketTypes = [
    { name: 'Adult', description: 'Standard adult admission', price: 15, cardStyle: 'STANDARD' },
    { name: 'Child', description: 'Children under 12', price: 8, cardStyle: 'CHILD' },
    { name: 'Student', description: 'Valid student ID required', price: 10, cardStyle: 'STUDENT' },
    { name: 'Family Pack', description: '2 adults + 2 children', price: 40, cardStyle: 'FAMILY' },
    { name: 'VIP Tour', description: 'Guided premium tour', price: 75, cardStyle: 'VIP' },
  ];

  for (const tt of ticketTypes) {
    await prisma.ticketType.upsert({
      where: { name: tt.name },
      update: {},
      create: tt,
    });
  }

  const visitors = [
    { firstName: 'Yusuf', lastName: 'Ahmed', email: 'yusuf@email.com', phone: '+251-911-111-111' },
    { firstName: 'Halima', lastName: 'Omar', email: 'halima@email.com', phone: '+251-922-222-222' },
    { firstName: 'Abdi', lastName: 'Hassan', email: 'abdi@email.com', phone: '+251-933-333-333' },
  ];

  for (const v of visitors) {
    const existing = await prisma.visitor.findFirst({ where: { email: v.email } });
    if (!existing) await prisma.visitor.create({ data: v });
  }

  const animals = await prisma.animal.findMany();
  const employeeList = await prisma.employee.findMany();
  const foodList = await prisma.foodInventory.findMany();

  if (animals.length > 0 && employeeList.length > 0) {
    const existingAssignment = await prisma.animalAssignment.findFirst();
    if (!existingAssignment) {
      await prisma.animalAssignment.create({
        data: {
          animalId: animals[0].id,
          employeeId: employeeList[2].id,
          role: 'KEEPER',
        },
      });
    }
  }

  if (animals.length > 0) {
    const existingVet = await prisma.veterinaryRecord.findFirst();
    if (!existingVet) {
      await prisma.veterinaryRecord.create({
        data: {
          animalId: animals[3].id,
          veterinarianId: vet.id,
          diagnosis: 'Minor foot infection',
          treatment: 'Antibiotic course',
          medicine: 'Amoxicillin 500mg',
          nextVisit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  const expenses = [
    { category: ExpenseCategory.SALARY, description: 'Monthly staff salaries', amount: 125000 },
    { category: ExpenseCategory.FOOD, description: 'Animal feed procurement', amount: 15000 },
    { category: ExpenseCategory.UTILITIES, description: 'Electricity and water', amount: 8500 },
    { category: ExpenseCategory.MAINTENANCE, description: 'Enclosure repairs', amount: 12000 },
  ];

  for (const exp of expenses) {
    const existing = await prisma.expense.findFirst({ where: { description: exp.description } });
    if (!existing) {
      await prisma.expense.create({ data: { ...exp, recordedBy: admin.id } });
    }
  }

  console.log('Seed completed successfully!');
  console.log('Login credentials (all roles): password = Admin@123');
  console.log('  Admin:      admin@warrancadde.zoo');
  console.log('  Manager:    manager@warrancadde.zoo');
  console.log('  Vet:        vet@warrancadde.zoo');
  console.log('  Keeper:     keeper@warrancadde.zoo');
  console.log('  Cashier:    cashier@warrancadde.zoo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

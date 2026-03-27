import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { User } from './entities/user.entity';
import { Expense } from './entities/expense.entity';
import { Role } from './common/enums/role.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const expenseRepository = app.get<Repository<Expense>>(getRepositoryToken(Expense));

  const adminEmail = 'admin@neto.app';
  let admin = await userRepository.findOne({ where: { email: adminEmail } });

  if (!admin) {
    admin = userRepository.create({
      fullName: 'Admin NETO',
      email: adminEmail,
      role: Role.ADMIN,
      isActive: true,
    });
    await admin.setPassword('Admin1234');
    await userRepository.save(admin);
  }

  const advisorEmail = 'asesor@neto.app';
  let advisor = await userRepository.findOne({ where: { email: advisorEmail } });

  if (!advisor) {
    advisor = userRepository.create({
      fullName: 'Asesor NETO',
      email: advisorEmail,
      role: Role.ADVISOR,
      isActive: true,
    });
    await advisor.setPassword('Asesor1234');
    await userRepository.save(advisor);
  }

  const userEmail = 'usuario@neto.app';
  let normalUser = await userRepository.findOne({ where: { email: userEmail } });

  if (!normalUser) {
    normalUser = userRepository.create({
      fullName: 'Usuario Demo',
      email: userEmail,
      role: Role.USER,
      isActive: true,
    });
    await normalUser.setPassword('Usuario1234');
    await userRepository.save(normalUser);

    const demoExpenses = expenseRepository.create([
      {
        merchant: 'Supermercado Central',
        expenseDate: '2026-03-10',
        originalAmount: 45000,
        amountArs: 45000,
        currency: 'ARS',
        category: 'Supermercado',
        description: 'Compra semanal',
        source: 'manual',
        user: normalUser,
      },
      {
        merchant: 'App Transporte',
        expenseDate: '2026-03-15',
        originalAmount: 12000,
        amountArs: 12000,
        currency: 'ARS',
        category: 'Transporte',
        description: 'Viajes urbanos',
        source: 'manual',
        user: normalUser,
      },
    ]);

    await expenseRepository.save(demoExpenses);
  }

  await app.close();
  console.log('Seed completado');
}

seed();

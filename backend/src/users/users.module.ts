import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { Expense } from '../entities/expense.entity';
import { UserSegmentationService } from './user-segmentation.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Expense])],
  controllers: [UsersController],
  providers: [UsersService, UserSegmentationService],
  exports: [UsersService, UserSegmentationService],
})
export class UsersModule {}

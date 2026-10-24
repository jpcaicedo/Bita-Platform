import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkshopProfileEntity } from './entities/workshop-profile.entity';
import { WorkshopsController } from './workshops.controller';
import { WorkshopsService } from './workshops.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkshopProfileEntity])],
  controllers: [WorkshopsController],
  providers: [WorkshopsService],
  exports: [WorkshopsService],
})
export class WorkshopsModule {}

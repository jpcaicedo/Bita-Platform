import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompleteReminderDto } from './dto/complete-reminder.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { RemindersService } from './reminders.service';

const requestValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller()
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('vehicles/:vehicleId/reminders')
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body(requestValidationPipe) dto: CreateReminderDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    return this.remindersService.create(vehicleId, request.user, dto);
  }

}

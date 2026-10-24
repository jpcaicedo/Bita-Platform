import {
    Controller,
    UseGuards,
    ValidationPipe,
  } from '@nestjs/common';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { AuthorizationsService } from './authorizations.service';

  
  const requestValidationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  
  @Controller()
  @UseGuards(JwtAuthGuard)
  export class AuthorizationsController {
    constructor(private readonly authorizationsService: AuthorizationsService) {}
 
  }
  
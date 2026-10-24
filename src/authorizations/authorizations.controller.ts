import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,

    Post,
    Req,
    UseGuards,
    ValidationPipe,
  } from '@nestjs/common';
  import { AuthenticatedUser } from '../auth/authenticated-user.interface';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { AuthorizationsService } from './authorizations.service';
  import { CreateAuthorizationDto } from './dto/create-authorization.dto'
  
  const requestValidationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  
  @Controller()
  @UseGuards(JwtAuthGuard)
  export class AuthorizationsController {
    constructor(private readonly authorizationsService: AuthorizationsService) {}
  
    @Post('vehicles/:vehicleId/authorizations')
    grant(
      @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
      @Body(requestValidationPipe) dto: CreateAuthorizationDto,
      @Req() request: { user: AuthenticatedUser },
    ) {
      return this.authorizationsService.grant(vehicleId, request.user, dto);
    }
  
    @Get('vehicles/:vehicleId/authorizations')
    findByVehicle(
      @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
      @Req() request: { user: AuthenticatedUser },
    ) {
      return this.authorizationsService.findByVehicle(vehicleId, request.user.id);
    }
  
  }
  
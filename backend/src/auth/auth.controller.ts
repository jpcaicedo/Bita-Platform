import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthenticatedUser } from './authenticated-user.interface';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const requestValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body(requestValidationPipe) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(requestValidationPipe) dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard) //Aqui es donde le decimo que para acceder a este endpoint se necesita un token valido
  me(@Req() request: { user: AuthenticatedUser }) {
    return request.user;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @Req() request: { user: AuthenticatedUser },
    @Body(requestValidationPipe) dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(request.user.id, dto);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Req() request: { user: AuthenticatedUser },
    @Body(requestValidationPipe) dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(request.user.id, dto);
  }
}

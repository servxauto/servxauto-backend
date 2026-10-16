import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthUserService } from './auth-user.service';
import { AuthUserLoginDto } from './dto/auth-user-login.dto';
import { AuthUserSendOtpDto } from './dto/auth-user-send-otp.dto';

@Controller('auth/user')
export class AuthUserController {
  constructor(private readonly authUserService: AuthUserService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: AuthUserSendOtpDto) {
    return this.authUserService.sendOtp(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: AuthUserLoginDto) {
    return this.authUserService.login(dto);
  }
}

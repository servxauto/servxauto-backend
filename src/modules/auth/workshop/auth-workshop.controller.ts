import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthWorkshopService } from './auth-workshop.service';
import { AuthWorkshopLoginDto } from './dto/auth-workshop-login.dto';
import { AuthWorkshopSendOtpDto } from './dto/auth-workshop-send-otp.dto';

@Controller('auth/workshop')
export class AuthWorkshopController {
  constructor(private readonly authWorkshopService: AuthWorkshopService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: AuthWorkshopSendOtpDto) {
    return this.authWorkshopService.sendOtp(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: AuthWorkshopLoginDto) {
    return this.authWorkshopService.login(dto);
  }
}

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthWorkerService } from './auth-worker.service';
import { AuthWorkerLoginDto } from './dto/auth-worker-login.dto';
import { AuthWorkerSendOtpDto } from './dto/auth-worker-send-otp.dto';

@Controller('auth/worker')
export class AuthWorkerController {
  constructor(private readonly authWorkerService: AuthWorkerService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: AuthWorkerSendOtpDto) {
    return this.authWorkerService.sendOtp(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: AuthWorkerLoginDto) {
    return this.authWorkerService.login(dto);
  }
}

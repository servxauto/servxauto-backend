import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUserLoginDto } from './dto/auth-user-login.dto';
import { AuthUserSendOtpDto } from './dto/auth-user-send-otp.dto';
import {
  AppUnauthorizedException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { ErrorCode } from '@/common/constants/error-codes.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import { OtpService } from '@/internals/otp/otp.service';
import { UserAuthSession, UserSendOtpResult } from './types/auth-user.types';
import { User } from '@/modules/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
  ) {}

  async sendOtp(dto: AuthUserSendOtpDto): Promise<UserSendOtpResult> {
    if (dto.check_existance ?? true) {
      const user = await this.userRepo.findOne({
        where: { phone_no: dto.phone_no },
        select: { id: true },
      });
      if (!user) {
        throw new RecordNotFoundException(
          ErrorMessage.USER_NOT_FOUND,
          ErrorCode.USER_NOT_FOUND,
        );
      }
    }
    const otp = await this.otpService.sendPhoneOtp(dto.phone_no);
    return {
      phone_no: dto.phone_no,
      expires_at: otp.expires_at.toISOString(),
      resend_after_seconds: otp.resend_after_seconds,
    };
  }

  /** Registers the account on first login, i.e. the `check_existance: false` path. */
  async login(dto: AuthUserLoginDto): Promise<UserAuthSession> {
    const verified = await this.otpService.verifyPhoneOtp(
      dto.phone_no,
      dto.otp,
    );
    if (!verified) {
      throw new AppUnauthorizedException(
        ErrorMessage.OTP_INVALID,
        ErrorCode.OTP_INVALID,
      );
    }
    const existing = await this.userRepo.findOne({
      where: { phone_no: dto.phone_no },
    });
    const user =
      existing ??
      (await this.userRepo.save(
        this.userRepo.create({ phone_no: dto.phone_no }),
      ));
    const token = await this.jwtService.signAsync({ sub: user.id });
    return { user, is_new_user: !existing, token };
  }
}

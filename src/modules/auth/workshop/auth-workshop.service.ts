import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthWorkshopLoginDto } from './dto/auth-workshop-login.dto';
import { AuthWorkshopSendOtpDto } from './dto/auth-workshop-send-otp.dto';
import {
  AppUnauthorizedException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { ErrorCode } from '@/common/constants/error-codes.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import { OtpService } from '@/internals/otp/otp.service';
import { JwtService } from '@nestjs/jwt';
import {
  WorkshopAuthSession,
  WorkshopSendOtpResult,
} from './types/auth-workshop.types';
import { Workshop } from '@/modules/workshops/entities/workshop.entity';
import { WorkshopApplicationService } from '@/modules/workshops/services/workshop-application.service';

@Injectable()
export class AuthWorkshopService {
  constructor(
    @InjectRepository(Workshop)
    private readonly workshopRepo: Repository<Workshop>,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly applicationService: WorkshopApplicationService,
  ) {}

  async sendOtp(dto: AuthWorkshopSendOtpDto): Promise<WorkshopSendOtpResult> {
    if (dto.check_existance ?? true) {
      const workshop = await this.workshopRepo.findOne({
        where: { phone_no: dto.phone_no },
        select: { id: true },
      });
      if (!workshop) {
        throw new RecordNotFoundException(
          ErrorMessage.WORKSHOP_NOT_FOUND,
          ErrorCode.WORKSHOP_NOT_FOUND,
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
  async login(dto: AuthWorkshopLoginDto): Promise<WorkshopAuthSession> {
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
    const existing = await this.workshopRepo.findOne({
      where: { phone_no: dto.phone_no },
    });
    const workshop =
      existing ??
      (await this.workshopRepo.save(
        this.workshopRepo.create({ phone_no: dto.phone_no }),
      ));
    if (!existing) {
      await this.applicationService.create(workshop.id);
    }
    const token = await this.jwtService.signAsync({ sub: workshop.id });
    return { workshop, is_new_user: !existing, token };
  }
}

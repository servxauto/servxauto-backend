import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthWorkerLoginDto } from './dto/auth-worker-login.dto';
import { AuthWorkerSendOtpDto } from './dto/auth-worker-send-otp.dto';
import {
  AppUnauthorizedException,
  RecordNotFoundException,
} from '@/core/exceptions/app-http.exception';
import { ErrorCode } from '@/common/constants/error-codes.constant';
import { ErrorMessage } from '@/common/constants/error-messages.constant';
import { OtpService } from '@/internals/otp/otp.service';
import { JwtService } from '@nestjs/jwt';
import {
  WorkerAuthSession,
  WorkerSendOtpResult,
} from './types/auth-worker.types';
import { Worker } from '@/modules/workers/entities/worker.entity';

@Injectable()
export class AuthWorkerService {
  constructor(
    @InjectRepository(Worker)
    private readonly workerRepo: Repository<Worker>,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
  ) {}

  async sendOtp(dto: AuthWorkerSendOtpDto): Promise<WorkerSendOtpResult> {
    if (dto.check_existance ?? true) {
      const worker = await this.workerRepo.findOne({
        where: { phone_no: dto.phone_no },
        select: { id: true },
      });

      if (!worker) {
        throw new RecordNotFoundException(
          ErrorMessage.WORKER_NOT_FOUND,
          ErrorCode.WORKER_NOT_FOUND,
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
  async login(dto: AuthWorkerLoginDto): Promise<WorkerAuthSession> {
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
    const existing = await this.workerRepo.findOne({
      where: { phone_no: dto.phone_no },
    });
    const worker =
      existing ??
      (await this.workerRepo.save(
        this.workerRepo.create({ phone_no: dto.phone_no }),
      ));
    const token = await this.jwtService.signAsync({ sub: worker.id });
    return { worker, is_new_user: !existing, token };
  }
}

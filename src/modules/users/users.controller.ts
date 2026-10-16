import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ImageValidationPipe } from '@/core/pipes/image-validation.pipe';
import { UserAuthGuard } from '@/core/guards/user-auth.guard';
import type { User } from '@/modules/users/entities/user.entity';
import { UserUpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';
import type { UploadedFileData } from '@/core/types/uploaded-file.types';

@Controller('users')
@UseGuards(UserAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  findMe(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  updateMe(@CurrentUser() user: User, @Body() dto: UserUpdateMeDto) {
    return this.usersService.updateById(user.id, dto);
  }

  /** The profile only changes once the returned `id` is sent as `avatar_id` on `PATCH users/me`. */
  @Post('me/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile(new ImageValidationPipe()) avatar: UploadedFileData,
  ) {
    return this.usersService.uploadAvatar(user.id, avatar);
  }
}

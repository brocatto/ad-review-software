import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreativesService } from './creatives.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('creatives')
@UseGuards(JwtAuthGuard)
export class CreativesController {
  constructor(private creativesService: CreativesService) {}

  @Post('batch/:batchId')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  create(
    @Param('batchId') batchId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ) {
    return this.creativesService.create(batchId, files, req.user.id);
  }

  @Get('batch/:batchId')
  findByBatch(@Param('batchId') batchId: string) {
    return this.creativesService.findByBatch(batchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creativesService.findOne(id);
  }

  @Patch(':id/name')
  updateName(@Param('id') id: string, @Body('name') name: string) {
    return this.creativesService.updateName(id, name);
  }

  @Patch(':id/adjustment-status')
  updateAdjustmentStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('notes') notes: string | undefined,
    @Request() req: any,
  ) {
    return this.creativesService.updateAdjustmentStatus(id, status, notes, req.user.id);
  }

  @Post(':id/revision')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  uploadRevision(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }
    return this.creativesService.uploadRevision(id, file, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.creativesService.remove(id);
  }
}

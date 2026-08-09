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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const mediaFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Apenas imagens e vídeos são permitidos'), false);
  }
};

@Controller('creatives')
@UseGuards(JwtAuthGuard)
export class CreativesController {
  constructor(private creativesService: CreativesService) {}

  @Post('batch/:batchId')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: mediaFileFilter,
    }),
  )
  create(
    @Param('batchId') batchId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Pelo menos um arquivo é obrigatório');
    }
    return this.creativesService.create(batchId, files, req.user.id);
  }

  @Get('batch/:batchId')
  findByBatch(@Param('batchId') batchId: string, @Request() req: any) {
    return this.creativesService.findByBatch(batchId, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.creativesService.findOne(id, req.user.id);
  }

  @Patch(':id/name')
  updateName(@Param('id') id: string, @Body('name') name: string, @Request() req: any) {
    if (!name || !name.trim()) {
      throw new BadRequestException('Nome é obrigatório');
    }
    return this.creativesService.updateName(id, name.trim(), req.user.id);
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
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: mediaFileFilter,
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
  remove(@Param('id') id: string, @Request() req: any) {
    return this.creativesService.remove(id, req.user.id);
  }
}

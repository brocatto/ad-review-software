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
  ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { CreativesService } from './creatives.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/subscription.guard';
import { UpdateNameDto } from './dto/update-name.dto';
import { UpdateAdjustmentStatusDto } from './dto/update-adjustment-status.dto';

// Multer storage, size limit and media filter are configured in creatives.module.ts.
// Upload routes keep plain string ids on purpose: validation failures must reach the
// service so it can discard the temp files multer already wrote.
@Controller('creatives')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
export class CreativesController {
  constructor(private creativesService: CreativesService) {}

  @Post('batch/:batchId')
  @UseInterceptors(FilesInterceptor('files', 50))
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
  findByBatch(@Param('batchId', ParseUUIDPipe) batchId: string, @Request() req: any) {
    return this.creativesService.findByBatch(batchId, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.creativesService.findOne(id, req.user.id);
  }

  @Patch(':id/name')
  updateName(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNameDto,
    @Request() req: any,
  ) {
    return this.creativesService.updateName(id, dto.name, req.user.id);
  }

  @Patch(':id/adjustment-status')
  updateAdjustmentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdjustmentStatusDto,
    @Request() req: any,
  ) {
    return this.creativesService.updateAdjustmentStatus(id, dto.status, dto.notes, req.user.id);
  }

  @Post(':id/revision')
  @UseInterceptors(FileInterceptor('file'))
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
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.creativesService.remove(id, req.user.id);
  }
}

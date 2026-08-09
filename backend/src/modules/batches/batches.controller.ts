import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('batches')
@UseGuards(JwtAuthGuard)
export class BatchesController {
  constructor(private batchesService: BatchesService) {}

  @Post()
  create(@Body() createBatchDto: CreateBatchDto, @Request() req: any) {
    return this.batchesService.create(createBatchDto, req.user.id);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.batchesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.batchesService.findOne(id, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.batchesService.remove(id, req.user.id);
  }
}

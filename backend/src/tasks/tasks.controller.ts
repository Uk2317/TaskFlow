import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

type Authed = { user: { userId: string; email: string; name: string } };

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  findAll(@Req() req: Authed, @Query() query: QueryTasksDto) {
    return this.tasks.findAll(req.user.userId, query);
  }

  @Get('weather/:city')
  weather(@Param('city') city: string) {
    return this.tasks.getWeather(city);
  }

  @Get(':id')
  findOne(@Req() req: Authed, @Param('id') id: string) {
    return this.tasks.findOne(req.user.userId, id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } }),
  )
  create(
    @Req() req: Authed,
    @Body() dto: CreateTaskDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tasks.create(req.user, dto, file);
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } }),
  )
  update(
    @Req() req: Authed,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tasks.update(req.user, id, dto, file);
  }

  @Delete(':id')
  remove(@Req() req: Authed, @Param('id') id: string) {
    return this.tasks.remove(req.user.userId, id);
  }
}

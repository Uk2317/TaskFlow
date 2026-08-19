import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { EmailService } from '../email/email.service';
import { WeatherService } from '../weather/weather.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly email: EmailService,
    private readonly weather: WeatherService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async findAll(userId: string, query: QueryTasksDto) {
    const filter: Record<string, unknown> = { user: new Types.ObjectId(userId) };

    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { location: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.startDate || query.endDate) {
      const due: { $gte?: Date; $lte?: Date } = {};
      if (query.startDate) due.$gte = new Date(query.startDate);
      if (query.endDate) due.$lte = new Date(query.endDate);
      filter.dueDate = due;
    }

    const page = query.page || 1;
    const limit = query.limit || 9;
    const skip = (page - 1) * limit;
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      createdAt: { createdAt: 1 },
      '-createdAt': { createdAt: -1 },
      dueDate: { dueDate: 1 },
      '-dueDate': { dueDate: -1 },
      title: { title: 1 },
    };

    const [tasks, total, counts] = await Promise.all([
      this.taskModel
        .find(filter)
        .sort(sortMap[query.sort || '-createdAt'] || { createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.taskModel.countDocuments(filter),
      this.taskModel.aggregate([
        { $match: { user: new Types.ObjectId(userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const stats = { PENDING: 0, IN_PROGRESS: 0, DONE: 0, total: 0 };
    counts.forEach((row: { _id: string; count: number }) => {
      stats[row._id as keyof typeof stats] = row.count;
      stats.total += row.count;
    });

    const data = tasks.map((task) => ({
      ...task.toObject(),
      weather: this.weather.cached(task.location),
    }));
    void Promise.all(tasks.filter((t) => t.location).map((t) => this.weather.getByCity(t.location)));

    return {
      data,
      meta: { total, page, limit, lastPage: Math.max(1, Math.ceil(total / limit)) },
      stats,
    };
  }

  private ownedBy(userId: string) {
    const oid = new Types.ObjectId(userId);
    return { $or: [{ user: oid }, { user: userId }] };
  }

  async findOne(userId: string, id: string) {
    const task = await this.taskModel.findOne({ _id: id, ...this.ownedBy(userId) });
    if (!task) throw new NotFoundException('Task not found');
    const weather = await this.weather.getByCity(task.location);
    return { ...task.toObject(), weather };
  }

  async create(
    user: { userId: string; email: string; name: string },
    dto: CreateTaskDto,
    file?: Express.Multer.File,
  ) {
    const upload = await this.cloudinary.upload(file);
    const task = await this.taskModel.create({
      user: new Types.ObjectId(user.userId),
      title: dto.title.trim(),
      description: dto.description || '',
      status: dto.status || TaskStatus.PENDING,
      priority: dto.priority,
      dueDate: dto.dueDate,
      location: dto.location || '',
      fileUrl: upload.fileUrl,
      fileName: upload.fileName,
    });

    void this.email.sendTaskCreated(user.email, user.name, task);
    const weather = await this.weather.getByCity(task.location);
    return { ...task.toObject(), weather };
  }

  async update(
    user: { userId: string; email: string; name: string },
    id: string,
    dto: UpdateTaskDto,
    file?: Express.Multer.File,
  ) {
    const task = await this.taskModel.findOne({ _id: id, ...this.ownedBy(user.userId) });
    if (!task) throw new NotFoundException('Task not found');

    const previous = task.status;
    Object.assign(task, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate } : {}),
      ...(dto.location !== undefined ? { location: dto.location } : {}),
    });

    if (file) {
      const upload = await this.cloudinary.upload(file);
      task.fileUrl = upload.fileUrl;
      task.fileName = upload.fileName;
    }

    await task.save();
    if (previous !== TaskStatus.DONE && task.status === TaskStatus.DONE) {
      void this.email.sendTaskCompleted(user.email, user.name, task.title);
    }

    const weather = await this.weather.getByCity(task.location);
    return { ...task.toObject(), weather };
  }

  async remove(userId: string, id: string) {
    const task = await this.taskModel.findOneAndDelete({ _id: id, ...this.ownedBy(userId) });
    if (!task) throw new NotFoundException('Task not found');
    return { message: 'Task deleted', id: task.id };
  }

  getWeather(city: string) {
    return this.weather.getByCity(city);
  }
}

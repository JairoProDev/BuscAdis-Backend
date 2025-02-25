import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationResponseDto,
  NotificationPreferencesDto,
} from './dto/notification.dto';
import { AuthenticatedRequest } from '../../common/types/request.type';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of notifications',
    type: [NotificationResponseDto],
  })
  async findAll(@Request() req: AuthenticatedRequest): Promise<NotificationResponseDto[]> {
    return this.notificationsService.findAll(req.user);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of unread notifications',
    type: [NotificationResponseDto],
  })
  async findUnread(@Request() req: AuthenticatedRequest): Promise<NotificationResponseDto[]> {
    return this.notificationsService.findUnread(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by id' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the notification',
    type: NotificationResponseDto,
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'The notification has been successfully updated.',
    type: NotificationResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsService.update(
      id,
      updateNotificationDto,
      req.user,
    );
    return this.notificationsService['mapToResponseDto'](notification);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'The notification has been marked as read.',
    type: NotificationResponseDto,
  })
  async markAsRead(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(id, req.user);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications have been marked as read.',
  })
  async markAllAsRead(@Request() req: AuthenticatedRequest): Promise<void> {
    await this.notificationsService.markAllAsRead(req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'The notification has been successfully deleted.',
  })
  async remove(
    @Param('id') id: string, 
    @Request() req: AuthenticatedRequest
  ): Promise<void> {
    await this.notificationsService.remove(id, req.user);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all notifications' })
  @ApiResponse({
    status: 200,
    description: 'All notifications have been successfully deleted.',
  })
  async removeAll(@Request() req: AuthenticatedRequest): Promise<void> {
    await this.notificationsService.removeAll(req.user);
  }
} 
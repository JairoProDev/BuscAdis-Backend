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
import { MessagesService } from './messages.service';
import {
  CreateMessageDto,
  UpdateMessageDto,
  MessageResponseDto,
} from './dto/message.dto';
import { AuthenticatedRequest } from '../../common/types/request.type';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new message' })
  @ApiResponse({
    status: 201,
    description: 'The message has been successfully created.',
    type: MessageResponseDto,
  })
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<MessageResponseDto> {
    const message = await this.messagesService.create(createMessageDto, req.user, createMessageDto.publicationId);
    return this.messagesService.mapToResponseDto(message);
  }

  @Get()
  @ApiOperation({ summary: 'Get all messages' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of messages',
    type: [MessageResponseDto],
  })
  async findAll(@Request() req: AuthenticatedRequest): Promise<MessageResponseDto[]> {
    const messages = await this.messagesService.findAll(req.user);
    return Promise.all(messages.map(message => this.messagesService.mapToResponseDto(message)));
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of conversations',
    type: [MessageResponseDto],
  })
  async getConversations(
    @Request() req: AuthenticatedRequest,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.messagesService.getConversations(req.user);
    return Promise.all(messages.map(message => this.messagesService.mapToResponseDto(message)));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a message by id' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the message',
    type: MessageResponseDto,
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<MessageResponseDto> {
    const message = await this.messagesService.findOne(id, req.user);
    return this.messagesService.mapToResponseDto(message);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({
    status: 200,
    description: 'The message has been successfully updated.',
    type: MessageResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<MessageResponseDto> {
    const message = await this.messagesService.update(id, updateMessageDto, req.user);
    return this.messagesService.mapToResponseDto(message);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({
    status: 200,
    description: 'The message has been successfully deleted.',
  })
  async remove(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.messagesService.remove(id, req.user);
  }
} 
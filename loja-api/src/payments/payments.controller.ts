import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:id/payments')
  async create(
    @Req() req,
    @Param('id') orderId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    return await this.paymentsService.create(userId, +orderId, createPaymentDto, userRole);
  }

  @Get('payments')
  async findAll(
    @Req() req,
    @Query('status') status?: string,
    @Query('orderId') orderId?: string,
  ) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    return await this.paymentsService.findAll(
      userId,
      userRole,
      status,
      orderId ? +orderId : undefined,
    );
  }

  @Patch('payments/:id/status')
  async updateStatus(
    @Req() req,
    @Param('id') paymentId: string,
    @Body('status') status: 'PAID' | 'CANCELLED',
  ) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    return await this.paymentsService.updateStatus(+paymentId, status, userId, userRole);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete('payments/:id')
  async remove(@Param('id') paymentId: string) {
    return await this.paymentsService.remove(+paymentId);
  }
}
import {
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@ApiTags('orders')
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Post()
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Criar pedido para o usuário autenticado' })
	@ApiResponse({ status: 201, description: 'Pedido criado' })
	@ApiResponse({ status: 401, description: 'Sem token' })
	@ApiResponse({ status: 404, description: 'Produto do pedido não encontrado' })
	@UseGuards(JwtAuthGuard)
	create(
		@Req() req: { user: { userId: number } },
		@Body() dto: CreateOrderDto,
	) {
		return this.ordersService.create(dto, req.user.userId);
	}

	@Get()
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Listar pedidos do usuário (ou todos para ADMIN/MANAGER)' })
	@ApiResponse({ status: 200, description: 'Lista de pedidos' })
	@ApiResponse({ status: 401, description: 'Sem token' })
	@UseGuards(JwtAuthGuard)
	findAll(@Req() req: { user: { userId: number; role: string } }) {
		return this.ordersService.findAllForActor(req.user.userId, req.user.role);
	}

	@Get(':id')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Buscar pedido por ID (dono, ADMIN ou MANAGER)' })
	@ApiResponse({ status: 200, description: 'Pedido encontrado' })
	@ApiResponse({ status: 401, description: 'Sem token' })
	@ApiResponse({ status: 404, description: 'Pedido não encontrado' })
	@UseGuards(JwtAuthGuard)
	findOne(
		@Req() req: { user: { userId: number; role: string } },
		@Param('id', ParseIntPipe) id: number,
	) {
		return this.ordersService.findOneForActor(id, req.user.userId, req.user.role);
	}

	@Post(':id/cancel')
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Cancelar pedido (dono ou ADMIN)' })
	@ApiResponse({ status: 201, description: 'Pedido cancelado' })
	@ApiResponse({ status: 401, description: 'Sem token' })
	@ApiResponse({ status: 404, description: 'Pedido não encontrado' })
	@UseGuards(JwtAuthGuard)
	cancel(
		@Req() req: { user: { userId: number; role: string } },
		@Param('id', ParseIntPipe) id: number,
	) {
		return this.ordersService.cancelForActor(id, req.user.userId, req.user.role);
	}
}

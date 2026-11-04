import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Ajuste o caminho do seu guard se necessário

@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  async create(@Req() req, @Body() createAddressDto: CreateAddressDto) {
    const userId = req.user.userId; // Ou req.user.id dependendo de como sua estratégia JWT injeta o usuário
    return await this.addressesService.create(userId, createAddressDto);
  }

  @Get()
  async findAll(@Req() req) {
    const userId = req.user.userId;
    return await this.addressesService.findAllByModel(userId);
  }

  @Delete(':id')
  async remove(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return await this.addressesService.remove(+id, userId);
  }
}
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(userId: number, createAddressDto: CreateAddressDto): Promise<Address> {
    const address = this.addressRepository.create({
      ...createAddressDto,
      userId,
    });
    return await this.addressRepository.save(address);
  }

  async findAllByModel(userId: number): Promise<Address[]> {
    return await this.addressRepository.find({ where: { userId } });
  }

  async remove(id: number, userId: number): Promise<void> {
    const address = await this.addressRepository.findOne({ where: { id } });
    if (!address) {
      throw new NotFoundException('Endereço não encontrado.');
    }
    if (address.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para remover este endereço.');
    }
    await this.addressRepository.remove(address);
  }
}
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, email: string, password: string) {
    const exists = await this.usersRepository.findOne({
      where: [{ username }, { email }],
    });
    if (exists) {
      throw new ConflictException('username ou email já cadastrado');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      username,
      email,
      password: hashed,
      role: 'CLIENT',
    });
    const saved = await this.usersRepository.save(user);
    const { password: _, ...safe } = saved;
    return safe; // sem password na resposta
  }

  async login(username: string, password: string) {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('credenciais inválidas');
    }
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
import {
  Body,
  Controller,
  Get,
  HttpCode,
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
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastrar usuário' })
  @ApiResponse({ status: 201, description: 'Usuário cadastrado' })
  @ApiResponse({ status: 409, description: 'Usuário ou email já cadastrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.username, dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autenticar usuário' })
  @ApiResponse({ status: 200, description: 'Token de acesso gerado' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retornar dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do usuário autenticado' })
  @ApiResponse({ status: 401, description: 'Sem token ou token inválido' })
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: { userId: number; username: string; role: string } }) {
    return req.user;
  }
}

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
  ApiBody,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiValidationErrorResponse } from '../common/swagger/api-validation-error-response.decorator';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastrar usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário cadastrado (sem senha na resposta)',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        username: { type: 'string', example: 'ana' },
        email: { type: 'string', example: 'ana@loja.test' },
        role: { type: 'string', example: 'CLIENT' },
      },
    },
  })
  @ApiValidationErrorResponse('email deve ser válido')
  @ApiResponse({ status: 409, description: 'Usuário ou email já cadastrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.username, dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autenticar usuário' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Token de acesso gerado',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOi...' },
      },
    },
  })
  @ApiValidationErrorResponse('password deve ter pelo menos 6 caracteres')
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retornar dados do usuário autenticado' })
  @ApiOkResponse({
    description: 'Dados do usuário autenticado',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1 },
        username: { type: 'string', example: 'ana' },
        role: { type: 'string', enum: ['CLIENT', 'ADMIN', 'MANAGER'] },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Sem token ou token inválido' })
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: { userId: number; username: string; role: string } }) {
    return req.user;
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  healthCheck() {
    return { status: 'UP' };
  }

  @Get('version')
  getVersion() {
    return {
      name: 'loja-api',
      version: '1.0.0',
    };
  }

  @Get('demo/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  demoAdmin() {
    return { ok: true, area: 'admin' };
  }

  @Get('demo/client')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT')
  demoClient() {
    return { ok: true, area: 'client' };
  }
}
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm'
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ProductsModule,
  ConfigModule.forRoot({ isGlobal: true}),
  TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      type: 'postgres',
      host: config.get('DB_HOST'),
      port: Number(config.get('DB_PORT', '5432')),
      username: config.get('DB_USERNAME'),
      password: config.get('DB_PASSWORD'),
      database: config.get('DB_DATABASE'),
      autoLoadEntities: true,
      synchronize: true, // cuidado com isso em produção
    })
  }),
  OrdersModule,
  AuthModule,
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return the app health status', () => {
      expect(appController.healthCheck()).toEqual({ status: 'UP' });
    });
  });

  describe('version', () => {
    it('should return application version info', () => {
      expect(appController.getVersion()).toEqual({
        name: 'loja-api',
        version: '1.0.0',
      });
    });
  });
});

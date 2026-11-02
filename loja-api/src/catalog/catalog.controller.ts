import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';

@Controller('catalog')
@ApiTags('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Consultar totais do catálogo' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        totalProducts: { type: 'number', example: 2 },
        totalStockUnits: { type: 'number', example: 35 },
      },
    },
  })
  getSummary() {
    return this.catalogService.getSummary();
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiValidationErrorResponse } from '../common/swagger/api-validation-error-response.decorator';
import { Product } from '../products/product.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './category.entity';

@Controller('categories')
@ApiTags('categories')
@ApiExtraModels(Category, Product)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias' })
  @ApiOkResponse({
    schema: { type: 'array', items: { $ref: getSchemaPath(Category) } },
  })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Listar produtos da categoria' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiValidationErrorResponse('Validation failed (numeric string is expected)')
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @ApiOkResponse({
    schema: { type: 'array', items: { $ref: getSchemaPath(Product) } },
  })
  findProducts(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findProducts(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiValidationErrorResponse('Validation failed (numeric string is expected)')
  @ApiOkResponse({ schema: { $ref: getSchemaPath(Category) } })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar categoria (ADMIN)' })
  @ApiValidationErrorResponse('name deve ter pelo menos 2 caracteres')
  @ApiResponse({ status: 401, description: 'Sem token ou token inválido' })
  @ApiResponse({ status: 403, description: 'Papel insuficiente' })
  @ApiResponse({ status: 409, description: 'Nome de categoria já cadastrado' })
  @ApiResponse({
    status: 201,
    description: 'Categoria criada',
    schema: { $ref: getSchemaPath(Category) },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Put(':id')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar categoria (ADMIN); PUT/PATCH' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiValidationErrorResponse('name deve ter pelo menos 2 caracteres')
  @ApiResponse({ status: 401, description: 'Sem token ou token inválido' })
  @ApiResponse({ status: 403, description: 'Papel insuficiente' })
  @ApiResponse({ status: 409, description: 'Nome de categoria já cadastrado' })
  @ApiOkResponse({ schema: { $ref: getSchemaPath(Category) } })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover categoria (ADMIN)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiValidationErrorResponse('Validation failed (numeric string is expected)')
  @ApiResponse({ status: 401, description: 'Sem token ou token inválido' })
  @ApiResponse({ status: 403, description: 'Papel insuficiente' })
  @ApiResponse({ status: 204, description: 'Categoria removida' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}

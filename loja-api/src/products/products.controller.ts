import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream, existsSync, unlinkSync } from 'fs';
import { basename, extname, join } from 'path';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiValidationErrorResponse } from '../common/swagger/api-validation-error-response.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { PatchProductDto } from './dto/patch-product.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import {
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@ApiTags('products')
@ApiExtraModels(Product)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiValidationErrorResponse('minPrice não pode ser negativo')
  @ApiResponse({ status: 200, description: 'Lista de produtos' })
  @ApiOkResponse({
    schema: { type: 'array', items: { $ref: getSchemaPath(Product) } },
  })
  findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Post(':id/image')
  @HttpCode(200)
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiValidationErrorResponse('envie o campo file (jpeg/png/webp)')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const safeBase = basename(file.originalname).replace(/\s+/g, '_');
          const extension = extname(safeBase) || '.bin';
          callback(
            null,
            `${Date.now()}-${safeBase.replace(extension, '')}${extension}`,
          );
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          return callback(null, false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('envie o campo file (jpeg/png/webp)');
    }
    await this.productsService.updateImageFilename(id, file.filename);
    return {
      productId: id,
      imageUrl: `/products/${id}/image`,
    };
  }

  @Get(':id/image')
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiValidationErrorResponse('Validation failed (numeric string is expected)')
  async getImage(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StreamableFile> {
    const product = await this.productsService.findOne(id);
    if (!product.imageFilename) {
      throw new NotFoundException('produto sem imagem');
    }
    const filename = basename(product.imageFilename);
    const filePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('arquivo ausente no disco');
    }
    let type = 'image/jpeg';
    if (filename.endsWith('.png')) type = 'image/png';
    else if (filename.endsWith('.webp')) type = 'image/webp';
    return new StreamableFile(createReadStream(filePath), { type });
  }

  @Delete(':id/image')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover imagem do produto (ADMIN)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiValidationErrorResponse('Validation failed (numeric string is expected)')
  @ApiResponse({ status: 204, description: 'Imagem removida' })
  @ApiResponse({ status: 401, description: 'Sem token' })
  @ApiResponse({ status: 403, description: 'Papel insuficiente' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(204)
  async deleteImage(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const product = await this.productsService.findOne(id);
    if (!product.imageFilename) {
      return;
    }

    const filePath = join(
      process.cwd(),
      'uploads',
      basename(product.imageFilename),
    );
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
    await this.productsService.updateImageFilename(id, null);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiValidationErrorResponse('Validation failed (numeric string is expected)')
  @ApiResponse({ status: 200, description: 'Produto encontrado' })
  @ApiOkResponse({ schema: { $ref: getSchemaPath(Product) } })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(Number(id));
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar produto (ADMIN)' })
  @ApiResponse({ status: 201, description: 'Criado' })
  @ApiResponse({ status: 401, description: 'Sem token' })
  @ApiResponse({ status: 403, description: 'Papel insuficiente' })
  @ApiValidationErrorResponse('Informe um nome com pelo menos 2 caracteres')
  @ApiResponse({
    status: 201,
    description: 'Produto criado',
    schema: { $ref: getSchemaPath(Product) },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar produto (ADMIN ou MANAGER)' })
  @ApiResponse({ status: 200, description: 'Produto atualizado' })
  @ApiResponse({ status: 401, description: 'Sem token' })
  @ApiResponse({ status: 403, description: 'Papel insuficiente' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiValidationErrorResponse('Informe um nome com pelo menos 2 caracteres')
  @ApiOkResponse({ schema: { $ref: getSchemaPath(Product) } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  update(
    @Param('id', ParseIntPipe) id: number | string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(Number(id), dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar campos enviados do produto (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Produto atualizado parcialmente' })
  @ApiResponse({ status: 401, description: 'Sem token' })
  @ApiResponse({ status: 403, description: 'Papel insuficiente' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiValidationErrorResponse('Informe um nome com pelo menos 2 caracteres')
  @ApiOkResponse({ schema: { $ref: getSchemaPath(Product) } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  patch(@Param('id', ParseIntPipe) id: number, @Body() dto: PatchProductDto) {
    return this.productsService.patch(id, dto);
  }

  @Patch(':id/category')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Associar ou remover categoria do produto (ADMIN)' })
  @ApiResponse({
    status: 404,
    description: 'Produto ou categoria não encontrado',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiValidationErrorResponse('categoryId deve ser maior que zero')
  @ApiOkResponse({ schema: { $ref: getSchemaPath(Product) } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductCategoryDto,
  ) {
    return this.productsService.updateCategory(id, dto.categoryId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover produto (ADMIN)' })
  @ApiResponse({ status: 204, description: 'Produto removido' })
  @ApiResponse({ status: 401, description: 'Sem token' })
  @ApiResponse({ status: 403, description: 'Papel insuficiente' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiValidationErrorResponse('Validation failed (numeric string is expected)')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}

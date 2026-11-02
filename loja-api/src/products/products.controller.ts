import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream, existsSync, unlinkSync } from 'fs';
import { mkdir, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
import { basename, join } from 'path';
import {
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
  ApiConsumes,
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
import { ProductImage } from './product-image.entity';
import { hasMatchingImageSignature } from './image-file-validation';
import { CreateProductDto } from './dto/create-product.dto';
import { PatchProductDto } from './dto/patch-product.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import {
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/update-product.dto';
import { ProductsService } from './products.service';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function createImageStorage() {
  return diskStorage({
    destination: (_req, _file, callback) => {
      const uploadDirectory = join(process.cwd(), 'uploads');
      mkdir(uploadDirectory, { recursive: true })
        .then(() => callback(null, uploadDirectory))
        .catch((error: Error) => callback(error, uploadDirectory));
    },
    filename: (_req, file, callback) => {
      const extensionByMimeType: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
      };
      callback(
        null,
        `${randomUUID()}${extensionByMimeType[file.mimetype] ?? '.bin'}`,
      );
    },
  });
}

function validateImageMimeType(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    callback(
      new BadRequestException(
        'tipo de imagem inválido (use jpeg, png ou webp)',
      ),
      false,
    );
    return;
  }
  callback(null, true);
}

async function cleanupUploadedFiles(files: Express.Multer.File[]) {
  const results = await Promise.allSettled(
    files.map((file) => unlink(file.path)),
  );
  if (results.some((result) => result.status === 'rejected')) {
    throw new InternalServerErrorException(
      'Não foi possível limpar os arquivos enviados após uma falha',
    );
  }
}

@Controller('products')
@ApiTags('products')
@ApiExtraModels(Product, ProductImage)
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

  @Post(':id/images')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar várias imagens para o produto (ADMIN)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          maxItems: 5,
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Imagens enviadas (JPEG, PNG ou WebP; até 2 MB cada; máximo 5)',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(ProductImage) },
    },
  })
  @ApiResponse({ status: 413, description: 'Imagem excede o limite de 2 MB' })
  @ApiValidationErrorResponse('tipo de imagem inválido (use jpeg, png ou webp)')
  @ApiResponse({ status: 401, description: 'Sem token ou token inválido' })
  @ApiResponse({ status: 403, description: 'Papel insuficiente' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: createImageStorage(),
      limits: { fileSize: 2 * 1024 * 1024, files: 5 },
      fileFilter: validateImageMimeType,
    }),
  )
  async uploadImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ProductImage[]> {
    if (!files?.length) {
      throw new BadRequestException(
        'envie pelo menos um arquivo no campo files',
      );
    }

    try {
      for (const file of files) {
        if (!(await hasMatchingImageSignature(file.path, file.mimetype))) {
          throw new BadRequestException(
            `conteúdo do arquivo ${file.originalname} não corresponde ao MIME ${file.mimetype}`,
          );
        }
      }

      return await this.productsService.addImages(
        id,
        files.map((file) => ({
          filename: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          originalName: basename(file.originalname).slice(0, 255),
        })),
      );
    } catch (error) {
      await cleanupUploadedFiles(files);
      throw error;
    }
  }

  @Get(':id/images')
  @ApiOperation({ summary: 'Listar imagens do produto' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(ProductImage) },
    },
  })
  findImages(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findImages(id);
  }

  @Get(':id/images/:imageId/file')
  @ApiOperation({ summary: 'Baixar imagem do produto' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiParam({ name: 'imageId', type: Number, example: 1 })
  @ApiResponse({ status: 404, description: 'Imagem não encontrada' })
  async getProductImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ): Promise<StreamableFile> {
    const image = await this.productsService.findImage(id, imageId);
    return new StreamableFile(
      createReadStream(
        join(process.cwd(), 'uploads', basename(image.filename)),
      ),
      { type: image.mimeType },
    );
  }

  @Delete(':id/images/:imageId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover imagem do produto (ADMIN)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiParam({ name: 'imageId', type: Number, example: 1 })
  @ApiResponse({ status: 204, description: 'Imagem removida' })
  @ApiResponse({ status: 401, description: 'Sem token ou token inválido' })
  @ApiResponse({ status: 403, description: 'Papel insuficiente' })
  @ApiResponse({ status: 404, description: 'Imagem não encontrada' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(204)
  async deleteProductImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ): Promise<void> {
    const image = await this.productsService.deleteImage(id, imageId);
    await unlink(join(process.cwd(), 'uploads', basename(image.filename)));
  }

  @Post(':id/image')
  @HttpCode(200)
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiValidationErrorResponse('envie o campo file (jpeg/png/webp)')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createImageStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: validateImageMimeType,
    }),
  )
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('envie o campo file (jpeg/png/webp)');
    }
    try {
      if (!(await hasMatchingImageSignature(file.path, file.mimetype))) {
        throw new BadRequestException(
          `conteúdo do arquivo ${file.originalname} não corresponde ao MIME ${file.mimetype}`,
        );
      }
      await this.productsService.updateImageFilename(id, file.filename);
    } catch (error) {
      await cleanupUploadedFiles([file]);
      throw error;
    }
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

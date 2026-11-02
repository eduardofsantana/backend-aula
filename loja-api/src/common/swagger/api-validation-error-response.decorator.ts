import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiValidationErrorResponse(exampleMessage: string) {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Parâmetros ou corpo inválidos',
      content: {
        'application/json': {
          example: {
            statusCode: 400,
            message: [exampleMessage],
            error: 'Bad Request',
          },
        },
      },
    }),
  );
}

import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const errors: Record<string, [number, string]> = {
      P2002: [
        409,
        'This entry already exists. Choose a unique email, slug or variant.',
      ],
      P2025: [
        404,
        'This entry could not be found. Please refresh and try again.',
      ],
      P2003: [
        400,
        'A related entry no longer exists. Please refresh your selection.',
      ],
      P2034: [409, 'Another update was in progress. Please try again.'],
    };
    const [status, message] = errors[error.code] ?? [
      500,
      'We could not complete this request. Please try again.',
    ];
    response.status(status).json({ statusCode: status, message });
  }
}

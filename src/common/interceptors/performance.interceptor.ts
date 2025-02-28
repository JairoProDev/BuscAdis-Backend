import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => {
          const end = Date.now();
          const duration = end - start;
          if (duration > 1000) {
            console.warn(`Request took ${duration}ms to complete`);
          }
        }),
      );
  }
} 
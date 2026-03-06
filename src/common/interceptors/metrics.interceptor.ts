import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const req = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const res = context.switchToHttp().getResponse();
        // Metrics recording delegated to MetricsService via events
        // to avoid circular dependency
        if (duration > 1000) {
          console.warn(
            `Slow request: ${req.method} ${req.url} → ${duration}ms`,
          );
        }
      }),
    );
  }
}

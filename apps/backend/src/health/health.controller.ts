import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    // Deliberately does not touch Prisma/MySQL — see PrismaService's comment
    // on lazy connection. This endpoint answers "is the process up", which
    // is what a container orchestrator's liveness probe needs; a DB-touching
    // readiness probe can be added separately once there's an orchestrator
    // that distinguishes the two.
    return { status: 'ok', service: 'esg-backend', timestamp: new Date().toISOString() };
  }
}

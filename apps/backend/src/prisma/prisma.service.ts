import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Thin wrapper so Prisma's connection lifecycle follows Nest's module lifecycle.
// Deliberately does NOT force a connection at startup — Prisma connects lazily
// on the first query, which matters for local dev/CI where the backend
// container may boot before MySQL is fully ready. This keeps GET /health
// responsive even if the database isn't reachable yet.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

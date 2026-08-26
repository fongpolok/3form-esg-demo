import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';

// Owns the device registry and the POST /ingestion/readings contract that
// both apps/simulator and any future real hardware call (plan §5).
@Module({
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}

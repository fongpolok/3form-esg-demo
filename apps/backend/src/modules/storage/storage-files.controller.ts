import { Controller, Get, NotFoundException, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { normalize, relative } from 'node:path';
import { Public } from '../../common/decorators/public.decorator';
import { StorageService } from './storage.service';

// Only wired up when STORAGE_DRIVER=local — the S3 driver's signed URLs
// point straight at MinIO/S3 and never touch this backend at all.
// @Public() because a real signed S3 URL isn't gated behind this app's JWT
// either; gating this one would make local mode behave differently from S3
// mode for the same feature.
@Controller('files')
export class StorageFilesController {
  constructor(private readonly storage: StorageService) {}

  @Public()
  @Get('*')
  serve(@Req() req: Request, @Res() res: Response) {
    const driver = this.storage.localDriver;
    if (!driver) throw new NotFoundException();

    const key = (req.params as Record<string, string | undefined>)[0];
    if (!key) throw new NotFoundException();
    const path = driver.resolvePath(key);

    // resolvePath joins onto a fixed root; reject anything that climbs out
    // of it (report keys are backend-generated, not user input, but this
    // route is public so it costs nothing to check).
    const root = driver.resolvePath('');
    if (relative(root, normalize(path)).startsWith('..')) throw new NotFoundException();
    if (!existsSync(path)) throw new NotFoundException();

    res.sendFile(path);
  }
}

// src/modules/backup/dto/create-backup.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBackupDto {
  @ApiPropertyOptional({
    example: 'pre-migration-v2',
    description: 'Backup label',
    required: false,
  })
  @IsOptional()
  @IsString()
  label?: string;
}

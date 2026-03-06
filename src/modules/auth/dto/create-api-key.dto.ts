import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production Key', minLength: 2, type: String })
  @IsString()
  name: string;

  @ApiProperty({
    enum: ['db:read', 'db:write', 'db:delete', 'schema:manage', 'admin:full'],
    isArray: true,
    required: true,
    type: [String],
    description: 'Array of scopes',
  })
  @IsArray()
  @IsEnum(['db:read', 'db:write', 'db:delete', 'schema:manage', 'admin:full'], {
    each: true,
  })
  scopes: string[];

  @ApiProperty({
    required: false,
    type: Date,
    example: '2022-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: Date;
}

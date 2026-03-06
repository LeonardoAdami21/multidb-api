// src/modules/databases/dto/create-database.dto.ts
import { IsString, IsEnum, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDatabaseDto {
  @ApiProperty({
    example: 'my-blog-db',
    minLength: 2,
    type: String,
    description: 'Database name',
  })
  @IsString()
  @MinLength(2)
  @Matches(/^[a-z0-9-_]+$/, {
    message: 'Name must be lowercase alphanumeric with hyphens/underscores',
  })
  name: string;

  @ApiProperty({
    enum: ['POSTGRESQL', 'MYSQL', 'MONGODB', 'SQLITE'],
    type: String,
    description: 'Database engine',
  })
  @IsEnum(['POSTGRESQL', 'MYSQL', 'MONGODB', 'SQLITE'])
  engine: string;
}

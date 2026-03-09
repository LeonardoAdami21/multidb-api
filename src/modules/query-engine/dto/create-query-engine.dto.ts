// src/modules/query-engine/dto/query.dto.ts
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryDto {
  @ApiPropertyOptional({
    description: 'Filter object e.g. filter[published]=true',
  })
  @IsOptional()
  filter?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Order by e.g. orderBy[createdAt]=desc' })
  @IsOptional()
  orderBy?: Record<string, 'asc' | 'desc'>;

  @ApiPropertyOptional({
    description: 'Relations to include e.g. include=author,comments',
  })
  @IsOptional()
  @IsString()
  include?: string;

  @ApiPropertyOptional({
    description: 'Fields to select e.g. select=id,title,createdAt',
  })
  @IsOptional()
  @IsString()
  select?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

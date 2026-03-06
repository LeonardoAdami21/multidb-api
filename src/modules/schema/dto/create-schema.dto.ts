// src/modules/schema-engine/dto/create-schema.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IndexDefinition {
  @IsString()
  @ApiProperty({ example: 'title', description: 'Index name', required: true })
  name: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String], description: 'Index fields' })
  fields: string[];

  @IsOptional()
  @IsEnum(['NORMAL', 'UNIQUE', 'FULLTEXT'])
  @ApiProperty({ description: 'Index type' })
  type?: string;
}

export class UniqueConstraint {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String], description: 'Unique fields' })
  fields: string[];
}

export class FieldDefinition {
  @ApiProperty({ example: 'title', required: true, description: 'Field name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'String',
    enum: [
      'String',
      'Int',
      'BigInt',
      'Float',
      'Decimal',
      'Boolean',
      'DateTime',
      'Json',
      'Bytes',
    ],
  })
  @IsString()
  @ApiProperty({ description: 'Field type' })
  type: string;

  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsBoolean() id?: boolean;
  @IsOptional() @IsBoolean() autoincrement?: boolean;
  @IsOptional() @IsBoolean() defaultUuid?: boolean;
  @IsOptional() @IsBoolean() defaultNow?: boolean;
  @IsOptional() default?: any;
  @IsOptional() @IsBoolean() unique?: boolean;
  @IsOptional() @IsBoolean() updatedAt?: boolean;
  @IsOptional() @IsBoolean() isList?: boolean;
  @IsOptional() @IsString() relation?: string; // related model name
  @IsOptional() @IsBoolean() encrypted?: boolean; // application-level AES encryption
}

export class ModelDefinition {
  @ApiProperty({ example: 'Post', required: true, description: 'Model name' })
  @IsString()
  name: string;

  @ApiProperty({ type: [FieldDefinition] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDefinition)
  fields: FieldDefinition[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UniqueConstraint)
  uniqueConstraints?: UniqueConstraint[];
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndexDefinition)
  indexes?: IndexDefinition[];
}

export class CreateSchemaDto {
  @ApiProperty({
    example: 'Blog Schema v1',
    required: false,
    description: 'Schema name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ type: [ModelDefinition] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModelDefinition)
  models: ModelDefinition[];
}

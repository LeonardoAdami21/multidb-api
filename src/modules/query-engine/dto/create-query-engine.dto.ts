import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateQueryEngineDto {
  @ApiProperty({
    description: 'Idenificador do banco de dados',
    example: 'my-database-id',
    type: String,
  })
  @IsString()
  databaseId: string;

  @ApiProperty({
    description: 'Idenificador do tenant',
    example: 'my-tenant-id',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @ApiProperty({
    description: 'Modelo do banco de dados',
    example: 'Post',
    type: String,
  })
  model: string;

  @ApiProperty({
    description: 'Chave de API',
    example: 'my-api-key',
    type: String,
  })
  @IsString()
  @IsOptional()
  apiKeyId?: string;

  @ApiProperty({
    description: 'Campos do banco de dados',
    example: 'title',
    type: String,
  })
  data: any;
}

// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Minha Empresa', minLength: 2, type: String })
  @IsString()
  @MinLength(2)
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'contato@empresa.com',
    type: String,
    format: 'email',
  })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;
}

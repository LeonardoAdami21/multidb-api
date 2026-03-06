import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'contato@empresa.com',
    type: String,
    format: 'email',
  })
  @IsEmail()
  @IsString()
  email: string;
}

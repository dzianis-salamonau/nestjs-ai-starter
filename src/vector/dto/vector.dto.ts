import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class VectorUpsertDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Text that will be embedded and stored' })
  @IsString()
  text!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class VectorQueryDto {
  @ApiProperty()
  @IsString()
  text!: string;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  topK?: number;
}

import { Body, Controller, Delete, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VectorService } from './vector.service';
import { VectorQueryDto, VectorUpsertDto } from './dto/vector.dto';

@ApiTags('vector')
@ApiBearerAuth()
@Controller('vector')
export class VectorController {
  constructor(private readonly vector: VectorService) {}

  @Post('upsert')
  @ApiOperation({ summary: 'Embed text (OpenAI) and upsert into memory store' })
  upsert(@Body() body: VectorUpsertDto) {
    return this.vector.upsert(body.id, body.text, body.metadata);
  }

  @Post('query')
  @ApiOperation({ summary: 'Embed query and cosine-search the local vector index' })
  query(@Body() body: VectorQueryDto) {
    return this.vector.query(body.text, body.topK ?? 5);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear in-memory vectors (dev helper)' })
  clear() {
    this.vector.clear();
    return { cleared: true };
  }
}

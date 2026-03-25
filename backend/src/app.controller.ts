import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): { message: string; version: string; status: string } {
    return {
      message: 'Bienvenido a NETO API',
      version: '1.0.0',
      status: 'running',
    };
  }

  @Get('health')
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

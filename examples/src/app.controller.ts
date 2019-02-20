import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { NestCqrsControllerStub } from 'cqrs-exp';

@Controller()
export class AppController extends NestCqrsControllerStub {
  constructor(private readonly appService: AppService) {
    super(appService)
  }

  @Get()
  root(): string {
    return this.appService.root();
  }
}

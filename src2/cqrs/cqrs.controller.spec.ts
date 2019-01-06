import { Test, TestingModule } from '@nestjs/testing';
import { CqrsController } from './cqrs.controller';

describe('Cqrs Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [CqrsController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: CqrsController = module.get<CqrsController>(
      CqrsController,
    );
    expect(controller).toBeDefined();
  });
});

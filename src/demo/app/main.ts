import { CqrsServer } from '../core/cqrs-server';
import { EventStore } from '../core/event-store';
import { DomainCommand } from '../demo-domain/domain-command';
import { DomainEvent } from '../demo-domain/domain-event';
import { DomainQuery } from '../demo-domain/domain-query';
import { DomainReadModel } from '../demo-domain/domain-read-model';
import { DomainWriteModel } from '../demo-domain/domain-write-model';

export let eventStore = new EventStore<DomainEvent['type']>();
export let appWriteModel = new DomainWriteModel();
export let appReadModel = new DomainReadModel(eventStore);

export let appServer = new CqrsServer<DomainCommand, DomainEvent, DomainQuery>(eventStore);
appServer.registerWriteModel(appWriteModel);
appServer.registerReadModel(appReadModel);

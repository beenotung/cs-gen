import { CqrsServer } from '../core/cqrs-server';
import { EventStore } from '../core/event-store';
import { DomainEvent } from '../demo-domain/domain-event';
import { DomainReadModel } from '../demo-domain/domain-read-model';
import { DomainWriteModel } from '../demo-domain/domain-write-model';

export let eventStore = new EventStore<DomainEvent['type']>();
export let appWriteModel = new DomainWriteModel();
export let appReadModel = new DomainReadModel(eventStore);

export let appServer = new CqrsServer(eventStore);
appServer.registerWriteModel(appWriteModel);
appServer.registerReadModel(appReadModel);

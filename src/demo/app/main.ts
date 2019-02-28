import { DomainWriteModel } from '../demo-domain/domain-write-model';
import { DomainReadModel } from '../demo-domain/domain-read-model';
import { EventStore } from '../core/event-store';
import { DomainEvent } from '../demo-domain/domain-event';
import { CqrsServer } from '../core/cqrs-server';

export let eventStore = new EventStore<DomainEvent['type']>();
export let appWriteModel = new DomainWriteModel();
export let appReadModel = new DomainReadModel(eventStore);

export let appServer = new CqrsServer(eventStore);
appServer.registerWriteModel(appWriteModel);
appServer.registerReadModel(appReadModel);

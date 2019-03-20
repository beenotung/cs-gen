import { Command, Model, Query } from './model';
import { EventStore } from './event-store';

export class Engine {
  model: Model;
  eventStore: EventStore;

  async onCommand(command: Command): Promise<Event[]> {
    let events = await this.model.onCommand(command);
    await this.eventStore.storeAll(events);
    return undefined;
  }

  onQuery<Q extends Query>(query: Q): Promise<Q['response']> {
    return undefined;
  }
}

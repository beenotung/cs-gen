import { includes } from '@beenotung/tslib/array';
import { command_bus, cqrs_engine, domain, event_store } from '../models';
import { query_handler } from '../types';
import { isString } from '../utils';

export class SinglestoreCqrsengine<E, C, Q, R, ET, CT, QT, RT,
  qh extends query_handler<Q, R, QT, RT>> implements cqrs_engine<E, C, Q, R,
  ET, CT, QT, RT,
  qh> {
  commandBus: command_bus<C, CT>;
  eventStore: event_store<E, ET>;

  domains: Array<domain<E, C, Q, R, ET, CT, QT, RT, qh>>;

  constructor(eventStore: event_store<E, ET>, commandBus: command_bus<C, CT>) {
    this.commandBus = commandBus;
    this.eventStore = eventStore;
    this.domains = [];
  }

  addDomain(domain: domain<E, C, Q, R, ET, CT, QT, RT, qh>) {
    this.domains.push(domain);
    this.eventStore.subscribeEvents({}).subscribe(
      valueChange => {
        if (includes(valueChange.new_val.type, domain.event_types)) {
          console.log('received event:', valueChange);
          const res = domain.event_handler(valueChange.new_val);
          isString(res).then(isError => {
            if (isError) {
              console.error('failed to handle event:', res);
            }
          });
        }
      },
      error => console.error(error),
    );
    this.commandBus.subscribeCommand({}).subscribe(
      valueChange => {
        const command = valueChange.new_val;
        if (includes(command.type, domain.command_types)) {
          console.log('received command:', valueChange);
          const errorOrEvents = domain.command_handler(command);
          if (typeof errorOrEvents === 'string') {
            console.error('failed to handle command:', errorOrEvents);
          } else {
            const res = this.eventStore.storeEvents(errorOrEvents, command.expected_version);
            res.catch(error => console.error(error));
          }
        }
      },
      error => console.error(error),
    );
  }
}

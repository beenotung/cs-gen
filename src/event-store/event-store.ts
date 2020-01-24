import { EventEmitter } from 'stream';
import { createServer } from 'http';
import { jsonBody } from '../helpers/request';

export interface SubscribeOptions<E> {
  filter: (event: E) => boolean
  onEvents: (events: E[]) => void
}

export interface EventStore<E> {
  publish(event: E): void

  batchPublish(events: E[]): void

  subscribe(options: SubscribeOptions<E>): void
}

export class InMemoryEventStore<E> implements EventStore<E> {
  events: E[] = [];
  eventEmitter = new EventEmitter();

  batchPublish(events: E[]): void {
    this.events.push(...events);
    this.eventEmitter.emit('data', events);
  }

  publish(event: E): void {
    this.events.push(event);
    this.eventEmitter.emit('data', [event]);
  }

  subscribe({ filter, onEvents }: SubscribeOptions<E>): void {
    const onData = (events: E[]) => onEvents(events.filter(filter));
    onData(this.events);
    this.eventEmitter.on('data', events => {
      onData(events);
    });
  }

  createServer(port: number) {
    createServer((req, res) => {
      const onError = (code: number, message: string) => {
        res.statusCode = code;
        res.statusMessage = message;
        res.end(message);
      };
      if (req.url === '/batchPublish') {
        return jsonBody(req)
          .then(body => this.batchPublish(body.events))
          .catch(err => onError(400, err));
      }
      if (req.url === '/publish') {
        return jsonBody(req)
          .then(body => this.publish(body.event))
          .catch(err => onError(400, err));
      }
      if (req.url === '/subscribe') {
        return jsonBody(req)
          .then(body => this.subscribe({
            filter:eval(body.filter),
            onEvents:'' as any,
          }))
          .catch(err => onError(400, err));
      }
      return onError(404, 'Not Found');
    })
      .listen(port);
  }
}

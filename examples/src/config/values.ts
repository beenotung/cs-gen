import { NestCqrsClientStub, LocalstorageEventStore } from 'cqrs-exp';

export namespace config {
  export let host = 'localhost';
  export let port = 3000;
  export let baseUrl = 'http://' + host + ':' + port;
  export let eventStore = new LocalstorageEventStore('data');
}
export let appClient = new NestCqrsClientStub(config.baseUrl);

import { NestCqrsClientStub } from 'cqrs-exp';

export namespace config {
  export let host = 'localhost';
  export let port = 3000;
  export let baseUrl = 'http://' + host + ':' + port;
  export let eventStore = new EVe
}
export let appClient = new NestCqrsClientStub(config.baseUrl);

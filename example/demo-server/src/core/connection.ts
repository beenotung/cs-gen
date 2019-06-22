import { CallInput } from 'cqrs-exp';

export type Spark = {
  id: string
  on: (event: string, cb: (data: any, ack?: (data: any) => void) => void) => void
} & any;

export interface Session {
  spark: Spark
  calls: CallInput[]
}

export let sessions: Map<string, Session> = new Map();

export function newConnection(spark: Spark) {
  sessions.set(spark.id, { spark, calls: [] });
}

export function closeConnection(spark: Spark) {
  sessions.delete(spark.id);
}

export function startSparkCall(sparkId: string, call: CallInput) {
  sessions.get(sparkId).calls.push(call);
}

/**
 * @remark inplace update
 * @return original array
 * */
function remove<A>(xs: A[], x: A): void {
  const idx = xs.indexOf(x);
  if (idx !== -1) {
    xs.splice(idx, 1);
  }
}

export function endSparkCall(sparkId: string, call: CallInput) {
  const session = sessions.get(sparkId);
  remove(session.calls, call);
}

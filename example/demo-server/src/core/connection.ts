import { CallInput } from 'cqrs-exp';

export interface Spark {
  id: string;

  on(event: string, cb: (data: any, ack?: (data: any) => void) => void);

  send(event: string, data?: any, ack?: (data: any) => void);
}

export interface Subscription {
  id: string;

  close();
}

export interface Session {
  spark: Spark;
  calls: CallInput[];
  // channel id -> Subscription
  subscriptions: Map<string, Subscription>;
}

let sparkId_session_map: Map<string, Session> = new Map();
let in_session_map = new Map<any, Session>();

export function newConnection(spark: Spark) {
  sparkId_session_map.set(spark.id, {
    spark,
    calls: [],
    subscriptions: new Map(),
  });
}

export function closeConnection(spark: Spark) {
  let session = sparkId_session_map.get(spark.id);
  session.subscriptions.forEach(sub => sub.close());
  sparkId_session_map.delete(spark.id);
}

export function startSparkCall(spark: Spark, call: CallInput) {
  let session = sparkId_session_map.get(spark.id);
  session.calls.push(call);
  in_session_map.set(call.In, session);
}

export function getSessionByIn(In): Session {
  return in_session_map.get(In);
}

export function getSessionBySparkId(sparkId: string): Session {
  return sparkId_session_map.get(sparkId);
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

export function endSparkCall(spark: Spark, call: CallInput) {
  const session = sparkId_session_map.get(spark.id);
  remove(session.calls, call);
  in_session_map.delete(call.In);
}

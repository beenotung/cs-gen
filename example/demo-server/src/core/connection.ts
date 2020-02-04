import { HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express-serve-static-core';
import { CallInput } from '../domain/types';
import { status } from './status';

export interface Spark {
  id: string;

  on(event: string, cb: (data: any, ack?: (data: any) => void) => void): void;

  send(event: string, data?: any, ack?: (data: any) => void): void;
}

export interface Subscription {
  id: string;

  close(): void;
}

export interface Session {
  spark: Spark;
  calls: Set<CallInput>;
  // channel id -> Subscription
  subscriptions: Map<string, Subscription>;
}

let sparkId_session_map: Map<string, Session> = new Map();
let in_session_map = new Map<any, Session>();

export function getAllSession() {
  return sparkId_session_map.values();
}

export function newConnection(spark: Spark) {
  sparkId_session_map.set(spark.id, {
    spark,
    calls: new Set(),
    subscriptions: new Map(),
  });
}

export function closeConnection(spark: Spark) {
  const session = sparkId_session_map.get(spark.id);
  if(!session){return}
  session.subscriptions.forEach(sub => sub.close());
  sparkId_session_map.delete(spark.id);
}

export function startSparkCall(spark: Spark, call: CallInput) {
  const session = sparkId_session_map.get(spark.id);
  if (!session) {
    return;
  }
  session.calls.add(call);
  in_session_map.set(call.In, session);
}

export function getSessionByIn(In: any): Session | undefined {
  return in_session_map.get(In);
}

export function checkedGetSessionByIn(In: any): Session {
  if (status.isReplay) {
    throw new HttpException('SkipWhenReplay', HttpStatus.NOT_ACCEPTABLE);
  }
  const session = getSessionByIn(In);
  if (!session) {
    throw new HttpException(
      'primus session not found',
      HttpStatus.HTTP_VERSION_NOT_SUPPORTED,
    );
  }
  return session;
}

export function getSessionBySparkId(sparkId: string): Session | undefined {
  return sparkId_session_map.get(sparkId);
}

export function endSparkCall(spark: Spark, call: CallInput) {
  const session = sparkId_session_map.get(spark.id);
  if(!session){return}
  session.calls.delete(call);
  in_session_map.delete(call.In);
}

export interface RestSession {
  req: Request;
  res: Response;
}

const in_rest_session_map = new Map<any, RestSession>();

export function startRestCall(req: Request, res: Response, call: CallInput) {
  in_rest_session_map.set(call.In, { req, res });
}

export function getRestSessionByIn(In: any): RestSession | undefined {
  return in_rest_session_map.get(In);
}

export function endRestCall(call: CallInput) {
  in_rest_session_map.delete(call.In);
}

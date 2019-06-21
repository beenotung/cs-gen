export type Spark = any;

export interface Session {
  spark: Spark
}

export let sessions = new Map<string, Spark>();

export function newConnection(spark) {
  sessions.set(spark.id, spark);
}

export function closeConnection(spark) {
  sessions.delete(spark.id);
}

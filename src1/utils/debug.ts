export function log<A>(a: A, msg): A {
  if (msg) {
    console.log(msg, a);
  } else {
    console.log(a);
  }
  return a;
}

export function throwError<A>(error, wrap = false): A {
  if (wrap) {
    throw new Error(error);
  } else {
    throw error;
  }
}

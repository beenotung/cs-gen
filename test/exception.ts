try {
  throw new Error();
} catch (e) {
  throw e;
} finally {
  console.log('finally');
}

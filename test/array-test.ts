let i = 4294967296 - 1;
let step = 1;
for (; i < Number.MAX_SAFE_INTEGER; ) {
  console.log(i);
  new Array(i);
  i += step;
}

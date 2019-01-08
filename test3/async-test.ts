function loopSync(n:number){
  for(;n>0;){
    n=n-1;
  }
  return 'ok';
}
async function loopAsync(n:number){
  for(;n>0;){
    n=await Promise.resolve(n-1);
  }
  return 'ok';
}
async function main(n:number){
  let startTime=0;
  let endTime=0;
  let time=0;
  console.log('n:',n);

  startTime = Date.now();
  loopSync(n);
  endTime = Date.now();
  time = endTime - startTime;
  console.log('sync:',time);

  startTime = Date.now();
  await loopAsync(n);
  endTime = Date.now();
  time = endTime - startTime;
  console.log('async:',time);
}
main(Math.pow(2,24));

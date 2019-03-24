import { SequenceData, SequencedRingBuffer } from '../src/core/sequenced-ring-buffer';

let test = require('tape');

test('ring buffer test', t => {
  let ringBuffer = new SequencedRingBuffer(3);
  let seq: number;
  let value: SequenceData<any>;

  seq = ringBuffer.enqueue('apple');
  t.equal(seq, 0, 'sequence number should start from zero');

  seq = ringBuffer.enqueue('banana');
  t.equal(seq, 1, 'sequence number should be increased');

  t.equal(ringBuffer.toArray().length, 2, 'toArray() should return all the items');

  value = ringBuffer.dequeue();
  t.equal(value.sequence, 0, 'sequence number of dequeue-ed item should match');
  t.equal(value.value, 'apple', 'value of dequeue-ed item should match');

  let array = ringBuffer.toArray();
  t.equal(array.length, 1, 'toArray() should return the reminding items.');
  console.log('array:', array);
  t.equal(array[0].value, 'banana', 'value in item of toArray() should match');
  t.equal(array[0].sequence, 1, 'sequence in item of toArray() should match');
  ringBuffer.dequeue();

  t.equal(ringBuffer.toArray().length, 0, 'toArray() should return empty array when the buffer is cleared');

  console.log('== BEGIN test full and reuse space ==');
  ringBuffer.enqueue('more');
  console.log('internal:', ringBuffer);
  console.log('data:', ringBuffer.toArray());
  ringBuffer.enqueue('data');
  console.log('internal:', ringBuffer);
  console.log('data:', ringBuffer.toArray());
  ringBuffer.enqueue('fill?');
  console.log('internal:', ringBuffer);
  console.log('data:', ringBuffer.toArray());
  t.throws(() => ringBuffer.enqueue('still not fill?'), /*BufferOutOfSpaceError*/ Error, 'should throw error when fulled');
  console.log('internal:', ringBuffer);
  console.log('data:', ringBuffer.toArray());
  console.log('== END test full and reuse space ==');

  ringBuffer.dequeue();
  ringBuffer.dequeue();
  t.equal(ringBuffer.dequeue().sequence, 4, 'sequence number should not be reset when array space is reused');

  t.end();
});


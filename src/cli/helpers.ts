import * as readline from 'readline';
import { ReadLine } from 'readline';

let io: ReadLine | undefined;

function initIO() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export function getIO(): ReadLine {
  if (!io) {
    io = initIO();
  }
  return io;
}

export function closeIO() {
  if (io) {
    io.close();
  }
}

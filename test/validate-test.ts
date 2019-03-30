import { validateGet } from 'ts-class-validator';
import {Message} from "../src/core/message";

let msg = new Message();
msg.id = '101';
msg.type = 'TestValidate';
let res = validateGet(Message, msg);
console.log(res);

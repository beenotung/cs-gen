import { BaseMessageType } from './types';

let storeMessage=(message:BaseMessageType)=>fetch('store-message',{body:JSON.stringify(message),method:'post'})

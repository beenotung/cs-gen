import bodyParser from 'body-parser';
import PouchDB from 'pouchdb-core';
import express from 'express'
import { getAllMessages, getEvents, storeMessage, storeMessages } from './db';
import {createServer,IncomingMessage,ServerResponse}from'http'
import { Primus } from 'typestub-primus';

let jsonParser = bodyParser.json();
let formParser = bodyParser.urlencoded({ extended: false });

export function startDBServer({ db, port }: { db: PouchDB.Database, port: number }) {
  let app = express()

  app.post('store-message',jsonParser,(req,res)=>
  storeMessage(db,req.body.message)
    .then(()=>res.end('ok'))
    .catch(err=>{res.statusCode=503;res.end(err.toString())}))

  app.post('store-messages',jsonParser,(req,res)=>
  storeMessages(db,req.body.messages)
    .then(()=>res.end('ok'))
    .catch(err=>{res.statusCode=503;res.end(err.toString())}))

  app.get('get-all-messages',(req,res)=>
    getAllMessages(db)
      .then(response => res.end(JSON.stringify(response)))
      .catch(err => {
        res.statusCode = 503;
        res.end(err.toString());
      }))

  app.post('get-events',jsonParser,(req,res)=>
  getEvents(db,{selector:req.body.selector,
  fields:req.body.fields,
  skip:req.body.skip,
  limit:req.body.limit,
  onError:err=>{res.statusCode=503;res.end(err.toString())},
  onEvents:response => res.end(JSON.stringify(response))}))

  app.listen(port)
  return app
}

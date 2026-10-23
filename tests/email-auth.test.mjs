import { test } from 'node:test';
import assert from 'node:assert/strict';
import { submitEmailAuth } from '../lib/email-auth.ts';

test('sign-up requires confirmation when no session is issued',async()=>{
 let request;
 const client={auth:{signUp:async value=>{request=value;return {data:{session:null},error:null};}}};
 const result=await submitEmailAuth(client,'signup',' test@example.com ','password123','https://oscar.example');
 assert.equal(result.close,undefined);assert.match(result.message,/confirmation/);
 assert.deepEqual(request,{email:'test@example.com',password:'password123',options:{emailRedirectTo:'https://oscar.example/'}});
});
test('failed sign-in never reports success or exposes account existence',async()=>{
 const client={auth:{signInWithPassword:async()=>({error:{code:'invalid_credentials',message:'Sensitive detail'}})}};
 await assert.rejects(submitEmailAuth(client,'signin','test@example.com','wrong','https://oscar.example'),/Check your email and password/);
});
test('password resets use the current app origin and generic success text',async()=>{
 let request;
 const client={auth:{resetPasswordForEmail:async(...args)=>{request=args;return {error:null};}}};
 const result=await submitEmailAuth(client,'reset','test@example.com','','http://localhost:5173');
 assert.deepEqual(request,['test@example.com',{redirectTo:'http://localhost:5173/'}]);
 assert.match(result.message,/If an account exists/);
});
test('password validation prevents requests and failed updates remain open',async()=>{
 let called=false;
 const client={auth:{updateUser:async()=>{called=true;return {error:{message:'Reset session expired'}};}}};
 await assert.rejects(submitEmailAuth(client,'update','','short','https://oscar.example'),/at least 8/);
 assert.equal(called,false);
 await assert.rejects(submitEmailAuth(client,'update','','password123','https://oscar.example'),/Reset session expired/);
});

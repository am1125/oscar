'use client';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { EmailAuthMode, EmailAuthResult } from '@/lib/email-auth';
type Props = { open: boolean; recovery: boolean; configured: boolean; busy: boolean; onClose: ()=>void; submit: (mode: EmailAuthMode, email: string, password: string)=>Promise<EmailAuthResult> };
export function AccountDialog({open,recovery,configured,busy,onClose,submit}: Props) {
 const dialog=useRef<HTMLDialogElement>(null);
 const [mode,setMode]=useState<EmailAuthMode>('signin');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [confirmation,setConfirmation]=useState('');
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 useEffect(()=>{if(open||recovery){setMode(recovery?'update':'signin');setPassword('');setConfirmation('');setError('');setMessage('');dialog.current?.showModal();}else{dialog.current?.close();setPassword('');setConfirmation('');}},[open,recovery]);
 function change(next: EmailAuthMode){setMode(next);setPassword('');setConfirmation('');setError('');setMessage('');}
 async function send(action: EmailAuthMode){
  setError('');setMessage('');
  if((action==='signup'||action==='update')&&password!==confirmation){setError('The passwords do not match.');return;}
  try{const result=await submit(action,email,password);setPassword('');setConfirmation('');setMessage(result.message);if(result.close)onClose();}
  catch(e){setError(e instanceof Error?e.message:'Unable to complete this request. Please try again.');}
 }
 const title=mode==='signup'?'Create your account.':mode==='reset'?'Forgot your password?':mode==='update'?'Choose a new password.':'Welcome back.';
 return <dialog ref={dialog} aria-labelledby="account-title" onCancel={e=>{if(busy)e.preventDefault();else onClose();}}>
  {<button className="close-dialog" disabled={busy} aria-label="Close account dialog" onClick={onClose}><X/></button>}
  <div className="dialog-content"><p className="eyebrow">YOUR OSCAR ACCOUNT</p><h2 id="account-title">{title}</h2>
   {!configured&&<p className="demo-note">Accounts are awaiting Supabase setup. Your browser collection is still available.</p>}
   <form className="auth-form" onSubmit={e=>{e.preventDefault();void send(mode);}}>
    {mode!=='update'&&<label>Email<input type="email" autoComplete="email" required value={email} disabled={busy} onChange={e=>setEmail(e.target.value)}/></label>}
    {mode!=='reset'&&<label>{mode==='update'?'New password':'Password'}<input type="password" autoComplete={mode==='signin'?'current-password':'new-password'} required minLength={mode==='signin'?1:8} value={password} disabled={busy} onChange={e=>setPassword(e.target.value)}/></label>}
    {(mode==='signup'||mode==='update')&&<label>Confirm password<input type="password" autoComplete="new-password" required minLength={8} value={confirmation} disabled={busy} onChange={e=>setConfirmation(e.target.value)}/></label>}
    {error&&<p role="alert" className="error">{error}</p>}{message&&<p role="status" className="auth-message">{message}</p>}
    <button className="primary" type="submit" disabled={!configured||busy}>{busy?'Please wait…':mode==='signup'?'Create account':mode==='reset'?'Send reset link':mode==='update'?'Save new password':'Sign in'}</button>
   </form>
   {!recovery&&<div className="auth-links"><button disabled={busy} onClick={()=>change(mode==='signup'?'signin':'signup')}>{mode==='signup'?'Already have an account? Sign in':'Create an account'}</button><button disabled={busy} onClick={()=>change(mode==='reset'?'signin':'reset')}>{mode==='reset'?'Back to sign in':'Forgot password?'}</button>{mode==='signin'&&<button disabled={!configured||busy||!email} onClick={()=>void send('resend')}>Resend confirmation email</button>}</div>}
  </div>
 </dialog>;
}

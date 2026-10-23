import type { SupabaseClient } from '@supabase/supabase-js';
export type EmailAuthMode = 'signin' | 'signup' | 'reset' | 'update' | 'resend';
export type EmailAuthResult = { message: string; close?: boolean };

export async function submitEmailAuth(client: Pick<SupabaseClient, 'auth'>, mode: EmailAuthMode, email: string, password: string, origin: string): Promise<EmailAuthResult> {
 const address = email.trim();
 if (mode !== 'update' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new Error('Enter a valid email address.');
 if ((mode === 'signup' || mode === 'update') && password.length < 8) throw new Error('Use a password with at least 8 characters.');
 if (mode === 'signin' && !password) throw new Error('Enter your password.');
 const redirect = new URL('/', origin).href;
 if (mode === 'signin') {
  const {error}=await client.auth.signInWithPassword({email:address,password});
  if(error) throw new Error(error.code === 'email_not_confirmed' ? 'Confirm your email before signing in. You can resend the confirmation below.' : 'Could not sign in. Check your email and password, then try again.');
  return {message:'Signed in.',close:true};
 }
 if (mode === 'signup') {
  const {data,error}=await client.auth.signUp({email:address,password,options:{emailRedirectTo:redirect}});
  if(error) throw new Error(error.message);
  return data.session ? {message:'Account created.',close:true} : {message:'Check your inbox for a confirmation link. If you already have an account, sign in or reset your password.'};
 }
 if (mode === 'reset') {
  const {error}=await client.auth.resetPasswordForEmail(address,{redirectTo:redirect});
  if(error) throw new Error('Could not send a reset email. Please try again later.');
  return {message:'If an account exists for that email, you’ll receive a password reset link. Open it in this same browser.'};
 }
 if (mode === 'resend') {
  const {error}=await client.auth.resend({type:'signup',email:address,options:{emailRedirectTo:redirect}});
  if(error) throw new Error('Could not resend the confirmation. Please wait before trying again.');
  return {message:'If confirmation is needed, an email will arrive shortly. Open it in this same browser.'};
 }
 const {error}=await client.auth.updateUser({password});
 if(error) throw new Error(error.message);
 return {message:'Password updated.',close:true};
}

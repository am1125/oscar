'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { isSeenMovie, type Movie, type SeenMovie } from '@/lib/movies';
import { submitEmailAuth, type EmailAuthMode } from '@/lib/email-auth';
const KEY = 'oscar.seen.v1';
type Row = Omit<SeenMovie, 'addedAt'> & { user_id: string; added_at: number };
const toRow = (m: SeenMovie, userId: string): Row => ({id:m.id,title:m.title,release_date:m.release_date,poster_path:m.poster_path,overview:m.overview,added_at:m.addedAt,user_id:userId});
export function useCollection() {
 const [seen,setSeen] = useState<SeenMovie[]>([]);
 const [guest,setGuest] = useState<SeenMovie[]>([]);
 const [user,setUser] = useState<User|null>(null);
 const [ready,setReady] = useState(false);
 const [configured,setConfigured] = useState(false);
 const [busy,setBusy] = useState(false);
 const [error,setError] = useState('');
 const [notice,setNotice] = useState('');
 const [recovery,setRecovery] = useState(false);
 const client = useRef<SupabaseClient|null>(null);
 const currentUser = useRef<User|null>(null);
 const guestRef = useRef<SeenMovie[]>([]);
 const guestError = useRef('');
 const generation = useRef(0);
 const locked = useRef(false);
 const refresh = useCallback(async (nextUser: User|null) => {
  const version = ++generation.current;
  const changedUser = currentUser.current?.id !== nextUser?.id;
  currentUser.current = nextUser; setUser(nextUser); setReady(false); setError('');
  if (changedUser) setSeen([]);
  if (!nextUser) {setSeen(guestRef.current);setError(guestError.current);setReady(true);return;}
  try {
   const all: SeenMovie[] = [];
   for (let start=0;;start+=500) {
    const {data,error} = await client.current!.from('seen_movies').select('*').eq('user_id',nextUser.id).order('added_at',{ascending:false}).order('id').range(start,start+499);
    if (error) throw error;
    all.push(...(data as Row[]).map(({user_id,added_at,...movie}) => ({...movie,addedAt:added_at})));
    if (data.length<500) break;
   }
   if (generation.current===version) setSeen(all);
  } catch {if (generation.current===version) setError('Could not load your account collection. Check your connection and retry.');}
  finally {if (generation.current===version) setReady(true);}
 },[]);
 useEffect(() => {
  let disposed=false;
  try {setRecovery(sessionStorage.getItem('oscar.passwordRecovery')==='true');} catch {}
  let unsubscribe: (()=>void)|undefined;
  try { const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(saved)||!saved.every(isSeenMovie)) throw new Error();guestRef.current=saved;setGuest(saved); }
  catch {guestError.current='Your browser collection could not be read. It has not been overwritten.';}
  async function init() {
   try {
    const response=await fetch('/api/account-config');if(!response.ok) throw new Error();
    const config=await response.json() as {configured:boolean;url:string;key:string};
    if(disposed)return;
    setConfigured(config.configured);
    if(!config.configured){await refresh(null);return;}
    const supabase=createClient(config.url,config.key,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
    client.current=supabase;
    const {data:subscription}=supabase.auth.onAuthStateChange((event,session)=>{
     if(event==='PASSWORD_RECOVERY'){setRecovery(true);try{sessionStorage.setItem('oscar.passwordRecovery','true');}catch{}}
     if(event==='SIGNED_OUT'){setRecovery(false);try{sessionStorage.removeItem('oscar.passwordRecovery');}catch{}}
     // Avoid calling Supabase APIs while inside the auth callback's lock.
     setTimeout(()=>{if(!disposed) void refresh(session?.user||null);},0);
    });
    unsubscribe=()=>subscription.subscription.unsubscribe();
    const {data,error}=await supabase.auth.getSession();if(error)throw error;
    if(!disposed){
     if(!data.session){setRecovery(false);try{sessionStorage.removeItem('oscar.passwordRecovery');}catch{}}
     await refresh(data.session?.user||null);
    }
    const params=new URLSearchParams(window.location.search);
    const hashParams=new URLSearchParams(window.location.hash.slice(1));
    if(params.has('error') || hashParams.has('error')){setNotice('The email link is invalid or expired. Request a new confirmation or reset link.');window.history.replaceState({},'',window.location.pathname);}
   } catch {if(!disposed){setError('Could not initialize accounts. Retry before changing your collection.');setReady(true);}}
  }
  void init();
  const onFocus=()=>{if(client.current&&!locked.current)void refresh(currentUser.current);};
  window.addEventListener('focus',onFocus);
  return ()=>{disposed=true;++generation.current;unsubscribe?.();window.removeEventListener('focus',onFocus);};
 },[refresh]);
 async function toggle(movie: Movie) {
  if(!ready||error||locked.current)return;
  locked.current=true;setBusy(true);setNotice('');
  const owner=currentUser.current;
  const existed=seen.some(m=>m.id===movie.id);
  const next=existed?seen.filter(m=>m.id!==movie.id):[{...movie,addedAt:Date.now()},...seen];
  try {
   if(owner&&client.current){
    const result=existed?await client.current.from('seen_movies').delete().eq('user_id',owner.id).eq('id',movie.id):await client.current.from('seen_movies').upsert(toRow(next[0],owner.id),{onConflict:'user_id,id',ignoreDuplicates:true});
    if(result.error)throw result.error;
    if(currentUser.current?.id!==owner.id)return;
    await refresh(owner);
   } else {localStorage.setItem(KEY,JSON.stringify(next));guestRef.current=next;setGuest(next);setSeen(next);}
   setNotice(existed?`${movie.title} removed`:`${movie.title} saved${owner?' to your account':' in this browser'}`);
  } catch {setNotice('Could not save that change. Please try again.');}
  finally {locked.current=false;setBusy(false);}
 }
 async function authenticate(mode: EmailAuthMode, email: string, password: string) {
  if(!client.current) throw new Error('Accounts are awaiting Supabase setup.');
  if(locked.current) throw new Error('Please wait for the current request to finish.');
  locked.current=true;setBusy(true);
  try {
   if(mode==='update' && (!recovery || !currentUser.current)) throw new Error('Open a valid password reset link first.');
   const result=await submitEmailAuth(client.current,mode,email,password,window.location.origin);
   if(mode==='update'){setRecovery(false);try{sessionStorage.removeItem('oscar.passwordRecovery');}catch{}}
   if(result.close)setNotice(result.message);
   return result;
  } finally {locked.current=false;setBusy(false);}
 }
 async function signOut() {
  if(!client.current||locked.current)return;
  setBusy(true);locked.current=true;
  try {const {error}=await client.current.auth.signOut({scope:'local'});if(error)throw error;await refresh(null);setNotice('Signed out. Your account collection is saved.');}
  catch {setNotice('Could not sign out. Please try again.');}
  finally {setBusy(false);locked.current=false;}
 }
 async function importGuest() {
  const owner=currentUser.current;
  if(!owner||!client.current||locked.current||!ready||error)return;
  locked.current=true;setBusy(true);
  try {
   for(let i=0;i<guestRef.current.length;i+=100){
    if(currentUser.current?.id!==owner.id) throw new Error('Account changed');
    const {error}=await client.current.from('seen_movies').upsert(guestRef.current.slice(i,i+100).map(m=>toRow(m,owner.id)),{onConflict:'user_id,id',ignoreDuplicates:true});
    if(error)throw error;
   }
   if(currentUser.current?.id===owner.id){await refresh(owner);setNotice('Browser films imported. Your original browser copy is still available.');}
  }catch{setNotice('Import did not finish. Retry safely—existing account films will not be duplicated.');}
  finally{locked.current=false;setBusy(false);}
 }
 return {seen,user,ready,configured,busy,error,notice,recovery,dismissRecovery:()=>{setRecovery(false);try{sessionStorage.removeItem('oscar.passwordRecovery');}catch{}},toggle,authenticate,signOut,importGuest,refresh:()=>window.location.reload(),importCount:guest.filter(m=>!seen.some(s=>s.id===m.id)).length};
}

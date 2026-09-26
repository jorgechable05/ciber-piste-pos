import { createSupabaseBrowser } from './supabase-browser';

export async function openCashSession(openingAmount:number){
 const {data,error}=await createSupabaseBrowser().rpc('open_cash_session',{p_opening_amount:openingAmount});
 if(error) throw error; return Number(data);
}
export async function closeCashSession(sessionId:number,closingAmount:number){
 const {data,error}=await createSupabaseBrowser().rpc('close_cash_session',{p_session_id:sessionId,p_closing_amount:closingAmount});
 if(error) throw error; return Number(data);
}
export async function getOpenCashSession(){
 const {data,error}=await createSupabaseBrowser().from('cash_sessions').select('id,opening_amount,opened_at,status').eq('status','ABIERTA').order('opened_at',{ascending:false}).limit(1).maybeSingle();
 if(error) throw error; return data;
}

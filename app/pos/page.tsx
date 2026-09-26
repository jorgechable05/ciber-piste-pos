'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

type Product = { id:number; nombre:string; codigo_barras:string|null; precio_venta:number; categoria_id:number; stock:number };
type CartItem = Product & { cantidad:number };

export default function PosPage(){
 const supabase=createClient(); const inputRef=useRef<HTMLInputElement>(null);
 const [q,setQ]=useState(''); const [products,setProducts]=useState<Product[]>([]); const [cart,setCart]=useState<CartItem[]>([]); const [loading,setLoading]=useState(false);
 async function search(term=q){ setQ(term); if(!term){setProducts([]);return;} const {data}=await supabase.from('products').select('id,nombre,codigo_barras,precio_venta,categoria_id,inventory(stock_actual)').or(`nombre.ilike.%${term}%,codigo_barras.eq.${term}`).eq('activo',true).limit(20); setProducts((data??[]).map((p:any)=>({...p,stock:Number(p.inventory?.stock_actual??0)}))); }
 useEffect(()=>{inputRef.current?.focus()},[]);
 function add(p:Product){ setCart(c=>{const x=c.find(i=>i.id===p.id);return x?c.map(i=>i.id===p.id?{...i,cantidad:i.cantidad+1}:i):[...c,{...p,cantidad:1}]}); setQ('');setProducts([]);setTimeout(()=>inputRef.current?.focus(),0); }
 const total=cart.reduce((s,i)=>s+i.precio_venta*i.cantidad,0);
 async function checkout(){ if(!cart.length)return; setLoading(true); const {data,error}=await supabase.rpc('create_pos_sale',{p_items:cart.map(i=>({producto_id:i.id,cantidad:i.cantidad})),p_payments:[{metodo:'EFECTIVO',monto:total}]}); if(error) alert(error.message); else {alert(`Venta registrada #${data}`);setCart([])} setLoading(false); }
 return <div className="pos-shell"><section className="pos-main"><header className="pos-header"><div><b>Venta nueva</b><span className="muted"> Escanea o busca un producto</span></div><a href="/">Dashboard</a></header><div className="scanner"><input ref={inputRef} value={q} onChange={e=>search(e.target.value)} placeholder="Escanear código de barras o buscar…" autoFocus /></div>{products.length>0&&<div className="search-results">{products.map(p=><button key={p.id} onClick={()=>add(p)}><span>{p.nombre}</span><b>${p.precio_venta.toFixed(2)}</b><small>Stock: {p.stock}</small></button>)}</div>}<div className="cart">{cart.map(i=><div className="cart-row" key={i.id}><div><b>{i.nombre}</b><small>{i.cantidad} × ${i.precio_venta.toFixed(2)}</small></div><strong>${(i.cantidad*i.precio_venta).toFixed(2)}</strong></div>)}{!cart.length&&<div className="empty">Escanea el primer producto para comenzar</div>}</div></section><aside className="checkout"><h2>Resumen</h2><div className="total"><span>Total</span><strong>${total.toFixed(2)}</strong></div><button className="primary" disabled={!cart.length||loading} onClick={checkout}>{loading?'Procesando…':'Cobrar'}</button></aside></div>
}

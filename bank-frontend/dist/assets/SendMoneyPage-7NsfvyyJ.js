import{d as ee,j as e,c as b,h as x,r as o,t as J,V as te,E as K,v as W,s as G,R as ae,Q as ne,D as oe}from"./index-DMtTuPbv.js";import{u as ie,i as le,F as de,a as k,b as w,c as T,d as A,e as S,o as ce,s as D,t as me}from"./form-Cq0erwy-.js";import{P as ue}from"./PageWrapper-C4sw2_J_.js";import{P as xe}from"./PageHeader-CdVma4Iy.js";import{S as O}from"./StatCard-t4ReUEaV.js";import{S as pe}from"./StatusBadge-C72apJ8m.js";import{I as C}from"./input-FK4rZyug.js";import{S as he,a as fe,b as ge,c as ve,d as be}from"./select-BlDnz9gd.js";import{T as Ne,a as je,b as Z,c as M,d as ye,e as L}from"./table-fL3ui8ma.js";import{B as U}from"./badge-BDlxLpGL.js";import{D as ke,a as we,b as Te,c as Ae}from"./dialog-C0yOHhSt.js";import{S as Y}from"./separator-B6ehA0RN.js";import{f as i,a as B}from"./format-N1OTjWVW.js";import{A as Se}from"./arrow-right-DTh-JSt_.js";import{C as De}from"./copy-DTZfeOKf.js";import{D as Re}from"./download-CnJav4ln.js";import{C as _}from"./circle-check-DLxSjTVD.js";import{C as se}from"./clock-CjL63XOs.js";import{C as Ee}from"./circle-x-CJFLvjX-.js";import{W as $e}from"./wallet-DGgzEw23.js";import{C as Ce}from"./circle-alert-C9Xc7R8u.js";import"./label-dgZUd49Q.js";import"./NumberTicker-CVVJop63.js";import"./LineChart-BingI2mM.js";import"./index-Bez8gClG.js";import"./Combination-BNz4GZPM.js";import"./index-BGhAMuPT.js";import"./chevron-down-BIQypdQN.js";import"./index-DVd0qEqX.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ie=ee("Printer",[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Be=ee("Share2",[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]]);function Fe({transaction:s,open:z,onOpenChange:N,senderBalance:v,receiverBalance:j}){if(!s)return null;const h=s.status==="COMPLETED"||s.status==="SUCCESS",c=s.status==="PENDING"||s.status==="PROCESSING"||s.status==="INITIATED";s.status==="FAILED"||s.status;const R=h?e.jsx(_,{className:"h-8 w-8 text-green-500"}):c?e.jsx(se,{className:"h-8 w-8 text-amber-500"}):e.jsx(Ee,{className:"h-8 w-8 text-red-500"}),f=h?"from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800":c?"from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800":"from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-200 dark:border-red-800",Q=async()=>{var l;try{await navigator.clipboard.writeText(((l=s.transactionId)==null?void 0:l.toString())||""),x.success("Transaction ID copied to clipboard")}catch{x.error("Failed to copy transaction ID")}},a=()=>{try{const l=`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Transaction Receipt - ${s.transactionId}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #333; }
            .header p { margin: 5px 0; color: #666; }
            .status { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
            .status.success { background: #dcfce7; color: #166534; }
            .status.pending { background: #fef3c7; color: #92400e; }
            .status.failed { background: #fee2e2; color: #991b1b; }
            .amount { text-align: center; font-size: 36px; font-weight: bold; margin: 30px 0; color: #333; }
            .section { margin: 30px 0; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .info-label { color: #666; font-weight: 500; }
            .info-value { color: #333; font-weight: 600; }
            .party-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #3b82f6; }
            .party-box.sender { border-left-color: #ef4444; }
            .party-box.receiver { border-left-color: #10b981; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center; color: #666; font-size: 12px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Transaction Receipt</h1>
            <p>${h?"Transfer Completed Successfully":c?"Transfer In Progress":"Transfer Failed"}</p>
            <span class="status ${h?"success":c?"pending":"failed"}">${s.status}</span>
          </div>
          
          <div class="amount">${i(s.amount)}</div>
          
          <div class="section">
            <div class="section-title">Transfer Details</div>
            
            <div class="party-box sender">
              <strong>FROM (SENDER)</strong>
              <div style="margin-top: 10px;">
                <div><strong>Name:</strong> ${s.senderName||"Unknown"}</div>
                <div><strong>Account:</strong> ${s.senderAccountNumber}</div>
                ${s.senderBankName?`<div><strong>Bank:</strong> ${s.senderBankName}</div>`:""}
                ${s.senderEmail?`<div><strong>Email:</strong> ${s.senderEmail}</div>`:""}
                ${v!==void 0?`<div><strong>Balance:</strong> ${i(v)}</div>`:""}
              </div>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">⬇</div>
            
            <div class="party-box receiver">
              <strong>TO (RECEIVER)</strong>
              <div style="margin-top: 10px;">
                <div><strong>Name:</strong> ${s.receiverName||"Unknown"}</div>
                <div><strong>Account:</strong> ${s.receiverAccountNumber}</div>
                ${s.receiverBankName?`<div><strong>Bank:</strong> ${s.receiverBankName}</div>`:""}
                ${s.receiverEmail?`<div><strong>Email:</strong> ${s.receiverEmail}</div>`:""}
                ${j!==void 0?`<div><strong>Balance:</strong> ${i(j)}</div>`:""}
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Transaction Information</div>
            <div class="info-row">
              <span class="info-label">Transaction ID</span>
              <span class="info-value">#${s.transactionId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date & Time</span>
              <span class="info-value">${s.transactionDate?B(s.transactionDate):"N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Transaction Type</span>
              <span class="info-value">Bank Transfer</span>
            </div>
            <div class="info-row">
              <span class="info-label">Currency</span>
              <span class="info-value">INR (₹)</span>
            </div>
            ${s.reversalReason?`
            <div class="info-row">
              <span class="info-label">Reversal Reason</span>
              <span class="info-value" style="color: #dc2626;">${s.reversalReason}</span>
            </div>
            `:""}
          </div>
          
          <div class="footer">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p>For any queries, please contact customer support.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `,m=new Blob([l],{type:"text/html"}),$=URL.createObjectURL(m),y=document.createElement("a");y.href=$,y.download=`receipt-${s.transactionId}-${Date.now()}.html`,document.body.appendChild(y),y.click(),document.body.removeChild(y),URL.revokeObjectURL($),x.success("Receipt downloaded successfully")}catch{x.error("Failed to download receipt")}},E=async()=>{const l=`Transaction Receipt
Amount: ${i(s.amount)}
From: ${s.senderName} (${s.senderAccountNumber})
To: ${s.receiverName} (${s.receiverAccountNumber})
Transaction ID: #${s.transactionId}
Status: ${s.status}
Date: ${s.transactionDate?B(s.transactionDate):"N/A"}`;try{navigator.share?(await navigator.share({title:`Transaction Receipt #${s.transactionId}`,text:l}),x.success("Receipt shared successfully")):(await navigator.clipboard.writeText(l),x.success("Receipt details copied to clipboard"))}catch(m){m.name!=="AbortError"&&x.error("Failed to share receipt")}},q=()=>{try{const l=`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Print Receipt - ${s.transactionId}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
            }
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #333; font-size: 28px; }
            .header p { margin: 5px 0; color: #666; }
            .status { display: inline-block; padding: 8px 16px; border: 2px solid #333; border-radius: 4px; font-weight: bold; margin: 10px 0; }
            .amount { text-align: center; font-size: 42px; font-weight: bold; margin: 30px 0; color: #000; }
            .section { margin: 30px 0; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #ddd; }
            .info-label { color: #666; font-weight: 500; }
            .info-value { color: #000; font-weight: 600; }
            .party-box { border: 2px solid #333; padding: 20px; border-radius: 8px; margin: 15px 0; }
            .party-box strong { display: block; margin-bottom: 10px; font-size: 14px; }
            .party-box > div > div { margin: 8px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center; color: #666; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TRANSACTION RECEIPT</h1>
            <p>${h?"Transfer Completed Successfully":c?"Transfer In Progress":"Transfer Failed"}</p>
            <span class="status">${s.status}</span>
          </div>
          
          <div class="amount">${i(s.amount)}</div>
          
          <div class="section">
            <div class="section-title">TRANSFER DETAILS</div>
            
            <div class="party-box">
              <strong>FROM (SENDER)</strong>
              <div>
                <div><strong>Name:</strong> ${s.senderName||"Unknown"}</div>
                <div><strong>Account Number:</strong> ${s.senderAccountNumber}</div>
                ${s.senderBankName?`<div><strong>Bank:</strong> ${s.senderBankName}</div>`:""}
                ${s.senderEmail?`<div><strong>Email:</strong> ${s.senderEmail}</div>`:""}
                ${v!==void 0?`<div><strong>Balance After Transfer:</strong> ${i(v)}</div>`:""}
              </div>
            </div>
            
            <div class="party-box">
              <strong>TO (RECEIVER)</strong>
              <div>
                <div><strong>Name:</strong> ${s.receiverName||"Unknown"}</div>
                <div><strong>Account Number:</strong> ${s.receiverAccountNumber}</div>
                ${s.receiverBankName?`<div><strong>Bank:</strong> ${s.receiverBankName}</div>`:""}
                ${s.receiverEmail?`<div><strong>Email:</strong> ${s.receiverEmail}</div>`:""}
                ${j!==void 0?`<div><strong>Balance After Transfer:</strong> ${i(j)}</div>`:""}
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">TRANSACTION INFORMATION</div>
            <div class="info-row">
              <span class="info-label">Transaction ID</span>
              <span class="info-value">#${s.transactionId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date & Time</span>
              <span class="info-value">${s.transactionDate?B(s.transactionDate):"N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Transaction Type</span>
              <span class="info-value">Bank Transfer</span>
            </div>
            <div class="info-row">
              <span class="info-label">Currency</span>
              <span class="info-value">Indian Rupee (INR - ₹)</span>
            </div>
            ${s.reversalReason?`
            <div class="info-row">
              <span class="info-label">Reversal Reason</span>
              <span class="info-value">${s.reversalReason}</span>
            </div>
            `:""}
          </div>
          
          <div class="footer">
            <p><strong>This is a computer-generated receipt and does not require a signature.</strong></p>
            <p>For any queries or disputes, please contact customer support with the Transaction ID.</p>
            <p>Printed on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `,m=window.open("","_blank");m?(m.document.write(l),m.document.close(),m.focus(),setTimeout(()=>{m.print(),m.close()},250),x.success("Opening print dialog...")):x.error("Please allow popups to print receipt")}catch{x.error("Failed to print receipt")}};return e.jsx(ke,{open:z,onOpenChange:N,children:e.jsxs(we,{className:"sm:max-w-2xl max-h-[90vh] overflow-y-auto",children:[e.jsx(Te,{children:e.jsxs(Ae,{className:"flex items-center gap-3",children:[R,e.jsxs("div",{children:[e.jsx("div",{className:"text-xl font-bold",children:"Transaction Receipt"}),e.jsx("div",{className:"text-sm font-normal text-muted-foreground",children:h?"Transfer Completed Successfully":c?"Transfer In Progress":"Transfer Failed"})]})]})}),e.jsxs("div",{className:"space-y-6",children:[e.jsx("div",{className:`bg-gradient-to-br ${f} rounded-xl p-6 space-y-4 border-2`,children:e.jsxs("div",{className:"text-center",children:[e.jsx("p",{className:"text-sm text-muted-foreground mb-2",children:"Transaction Amount"}),e.jsx("p",{className:"text-4xl font-bold",children:i(s.amount)}),e.jsx(U,{variant:"outline",className:`mt-3 ${h?"bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300":c?"bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300":"bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`,children:s.status})]})}),e.jsxs("div",{className:"space-y-4",children:[e.jsx("h3",{className:"font-semibold text-lg",children:"Transfer Details"}),e.jsxs("div",{className:"grid gap-4",children:[e.jsxs("div",{className:"bg-muted/50 rounded-lg p-4 space-y-2",children:[e.jsxs("div",{className:"flex items-center gap-2 text-sm font-medium text-muted-foreground",children:[e.jsx("div",{className:"h-2 w-2 rounded-full bg-red-500"}),"FROM (SENDER)"]}),e.jsxs("div",{className:"pl-4 space-y-1",children:[e.jsx("p",{className:"font-semibold",children:s.senderName||"Unknown"}),e.jsx("p",{className:"font-mono text-sm",children:s.senderAccountNumber}),s.senderBankName&&e.jsx("p",{className:"text-sm text-muted-foreground",children:s.senderBankName}),s.senderEmail&&e.jsx("p",{className:"text-xs text-muted-foreground",children:s.senderEmail}),v!==void 0&&e.jsxs("p",{className:"text-sm font-medium text-muted-foreground mt-2",children:["Balance: ",i(v)]})]})]}),e.jsx("div",{className:"flex justify-center",children:e.jsx("div",{className:"bg-primary/10 rounded-full p-3",children:e.jsx(Se,{className:"h-6 w-6 text-primary"})})}),e.jsxs("div",{className:"bg-muted/50 rounded-lg p-4 space-y-2",children:[e.jsxs("div",{className:"flex items-center gap-2 text-sm font-medium text-muted-foreground",children:[e.jsx("div",{className:"h-2 w-2 rounded-full bg-green-500"}),"TO (RECEIVER)"]}),e.jsxs("div",{className:"pl-4 space-y-1",children:[e.jsx("p",{className:"font-semibold",children:s.receiverName||"Unknown"}),e.jsx("p",{className:"font-mono text-sm",children:s.receiverAccountNumber}),s.receiverBankName&&e.jsx("p",{className:"text-sm text-muted-foreground",children:s.receiverBankName}),s.receiverEmail&&e.jsx("p",{className:"text-xs text-muted-foreground",children:s.receiverEmail}),j!==void 0&&e.jsxs("p",{className:"text-sm font-medium text-muted-foreground mt-2",children:["Balance: ",i(j)]})]})]})]})]}),e.jsx(Y,{}),e.jsxs("div",{className:"space-y-4",children:[e.jsx("h3",{className:"font-semibold text-lg",children:"Transaction Information"}),e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-muted-foreground mb-1",children:"Transaction ID"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("p",{className:"font-mono font-medium",children:["#",s.transactionId]}),e.jsx(b,{variant:"ghost",size:"sm",className:"h-6 w-6 p-0",onClick:Q,children:e.jsx(De,{className:"h-3 w-3"})})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-muted-foreground mb-1",children:"Date & Time"}),e.jsx("p",{className:"font-medium",children:s.transactionDate?B(s.transactionDate):"N/A"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-muted-foreground mb-1",children:"Transaction Type"}),e.jsx("p",{className:"font-medium",children:"Bank Transfer"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-muted-foreground mb-1",children:"Currency"}),e.jsx("p",{className:"font-medium",children:"INR (₹)"})]}),s.reversalReason&&e.jsxs("div",{className:"col-span-2",children:[e.jsx("p",{className:"text-sm text-muted-foreground mb-1",children:"Reversal Reason"}),e.jsx("p",{className:"font-medium text-red-600",children:s.reversalReason})]})]})]}),e.jsx(Y,{}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsxs(b,{variant:"outline",size:"sm",onClick:a,children:[e.jsx(Re,{className:"h-4 w-4 mr-2"}),"Download PDF"]}),e.jsxs(b,{variant:"outline",size:"sm",onClick:E,children:[e.jsx(Be,{className:"h-4 w-4 mr-2"}),"Share"]}),e.jsxs(b,{variant:"outline",size:"sm",onClick:q,children:[e.jsx(Ie,{className:"h-4 w-4 mr-2"}),"Print"]})]}),e.jsx(Y,{}),e.jsxs("div",{className:"text-center space-y-2",children:[e.jsx("p",{className:"text-xs text-muted-foreground",children:"This is a computer-generated receipt and does not require a signature."}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"For any queries, please contact customer support."})]}),e.jsxs("div",{className:"flex justify-end gap-2",children:[e.jsx(b,{variant:"outline",onClick:()=>N(!1),children:"Close"}),e.jsxs(b,{onClick:()=>N(!1),className:h?"bg-green-600 hover:bg-green-700":"",children:[e.jsx(_,{className:"h-4 w-4 mr-2"}),"Done"]})]})]})]})})}const Pe=ce({senderAccount:D().min(1,"Select sender account"),receiverAccount:D().min(1,"Enter receiver account number"),receiverName:D().optional(),receiverBank:D().optional(),receiverIfsc:D().optional(),amount:D().min(1,"Amount is required").refine(s=>!Number.isNaN(Number(s))&&Number(s)>0,"Amount must be greater than 0"),note:D().optional()}).refine(s=>s.senderAccount!==s.receiverAccount,{message:"Sender and receiver cannot be the same",path:["receiverAccount"]});function us(){const[s,z]=o.useState([]),[N,v]=o.useState([]),[j,h]=o.useState([]),[c,R]=o.useState(!1),[f,Q]=o.useState("all"),[a,E]=o.useState(null),[q,l]=o.useState(!1),[m,$]=o.useState(!1),[y,X]=o.useState(null),n=ie({resolver:me(Pe),defaultValues:{senderAccount:"",receiverAccount:"",receiverName:"",receiverBank:"",receiverIfsc:"",amount:"",note:""}}),F=le({control:n.control,name:"receiverAccount"}),P=o.useCallback(async()=>{R(!0);try{const[r,t,p]=await Promise.all([J.getMy(),te.getMy(),K.getMy().catch(()=>[])]);z(r),h(t);const u=new Set(r.map(g=>g.accountNumber)),d=p.map(g=>({...g,direction:g.senderAccountNumber&&u.has(g.senderAccountNumber)?"SENT":"RECEIVED"}));v(d)}catch(r){console.error(r),x.error(W(r,"Failed to load data"))}finally{R(!1)}},[]);o.useEffect(()=>{P()},[P]),o.useMemo(()=>{const r=new Map;return s.forEach(t=>r.set(t.bankName,(r.get(t.bankName)||0)+1)),Array.from(r.keys())},[s]);const V=o.useMemo(()=>f==="all"?s:s.filter(r=>r.bankName===f),[s,f]),I=o.useMemo(()=>{if(f==="all")return N;const r=new Set(V.map(t=>t.accountNumber));return N.filter(t=>r.has(t.senderAccountNumber)||r.has(t.receiverAccountNumber))},[N,f,V]),H=o.useMemo(()=>{const r=I.filter(d=>d.status==="COMPLETED"||d.status==="SUCCESS"),t=r.filter(d=>d.direction==="SENT").reduce((d,g)=>d+(g.amount||0),0),p=r.filter(d=>d.direction==="RECEIVED").reduce((d,g)=>d+(g.amount||0),0),u=I.filter(d=>d.status==="PENDING").length;return{sent:t,received:p,pending:u}},[I]),re=async r=>{var t;try{if(R(!0),!(a!=null&&a.valid)||!r.receiverAccount){x.error("Please enter a valid receiver account number");return}const p=await K.create({senderAccount:r.senderAccount,receiverAccount:r.receiverAccount,amount:parseFloat(r.amount),senderBankName:(t=s.find(u=>u.accountNumber===r.senderAccount))==null?void 0:t.bankName,receiverBankName:r.receiverBank});X(p),$(!0),n.reset(),E(null),P()}catch(p){x.error(W(p,"Transfer failed"))}finally{R(!1)}};return o.useEffect(()=>{const r=F==null?void 0:F.trim();if(!r||r.length<5){E(null),n.setValue("receiverName","",{shouldValidate:!0,shouldDirty:!0}),n.setValue("receiverBank","",{shouldValidate:!0,shouldDirty:!0}),n.setValue("receiverIfsc","",{shouldValidate:!0,shouldDirty:!0});return}let t=!0;const p=window.setTimeout(async()=>{try{l(!0);const u=await J.lookupByAccountNumber(r);if(!t)return;E(u),u.valid?(n.setValue("receiverName",u.accountHolderName||"",{shouldValidate:!0,shouldDirty:!0}),n.setValue("receiverBank",u.bankName||"",{shouldValidate:!0,shouldDirty:!0}),n.setValue("receiverIfsc",u.ifscCode||"",{shouldValidate:!0,shouldDirty:!0})):(n.setValue("receiverName","",{shouldValidate:!0,shouldDirty:!0}),n.setValue("receiverBank","",{shouldValidate:!0,shouldDirty:!0}),n.setValue("receiverIfsc","",{shouldValidate:!0,shouldDirty:!0}))}catch(u){if(!t)return;E({valid:!1,message:W(u,"Unable to find account"),matchedAccountCount:0}),n.setValue("receiverName","",{shouldValidate:!0,shouldDirty:!0}),n.setValue("receiverBank","",{shouldValidate:!0,shouldDirty:!0}),n.setValue("receiverIfsc","",{shouldValidate:!0,shouldDirty:!0})}finally{t&&l(!1)}},500);return()=>{t=!1,window.clearTimeout(p)}},[F,n]),e.jsxs(ue,{children:[e.jsx(xe,{title:"Send Money",subtitle:"Bank transfer to any account",icon:e.jsx(G,{className:"h-5 w-5"}),actions:e.jsxs(b,{variant:"outline",size:"sm",onClick:P,disabled:c,children:[e.jsx(ae,{className:`h-4 w-4 mr-2 ${c?"animate-spin":""}`}),"Refresh"]})}),c?e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6",children:Array.from({length:4}).map((r,t)=>e.jsx(ne,{},t))}):e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6",children:[e.jsx(O,{title:"Available Balance",value:i(V.reduce((r,t)=>r+t.balance,0)),icon:e.jsx($e,{className:"h-5 w-5"}),tint:"emerald"}),e.jsx(O,{title:"Total Sent",value:i(H.sent),icon:e.jsx(G,{className:"h-5 w-5"}),tint:"rose"}),e.jsx(O,{title:"Total Received",value:i(H.received),icon:e.jsx(_,{className:"h-5 w-5"}),tint:"emerald"}),e.jsx(O,{title:"Pending",value:H.pending,subtitle:"Transactions",icon:e.jsx(se,{className:"h-5 w-5"}),tint:"amber"})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6 items-start",children:[e.jsxs("div",{className:"glass-panel rounded-2xl p-5",children:[e.jsx("div",{className:"flex items-center justify-between mb-4",children:e.jsxs("div",{children:[e.jsx("h2",{className:"text-lg font-semibold",children:"Transfer composer"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Prepare and validate the transfer before sending."})]})}),e.jsx(de,{...n,children:e.jsxs("form",{onSubmit:n.handleSubmit(re),className:"space-y-6",children:[e.jsxs("div",{className:"rounded-2xl border border-border/70 bg-muted/20 p-4",children:[e.jsx("p",{className:"text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",children:"Step 1"}),e.jsx("div",{className:"mt-3",children:e.jsx(k,{control:n.control,name:"senderAccount",render:({field:r})=>e.jsxs(w,{children:[e.jsx(T,{children:"Funding Account"}),e.jsx(A,{children:e.jsxs(he,{onValueChange:r.onChange,value:r.value,children:[e.jsx(fe,{children:e.jsx(ge,{placeholder:"Select your account"})}),e.jsx(ve,{children:V.map(t=>e.jsx(be,{value:t.accountNumber,children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"font-mono",children:t.accountNumber}),e.jsxs("span",{className:"text-muted-foreground",children:["(",t.bankName,")"]}),e.jsx(U,{variant:"secondary",children:i(t.balance)})]})},t.accountNumber))})]})}),e.jsx(S,{})]})})})]}),e.jsxs("div",{className:"rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",children:"Step 2"}),e.jsx("p",{className:"text-sm font-semibold",children:"Receiver verification"})]}),e.jsx(k,{control:n.control,name:"receiverAccount",render:({field:r})=>e.jsxs(w,{children:[e.jsx(T,{children:"Receiver Account Number"}),e.jsx(A,{children:e.jsx(C,{placeholder:"Enter receiver account number",...r})}),e.jsx(S,{})]})}),e.jsxs("div",{className:"rounded-xl border border-border/70 bg-background p-4 space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold",children:"Lookup status"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Instant validation to reduce failed transfers."})]}),e.jsx(U,{variant:a!=null&&a.valid?"default":"secondary",children:q?"Searching":a!=null&&a.valid?"Matched":"Awaiting"})]}),e.jsx("div",{className:"text-sm text-muted-foreground",children:(a==null?void 0:a.message)||"Type an account number to lookup receiver details."}),a!=null&&a.valid?e.jsxs("div",{className:"grid gap-1 text-sm",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-medium",children:"Holder:"})," ",a.accountHolderName]}),e.jsxs("div",{children:[e.jsx("span",{className:"font-medium",children:"Bank:"})," ",a.bankName]}),e.jsxs("div",{children:[e.jsx("span",{className:"font-medium",children:"IFSC:"})," ",a.ifscCode]}),e.jsxs("div",{children:[e.jsx("span",{className:"font-medium",children:"Account:"})," ",a.accountNumber]})]}):null]}),e.jsxs("div",{className:"grid grid-cols-1 gap-4 md:grid-cols-3",children:[e.jsx(k,{control:n.control,name:"receiverName",render:({field:r})=>e.jsxs(w,{children:[e.jsx(T,{children:"Receiver Name"}),e.jsx(A,{children:e.jsx(C,{placeholder:"Auto-populated from account lookup",...r,readOnly:!0,className:"bg-muted/40"})}),e.jsx(S,{})]})}),e.jsx(k,{control:n.control,name:"receiverBank",render:({field:r})=>e.jsxs(w,{children:[e.jsx(T,{children:"Receiver Bank"}),e.jsx(A,{children:e.jsx(C,{placeholder:"Auto-populated from account lookup",...r,readOnly:!0,className:"bg-muted/40"})}),e.jsx(S,{})]})}),e.jsx(k,{control:n.control,name:"receiverIfsc",render:({field:r})=>e.jsxs(w,{children:[e.jsx(T,{children:"Receiver IFSC"}),e.jsx(A,{children:e.jsx(C,{placeholder:"Auto-populated from account lookup",...r,readOnly:!0,className:"bg-muted/40"})}),e.jsx(S,{})]})})]})]}),e.jsxs("div",{className:"rounded-2xl border border-border/70 bg-muted/20 p-4",children:[e.jsx("p",{className:"text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",children:"Step 3"}),e.jsxs("div",{className:"mt-4 grid grid-cols-1 gap-4 md:grid-cols-3",children:[e.jsx(k,{control:n.control,name:"amount",render:({field:r})=>e.jsxs(w,{children:[e.jsx(T,{children:"Amount"}),e.jsx(A,{children:e.jsx(C,{type:"number",min:"1",step:"0.01",placeholder:"0.00",...r})}),e.jsx(S,{})]})}),e.jsx(k,{control:n.control,name:"note",render:({field:r})=>e.jsxs(w,{className:"md:col-span-2",children:[e.jsx(T,{children:"Note (Optional)"}),e.jsx(A,{children:e.jsx(C,{placeholder:"Add a note for this transfer",...r})}),e.jsx(S,{})]})})]})]}),e.jsxs(b,{type:"submit",className:"w-full",disabled:c||!(a!=null&&a.valid),children:[e.jsx(G,{className:"mr-2 h-4 w-4"}),"Send Money"]})]})})]}),e.jsxs("div",{className:"glass-panel rounded-2xl p-5",children:[e.jsxs("div",{className:"flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-lg font-semibold",children:"Recent transfers"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Your latest activity across accounts."})]}),f!=="all"&&e.jsx(U,{variant:"outline",children:f})]}),c?e.jsx(oe,{columns:4,rows:5}):I.length===0?e.jsxs("div",{className:"text-center py-8 text-muted-foreground",children:[e.jsx(Ce,{className:"mx-auto mb-3 h-12 w-12 opacity-50"}),e.jsx("p",{children:"No transfers found"})]}):e.jsx("div",{className:"flex-1 overflow-auto",children:e.jsxs(Ne,{children:[e.jsx(je,{children:e.jsxs(Z,{children:[e.jsx(M,{children:"Date"}),e.jsx(M,{children:"Direction"}),e.jsx(M,{className:"text-right",children:"Amount"}),e.jsx(M,{children:"Status"})]})}),e.jsx(ye,{children:I.slice(0,10).map(r=>{const t=r.direction==="SENT",p=t?r.receiverName:r.senderName;return e.jsxs(Z,{className:"cursor-pointer hover:bg-muted/50",onClick:()=>{X(r),$(!0)},children:[e.jsx(L,{className:"text-xs",children:r.transactionDate?B(r.transactionDate):"-"}),e.jsx(L,{children:e.jsxs("div",{className:"flex flex-col",children:[e.jsx("span",{className:`text-xs font-medium ${t?"text-rose-600":"text-emerald-600"}`,children:t?"Sent to":"Received from"}),e.jsx("span",{className:"text-xs text-muted-foreground",children:p})]})}),e.jsxs(L,{className:`text-right font-mono font-semibold ${t?"text-rose-600":"text-emerald-600"}`,children:[t?"-":"+",i(r.amount)]}),e.jsx(L,{children:e.jsx(pe,{status:r.status})})]},r.transactionId)})})]})})]})]}),e.jsx(Fe,{transaction:y,open:m,onOpenChange:$})]})}export{us as default};

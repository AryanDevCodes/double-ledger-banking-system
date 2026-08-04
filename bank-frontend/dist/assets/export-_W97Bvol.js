import{d as b,j as n,c as x,F as h}from"./index-DMtTuPbv.js";import{D as u,a as f,b as g,e as p,d as w}from"./dropdown-menu-CHSoHsQs.js";import{D as y}from"./download-CnJav4ln.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=b("FileSpreadsheet",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 17h2",key:"10kma7"}]]);function C({onExport:t,disabled:r,label:i="Export"}){return n.jsxs(u,{children:[n.jsx(f,{asChild:!0,children:n.jsxs(x,{variant:"outline",size:"sm",disabled:r,children:[n.jsx(y,{className:"h-4 w-4 mr-2"}),i]})}),n.jsxs(g,{align:"end",children:[n.jsxs(p,{onClick:()=>t("csv"),children:[n.jsx(h,{className:"h-4 w-4 mr-2"})," Export as CSV"]}),n.jsxs(p,{onClick:()=>t("excel"),children:[n.jsx(j,{className:"h-4 w-4 mr-2"})," Export as Excel"]}),n.jsx(w,{}),n.jsxs(p,{onClick:()=>t("pdf"),children:[n.jsx(h,{className:"h-4 w-4 mr-2"})," Export as PDF"]})]})]})}function D(t,r,i){if(t.length===0)throw new Error("No data to export");const s=Object.keys(t[0]).map(a=>({key:a,label:a})),l=s.map(a=>`"${a.label}"`).join(","),e=t.map(a=>s.map(d=>{const c=a[d.key];return c==null?'""':typeof c=="object"?`"${JSON.stringify(c)}"`:`"${String(c).replace(/"/g,'""')}"`}).join(",")),o=[l,...e].join(`
`);m(o,r,"text/csv")}function M(t,r,i="Sheet1",s){if(t.length===0)throw new Error("No data to export");const l=Object.keys(t[0]).map(o=>({key:o,label:o})),e=`
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; }
          th { background-color: #4472C4; color: white; font-weight: bold; padding: 8px; border: 1px solid #ddd; }
          td { padding: 6px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${l.map(o=>`<th>${o.label}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${t.map(o=>`<tr>${l.map(a=>{const d=o[a.key];return`<td>${d!=null?String(d):""}</td>`}).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;m(e,r.replace(/\.xlsx?$/,"")+".xls","application/vnd.ms-excel")}function S(t,r,i){if(t.length===0)throw new Error("No data to export");const s=Object.keys(t[0]).map(o=>({key:o,label:o})),l=`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${r}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 {
            color: #333;
            border-bottom: 3px solid #4472C4;
            padding-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 11px;
          }
          th {
            background-color: #4472C4;
            color: white;
            font-weight: bold;
            padding: 10px;
            text-align: left;
            border: 1px solid #2d5aa0;
          }
          td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 10px;
          }
          .print-btn {
            margin-bottom: 20px;
            padding: 10px 20px;
            background-color: #4472C4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          .print-btn:hover {
            background-color: #2d5aa0;
          }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
        <h1>${r}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              ${s.map(o=>`<th>${o.label}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${t.map(o=>`<tr>${s.map(a=>{const d=o[a.key];return`<td>${d!=null?String(d):""}</td>`}).join("")}</tr>`).join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>Total Records: ${t.length}</p>
          <p>Bank Management System - Confidential</p>
        </div>
      </body>
    </html>
  `,e=window.open("","_blank");e?(e.document.write(l),e.document.close()):alert("Please allow popups to generate PDF")}function m(t,r,i){const s=new Blob([t],{type:i}),l=URL.createObjectURL(s),e=document.createElement("a");e.href=l,e.download=r,document.body.appendChild(e),e.click(),document.body.removeChild(e),URL.revokeObjectURL(l)}export{C as E,M as a,S as b,D as e};

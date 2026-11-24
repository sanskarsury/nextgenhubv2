import { supabase, isConfigured } from "./config.js";
const $ = (selector) => document.querySelector(selector);
const say = (message) => { $("#dashboard-status").textContent = message; };
const dialog = $("#editor-dialog");
let currentUser = null;
let editorType = "services";
let settingsCache = {};

function cell(row, value, className) {
  const td = document.createElement("td");
  td.textContent = value ?? "";
  if (className) td.className = className;
  row.append(td); return td;
}
function actionButton(label, className, handler) {
  const button = document.createElement("button"); button.type = "button"; button.textContent = label;
  if (className) button.className = className; button.addEventListener("click", handler); return button;
}
function dateLabel(value) { return value ? new Date(value).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}) : "—"; }
function setView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === `view-${name}`));
  document.querySelectorAll(".side-link[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  const labels = {overview:["WORKSPACE / OVERVIEW","Dashboard"],services:["CONTENT / SERVICES","Services"],projects:["CONTENT / PORTFOLIO","Portfolio projects"],inquiries:["CLIENT MESSAGES","Inquiries"],settings:["CONFIGURATION","Site settings"]};
  $("#page-kicker").textContent = labels[name][0]; $("#page-title").textContent = labels[name][1];
  if (name === "services") loadServices(); if (name === "projects") loadProjects(); if (name === "inquiries") loadInquiries(); if (name === "settings") loadSettings();
}
async function requireAdmin() {
  if (!isConfigured) { say("Setup required: add the Supabase project URL and publishable key in js/config.js."); return false; }
  const {data:{user},error} = await supabase.auth.getUser();
  if (error || !user) { window.location.href = "login.html"; return false; }
  currentUser = user; $("#admin-email").textContent = user.email || "Administrator";
  const {data:profile,error:profileError} = await supabase.from("profiles").select("is_admin").eq("id",user.id).maybeSingle();
  if (profileError || profile?.is_admin !== true) { say("This account is not authorized as the administrator."); await supabase.auth.signOut(); return false; }
  return true;
}
async function loadOverview() {
  const results = await Promise.all([
    supabase.from("inquiries").select("id,status,name,email,service,created_at",{count:"exact"}).order("created_at",{ascending:false}).limit(5),
    supabase.from("inquiries").select("id",{count:"exact",head:true}).eq("status","new"),
    supabase.from("services").select("id",{count:"exact",head:true}).eq("active",true),
    supabase.from("projects").select("id",{count:"exact",head:true}).eq("active",true)
  ]);
  const [inq,newInq,services,projects] = results;
  if (inq.error || newInq.error || services.error || projects.error) { say("Some dashboard statistics could not be loaded. Check your Supabase tables and RLS policies."); return; }
  $("#stat-total").textContent = inq.count ?? 0; $("#stat-new").textContent = newInq.count ?? 0;
  $("#stat-services").textContent = services.count ?? 0; $("#stat-projects").textContent = projects.count ?? 0;
  $("#nav-new-count").textContent = newInq.count ?? 0;
  const tbody = $("#recent-inquiries"); tbody.replaceChildren();
  if (!inq.data?.length) { const tr=document.createElement("tr"); const td=cell(tr,"No inquiries received yet."); td.colSpan=5; tbody.append(tr); return; }
  for (const item of inq.data) {
    const tr=document.createElement("tr"); cell(tr,item.name); cell(tr,item.service); cell(tr,dateLabel(item.created_at));
    const status=cell(tr,""); const pill=document.createElement("span"); pill.className=`pill ${item.status === "new" ? "new" : ""}`; pill.textContent=item.status; status.append(pill);
    const actions=cell(tr,""); actions.append(actionButton("Open","",()=>setView("inquiries"))); tbody.append(tr);
  }
}
async function loadServices() {
  const tbody=$("#services-body"); tbody.replaceChildren();
  const {data,error}=await supabase.from("services").select("*").order("created_at",{ascending:false});
  if(error){say("Could not load services. Verify the services table and admin RLS policy.");return;}
  if(!data.length){const tr=document.createElement("tr");const td=cell(tr,"No services yet. Add your first service.");td.colSpan=5;tbody.append(tr);return;}
  for(const item of data){const tr=document.createElement("tr");cell(tr,item.title);cell(tr,item.description);const vis=cell(tr,"");const pill=document.createElement("span");pill.className=`pill ${item.active?"active":"inactive"}`;pill.textContent=item.active?"Published":"Hidden";vis.append(pill);cell(tr,dateLabel(item.created_at));const actions=cell(tr,"");actions.className="row-actions";actions.append(actionButton("Edit","",()=>openEditor("services",item)),actionButton(item.active?"Hide":"Publish","",()=>toggleActive("services",item)),actionButton("Delete","danger",()=>deleteRecord("services",item)));tbody.append(tr);}
}
async function loadProjects() {
  const tbody=$("#projects-body");tbody.replaceChildren();
  const {data,error}=await supabase.from("projects").select("*").order("created_at",{ascending:false});
  if(error){say("Could not load projects. Verify the projects table and admin RLS policy.");return;}
  if(!data.length){const tr=document.createElement("tr");const td=cell(tr,"No portfolio projects yet. Add your first project.");td.colSpan=5;tbody.append(tr);return;}
  for(const item of data){const tr=document.createElement("tr");const name=cell(tr,item.title);if(item.project_url){const link=document.createElement("a");link.href=item.project_url;link.target="_blank";link.rel="noreferrer";link.textContent=" ↗";link.className="muted-cell";name.append(link);}cell(tr,item.description);const vis=cell(tr,"");const pill=document.createElement("span");pill.className=`pill ${item.active?"active":"inactive"}`;pill.textContent=item.active?"Published":"Hidden";vis.append(pill);cell(tr,dateLabel(item.created_at));const actions=cell(tr,"");actions.className="row-actions";actions.append(actionButton("Edit","",()=>openEditor("projects",item)),actionButton(item.active?"Hide":"Publish","",()=>toggleActive("projects",item)),actionButton("Delete","danger",()=>deleteRecord("projects",item)));tbody.append(tr);}
}
async function loadInquiries() {
  const tbody=$("#inquiries-body");tbody.replaceChildren();
  const {data,error}=await supabase.from("inquiries").select("*").order("created_at",{ascending:false}).limit(200);
  if(error){say("Could not load inquiries. Verify admin access and RLS policies.");return;}
  $("#nav-new-count").textContent=data.filter(x=>x.status==="new").length;
  if(!data.length){const tr=document.createElement("tr");const td=cell(tr,"No inquiries received yet.");td.colSpan=6;tbody.append(tr);return;}
  for(const item of data){const tr=document.createElement("tr");cell(tr,item.name);const email=cell(tr,"");const mail=document.createElement("a");mail.href=`mailto:${encodeURIComponent(item.email)}`;mail.textContent=item.email;mail.className="email-link";email.append(mail);cell(tr,item.service);cell(tr,item.message);const status=cell(tr,"");const pill=document.createElement("span");pill.className=`pill ${item.status==="new"?"new":""}`;pill.textContent=item.status;status.append(pill);const actions=cell(tr,"");actions.className="row-actions";actions.append(actionButton(item.status==="new"?"Mark read":"Mark new","",()=>updateInquiry(item.id,item.status==="new"?"read":"new")),actionButton("Delete","danger",()=>deleteInquiry(item.id)));tbody.append(tr);}
}
async function updateInquiry(id,status){const {error}=await supabase.from("inquiries").update({status}).eq("id",id);if(error){say("Unable to update inquiry status.");return;}say("Inquiry updated.");await Promise.all([loadInquiries(),loadOverview()]);}
async function deleteInquiry(id){if(!confirm("Delete this inquiry permanently? This cannot be undone."))return;const {error}=await supabase.from("inquiries").delete().eq("id",id);if(error){say("Unable to delete inquiry.");return;}say("Inquiry deleted.");await Promise.all([loadInquiries(),loadOverview()]);}
async function toggleActive(table,item){const {error}=await supabase.from(table).update({active:!item.active}).eq("id",item.id);if(error){say("Unable to change publishing status.");return;}say("Publishing status updated.");table==="services"?await loadServices():await loadProjects();await loadOverview();}
async function deleteRecord(table,item){if(!confirm(`Delete “${item.title}” permanently?`))return;const {error}=await supabase.from(table).delete().eq("id",item.id);if(error){say("Unable to delete this item.");return;}say("Item deleted.");table==="services"?await loadServices():await loadProjects();await loadOverview();}
function openEditor(type,item=null){editorType=type;const form=$("#editor-form");form.reset();form.elements.id.value=item?.id??"";form.elements.title.value=item?.title??"";form.elements.description.value=item?.description??"";form.elements.active.checked=item?.active??true;const isProject=type==="projects";$("#project-fields").classList.toggle("hidden",!isProject);form.elements.image_url.value=item?.image_url??"";form.elements.project_url.value=item?.project_url??"";$("#editor-kicker").textContent=isProject?"PORTFOLIO CONTENT":"SERVICE CONTENT";$("#editor-title").textContent=`${item?"Edit":"Add"} ${isProject?"project":"service"}`;$("#editor-feedback").textContent="";dialog.showModal();}
async function saveEditor(event){event.preventDefault();const form=event.currentTarget;const isProject=editorType==="projects";const payload={title:form.elements.title.value.trim(),description:form.elements.description.value.trim(),active:form.elements.active.checked};if(isProject){payload.image_url=form.elements.image_url.value.trim()||null;payload.project_url=form.elements.project_url.value.trim()||null;}const id=form.elements.id.value;const query=id?supabase.from(editorType).update(payload).eq("id",id):supabase.from(editorType).insert(payload);const {error}=await query;if(error){$("#editor-feedback").textContent="Save failed. Check the entered URLs and database policies.";console.error(error);return;}dialog.close();say(`${isProject?"Project":"Service"} saved.`);isProject?await loadProjects():await loadServices();await loadOverview();}
async function loadSettings(){const {data,error}=await supabase.from("site_settings").select("setting_key,setting_value");if(error){say("Could not load website settings.");return;}settingsCache=Object.fromEntries(data.map(x=>[x.setting_key,x.setting_value]));const form=$("#settings-form");for(const key of ["business_name","contact_email","phone","tagline","about_text","social_url"])form.elements[key].value=settingsCache[key]??"";}
async function saveSettings(event){event.preventDefault();const form=event.currentTarget;const keys=["business_name","contact_email","phone","tagline","about_text","social_url"];const rows=keys.map(key=>({setting_key:key,setting_value:form.elements[key].value.trim(),updated_at:new Date().toISOString()}));const {error}=await supabase.from("site_settings").upsert(rows,{onConflict:"setting_key"});$("#settings-feedback").textContent=error?"Could not save settings. Check admin permissions.":"Website settings saved.";if(error)console.error(error);}

for(const button of document.querySelectorAll(".side-link[data-view]"))button.addEventListener("click",()=>setView(button.dataset.view));
for(const button of document.querySelectorAll("[data-go]"))button.addEventListener("click",()=>setView(button.dataset.go));
$("#add-service").addEventListener("click",()=>openEditor("services"));$("#add-project").addEventListener("click",()=>openEditor("projects"));
$("#editor-form").addEventListener("submit",saveEditor);$("#close-editor").addEventListener("click",()=>dialog.close());$("#cancel-editor").addEventListener("click",()=>dialog.close());
$("#settings-form").addEventListener("submit",saveSettings);$("#refresh-inquiries").addEventListener("click",loadInquiries);
$("#logout").addEventListener("click",async()=>{await supabase.auth.signOut();window.location.href="login.html";});
if(await requireAdmin()){await loadOverview();}

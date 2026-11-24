import { supabase, isConfigured } from "./config.js";

document.querySelector("#year").textContent = new Date().getFullYear();
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
toggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});

function addText(parent, tag, text, className) {
  const node = document.createElement(tag); node.textContent = text || "";
  if (className) node.className = className; parent.append(node); return node;
}
async function loadPublishedContent() {
  if (!isConfigured) return;
  const [servicesResult, projectsResult, settingsResult] = await Promise.all([
    supabase.from("services").select("id,title,description").eq("active", true).order("created_at", {ascending:true}),
    supabase.from("projects").select("id,title,description,image_url,project_url").eq("active", true).order("created_at", {ascending:false}),
    supabase.from("site_settings").select("setting_key,setting_value")
  ]);
  if (!servicesResult.error && servicesResult.data?.length) {
    const container = document.querySelector("#services-list"); container.replaceChildren();
    servicesResult.data.forEach((item,index) => {
      const card=document.createElement("article");card.className="service-card";
      addText(card,"span",`${String(index+1).padStart(2,"0")} / SERVICE`,"card-number");
      addText(card,"div",["✳","⌘","↗"][index%3],"card-icon");
      addText(card,"h3",item.title);addText(card,"p",item.description);container.append(card);
    });
  }
  if (!projectsResult.error && projectsResult.data?.length) {
    const container=document.querySelector("#projects-list");container.replaceChildren();
    projectsResult.data.forEach((item,index)=>{
      const card=document.createElement("article");card.className=`work-card ${index%2?"work-two":"work-one"}`;
      const art=document.createElement("div");art.className="work-art";
      if(item.image_url){const img=document.createElement("img");img.src=item.image_url;img.alt=item.title;img.loading="lazy";art.append(img);}
      addText(art,"span",String(index+1).padStart(2,"0"));addText(art,"strong",item.title);card.append(art);
      const meta=document.createElement("div");meta.className="work-meta";addText(meta,"h3",item.description||item.title);
      if(item.project_url){const link=document.createElement("a");link.href=item.project_url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="VIEW PROJECT ↗";meta.append(link);}
      else addText(meta,"span","SELECTED WORK");
      card.append(meta);container.append(card);
    });
  }
  if (!settingsResult.error) {
    const settings=Object.fromEntries((settingsResult.data||[]).map(x=>[x.setting_key,x.setting_value]));
    if(settings.business_name){document.querySelectorAll(".brand").forEach(el=>{const mark=el.querySelector(".brand-mark");el.replaceChildren();if(mark)el.append(mark);el.append(document.createTextNode(` ${settings.business_name}`));});document.title=`${settings.business_name} | Web Development Agency`;}
    if(settings.contact_email){const emailLink=document.querySelector(".contact-note a[href^='mailto:']");if(emailLink){emailLink.href=`mailto:${settings.contact_email}`;emailLink.textContent=settings.contact_email;}}
    if(settings.about_text){const about=document.querySelector("#about > p:not(.eyebrow)");if(about)about.textContent=settings.about_text;}
    if(settings.tagline){const heroLead=document.querySelector(".hero .lead");if(heroLead)heroLead.textContent=settings.tagline;}
    if(settings.phone){const note=document.querySelector(".contact-note");if(note){const phone=document.createElement("span");phone.textContent=`Phone: ${settings.phone}`;note.append(document.createElement("br"),phone);}}
    if(settings.social_url){const footer=document.querySelector(".footer");const social=document.createElement("a");social.href=settings.social_url;social.target="_blank";social.rel="noopener noreferrer";social.textContent="Social ↗";footer.append(social);}
  }
}
loadPublishedContent();

const form = document.querySelector("#contact-form");
const status = document.querySelector("#form-status");
form?.addEventListener("submit", async (event) => {
  event.preventDefault(); status.textContent = "";
  if (!isConfigured) { status.textContent = "Contact form setup required. Please try again later."; return; }
  const data = new FormData(form);
  const inquiry = {name:String(data.get("name")||"").trim(),email:String(data.get("email")||"").trim(),service:String(data.get("service")||""),message:String(data.get("message")||"").trim()};
  if (!inquiry.name || !inquiry.email || !inquiry.message) { status.textContent = "Please complete all required fields."; return; }
  const { error } = await supabase.from("inquiries").insert(inquiry);
  if (error) { status.textContent = "We couldn't submit your message. Please try again later."; console.error(error); return; }
  form.reset(); status.textContent = "Thanks! Your inquiry has been sent.";
});

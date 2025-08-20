(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function n(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(o){if(o.ep)return;o.ep=!0;const r=n(o);fetch(o.href,r)}})();document.addEventListener("DOMContentLoaded",function(){m(),h(),p(),g(),y(),v(),x(),T()});function m(){const e=document.querySelectorAll(".slide"),t=document.querySelector(".hero .prev-btn"),n=document.querySelector(".hero .next-btn");let i=0;if(e.length===0)return;function o(c){e.forEach(l=>l.classList.remove("active")),e[c].classList.add("active")}function r(){i=(i+1)%e.length,o(i)}function s(){i=(i-1+e.length)%e.length,o(i)}n&&n.addEventListener("click",r),t&&t.addEventListener("click",s),setInterval(r,5e3)}function h(){const e=document.querySelectorAll(".counter"),t={threshold:.5,rootMargin:"0px 0px -100px 0px"},n=new IntersectionObserver(function(i){i.forEach(o=>{if(o.isIntersecting){const r=o.target,s=parseInt(r.getAttribute("data-target")),c=s/100;let l=0;const a=()=>{l<s?(l+=c,r.textContent=Math.ceil(l),setTimeout(a,20)):r.textContent=s};a(),n.unobserve(r)}})},t);e.forEach(i=>{n.observe(i)})}function p(){const e=[{university:"Cornell University",name:"Trần Nam Trân",school:"Trường Trung học Cranbrook",image:"images/student1.jpg"},{university:"Học bổng ASEAN - Nanyang Technological University",name:"Hoàng Quân",school:"THPT Chuyên Hà Nội - Amsterdam",image:"images/student2.jpg"},{university:"Học bổng Toàn phần - University of Oxford",name:"Nguyễn Cảnh Thái",school:"THPT Chuyên Khoa học Tự nhiên",image:"images/student3.jpg"},{university:"Stanford University University of Pennsylvania USC Marshall",name:"Nguyễn Quỳnh Anh",school:"Trường Quốc Tế Concordia Hà Nội",image:"images/student4.jpg"},{university:"The University of Sydney",name:"Vương Nhật Minh",school:"THPT Chuyên Khoa học Tự nhiên",image:"images/student5.jpg"}],t=document.querySelector(".testimonials-slider"),n=document.querySelector(".testimonials .prev-btn"),i=document.querySelector(".testimonials .next-btn");let o=0;if(!t)return;function r(a){return`
            <div class="testimonial-slide">
                <div class="testimonial-content">
                    <h3>${a.university}</h3>
                    <div class="student-info">
                        <p class="student-name">${a.name}</p>
                        <p class="student-school">${a.school}</p>
                    </div>
                </div>
                <div class="testimonial-image">
                    <picture>
                        <source srcset="${a.image.replace(".jpg",".webp")}" type="image/webp">
                        <img src="${a.image}" alt="${a.name}" loading="lazy" width="120" height="120" onerror="this.src='https://via.placeholder.com/120x120/046bd2/ffffff?text=${a.name.charAt(0)}'">
                    </picture>
                </div>
            </div>
        `}function s(a){t.innerHTML=r(e[a])}function c(){o=(o+1)%e.length,s(o)}function l(){o=(o-1+e.length)%e.length,s(o)}s(0),i&&i.addEventListener("click",c),n&&n.addEventListener("click",l),setInterval(c,4e3)}function g(){const e=document.querySelector(".nav-toggle"),t=document.querySelector(".nav-menu");!e||!t||(e.setAttribute("role","button"),e.setAttribute("aria-expanded","false"),e.setAttribute("aria-controls","primary-menu"),t.id="primary-menu",t.setAttribute("role","menu"),e.addEventListener("click",function(){const n=t.style.display==="block";t.style.display=n?"none":"block",e.setAttribute("aria-expanded",String(!n))}),e.addEventListener("keydown",function(n){(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),e.click())}),document.addEventListener("click",function(n){!e.contains(n.target)&&!t.contains(n.target)&&(t.style.display="none",e.setAttribute("aria-expanded","false"))}))}function y(){const e=document.querySelector(".scroll-to-top");e&&(window.addEventListener("scroll",function(){window.pageYOffset>300?(e.style.opacity="1",e.style.visibility="visible"):(e.style.opacity="0",e.style.visibility="hidden")}),e.addEventListener("click",function(t){t.preventDefault(),window.scrollTo({top:0,behavior:"smooth"})}))}function v(){const e=document.querySelector(".contact-form");e&&e.addEventListener("submit",function(t){t.preventDefault();const n=e.querySelector("#name").value.trim(),i=e.querySelector("#email").value.trim(),o=e.querySelector("#phone").value.trim(),r=e.querySelector("#note").value.trim();if(!n){d("Vui lòng nhập họ và tên","error");return}if(!i||!S(i)){d("Vui lòng nhập email hợp lệ","error");return}if(!o||!w(o)){d("Vui lòng nhập số điện thoại hợp lệ","error");return}const s=e.getAttribute("data-form-endpoint");s&&s.trim()?b(s.trim(),{name:n,email:i,phone:o,note:r}):d("Cảm ơn bạn đã liên hệ! (Chưa cấu hình endpoint gửi form)","success"),e.reset()})}async function b(e,t){try{if(!(await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})).ok)throw new Error("Submit failed");d("Gửi form thành công! Chúng tôi sẽ liên hệ sớm.","success")}catch(n){console.error(n),d("Không thể gửi form lúc này. Vui lòng thử lại sau.","error")}}function S(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}function w(e){return/^[0-9+\-\s()]{10,}$/.test(e)}function d(e,t){const n=document.createElement("div");n.className=`alert alert-${t}`,n.innerHTML=`
        <span>${e}</span>
        <button class="alert-close">&times;</button>
    `,n.style.cssText=`
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
        ${t==="success"?"background: #10b981;":"background: #ef4444;"}
    `;const i=n.querySelector(".alert-close");i.style.cssText=`
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    `,document.body.appendChild(n),setTimeout(()=>{n.parentNode&&n.parentNode.removeChild(n)},5e3),i.addEventListener("click",()=>{n.parentNode&&n.parentNode.removeChild(n)})}function x(){document.querySelectorAll('a[href^="#"]').forEach(o=>{o.addEventListener("click",function(r){const s=this.getAttribute("href");if(s==="#"){r.preventDefault();return}const c=document.querySelector(s);c&&(r.preventDefault(),c.scrollIntoView({behavior:"smooth",block:"start"}))})});const t=document.querySelectorAll("section[id]"),n=document.querySelectorAll(".nav-link"),i=new IntersectionObserver(o=>{o.forEach(r=>{if(r.isIntersecting){const s=r.target.getAttribute("id");n.forEach(c=>c.classList.toggle("active",c.getAttribute("href")===`#${s}`))}})},{threshold:.6});t.forEach(o=>i.observe(o))}document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll("img").forEach(t=>{t.addEventListener("load",function(){this.style.opacity="1"}),t.style.opacity="0",t.style.transition="opacity 0.3s ease",t.complete&&(t.style.opacity="1")})});async function T(){try{const e=await fetch("/data.json",{cache:"no-store"});if(!e.ok)throw new Error("Failed to load data.json");const t=await e.json(),n=u("#news-grid",t.news,"news"),i=document.querySelector("#news-empty");i&&(i.style.display=n?"none":"block"),u("#competitions-grid",t.competitions,"competitions"),u("#blog-grid",t.blog,"blog"),u("#achievements-grid",t.achievements,"achievements")}catch(e){console.error(e)}}function u(e,t,n){const i=document.querySelector(e);if(!i||!Array.isArray(t))return!1;const o=t.map(r=>{const s=E(r.date),c=r.localImage||r.image,l=r.localImage&&r.image?`onerror="this.onerror=null; this.src='${r.image}'"`:"",a=c?c.replace(/\.(jpe?g|png)$/i,".webp"):"",f=c?`
                <div class="card-media">
                    <picture>
                        <source srcset="${a}" type="image/webp">

                    <img src="${c}" alt="${r.title}" loading="lazy" decoding="async" ${l} />
                    </picture>

                </div>`:"";return`
            <article class="${n==="blog"?"blog-card":n==="competitions"?"competition-card":n==="achievements"?"achievement-card":"news-card"}">
                ${f}
                <div class="card-content">
                    <h3><a href="${r.url}">${r.title}</a></h3>
                    <time>${s}</time>
                    <p>${r.excerpt}</p>
                    <a href="${r.url}" class="read-more">Xem chi tiết</a>
                </div>
            </article>
        `}).join("");return i.innerHTML=o,t.length>0}function E(e){try{return new Date(e).toLocaleDateString("vi-VN",{year:"numeric",month:"long",day:"numeric"})}catch{return e}}window.addEventListener("scroll",function(){const e=window.pageYOffset,t=document.querySelector(".hero");if(t){const n=e*-.5;t.style.transform=`translateY(${n}px)`}});function L(){const e=document.querySelectorAll("section"),t={threshold:.1,rootMargin:"0px 0px -50px 0px"},n=new IntersectionObserver(function(i){i.forEach(o=>{o.isIntersecting&&(o.target.style.opacity="1",o.target.style.transform="translateY(0)")})},t);e.forEach(i=>{i.style.opacity="0",i.style.transform="translateY(30px)",i.style.transition="opacity 0.6s ease, transform 0.6s ease",n.observe(i)})}document.addEventListener("DOMContentLoaded",L);

# Sahlio MVP

Site كامل يخدم فعلياً: Node.js + Express + SQLite (backend) و HTML/JS بسيط (frontend).
باينة فيه الميزة الأساسية: **Demande de service** — الحريف يبعث طلب، الحرفيين القريبين يبعثو عروض، الحريف يختار.

## بش تجرب محلياً (على الكمبيوتر متاعك)

```bash
npm install
node server.js
```

افتح المتصفح على:
- `http://localhost:3000` → واجهة الحريف
- `http://localhost:3000/provider.html` → واجهة الحرفي

جرب الفلو: حل كومبت حرفي فـ `provider.html` (حدد بلاصة + خدمة)، وفـ نافذة أخرى حل كومبت حريف فـ `index.html` وابعث طلب — الطلب يبان عند الحرفي مباشرة.

## بش تنشره أونلاين وتشري domaine

الطريقة الأسهل: **Railway** أو **Render** (فيهم free tier، وسهلين للمبتدئين).

### Railway (أسهل خيار)
1. أنشئ حساب على railway.app وربطو بـ GitHub.
2. ارفع هذا الفولدر كـ repo على GitHub.
3. فـ Railway: "New Project" → "Deploy from GitHub repo" → اختار الـ repo.
4. Railway يكتشف `package.json` ويشغل `node server.js` أوتوماتيكياً.
5. بعد ما يطلع لينك (زي `sahlio-production.up.railway.app`)، تنجم تشري domaine (من Namecheap, GoDaddy, أو أي مزود تونسي) وتربطو من "Settings → Domains" فـ Railway.

### Render
نفس الخطوات تقريباً: "New Web Service" → اربط الـ repo → Build command: `npm install` → Start command: `node server.js`.

**ملاحظة مهمة**: SQLite (الملف `db/sahlio.db`) يتمسح كل مرة تعمل redeploy فأغلب المنصات المجانية (الـ filesystem مؤقت). زوز حلول:
- للاختبار السريع: ماشي مشكل، الداتا تولي فارغة وبس.
- للإنتاج الحقيقي: بدل SQLite بـ PostgreSQL مُدار (Railway وRender يعطيوك واحدة مجانية) — استعمل `schema.sql` الأصلية (الموجودة فـ المشروع الأول، بصيغة PostgreSQL) كنقطة بداية.

## شنية ناقص قبل ما يولي production حقيقي

- **الأمان**: نظام الـ auth تو مبسط برشا (token = base64 من الـ user id). لازم تبدلو بـ JWT حقيقي + HTTPS إجباري قبل الإطلاق العمومي.
- **رقم الهاتف**: لازم SMS verification حقيقي (Twilio أو مزود تونسي) قبل ما تثق فـ رقم أي مستخدم.
- **الدفع**: ما فماش دفع أونلاين تو — العروض كلها "افتراضية". لازم تدمج بوابة دفع (Flouci, D17, أو Stripe إذا عندك حساب دولي) باش تفعل الـ Commission.
- **الموقع**: تو الحريف يختار من قائمة بلايص محددة (تونس/أريانة/بن عروس/منوبة) بدل خريطة حقيقية — لازم تدمج Google Maps API أو OpenStreetMap باش الحريف يأشر بلاصتو بدقة.
- **الصور**: ما فماش رفع صور (بروفايل حرفي، صور الطلب) — سهل تزيدها بـ S3 أو Cloudinary.

## هيكلة المشروع

```
sahlio-mvp/
  server.js           ← نقطة الانطلاق
  db/schema.sql        ← بنية قاعدة البيانات
  db/index.js           ← اتصال + seed
  routes/auth.js        ← تسجيل / دخول
  routes/providers.js   ← بروفايل الحرفي، الخدمات
  routes/requests.js    ← الطلبات، العروض، الرسائل، التقييمات
  public/                ← الواجهة (index.html = حريف, provider.html = حرفي)
```

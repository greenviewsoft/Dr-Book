# সেটআপ গাইড — Doctor's Chamber Appointment System

এই গাইডে Appwrite console-এ যা যা তৈরি করতে হবে তার ধাপে ধাপে নির্দেশনা দেওয়া আছে।
Appwrite project আগে থেকেই `.env`-এ configure করা (Green, nyc.cloud.appwrite.io)।

> 💡 সব Appwrite কাজ console-এ (https://cloud.appwrite.io/console)। কোড-এ শুধু
> দুটি ID বসাতে হবে `.env`-এ: `VITE_APPWRITE_DB_ID` ও `VITE_BOOK_FUNCTION_ID`।

---

## ১. Database তৈরি → `.env`-এ ID বসাও

1. Console → **Databases** → **Create Database** → নাম দাও `chamber`।
2. Database ID কপি করো।
3. প্রজেক্টের `.env` ফাইলে বসাও:
   ```
   VITE_APPWRITE_DB_ID = "<সেই Database ID>"
   ```

---

## ২. টেবিল ও Attribute তৈরি (৪টি)

প্রতিটি টেবিলের **Attributes** ট্যাবে গিয়ে ঠিক এই field-গুলো যোগ করো
(Type, Size, Required, Default, Array হুবহু মিলিয়ে):

### `doctors` (ডাক্তারের সেটিংস — ১টি row থাকবে)
| Key | Type | Size | Required | Default | Array |
|---|---|---|---|---|---|
| `name` | String | 100 | ✅ | | |
| `specialty` | String | 100 | | | |
| `chamber_name` | String | 100 | | | |
| `phone` | String | 20 | | | |
| `daily_limit` | Integer | | ✅ | 30 | |
| `daily_start` | String | 10 | ✅ | 10:00 | |
| `daily_end` | String | 10 | ✅ | 13:00 | |
| `slot_duration_minutes` | Integer | | ✅ | 10 | |
| `working_days` | String | 20 | ✅ | | ✅ (Array) |

### `holidays` (ছুটির দিন)
| Key | Type | Size | Required |
|---|---|---|---|
| `date` | String | 10 | ✅ |
| `reason` | String | 100 | |

### `appointments` (বুকিং — মূল টেবিল)
| Key | Type | Size | Required | Default |
|---|---|---|---|---|
| `patient_name` | String | 100 | ✅ | |
| `patient_phone` | String | 20 | ✅ | |
| `patient_age` | Integer | | ✅ | |
| `problem` | String | 300 | | |
| `appointment_date` | String | 10 | ✅ | |
| `serial_number` | Integer | | ✅ | |
| `status` | String | 20 | ✅ | pending |
| `created_at` | Datetime | | ✅ | |
| `doctor_id` | String | 36 | | |

### `daily_counters` (সিরিয়াল গোনার জন্য)
| Key | Type | Size | Required | Default |
|---|---|---|---|---|
| `date` | String | 10 | ✅ | |
| `next_serial` | Integer | | ✅ | 0 |

---

## ৩. প্রতিটি টেবিলের Permission সেট করো

প্রতি টেবিলের **Settings** ট্যাবে গিয়ে "Table permissions" এ নিচের role বসাও:

| Table | Create | Read | Update | Delete |
|---|---|---|---|---|
| `doctors` | Users | **All users** | Users | Users |
| `holidays` | Users | **All users** | Users | Users |
| `appointments` | Users | Users | Users | Users |
| `daily_counters` | Users | **All users** | Users | Users |

- **"All users"** = যে টেবিল রোগীরা (login ছাড়া) পড়বে: doctors, holidays, daily_counters।
- **appointments-এর Read = Users** — তাই রোগীর PII (নাম/ফোন/সমস্যা) শুধু ডাক্তার দেখেন।
- **Create = Users** — anonymous সরাসরি appointment তৈরি করতে পারবে না, বাধ্য হবে Function দিয়ে যেতে।
- Function চলে server API key দিয়ে (এই permission গুলো bypass করে), তাই সে create/update করতে পারবে।

---

## ৪. ডাক্তারের User Account তৈরি → `DOCTOR_USER_ID`

1. Console → **Auth** → **Users** → **Add User** (বা Create User)।
2. ইমেইল + পাসওয়ার্ড দাও (এই দিয়েই `/admin/login`-এ ঢুকবে)।
3. ইউজারের `$id` কপি করো — এটিই **`DOCTOR_USER_ID`** (Function env-এ লাগবে, ধাপ ৭)।

---

## ৫. Server API Key তৈরি

1. Console → project **Overview** → **API Keys** → **Create API key**।
2. নাম দাও `booking-function`।
3. Scope হিসেবে **Databases** ও **Tables** (সব read + write) enable করো।
4. Key কপি করো — এটি Function-এর `APPWRITE_API_KEY` env হবে (ধাপ ৭)।

---

## ৬. `doctors` টেবিলে সেটিংস row seed করো

1. `doctors` টেবিল → **Create Row**।
2. Value দাও (উদাহরণ):
   - `name`: ডাঃ কারও নাম
   - `specialty`: যেমন "Medicine"
   - `chamber_name`: চেম্বারের নাম
   - `phone`: 01XXXXXXXXX
   - `daily_limit`: 30
   - `daily_start`: 10:00
   - `daily_end`: 13:00
   - `slot_duration_minutes`: 10
   - `working_days`: `["sat","sun","mon","tue","wed"]`
3. Row permission: **Read = All users**, **Update/Delete** = ধাপ ৪-এর ডাক্তার ইউজার (বা Users)।
4. Save।

> পরে এগুলো ড্যাশবোর্ডের **Settings** পেজ থেকেই বদলানো যাবে।

---

## ৭. `book-appointment` Function deploy করো

ফাংশন কোড প্রজেক্টেই আছে: [functions/book-appointment/](functions/book-appointment/)।

### Environment Variables (Settings → Variables)
Function-এ এই ৫টি variable সেট করো:

| Variable | Value |
|---|---|
| `APPWRITE_ENDPOINT` | `https://nyc.cloud.appwrite.io/v1` |
| `APPWRITE_PROJECT_ID` | তোমার project id (`.env`-এ যা আছে) |
| `APPWRITE_API_KEY` | ধাপ ৫-এর key |
| `APPWRITE_DATABASE_ID` | ধাপ ১-এর Database ID |
| `DOCTOR_USER_ID` | ধাপ ৪-এর ইউজার `$id` |

### Permission
Settings → **Permissions** → **Execute** = **All users** (যাতে রোগীরা login ছাড়া call করতে পারে)।

### Deploy (Appwrite CLI দিয়ে — সবচেয়ে নির্ভরযোগ্য)
```bash
npm install -g appwrite-cli
appwrite login                       # ব্রাউজারে লগইন
appwrite client                      # project id + endpoint সেট করো (prompt অনুযায়ী)

# function রেজিস্টার করো (একবার)
appwrite functions create \
  --function-id book-appointment \
  --name "Book Appointment" \
  --runtime node-22 \
  --entrypoint "src/main.js"

# কোড deploy করো (functions/book-appointment ফোল্ডার থেকে)
cd functions/book-appointment
appwrite deploy function --function-id book-appointment
```

> বিকল্প: Console-এ **Functions → Create Function** করে ZIP আপলোডও করা যায়।

### Function ID → `.env`
Deploy হলে Function এর ID কপি করে `.env`-এ বসাও:
```
VITE_BOOK_FUNCTION_ID = "<Function ID>"
```

---

## ৮. অ্যাপ চালাও ও যাচাই করো

```bash
npm install
npm run dev
```

তারপর:
1. `http://localhost:5173/` → তারিখ বেছে নাম/মোবাইল/বয়স দাও → সিরিয়াল + সময় দেখাবে।
2. `/admin/login` → ধাপ ৪-এর ইমেইল/পাসওয়ার্ড দিয়ে ঢোকো → আজকের তালিকা/Settings/Holidays।
3. ভাষা toggle (右上) করলে বাংলা ⇄ ইংরেজি।
4. `daily_limit` পর্যন্ত বুক করলে এরপর "সব সিরিয়াল শেষ" দেখাবে।
5. Settings-এ আজকের তারিখ holiday দিলে বুকিং পেজে সেদিন বন্ধ দেখাবে।

---

## সমস্যা হলে (Troubleshooting)
- **Booking-এ "Something went wrong":** প্রথমে `VITE_BOOK_FUNCTION_ID` ঠিক আছে কিনা দেখো। তারপর Console → Functions → `book-appointment` → **Executions/Logs** দেখে error চেক করো।
- **Function 403/permission error:** API key-এ Tables read/write scope দেওয়া আছে কিনা নিশ্চিত করো।
- **ড্যাশবোর্ডে কিছু দেখাচ্ছে না:** appointments row-গুলোর permission-এ ডাক্তার ইউজার আছে কিনা নিশ্চিত করো (Function অটোমেটিক সেট করে যদি `DOCTOR_USER_ID` ঠিক থাকে)।
- **বাংলা সঠিক দেখাচ্ছে না:** ইন্টারনেট কানেকশন দরকার Google Font (Hind Siliguri) লোডের জন্য।

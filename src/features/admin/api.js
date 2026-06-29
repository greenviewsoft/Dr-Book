import { Query, ID, Permission, Role } from "appwrite";
import { db, storage } from "@/lib/appwrite";
import { DB_ID, TABLES, BUCKET_ID } from "@/lib/constants";

// ---- Appointments ----
export async function listAppointmentsByDate(date) {
  const { rows } = await db.listRows({
    databaseId: DB_ID,
    tableId: TABLES.appointments,
    queries: [
      Query.equal("appointment_date", date),
      Query.limit(500),
    ],
  });
  return rows;
}

// month = "YYYY-MM". Prefix-matches appointment_date so a range index isn't
// required (startsWith works on strings without a fulltext index).
export async function listAppointmentsByMonth(month) {
  const { rows } = await db.listRows({
    databaseId: DB_ID,
    tableId: TABLES.appointments,
    queries: [Query.startsWith("appointment_date", month), Query.limit(2000)],
  });
  return rows;
}

export async function updateAppointmentStatus(rowId, status) {
  return db.updateRow({
    databaseId: DB_ID,
    tableId: TABLES.appointments,
    rowId,
    data: { status },
  });
}

// ---- Doctor settings (single row) ----
export async function getDoctorConfig() {
  const { rows } = await db.listRows({
    databaseId: DB_ID,
    tableId: TABLES.doctors,
    queries: [Query.limit(1)],
  });
  return rows[0] || null;
}

export async function updateDoctorConfig(rowId, data) {
  return db.updateRow({
    databaseId: DB_ID,
    tableId: TABLES.doctors,
    rowId,
    data,
  });
}

// First-time setup: create the single doctor settings row.
// Read = anyone (the public booking page reads it without login);
// Update/Delete = the logged-in doctor only. Mirrors addHoliday().
export async function createDoctorConfig(data, doctorId) {
  return db.createRow({
    databaseId: DB_ID,
    tableId: TABLES.doctors,
    rowId: ID.unique(),
    data,
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(doctorId)),
      Permission.delete(Role.user(doctorId)),
    ],
  });
}

// ---- Site branding (logo/favicon uploads) ----
// Uploads an image to the public site-media bucket and returns a view URL
// to store on the doctors row. Bucket must have Read = Any, Create = Users.
export async function uploadSiteImage(file) {
  const created = await storage.createFile(BUCKET_ID, ID.unique(), file);
  return {
    id: created.$id,
    url: storage.getFileView(BUCKET_ID, created.$id),
  };
}

// ---- Holidays ----
export async function listHolidays() {
  const { rows } = await db.listRows({
    databaseId: DB_ID,
    tableId: TABLES.holidays,
    queries: [Query.orderAsc("date"), Query.limit(500)],
  });
  return rows;
}

// doctorId = current (logged-in) doctor's $id — rows stay editable by the doctor
// while remaining publicly readable (booking page needs to read holidays).
export async function addHoliday(date, reason, doctorId) {
  return db.createRow({
    databaseId: DB_ID,
    tableId: TABLES.holidays,
    rowId: ID.unique(),
    data: { date, reason: reason || "" },
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(doctorId)),
      Permission.delete(Role.user(doctorId)),
    ],
  });
}

export async function deleteHoliday(rowId) {
  return db.deleteRow({
    databaseId: DB_ID,
    tableId: TABLES.holidays,
    rowId,
  });
}

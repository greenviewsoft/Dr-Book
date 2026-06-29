import { Client, Account, TablesDB, Storage } from "appwrite";

// Single shared client (session + TablesDB + Storage use the same instance)
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const db = new TablesDB(client);
const storage = new Storage(client);

export { client, account, db, storage };

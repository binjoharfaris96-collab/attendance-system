import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";

const dataDirectory = join(process.cwd(), "data");
const db = new DatabaseSync(join(dataDirectory, "attendance.sqlite"));

const row = db.prepare("SELECT * FROM students WHERE id = ?").get("194aa44c-6015-4a8c-9fc9-7456ad1a4f4e");
console.log(JSON.stringify(row, null, 2));

import { DatabaseSync } from "node:sqlite";
import { writeFileSync } from "fs";
const db = new DatabaseSync(":memory:");
db.exec("CREATE TABLE t (id INT, cnt INT); INSERT INTO t VALUES (1, NULL);");
db.prepare("UPDATE t SET cnt = MAX(0, cnt + 1)").run();
let r1 = db.prepare("SELECT * FROM t").get();
db.prepare("UPDATE t SET cnt = MAX(0, cnt + 1)").run();
let r2 = db.prepare("SELECT * FROM t").get();
writeFileSync("test_sqlite_max_res.json", JSON.stringify({r1, r2}));

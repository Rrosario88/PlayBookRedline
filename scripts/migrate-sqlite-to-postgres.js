import Database from 'better-sqlite3';
import pkg from 'pg';
const { Client } = pkg;

const sqlitePath = process.env.SQLITE_PATH || '/tmp/sqlite-migration/playbookredline.db';
const databaseUrl = process.env.DATABASE_URL || 'postgresql://playbookredline:playbookredline@postgres:5432/playbookredline';

const sqlite = new Database(sqlitePath, { readonly: true });
const client = new Client({ connectionString: databaseUrl });

await client.connect();

const users = sqlite.prepare('SELECT id, email, password_hash, role, created_at FROM users ORDER BY id').all();
for (const user of users) {
  await client.query(
    `INSERT INTO users (id, email, password_hash, role, created_at)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, password_hash=EXCLUDED.password_hash, role=EXCLUDED.role, created_at=EXCLUDED.created_at`,
    [user.id, user.email, user.password_hash, user.role, user.created_at],
  );
}

const matters = sqlite.prepare('SELECT * FROM matters ORDER BY id').all();
for (const matter of matters) {
  await client.query(
    `INSERT INTO matters (id, user_id, name, contract_name, playbook_name, clauses_json, analyses_json, retention_days, delete_after, retain_source_files, created_at)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,$11)
     ON CONFLICT (id) DO UPDATE SET
       user_id=EXCLUDED.user_id,
       name=EXCLUDED.name,
       contract_name=EXCLUDED.contract_name,
       playbook_name=EXCLUDED.playbook_name,
       clauses_json=EXCLUDED.clauses_json,
       analyses_json=EXCLUDED.analyses_json,
       retention_days=EXCLUDED.retention_days,
       delete_after=EXCLUDED.delete_after,
       retain_source_files=EXCLUDED.retain_source_files,
       created_at=EXCLUDED.created_at`,
    [matter.id, matter.user_id, matter.name, matter.contract_name, matter.playbook_name, matter.clauses_json, matter.analyses_json, matter.retention_days, matter.delete_after, Boolean(matter.retain_source_files), matter.created_at],
  );
}

if (users.length) {
  await client.query(`SELECT setval(pg_get_serial_sequence('users','id'), GREATEST((SELECT COALESCE(MAX(id),1) FROM users),1), true)`);
}
if (matters.length) {
  await client.query(`SELECT setval(pg_get_serial_sequence('matters','id'), GREATEST((SELECT COALESCE(MAX(id),1) FROM matters),1), true)`);
}

console.log(JSON.stringify({ migratedUsers: users.length, migratedMatters: matters.length }, null, 2));
await client.end();
sqlite.close();

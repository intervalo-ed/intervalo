"""Ad-hoc query helper para la BBDD productiva. Lee la URL desde DB_URL.

Uso:
  DB_URL=... python backend/dbq.py "SELECT ..."
"""
import os
import sys
import psycopg2
import psycopg2.extras


def main() -> None:
    url = os.environ["DB_URL"]
    sql = sys.argv[1]
    conn = psycopg2.connect(url, connect_timeout=15)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql)
            if cur.description is None:
                print(f"(sin filas) rowcount={cur.rowcount}")
                return
            rows = cur.fetchall()
            cols = [d.name for d in cur.description]
            print("\t".join(cols))
            for r in rows:
                print("\t".join("" if r[c] is None else str(r[c]) for c in cols))
            print(f"\n({len(rows)} filas)")
    finally:
        conn.close()


if __name__ == "__main__":
    main()

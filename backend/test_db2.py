import psycopg2
urls = [
    "postgresql://suraj@localhost:5432/postgres",
    "postgresql://suraj:postgres@localhost:5432/postgres",
    "postgresql://suraj:suraj@localhost:5432/postgres",
    "postgresql://localhost:5432/postgres"
]
for url in urls:
    try:
        conn = psycopg2.connect(url)
        print("Success:", url)
        conn.close()
    except Exception as e:
        pass
print("Done")

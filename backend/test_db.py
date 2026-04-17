import psycopg2
urls = [
    "postgresql://postgres:postgres@localhost:5432/postgres",
    "postgresql://postgres:root@localhost:5432/postgres",
    "postgresql://postgres:password@localhost:5432/postgres",
    "postgresql://postgres@localhost:5432/postgres"
]
for url in urls:
    try:
        conn = psycopg2.connect(url)
        print("Success:", url)
        conn.close()
    except Exception as e:
        print("Failed:", url, e)

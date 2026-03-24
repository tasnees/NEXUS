import http.client
try:
    conn = http.client.HTTPConnection("localhost", 8001, timeout=2)
    conn.request("GET", "/")
    r = conn.getresponse()
    print(f"Health Check: {r.status} {r.reason}")
    conn.close()
except Exception as e:
    print(f"Health Check Failed: {e}")

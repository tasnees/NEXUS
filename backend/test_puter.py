import puter
try:
    print("Listing puter attributes:")
    print(dir(puter))
    if hasattr(puter, 'auth'):
        print("Found puter.auth")
    else:
        print("puter.auth NOT found")
except Exception as e:
    print(f"Error test puter: {e}")

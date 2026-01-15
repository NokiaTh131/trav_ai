import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.server import app, API_KEY

client = TestClient(app)


def test_security():
    print("--- Testing API Security ---")

    # 1. Test without API Key
    print("\n1. Request without API Key...")
    response = client.post(
        "/stream", json={"messages": [{"role": "user", "content": "hi"}]}
    )
    if response.status_code in [401, 403]:
        print(f"   [SUCCESS] Rejected with {response.status_code} (Expected)")
    else:
        print(f"   [FAILURE] Accepted with {response.status_code} (Should be 401/403)")

    # 2. Test with Wrong API Key
    print("\n2. Request with WRONG API Key...")
    response = client.post(
        "/stream",
        json={"messages": [{"role": "user", "content": "hi"}]},
        headers={"X-API-Key": "wrong-key"},
    )
    if response.status_code in [401, 403]:
        print(f"   [SUCCESS] Rejected with {response.status_code} (Expected)")
    else:
        print(f"   [FAILURE] Accepted with {response.status_code} (Should be 401/403)")

    # 3. Test with Correct API Key
    print(f"\n3. Request with CORRECT API Key ({API_KEY})...")

    payload = {
        "messages": [{"role": "user", "content": "Hello, just testing the connection."}]
    }

    try:
        # Note: We are using TestClient which is synchronous.
        # This verifies the endpoint is reachable and authenticates.
        response = client.post(
            "/stream",
            json=payload,
            headers={"X-API-Key": API_KEY},
        )

        if response.status_code == 200:
            print(f"   [SUCCESS] Accepted with {response.status_code} (Expected)")
            # In a real streaming response, content might be empty until iterated,
            # but status code 200 confirms we passed security.
        else:
            print(f"   [FAILURE] Rejected with {response.status_code} (Should be 200)")
            print(f"   Response: {response.text}")

    except Exception as e:
        print(f"   [ERROR] {e}")


if __name__ == "__main__":
    test_security()

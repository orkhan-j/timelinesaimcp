import requests
import json

def test_agent1():
    url = "http://localhost:4000/agent1"
    payload = {
        "prompt": "Hello, this is a test message for agent 1!",
        "parameters": {
            "mode": "analysis"
        }
    }
    
    print("Testing Agent 1 (Text Processing):")
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))

def test_agent2():
    url = "http://localhost:4000/agent2"
    payload = {
        "prompt": "I'm really happy with how this project turned out! The code is clean and well-organized.",
        "parameters": {
            "analysis_type": "sentiment"
        }
    }
    
    print("\nTesting Agent 2 (Sentiment Analysis):")
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))

def list_agents():
    url = "http://localhost:4000/agents"
    print("\nListing available agents:")
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print("Available agents:")
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    try:
        # First check if the API is up
        response = requests.get("http://localhost:4000/", timeout=5)
        print(f"API is running: {response.status_code} - {response.text}")
        
        # Run tests
        list_agents()
        test_agent1()
        test_agent2()
        
    except requests.exceptions.ConnectionError:
        print("Could not connect to the API. Please make sure Docker is running and the API is accessible at http://localhost:4000")
        print("\nTo start the API, run:")
        print("1. Open Docker Desktop")
        print("2. In the terminal, run: cd ai-mcp && docker-compose up --build")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

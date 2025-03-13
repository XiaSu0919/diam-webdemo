import requests
def visit_url(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad status codes
        print(response.text)
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    url = "https://chilly-states-brush.loca.lt/spaces"  # Replace with the URL you want to visit
    visit_url(url)
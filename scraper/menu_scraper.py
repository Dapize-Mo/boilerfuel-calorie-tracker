import requests
from bs4 import BeautifulSoup
import psycopg2
import os

def scrape_menu():
    url = "https://example.com/dining-hall-menu"  # Replace with the actual URL
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    menu_items = []
    for item in soup.select('.menu-item'):  # Adjust the selector based on the actual HTML structure
        name = item.select_one('.item-name').text.strip()
        calories = item.select_one('.item-calories').text.strip()
        menu_items.append((name, calories))

    return menu_items

def save_to_database(menu_items):
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cursor = conn.cursor()

    for name, calories in menu_items:
        cursor.execute("INSERT INTO menu (name, calories) VALUES (%s, %s)", (name, calories))

    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    menu_items = scrape_menu()
    save_to_database(menu_items)
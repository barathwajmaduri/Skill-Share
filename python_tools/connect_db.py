import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

def connect_to_mongodb():
    """
    Connects to a MongoDB database using the MONGODB_URI environment variable
    or user input, and performs basic connectivity checks.
    """
    print("--- MongoDB Python Connector ---")
    
    # Get MongoDB URI from environment variable or user input
    mongo_uri = os.getenv("MONGODB_URI")
    
    if not mongo_uri:
        print("MONGODB_URI not found in environment variables.")
        mongo_uri = input("Please enter your MongoDB connection string: ").strip()
    
    if not mongo_uri:
        print("Error: No connection string provided.")
        return

    try:
        print(f"\nAttempting to connect...")
        # Create a client instance
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        
        # Force a connection verification
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")
        
        # List databases
        dbs = client.list_database_names()
        print(f"\nAvailable databases: {dbs}")
        
        # Determine database name from URI or default to 'skillshare'
        try:
            db_name = client.get_database().name
        except:
            db_name = 'skillshare'
            
        print(f"Using database: {db_name}")
        db = client[db_name]
        
        # List collections
        collections = db.list_collection_names()
        print(f"Collections in '{db_name}': {collections}")
        
        # Example: Interact with 'users' collection
        if 'users' in collections:
            user_count = db.users.count_documents({})
            print(f"\nNumber of users in 'users' collection: {user_count}")
            
            if user_count > 0:
                print("\nSample User (first found):")
                sample_user = db.users.find_one()
                # Print nicely
                for key, value in sample_user.items():
                    print(f"  {key}: {value}")
        else:
            print("\n'users' collection not found. Creating a test document...")
            result = db.test_collection.insert_one({"message": "Hello from Python!"})
            print(f"Inserted test document with ID: {result.inserted_id}")

    except Exception as e:
        print(f"\n❌ Error connecting to MongoDB: {e}")
        print("\nPlease check your connection string and ensure your IP address is whitelisted in MongoDB Atlas.")

if __name__ == "__main__":
    connect_to_mongodb()

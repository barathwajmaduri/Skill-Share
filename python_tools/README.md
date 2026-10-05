# Python MongoDB Tools

This directory contains Python scripts to help you interact with your MongoDB database.

Since the main application runs on Node.js, these scripts are intended to be run **locally on your machine** or in a separate Python environment to verify connections, migrate data, or perform administrative tasks.

## Prerequisites

- Python 3.x installed
- pip (Python package manager)

## Setup

1. Navigate to this directory:
   ```bash
   cd python_tools
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. (Optional) Create a `.env` file in this directory with your connection string:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/skillshare
   ```

## Usage

Run the connection script:

```bash
python connect_db.py
```

If you haven't set the `MONGODB_URI` environment variable, the script will prompt you to enter it manually.

## What it does

- Connects to your MongoDB instance
- Verifies the connection with a `ping` command
- Lists available databases
- Lists collections in the selected database
- Displays a sample user count and document (if the `users` collection exists)

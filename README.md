# Voters Registration

Upload csv/excel file of voters and save voters in the db.

## Backend (Django)

### Requirements

- [uv](https://docs.astral.sh/uv/) - python and package manager
- local redis server
- local postgres server

### Technologies Used

- Django
- Django REST Framework
- PostgreSQL
- Redis: Caching and task queues
- Huey: Background task scheduling
- Resend: Emails

### Setup and Running Locally

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Set up python virtual environment and install the packages:
   ```bash
   uv sync
   source .venv/bin/activate
   ```

3. Ensure your local redis and postgres servers are running

4. Register on [resend](https://resend.com/) and generate an API key

5. create an `.env.local` with contents mentioned in [`.env.example`](/backend/.env.example) file

6. Run migrations:
   ```bash
   make migrate
   ```

7. Start the development server:
   ```bash
   make dev
   ```

8. Start the huey server:
   ```bash
   make consumer
   ```

The backend should now be running on [`http://localhost:8000`](http://localhost:8000) and the docs can be accessed at [`http://localhost:8000/docs`](http://localhost:8000/docs)

## Frontend (React)

### Requirements

- Node.js 18+
- npm or yarn

### Setup and Running Locally

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Create a .env file and add `VITE_API_URL=http://localhost:8000`

3. Start the development server:
   ```
   npm run dev
   ```

The frontend should now be running on `http://localhost:5173`.

### Technologies Used

- React
- React Router
- Axios (for API calls)
- Vite

## Running the Full Stack Application

1. Start the backend server (follow the backend instructions above).
2. In a new terminal, start the frontend development server (follow the frontend instructions above).
3. Access the application by opening `http://localhost:5173` in your web browser.

## Additional Notes

* To generate test csv/excel files for upload via the frontend, you can run the `make generate-fake` command in the /backend directory and follow the prompt.

* If you have any problem setting this up, you can reach out via email or open an issue
# Studi Analytics

A comprehensive study analytics platform that helps users track and analyze their study habits.

## Project Structure

```
/Studi
├── backend/          # Django backend
├── frontend/         # Frontend application
├── docs/            # Project documentation
└── Diagrams/        # Project diagrams and visualizations
```

## Setup

### Backend
1. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

4. Start development server:
   ```bash
   python manage.py runserver
   ```

### Frontend
Frontend setup instructions will be added once the frontend structure is implemented.

## Development

This project follows a feature branch workflow. Create new branches for features and submit pull requests for review.

## Documentation
Detailed documentation can be found in the `/docs` directory. 
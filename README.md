# Quizzed - Interactive Learning Platform

Quizzed is a comprehensive learning platform that combines quizzes, flashcards, and slide-based learning to create an engaging educational experience. The application supports multiple question types, PDF slide integration, and progress tracking.

## Features

### Quiz Management
- Create, edit, and take quizzes with multiple question types:
  - Multiple choice questions
  - Yes/No questions
  - Slide-based questions with PDF integration
- Question shuffling option for varied learning experiences
- CSV import functionality for bulk quiz creation
- Folder-based organization with two-level hierarchy (departments/categories and courses/subcategories)

### Flashcards
- Create flashcard sets with rich text and images
- Import flashcards directly from Word tables
- Interactive study mode with card flipping
- Track progress through flashcard sets
- Share flashcards with other users

### Progress Tracking
- History of quiz attempts
- Score tracking and improvement monitoring
- Performance analytics

### User Management
- Secure authentication system
- User profiles with customizable settings
- Personal quiz and flashcard collections
- Ability to share and access public content

## Technologies Used

### Frontend
- **React**: UI library for building the user interface
- **React Router**: For navigation and routing
- **CSS**: Custom styling for components
- **React-PDF**: PDF rendering and integration

### Backend
- **Supabase**: Backend-as-a-Service for authentication and database
- **PostgreSQL**: Database (via Supabase)

### Tools & Libraries
- **PapaParse**: CSV parsing for quiz imports
- **PDF.js**: PDF rendering engine
- **Webpack**: Module bundling
- **Stream/Path Browserify**: Polyfills for browser compatibility

## Getting Started

### Prerequisites
- Node.js (v14.x or higher)
- npm or yarn package manager
- A Supabase account for the backend services

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/quizzed.git
cd quizzed
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Supabase credentials:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server
```bash
npm start
```

The application will open in your browser at [http://localhost:3000](http://localhost:3000).

## Usage Guide

### Creating a Quiz
1. Navigate to the "Import" page
2. Choose one of the import methods:
   - Upload a CSV file
   - Create a CSV manually
   - Create a CSV with slides
3. Add category tags for organization
4. Upload or select a PDF for slide references (optional)
5. Submit your quiz

### Taking a Quiz
1. From the home page, browse available quizzes
2. Use the folder view or list view to find your quiz
3. Click on a quiz to start
4. Answer questions and receive instant feedback
5. View your final score and review answers

### Creating Flashcards
1. Navigate to the "Flashcards" section
2. Click "Create Flashcards"
3. Enter title, description, and optional tags
4. Paste your Word table with questions and answers
5. Review and save your flashcard set

### Studying with Flashcards
1. Open a flashcard set
2. Click on cards to flip between question and answer
3. Use the navigation buttons to move between cards

## Project Structure

```
quizzed/
├── public/          # Static files
├── src/
│   ├── components/  # React components
│   ├── context/     # Context providers
│   ├── styles/      # CSS files
│   ├── utils/       # Utility functions
│   └── App.js       # Main application component
└── package.json     # Dependencies and scripts
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Special thanks to all contributors
- Built with React and Supabase

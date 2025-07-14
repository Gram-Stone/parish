# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains documentation and architecture guidance for building Amazon Mechanical Turk (AMT) psychology experiments. The project follows a MERN stack architecture (MongoDB, Express, React, Node.js) with Vite for frontend tooling.

## Key Architecture Patterns

**ES6 Modules Throughout**: The codebase uses ES6 modules consistently across frontend and backend. All files should use `import`/`export` syntax rather than CommonJS `require`/`module.exports`.

**Single Page Application (SPA)**: The frontend is designed as a React SPA to avoid AMT iframe session management issues. Navigation between experiment stages happens within a single page using Redux for centralized state management.

**AMT Integration Model**: The application operates within AMT's external study framework where:
- AMT loads the study in an iframe with special URL parameters (workerId, assignmentId, hitId, turkSubmitTo)
- The study collects data and submits back to AMT via form submission with `target="_parent"`
- Preview mode is detected when `assignmentId === 'ASSIGNMENT_ID_NOT_AVAILABLE'`

## Common Development Commands

Based on the documented package.json structure:

```bash
# Development
npm run dev          # Start Vite development server
npm run server       # Start Express backend server

# Production
npm run build        # Build React app with Vite
npm run preview      # Preview production build

# Development workflow
node server/index.js # Start backend server directly
```

## Project Structure

```
project-root/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Experiment components
│   │   ├── store/             # Redux store, slices, and selectors
│   │   ├── hooks/             # Custom React hooks for non-state logic
│   │   ├── utils/             # Utility functions
│   │   └── styles/            # CSS including font condition styling
├── server/                     # Node.js/Express backend
│   ├── models/                # Mongoose schemas (Response, ExperimentControl)
│   ├── routes/                # API endpoints (experiment, amt, dashboard)
│   ├── services/              # Business logic (amtService, dataService)
│   └── middleware/            # Request validation
└── guide.md                   # Comprehensive implementation guide
```

## Critical Implementation Details

**AMT Form Submission**: All submissions to AMT must use `target="_parent"` to break out of the iframe:
```html
<form method="POST" action="${turkSubmitTo}/mturk/externalSubmit" target="_parent">
```

**Preview Mode Handling**: Always check for preview mode before collecting data:
```javascript
if (assignmentId === 'ASSIGNMENT_ID_NOT_AVAILABLE') {
  return <PreviewComponent />;
}
```

**Quality Control**: The system implements attention checks (math problems) and time limits with backend validation.

## Database Architecture

Uses MongoDB with Mongoose schemas that include:
- AMT identifiers (workerId, assignmentId, hitId)
- Experimental conditions (fontCondition, attributionCondition) 
- Quality control flags (failed, failureReasons, attentionCheckPassed)
- Timing data (startTime, endTime, completionTimeMs)

## AWS SDK Integration

Integrates with Amazon MTurk API for HIT management:
- Uses `@aws-sdk/client-mturk` with region `us-east-1`
- Supports both sandbox and production endpoints
- Includes functions for creating HITs, approving/rejecting assignments

## State Management with Redux

**Redux for Global State**: Use Redux Toolkit for all experiment state management. This ensures data persistence across AMT iframe navigation issues and provides predictable state updates.

**Required Redux Structure**:
- `experiment` slice: current page, responses, conditions, timing
- `amt` slice: AMT parameters, preview mode, submission status
- `quality` slice: attention checks, validation flags

**Component State Rules**: 
- Use Redux for experiment data, AMT parameters, and navigation state
- Use local component state only for UI-specific state (form inputs, loading states)
- All experiment responses must be stored in Redux store

## Functional Programming Approach

The codebase emphasizes functional components with Redux hooks and pure functions over classes. All React components should be functional components using Redux hooks (`useSelector`, `useDispatch`) for state management.

## Security Considerations

This is a research application dealing with human subjects data. Ensure:
- No sensitive information in logs or client-side code
- Proper input validation and sanitization
- Secure AMT parameter handling
- IP address logging for fraud detection
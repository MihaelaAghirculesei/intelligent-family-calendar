# Intelligent Family Calendar - Angular Version

This is the **Angular migration** of the original HTML/CSS/JavaScript family calendar application. This project demonstrates the evolution from a vanilla JavaScript prototype to a modern Angular application with TypeScript, component architecture, and advanced features.

## Project Evolution

1. **Phase 1**: Initial HTML/CSS/JS prototype with basic calendar layout
2. **Phase 2**: Added PDF export functionality with html2pdf.js
3. **Phase 3**: Implemented drag & drop functionality for activities
4. **Phase 4**: Added undo/redo system with keyboard shortcuts
5. **Phase 5**: **Current** - Migrated to Angular with TypeScript and modern architecture

## Features

✅ **Complete Calendar Layout** - Weekly family schedule with time slots  
✅ **PDF Export** - Export calendar to PDF with html2pdf.js integration  
✅ **Drag & Drop** - Move activities between time slots with Angular CDK  
✅ **Undo/Redo** - Full history system with keyboard shortcuts (Ctrl+Z/Ctrl+Y)  
✅ **TypeScript Models** - Type-safe data structures for activities and calendar  
✅ **Angular Services** - Separation of concerns with dedicated services  
✅ **Reactive Patterns** - RxJS observables for state management  
✅ **Component Architecture** - Modular, reusable components  

## Architecture

```
src/app/
├── components/
│   ├── calendar/           # Main calendar component
│   └── activity/           # Individual activity component
├── models/
│   ├── activity.model.ts   # Activity, Person, Calendar data types
│   └── history.model.ts    # Undo/redo action types
├── services/
│   ├── calendar.service.ts # Calendar data management
│   ├── history.service.ts  # Undo/redo functionality
│   └── pdf-export.service.ts # PDF generation
└── app.component.ts        # Root component
```

## Technologies

- **Angular 17** - Modern framework with standalone components
- **TypeScript** - Type safety and better development experience
- **Angular CDK** - Drag & drop functionality
- **RxJS** - Reactive programming for state management
- **html2pdf.js** - PDF export functionality

## Development

### Prerequisites
- Node.js (v18 or higher)
- Angular CLI (`npm install -g @angular/cli`)

### Setup
```bash
npm install
ng serve
```

Navigate to `http://localhost:4200/`

### Build
```bash
ng build --configuration production
```

## Migration Benefits

🚀 **Better Organization** - Modular components and services  
🔒 **Type Safety** - TypeScript prevents runtime errors  
⚡ **Performance** - Angular's change detection and optimization  
🧪 **Testability** - Built-in testing framework  
📱 **Scalability** - Easy to add new features and components  
🛠️ **Developer Experience** - Better tooling and debugging  

## Original Project
The original HTML/CSS/JavaScript version can be found in the `../intelligent-family-calendar` directory, showcasing the complete development journey from prototype to production-ready Angular application.

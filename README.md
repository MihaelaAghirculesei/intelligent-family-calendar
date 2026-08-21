# Intelligent Family Calendar

A family weekly schedule calendar application showcasing the complete evolution from a vanilla JavaScript prototype to a modern Angular application with TypeScript.

## Project Evolution Story

This repository demonstrates a real-world development journey, showing how a simple idea grows into a professional application through iterative improvements and technology migration.

### 📋 Development Phases

1. **Initial Prototype** - Simple HTML/CSS/JS calendar layout
2. **PDF Export** - Added html2pdf.js integration for printing
3. **Drag & Drop** - Interactive activity management with visual feedback
4. **Undo/Redo System** - Full history management with keyboard shortcuts
5. **Angular Migration** - Modern TypeScript architecture with services and components

### 🚀 Current Versions

#### Angular Version (`angular-version/`) — actively developed
- Continuous, Google Calendar-style weekly grid: activities are positioned by
  their real start/end time, sized proportionally to duration, and laid out
  side by side when they overlap
- Modern TypeScript architecture with Angular 17, component-based structure,
  type-safe models and services
- **Status**: primary version going forward — this is the one to run and extend

#### Vanilla JavaScript Version (Root) — historical reference, not maintained
- `index.html` / `styles.css` - the original prototype the project started from
- Kept for reference; new features land in the Angular version only

## 📊 Features Comparison

| Feature | Vanilla JS | Angular |
|---------|------------|---------|
| Calendar Layout | ✅ Fixed table | ✅ Continuous, time-proportional grid |
| PDF Export | ✅ html2pdf.js | 🚧 Service Ready |
| Drag & Drop | ✅ HTML5 API | ✅ Angular CDK |
| Undo/Redo | ✅ Custom System | ✅ History Service |
| Type Safety | ❌ | ✅ TypeScript |
| Component Architecture | ❌ | ✅ Angular |
| Testing Framework | ❌ | ✅ Jasmine/Karma |

## 🏃‍♂️ Quick Start

### Vanilla JavaScript Version
Simply open `index.html` in your browser - no build process needed!

### Angular Version
```bash
cd angular-version
npm install
ng serve --open
```

## 🏗️ Architecture Highlights

### Vanilla JS Approach
- **Single file architecture** with embedded JavaScript
- **Direct DOM manipulation** for interactions
- **Event-driven programming** for user actions
- **Global state management** with closure patterns

### Angular Approach  
- **Component-based architecture** with separation of concerns
- **Service injection** for business logic
- **Reactive programming** with RxJS observables
- **TypeScript models** for data structures

## 🎯 Why This Migration?

This project demonstrates:

✅ **Technical Growth** - Evolution from vanilla JS to modern frameworks  
✅ **Refactoring Skills** - Ability to migrate and improve existing code  
✅ **Architecture Planning** - Designing scalable, maintainable solutions  
✅ **Professional Development** - Following industry best practices  

## 📈 Learning Outcomes

- **Prototyping** rapid development with vanilla JavaScript
- **Progressive Enhancement** adding features iteratively  
- **Technology Migration** moving to modern frameworks
- **Code Organization** from procedural to object-oriented patterns
- **Type Safety** benefits of TypeScript over JavaScript
- **Testing Strategy** building testable applications

---

💡 **Note**: This repository serves as a portfolio piece demonstrating real-world development practices, technology migration strategies, and continuous improvement mindset.
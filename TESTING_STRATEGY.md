# Testing Strategy & Implementation Plan

*Generated from comprehensive code review - September 2025*

## 📊 Current State Analysis

### Backend (Django)
- **Current**: Placeholder tests only (`tests.py` has TODO comments)
- **Existing**: One comprehensive flow score test suite (`test_flow_score.py`) ✅
- **Infrastructure**: Standard Django testing setup ready
- **Architecture**: Well-structured service layer, complex aggregation logic, JWT auth

### Frontend (React Native/Expo)
- **Current**: Minimal testing - one snapshot test for `ThemedText`
- **Existing**: Jest with `jest-expo` preset configured
- **Infrastructure**: React Testing Library, Jest, test renderer installed
- **Architecture**: Complex context providers, timer state machines, API integration

## 🎯 Testing Strategy Overview

**Philosophy**: Incremental implementation prioritizing critical business logic first

### Coverage Goals
- **Backend**: 80%+ on critical business logic (flow score, aggregation, session lifecycle)
- **Frontend**: 70%+ on hooks and contexts (state management, timers, auth)
- **Integration**: Key user workflows and API communication
- **E2E**: Core user journeys (study session completion, goal tracking)

## 📋 Implementation Phases

### **Phase 1: Critical Backend Tests** (Priority: Immediate)

#### 1.1 Study Session Lifecycle Testing
```python
# /backend/tests/test_session_lifecycle.py
class StudySessionLifecycleTests(TestCase):
    """Test complete session workflow"""
    
    def test_complete_session_flow(self):
        # Test: Create → Add blocks → Complete → Aggregation triggers
        
    def test_session_recovery_scenarios(self):
        # Test: Orphaned sessions, concurrent completion
        
    def test_timezone_handling(self):
        # Test: Cross-timezone session scenarios
        
    def test_category_switching_during_session(self):
        # Test: Dynamic category changes, break insertion
```

**Why Priority**: Session management is core to entire application, triggers all aggregations

#### 1.2 Data Aggregation Service Testing
```python
# /backend/tests/test_aggregation_service.py
class AggregationServiceTests(TestCase):
    """Test real-time data aggregation"""
    
    def test_real_time_aggregation(self):
        # Test: Session completion triggers correct daily/weekly/monthly updates
        
    def test_timezone_boundary_cases(self):
        # Test: Date transitions, DST changes, week boundaries
        
    def test_concurrent_session_completion(self):
        # Test: Race conditions, transaction integrity
        
    def test_duration_weighted_averaging(self):
        # Test: Complex flow score averaging calculations
```

**Why Priority**: Aggregation bugs corrupt historical data, very hard to fix retrospectively

#### 1.3 Authentication Security Testing
```python
# /backend/tests/test_auth_security.py
class AuthenticationSecurityTests(TestCase):
    """Test auth security and edge cases"""
    
    def test_jwt_lifecycle(self):
        # Test: Token generation, refresh, blacklisting
        
    def test_password_reset_security(self):
        # Test: Token expiration, rate limiting, email validation
        
    def test_user_data_isolation(self):
        # Test: Users can only access their own data
        
    def test_permission_boundaries(self):
        # Test: Admin endpoints, premium feature access
```

### **Phase 2: Critical Frontend Tests** (Priority: High)

#### 2.1 State Management Testing
```typescript
// /frontend/tests/contexts/StudySessionContext.test.tsx
describe('StudySessionContext', () => {
  it('should handle complete session lifecycle', () => {
    // Test: Start → Pause → Resume → Complete flow
  });
  
  it('should recover from app crash scenarios', () => {
    // Test: Timer recovery, state persistence via AsyncStorage
  });
  
  it('should handle category switching during active sessions', () => {
    // Test: Dynamic category changes, automatic break insertion
  });
  
  it('should sync with backend correctly', () => {
    // Test: API calls, error handling, offline scenarios
  });
});

// /frontend/tests/contexts/AuthContext.test.tsx  
describe('AuthContext', () => {
  it('should handle login/logout flow', () => {
    // Test: JWT token management, AsyncStorage persistence
  });
  
  it('should handle token refresh automatically', () => {
    // Test: Background token refresh, API retry logic
  });
  
  it('should handle auth errors gracefully', () => {
    // Test: Invalid credentials, network failures, session expiry
  });
});
```

#### 2.2 Timer Logic Testing
```typescript
// /frontend/tests/hooks/useBaseTimer.test.ts
describe('useBaseTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  it('should handle timer state transitions correctly', () => {
    // Test: idle → running → paused → resumed → completed
  });
  
  it('should calculate elapsed time accurately', () => {
    // Test: Time calculations, recovery from saved state
  });
  
  it('should handle background/foreground transitions', () => {
    // Test: App backgrounding, timer recovery on app resume
  });
});

// /frontend/tests/hooks/useStopwatch.test.ts
// /frontend/tests/hooks/useCountdown.test.ts  
// /frontend/tests/hooks/usePomo.test.ts
```

### **Phase 3: Integration Testing** (Priority: Medium)

#### 3.1 API Integration
```typescript
// /frontend/tests/integration/api-integration.test.tsx
describe('API Integration', () => {
  it('should handle complete session submission', () => {
    // Test: Session data → API call → success/error handling
  });
  
  it('should handle network failures gracefully', () => {
    // Test: Retry logic, offline queuing, error states
  });
  
  it('should maintain data consistency', () => {
    // Test: Optimistic updates, rollback on failure
  });
});
```

#### 3.2 User Workflow E2E
```typescript
// /frontend/tests/e2e/study-session-flow.e2e.ts
describe('Study Session E2E', () => {
  it('should complete full study session workflow', () => {
    // Test: Login → Start Timer → Category Selection → Complete → View Results
  });
  
  it('should handle goal tracking workflow', () => {
    // Test: Set Goal → Study Sessions → Progress Tracking → Goal Achievement
  });
});
```

### **Phase 4: CI/CD Implementation** (Priority: High for Release)

#### 4.1 Mobile CI/CD Workflows

**Preview Build Workflow** (`.github/workflows/mobile-preview.yml`)
```yaml
name: Mobile Preview Build
on:
  pull_request:
    paths: ['frontend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend/studi-app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/studi-app/package-lock.json
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage --watchAll=false --passWithNoTests
      
      - name: Run linting  
        run: npm run lint
      
      - name: Type checking
        run: npx tsc --noEmit
  
  build-preview:
    needs: test
    runs-on: ubuntu-latest
    if: github.event.pull_request.draft == false
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/studi-app/package-lock.json
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
        working-directory: frontend/studi-app
      
      - name: Build preview
        run: eas build --platform ios --profile preview --non-interactive
        working-directory: frontend/studi-app
```

**Production Release Workflow** (`.github/workflows/mobile-release.yml`)
```yaml
name: Mobile Production Release
on:
  push:
    branches: [main]
    paths: ['frontend/**']
  workflow_dispatch:
    inputs:
      skip_tests:
        description: 'Skip tests (emergency only)'
        type: boolean
        default: false

jobs:
  test:
    runs-on: ubuntu-latest
    if: ${{ !inputs.skip_tests }}
    # ... same test setup as preview
  
  build-production:
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Auto-increment build number
        run: |
          cd frontend/studi-app
          # Extract current build number
          CURRENT=$(node -p "require('./app.json').expo.ios.buildNumber")
          NEW=$((CURRENT + 1))
          
          # Update app.json
          node -e "
            const config = require('./app.json');
            config.expo.ios.buildNumber = '$NEW';
            require('fs').writeFileSync('./app.json', JSON.stringify(config, null, 2));
          "
          
          echo "Build number incremented from $CURRENT to $NEW"
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build production
        run: eas build --platform ios --profile production --non-interactive
        working-directory: frontend/studi-app
      
      - name: Submit to App Store  
        run: eas submit --platform ios --profile production --non-interactive
        working-directory: frontend/studi-app
      
      - name: Commit build number increment
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add frontend/studi-app/app.json
          git commit -m "🤖 Auto-increment build number for production release"
          git push
```

#### 4.2 Backend Testing Enhancement
Update existing `.github/workflows/deploy.yml`:
```yaml
- name: Run backend tests
  run: |
    cd backend
    python manage.py test --verbosity=2 --parallel
    
- name: Test coverage report
  run: |
    cd backend
    pip install coverage
    coverage run --source='.' manage.py test
    coverage report --show-missing --fail-under=70
```

## 🛠️ Test Utilities & Infrastructure

### Frontend Test Setup
```typescript
// /frontend/tests/test-utils.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { StudySessionProvider } from '../contexts/StudySessionContext';
import { AuthProvider } from '../contexts/AuthContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo Router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Custom render with providers
export const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <StudySessionProvider>
        {ui}
      </StudySessionProvider>
    </AuthProvider>
  );
};

// Timer testing utilities
export const advanceTimers = (ms: number) => {
  jest.advanceTimersByTime(ms);
};

// API mock utilities using MSW
export const setupApiMocks = () => {
  // Setup Mock Service Worker for API calls
};
```

### Backend Test Setup
```python
# /backend/tests/test_base.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from analytics.models import Categories, StudySession
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

class StudiTestCase(TestCase):
    """Base test case with common setup"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.category = Categories.objects.create(
            user=self.user,
            name='Test Subject',
            color='#FF0000',
            category_type='study'
        )
        
    def create_test_session(self, duration_minutes=60, focus_rating=7):
        """Helper to create test sessions"""
        start_time = timezone.now()
        end_time = start_time + timedelta(minutes=duration_minutes)
        
        return StudySession.objects.create(
            user=self.user,
            start_time=start_time,
            end_time=end_time,
            focus_rating=focus_rating,
            is_completed=True
        )
```

## 📈 Implementation Timeline

### **Immediate (Pre-Release)**
- [ ] Set up CI/CD workflows for automated builds
- [ ] Create basic frontend test utilities and mocks
- [ ] Implement one critical test (StudySessionContext basic flow)

### **Post-Release Phase 1** (Week 1-2)
- [ ] Backend session lifecycle tests
- [ ] Frontend timer state management tests  
- [ ] Authentication flow tests
- [ ] Basic API integration tests

### **Post-Release Phase 2** (Week 3-4)
- [ ] Data aggregation service tests
- [ ] Complex timer scenarios (background/recovery)
- [ ] Error handling and edge cases
- [ ] Performance testing setup

### **Post-Release Phase 3** (Month 2)
- [ ] E2E user workflow tests
- [ ] Load testing for aggregation endpoints
- [ ] Security penetration testing
- [ ] Test coverage reporting and optimization

## 🎯 Success Metrics

### Quality Gates
- **Pre-deployment**: All critical tests pass
- **Backend Coverage**: 80%+ on business logic
- **Frontend Coverage**: 70%+ on state management
- **Build Time**: < 30 minutes for mobile builds
- **Zero Regressions**: No critical bugs in production

### Monitoring
- **Test Results**: Slack/Discord notifications on failures
- **Coverage Reports**: Automated generation and tracking
- **Performance**: Monitor aggregation endpoint response times
- **User Impact**: Track error rates and user feedback

## 📚 Learning Resources

### Testing Concepts
- **Unit Tests**: Test individual functions/components in isolation
- **Integration Tests**: Test how components work together
- **E2E Tests**: Test complete user workflows
- **Mocking**: Replace external dependencies with controlled test doubles

### React Native Testing
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Timer Mocks](https://jestjs.io/docs/timer-mocks)
- [Detox E2E Testing](https://github.com/wix/Detox)

### Django Testing
- [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)
- [Factory Boy for Test Data](https://factoryboy.readthedocs.io/)
- [Coverage.py for Coverage Reports](https://coverage.readthedocs.io/)

## 🚀 Quick Start Commands

### Run Frontend Tests
```bash
cd frontend/studi-app
npm test                    # Run all tests
npm test -- --coverage     # Run with coverage
npm test -- --watch        # Run in watch mode
```

### Run Backend Tests  
```bash
cd backend
python manage.py test                # Run all tests
python manage.py test --verbosity=2  # Detailed output
coverage run --source='.' manage.py test && coverage report
```

### CI/CD Setup
```bash
# Add required secrets to GitHub repository:
# - EXPO_TOKEN (from expo.dev account)
# - Any other deployment secrets

# Push to trigger workflows:
git push origin feature-branch  # Triggers preview build
git push origin main            # Triggers production release
```

---

*This document will evolve as we implement testing incrementally. Focus on getting the app released first, then use this as a roadmap for building robust testing coverage over time.*
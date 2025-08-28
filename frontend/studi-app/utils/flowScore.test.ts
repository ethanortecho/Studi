/**
 * Flow Score Test Suite
 * Comprehensive tests for edge cases and realistic scenarios
 */

import { calculateFlowScore, FlowScoreInput, convertFocusRating } from './flowScore';

interface TestCase {
  name: string;
  description: string;
  input: FlowScoreInput;
  expectedRange: [number, number];
  expectedComponents?: {
    focus?: [number, number];
    duration?: [number, number];
    breaks?: [number, number];
    deepWork?: [number, number];
  };
}

// Test data generator helpers
function createSession(
  startTime: string,
  durationMinutes: number,
  focusRating: number,
  blocks: Array<{
    subject?: string;
    duration: number; // minutes
    isBreak?: boolean;
  }>
): FlowScoreInput {
  const start = new Date(startTime);
  let currentTime = new Date(start);
  
  const categoryBlocks = blocks.map((block, index) => {
    const blockStart = new Date(currentTime);
    currentTime = new Date(currentTime.getTime() + block.duration * 60 * 1000);
    
    return {
      category_id: block.isBreak ? 99 : index,
      category_name: block.isBreak ? 'Break' : (block.subject || `Subject${index}`),
      start_time: blockStart.toISOString(),
      end_time: currentTime.toISOString(),
      duration: block.duration * 60, // Convert to seconds
      is_break: block.isBreak
    };
  });
  
  return {
    start_time: start.toISOString(),
    end_time: currentTime.toISOString(),
    focus_rating: focusRating,
    category_blocks: categoryBlocks
  };
}

// Define test cases
const testCases: TestCase[] = [
  // ========== EDGE CASES ==========
  {
    name: "Minimal Session",
    description: "5 minute session with low focus",
    input: createSession("2024-01-15T14:00:00", 5, 3, [
      { subject: "Math", duration: 5 }
    ]),
    expectedRange: [350, 450],
    expectedComponents: {
      focus: [0.2, 0.3],
      duration: [0.3, 0.3]
    }
  },
  
  {
    name: "Marathon Session",
    description: "6 hour session with few breaks",
    input: createSession("2024-01-15T14:00:00", 360, 6, [
      { subject: "Math", duration: 110 },
      { isBreak: true, duration: 10 },
      { subject: "Physics", duration: 110 },
      { isBreak: true, duration: 10 },
      { subject: "Chemistry", duration: 120 }
    ]),
    expectedRange: [450, 550],
    expectedComponents: {
      duration: [0.5, 0.5],
      breaks: [0.8, 1.0]
    }
  },
  
  {
    name: "No Breaks",
    description: "2 hour session without any breaks",
    input: createSession("2024-01-15T14:00:00", 120, 8, [
      { subject: "Math", duration: 120 }
    ]),
    expectedRange: [700, 800],
    expectedComponents: {
      breaks: [0.0, 0.5], // Should be penalized
      deepWork: [0.9, 1.0] // Should be rewarded
    }
  },
  
  {
    name: "Excessive Breaks",
    description: "Session with 50% break time",
    input: createSession("2024-01-15T14:00:00", 120, 7, [
      { subject: "Math", duration: 20 },
      { isBreak: true, duration: 20 },
      { subject: "Math", duration: 20 },
      { isBreak: true, duration: 20 },
      { subject: "Math", duration: 20 },
      { isBreak: true, duration: 20 }
    ]),
    expectedRange: [500, 600],
    expectedComponents: {
      breaks: [0.5, 0.7] // Heavy penalty
    }
  },
  
  {
    name: "Rapid Switching",
    description: "Switching subjects every 5 minutes",
    input: createSession("2024-01-15T14:00:00", 60, 7, [
      { subject: "Math", duration: 5 },
      { subject: "Physics", duration: 5 },
      { subject: "Chemistry", duration: 5 },
      { subject: "Biology", duration: 5 },
      { subject: "English", duration: 5 },
      { subject: "History", duration: 5 },
      { subject: "Math", duration: 5 },
      { subject: "Physics", duration: 5 },
      { subject: "Chemistry", duration: 5 },
      { subject: "Biology", duration: 5 },
      { subject: "English", duration: 5 },
      { subject: "History", duration: 5 }
    ]),
    expectedRange: [550, 650],
    expectedComponents: {
      deepWork: [0.5, 0.6] // Floor protection
    }
  },
  
  {
    name: "Late Night Session",
    description: "3am study session",
    input: createSession("2024-01-15T03:00:00", 60, 6, [
      { subject: "Math", duration: 60 }
    ]),
    expectedRange: [550, 650] // Time penalty applied
  },
  
  {
    name: "Perfect Session",
    description: "Optimal everything - 60 min, perfect focus, one break",
    input: createSession("2024-01-15T14:00:00", 70, 10, [
      { subject: "Math", duration: 50 },
      { isBreak: true, duration: 10 },
      { subject: "Math", duration: 10 }
    ]),
    expectedRange: [950, 1000]
  },
  
  // ========== REALISTIC PATTERNS ==========
  {
    name: "Classic Pomodoro",
    description: "4 pomodoros with proper breaks",
    input: createSession("2024-01-15T14:00:00", 115, 8, [
      { subject: "Math", duration: 25 },
      { isBreak: true, duration: 5 },
      { subject: "Math", duration: 25 },
      { isBreak: true, duration: 5 },
      { subject: "Math", duration: 25 },
      { isBreak: true, duration: 5 },
      { subject: "Math", duration: 25 }
    ]),
    expectedRange: [800, 900],
    expectedComponents: {
      focus: [0.7, 0.8],
      duration: [0.9, 1.0],
      breaks: [0.9, 1.0],
      deepWork: [0.8, 0.95]
    }
  },
  
  {
    name: "Homework Juggling",
    description: "Multiple subjects, 30 min each",
    input: createSession("2024-01-15T19:00:00", 100, 7, [
      { subject: "Math", duration: 30 },
      { isBreak: true, duration: 5 },
      { subject: "English", duration: 30 },
      { isBreak: true, duration: 5 },
      { subject: "Science", duration: 30 }
    ]),
    expectedRange: [700, 800]
  },
  
  {
    name: "Morning Review",
    description: "Quick 30 min high-focus review",
    input: createSession("2024-01-15T08:00:00", 30, 9, [
      { subject: "Math", duration: 30 }
    ]),
    expectedRange: [750, 850]
  },
  
  {
    name: "Afternoon Deep Work",
    description: "90 minute focused session with one break",
    input: createSession("2024-01-15T14:00:00", 100, 9, [
      { subject: "Physics", duration: 45 },
      { isBreak: true, duration: 10 },
      { subject: "Physics", duration: 45 }
    ]),
    expectedRange: [850, 950]
  },
  
  {
    name: "Evening Grind",
    description: "3 hour session with multiple subjects",
    input: createSession("2024-01-15T19:00:00", 180, 7, [
      { subject: "Math", duration: 50 },
      { isBreak: true, duration: 10 },
      { subject: "Physics", duration: 50 },
      { isBreak: true, duration: 10 },
      { subject: "Chemistry", duration: 50 },
      { isBreak: true, duration: 10 }
    ]),
    expectedRange: [650, 750]
  },
  
  {
    name: "Cramming Session",
    description: "3 hours, minimal breaks, tired",
    input: createSession("2024-01-15T22:00:00", 180, 5, [
      { subject: "Biology", duration: 90 },
      { isBreak: true, duration: 5 },
      { subject: "Biology", duration: 85 }
    ]),
    expectedRange: [500, 600]
  },
  
  {
    name: "Missing Focus Rating",
    description: "Good session but forgot to rate focus",
    input: {
      ...createSession("2024-01-15T14:00:00", 60, 6, [
        { subject: "Math", duration: 60 }
      ]),
      focus_rating: undefined
    },
    expectedRange: [650, 750] // Should use default focus
  }
];

// Test runner function
export function runFlowScoreTests(verbose: boolean = false): {
  passed: number;
  failed: number;
  results: Array<{
    name: string;
    passed: boolean;
    score: number;
    expectedRange: [number, number];
    components?: any;
  }>;
} {
  const results: any[] = [];
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(test => {
    const result = calculateFlowScore(test.input);
    const inRange = result.score >= test.expectedRange[0] && 
                   result.score <= test.expectedRange[1];
    
    // Check component ranges if specified
    let componentsValid = true;
    if (test.expectedComponents) {
      for (const [key, range] of Object.entries(test.expectedComponents)) {
        const value = (result.components as any)[key];
        if (value < range[0] || value > range[1]) {
          componentsValid = false;
          if (verbose) {
            console.log(`  ⚠️ ${key}: ${value.toFixed(2)} outside range [${range[0]}, ${range[1]}]`);
          }
        }
      }
    }
    
    const testPassed = inRange && componentsValid;
    
    if (testPassed) {
      passed++;
    } else {
      failed++;
    }
    
    results.push({
      name: test.name,
      passed: testPassed,
      score: result.score,
      expectedRange: test.expectedRange,
      components: result.components,
      details: result.details
    });
    
    if (verbose) {
      const emoji = testPassed ? '✅' : '❌';
      console.log(`${emoji} ${test.name}: ${result.score} (expected ${test.expectedRange[0]}-${test.expectedRange[1]})`);
      console.log(`   ${test.description}`);
      if (!testPassed || verbose) {
        console.log(`   Components:`, result.components);
        console.log(`   Details:`, result.details);
      }
    }
  });
  
  return { passed, failed, results };
}

// Statistical analysis of score distribution
export function analyzeScoreDistribution(scores: number[]): {
  mean: number;
  median: number;
  std: number;
  percentiles: { p10: number; p25: number; p50: number; p75: number; p90: number };
} {
  const sorted = [...scores].sort((a, b) => a - b);
  const n = sorted.length;
  
  const mean = scores.reduce((sum, s) => sum + s, 0) / n;
  const median = sorted[Math.floor(n / 2)];
  
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  
  return {
    mean,
    median,
    std,
    percentiles: {
      p10: sorted[Math.floor(n * 0.1)],
      p25: sorted[Math.floor(n * 0.25)],
      p50: median,
      p75: sorted[Math.floor(n * 0.75)],
      p90: sorted[Math.floor(n * 0.9)]
    }
  };
}

// Export test data for use in other files
export { testCases, createSession };
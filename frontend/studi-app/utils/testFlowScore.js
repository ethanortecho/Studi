/**
 * Simple test runner for Flow Score algorithm
 * Run with: node utils/testFlowScore.js
 */

// Since we're using plain JS, we'll recreate the algorithm here
// In production, this would import from the TS file

function calculateFlowScore(input) {
  // Parse times and calculate durations
  const startTime = new Date(input.start_time);
  const endTime = new Date(input.end_time);
  const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  
  // Separate breaks from study blocks
  const studyBlocks = input.category_blocks.filter(b => 
    !b.is_break && (!b.category_name || b.category_name.toLowerCase() !== 'break')
  );
  const breakBlocks = input.category_blocks.filter(b => 
    b.is_break || (b.category_name && b.category_name.toLowerCase() === 'break')
  );
  
  // Calculate break and focus minutes
  const breakMinutes = breakBlocks.reduce((sum, b) => sum + (b.duration / 60), 0);
  const focusMinutes = totalMinutes - breakMinutes;
  
  // Get start hour
  const startHour = startTime.getHours();
  
  // Component scores
  const focusScore = calculateFocusScore(input.focus_rating);
  const durationScore = calculateDurationScore(focusMinutes);
  const breakScore = calculateBreakScore(focusMinutes, breakMinutes, totalMinutes, breakBlocks);
  const { score: deepWorkScore, subjectCount, avgBlockLength } = calculateDeepWorkScore(studyBlocks, focusMinutes);
  const timeMultiplier = calculateTimeOfDayMultiplier(startHour);
  
  // Calculate final score
  const baseScore = 1000 * (
    0.40 * focusScore +
    0.25 * durationScore +
    0.15 * breakScore +
    0.15 * deepWorkScore +
    0.05 * 1.0
  );
  
  const finalScore = Math.round(Math.max(300, Math.min(1000, baseScore * timeMultiplier)));
  
  return {
    score: finalScore,
    components: {
      focus: focusScore,
      duration: durationScore,
      breaks: breakScore,
      deepWork: deepWorkScore,
      timeMultiplier
    },
    details: {
      totalMinutes: Math.round(totalMinutes),
      focusMinutes: Math.round(focusMinutes),
      breakMinutes: Math.round(breakMinutes),
      subjectCount,
      avgBlockLength: Math.round(avgBlockLength),
      startHour
    }
  };
}

function calculateFocusScore(rating) {
  const focusRating = rating || 6;
  const clampedRating = Math.max(1, Math.min(10, focusRating));
  return Math.pow(clampedRating / 10, 1.2);
}

function calculateDurationScore(m) {
  if (m <= 10) return 0.3;
  else if (m <= 50) return 0.3 + 0.7 * (m - 10) / 40;
  else if (m <= 90) return 1.0;
  else if (m <= 150) return 1.0 - 0.2 * (m - 90) / 60;
  else if (m <= 240) return 0.8 - 0.3 * (m - 150) / 90;
  else return 0.5;
}

function calculateBreakScore(focusMinutes, breakMinutes, totalMinutes, breakBlocks) {
  if (focusMinutes <= 60) {
    return breakBlocks.length === 0 ? 1.0 : 0.9;
  }
  
  const recommendedBreaks = Math.floor(focusMinutes / 60);
  const goodBreaks = breakBlocks.filter(b => {
    const minutes = b.duration / 60;
    return minutes >= 3 && minutes <= 20;
  }).length;
  
  let score = recommendedBreaks === 0 ? 1.0 : Math.min(1.0, goodBreaks / recommendedBreaks);
  
  if (breakMinutes > 0.4 * totalMinutes) {
    score *= 0.85;
  }
  
  return Math.max(0, score);
}

function calculateDeepWorkScore(studyBlocks, focusMinutes) {
  if (studyBlocks.length === 0 || focusMinutes === 0) {
    return { score: 0.5, subjectCount: 0, avgBlockLength: 0 };
  }
  
  const subjectMinutes = {};
  studyBlocks.forEach(block => {
    const subject = block.category_name || block.category_id.toString();
    subjectMinutes[subject] = (subjectMinutes[subject] || 0) + (block.duration / 60);
  });
  
  const subjects = Object.keys(subjectMinutes);
  const subjectCount = subjects.length;
  
  const herfindahl = subjects.reduce((sum, subject) => {
    const proportion = subjectMinutes[subject] / focusMinutes;
    return sum + Math.pow(proportion, 2);
  }, 0);
  
  const avgBlockLength = focusMinutes / studyBlocks.length;
  
  let score = 0.3 + 0.4 * herfindahl + 0.3 * Math.min(1, avgBlockLength / 25);
  
  if (studyBlocks.length > focusMinutes / 20) {
    score *= 0.92;
  }
  
  return {
    score: Math.max(0.5, Math.min(1, score)),
    subjectCount,
    avgBlockLength
  };
}

function calculateTimeOfDayMultiplier(hour) {
  if (hour >= 11 && hour < 21) return 1.02;
  else if ((hour >= 9 && hour < 11) || (hour >= 21 && hour < 23)) return 1.00;
  else if ((hour >= 7 && hour < 9) || (hour >= 23 && hour < 24)) return 0.98;
  else return 0.95;
}

// Test cases
const tests = [
  {
    name: "Quick Morning Session",
    session: {
      start_time: "2024-01-15T08:30:00",
      end_time: "2024-01-15T09:00:00",
      focus_rating: 8,
      category_blocks: [
        {
          category_id: 1,
          category_name: "Math",
          start_time: "2024-01-15T08:30:00",
          end_time: "2024-01-15T09:00:00",
          duration: 1800,
          is_break: false
        }
      ]
    },
    expectedRange: [700, 850]
  },
  {
    name: "Perfect Pomodoro",
    session: {
      start_time: "2024-01-15T14:00:00",
      end_time: "2024-01-15T15:00:00",
      focus_rating: 9,
      category_blocks: [
        {
          category_id: 1,
          category_name: "Physics",
          start_time: "2024-01-15T14:00:00",
          end_time: "2024-01-15T14:25:00",
          duration: 1500,
          is_break: false
        },
        {
          category_id: 99,
          category_name: "Break",
          start_time: "2024-01-15T14:25:00",
          end_time: "2024-01-15T14:30:00",
          duration: 300,
          is_break: true
        },
        {
          category_id: 1,
          category_name: "Physics",
          start_time: "2024-01-15T14:30:00",
          end_time: "2024-01-15T14:55:00",
          duration: 1500,
          is_break: false
        },
        {
          category_id: 99,
          category_name: "Break",
          start_time: "2024-01-15T14:55:00",
          end_time: "2024-01-15T15:00:00",
          duration: 300,
          is_break: true
        }
      ]
    },
    expectedRange: [850, 950]
  },
  {
    name: "Late Night Cramming",
    session: {
      start_time: "2024-01-15T23:00:00",
      end_time: "2024-01-16T02:00:00",
      focus_rating: 5,
      category_blocks: [
        {
          category_id: 1,
          category_name: "Biology",
          start_time: "2024-01-15T23:00:00",
          end_time: "2024-01-16T02:00:00",
          duration: 10800,
          is_break: false
        }
      ]
    },
    expectedRange: [450, 550]
  },
  {
    name: "Subject Switching",
    session: {
      start_time: "2024-01-15T16:00:00",
      end_time: "2024-01-15T17:30:00",
      focus_rating: 7,
      category_blocks: [
        {
          category_id: 1,
          category_name: "Math",
          start_time: "2024-01-15T16:00:00",
          end_time: "2024-01-15T16:30:00",
          duration: 1800,
          is_break: false
        },
        {
          category_id: 2,
          category_name: "English",
          start_time: "2024-01-15T16:30:00",
          end_time: "2024-01-15T17:00:00",
          duration: 1800,
          is_break: false
        },
        {
          category_id: 3,
          category_name: "Science",
          start_time: "2024-01-15T17:00:00",
          end_time: "2024-01-15T17:30:00",
          duration: 1800,
          is_break: false
        }
      ]
    },
    expectedRange: [650, 750]
  }
];

// Run tests
console.log("\n🧪 Flow Score Algorithm Test Results\n");
console.log("=" .repeat(60));

let passed = 0;
let failed = 0;

tests.forEach(test => {
  const result = calculateFlowScore(test.session);
  const inRange = result.score >= test.expectedRange[0] && result.score <= test.expectedRange[1];
  
  const status = inRange ? "✅ PASS" : "❌ FAIL";
  passed += inRange ? 1 : 0;
  failed += inRange ? 0 : 1;
  
  console.log(`\n${status} ${test.name}`);
  console.log(`   Score: ${result.score} (expected ${test.expectedRange[0]}-${test.expectedRange[1]})`);
  console.log(`   Components:`);
  console.log(`     - Focus: ${(result.components.focus * 100).toFixed(0)}%`);
  console.log(`     - Duration: ${(result.components.duration * 100).toFixed(0)}%`);
  console.log(`     - Breaks: ${(result.components.breaks * 100).toFixed(0)}%`);
  console.log(`     - Deep Work: ${(result.components.deepWork * 100).toFixed(0)}%`);
  console.log(`     - Time Multiplier: ${result.components.timeMultiplier}x`);
  console.log(`   Details: ${result.details.focusMinutes}min study, ${result.details.breakMinutes}min break`);
});

console.log("\n" + "=" .repeat(60));
console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`);

// Score distribution analysis
const allScores = tests.map(t => calculateFlowScore(t.session).score);
const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
console.log(`Average Score: ${Math.round(avg)}`);
console.log(`Score Range: ${Math.min(...allScores)} - ${Math.max(...allScores)}`);
console.log("\n");
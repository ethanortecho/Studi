#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to calculate relative path from one file to another
function getRelativePath(fromFile, toPath) {
  const fromDir = path.dirname(fromFile);
  const toFullPath = path.join(process.cwd(), toPath);
  let relativePath = path.relative(fromDir, toFullPath);
  
  // Ensure we use forward slashes and add ./ for same-directory or child imports
  relativePath = relativePath.replace(/\\/g, '/');
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  
  return relativePath;
}

// Function to analyze imports in a file (dry run)
function analyzeImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Match both: from '@/...' and from "@/..."
    const importRegex = /from\s+['"]@\/([^'"]+)['"]/g;
    
    let match;
    const imports = [];
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      const relativePath = getRelativePath(filePath, importPath);
      imports.push({
        original: `@/${importPath}`,
        relative: relativePath,
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    return imports;
  } catch (err) {
    console.error(`Error reading ${filePath}: ${err.message}`);
    return [];
  }
}

// Test with a few files first
function main() {
  console.log('Analyzing @ imports (DRY RUN - no files will be modified)\n');
  
  // Test with specific files first
  const testFiles = [
    'app/(tabs)/_layout.tsx',
    'app/(tabs)/home.tsx',
    'app/_layout.tsx',
    'components/analytics/DashboardKPIs.tsx',
    'context/StudySessionContext.tsx'
  ];
  
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const imports = analyzeImportsInFile(file);
      if (imports.length > 0) {
        console.log(`\n${file}:`);
        imports.forEach(imp => {
          console.log(`  Line ${imp.line}: '${imp.original}' → '${imp.relative}'`);
        });
      }
    }
  });
  
  // Count total imports
  console.log('\n--- Summary ---');
  const { execSync } = require('child_process');
  const totalImports = execSync('grep -r "from \'@/" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l || echo 0', { encoding: 'utf8' }).trim();
  console.log(`Total @ imports found: ${totalImports}`);
  
  console.log('\nThis is a dry run. Review the conversions above.');
  console.log('If they look correct, we can proceed with the actual conversion.');
}

main();
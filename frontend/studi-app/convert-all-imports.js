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

// Function to convert @ imports in a file
function convertImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Match both: from '@/...' and from "@/..."
    const importRegex = /from\s+['"]@\/([^'"]+)['"]/g;
    
    const newContent = content.replace(importRegex, (match, importPath) => {
      const relativePath = getRelativePath(filePath, importPath);
      modified = true;
      console.log(`  ${filePath}: '@/${importPath}' → '${relativePath}'`);
      return `from '${relativePath}'`;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, newContent);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
    return false;
  }
}

// Get all TypeScript files
function getAllTypeScriptFiles() {
  const { execSync } = require('child_process');
  const files = execSync('find . -type f \\( -name "*.ts" -o -name "*.tsx" \\) -not -path "./node_modules/*" -not -name "*.backup"', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(f => f)
    .map(f => f.startsWith('./') ? f.substring(2) : f);
  
  return files;
}

// Main function
function main() {
  console.log('Converting ALL @ imports to relative imports...\n');
  
  const files = getAllTypeScriptFiles();
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      totalFiles++;
      if (convertImportsInFile(file)) {
        modifiedFiles++;
      }
    }
  });
  
  console.log(`\n✓ Processed ${totalFiles} files`);
  console.log(`✓ Modified ${modifiedFiles} files`);
  console.log('\nConversion complete! You can now test the app locally and then push for EAS build.');
  console.log('\nIf you need to revert: git checkout -- .');
}

main();
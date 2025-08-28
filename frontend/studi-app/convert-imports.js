#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

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
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Match both: from '@/...' and from "@/..."
  const importRegex = /from\s+['"]@\/([^'"]+)['"]/g;
  
  const newContent = content.replace(importRegex, (match, importPath) => {
    const relativePath = getRelativePath(filePath, importPath);
    modified = true;
    console.log(`  ${filePath}:`);
    console.log(`    '@/${importPath}' → '${relativePath}'`);
    return `from '${relativePath}'`;
  });
  
  if (modified) {
    // Create backup
    fs.writeFileSync(`${filePath}.backup`, content);
    // Write updated content
    fs.writeFileSync(filePath, newContent);
    return true;
  }
  
  return false;
}

// Main function
function main() {
  console.log('Converting @ imports to relative imports...\n');
  
  // Find all TypeScript files
  const files = glob.sync('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', '*.backup']
  });
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  files.forEach(file => {
    totalFiles++;
    if (convertImportsInFile(file)) {
      modifiedFiles++;
    }
  });
  
  console.log(`\n✓ Processed ${totalFiles} files`);
  console.log(`✓ Modified ${modifiedFiles} files`);
  console.log(`✓ Backup files created with .backup extension`);
  console.log('\nTo restore original files: find . -name "*.backup" -exec sh -c \'mv "$0" "${0%.backup}"\' {} \\;');
}

// Check if glob is installed
try {
  require.resolve('glob');
  main();
} catch(e) {
  console.log('Installing required dependency...');
  require('child_process').execSync('npm install glob', { stdio: 'inherit' });
  console.log('Dependency installed. Please run the script again.');
}
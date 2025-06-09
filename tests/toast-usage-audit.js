/**
 * Toast Usage Audit
 * 
 * This script audits all toast usage in the codebase to ensure
 * only valid react-hot-toast methods are being used.
 */

const fs = require('fs');
const path = require('path');

// Valid toast methods from react-hot-toast
const VALID_TOAST_METHODS = [
  'toast(',           // Default toast
  'toast.success(',   // Success toast
  'toast.error(',     // Error toast
  'toast.loading(',   // Loading toast
  'toast.custom(',    // Custom toast
  'toast.dismiss(',   // Dismiss toast
  'toast.remove(',    // Remove toast
  'toast.promise(',   // Promise toast
];

// Invalid methods that don't exist
const INVALID_TOAST_METHODS = [
  'toast.info(',      // This doesn't exist!
  'toast.warning(',   // This doesn't exist!
  'toast.warn(',      // This doesn't exist!
];

function findFilesRecursively(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .next directories
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
          traverse(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function auditToastUsage() {
  console.log('🔍 Auditing toast usage in codebase...\n');
  
  const projectRoot = path.resolve(__dirname, '..');
  const files = findFilesRecursively(projectRoot);
  
  let totalFiles = 0;
  let filesWithToast = 0;
  let validUsages = 0;
  let invalidUsages = 0;
  const issues = [];
  
  for (const file of files) {
    totalFiles++;

    // Skip this audit file itself to avoid false positives
    if (file.includes('toast-usage-audit.js')) {
      continue;
    }

    try {
      const content = fs.readFileSync(file, 'utf8');

      // Check if file contains toast usage
      if (content.includes('toast')) {
        filesWithToast++;
        
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;
          
          // Check for valid toast methods
          for (const method of VALID_TOAST_METHODS) {
            if (line.includes(method)) {
              validUsages++;
            }
          }
          
          // Check for invalid toast methods
          for (const method of INVALID_TOAST_METHODS) {
            if (line.includes(method)) {
              invalidUsages++;
              issues.push({
                file: path.relative(projectRoot, file),
                line: lineNumber,
                content: line.trim(),
                issue: `Invalid toast method: ${method.replace('(', '')}`
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not read file: ${file}`);
    }
  }
  
  // Report results
  console.log('📊 Toast Usage Audit Results:');
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Files with toast usage: ${filesWithToast}`);
  console.log(`   Valid toast usages: ${validUsages}`);
  console.log(`   Invalid toast usages: ${invalidUsages}`);
  
  if (issues.length > 0) {
    console.log('\n❌ Issues found:');
    for (const issue of issues) {
      console.log(`   ${issue.file}:${issue.line}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Code: ${issue.content}`);
      console.log('');
    }
    return false;
  } else {
    console.log('\n✅ No invalid toast usage found!');
    return true;
  }
}

// Also check for proper imports
function auditToastImports() {
  console.log('\n🔍 Auditing toast imports...\n');
  
  const projectRoot = path.resolve(__dirname, '..');
  const files = findFilesRecursively(projectRoot);
  
  const importPatterns = [
    /import\s+toast\s+from\s+['"]react-hot-toast['"]/,           // Default import
    /import\s+\{\s*toast\s*\}\s+from\s+['"]react-hot-toast['"]/,  // Named import
    /import\s+\*\s+as\s+toast\s+from\s+['"]react-hot-toast['"]/,  // Namespace import
    /import\s+\{\s*Toaster\s*\}\s+from\s+['"]react-hot-toast['"]/,  // Toaster component import
    /import\s+\{\s*[^}]*toast[^}]*\}\s+from\s+['"]react-hot-toast['"]/,  // Mixed imports with toast
  ];
  
  const validImports = [];
  const invalidImports = [];
  
  for (const file of files) {
    // Skip this audit file itself to avoid false positives
    if (file.includes('toast-usage-audit.js')) {
      continue;
    }

    try {
      const content = fs.readFileSync(file, 'utf8');

      if (content.includes('react-hot-toast')) {
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;
          
          if (line.includes('react-hot-toast')) {
            const isValidImport = importPatterns.some(pattern => pattern.test(line));
            
            if (isValidImport) {
              validImports.push({
                file: path.relative(projectRoot, file),
                line: lineNumber,
                content: line.trim()
              });
            } else if (line.includes('import') && line.includes('react-hot-toast')) {
              invalidImports.push({
                file: path.relative(projectRoot, file),
                line: lineNumber,
                content: line.trim()
              });
            }
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  console.log('📊 Toast Import Audit Results:');
  console.log(`   Valid imports found: ${validImports.length}`);
  console.log(`   Invalid imports found: ${invalidImports.length}`);
  
  if (validImports.length > 0) {
    console.log('\n✅ Valid imports:');
    for (const imp of validImports) {
      console.log(`   ${imp.file}:${imp.line} - ${imp.content}`);
    }
  }
  
  if (invalidImports.length > 0) {
    console.log('\n❌ Invalid imports:');
    for (const imp of invalidImports) {
      console.log(`   ${imp.file}:${imp.line} - ${imp.content}`);
    }
    return false;
  }
  
  return true;
}

// Run the audit
if (require.main === module) {
  console.log('🧪 Starting Toast Usage Audit...\n');
  
  const usageAuditPassed = auditToastUsage();
  const importAuditPassed = auditToastImports();
  
  if (usageAuditPassed && importAuditPassed) {
    console.log('\n🎉 All toast usage audits passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Toast usage audit failed!');
    process.exit(1);
  }
}

module.exports = { auditToastUsage, auditToastImports };

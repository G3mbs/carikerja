# 📁 CodeRabbit Folder-Specific Review Guide

## Overview
Panduan untuk menggunakan CodeRabbit untuk review folder atau area kerja spesifik dalam project CariKerja.

## 🎯 Folder Review Profiles

### 1. **API Development Review**
**Target**: `src/app/api/**`, `src/lib/auth.ts`, `src/lib/supabase.ts`

**Focus Areas**:
- 🔒 Security vulnerabilities
- 🔐 Authentication logic
- ✅ Input validation
- ⚠️ Error handling
- 🏗️ API design patterns

**Usage**:
```bash
# Review semua API routes
./scripts/coderabbit-folder-review.ps1 -FolderPath "src/app/api" -ReviewType "security"

# Atau gunakan command di PR:
@coderabbitai review src/app/api folder for security vulnerabilities
```

### 2. **Frontend Development Review**
**Target**: `src/components/**`, `src/app/**/*.tsx`

**Focus Areas**:
- ⚡ Performance optimization
- ♿ Accessibility compliance
- ⚛️ React best practices
- 🎨 UI/UX patterns
- 📱 Responsive design

**Usage**:
```bash
# Review komponen UI
./scripts/coderabbit-folder-review.ps1 -FolderPath "src/components" -ReviewType "performance"

# Command di PR:
@coderabbitai analyze src/components for performance and accessibility issues
```

### 3. **Business Logic Review**
**Target**: `src/lib/**`, `src/types/**`

**Focus Areas**:
- 🧠 Logic correctness
- 🔷 Type safety
- ⚡ Performance
- 🔧 Maintainability
- 📚 Documentation

**Usage**:
```bash
# Review business logic
./scripts/coderabbit-folder-review.ps1 -FolderPath "src/lib" -ReviewType "comprehensive"

# Command di PR:
@coderabbitai review src/lib folder for logic correctness and type safety
```

### 4. **Database & Infrastructure Review**
**Target**: `database/**`, `scripts/**`, `*.config.*`

**Focus Areas**:
- 🔒 Security vulnerabilities
- 🗄️ Data integrity
- 🔄 Migration safety
- ⚡ Performance impact
- 💾 Backup strategy

**Usage**:
```bash
# Review database changes
./scripts/coderabbit-folder-review.ps1 -FolderPath "database" -ReviewType "security"

# Command di PR:
@coderabbitai review database folder for security and migration safety
```

## 🚀 Cara Menggunakan

### **Method 1: Menggunakan Script PowerShell**

```bash
# Basic usage
./scripts/coderabbit-folder-review.ps1 -FolderPath "src/components"

# With specific review type
./scripts/coderabbit-folder-review.ps1 -FolderPath "src/app/api" -ReviewType "security"

# With custom branch name
./scripts/coderabbit-folder-review.ps1 -FolderPath "src/lib" -BranchName "review/lib-optimization"
```

### **Method 2: Manual PR dengan Commands**

1. **Create branch untuk folder yang ingin di-review**:
```bash
git checkout -b review/api-security-check
```

2. **Buat perubahan kecil di folder target** (untuk trigger review):
```bash
echo "// CodeRabbit review request" >> src/app/api/README.md
git add .
git commit -m "Request CodeRabbit review for API folder"
git push origin review/api-security-check
```

3. **Create PR dan tambahkan command**:
```markdown
@coderabbitai Please review the src/app/api folder with focus on:
- Security vulnerabilities
- Authentication logic
- Input validation
- Error handling

Priority: High
```

### **Method 3: Menggunakan PR Comments**

Dalam PR yang sudah ada, gunakan commands:

```markdown
# Review folder spesifik
@coderabbitai review src/components folder for performance issues

# Review multiple folders
@coderabbitai analyze src/lib and src/types folders for type safety

# Review dengan focus area
@coderabbitai check src/app/api folder for security vulnerabilities and authentication issues

# Review dengan context
@coderabbitai review database folder for migration safety and data integrity, considering Indonesian market requirements
```

## 📋 Available Commands

### **Security Focus**
```markdown
@coderabbitai security scan src/app/api folder
@coderabbitai check for SQL injection vulnerabilities in database folder
@coderabbitai analyze authentication security in src/lib folder
```

### **Performance Focus**
```markdown
@coderabbitai performance review src/components folder
@coderabbitai analyze React performance in src/components folder
@coderabbitai check database query performance in src/lib folder
```

### **Type Safety Focus**
```markdown
@coderabbitai type safety check src/types folder
@coderabbitai analyze TypeScript usage in src/lib folder
@coderabbitai review interface definitions in src/types folder
```

### **Indonesian Market Focus**
```markdown
@coderabbitai review for Indonesian localization in src/components folder
@coderabbitai check Indonesian market compliance in src/lib folder
@coderabbitai analyze Bahasa Indonesia support in src/types folder
```

## 🎯 Folder-Specific Configurations

### **API Routes (`src/app/api/`)**
- **Priority**: Critical
- **Auto-review**: Enabled
- **Focus**: Security, Authentication, Validation
- **Severity threshold**: Medium
- **Required reviewers**: 2

### **Components (`src/components/`)**
- **Priority**: High
- **Auto-review**: Enabled
- **Focus**: Performance, Accessibility, React patterns
- **Severity threshold**: Low
- **Required reviewers**: 1

### **Library (`src/lib/`)**
- **Priority**: High
- **Auto-review**: Enabled
- **Focus**: Logic, Type safety, Performance
- **Severity threshold**: Medium
- **Required reviewers**: 1

### **Database (`database/`)**
- **Priority**: Critical
- **Auto-review**: Enabled
- **Focus**: Security, Data integrity, Migration safety
- **Severity threshold**: High
- **Required reviewers**: 2

## 📊 Review Metrics

CodeRabbit akan track metrics per folder:

### **Security Metrics**
- Vulnerability count
- Security score improvement
- Critical issues resolved

### **Performance Metrics**
- Performance score
- Optimization suggestions implemented
- Bundle size impact

### **Quality Metrics**
- Code quality score
- Best practices compliance
- Documentation coverage

## 🔧 Customization

### **Tambah Folder Baru**
Edit `.coderabbit-folders.yaml`:

```yaml
folder_configurations:
  "src/utils/":
    review_priority: "medium"
    focus_areas:
      - "Utility function correctness"
      - "Performance optimization"
      - "Type safety"
```

### **Custom Rules**
Tambah rules khusus untuk folder:

```yaml
custom_checks:
  - pattern: "console\\.log"
    message: "Remove console.log before production"
    severity: "low"
    folders: ["src/components/**"]
```

## 🎉 Best Practices

### **Untuk Developer**
1. **Review folder sebelum merge** ke main branch
2. **Focus pada area yang sering berubah**
3. **Address critical issues** sebelum minor issues
4. **Gunakan specific commands** untuk targeted review

### **Untuk Team Lead**
1. **Setup folder-specific rules** sesuai team standards
2. **Monitor metrics** untuk track improvement
3. **Customize severity thresholds** per folder
4. **Review critical folders** lebih sering

### **Untuk Project**
1. **Consistent folder structure** untuk optimal review
2. **Document folder purposes** untuk better AI context
3. **Regular review** untuk maintain quality
4. **Track improvements** over time

---

**🚀 Start reviewing specific folders now untuk improve code quality secara targeted!**

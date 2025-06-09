# Database Setup

This directory contains all database-related files for the CariKerja project.

## Files

- `setup.sql` - Main database setup script (consolidated)
- `linkedin-tables.sql` - LinkedIn scraping specific tables
- `setup-database.js` - Database setup automation script

## Usage

1. Run `setup.sql` in your Supabase SQL editor
2. Run `linkedin-tables.sql` for LinkedIn scraping features
3. Use `setup-database.js` for automated setup

## Notes

- All scripts are idempotent (safe to run multiple times)
- Service role key required for setup script

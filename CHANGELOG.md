# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Core Features
- **Retry Strategies** - Built-in retry mechanisms for resilient uploads
  - `exponentialBackoff()` - Exponential backoff with optional jitter
  - `fixedDelay()` - Fixed delay between retry attempts
  - `networkErrorsOnly()` - Only retry network failures
  - `customRetry()` - Fully customizable retry logic
  - Dynamic delay calculation support (function-based delays)

- **File Validation** - Pre-upload validation utilities
  - `validateFile()` - Comprehensive file validation
  - `validateSize()` - Size-only validation
  - `validateType()` - MIME type and extension validation
  - `formatValidationError()` - Human-readable error messages
  - `formatBytes()` - Byte formatting utility
  - `FILE_TYPE_PRESETS` - Common file type groups (images, videos, audio, documents, archives)
  - `FILE_SIZE_PRESETS` - Common size limits (1MB, 5MB, 10MB, 50MB, 100MB, 500MB, 1GB)

- **Batch Upload Utilities** - Multi-file upload management
  - `batchUpload()` - Concurrent multi-file uploads with progress tracking
  - `sequentialUpload()` - Sequential file uploads
  - `createUploadQueue()` - Dynamic upload queue with runtime control
  - Concurrency control and progress aggregation
  - Individual file status tracking
  - Error handling per file and overall batch

#### Type System Enhancements
- Enhanced `RetryOptions` to support dynamic delay functions
- Added comprehensive types for batch uploads and validation
- Exported all new utility types from `@uplnk/core`

#### Documentation
- **Advanced Usage Guide** - Comprehensive examples and patterns
  - Batch upload patterns
  - Retry strategy examples
  - File validation workflows
  - Error handling best practices
  - Progress tracking techniques
  - React and Vue integration examples
  - Performance optimization tips
- **Enhanced API Reference** - Complete documentation for all new features
- **Updated Getting Started Guide** - Quick examples of new features
- **Enhanced Landing Page** - Feature highlights and quick examples

#### Developer Experience
- **CI Workflow** - Automated testing and type checking on push/PR
- **Enhanced Docs Workflow** - 
  - Build verification on PRs
  - Separate build and deploy jobs
  - Better error handling
  - Proper caching configuration
- **Comprehensive Test Suite** - 
  - 67 passing tests across all features
  - Retry strategy tests (25 tests)
  - Validator tests (39 tests)
  - Full coverage of edge cases

### Changed
- Updated main README with feature badges and comprehensive examples
- Enhanced core package README with quick start examples for all features
- Fixed VitePress build error (dead link in docs README)
- Improved documentation navigation with advanced usage guide

### Fixed
- Dead link to `.vitepress/config.mts` in docs package README
- VitePress build now succeeds in CI/CD pipeline

## [0.0.1] - Initial Release

### Added
- Basic `uplnk()` function for single file uploads
- Progress tracking with `onProgress` callback
- Abort support via `AbortSignal`
- Timeout support
- Custom headers and HTTP methods
- Lifecycle hooks (`onStart`, `onResponse`, `onError`)
- Basic retry support with manual configuration
- XMLHttpRequest-based implementation for browser
- TypeScript support with full type definitions
- Comprehensive error types (abort, timeout, network, HTTP)
- Progress information (loaded, total, percent, speed, ETA)
- Progress throttling options

[Unreleased]: https://github.com/a-saed/uplnk/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/a-saed/uplnk/releases/tag/v0.0.1
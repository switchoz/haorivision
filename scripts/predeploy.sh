#!/usr/bin/env bash
###############################################################################
# HAORI VISION — Pre-Deploy Validation Script
###############################################################################
#
# This script runs comprehensive checks before deployment to ensure:
# - Product catalog is valid
# - No duplicate IDs exist
# - All media files are present
# - Accessibility and SEO standards are met
# - Critical user flows work (checkout)
#
# If ANY check fails, the script exits with code 1, preventing deployment.
#
# Usage:
#   ./scripts/predeploy.sh
#   npm run predeploy:check
#
###############################################################################

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

###############################################################################
# Configuration
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR="$PROJECT_ROOT/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/predeploy_${TIMESTAMP}.txt"

# Exit codes
EXIT_SUCCESS=0
EXIT_FAILURE=1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

###############################################################################
# Helper Functions
###############################################################################

print_header() {
  echo ""
  echo -e "${CYAN}============================================================${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}============================================================${NC}"
  echo ""
}

print_step() {
  echo -e "${BLUE}[▸]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
  echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
  echo -e "${CYAN}[i]${NC} $1"
}

log_to_report() {
  echo "$1" >> "$REPORT_FILE"
}

# Initialize report file
init_report() {
  mkdir -p "$REPORT_DIR"
  cat > "$REPORT_FILE" <<EOF
============================================================
HAORI VISION — Pre-Deploy Validation Report
============================================================

Date: $(date +"%Y-%m-%d %H:%M:%S")
User: $(whoami)
Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")
Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")

============================================================
VALIDATION CHECKS
============================================================

EOF
}

###############################################################################
# Validation Functions
###############################################################################

# Check 1: Validate Catalog
validate_catalog() {
  print_step "Running catalog validation..."
  log_to_report "[1/5] Catalog Validation"
  log_to_report "Command: npm run validate:catalog"
  log_to_report ""

  if npm run validate:catalog >> "$REPORT_FILE" 2>&1; then
    print_success "Catalog validation passed"
    log_to_report "Status: PASSED"
    log_to_report ""
    return 0
  else
    print_error "Catalog validation failed"
    log_to_report "Status: FAILED"
    log_to_report ""
    return 1
  fi
}

# Check 2: ID Conflict Check (Dry Run)
check_id_conflicts() {
  print_step "Checking for ID conflicts..."
  log_to_report "[2/5] ID Conflict Check"
  log_to_report "Command: npm run id:dry"
  log_to_report ""

  if npm run id:dry >> "$REPORT_FILE" 2>&1; then
    print_success "No ID conflicts detected"
    log_to_report "Status: PASSED"
    log_to_report ""
    return 0
  else
    print_error "ID conflicts detected"
    log_to_report "Status: FAILED"
    log_to_report ""
    return 1
  fi
}

# Check 3: Media Files Check
check_media_files() {
  print_step "Checking media files..."
  log_to_report "[3/5] Media Files Check"
  log_to_report "Command: npm run media:check"
  log_to_report ""

  if npm run media:check >> "$REPORT_FILE" 2>&1; then
    print_success "All media files present"
    log_to_report "Status: PASSED"
    log_to_report ""
    return 0
  else
    print_error "Missing media files detected"
    log_to_report "Status: FAILED"
    log_to_report ""
    return 1
  fi
}

# Check 4: A11y & SEO Audit
check_accessibility_seo() {
  print_step "Running accessibility and SEO audit..."
  log_to_report "[4/5] Accessibility & SEO Audit"
  log_to_report "Command: npm run audit:a11y_seo"
  log_to_report ""

  if npm run audit:a11y_seo >> "$REPORT_FILE" 2>&1; then
    print_success "Accessibility and SEO audit passed"
    log_to_report "Status: PASSED"
    log_to_report ""
    return 0
  else
    print_error "Accessibility or SEO issues detected"
    log_to_report "Status: FAILED"
    log_to_report ""
    return 1
  fi
}

# Check 5: E2E Checkout Test
check_e2e_checkout() {
  print_step "Running end-to-end checkout test..."
  log_to_report "[5/5] E2E Checkout Test"
  log_to_report "Command: npm run test:e2e_checkout"
  log_to_report ""

  # Check if Playwright is installed
  if ! command -v npx &> /dev/null; then
    print_warning "npx not found, skipping E2E tests"
    log_to_report "Status: SKIPPED (npx not available)"
    log_to_report ""
    return 0
  fi

  if npm run test:e2e_checkout >> "$REPORT_FILE" 2>&1; then
    print_success "E2E checkout test passed"
    log_to_report "Status: PASSED"
    log_to_report ""
    return 0
  else
    print_error "E2E checkout test failed"
    log_to_report "Status: FAILED"
    log_to_report ""
    return 1
  fi
}

###############################################################################
# Main Execution
###############################################################################

main() {
  clear

  print_header "HAORI VISION — Pre-Deploy Validation"

  print_info "Starting pre-deploy validation checks..."
  print_info "Report will be saved to: ${REPORT_FILE}"
  echo ""

  # Initialize report
  init_report

  # Track failures
  local failures=0
  local total_checks=5

  # Run all checks
  echo ""
  print_header "CHECK 1/5: Catalog Validation"
  if ! validate_catalog; then
    ((failures++))
  fi

  echo ""
  print_header "CHECK 2/5: ID Conflict Detection"
  if ! check_id_conflicts; then
    ((failures++))
  fi

  echo ""
  print_header "CHECK 3/5: Media Files Check"
  if ! check_media_files; then
    ((failures++))
  fi

  echo ""
  print_header "CHECK 4/5: Accessibility & SEO Audit"
  if ! check_accessibility_seo; then
    ((failures++))
  fi

  echo ""
  print_header "CHECK 5/5: E2E Checkout Test"
  if ! check_e2e_checkout; then
    ((failures++))
  fi

  # Summary
  echo ""
  print_header "VALIDATION SUMMARY"

  local passed=$((total_checks - failures))

  echo -e "Total Checks:  ${BOLD}${total_checks}${NC}"
  echo -e "Passed:        ${GREEN}${BOLD}${passed}${NC}"
  echo -e "Failed:        ${RED}${BOLD}${failures}${NC}"
  echo ""

  log_to_report ""
  log_to_report "============================================================"
  log_to_report "SUMMARY"
  log_to_report "============================================================"
  log_to_report "Total Checks: $total_checks"
  log_to_report "Passed: $passed"
  log_to_report "Failed: $failures"
  log_to_report ""

  # Final result
  if [ "$failures" -eq 0 ]; then
    print_success "All validation checks passed! ✓"
    echo ""
    print_info "Deployment can proceed safely."
    log_to_report "RESULT: ✓ ALL CHECKS PASSED"
    log_to_report "Deployment: APPROVED"
    echo ""
    echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}${BOLD}║                                                           ║${NC}"
    echo -e "${GREEN}${BOLD}║            DEPLOYMENT VALIDATION: PASSED ✓                ║${NC}"
    echo -e "${GREEN}${BOLD}║                                                           ║${NC}"
    echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    return $EXIT_SUCCESS
  else
    print_error "Validation failed! ${failures} check(s) failed."
    echo ""
    print_warning "Deployment should be blocked until issues are resolved."
    print_info "Review the full report at: ${REPORT_FILE}"
    log_to_report "RESULT: ✗ VALIDATION FAILED"
    log_to_report "Deployment: BLOCKED"
    echo ""
    echo -e "${RED}${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}${BOLD}║                                                           ║${NC}"
    echo -e "${RED}${BOLD}║            DEPLOYMENT VALIDATION: FAILED ✗                ║${NC}"
    echo -e "${RED}${BOLD}║                                                           ║${NC}"
    echo -e "${RED}${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    return $EXIT_FAILURE
  fi
}

###############################################################################
# Error Handling
###############################################################################

# Trap errors and clean up
trap 'echo ""; print_error "Script interrupted or failed."; exit $EXIT_FAILURE' ERR INT TERM

###############################################################################
# Entry Point
###############################################################################

# Ensure we're in project root
cd "$PROJECT_ROOT" || {
  echo "Error: Cannot change to project root directory"
  exit $EXIT_FAILURE
}

# Check Node.js is available
if ! command -v node &> /dev/null; then
  print_error "Node.js is not installed or not in PATH"
  exit $EXIT_FAILURE
fi

# Check npm is available
if ! command -v npm &> /dev/null; then
  print_error "npm is not installed or not in PATH"
  exit $EXIT_FAILURE
fi

# Run main function
main

# Exit with appropriate code
exit $?

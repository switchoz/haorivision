#!/usr/bin/env bash
##############################################################################
# HAORI VISION — Media Transcode (Add-Only)
#
# Transcodes videos and images for web optimization.
#
# Video:
#   - H.264 codec, 1080x1920 resolution
#   - 6-8 Mbps bitrate
#   - 720p preview version
#
# Images:
#   - Export WebP and AVIF formats
#   - Max width: 1600px
#   - Preserve aspect ratio
#
# Safety:
#   - Never re-transcode existing files (hash check)
#   - Only process new/modified files
#   - Non-destructive (keeps originals)
#
# Usage:
#   ./scripts/transcode_media.sh [input_dir] [output_dir]
#   ./scripts/transcode_media.sh public/media/raw public/media/optimized
##############################################################################

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
REPORTS_DIR="$ROOT_DIR/reports"

# Default directories
INPUT_DIR="${1:-$ROOT_DIR/public/media/raw}"
OUTPUT_DIR="${2:-$ROOT_DIR/public/media/optimized}"
HASH_DB="$ROOT_DIR/.media_hashes.txt"

# Video settings
VIDEO_WIDTH=1080
VIDEO_HEIGHT=1920
VIDEO_BITRATE="7M"
VIDEO_PRESET="medium"
VIDEO_CRF=23

# Preview settings
PREVIEW_WIDTH=720
PREVIEW_HEIGHT=1280
PREVIEW_BITRATE="3M"

# Image settings
IMAGE_MAX_WIDTH=1600
IMAGE_QUALITY_WEBP=85
IMAGE_QUALITY_AVIF=80

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stats
TOTAL_FILES=0
PROCESSED_FILES=0
SKIPPED_FILES=0
FAILED_FILES=0
START_TIME=$(date +%s)

# ============================================================================
# Functions
# ============================================================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case $level in
        INFO)
            echo -e "${BLUE}[INFO]${NC} ${timestamp} ${message}"
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} ${message}"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} ${timestamp} ${message}"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} ${timestamp} ${message}"
            ;;
    esac

    # Also log to report file
    echo "[$level] $timestamp $message" >> "$REPORT_FILE"
}

check_dependencies() {
    log INFO "Checking dependencies..."

    local missing=0

    if ! command -v ffmpeg &> /dev/null; then
        log ERROR "ffmpeg not found. Install with: sudo apt-get install ffmpeg"
        missing=1
    fi

    if ! command -v md5sum &> /dev/null && ! command -v md5 &> /dev/null; then
        log ERROR "md5sum/md5 not found"
        missing=1
    fi

    if [ $missing -eq 1 ]; then
        exit 1
    fi

    log SUCCESS "All dependencies found"
}

get_file_hash() {
    local file=$1

    if command -v md5sum &> /dev/null; then
        md5sum "$file" | awk '{print $1}'
    else
        md5 -q "$file"
    fi
}

is_already_processed() {
    local file=$1
    local hash=$(get_file_hash "$file")

    if [ -f "$HASH_DB" ]; then
        grep -q "^$hash" "$HASH_DB" 2>/dev/null
        return $?
    fi

    return 1
}

mark_as_processed() {
    local file=$1
    local hash=$(get_file_hash "$file")
    local basename=$(basename "$file")

    echo "$hash $basename $(date '+%Y-%m-%d %H:%M:%S')" >> "$HASH_DB"
}

create_output_dir() {
    local dir=$1

    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        log INFO "Created directory: $dir"
    fi
}

transcode_video() {
    local input=$1
    local output_base=$2

    log INFO "Transcoding video: $(basename "$input")"

    # Output files
    local output_main="${output_base}_1080p.mp4"
    local output_preview="${output_base}_720p.mp4"

    # Check if already processed
    if is_already_processed "$input"; then
        log WARN "Already processed (hash match): $(basename "$input")"
        ((SKIPPED_FILES++))
        return 0
    fi

    # Main version (1080x1920, H.264)
    log INFO "  → Creating main version (1080x1920)"

    if ffmpeg -i "$input" \
        -vf "scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,pad=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2" \
        -c:v libx264 \
        -preset "$VIDEO_PRESET" \
        -crf "$VIDEO_CRF" \
        -b:v "$VIDEO_BITRATE" \
        -maxrate "$VIDEO_BITRATE" \
        -bufsize "$(echo "$VIDEO_BITRATE" | sed 's/M/*2M/')" \
        -c:a aac \
        -b:a 128k \
        -movflags +faststart \
        -y \
        "$output_main" 2>> "$REPORT_FILE"; then

        log SUCCESS "  ✓ Main version created: $(basename "$output_main")"
    else
        log ERROR "  ✗ Failed to create main version"
        ((FAILED_FILES++))
        return 1
    fi

    # Preview version (720p)
    log INFO "  → Creating preview version (720p)"

    if ffmpeg -i "$input" \
        -vf "scale=${PREVIEW_WIDTH}:${PREVIEW_HEIGHT}:force_original_aspect_ratio=decrease,pad=${PREVIEW_WIDTH}:${PREVIEW_HEIGHT}:(ow-iw)/2:(oh-ih)/2" \
        -c:v libx264 \
        -preset "$VIDEO_PRESET" \
        -crf 26 \
        -b:v "$PREVIEW_BITRATE" \
        -maxrate "$PREVIEW_BITRATE" \
        -bufsize "6M" \
        -c:a aac \
        -b:a 96k \
        -movflags +faststart \
        -y \
        "$output_preview" 2>> "$REPORT_FILE"; then

        log SUCCESS "  ✓ Preview version created: $(basename "$output_preview")"
    else
        log ERROR "  ✗ Failed to create preview version"
        ((FAILED_FILES++))
        return 1
    fi

    # Mark as processed
    mark_as_processed "$input"
    ((PROCESSED_FILES++))

    return 0
}

transcode_image() {
    local input=$1
    local output_base=$2

    log INFO "Transcoding image: $(basename "$input")"

    # Output files
    local output_webp="${output_base}.webp"
    local output_avif="${output_base}.avif"
    local output_jpg="${output_base}.jpg"

    # Check if already processed
    if is_already_processed "$input"; then
        log WARN "Already processed (hash match): $(basename "$input")"
        ((SKIPPED_FILES++))
        return 0
    fi

    # Get image dimensions
    local width=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=s=x:p=0 "$input" 2>/dev/null)

    # Calculate scale filter
    local scale_filter="scale='min($IMAGE_MAX_WIDTH,iw)':-1"

    # WebP conversion
    log INFO "  → Creating WebP version"

    if ffmpeg -i "$input" \
        -vf "$scale_filter" \
        -c:v libwebp \
        -quality "$IMAGE_QUALITY_WEBP" \
        -compression_level 6 \
        -y \
        "$output_webp" 2>> "$REPORT_FILE"; then

        log SUCCESS "  ✓ WebP created: $(basename "$output_webp")"
    else
        log ERROR "  ✗ Failed to create WebP"
        ((FAILED_FILES++))
        return 1
    fi

    # AVIF conversion (if encoder available)
    log INFO "  → Creating AVIF version"

    if ffmpeg -i "$input" \
        -vf "$scale_filter" \
        -c:v libaom-av1 \
        -crf 30 \
        -b:v 0 \
        -strict experimental \
        -y \
        "$output_avif" 2>> "$REPORT_FILE"; then

        log SUCCESS "  ✓ AVIF created: $(basename "$output_avif")"
    else
        log WARN "  ⚠ AVIF encoder not available or failed, skipping"

        # Fallback: optimized JPEG
        log INFO "  → Creating optimized JPEG"

        if ffmpeg -i "$input" \
            -vf "$scale_filter" \
            -q:v 2 \
            -y \
            "$output_jpg" 2>> "$REPORT_FILE"; then

            log SUCCESS "  ✓ Optimized JPEG created: $(basename "$output_jpg")"
        fi
    fi

    # Mark as processed
    mark_as_processed "$input"
    ((PROCESSED_FILES++))

    return 0
}

process_directory() {
    local input_dir=$1
    local output_dir=$2

    log INFO "Processing directory: $input_dir"

    # Create output directory
    create_output_dir "$output_dir"

    # Find all media files
    local video_extensions="mp4|mov|avi|mkv|webm"
    local image_extensions="jpg|jpeg|png|tiff|bmp"

    # Process videos
    while IFS= read -r -d '' file; do
        ((TOTAL_FILES++))

        local filename=$(basename "$file")
        local name="${filename%.*}"
        local relative_path=$(dirname "${file#$input_dir/}")

        # Create output subdirectory if needed
        local output_subdir="$output_dir/$relative_path"
        create_output_dir "$output_subdir"

        local output_base="$output_subdir/$name"

        transcode_video "$file" "$output_base" || true

    done < <(find "$input_dir" -type f -regextype posix-extended -iregex ".*\.($video_extensions)" -print0 2>/dev/null)

    # Process images
    while IFS= read -r -d '' file; do
        ((TOTAL_FILES++))

        local filename=$(basename "$file")
        local name="${filename%.*}"
        local relative_path=$(dirname "${file#$input_dir/}")

        # Create output subdirectory if needed
        local output_subdir="$output_dir/$relative_path"
        create_output_dir "$output_subdir"

        local output_base="$output_subdir/$name"

        transcode_image "$file" "$output_base" || true

    done < <(find "$input_dir" -type f -regextype posix-extended -iregex ".*\.($image_extensions)" -print0 2>/dev/null)

    log INFO "Directory processing complete"
}

generate_report() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))

    cat >> "$REPORT_FILE" <<EOF

============================================================
TRANSCODE SUMMARY
============================================================
Total files found: $TOTAL_FILES
Processed: $PROCESSED_FILES
Skipped (already processed): $SKIPPED_FILES
Failed: $FAILED_FILES

Time elapsed: ${minutes}m ${seconds}s

Input directory: $INPUT_DIR
Output directory: $OUTPUT_DIR
Hash database: $HASH_DB

============================================================
END OF REPORT
============================================================
EOF

    log INFO "Report saved: $REPORT_FILE"
}

# ============================================================================
# Main Script
# ============================================================================

main() {
    echo "============================================================"
    echo "HAORI VISION — Media Transcode"
    echo "============================================================"
    echo

    # Setup report file
    mkdir -p "$REPORTS_DIR"
    REPORT_FILE="$REPORTS_DIR/transcode_$(date +%Y%m%d_%H%M%S).txt"

    log INFO "Starting media transcoding"
    log INFO "Input: $INPUT_DIR"
    log INFO "Output: $OUTPUT_DIR"
    echo

    # Check dependencies
    check_dependencies
    echo

    # Check if input directory exists
    if [ ! -d "$INPUT_DIR" ]; then
        log ERROR "Input directory not found: $INPUT_DIR"
        exit 1
    fi

    # Process files
    process_directory "$INPUT_DIR" "$OUTPUT_DIR"
    echo

    # Generate report
    generate_report
    echo

    # Print summary
    echo "============================================================"
    echo "SUMMARY"
    echo "============================================================"
    echo "Total files: $TOTAL_FILES"
    echo "Processed: $PROCESSED_FILES"
    echo "Skipped: $SKIPPED_FILES"
    echo "Failed: $FAILED_FILES"
    echo
    echo "Report: $REPORT_FILE"
    echo "============================================================"

    # Exit with error if any failures
    if [ $FAILED_FILES -gt 0 ]; then
        exit 1
    fi

    exit 0
}

# Run main function
main "$@"

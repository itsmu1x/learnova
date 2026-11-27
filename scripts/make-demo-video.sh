#!/usr/bin/env bash
# Make one fake lesson video for demo courses (navy background, title, timer).
#
#   scripts/make-demo-video.sh -t "Lesson 1 - Getting Started" -d 90
#
# Options:
#   -t TITLE      Big title text (required; keep it under ~30 characters, it does not wrap)
#   -d SECONDS    Duration in seconds (default 60)
#   -l LABEL      Small label at the top (default "Learnova demo")
#   -o FILE       Output file (default: title turned into a file name, .mp4)
#   -s WxH        Size (default 1280x720)
#   -h            Show this help
set -euo pipefail

usage() { sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

title="" duration=60 label="Learnova demo" out="" size="1280x720"
while getopts "t:d:l:o:s:h" opt; do
  case "$opt" in
    t) title="$OPTARG" ;;
    d) duration="$OPTARG" ;;
    l) label="$OPTARG" ;;
    o) out="$OPTARG" ;;
    s) size="$OPTARG" ;;
    h) usage 0 ;;
    *) usage 1 ;;
  esac
done

[[ -n "$title" ]] || { echo "error: -t TITLE is required" >&2; usage 1; }
[[ "$duration" =~ ^[0-9]+$ && "$duration" -gt 0 ]] || { echo "error: -d must be a whole number of seconds" >&2; exit 1; }
[[ "$size" =~ ^[0-9]+x[0-9]+$ ]] || { echo "error: -s must look like 1280x720" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "error: ffmpeg is not installed" >&2; exit 1; }

if [[ -z "$out" ]]; then
  slug=$(printf '%s' "$title" | tr -d "'’" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-//;s/-$//')
  out="${slug:-lesson}.mp4"
fi

font=$(fc-match -f '%{file}' sans 2>/dev/null || true)
[[ -f "$font" ]] || { echo "error: no font found (install fontconfig + a sans font)" >&2; exit 1; }

# Text goes through files with expansion off, so quotes, colons and % need no escaping.
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
printf '%s' "$title" > "$tmp/title.txt"
printf '%s' "$label" > "$tmp/label.txt"

h=${size#*x}
title_size=$(( h * 64 / 720 ))
small=$(( h * 30 / 720 ))
pad=$(( h * 80 / 720 ))

ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "color=c=0x0F1A3A:size=${size}:rate=30:duration=${duration}" \
  -f lavfi -i "anullsrc=r=44100:cl=stereo" \
  -vf "drawbox=x=${pad}:y=ih/2+${title_size}:w=${pad}*3/2:h=${small}/3:color=0xFFAE1A:t=fill,\
drawtext=fontfile=${font}:textfile=${tmp}/label.txt:expansion=none:fontcolor=0xFFAE1A:fontsize=${small}:x=${pad}:y=${pad},\
drawtext=fontfile=${font}:textfile=${tmp}/title.txt:expansion=none:fontcolor=white:fontsize=${title_size}:x=${pad}:y=(h-th)/2,\
drawtext=fontfile=${font}:text='%{pts\:gmtime\:0\:%M\\\\\:%S}':fontcolor=white@0.6:fontsize=${small}:x=${pad}:y=h-${pad}-${small}" \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -t "$duration" "$out"

echo "made $out (${duration}s, ${size})"

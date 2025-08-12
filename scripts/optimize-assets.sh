#!/bin/bash

# Asset Optimization Script for PC Game Official Site

set -e

echo "🚀 Starting asset optimization..."

# Create directories if they don't exist
mkdir -p static/css/optimized
mkdir -p static/js/optimized

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Optimize CSS files
echo "📦 Optimizing CSS files..."

# Combine and minify CSS files if csso is available
if command_exists csso; then
    echo "Using csso for CSS optimization..."
    
    # Critical CSS (already handled by Hugo)
    echo "✓ Critical CSS handled by Hugo templates"
    
    # Component CSS optimization
    if [ -f "assets/css/components.css" ]; then
        csso assets/css/components.css --output static/css/optimized/components.min.css
        echo "✓ Components CSS optimized"
    fi
    
    # Lightbox CSS optimization
    if [ -f "assets/css/lightbox.css" ]; then
        csso assets/css/lightbox.css --output static/css/optimized/lightbox.min.css
        echo "✓ Lightbox CSS optimized"
    fi
else
    echo "⚠️  csso not found. Install with: npm install -g csso-cli"
    echo "Using Hugo's built-in minification instead"
fi

# Optimize JavaScript files
echo "📦 Optimizing JavaScript files..."

# Minify JavaScript files if terser is available
if command_exists terser; then
    echo "Using terser for JavaScript optimization..."
    
    # Main JS optimization
    if [ -f "assets/js/main.js" ]; then
        terser assets/js/main.js \
            --compress drop_console=true,drop_debugger=true,pure_funcs=['console.log'] \
            --mangle \
            --output static/js/optimized/main.min.js
        echo "✓ Main JavaScript optimized"
    fi
    
    # Lightbox JS optimization
    if [ -f "assets/js/lightbox.js" ]; then
        terser assets/js/lightbox.js \
            --compress drop_console=true,drop_debugger=true,pure_funcs=['console.log'] \
            --mangle \
            --output static/js/optimized/lightbox.min.js
        echo "✓ Lightbox JavaScript optimized"
    fi
else
    echo "⚠️  terser not found. Install with: npm install -g terser"
    echo "Using Hugo's built-in minification instead"
fi

# Remove unused CSS (if purgecss is available)
if command_exists purgecss; then
    echo "🧹 Removing unused CSS..."
    
    # Create a temporary combined CSS file
    if [ -f "static/css/optimized/components.min.css" ]; then
        purgecss \
            --css static/css/optimized/components.min.css \
            --content "layouts/**/*.html" "content/**/*.md" \
            --output static/css/optimized/ \
            --safelist hero-section hero-title hero-tagline feature-card screenshot-item
        echo "✓ Unused CSS removed"
    fi
else
    echo "⚠️  purgecss not found. Install with: npm install -g purgecss"
fi

# Generate file size report
echo "📊 Asset size report:"

if [ -f "static/css/main.css" ]; then
    original_css_size=$(wc -c < "static/css/main.css")
    echo "Original CSS: ${original_css_size} bytes"
fi

if [ -f "static/css/optimized/components.min.css" ]; then
    optimized_css_size=$(wc -c < "static/css/optimized/components.min.css")
    echo "Optimized CSS: ${optimized_css_size} bytes"
    
    if [ -n "$original_css_size" ] && [ "$original_css_size" -gt 0 ]; then
        savings=$((original_css_size - optimized_css_size))
        percentage=$((savings * 100 / original_css_size))
        echo "CSS savings: ${savings} bytes (${percentage}%)"
    fi
fi

if [ -f "static/js/main.js" ]; then
    original_js_size=$(wc -c < "static/js/main.js")
    echo "Original JS: ${original_js_size} bytes"
fi

if [ -f "static/js/optimized/main.min.js" ]; then
    optimized_js_size=$(wc -c < "static/js/optimized/main.min.js")
    echo "Optimized JS: ${optimized_js_size} bytes"
    
    if [ -n "$original_js_size" ] && [ "$original_js_size" -gt 0 ]; then
        savings=$((original_js_size - optimized_js_size))
        percentage=$((savings * 100 / original_js_size))
        echo "JS savings: ${savings} bytes (${percentage}%)"
    fi
fi

echo "✅ Asset optimization complete!"

# Instructions for installing optimization tools
echo ""
echo "💡 To install optimization tools:"
echo "   npm install -g csso-cli terser purgecss"
echo ""
echo "🔧 Hugo will handle minification automatically with --minify flag"
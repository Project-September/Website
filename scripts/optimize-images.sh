#!/bin/bash

# 画像最適化スクリプト
# このスクリプトは手動で画像を最適化する場合に使用します
# Hugo の自動最適化機能を補完するためのツールです

set -e

# 色付きの出力用関数
print_info() {
    echo -e "\033[1;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

print_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

print_error() {
    echo -e "\033[1;31m[ERROR]\033[0m $1"
}

# 必要なツールの確認
check_dependencies() {
    local missing_tools=()
    
    if ! command -v convert &> /dev/null; then
        missing_tools+=("imagemagick")
    fi
    
    if ! command -v cwebp &> /dev/null; then
        missing_tools+=("webp")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "以下のツールがインストールされていません:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo ""
        echo "インストール方法:"
        echo "  Ubuntu/Debian: sudo apt-get install imagemagick webp"
        echo "  macOS: brew install imagemagick webp"
        echo "  Windows: choco install imagemagick webp"
        exit 1
    fi
}

# 画像の最適化
optimize_image() {
    local input_file="$1"
    local output_dir="$2"
    local filename=$(basename "$input_file")
    local name="${filename%.*}"
    local ext="${filename##*.}"
    
    print_info "最適化中: $filename"
    
    # 出力ディレクトリの作成
    mkdir -p "$output_dir"
    
    # JPEG/PNG の最適化
    if [[ "$ext" =~ ^(jpg|jpeg|png)$ ]]; then
        # 元のサイズを維持して品質を最適化
        convert "$input_file" -quality 85 -strip "$output_dir/$filename"
        
        # WebP形式での出力
        cwebp -q 85 "$input_file" -o "$output_dir/${name}.webp"
        
        # サムネイル生成（200px幅）
        convert "$input_file" -resize 200x -quality 75 -strip "$output_dir/${name}_thumb.jpg"
        
        # 中サイズ生成（400px幅）
        convert "$input_file" -resize 400x -quality 80 -strip "$output_dir/${name}_medium.jpg"
        
        print_success "最適化完了: $filename"
    else
        print_warning "スキップ: $filename (対応していない形式)"
    fi
}

# メイン処理
main() {
    print_info "画像最適化スクリプトを開始します"
    
    # 依存関係の確認
    check_dependencies
    
    # 引数の確認
    if [ $# -eq 0 ]; then
        print_info "使用方法:"
        echo "  $0 <入力ディレクトリ> [出力ディレクトリ]"
        echo ""
        echo "例:"
        echo "  $0 static/images/raw static/images/optimized"
        echo "  $0 static/images/screenshots"
        exit 1
    fi
    
    local input_dir="$1"
    local output_dir="${2:-$input_dir/optimized}"
    
    # 入力ディレクトリの確認
    if [ ! -d "$input_dir" ]; then
        print_error "入力ディレクトリが存在しません: $input_dir"
        exit 1
    fi
    
    print_info "入力ディレクトリ: $input_dir"
    print_info "出力ディレクトリ: $output_dir"
    
    # 画像ファイルの処理
    local processed=0
    while IFS= read -r -d '' file; do
        optimize_image "$file" "$output_dir"
        ((processed++))
    done < <(find "$input_dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -print0)
    
    if [ $processed -eq 0 ]; then
        print_warning "処理対象の画像ファイルが見つかりませんでした"
    else
        print_success "合計 $processed 個のファイルを処理しました"
    fi
    
    print_info "最適化完了"
}

# スクリプトの実行
main "$@"
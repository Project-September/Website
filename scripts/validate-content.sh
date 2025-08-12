#!/bin/bash

# コンテンツ検証スクリプト
# Markdown ファイルの構文チェックと画像リンクの存在確認を行います

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

# グローバル変数
ERRORS=0
WARNINGS=0
TOTAL_FILES=0

# Markdown ファイルの構文チェック
validate_markdown_syntax() {
    local file="$1"
    local errors=0
    
    print_info "Markdown構文チェック: $file"
    
    # Front Matter の検証
    if ! head -1 "$file" | grep -q "^---$"; then
        print_error "  Front Matter が見つかりません（先頭に --- が必要）"
        ((errors++))
    fi
    
    # Front Matter の終了確認
    if ! sed -n '2,20p' "$file" | grep -q "^---$"; then
        print_error "  Front Matter の終了マーカー（---）が見つかりません"
        ((errors++))
    fi
    
    # 必須フィールドの確認
    local front_matter=$(sed -n '/^---$/,/^---$/p' "$file")
    
    if ! echo "$front_matter" | grep -q "^title:"; then
        print_error "  必須フィールド 'title' が見つかりません"
        ((errors++))
    fi
    
    if ! echo "$front_matter" | grep -q "^date:"; then
        print_error "  必須フィールド 'date' が見つかりません"
        ((errors++))
    fi
    
    if ! echo "$front_matter" | grep -q "^draft:"; then
        print_error "  必須フィールド 'draft' が見つかりません"
        ((errors++))
    fi
    
    # 日付形式の確認
    local date_line=$(echo "$front_matter" | grep "^date:" | head -1)
    if [ -n "$date_line" ]; then
        local date_value=$(echo "$date_line" | sed 's/^date: *//' | sed 's/^"//' | sed 's/"$//')
        if ! echo "$date_value" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}'; then
            print_warning "  日付形式が推奨形式（YYYY-MM-DD）ではありません: $date_value"
            ((WARNINGS++))
        fi
    fi
    
    # Markdown リンクの構文チェック
    local line_num=1
    while IFS= read -r line; do
        # 不正なリンク構文をチェック
        if echo "$line" | grep -q '\[.*\]([^)]*)'; then
            if echo "$line" | grep -qE '\[.*\]\([^)]*[[:space:]][^)]*\)'; then
                print_warning "  行 $line_num: リンクURL内にスペースが含まれています"
                ((WARNINGS++))
            fi
        fi
        
        # 不正な画像構文をチェック
        if echo "$line" | grep -q '!\[.*\]([^)]*)'; then
            if echo "$line" | grep -qE '!\[.*\]\([^)]*[[:space:]][^)]*\)'; then
                print_warning "  行 $line_num: 画像URL内にスペースが含まれています"
                ((WARNINGS++))
            fi
        fi
        
        ((line_num++))
    done < "$file"
    
    if [ $errors -eq 0 ]; then
        print_success "  Markdown構文: OK"
    else
        ((ERRORS += errors))
    fi
    
    return $errors
}

# 画像リンクの存在確認
validate_image_links() {
    local file="$1"
    local errors=0
    
    print_info "画像リンクチェック: $file"
    
    # Markdown 内の画像リンクを抽出
    local images=$(grep -oE '!\[.*?\]\([^)]+\)' "$file" | sed 's/!\[.*?\](\([^)]*\))/\1/' || true)
    
    # Front Matter 内の画像パスを抽出
    local front_matter_images=$(sed -n '/^---$/,/^---$/p' "$file" | grep -E '(featured_image|image|thumbnail|url):' | sed 's/.*: *"//' | sed 's/"$//' | grep -E '\.(jpg|jpeg|png|gif|webp)$' || true)
    
    # すべての画像パスをチェック
    local all_images="$images"$'\n'"$front_matter_images"
    
    while IFS= read -r image_path; do
        if [ -n "$image_path" ] && [ "$image_path" != "null" ]; then
            # 相対パスを絶対パスに変換
            if [[ "$image_path" == /* ]]; then
                # 絶対パス（/images/...）
                local full_path="static$image_path"
            elif [[ "$image_path" == http* ]]; then
                # 外部URL - スキップ
                continue
            else
                # 相対パス
                local full_path="static/images/$image_path"
            fi
            
            if [ ! -f "$full_path" ]; then
                print_error "  画像ファイルが見つかりません: $image_path"
                print_error "    期待されるパス: $full_path"
                ((errors++))
            fi
        fi
    done <<< "$all_images"
    
    if [ $errors -eq 0 ]; then
        print_success "  画像リンク: OK"
    else
        ((ERRORS += errors))
    fi
    
    return $errors
}

# 内部リンクの確認
validate_internal_links() {
    local file="$1"
    local errors=0
    
    print_info "内部リンクチェック: $file"
    
    # Markdown 内の内部リンクを抽出
    local links=$(grep -oE '\[.*?\]\([^)]+\)' "$file" | sed 's/\[.*?\](\([^)]*\))/\1/' | grep -v '^http' | grep -v '^#' || true)
    
    while IFS= read -r link_path; do
        if [ -n "$link_path" ]; then
            # Hugo の URL 構造に基づいてファイルの存在を確認
            local content_path=""
            
            if [[ "$link_path" == /* ]]; then
                # 絶対パス
                if [[ "$link_path" == */ ]]; then
                    # ディレクトリパス
                    content_path="content${link_path}_index.md"
                else
                    # ファイルパス
                    content_path="content${link_path}.md"
                fi
            else
                # 相対パス - 現在のファイルからの相対位置を計算
                local current_dir=$(dirname "$file")
                content_path="$current_dir/$link_path"
                if [[ "$link_path" == */ ]]; then
                    content_path="${content_path}_index.md"
                else
                    content_path="${content_path}.md"
                fi
            fi
            
            if [ ! -f "$content_path" ]; then
                print_warning "  内部リンクの対象が見つかりません: $link_path"
                print_warning "    期待されるパス: $content_path"
                ((WARNINGS++))
            fi
        fi
    done <<< "$links"
    
    if [ $errors -eq 0 ]; then
        print_success "  内部リンク: OK"
    fi
    
    return $errors
}

# ファイル単体の検証
validate_file() {
    local file="$1"
    
    echo ""
    print_info "=== ファイル検証: $file ==="
    
    validate_markdown_syntax "$file"
    validate_image_links "$file"
    validate_internal_links "$file"
    
    ((TOTAL_FILES++))
}

# メイン処理
main() {
    print_info "コンテンツ検証を開始します"
    
    # 引数の確認
    local target_dir="${1:-content}"
    
    if [ ! -d "$target_dir" ]; then
        print_error "対象ディレクトリが存在しません: $target_dir"
        exit 1
    fi
    
    print_info "対象ディレクトリ: $target_dir"
    
    # Markdown ファイルを検索して検証
    while IFS= read -r -d '' file; do
        validate_file "$file"
    done < <(find "$target_dir" -name "*.md" -type f -print0)
    
    # 結果の表示
    echo ""
    print_info "=== 検証結果 ==="
    print_info "検証ファイル数: $TOTAL_FILES"
    
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        print_success "すべてのファイルが正常です"
        exit 0
    else
        if [ $ERRORS -gt 0 ]; then
            print_error "エラー: $ERRORS 件"
        fi
        if [ $WARNINGS -gt 0 ]; then
            print_warning "警告: $WARNINGS 件"
        fi
        
        if [ $ERRORS -gt 0 ]; then
            exit 1
        else
            exit 0
        fi
    fi
}

# ヘルプ表示
show_help() {
    echo "コンテンツ検証スクリプト"
    echo ""
    echo "使用方法:"
    echo "  $0 [ディレクトリ]"
    echo ""
    echo "オプション:"
    echo "  -h, --help    このヘルプを表示"
    echo ""
    echo "例:"
    echo "  $0                # content/ ディレクトリを検証"
    echo "  $0 content/news   # content/news/ ディレクトリを検証"
}

# 引数の処理
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
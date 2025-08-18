#!/bin/bash

# GitHub Pages 手動ロールバックスクリプト
# 緊急時にローカルから前のバージョンにロールバックするためのスクリプト

set -e

# 色付きメッセージ用の関数
print_info() {
    echo -e "\033[34mℹ️  $1\033[0m"
}

print_success() {
    echo -e "\033[32m✅ $1\033[0m"
}

print_warning() {
    echo -e "\033[33m⚠️  $1\033[0m"
}

print_error() {
    echo -e "\033[31m❌ $1\033[0m"
}

print_header() {
    echo -e "\033[1;36m$1\033[0m"
}

# 使用方法の表示
show_usage() {
    echo "使用方法: $0 [オプション]"
    echo
    echo "オプション:"
    echo "  -c, --commit SHA    ロールバック先のコミットSHA"
    echo "  -r, --reason TEXT   ロールバックの理由"
    echo "  -l, --list         最近のコミット一覧を表示"
    echo "  -h, --help         このヘルプを表示"
    echo
    echo "例:"
    echo "  $0 -c abc1234 -r \"緊急バグ修正\""
    echo "  $0 --list"
}

# 最近のコミット一覧を表示
show_recent_commits() {
    print_header "📋 最近のコミット一覧"
    echo
    git log --oneline -10 --graph --decorate
    echo
}

# コミットの詳細情報を表示
show_commit_info() {
    local commit_sha=$1
    
    if ! git cat-file -e "$commit_sha^{commit}" 2>/dev/null; then
        print_error "コミット $commit_sha が見つかりません"
        return 1
    fi
    
    print_header "📝 ロールバック対象コミット情報"
    echo
    echo "SHA: $commit_sha"
    echo "メッセージ: $(git log -1 --pretty=format:"%s" $commit_sha)"
    echo "作成者: $(git log -1 --pretty=format:"%an <%ae>" $commit_sha)"
    echo "日時: $(git log -1 --pretty=format:"%ad" --date=iso $commit_sha)"
    echo
}

# GitHub CLI の確認
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) がインストールされていません"
        print_info "インストール方法: https://cli.github.com/"
        return 1
    fi
    
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI にログインしていません"
        print_info "ログイン: gh auth login"
        return 1
    fi
    
    return 0
}

# ロールバックワークフローの実行
execute_rollback() {
    local commit_sha=$1
    local reason=$2
    
    print_header "🔄 ロールバック実行中..."
    
    # GitHub CLI でワークフローを実行
    if gh workflow run rollback.yml \
        -f commit_sha="$commit_sha" \
        -f reason="$reason"; then
        
        print_success "ロールバックワークフローを開始しました"
        print_info "進行状況: gh run list --workflow=rollback.yml"
        
        # 最新の実行を監視
        print_info "ワークフロー実行を監視中..."
        sleep 5
        
        local run_id=$(gh run list --workflow=rollback.yml --limit=1 --json databaseId --jq '.[0].databaseId')
        if [ -n "$run_id" ]; then
            print_info "実行ID: $run_id"
            print_info "詳細: gh run view $run_id"
            
            # 実行状況を監視
            local status=""
            local count=0
            while [ "$status" != "completed" ] && [ $count -lt 60 ]; do
                status=$(gh run view $run_id --json status --jq '.status')
                echo -n "."
                sleep 10
                count=$((count + 1))
            done
            echo
            
            # 結果確認
            local conclusion=$(gh run view $run_id --json conclusion --jq '.conclusion')
            if [ "$conclusion" = "success" ]; then
                print_success "ロールバックが正常に完了しました！"
                print_info "サイトの確認: $(git remote get-url origin | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/\.git$//' | sed 's/github\.com/github.io/' | sed 's/\/[^\/]*$//')"
            else
                print_error "ロールバックが失敗しました"
                print_info "詳細ログ: gh run view $run_id --log"
            fi
        fi
    else
        print_error "ロールバックワークフローの開始に失敗しました"
        return 1
    fi
}

# 確認プロンプト
confirm_rollback() {
    local commit_sha=$1
    local reason=$2
    
    print_warning "⚠️  ロールバックを実行しようとしています"
    echo
    show_commit_info "$commit_sha"
    echo "理由: $reason"
    echo
    
    read -p "続行しますか？ (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_info "ロールバックをキャンセルしました"
        exit 0
    fi
}

# メイン処理
main() {
    local commit_sha=""
    local reason=""
    local show_list=false
    
    # 引数解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--commit)
                commit_sha="$2"
                shift 2
                ;;
            -r|--reason)
                reason="$2"
                shift 2
                ;;
            -l|--list)
                show_list=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "不明なオプション: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_header "🚨 GitHub Pages ロールバックツール"
    echo
    
    # リスト表示のみの場合
    if [ "$show_list" = true ]; then
        show_recent_commits
        exit 0
    fi
    
    # GitHub CLI の確認
    if ! check_gh_cli; then
        exit 1
    fi
    
    # インタラクティブモード
    if [ -z "$commit_sha" ]; then
        show_recent_commits
        echo
        read -p "ロールバック先のコミットSHAを入力してください: " commit_sha
    fi
    
    if [ -z "$reason" ]; then
        read -p "ロールバックの理由を入力してください: " reason
    fi
    
    # 入力検証
    if [ -z "$commit_sha" ] || [ -z "$reason" ]; then
        print_error "コミットSHAと理由の両方が必要です"
        exit 1
    fi
    
    # コミット存在確認
    if ! git cat-file -e "$commit_sha^{commit}" 2>/dev/null; then
        print_error "指定されたコミット $commit_sha が見つかりません"
        exit 1
    fi
    
    # 確認
    confirm_rollback "$commit_sha" "$reason"
    
    # ロールバック実行
    execute_rollback "$commit_sha" "$reason"
}

# スクリプト実行
main "$@"
#!/bin/bash

# GitHub Pages セットアップスクリプト
# このスクリプトはGitHub Pagesの設定を支援します

set -e

echo "🚀 GitHub Pages セットアップスクリプト"
echo "=================================="

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

# 現在のリポジトリ情報を取得
get_repo_info() {
    if git remote -v | grep -q "github.com"; then
        REPO_URL=$(git remote get-url origin)
        if [[ $REPO_URL == *"github.com"* ]]; then
            # SSH形式の場合
            if [[ $REPO_URL == git@github.com:* ]]; then
                REPO_PATH=${REPO_URL#git@github.com:}
                REPO_PATH=${REPO_PATH%.git}
            # HTTPS形式の場合
            else
                REPO_PATH=${REPO_URL#https://github.com/}
                REPO_PATH=${REPO_PATH%.git}
            fi
            
            GITHUB_USER=$(echo $REPO_PATH | cut -d'/' -f1)
            REPO_NAME=$(echo $REPO_PATH | cut -d'/' -f2)
            
            print_success "リポジトリ情報を検出: $GITHUB_USER/$REPO_NAME"
            return 0
        fi
    fi
    
    print_error "GitHubリポジトリが検出できませんでした"
    return 1
}

# Hugo設定の確認と更新
update_hugo_config() {
    print_info "Hugo設定を確認中..."
    
    if [ ! -f "config.yaml" ]; then
        print_error "config.yamlが見つかりません"
        return 1
    fi
    
    # baseURLの確認
    current_baseurl=$(grep "baseURL:" config.yaml | head -1 | sed "s/baseURL: *['\"]*//" | sed "s/['\"]* *$//")
    expected_baseurl="https://${GITHUB_USER}.github.io/${REPO_NAME}"
    
    if [ "$current_baseurl" != "$expected_baseurl" ]; then
        print_warning "baseURLを更新します: $expected_baseurl"
        
        # バックアップ作成
        cp config.yaml config.yaml.backup
        
        # baseURLを更新
        sed -i.tmp "s|baseURL:.*|baseURL: '$expected_baseurl'|" config.yaml
        rm config.yaml.tmp 2>/dev/null || true
        
        print_success "config.yamlを更新しました"
    else
        print_success "baseURL設定は正しく設定されています"
    fi
}

# カスタムドメイン設定
setup_custom_domain() {
    echo
    read -p "カスタムドメインを使用しますか？ (y/N): " use_custom_domain
    
    if [[ $use_custom_domain =~ ^[Yy]$ ]]; then
        read -p "カスタムドメインを入力してください (例: example.com): " custom_domain
        
        if [ -n "$custom_domain" ]; then
            # CNAMEファイル作成
            echo "$custom_domain" > static/CNAME
            print_success "static/CNAMEファイルを作成しました"
            
            # config.yamlのbaseURLを更新
            cp config.yaml config.yaml.backup
            sed -i.tmp "s|baseURL:.*|baseURL: 'https://$custom_domain'|" config.yaml
            rm config.yaml.tmp 2>/dev/null || true
            
            print_success "カスタムドメイン設定を完了しました"
            
            print_info "DNS設定が必要です:"
            echo "  Apexドメインの場合:"
            echo "    A    @    185.199.108.153"
            echo "    A    @    185.199.109.153"
            echo "    A    @    185.199.110.153"
            echo "    A    @    185.199.111.153"
            echo
            echo "  サブドメインの場合:"
            echo "    CNAME    www    ${GITHUB_USER}.github.io"
        fi
    fi
}

# GitHub Actions ワークフローの確認
check_workflow() {
    print_info "GitHub Actionsワークフローを確認中..."
    
    if [ -f ".github/workflows/hugo.yml" ]; then
        print_success "Hugo デプロイワークフローが見つかりました"
    else
        print_error "Hugo デプロイワークフローが見つかりません"
        print_info "ワークフローファイルを作成してください: .github/workflows/hugo.yml"
        return 1
    fi
}

# 設定確認
verify_setup() {
    print_info "設定を確認中..."
    
    echo
    echo "📋 設定サマリー:"
    echo "  リポジトリ: $GITHUB_USER/$REPO_NAME"
    echo "  baseURL: $(grep "baseURL:" config.yaml | head -1 | sed "s/baseURL: *//")"
    
    if [ -f "static/CNAME" ]; then
        echo "  カスタムドメイン: $(cat static/CNAME)"
    fi
    
    echo
    print_info "次のステップ:"
    echo "1. GitHubリポジトリの Settings > Pages で 'GitHub Actions' を選択"
    echo "2. Settings > Actions > General で適切な権限を設定"
    echo "3. 変更をコミット・プッシュしてデプロイを開始"
    
    if [ -f "static/CNAME" ]; then
        echo "4. DNS設定を行い、GitHub Pages設定でカスタムドメインを設定"
    fi
}

# メイン処理
main() {
    # リポジトリ情報取得
    if ! get_repo_info; then
        exit 1
    fi
    
    # Hugo設定更新
    update_hugo_config
    
    # カスタムドメイン設定
    setup_custom_domain
    
    # ワークフロー確認
    check_workflow
    
    # 設定確認
    verify_setup
    
    echo
    print_success "GitHub Pages セットアップが完了しました！"
}

# スクリプト実行
main "$@"
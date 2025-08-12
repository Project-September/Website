#!/usr/bin/env node

/**
 * Markdown コンテンツ検証スクリプト
 * より詳細な Markdown 構文チェックと Front Matter 検証を行います
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// 色付きコンソール出力
const colors = {
	info: "\x1b[34m[INFO]\x1b[0m",
	success: "\x1b[32m[SUCCESS]\x1b[0m",
	warning: "\x1b[33m[WARNING]\x1b[0m",
	error: "\x1b[31m[ERROR]\x1b[0m",
};

let totalFiles = 0;
let totalErrors = 0;
let totalWarnings = 0;

/**
 * Front Matter の検証
 */
function validateFrontMatter(filePath, content) {
	const errors = [];
	const warnings = [];

	// Front Matter の抽出
	const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

	if (!frontMatterMatch) {
		errors.push("Front Matter が見つかりません");
		return { errors, warnings };
	}

	try {
		const frontMatter = yaml.load(frontMatterMatch[1]);

		// 必須フィールドの確認
		const requiredFields = ["title", "date", "draft"];
		requiredFields.forEach((field) => {
			if (!(field in frontMatter)) {
				errors.push(`必須フィールド '${field}' が見つかりません`);
			}
		});

		// 日付形式の確認
		if (frontMatter.date) {
			const dateStr = frontMatter.date.toString();
			if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
				warnings.push(`日付形式が推奨形式（YYYY-MM-DD）ではありません: ${dateStr}`);
			}
		}

		// draft フィールドの型確認
		if (frontMatter.draft !== undefined && typeof frontMatter.draft !== "boolean") {
			warnings.push(`'draft' フィールドは boolean 型である必要があります: ${frontMatter.draft}`);
		}

		// タグの形式確認
		if (frontMatter.tags && !Array.isArray(frontMatter.tags)) {
			warnings.push(`'tags' フィールドは配列である必要があります`);
		}

		// 画像パスの確認
		const imageFields = ["featured_image", "image", "thumbnail"];
		imageFields.forEach((field) => {
			if (frontMatter[field]) {
				validateImagePath(frontMatter[field], errors, warnings);
			}
		});

		// ゲーム情報の検証（ゲームページの場合）
		if (frontMatter.type === "game") {
			validateGameFrontMatter(frontMatter, errors, warnings);
		}
	} catch (e) {
		errors.push(`Front Matter の YAML 構文エラー: ${e.message}`);
	}

	return { errors, warnings };
}

/**
 * ゲーム情報の Front Matter 検証
 */
function validateGameFrontMatter(frontMatter, errors, warnings) {
	const gameFields = ["genre", "release_date", "price"];

	// システム要件の確認
	if (frontMatter.system_requirements) {
		const sysReq = frontMatter.system_requirements;
		["minimum", "recommended"].forEach((level) => {
			if (sysReq[level]) {
				const reqFields = ["os", "processor", "memory", "graphics", "storage"];
				reqFields.forEach((field) => {
					if (!sysReq[level][field]) {
						warnings.push(`システム要件 ${level}.${field} が設定されていません`);
					}
				});
			}
		});
	}

	// スクリーンショットの確認
	if (frontMatter.screenshots && Array.isArray(frontMatter.screenshots)) {
		frontMatter.screenshots.forEach((screenshot, index) => {
			if (!screenshot.url) {
				errors.push(`スクリーンショット[${index}] に url が設定されていません`);
			} else {
				validateImagePath(screenshot.url, errors, warnings);
			}
			if (!screenshot.alt) {
				warnings.push(`スクリーンショット[${index}] に alt テキストが設定されていません`);
			}
		});
	}

	// 動画の確認
	if (frontMatter.videos && Array.isArray(frontMatter.videos)) {
		frontMatter.videos.forEach((video, index) => {
			if (!video.url) {
				errors.push(`動画[${index}] に url が設定されていません`);
			}
			if (!video.title) {
				warnings.push(`動画[${index}] に title が設定されていません`);
			}
			if (video.type && !["youtube", "local"].includes(video.type)) {
				warnings.push(`動画[${index}] の type は 'youtube' または 'local' である必要があります`);
			}
		});
	}
}

/**
 * 画像パスの検証
 */
function validateImagePath(imagePath, errors, warnings) {
	if (typeof imagePath !== "string") {
		warnings.push(`画像パスは文字列である必要があります: ${imagePath}`);
		return;
	}

	// 外部URLの場合はスキップ
	if (imagePath.startsWith("http")) {
		return;
	}

	// 静的ファイルの存在確認
	let fullPath;
	if (imagePath.startsWith("/")) {
		fullPath = path.join("static", imagePath);
	} else {
		fullPath = path.join("static", "images", imagePath);
	}

	if (!fs.existsSync(fullPath)) {
		errors.push(`画像ファイルが見つかりません: ${imagePath} (期待されるパス: ${fullPath})`);
	}
}

/**
 * Markdown 構文の検証
 */
function validateMarkdownSyntax(filePath, content) {
	const errors = [];
	const warnings = [];
	const lines = content.split("\n");

	lines.forEach((line, index) => {
		const lineNum = index + 1;

		// リンク構文の確認
		const linkMatches = line.match(/\[([^\]]*)\]\(([^)]*)\)/g);
		if (linkMatches) {
			linkMatches.forEach((match) => {
				const urlMatch = match.match(/\[([^\]]*)\]\(([^)]*)\)/);
				if (urlMatch && urlMatch[2]) {
					const url = urlMatch[2];
					if (url.includes(" ") && !url.startsWith("http")) {
						warnings.push(`行 ${lineNum}: リンクURL内にスペースが含まれています: ${match}`);
					}
				}
			});
		}

		// 画像構文の確認
		const imageMatches = line.match(/!\[([^\]]*)\]\(([^)]*)\)/g);
		if (imageMatches) {
			imageMatches.forEach((match) => {
				const urlMatch = match.match(/!\[([^\]]*)\]\(([^)]*)\)/);
				if (urlMatch && urlMatch[2]) {
					const url = urlMatch[2];
					if (url.includes(" ") && !url.startsWith("http")) {
						warnings.push(`行 ${lineNum}: 画像URL内にスペースが含まれています: ${match}`);
					}
					// 画像ファイルの存在確認
					validateImagePath(url, errors, warnings);
				}
			});
		}

		// 見出しの確認
		const headingMatch = line.match(/^(#{1,6})\s*(.*)/);
		if (headingMatch) {
			const level = headingMatch[1].length;
			const text = headingMatch[2];

			if (!text.trim()) {
				warnings.push(`行 ${lineNum}: 見出しにテキストがありません`);
			}

			// 見出しレベルの飛び越しチェック（簡易版）
			if (level > 3) {
				warnings.push(`行 ${lineNum}: 深い見出しレベル (h${level}) が使用されています`);
			}
		}

		// コードブロックの確認
		if (line.startsWith("```")) {
			const language = line.substring(3).trim();
			if (!language && line === "```") {
				warnings.push(`行 ${lineNum}: コードブロックに言語指定がありません`);
			}
		}
	});

	return { errors, warnings };
}

/**
 * 内部リンクの検証
 */
function validateInternalLinks(filePath, content) {
	const errors = [];
	const warnings = [];

	// Markdown 内の内部リンクを抽出
	const linkMatches = content.match(/\[([^\]]*)\]\(([^)]*)\)/g) || [];

	linkMatches.forEach((match) => {
		const urlMatch = match.match(/\[([^\]]*)\]\(([^)]*)\)/);
		if (urlMatch && urlMatch[2]) {
			const url = urlMatch[2];

			// 外部リンクやアンカーリンクはスキップ
			if (url.startsWith("http") || url.startsWith("#") || url.startsWith("mailto:")) {
				return;
			}

			// 内部リンクの存在確認
			let targetPath;
			if (url.startsWith("/")) {
				// 絶対パス
				if (url.endsWith("/")) {
					targetPath = path.join("content", url, "_index.md");
				} else {
					targetPath = path.join("content", url + ".md");
				}
			} else {
				// 相対パス
				const currentDir = path.dirname(filePath);
				if (url.endsWith("/")) {
					targetPath = path.join(currentDir, url, "_index.md");
				} else {
					targetPath = path.join(currentDir, url + ".md");
				}
			}

			if (!fs.existsSync(targetPath)) {
				warnings.push(`内部リンクの対象が見つかりません: ${url} (期待されるパス: ${targetPath})`);
			}
		}
	});

	return { errors, warnings };
}

/**
 * ファイル単体の検証
 */
function validateFile(filePath) {
	console.log(`\n${colors.info} === ファイル検証: ${filePath} ===`);

	try {
		const content = fs.readFileSync(filePath, "utf8");

		// Front Matter の検証
		const frontMatterResult = validateFrontMatter(filePath, content);

		// Markdown 構文の検証
		const syntaxResult = validateMarkdownSyntax(filePath, content);

		// 内部リンクの検証
		const linkResult = validateInternalLinks(filePath, content);

		// 結果の集計
		const allErrors = [...frontMatterResult.errors, ...syntaxResult.errors, ...linkResult.errors];

		const allWarnings = [...frontMatterResult.warnings, ...syntaxResult.warnings, ...linkResult.warnings];

		// エラーと警告の表示
		allErrors.forEach((error) => {
			console.log(`${colors.error} ${error}`);
		});

		allWarnings.forEach((warning) => {
			console.log(`${colors.warning} ${warning}`);
		});

		if (allErrors.length === 0 && allWarnings.length === 0) {
			console.log(`${colors.success} ファイルは正常です`);
		}

		totalErrors += allErrors.length;
		totalWarnings += allWarnings.length;
		totalFiles++;
	} catch (error) {
		console.log(`${colors.error} ファイル読み込みエラー: ${error.message}`);
		totalErrors++;
	}
}

/**
 * ディレクトリ内のMarkdownファイルを再帰的に検索
 */
function findMarkdownFiles(dir) {
	const files = [];

	function traverse(currentDir) {
		const items = fs.readdirSync(currentDir);

		items.forEach((item) => {
			const fullPath = path.join(currentDir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				traverse(fullPath);
			} else if (item.endsWith(".md")) {
				files.push(fullPath);
			}
		});
	}

	traverse(dir);
	return files;
}

/**
 * メイン処理
 */
function main() {
	const targetDir = process.argv[2] || "content";

	console.log(`${colors.info} コンテンツ検証を開始します`);
	console.log(`${colors.info} 対象ディレクトリ: ${targetDir}`);

	if (!fs.existsSync(targetDir)) {
		console.log(`${colors.error} 対象ディレクトリが存在しません: ${targetDir}`);
		process.exit(1);
	}

	// Markdown ファイルを検索
	const markdownFiles = findMarkdownFiles(targetDir);

	if (markdownFiles.length === 0) {
		console.log(`${colors.warning} Markdown ファイルが見つかりませんでした`);
		process.exit(0);
	}

	// 各ファイルを検証
	markdownFiles.forEach(validateFile);

	// 結果の表示
	console.log(`\n${colors.info} === 検証結果 ===`);
	console.log(`${colors.info} 検証ファイル数: ${totalFiles}`);

	if (totalErrors === 0 && totalWarnings === 0) {
		console.log(`${colors.success} すべてのファイルが正常です`);
		process.exit(0);
	} else {
		if (totalErrors > 0) {
			console.log(`${colors.error} エラー: ${totalErrors} 件`);
		}
		if (totalWarnings > 0) {
			console.log(`${colors.warning} 警告: ${totalWarnings} 件`);
		}

		process.exit(totalErrors > 0 ? 1 : 0);
	}
}

// ヘルプ表示
function showHelp() {
	console.log("Markdown コンテンツ検証スクリプト");
	console.log("");
	console.log("使用方法:");
	console.log("  node validate-markdown.js [ディレクトリ]");
	console.log("");
	console.log("例:");
	console.log("  node validate-markdown.js           # content/ ディレクトリを検証");
	console.log("  node validate-markdown.js content/news  # content/news/ ディレクトリを検証");
}

// 引数の処理
if (process.argv.includes("-h") || process.argv.includes("--help")) {
	showHelp();
	process.exit(0);
}

// 必要なモジュールの確認
try {
	require("js-yaml");
} catch (error) {
	console.log(`${colors.error} 必要なモジュールがインストールされていません: js-yaml`);
	console.log(`${colors.info} インストール方法: npm install js-yaml`);
	process.exit(1);
}

main();

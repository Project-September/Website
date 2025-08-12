// Service Worker for PC Game Official Site
// キャッシュ戦略とオフライン対応

const CACHE_NAME = "pc-game-site-v1";
const STATIC_CACHE = "static-v1";
const DYNAMIC_CACHE = "dynamic-v1";
const IMAGE_CACHE = "images-v1";

// キャッシュするリソース
const STATIC_ASSETS = ["/", "/game/", "/news/", "/about/", "/css/main.css", "/js/main.js", "/js/lazy-loading.js", "/images/placeholder.jpg", "/manifest.json"];

// キャッシュ戦略の設定
const CACHE_STRATEGIES = {
	// 静的アセット: Cache First
	static: [/\.css$/, /\.js$/, /\.woff2?$/, /\.ttf$/, /\.eot$/],

	// 画像: Cache First with fallback
	images: [/\.jpg$/, /\.jpeg$/, /\.png$/, /\.webp$/, /\.svg$/, /\.gif$/],

	// HTML: Network First
	html: [/\.html$/, /\/$/],

	// API: Network First with cache fallback
	api: [/\/api\//],
};

// Service Worker インストール
self.addEventListener("install", (event) => {
	console.log("Service Worker: Installing...");

	event.waitUntil(
		caches
			.open(STATIC_CACHE)
			.then((cache) => {
				console.log("Service Worker: Caching static assets");
				return cache.addAll(STATIC_ASSETS);
			})
			.then(() => {
				console.log("Service Worker: Installation complete");
				return self.skipWaiting();
			})
			.catch((error) => {
				console.error("Service Worker: Installation failed", error);
			})
	);
});

// Service Worker アクティベート
self.addEventListener("activate", (event) => {
	console.log("Service Worker: Activating...");

	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						// 古いキャッシュを削除
						if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== IMAGE_CACHE) {
							console.log("Service Worker: Deleting old cache", cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => {
				console.log("Service Worker: Activation complete");
				return self.clients.claim();
			})
	);
});

// フェッチイベント処理
self.addEventListener("fetch", (event) => {
	const request = event.request;
	const url = new URL(request.url);

	// 同一オリジンのリクエストのみ処理
	if (url.origin !== location.origin) {
		return;
	}

	// キャッシュ戦略を決定
	const strategy = determineStrategy(request.url);

	switch (strategy) {
		case "static":
			event.respondWith(cacheFirst(request, STATIC_CACHE));
			break;
		case "images":
			event.respondWith(cacheFirst(request, IMAGE_CACHE));
			break;
		case "html":
			event.respondWith(networkFirst(request, DYNAMIC_CACHE));
			break;
		case "api":
			event.respondWith(networkFirst(request, DYNAMIC_CACHE));
			break;
		default:
			event.respondWith(networkFirst(request, DYNAMIC_CACHE));
	}
});

// キャッシュ戦略を決定
function determineStrategy(url) {
	for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
		if (patterns.some((pattern) => pattern.test(url))) {
			return strategy;
		}
	}
	return "default";
}

// Cache First 戦略
async function cacheFirst(request, cacheName) {
	try {
		// キャッシュから取得を試行
		const cache = await caches.open(cacheName);
		const cachedResponse = await cache.match(request);

		if (cachedResponse) {
			console.log("Service Worker: Serving from cache", request.url);

			// バックグラウンドでキャッシュを更新
			updateCache(request, cache);

			return cachedResponse;
		}

		// キャッシュにない場合はネットワークから取得
		console.log("Service Worker: Fetching from network", request.url);
		const networkResponse = await fetch(request);

		// レスポンスをキャッシュに保存
		if (networkResponse.ok) {
			cache.put(request, networkResponse.clone());
		}

		return networkResponse;
	} catch (error) {
		console.error("Service Worker: Cache first failed", error);

		// 画像の場合はプレースホルダーを返す
		if (request.destination === "image") {
			return caches.match("/images/placeholder.jpg");
		}

		// その他の場合はオフラインページを返す
		return (
			caches.match("/offline.html") ||
			new Response("オフラインです", {
				status: 503,
				statusText: "Service Unavailable",
			})
		);
	}
}

// Network First 戦略
async function networkFirst(request, cacheName) {
	try {
		// ネットワークから取得を試行
		console.log("Service Worker: Fetching from network", request.url);
		const networkResponse = await fetch(request);

		// レスポンスをキャッシュに保存
		if (networkResponse.ok) {
			const cache = await caches.open(cacheName);
			cache.put(request, networkResponse.clone());
		}

		return networkResponse;
	} catch (error) {
		console.log("Service Worker: Network failed, trying cache", request.url);

		// ネットワークが失敗した場合はキャッシュから取得
		const cache = await caches.open(cacheName);
		const cachedResponse = await cache.match(request);

		if (cachedResponse) {
			return cachedResponse;
		}

		// キャッシュにもない場合
		if (request.destination === "document") {
			return (
				caches.match("/offline.html") ||
				new Response("オフラインです", {
					status: 503,
					statusText: "Service Unavailable",
				})
			);
		}

		throw error;
	}
}

// バックグラウンドでキャッシュを更新
async function updateCache(request, cache) {
	try {
		const networkResponse = await fetch(request);
		if (networkResponse.ok) {
			await cache.put(request, networkResponse);
			console.log("Service Worker: Cache updated in background", request.url);
		}
	} catch (error) {
		console.log("Service Worker: Background cache update failed", error);
	}
}

// キャッシュサイズ制限
async function limitCacheSize(cacheName, maxItems) {
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();

	if (keys.length > maxItems) {
		// 古いアイテムから削除
		const itemsToDelete = keys.slice(0, keys.length - maxItems);
		await Promise.all(itemsToDelete.map((key) => cache.delete(key)));
		console.log(`Service Worker: Cleaned ${itemsToDelete.length} items from ${cacheName}`);
	}
}

// 定期的なキャッシュクリーンアップ
self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "CLEAN_CACHE") {
		event.waitUntil(Promise.all([limitCacheSize(DYNAMIC_CACHE, 50), limitCacheSize(IMAGE_CACHE, 100)]));
	}
});

// プッシュ通知対応（将来の拡張用）
self.addEventListener("push", (event) => {
	if (event.data) {
		const data = event.data.json();
		const options = {
			body: data.body,
			icon: "/images/icon-192x192.png",
			badge: "/images/badge-72x72.png",
			tag: "game-update",
			requireInteraction: true,
			actions: [
				{
					action: "view",
					title: "詳細を見る",
				},
				{
					action: "dismiss",
					title: "閉じる",
				},
			],
		};

		event.waitUntil(self.registration.showNotification(data.title, options));
	}
});

// 通知クリック処理
self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	if (event.action === "view") {
		event.waitUntil(clients.openWindow("/news/"));
	}
});

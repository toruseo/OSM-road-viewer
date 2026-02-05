# GeoJSON Viewer

大規模GeoJSON（百MBクラス）をWebGLで高速描画するローカルWebアプリ

## 技術スタック
- **描画**: deck.gl (GeoJsonLayer, TextLayer) + MapLibre GL JS
- **ビルド**: Vite

## プロジェクト構造
```
gis/
├── index.html              # エントリポイント（UI、スタイル）
├── package.json            # 依存関係
├── vite.config.js          # Vite設定
├── osm.geojson             # 道路データ（起動時に自動読み込み）
└── src/
    ├── main.js             # アプリケーションエントリ、検索UI連携
    └── MapView.js          # deck.gl + MapLibre統合、描画・検索機能
```

## 実装済み機能

### 1. 基本機能
- osm.geojson自動読み込み（進捗表示付き）
- 自動bounds調整（データ範囲にフィット）

### 2. OSM道路スタイリング
fclass属性に基づく色分けと線幅設定：

| fclass    | 色   | 線幅 |
|-----------|------|------|
| motorway  | 赤   | 6px  |
| trunk     | 青   | 4px  |
| primary   | 緑   | 2px  |
| secondary | 緑   | 1px  |
| その他    | グレー | 1px  |

### 3. 道路名ラベル表示
- チェックボックスでオン/オフ切替（デフォルト: オフ）
- 表示形式: `name fclass ref`
- 同名道路の重複ラベル抑制（10セグメントごとに1つ）
- 日本語フォント対応

### 4. ホバー時ツールチップ
- 道路にマウスを置くと道路名をポップアップ表示
- 表示形式: `name fclass ref`

### 5. 道路検索機能
- 検索条件: name（部分一致）, fclass（プルダウン選択）, ref（完全一致）
- AND検索（空欄は無視）
- ヒットした道路を黄色でハイライト表示
- 検索結果の範囲に自動ジャンプ
- 検索結果件数表示

## 起動方法
```bash
npm install
npm run dev
```
http://localhost:5173 でアクセス

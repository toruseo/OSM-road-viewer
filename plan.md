Plan to implement      
     
大規模GeoJSON WebGL描画アプリ 実装計画   
     
概要 
     
500MBクラスのLineString GeoJSONをWebGLで高速描画するローカルWebアプリ        
     
技術構成               
     
- 描画: deck.gl (PathLayer) + MapLibre GL JS               
- ビルド: Vite         
- 大規模データ対応: Web Worker + ストリーミング読み込み    
     
プロジェクト構造       
     
gis/ 
├── index.html              # エントリポイント             
├── package.json            # 依存関係   
├── vite.config.js          # Vite設定   
└── src/               
    ├── main.js             # アプリケーションエントリ     
    ├── MapView.js          # deck.gl + MapLibre統合       
    ├── FileLoader.js       # ファイル読み込み管理         
    └── worker/        
        └── parser.worker.js # GeoJSONパース用Web Worker   
     
実装タスク             
     
1. プロジェクト初期化  
     
- npm init -y でpackage.json作成         
- 依存関係インストール:
  - @deck.gl/core, @deck.gl/layers, @deck.gl/mapbox        
  - @loaders.gl/core, @loaders.gl/json   
  - maplibre-gl        
  - vite (devDependencies)               
     
2. index.html 作成     
     
- フルスクリーンマップコンテナ           
- ファイル選択ボタン   
- 読み込み進捗表示     
- MapLibre CSSの読み込み                 
     
3. src/worker/parser.worker.js 作成      
     
- FileReader + ReadableStreamでストリーミング読み込み      
- Feature単位でインクリメンタルパース    
- 進捗をメインスレッドに報告             
- パース完了後、Transferable Objectとしてデータ返却        
     
4. src/FileLoader.js 作成                
     
- ファイル選択UI連携   
- Web Workerの生成・管理                 
- 進捗表示の更新       
- パース完了時のコールバック             
     
5. src/MapView.js 作成 
     
- MapLibre GL JS初期化（ベースマップ）   
- deck.gl MapboxOverlay設定              
- GeoJsonLayer（LineString用PathLayer）設定                
- データ更新メソッド   
     
6. src/main.js 作成    
     
- アプリケーション初期化                 
- FileLoader + MapView連携               
- イベントハンドリング 
     
7. vite.config.js 作成 
     
- Web Worker対応設定   
     
主要な最適化ポイント   
     
1. Web Worker: JSONパースをメインスレッドから分離          
2. ストリーミング読み込み: メモリ効率化  
3. 定数カラー値: コールバック関数より高速
4. pickable: false: ホバー不要でパフォーマンス向上         
     
検証方法               
     
1. npm run dev で開発サーバー起動        
2. ブラウザで http://localhost:5173 にアクセス             
3. ファイル選択ボタンからGeoJSONを読み込み                 
4. 地図上に描画されることを確認          
5. ズーム・パン操作が動作することを確認  

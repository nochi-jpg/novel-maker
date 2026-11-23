# ノベルゲームメーカー きょういく版

- 配る用：`novel-maker-edu.html`（このファイル1つをそのまま配る）
- 仕様書：`SPEC.md`／自分用v0.6の仕様：`docs/personal-v0.6-spec.md`
- 開発：`src/` を直して `python3 build.py` → `novel-maker-edu.html` ができる
- 素材：`assets/`（サンプルの背景・立ち絵・ロゴ。build.py が埋めこむ）
- テスト：`python3 test/click.py`（本物のクリックで全画面を回り、スクショとはみ出しチェック）、`python3 test/logic.py`（分岐・フラグ・セーブ・読みこみ）
- ライブラリ：`vendor/`（tsParticles・Sakura.js＝MIT、Yomogiフォント＝OFL）

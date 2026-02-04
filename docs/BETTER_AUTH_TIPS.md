# Better Auth Tips

Better Authを使う上で知っておくべきポイントをまとめたドキュメント。

## 目次

- [Better Authが自動でやってくれること](#better-authが自動でやってくれること)
- [規約（Convention）について](#規約conventionについて)
- [セッション管理の仕組み](#セッション管理の仕組み)
- [Cookie と JWT](#cookie-と-jwt)
- [cookieCache（パフォーマンス最適化）](#cookiecacheパフォーマンス最適化)
- [Middleware でのチェック](#middleware-でのチェック)

---

## Better Authが自動でやってくれること

`authClient.signIn.email()` や `auth.api.getSession()` を呼ぶと、Better Authが内部で以下を自動処理する：

- DBアクセス
- セッションの有効期限チェック
- 期限の自動延長（updateAge条件を満たした場合）
- Cookieの設定・更新

**こちらで実装する必要はない。**

### なぜカラム名を指定していないのに動くのか？

Better Authは「規約（Convention）」に基づいて動作する。
`@better-auth/cli generate` が生成するスキーマは、Better Authが期待する構造になっている。

```
Better Auth内部コード（イメージ）：
SELECT * FROM session WHERE token = ? AND expiresAt > NOW()
                                          ^^^^^^^^
                                    「expiresAt」という名前を期待
```

---

## 規約（Convention）について

### 必須テーブル（4つ）

| テーブル | 役割 |
|---------|------|
| user | ユーザー情報 |
| session | セッション管理（expiresAtを含む） |
| account | OAuth情報 |
| verification | メール確認等 |

### カラム名を変えたい場合

DBだけ変更すると動かない。auth.tsの設定も合わせて変更する必要がある：

```ts
export const auth = betterAuth({
  session: {
    modelName: "user_sessions",  // テーブル名変更
    fields: {
      expiresAt: "expires_time", // カラム名変更
      userId: "user_id",
    },
  },
})
```

FYI: https://www.better-auth.com/docs/concepts/database

---

## セッション管理の仕組み

### 設定例

```ts
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7日間（セッションの有効期限）
  updateAge: 60 * 60 * 24,     // 1日ごとに有効期限を更新
},
```

### expiresIn と updateAge の動作

```
【設定】
expiresIn: 7日
updateAge: 1日

【タイムライン例】

1/1 ログイン
  → 有効期限: 1/8（7日後）

1/2 アクセス
  → 前回更新から1日経った → 有効期限を更新
  → 有効期限: 1/9（今日から7日後）← 「今日から」がポイント

1/5 アクセス
  → 前回更新から3日経った → 有効期限を更新
  → 有効期限: 1/12（今日から7日後）
```

### updateAge の役割

「どのくらいの頻度で更新処理を行うか」を決める設定。

```
1/1 10:00 ログイン     → 更新 ✓
1/1 11:00 アクセス     → 更新しない（1日経ってない）
1/1 15:00 アクセス     → 更新しない（1日経ってない）
1/2 12:00 アクセス     → 更新 ✓（1日以上経った）
```

毎回DBを更新すると負荷がかかるので、間隔を設けている。

FYI: https://www.better-auth.com/docs/concepts/session-management

---

## Cookie と JWT

### デフォルトの動作（DBセッション）

Better Authはデフォルトで**JWTではない**。従来のセッション方式を採用。

```
【デフォルト：データベースセッション】
Cookie: セッションID（ランダムな文字列）
        ↓
サーバー: IDでDBを検索 → ユーザー情報を取得

【JWTモード（オプション）】
Cookie: JWTトークン（ユーザー情報が埋め込まれている）
        ↓
サーバー: 署名を検証するだけ（DB検索不要）
```

### 有効期限の管理場所

| 方式 | 有効期限の保存場所 |
|------|------------------|
| DBセッション（デフォルト） | データベースの `session.expiresAt` |
| JWT | トークン内の `exp` クレーム |

### DBセッション vs JWT

| 観点 | DBセッション | JWT |
|------|-------------|-----|
| 期限の保存場所 | データベース | トークン内 |
| 即時無効化 | 簡単（DBから削除） | 難しい |
| DBアクセス | 毎回必要 | 不要 |
| スケーラビリティ | やや低い | 高い |

---

## cookieCache（パフォーマンス最適化）

DBアクセスを減らすためのキャッシュ機能。

### 設定例

```ts
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7日間
  updateAge: 60 * 60 * 24,     // 1日ごとに更新

  cookieCache: {
    enabled: true,
    maxAge: 60 * 60,     // 60分（キャッシュ有効期間）
    strategy: "jwt",      // JWT形式でCookieに保存
  },
},
```

### 2つのレイヤー

```
┌─────────────────────────────────────────────────────┐
│ レイヤー1: Cookie キャッシュ（JWT）                   │
│ maxAge: 60分                                        │
│ → DBアクセスなしで高速にセッション取得               │
└─────────────────────────────────────────────────────┘
                      ↓ キャッシュ切れたら
┌─────────────────────────────────────────────────────┐
│ レイヤー2: データベースセッション                     │
│ expiresIn: 7日間                                    │
│ → 正式なセッション情報（キャッシュの元データ）        │
└─────────────────────────────────────────────────────┘
```

### タイムライン

```
1/1 10:00 ログイン
    ├── DB: セッション作成（有効期限 1/8 10:00）
    └── Cookie: JWTキャッシュ作成（有効期限 11:00）

1/1 10:30 アクセス
    └── Cookie（JWT）から直接読み取り → DBアクセスなし ✓

1/1 11:05 アクセス（キャッシュ切れ）
    ├── Cookie期限切れ → DBにアクセス
    ├── DB: セッション有効（1/8まで）
    └── Cookie: 新しいJWTキャッシュ作成（有効期限 12:05）
```

### 3つの戦略（strategy）

| strategy | 特徴 | サイズ |
|----------|------|--------|
| compact | 独自形式（デフォルト） | 最小 |
| jwt | JWT形式（HS256署名） | 中 |
| jwe | JWT + 暗号化 | 大 |

### refreshCache オプション

Cookieキャッシュが切れる前に自動更新する設定。

```ts
cookieCache: {
  enabled: true,
  maxAge: 5 * 60,       // 5分
  refreshCache: true,   // 残り20%（1分）で自動更新
},
```

### メリット・デメリット

```
【メリット】
・キャッシュ期間中はDBアクセスなし → 高速 & DB負荷軽減

【デメリット】
・セッション無効化が最大キャッシュ期間分遅れる
  （例: 管理者がユーザーをBANしても、60分間はアクセス可能）
```

### maxAge の目安

| maxAge | 用途 |
|--------|------|
| 5分 | セキュリティ重視（管理画面、金融系） |
| 15〜30分 | バランス型 |
| 60分 | パフォーマンス重視（一般的なWebアプリ） |

---

## Middleware でのチェック

### 2つのアプローチ

| 方法 | DBアクセス | セキュリティ | 用途 |
|------|-----------|-------------|------|
| ページごとにチェック | あり | 高い | 確実な保護 |
| middleware（proxy.ts） | なし | 低い（Cookie存在のみ） | UX向上（早期リダイレクト） |

### 方法1: ページごとにチェック（推奨）

```tsx
// app/dashboard/page.tsx
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/sign-in')
  }

  return <div>Welcome, {session.user.name}</div>
}
```

### 方法2: proxy.ts で一括チェック（軽量）

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const protectedPaths = ['/dashboard', '/settings']
  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (!isProtected) {
    return NextResponse.next()
  }

  // Cookieの存在チェック（軽量）
  const sessionCookie = request.cookies.get('better-auth.session_token')

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
}
```

### 注意点

`request.cookies.get()` は **Cookieが存在するかどうか** だけを見ている。

- JWTの有効期限チェック → していない
- JWTの署名検証 → していない
- DBでセッション確認 → していない

そのため、**両方組み合わせる**のがベスト：

1. **proxy.ts** → Cookieがなければ即リダイレクト（高速）
2. **ページ** → DBでセッション有効性を確認（確実）

---

## 公式ドキュメント

- [Database](https://www.better-auth.com/docs/concepts/database)
- [Session Management](https://www.better-auth.com/docs/concepts/session-management)
- [Next.js Integration](https://www.better-auth.com/docs/integrations/next)
- [Optimizing for Performance](https://www.better-auth.com/docs/guides/optimizing-for-performance)

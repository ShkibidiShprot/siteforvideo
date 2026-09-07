# НИТКИ — Детективна дошка

Інтерактивна дошка розслідування на React, TypeScript і Vite.

## Локальний запуск

Потрібен Node.js 22.12 або новіший (у GitHub Actions використовується Node.js 22).

```sh
npm ci
npm run dev
```

Перевірка TypeScript і production-збірка:

```sh
npm run build
npm run preview
```

Готовий сайт створюється у `dist/`. Плагін `vite-plugin-singlefile` вбудовує
JavaScript, CSS і зображення у `index.html`. Відносний `base: "./"` дозволяє
відкривати сайт як у корені домену, так і за шляхом `/siteforvideo/`.

## Публікація через GitHub Actions

Сайт: **https://shkibidishprot.github.io/siteforvideo/**

Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. У **Settings → Pages → Build and deployment → Source** має бути вибрано
   **GitHub Actions**. Для цього репозиторію цей режим уже ввімкнено.
2. Злий зміни з workflow у `main`. Кожен наступний push або злиття pull request
   у `main` автоматично встановлює залежності через `npm ci`, перевіряє TypeScript,
   збирає сайт і публікує вміст `dist/` на GitHub Pages.
3. Прогрес і результат доступні у вкладці
   [Actions](https://github.com/ShkibidiShprot/siteforvideo/actions).
   Після завершення кроку **Deploy** сайт буде доступний за адресою вище.

Для ручної повторної публікації відкрий **Actions → Deploy to GitHub Pages →
Run workflow**, вибери гілку `main` і запусти workflow. Ця кнопка з’явиться,
коли файл workflow буде у `main`.

Pull request у `main` проходять лише перевірку збірки — вони не змінюють
опублікований сайт. Ручний запуск для інших гілок теж лише перевіряє збірку.
Середовище `github-pages` повинно дозволяти деплой з `main`.

Окремі токени, секрети або гілка `gh-pages` не потрібні: публікація використовує
стандартний `GITHUB_TOKEN` та OIDC із дозволами, заданими у workflow.

`dist/` і `node_modules/` не потрібно додавати до Git.

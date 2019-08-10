# Corner Stats Parser
Парсер статистики матчей c сайта corner-stats. Работает на NodeJS.

## Установка
- Установить [NodeJS](https://nodejs.org/en/) последней версии.
- Загрузить архив с приложением, распаковать.

- Внести изменения в файл конфигурации приложения, а именно сконфигурировать настройку крона.
```sh
csparse/config/app.config.json
```

- Заходим в папку приложения

```sh
cd csparser
```

- Устанавливаем пакеты нужные для работы приложения
```sh
npm install
```

- Устанавливаем cli для библиотеки sequelize
```sh
 npm install -g sequelize-cli
```

- Создаём таблицы в базе данных
```sh
 npx sequelize db:migrate
```
## Работа с приложением
Запуск приложения
```sh
cd csparser
npm run csparser
```
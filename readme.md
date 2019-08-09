# Corner Stats Parser
Парсер статистики матчей сайта corner-stats. Работает на NodeJS, база MySQL.

## Установка
- Установить [NodeJS](https://nodejs.org/en/) последней версии.
- Установить MySQL, можно портабл.
- Загрузить архив с приложением, распаковать.
- Внести изменения в файл конфигурации базы данных.
```sh
csparse/config/config.json
```
- Внести изменения в файл конфигурации приложения, а именно сконфигурировать настройку крона.
```sh
csparse/config/app.config.json
```

- Заходим в папку приложения

```sh
cd CSParser
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

- Запускаем приложение
```sh
npm start csparse
```
# Corner Stats Parser
Парсер статистики матчей c сайта corner-stats. Работает на NodeJS.

## Установка
- Установить [NodeJS](https://nodejs.org/en/) последней версии.
- Установить MySQL, создать базу "csparser".
```sql
CREATE DATABASE csparser;
```
- Загрузить архив с приложением, распаковать.
- Внести изменения в файл конфигурации базы данных.
```sh
csparse/config/database.json
```
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
 npx sequelize-cli db:migrate
```
## Работа с приложением
Запуск приложения
```sh
npm run csparser
```
Обнуление БД
```sh
npx sequelize-cli db:migrate:undo:all
```

## Логи
Логи расположены в папке /logs,  формат имени логов - назначение.-%дата%.log

- **app** - общий лог приложения.
- **importcountries** - лог функции импорта стран.
- **importtournaments** -  лог функции импорта лиг.
- **importmatches** -  лог функции импорта матчей.
- **importmatchstats** -  лог функции импорта статистики матчей.
# Corner Stats Parser
Парсер статистики матчей сайта corner-stats. Работает на NodeJS, база MySQL.

## Установка
- Установить [NodeJS](https://nodejs.org/en/) последней версии.
- Установить MySQL, можно портабл.
- Загрузить архив с приложением, распоковать.
- Внести изменения в файл конфигурации базы.
```sh
csparse/config/config.json
```
- Заходим в папку приложения

```sh
cd CSParser
```

- Устанавливаем пакеты нужные для работы приложения
```sh
npm install
```

- Создаём таблицы в базе данных
```sh
 sequelize db:migrate
```

- Запускаем приложение
```sh
npm start csparse
```
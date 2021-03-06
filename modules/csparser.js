const needle = require('needle');
const async = require('async');
const cheerio = require('cheerio');
const models = require('../models');
const config = require('../config');
const logConfig = require('../config/log.config');
const moment = require('moment');
const log4js = require('log4js');
const CronJob = require('cron').CronJob;

log4js.configure(logConfig);
const logger = log4js.getLogger('app');

const env = process.env.NODE_ENV;

async function importCountries() {

  const iCLogger = log4js.getLogger('IC');

  iCLogger.info('Запущен импорт стран.');

  let res = false;

  try {
    iCLogger.info('Запрашиваем ' + gConfig.csUrl);
    res = await needle('get', gConfig.csUrl)
  } catch (e) {
    iCLogger.error('Страницу "' + gConfig.csUrl + '" не удалось загрузить. Ошибка: "' + e + '"');
    iCLogger.error('Импорт стран завершился с ошибкой.');
    return false;
  }

  iCLogger.info('Ответ от сайта получен');

  const $ = cheerio.load(res.body);
  const countriesElements = $('.style_li');

  const countriesElementsCount = countriesElements.length;
  iCLogger.info('Найдено стран ' + countriesElementsCount + ', начинаем импорт.');
  iCLogger.info('Импортированы будут только отсутствуюбщие в базе страны.');

  const countries = [];

  countriesElements.each((i, el) => {
    countries.push({
      name: $(el).text(),
      altName: $(el).next().find('a').attr('href').split('/')[2]
    });
  });

  for (const country of countries) {
    try {
      [details, isCreated] = await models.Country.findOrCreate({
        where: {altName: country.altName},
        defaults: {
          'name': country.name,
          'altName': country.altName
        }
      });
      if (isCreated)
        iCLogger.info('Импортирована: ' + country.name)
    } catch (e) {
      iCLogger.error('Ошибка соединения с базой! (' + e + ')');
      return false;
    }


  }

  iCLogger.info('Импорт стран закончен.');
  return true;
}


async function importTournaments() {

  const iTLogger = log4js.getLogger('IT');

  iTLogger.info('Запущен импорт лиг.');

  let res = false;

  try {
    iTLogger.info('Запрашиваем сайт ' + gConfig.csUrl);
    res = await needle('get', gConfig.csUrl)
  } catch (e) {
    iTLogger.error('Страницу "' + gConfig.csUrl + '" не удалось загрузить. Ошибка: "' + e + '"');
    iTLogger.error('Импорт лиг завершился с ошибкой.');
    return false;
  }


  iTLogger.info('Ответ от сайта получен');

  const $ = cheerio.load(res.body);
  const tournamentsElements = $('.tournament_div a');

  const tournamentsElementCount = tournamentsElements.length;
  iTLogger.info('Найдено лиг: ' + tournamentsElementCount + ', начинаем импорт.');
  iTLogger.info('Импортированы будут только отсутствуюбщие в базе лиги.');

  const tournaments = [];

  tournamentsElements.each((i, el) => {
    tournaments.push({
      link: $(el).attr('href'),
      altName: $(el).attr('href').split('/')[1],
      name: $(el).text(),
      country: $(el).attr('href').split('/')[2]
    });
  });

  for (const tournament of tournaments) {
    try {
      [details, isCreated] = await models.Tournament.findOrCreate({
        where: {altName: tournament.altName},
        defaults: {
          'name': tournament.name,
          'altName': tournament.altName,
          'countryAltName': tournament.country,
          'link': tournament.link
        }
      });
      if (isCreated)
        iTLogger.info('Импорт лиги "' + tournament.name + '"');
    } catch (e) {
      iTLogger.error('Ошибка соединения с базой! (' + e + ')');
      return false;
    }

  }


  iTLogger.info('Импорт лиг закончен.');
  return true;
}


async function importMatches() {

  const iMLogger = log4js.getLogger('IM');

  iMLogger.info('Запущен импорт матчей.');

  const countries = await models.Country.findAll({where: {parse: true}, raw: true, include: ['tournament']});

  const tournamentCount = countries.length;
  iMLogger.info('Матчи будут импортированы из ' + tournamentCount + ' лиг(и)');

  if (tournamentCount)
    iMLogger.info('Начинаем импорт матчей.');
  else {
    iMLogger.info('Импорт матчей закончен.');
    return true;
  }


  let q = async.queue(async (task, callback) => {

    let res = false;

    try {
      res = await needle('get', task.url)
    } catch (e) {
      iMLogger.error('Страницу матча "' + task.url + '" не удалось загрузить. Ошибка: "' + e + '"');
      iMLogger.error('Импорт матча завершился с ошибкой.');
      return false;
    }

    if (task.allImported)
      iMLogger.info('Выполняем поиск и иморт новых матчей для "' + task.countryName + '/' + task.tournamentName + '"');

    const $ = cheerio.load(res.body);

    const pagesElements = $($('.old-matches div a').get().reverse());

    const pagesCount = pagesElements.length + 1;

    const matches = [];

    $('.old-matches-tr2').each((i, el) => {
      const linkElement = $(el).find('a').eq(0);
      const teamNames = linkElement.text().substr(linkElement.text().indexOf(' ') + 1).split(' - ');
      matches.push({
        csId: linkElement.attr('href').split('/').pop(),
        link: linkElement.attr('href'),
        firstTeamName: teamNames[0],
        secondTeamName: teamNames[1],
        name: linkElement.text()
      });
    });


    for (const match of matches) {

      let createdCount = 0;

      try {
        const [details, isCreated] = await models.Match.findOrCreate({
          where: {csId: match.csId},
          defaults: {
            link: match.link,
            name: match.name,
            firstTeamName: match.firstTeamName,
            secondTeamName: match.secondTeamName,
            countryName: task.countryName,
            countryAltName: task.countryAltName,
            tournamentAltName: task.tournamentAltName
          }
        });
        if (isCreated) {
          createdCount++;
          iMLogger.info('Импорт матча: [лига: ' + task.index + ' из ' + tournamentCount + ', стр.: ' + task.page +
            ' из ' + pagesCount + '] ' + task.countryName + '/' + task.tournamentName + ' ' + match.name, '(' + match.link + ')'
          )
        }
      } catch (e) {
        iMLogger.error('Ошибка соединения с базой! (' + e + ')');
        return false;
      }

    }


    let updateStatement = {};

    updateStatement.status = !task.allImported
      ? 'Запущен полный импорт, импортируется ' + task.page + ' страница из ' + pagesCount
      : 'Выполнен поиск и импорт новых матчей';

    updateStatement = (task.page === pagesCount && pagesCount > 1) ? {
      status: 'Выполнен полный импорт.',
      allImported: true
    } : {};

    try {
      await models.Tournament.update(updateStatement, {where: {id: task.id}});
    } catch (e) {
      iMLogger.error('Ошибка соединения с базой! (' + e + ')');
      return false;
    }


    if (!task.allImported && task.page === 1) {

      let page = pagesCount;

      pagesElements.each((i, el) => {
        q.unshift({
          index: task.index,
          url: gConfig.csUrl + $(el).attr('href'),
          id: task.id,
          tournamentName: task.tournamentName,
          tournamentAltName: task.tournamentAltName,
          countryName: task.countryName,
          countryAltName: task.countryAltName,
          page: page--,
          allImported: false
        })
      });

    }

    callback();
  });


  countries.forEach((country, i) => {
    q.push({
      url: gConfig.csUrl + country['tournament.link'],
      id: country['tournament.id'],
      tournamentName: country['tournament.name'],
      tournamentAltName: country['tournament.altName'],
      countryName: country['name'],
      countryAltName: country['altName'],
      index: i + 1,
      page: 1,
      allImported: country['tournament.allImported'],
    });
  });

  await q.drain();

  iMLogger.info('Импорт матчей закончен.');
  return true;
}

async function importMatchStats() {

  const iMSLogger = log4js.getLogger('IMS');

  iMSLogger.info('Запущен импорт статистики матчей.');


  let matches = await models.Match.findAndCountAll({where: {firstTeamScore: null}, raw: true});

  if (matches.count)
    iMSLogger.info('Стаитистика будет импортирована для ' + matches.count + ' матчей(а)');
  else {
    iMSLogger.info('Матчи для импорта статистики отсутствуют.');
    return true
  }

  let q = async.queue(async (task, callback) => {

    let res = false;

    try {
      res = await needle('get', task.url)
    } catch (e) {
      iMSLogger.error('Страницу матча "' + task.name + '" не удалось загрузить. URL: "' + task.url + '" Ошибка: "' + e + '"');
      iMSLogger.error('Импорт матча завершился с ошибкой.');
      return false;
    }


    const $ = cheerio.load(res.body);

    const match = {};

    const statsElements = $('.match-info__stats');
    const matchDescription = $('.match-info__description');

    if (!statsElements.length) {
      iMSLogger.info('Статистика о матче ' + task.name + ' не импортирована, отсутствует.');
      return false;
    }


    //Парсинг статистики их верхнего блока
    match.date = matchDescription.find('.match-info__block').eq(0).find('.match-info__title').text();
    match.date = moment(match.date, "DD/MM/YY HH:mm").format("YYYY-MM-DD HH:mm:ss");

    match.tournamentName = matchDescription.find('.match-info__block').eq(1).find('span').text();
    match.season = matchDescription.find('.match-info__block').eq(2).find('span').eq(1).text();
    match.referee = matchDescription.find('.match-info__block').eq(3).find('a').eq(1).text();


    //Парсинг статистики из блока справа
    match.firstTeamScore = statsElements.find('.goals span').eq(0).text();
    match.secondTeamScore = statsElements.find('.goals span').eq(1).text();

    match.firstTeamYellowCards = statsElements.find('.cards').find('span').eq(0).text();
    match.firstTeamYellowCards = match.firstTeamYellowCards === '?' ? 0 : match.firstTeamYellowCards;

    match.secondTeamYellowCards = statsElements.find('.cards').find('span').eq(1).text();
    match.secondTeamYellowCards = match.secondTeamYellowCards === '?' ? 0 : match.secondTeamYellowCards;

    match.firstTeamRedCards = statsElements.find('.cards').find('span').eq(2).text();
    match.firstTeamRedCards = match.firstTeamRedCards === '?' ? 0 : match.firstTeamRedCards;

    match.secondTeamRedCards = statsElements.find('.cards').find('span').eq(3).text();
    match.secondTeamRedCards = match.secondTeamRedCards === '?' ? 0 : match.secondTeamRedCards;

    match.firstTeamSubs = statsElements.find('.sub').find('span').eq(0).text();
    match.firstTeamSubs = match.firstTeamSubs === '?' ? 0 : match.firstTeamSubs;

    match.secondTeamSubs = statsElements.find('.sub').find('span').eq(1).text();
    match.secondTeamSubs = match.secondTeamSubs === '?' ? 0 : match.secondTeamSubs;

    const firstTeamCorners = statsElements.find('.other .other_block_left').text().split(' ');
    const secondTeamCorners = statsElements.find('.other .other_block_right').text().split(' ');
    match.firstTeamCorner = firstTeamCorners[0] === '?' ? 0 : firstTeamCorners[0];
    match.secondTeamCorner = secondTeamCorners[0] === '?' ? 0 : secondTeamCorners[0];
    match.firstTeamCornerFirstHalf = firstTeamCorners.length === 1 ? 0 : firstTeamCorners[1].match(/\(([^)]+)\)/)[1];
    match.secondTeamCornerFirstHalf = secondTeamCorners.length === 1 ? 0 : secondTeamCorners[1].match(/\(([^)]+)\)/)[1];


    //Парсинг статистики из блока справа, вкладка другое.
    const otherBlockElements = $('.other_block .match-info__stats-score');

    match.firstTeamKicks = otherBlockElements.find('span:contains("Всего ударов")').prev().text() || 0;
    match.secondTeamKicks = otherBlockElements.find('span:contains("Всего ударов")').next().text() || 0;

    match.firstTeamShotOnGoal = otherBlockElements.find('span:contains("Удары в створ")').prev().text() || 0;
    match.secondTeamShotOnGoal = otherBlockElements.find('span:contains("Удары в створ")').next().text() || 0;

    match.firstTeamMissedKick = otherBlockElements.find('span:contains("Удары мимо")').prev().text() || 0;
    match.secondTeamMissedKick = otherBlockElements.find('span:contains("Удары мимо")').next().text() || 0;

    match.firstTeamBlockedKick = otherBlockElements.find('span:contains("Заблокированные удары")').prev().text() || 0;
    match.secondTeamBlockedKick = otherBlockElements.find('span:contains("Заблокированные удары")').next().text() || 0;

    match.firstTeamFouls = otherBlockElements.find('span:contains("Фолы")').prev().text() || 0;
    match.secondTeamFouls = otherBlockElements.find('span:contains("Фолы")').next().text() || 0;

    match.firstTeamOffside = otherBlockElements.find('span:contains("Офсайды")').prev().text() || 0;
    match.secondTeamOffside = otherBlockElements.find('span:contains("Офсайды")').next().text() || 0;

    match.firstTeamHandling = otherBlockElements.find('span:contains("Владение")').prev().text() || 0;
    match.secondTeamHandling = otherBlockElements.find('span:contains("Владение")').next().text() || 0;

    match.firstTeamSaves = otherBlockElements.find('span:contains("Сэйвы")').prev().text() || 0;
    match.secondTeamSaves = otherBlockElements.find('span:contains("Сэйвы")').next().text() || 0;


    try {
      await models.Match.update(match, {where: {id: task.id}});
    } catch (e) {
      iMSLogger.error('Ошибка импорта статистики матча в базу "' + task.name + '" URL: "' + task.url + '" Ошибка: "' + e + '"');
      return false;
    }
    iMSLogger.info('Импортирована статистика для "' + task.name + '" URL: "' + task.url + '"');


    //Импорт статистики голов из выдвигаемого списка
    const goals = [];

    $('.goals_block .match-info__row').each((i, el) => {
      const goalBy = $(el).find('.match-info__dropdown-1team img').length ? 1 : 2;
      const minute = $(el).find('.match-info__dropdown-time').text().replace(/\D/g, "");
      goals.push({
        matchCsId: task.id,
        firstTeamGoals: $(el).find('.match-info__dropdown-1team').children().remove().end().text().trim(),
        secondTeamGoals: $(el).find('.match-info__dropdown-2team').children().remove().end().text().trim(),
        goalBy,
        minute
      });
    });

    try {
      models.Goal.bulkCreate(goals)
    } catch (e) {
      iMSLogger.error('Ошибка импорта статистики голов матча в базу "' + task.name + '" URL: "' + task.url + '" Ошибка: "' + e + '"');
      return false;
    }


    //Импорт статистики карточек из выдвигаемого списка
    const cards = [];

    $('.cards_block .match-info__row').each((i, el) => {
      const forTeam = $(el).find('.match-info__dropdown-1team img').length ? 1 : 2;
      const minute = $(el).find('.match-info__dropdown-time').text().replace(/\D/g, "");
      const cardType = $(el).find('img').attr('src').split('/').pop().split('.')[0];
      cards.push({
        matchCsId: task.id,
        firstTeamCards: $(el).find('.match-info__dropdown-1team').children().remove().end().text().trim(),
        secondTeamCards: $(el).find('.match-info__dropdown-2team').children().remove().end().text().trim(),
        cardType,
        forTeam,
        minute
      });
    });

    try {
      models.Card.bulkCreate(cards);
    } catch (e) {
      iMSLogger.error('Ошибка импорта статистики карточек матча в базу "' + task.name + '" URL: "' + task.url + '" Ошибка: "' + e + '"');
      return false
    }


    //Импорт статистики замен из выдвигаемого списка
    const subs = [];

    $('.sub_block .match-info__row').each((i, el) => {
      const team = $(el).find('.match-info__dropdown-1team img').length ? 1 : 2;
      const minute = $(el).find('.match-info__dropdown-time').text().replace(/\D/g, "");
      subs.push({
        matchCsId: task.id,
        firstTeamSubs: $(el).find('.match-info__dropdown-1team').children().remove().end().text().trim(),
        secondTeamSubs: $(el).find('.match-info__dropdown-2team').children().remove().end().text().trim(),
        team,
        minute
      });
    });

    try {
      models.Sub.bulkCreate(subs)
    } catch (e) {
      iMSLogger.error('Ошибка импорта статистики угловых матча в базу "' + task.name + '" URL: "' + task.url + '" Ошибка: "' + e + '"');
      return false;
    }


    callback();
  }, 5);


  for (const match of matches.rows) {
    q.push({
      url: gConfig.csUrl + match.link,
      name: match.name,
      id: match.id
    })
  }

  await q.drain();

  iMSLogger.info('Импорт статистики матчей закончен.');

  return true
}

async function checkConnections() {

  logger.info('Начинаем проверки соединений.');


  logger.info('Проверяем доступность базы данных.');
  try {
    await models.Country.findAll()
  } catch (e) {
    logger.error('База данных не доступна! Ошибка: ' + e);
    return false;
  }
  logger.info('База данных доступна.');

  try {
    logger.info('Проверяем доступность сайта "' + gConfig.csUrl + '"');
    await needle('get', gConfig.csUrl)
  } catch (e) {
    logger.warn('В данный момент сайт не доступен, пропускаем импорт. Ошибка: "' + e + '"');
    return false;
  }
  logger.info('Сайт доступен.');


  logger.info('Проверка соединений прошла успешно.');
  return true;
}


async function run() {

  if (!await checkConnections()) return false;


  logger.info('Запускаем импорт стран.');
  if (await importCountries())
    logger.info('Импорт стран завершился успешно.');
  else {
    logger.error('Импорт стран завершился с ошибкой.');
    return false
  }


  logger.info('Запускаем импорт лиг.');
  if (await importTournaments())
    logger.info('Импорт лиг завершился успешно.');
  else {
    logger.error('Импорт лиг завершился с ошибкой.');
    return false
  }


  logger.info('Запускаем импорт матчей.');
  if (await importMatches())
    logger.info('Импорт матчей успешно завершён.');
  else {
    logger.error('Импорт матчей завершён с ошибкой.');
    return false
  }

  logger.info('Запускаем импорт статистики матчей.');
  if (await importMatchStats())
    logger.info('Импорт статистики матчей успешно завершён.');
  else {
    logger.error('Импорт статистики матчей завершён с ошибкой.');
    return false
  }

  return true
}

async function app() {

  logger.info('Corner Stats Parser ');

  logger.info('Запускаем первоначальный импорт.');

  if (await run()) {
    logger.info('Первоначальный импорт завершился успешно.');
  } else {
    logger.error('Первоначальный импорт завершился с ошибкой, запуск планировщика невозможем без успешного прохождения данного импорта.');
    return false;
  }

  const job = new CronJob(gConfig.cronTime, async function () {
    logger.info('Импорт по планировщику запущен.');

    if (await run())
      logger.info('Импорт по планировщику закончен, следущий запуск согласно схеме: ' + gConfig.cronTime);
    else {
      logger.error('Импорт по планировщику завершился с ошибкой, следущая попытка согласно схеме: '+ gConfig.cronTime);
    }
  });

  job.start();

  logger.info('Запущен планировщик импорта, схема времени запусков: ' + gConfig.cronTime);
}

app();

const needle = require('needle');
const async = require('async');
const cheerio = require('cheerio');
const models = require('../models');
const config = require('../config');
const logConfig = require('../config/log.config');
const moment = require('moment');
const chalk = require('chalk');
const log4js = require('log4js');
const CronJob = require('cron').CronJob;

const log = console.log;

log4js.configure(logConfig);
const logger = log4js.getLogger('app');


async function importCountries() {

  const iCLogger = log4js.getLogger('IC');

  iCLogger.info('Запущен импорт стран.');

  iCLogger.info('Запрашиваем ' + gConfig.csUrl);
  const res = await needle('get', gConfig.csUrl).catch((e) => {
    iCLogger.error('Страницу "' + gConfig.csUrl + '" не удалось загрузить. Ошибка: "' + e + '"');
    throw e;
  });


  iCLogger.info('Ответ от ' + gConfig.csUrl + ' получен');

  const $ = cheerio.load(res.body);
  const countriesElements = $('.style_li');

  const countriesElementsCount = countriesElements.length;
  iCLogger.info('Найдено стран ' + countriesElementsCount + ', начинаем импорт.');
  iCLogger.info('Импортированы будут только отсутствуюбщие в базе страны!');

  const countries = [];

  countriesElements.each((i, el) => {
    countries.push({
      name: $(el).text(),
      altName: $(el).next().find('a').attr('href').split('/')[2]
    });
  });

  for (const country of countries) {
    await models.Country.findOrCreate({
      where: {altName: country.altName},
      defaults: {
        'name': country.name,
        'altName': country.altName
      }
    }).then(([country, created]) => {
      if (created)
        iCLogger.info('Импортирована: ' + country.name)
    }).catch((e) => {
      iCLogger.error('Ошибка соединения с базой! (' + e + ')');
      throw e;
    });
  }

  iCLogger.info('Импорт стран закончен.');
}


async function importTournaments() {

  const iTLogger = log4js.getLogger('IT');

  iTLogger.info('Запущен импорт лиг.');

  iTLogger.info('Запрашиваем сайт (' + gConfig.csUrl);
  const res = await needle('get', gConfig.csUrl).catch((e) => {
    iTLogger.error('Страницу "' + gConfig.csUrl + '" не удалось загрузить. Ошибка: "' + e + '"');
    throw e;
  });

  iTLogger.info('Ответ от сайта получен');

  const $ = cheerio.load(res.body);
  const tournamentsElements = $('.tournament_div a');

  const tournamentsElementCount = tournamentsElements.length;
  iTLogger.info('Найдено лиг: ' + tournamentsElementCount + ', начинаем импорт.');

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
    await models.Tournament.findOrCreate({
      where: {altName: tournament.altName},
      defaults: {
        'name': tournament.name,
        'altName': tournament.altName,
        'countryAltName': tournament.country,
        'link': tournament.link
      }
    }).then(() => {
      iTLogger.info('Импорт лиги "' + tournament.name + '"');
    }).catch((e) => {
      iTLogger.error('Ошибка соединения с базой! (' + e + ')');
      throw e;
    });
  }


  iTLogger.info('Импорт лиг закончен.');
}


async function importMatches() {

  const iMLogger = log4js.getLogger('IM');

  iMLogger.info('Запущен импорт матчей.');

  const countries = await models.Country.findAll({where: {parse: true}, raw: true, include: ['tournament']});

  const tournamentCount = countries.length;
  iMLogger.info('Список лиг получен, матчи будут импортированы из ' + tournamentCount + ' лиг(и)');

  if (tournamentCount)
    iMLogger.info('Начинаем импорт.');
  else
    iMLogger.info('Импорт матчей закончен.');

  let q = async.queue(async (task, callback) => {

    const res = await needle('get', task.url).catch((e) => {
      iMLogger.error('Страницу "' + task.url + '" не удалось загрузить. Ошибка: "' + e + '"');
    });

    const $ = cheerio.load(res.body);

    const pagesElements = $($('.old-matches div a').get().reverse());

    const pagesCount = pagesElements.length + 1;

    const matches = [];

    $('.old-matches-tr2').each((i, el) => {
      const linkElement = $(el).find('a').eq(0);
      const teamNames = linkElement.text().split(' ')[1].split(' - ');
      matches.push({
        csId: linkElement.attr('href').split('/').pop(),
        link: linkElement.attr('href'),
        firstTeamName: teamNames[0],
        secondTeamName: teamNames[0],
        name: linkElement.text()
      });
    });


    for (const match of matches) {
      let createdCount = 0;
      await models.Match.findOrCreate({
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
      }).then(([match, created]) => {
        if (created) {
          createdCount++;
          iMLogger.info('Импорт матча: [лига: ' + task.index + ' из ' + tournamentCount + ', стр.: ' + task.page +
            ' из ' + pagesCount + '] ' + task.countryName + '/' + task.tournamentName + ' ' + match.name, '(' + match.link + ')'
          )
        }
      }).catch((e) => {
        iMLogger.error('Ошибка соединения с базой! (' + e + ')');
        throw e;
      });
    }

    if (!task.allImported) {
      await models.Tournament.update(
        {status: 'Запущен полный импорт, импортируется ' + task.page + ' страница из ' + pagesCount},
        {where: {id: task.id}}
      );
    } else {
      await models.Tournament.update(
        {status: 'Выполнен поиск и импорт новых матчей'},
        {where: {id: task.id}}
      );
      iMLogger.info('Запускаем импорт статистики для "' + task.countryName + '/' + task.tournamentName + '"');
      await importMatchStats(task.tournamentAltName);
    }


    if (task.page === pagesCount && pagesCount > 1) {
      await models.Tournament.update(
        {allImported: true, status: 'Выполнен полный импорт.'},
        {where: {id: task.id}}
      );
      iMLogger.info('Запускаем импорт статистики для "' + task.countryName + '/' + task.tournamentName + '"');
      await importMatchStats(task.tournamentAltName);
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

}

async function importMatchStats(tournament = false) {

  const iMSLogger = log4js.getLogger('IMS');

  iMSLogger.info('Запущен импорт статистики матчей.');

  const tournamentAltName = tournament;

  let whereStatement = {firstTeamScore: null};

  if (tournamentAltName) {
    whereStatement.tournamentAltName = tournamentAltName;
    tournament = await models.Tournament.findOne({
      where: {altName: tournamentAltName},
      raw: true,
      include: ['country']
    }).catch((e) => {
      iMSLogger.error('Ошибка соединения с базой! (' + e + ')');
      throw e;
    });
    if (tournament)
      iMSLogger.info('Импортируется статистика матчей из ' + tournament['country.name'] + '/' + tournament.name);
    else {
      iMSLogger.error('Матч с именем "' + tournamentAltName + '" не найден, возможно таблица лиг пуста!');
      iMSLogger.error('Импорт статистики матчей для "' + tournamentAltName + '" завершён с ошибкой!');
      return false;
    }

  }

  let matches = await models.Match.findAndCountAll({where: whereStatement, raw: true});

  iMSLogger.info('Стаитистика будет импортирована для ' + matches.count + ' матчей(а)');

  let q = async.queue(async (task, callback) => {

    const res = await needle('get', task.url).catch((e) => {
      iMSLogger.error('Страницу матча "' + task.name + '" не удалось загрузить. URL: "' + task.url + '" Ошибка: "' + e + '"')
    });

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
    match.secondTeamYellowCards = statsElements.find('.cards').find('span').eq(1).text();

    match.firstTeamRedCards = statsElements.find('.cards').find('span').eq(2).text();
    match.secondTeamRedCards = statsElements.find('.cards').find('span').eq(3).text();

    match.firstTeamSubs = statsElements.find('.sub').find('span').eq(0).text();
    match.firstTeamSubs = match.firstTeamSubs === '?' ? 0 : match.firstTeamSubs;

    match.secondTeamSubs = statsElements.find('.sub').find('span').eq(1).text();
    match.secondTeamSubs = match.secondTeamSubs === '?' ? 0 : match.secondTeamSubs;

    match.firstTeamCorner = statsElements.find('.other .other_block_left').text().split(' ')[0];
    match.secondTeamCorner = statsElements.find('.other .other_block_right').text().split(' ')[0];

    match.firstTeamCornerFirstHalf = statsElements.find('.other .other_block_left').text().split(' ')[1].match(/\(([^)]+)\)/)[1];
    match.secondTeamCornerFirstHalf = statsElements.find('.other .other_block_right').text().split(' ')[1].match(/\(([^)]+)\)/)[1];


    //Парсинг статистики из блока справа, вкладка другое.
    const otherBlockElements = $('.other_block .match-info__stats-score');

    match.firstTeamKicks = otherBlockElements.eq(0).find('.other_block_left').text();
    match.secondTeamKicks = otherBlockElements.eq(0).find('.other_block_right').text();

    match.firstTeamShotOnGoal = otherBlockElements.eq(1).find('.other_block_left').text();
    match.secondTeamShotOnGoal = otherBlockElements.eq(1).find('.other_block_right').text();

    match.firstTeamMissedKick = otherBlockElements.eq(2).find('.other_block_left').text();
    match.secondTeamMissedKick = otherBlockElements.eq(2).find('.other_block_right').text();

    match.firstTeamBlockedKick = otherBlockElements.eq(3).find('.other_block_left').text();
    match.secondTeamBlockedKick = otherBlockElements.eq(3).find('.other_block_right').text();

    match.firstTeamFouls = otherBlockElements.eq(4).find('.other_block_left').text();
    match.secondTeamFouls = otherBlockElements.eq(4).find('.other_block_right').text();

    match.firstTeamOffside = otherBlockElements.eq(5).find('.other_block_left').text();
    match.secondTeamOffside = otherBlockElements.eq(5).find('.other_block_right').text();

    match.firstTeamHandling = otherBlockElements.eq(6).find('.other_block_left').text();
    match.secondTeamHandling = otherBlockElements.eq(6).find('.other_block_right').text();

    match.firstTeamSaves = otherBlockElements.eq(7).find('.other_block_left').text();
    match.secondTeamSaves = otherBlockElements.eq(7).find('.other_block_right').text();


    models.Match.update(match, {where: {id: task.id}}).then(() => {
      iMSLogger.info('Импортирована статистика для "' + task.name + '"');
    });

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
    models.Goal.bulkCreate(goals);


    //Импорт статистики карточек из выдвигаемого списка
    const cards = [];
    $('.cards_block .match-info__row').each((i, el) => {
      const forTeam = $(el).find('.match-info__dropdown-1team img').length ? 1 : 2;
      const minute = $(el).find('.match-info__dropdown-time').text().replace(/\D/g, "");
      const cardType = $(el).find('img').attr('src').split('/').pop().split('.')[0]
      cards.push({
        matchCsId: task.id,
        firstTeamCards: $(el).find('.match-info__dropdown-1team').children().remove().end().text().trim(),
        secondTeamCards: $(el).find('.match-info__dropdown-2team').children().remove().end().text().trim(),
        cardType,
        forTeam,
        minute
      });
    });
    models.Card.bulkCreate(cards);


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
    models.Sub.bulkCreate(subs);

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
}


async function run() {

  logger.info('CSParser запущен.');
  logger.info('Запуск импорта будет происходить каждые ' + gConfig.cronTime);

  const job = new CronJob(gConfig.cronTime, async function () {
    logger.info('Импорт по планировщику запущен.');
    await importCountries();
    await importTournaments();
    await importMatches();
    logger.info('Импорт по планировщику закончен.');
  });

  job.start();
}


run();
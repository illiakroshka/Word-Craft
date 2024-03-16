'use strict';

const increaseByDays = (date, days) => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

const getDates = (days) => {
  return { startDate: new Date(), endDate: increaseByDays(new Date(), days) };
}

module.exports = {
  increaseByDays,
  getDates,
}
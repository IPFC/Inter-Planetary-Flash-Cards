const cardLevelUp = (cardId, cardData, settings) => {
  console.log('cardData', cardData);
  // console.log('settings', settings);
  console.log('settings.randomizer', settings.randomizer);
  const initialreviews = settings.initial_reviews;
  const randomizer = Number(settings.randomizer);
  const now = new Date().getTime();
  const newLevel = cardData.level + 1;
  let due;
  let lastInterval = cardData.last_interval;
  console.log('newLevel, initialreviews.length', newLevel, initialreviews.length);
  if (newLevel <= initialreviews.length) {
    const max = initialreviews[newLevel - 1] * 60000 * (1 + randomizer);
    const min = initialreviews[newLevel - 1] * 60000 * (1 - randomizer);
    due = now + Math.random() * (max - min + 1) + min;
    console.log('under initial, new due', due);
  } else {
    let max = 0;
    let min = 0;
    // the first time the card levels beyond the initial reviews, the interval will be null.
    if (lastInterval === null) {
      lastInterval = 86400000; // 1 day in milliseconds
      max = lastInterval * (1 + randomizer);
      console.log(lastInterval, 1 + randomizer);
      min = lastInterval * (1 - randomizer);
      console.log('first over initial');
    } else {
      lastInterval *= settings.later_reviews_multiplier;
      max = lastInterval * (1 + randomizer);
      min = lastInterval * (1 - randomizer);
      console.log('2nd+ over initial');
    }
    console.log('max, min', max, min, convertDuration(max), convertDuration(min));
    due = now + Math.random() * (max - min + 1) + min;
    console.log('new due', due);
  }

  console.log('next due, due - now', convertDuration(due - now), due - now);
  console.log('lastInterval', convertDuration(lastInterval), lastInterval);

  return {
    card_id: cardId,
    level: newLevel,
    due: due,
    last_interval: lastInterval,
  };
};
const convertDuration = num => {
  const seconds = Math.floor(num / 1000);
  if (seconds < 60) {
    return `${seconds} sec${seconds > 1 ? 's' : ''}`;
  } else {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min${minutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      if (hours < 24) {
        return `${hours} hr${hours > 1 ? 's' : ''}`;
      } else {
        const days = Math.floor(hours / 24);
        if (days < 30) {
          return `${days} day${days > 1 ? 's' : ''}`;
        } else {
          const months = Math.floor(days / 30);
          if (months < 12) {
            return `${months} month${months > 1 ? 's' : ''}`;
          } else {
            const years = Math.floor(months / 12);
            return `${years} year${years > 1 ? 's' : ''}`;
          }
        }
      }
    }
  }
};
export { cardLevelUp, convertDuration };

import momentFactory, { config } from '../momentWrapper';

const momentPool = new Map();
export default function getPooledMoment(dayString) {
  if (!momentPool.has(dayString)) {
      momentPool.set(dayString, momentFactory().moment(dayString));
  }

  return momentPool.get(dayString);
}

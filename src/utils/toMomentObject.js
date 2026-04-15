import momentFactory from '../momentWrapper';

export default function toMomentObject(dateString, customFormat, momentConfig) {
  const date = momentFactory().moment(dateString, momentConfig.FullISOFormat, true);
  return date.isValid() ? date.hour(12) : null;
}

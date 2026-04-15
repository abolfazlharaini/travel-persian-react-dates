import moment from 'moment';
import { expect } from 'chai';

import toLocalizedDateString from '../../src/utils/toLocalizedDateString';
import { ISO_FORMAT } from '../../src/constants';
import { momentConfigDefault } from '../../src/momentWrapper';

describe('toLocalizedDateString', () => {
  it('returns null for falsy argument', () => {
    expect(toLocalizedDateString(undefined, undefined, momentConfigDefault)).to.equal(null);
  });

  it('converts moment object to localized date string', () => {
    const testDate = moment('1991-07-13');
    const dateString = toLocalizedDateString(testDate, undefined, momentConfigDefault);
    expect(dateString).to.equal(testDate.format('L'));
  });

  it('converts iso date string to localized date string', () => {
    const testDate = moment('1991-07-13');
    const dateString = toLocalizedDateString(testDate.format(ISO_FORMAT), undefined, momentConfigDefault);
    expect(dateString).to.equal(testDate.format('L'));
  });

  it('localized date strings stay the same', () => {
    const testDate = moment('1991-07-13');
    const dateString = toLocalizedDateString(testDate.format('L'), undefined, momentConfigDefault);
    expect(dateString).to.equal(testDate.format('L'));
  });

  it('converts custom format date strings with format passed in', () => {
    const testDate = moment('1991-07-13');
    const dateString = toLocalizedDateString(testDate.format('YYYY---DD/MM'), 'YYYY---DD/MM', momentConfigDefault);
    expect(dateString).to.equal(testDate.format('L'));
  });
});

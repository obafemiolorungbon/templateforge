import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns a healthy response', () => {
    expect(new HealthController().health()).toEqual({
      ok: true,
      service: 'templateforge-backend',
      mode: 'thin-facade',
    });
  });
});

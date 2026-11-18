// Sustituto de @nestjs/schedule SOLO para las pruebas unitarias (Jest).
// Igual que @nestjs/typeorm, se publica como ES Module. En las pruebas no
// se ejecutan tareas programadas: el decorador @Cron no hace nada.
export const Cron = (): MethodDecorator => () => undefined;

// Cualquier CronExpression.ALGO devuelve un texto válido.
export const CronExpression = new Proxy(
  {},
  {
    get: () => '0 * * * *',
  },
);

export const ScheduleModule = {
  forRoot: () => ({ module: class ScheduleRootMock {} }),
};

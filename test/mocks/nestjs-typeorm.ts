// Sustituto de @nestjs/typeorm SOLO para las pruebas unitarias (Jest).
// @nestjs/typeorm 12 se publica como ES Module y Jest (CommonJS) no puede
// cargarlo en Node 22. Las pruebas unitarias solo usan el token del
// repositorio y el decorador, así que basta con esta versión mínima.
import { Inject } from '@nestjs/common';

type EntityLike = { name: string };

export const getRepositoryToken = (entity: EntityLike): string =>
  `${entity.name}Repository`;

export const InjectRepository = (entity: EntityLike) =>
  Inject(getRepositoryToken(entity));

export const TypeOrmModule = {
  forFeature: () => ({ module: class TypeOrmFeatureMock {} }),
  forRoot: () => ({ module: class TypeOrmRootMock {} }),
  forRootAsync: () => ({ module: class TypeOrmRootAsyncMock {} }),
};

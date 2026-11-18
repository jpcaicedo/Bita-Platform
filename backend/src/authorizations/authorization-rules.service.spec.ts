import { WorkshopAuthorizationEntity } from './entities/workshop-authorization.entity';
import { AuthorizationRulesService } from './authorization-rules.service';

describe('AuthorizationRulesService', () => {
  const service = new AuthorizationRulesService();

  it('allows write when read is also true', () => {
    const result = service.ensureValidPermissions(true, true);

    expect(result).toBe(undefined);
  });

  it('allows read without write', () => {
    const result = service.ensureValidPermissions(true, false);

    expect(result).toBe(undefined);
  });

  it('allows a workshop that is not the owner', () => {
    const result = service.ensureWorkshopIsNotOwner('owner-1', 'workshop-1');

    expect(result).toBe(undefined);
  });

  it('allows revoking an active authorization', () => {
    const authorization = {
      status: 'active',
    } as WorkshopAuthorizationEntity;

    const result = service.ensureCanBeRevoked(authorization);

    expect(result).toBe(undefined);
  });
});

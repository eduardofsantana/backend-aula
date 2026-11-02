import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('returns the authenticated user data without exposing credentials', () => {
    const authService = {} as AuthService;
    const controller = new AuthController(authService);
    const user = { userId: 7, username: 'ana', role: 'ADMIN' };

    expect(controller.me({ user })).toEqual(user);
  });
});

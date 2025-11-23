import { Router, Request, Response, NextFunction } from 'express';
import { RegisterDto } from '../../application/dto/register.dto';
import { LoginDto } from '../../application/dto/login.dto';
import { RegisterUseCase } from '../../application/use-cases/register.usecase';
import { LoginUseCase } from '../../application/use-cases/login.usecase';
import { GetMeUseCase } from '../../application/use-cases/get-me.usecase';

export class AuthController {
  public readonly router: Router;

  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase
  ) {
    this.router = Router();
    this.router.post('/register', this.register);
    this.router.post('/login', this.login);
    this.router.get('/me', this.me);
  }

  private register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = new RegisterDto(req.body.email, req.body.password, req.body.name);
      const result = await this.registerUseCase.execute(dto);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  private login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = new LoginDto(req.body.email, req.body.password);
      const result = await this.loginUseCase.execute(dto);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  private me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.header('x-user-id');
      if (!userId) {
        res.status(400).json({ message: 'Missing user id header' });
        return;
      }
      const result = await this.getMeUseCase.execute(userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

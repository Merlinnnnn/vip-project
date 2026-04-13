import { Router, type Request, type Response, type NextFunction } from 'express';
import { Mediator } from '../../shared/mediator';
import { TokenStore } from '../../infrastructure/cache/token.store';
import {
  CreateSkillCommand,
  ListSkillsQuery,
  UpdateSkillCommand,
  DeleteSkillCommand
} from '../../application/handlers/skills.handler';

export class SkillController {
  public readonly router: Router;

  constructor(
    private readonly mediator: Mediator,
    private readonly tokenStore?: TokenStore
  ) {
    this.router = Router();
    this.router.get('/', this.getAll);
    this.router.post('/', this.create);
    this.router.put('/:id', this.update);
    this.router.delete('/:id', this.remove);
  }

  private getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      const skills = await this.mediator.query(new ListSkillsQuery(userId));
      res.json(skills);
    } catch (err) {
      next(err);
    }
  };

  private create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      const skill = await this.mediator.send(new CreateSkillCommand(userId, {
        name: req.body.name,
        targetMinutes: req.body.targetMinutes
      }));
      res.status(201).json(skill);
    } catch (err) {
      next(err);
    }
  };

  private update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      const skill = await this.mediator.send(new UpdateSkillCommand(userId, req.params.id, {
        name: req.body.name,
        targetMinutes: req.body.targetMinutes
      }));
      res.json(skill);
    } catch (err) {
      next(err);
    }
  };

  private remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      await this.mediator.send(new DeleteSkillCommand(userId, req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  private async getUserId(req: Request, res: Response): Promise<string | undefined> {
    const userId = req.header('x-user-id');
    if (userId) return userId;

    const bearer = req.header('authorization')?.replace(/^Bearer\s*/i, '').trim();
    if (bearer && this.tokenStore) {
      const resolved = await this.tokenStore.getUserIdByAccessToken(bearer);
      if (resolved) return resolved;
      res.status(401).json({ message: 'Invalid or expired bearer token' });
      return;
    }

    res.status(400).json({ message: 'Missing x-user-id or bearer token' });
    return;
  }
}

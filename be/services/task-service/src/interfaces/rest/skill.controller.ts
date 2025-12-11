import { Router, type Request, type Response, type NextFunction } from 'express';
import { CreateSkillUseCase } from '../../application/use-cases/create-skill.usecase';
import { ListSkillsUseCase } from '../../application/use-cases/list-skills.usecase';
import { UpdateSkillUseCase } from '../../application/use-cases/update-skill.usecase';
import { DeleteSkillUseCase } from '../../application/use-cases/delete-skill.usecase';
import { TokenStore } from '../../infrastructure/cache/token.store';

export class SkillController {
  public readonly router: Router;

  constructor(
    private readonly createSkill: CreateSkillUseCase,
    private readonly listSkills: ListSkillsUseCase,
    private readonly updateSkill: UpdateSkillUseCase,
    private readonly deleteSkill: DeleteSkillUseCase,
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
      const skills = await this.listSkills.execute(userId);
      res.json(skills);
    } catch (err) {
      next(err);
    }
  };

  private create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      const skill = await this.createSkill.execute(userId, {
        name: req.body.name,
        targetMinutes: req.body.targetMinutes
      });
      res.status(201).json(skill);
    } catch (err) {
      next(err);
    }
  };

  private update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      const skill = await this.updateSkill.execute(userId, req.params.id, {
        name: req.body.name,
        targetMinutes: req.body.targetMinutes
      });
      res.json(skill);
    } catch (err) {
      next(err);
    }
  };

  private remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.getUserId(req, res);
      if (!userId) return;
      await this.deleteSkill.execute(userId, req.params.id);
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

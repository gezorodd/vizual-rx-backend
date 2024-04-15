import type {VercelRequest, VercelResponse} from '@vercel/node';
import {sql} from "@vercel/postgres";
import {firstValueFrom, from, map, mergeMap, Observable, of} from "rxjs";

class ScriptController {

  private readonly idGenerator: IdGenerator;

  constructor() {
    this.idGenerator = new IdGenerator();
  }

  handle(req: VercelRequest, res: VercelResponse): Observable<VercelResponse> {
    switch (req.method) {
      case 'POST':
        return controller.createScript(req, res);
      case 'GET':
        return of(controller.getScript(req, res));
      default:
        return of(res.status(405)
          .send('405 - Method Not Allowed'));
    }
  }

  private createScript(req: VercelRequest, res: VercelResponse): Observable<VercelResponse> {
    // this.getNewScriptId()
    //   .pipe(
    //
    //   )

    const content = req.body;
    return of(res.json({
      id: '123456',
      content
    }));
  }

  private getScript(req: VercelRequest, res: VercelResponse): VercelResponse {
    const {scriptId} = req.query;
    return res.json({
      id: scriptId,
      content: 'test'
    });
  }

  private getNewScriptId(): Observable<string> {
    const generatedId = this.idGenerator.generateRandomId();
    let result$ =
      from(sql`SELECT id
               from scripts
               where id = ${generatedId}`);
    return result$
      .pipe(
        map(result => result.rows),
        mergeMap(rows => {
          const isCollision = rows.length > 0;
          if (isCollision) {
            return this.getNewScriptId();
          } else {
            return of(generatedId);
          }
        })
      );
  }
}

class IdGenerator {
  private readonly availableCharacters: string[];

  constructor() {
    this.availableCharacters = [];
    // digits
    for (let i = 48; i <= 57; i++) {
      this.availableCharacters.push(String.fromCharCode(i));
    }
    // uppercase letters
    for (let i = 65; i <= 90; i++) {
      this.availableCharacters.push(String.fromCharCode(i));
    }
    // lowercase letters
    for (let i = 97; i <= 122; i++) {
      this.availableCharacters.push(String.fromCharCode(i));
    }
  }

  generateRandomId(): string {
    let builder = '';
    for (let i = 0; i < 8; i++) {
      const index = Math.floor(Math.random() * this.availableCharacters.length);
      builder += this.availableCharacters[index];
    }
    return builder;
  }
}

const controller = new ScriptController();
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return await firstValueFrom(controller.handle(req, res));
}

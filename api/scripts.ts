import type {VercelRequest, VercelResponse} from '@vercel/node';
import {sql} from "@vercel/postgres";
import {firstValueFrom, from, map, mergeMap, Observable, of} from "rxjs";

class ScriptController {

  private readonly idGenerator: IdGenerator;
  private readonly corsWhitelist = [
    'http://localhost:4200',
    'https://vizual-rx.vercel.app/playground'
  ];

  constructor() {
    this.idGenerator = new IdGenerator();
  }

  handle(req: VercelRequest, res: VercelResponse): Observable<VercelResponse> {
    if (this.corsWhitelist.includes(req.headers.origin)) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }
    switch (req.method) {
      case 'POST':
        return controller.createScript(req, res);
      case 'GET':
        return controller.getScript(req, res);
      default:
        return of(res.status(405)
          .send('405 - Method Not Allowed'));
    }
  }

  private createScript(req: VercelRequest, res: VercelResponse): Observable<VercelResponse> {
    const content = req.body;
    return this.getNewScriptId()
      .pipe(
        mergeMap(id => {
          let query$ =
            sql`INSERT INTO script(id, content)
                VALUES (${id}, ${content})`;
          return from(query$)
            .pipe(
              map(() => {
                res.send(id);
                return res;
              })
            )
        })
      );
  }

  private getScript(req: VercelRequest, res: VercelResponse): Observable<VercelResponse> {
    const scriptId = req.query.scriptId as string;
    type Row = Pick<Script, 'content'>;
    let query$ =
      sql<Row>`SELECT content
               FROM script
               WHERE id = ${scriptId}`;
    return from(query$)
      .pipe(
        map(result => {
          const rows = result.rows;
          if (rows.length > 0) {
            const row = rows[0];
            const script: Script = {
              id: scriptId,
              content: row.content
            };
            res.json(script);
          } else {
            res.status(404)
              .send(`Script not found for id ${scriptId}`);
          }
          return res;
        })
      );
  }

  private getNewScriptId(): Observable<string> {
    const generatedId = this.idGenerator.generateRandomId();
    let query$ =
      from(sql`SELECT id
               from script
               where id = ${generatedId}`);
    return query$
      .pipe(
        mergeMap(result => {
          const isCollision = result.rowCount !== 0;
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

interface Script {
  id: string;
  content: string;
}

const controller = new ScriptController();
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return await firstValueFrom(controller.handle(req, res));
}

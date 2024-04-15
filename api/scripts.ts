import type {VercelRequest, VercelResponse} from '@vercel/node'

class ScriptController {
    createScript(req: VercelRequest, res: VercelResponse): VercelResponse {
        return res.send('123456');
    }

    getScript(req: VercelRequest, res: VercelResponse): VercelResponse {
        return res.json({
            id: '123456',
            content: 'test'
        });
    }
}

const controller = new ScriptController();

export default function handler(req: VercelRequest, res: VercelResponse) {
    switch (req.method) {
        case 'POST':
            return controller.createScript(req, res);
        case 'GET':
            return controller.getScript(req, res);
        default:
            return res.status(405)
                .send('Method Not Allowed');
    }
}

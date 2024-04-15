import type {VercelRequest, VercelResponse} from '@vercel/node'

class ScriptController {
    createScript(req: VercelRequest, res: VercelResponse): VercelResponse {
        const content = req.body;
        return res.json({
            id: '123456',
            content
        });
    }

    getScript(req: VercelRequest, res: VercelResponse): VercelResponse {
        const {scriptId} = req.query;
        return res.json({
            id: scriptId,
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
                .send('405 - Method Not Allowed');
    }
}

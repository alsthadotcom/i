import { generatePdf } from '../services/pdfService';
import type { IncomingMessage, ServerResponse } from 'http';

// Vercel serverless function entry point
export default async function (req: IncomingMessage & { body: { html: string } }, res: ServerResponse) {
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    // Buffered body parsing (needed for Vercel functions if not using a framework)
    let bodyData = '';

    // In many Vercel environments, req.body is already parsed if contentType is JSON.
    // However, if we're using raw Node types, we might need to handle it.
    // If we want to be safe:
    let htmlContent = (req as any).body?.html;

    if (!htmlContent) {
        // Fallback to manual parse if Vercel didn't parse it
        try {
            const buffers = [];
            for await (const chunk of req) {
                buffers.push(chunk);
            }
            const rawBody = Buffer.concat(buffers).toString();
            const parsed = JSON.parse(rawBody);
            htmlContent = parsed.html;
        } catch (e) {
            // ignore
        }
    }

    if (!htmlContent) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'HTML content is required' }));
        return;
    }

    try {
        const pdfBuffer = await generatePdf(htmlContent);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
        res.statusCode = 200;
        res.end(Buffer.from(pdfBuffer));
    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to generate PDF', details: error.message }));
    }
}

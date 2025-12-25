import puppeteer from 'puppeteer';

/**
 * Generates a PDF buffer from an HTML string using Puppeteer.
 * @param html The full HTML content of the report.
 * @returns A promise that resolves to a Buffer containing the PDF data.
 */
export async function generatePdf(html: string): Promise<Uint8Array> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
        const page = await browser.newPage();

        // Use setContent with waitUntil: 'networkidle0' to ensure charts and fonts are loaded
        await page.setContent(html, {
            waitUntil: 'networkidle0',
        });

        // Add a small delay just in case G2Plot needs extra time to stabilize
        await new Promise(r => setTimeout(r, 1000));

        // Generate PDF with high-fidelity settings
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px',
            },
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });

        return pdf;
    } finally {
        await browser.close();
    }
}
